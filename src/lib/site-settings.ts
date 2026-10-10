import { z } from "zod";
import { prisma } from "@/lib/db";
import { readBrochureUrl } from "@/lib/partner-brochure";

/** Settings that must never be sent to public pages. */
export const PRIVATE_SETTING_KEYS = new Set(["storage", "smtp", "stripe"]);

/** Settings whose saved secrets are kept when the admin form leaves them blank. */
export const SECRET_SETTING_KEYS = new Set(["storage", "smtp", "stripe"]);

const siteUrlSchema = z.string().trim().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "http:" || url.protocol === "https:";
});

const storageSchema = z.object({
  endpoint: z.string().trim().max(500).optional().default(""),
  bucket: z.string().trim().max(200).optional().default(""),
  accessKey: z.string().trim().max(300).optional().default(""),
  secretKey: z.string().trim().max(300).optional().default(""),
  region: z.string().trim().max(50).optional().default("auto"),
  publicUrl: z.string().trim().max(500).optional().default(""),
});

export async function getSiteUrl() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "siteUrl" } });
    if (typeof row?.value === "string" && siteUrlSchema.safeParse(row.value).success) return new URL(row.value).origin;
  } catch {
    /* database unavailable or the saved URL is not usable */
  }
  return "http://localhost:3000";
}

export async function getLivePollIntervalMs() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "livePollIntervalMs" } });
    const value = typeof row?.value === "number" ? row.value : Number(row?.value);
    if (Number.isFinite(value)) return Math.min(60_000, Math.max(5_000, Math.round(value)));
  } catch {
    /* database unavailable */
  }
  return 15_000;
}

export function normalizeSiteSetting(key: string, value: unknown, previous?: unknown): { ok: true; value: unknown } | { ok: false; message: string } {
  if (key === "siteUrl") {
    const parsed = siteUrlSchema.safeParse(value);
    if (!parsed.success) return { ok: false, message: "Site URL must be a full http or https address." };
    return { ok: true, value: new URL(parsed.data).origin };
  }
  if (key === "livePollIntervalMs") {
    const parsed = z.coerce.number().int().min(5000).max(60000).safeParse(value);
    if (!parsed.success) return { ok: false, message: "Live poll interval must be between 5000 and 60000 milliseconds." };
    return { ok: true, value: parsed.data };
  }
  if (key === "storage") {
    const parsed = storageSchema.safeParse(value ?? {});
    if (!parsed.success) return { ok: false, message: "Storage settings are invalid." };
    const endpoint = parsed.data.endpoint.replace(/\/$/, "");
    const publicUrl = parsed.data.publicUrl.replace(/\/$/, "");
    if (endpoint && !/^https?:\/\//.test(endpoint)) return { ok: false, message: "Storage endpoint must be an http or https URL." };
    if (publicUrl && !/^https?:\/\//.test(publicUrl)) return { ok: false, message: "Storage public URL must be an http or https URL." };
    const prior = previous && typeof previous === "object" && !Array.isArray(previous) ? previous as Record<string, unknown> : {};
    const clearing = !endpoint && !parsed.data.bucket && !parsed.data.accessKey && !parsed.data.secretKey && !publicUrl;
    return {
      ok: true,
      value: {
        endpoint,
        bucket: parsed.data.bucket,
        region: parsed.data.region || "auto",
        publicUrl,
        accessKey: parsed.data.accessKey || (clearing ? "" : typeof prior.accessKey === "string" ? prior.accessKey : ""),
        secretKey: parsed.data.secretKey || (clearing ? "" : typeof prior.secretKey === "string" ? prior.secretKey : ""),
      },
    };
  }
  if (key === "smtp") {
    const parsed = smtpSchema.safeParse(value ?? {});
    if (!parsed.success) return { ok: false, message: "Mail settings are invalid." };
    const email = z.string().email();
    if (parsed.data.fromEmail && !email.safeParse(parsed.data.fromEmail).success) return { ok: false, message: "From email must be a valid address." };
    const adminEmails = parsed.data.adminEmail.split(/[,;\s]+/).map((entry) => entry.trim()).filter(Boolean);
    if (adminEmails.some((entry) => !email.safeParse(entry).success)) return { ok: false, message: "Admin email must be one or more valid addresses, separated by commas." };
    parsed.data.adminEmail = [...new Set(adminEmails.map((entry) => entry.toLowerCase()))].join(", ");
    const prior = previous && typeof previous === "object" && !Array.isArray(previous) ? previous as Record<string, unknown> : {};
    const clearing = !parsed.data.host && !parsed.data.user && !parsed.data.password && !parsed.data.fromEmail && !parsed.data.adminEmail;
    return {
      ok: true,
      value: {
        host: parsed.data.host,
        port: parsed.data.port,
        secure: parsed.data.secure,
        user: parsed.data.user,
        fromEmail: parsed.data.fromEmail,
        fromName: parsed.data.fromName || "United Tigers",
        adminEmail: parsed.data.adminEmail,
        password: parsed.data.password || (clearing ? "" : typeof prior.password === "string" ? prior.password : ""),      },
    };
  }
  if (key === "stripe") {
    const parsed = stripeSchema.safeParse(value ?? {});
    if (!parsed.success) return { ok: false, message: "Stripe settings are invalid." };
    const prior = previous && typeof previous === "object" && !Array.isArray(previous) ? previous as Record<string, unknown> : {};
    const { publishableKey, secretKey, webhookSecret } = parsed.data;
    if (publishableKey && !/^pk_(test|live)_/.test(publishableKey)) return { ok: false, message: "Stripe publishable key must start with pk_test_ or pk_live_." };
    if (secretKey && !/^(sk|rk)_(test|live)_/.test(secretKey)) return { ok: false, message: "Stripe secret key must start with sk_test_, sk_live_, rk_test_ or rk_live_." };
    if (webhookSecret && !webhookSecret.startsWith("whsec_")) return { ok: false, message: "Stripe webhook signing secret must start with whsec_." };
    const savedSecret = parsed.data.removeKeys ? "" : secretKey || (typeof prior.secretKey === "string" ? prior.secretKey : "");
    const savedWebhook = parsed.data.removeKeys ? "" : webhookSecret || (typeof prior.webhookSecret === "string" ? prior.webhookSecret : "");
    const savedPublishable = parsed.data.removeKeys ? "" : publishableKey;
    if (parsed.data.enabled && (!savedSecret || !savedPublishable)) return { ok: false, message: "Add the Stripe publishable and secret keys before turning on online payments." };
    if (savedSecret && savedPublishable && savedSecret.split("_")[1] !== savedPublishable.split("_")[1]) return { ok: false, message: "Stripe keys must both be test keys or both be live keys." };
    return { ok: true, value: { enabled: parsed.data.enabled, publishableKey: savedPublishable, secretKey: savedSecret, webhookSecret: savedWebhook, currency: parsed.data.currency.toLowerCase() } };
  }
  if (key === "partnerBrochure") {
    if (value != null && typeof value !== "string") return { ok: false, message: "Partner brochure must be a site path or an http(s) URL." };
    const url = readBrochureUrl(value);
    if (typeof value === "string" && value.trim() && !url) return { ok: false, message: "Partner brochure must be a site path or an http(s) URL." };
    return { ok: true, value: url };
  }
  if (key === "homepage") {
    const parsed = homepageSchema.safeParse(value ?? {});
    if (!parsed.success) return { ok: false, message: "Homepage banner settings are invalid." };
    const image = safeAsset(parsed.data.image);
    if (parsed.data.image.trim() && !image) return { ok: false, message: "Banner image must be a site path or an http(s) URL." };
    const href = parsed.data.ctaHref.trim() || "/team";
    if (!href.startsWith("/") && !/^https?:\/\//.test(href)) return { ok: false, message: "Banner button link must start with / or be an http(s) URL." };
    return { ok: true, value: { ...parsed.data, image, ctaHref: href, players: uniquePlayers(parsed.data.players), mode: parsed.data.mode === "image" && image ? "image" : parsed.data.mode === "image" ? "static" : parsed.data.mode } };
  }
  return { ok: true, value };
}

export const FEATURED_PLAYER_LIMIT = 5;

const homepageSchema = z.object({
  mode: z.enum(["static", "image"]).default("static"),
  title: z.string().trim().min(2).max(80),
  accent: z.string().trim().min(2).max(40),
  tagline: z.string().trim().min(2).max(80),
  ctaLabel: z.string().trim().min(2).max(40),
  ctaHref: z.string().trim().max(300).default("/team"),
  image: z.string().trim().max(500).default(""),
  roar: z.string().trim().max(40).default("LET’S GO HUNT"),
  /** Show the featured-player strip beside the headline. */
  showPlayers: z.boolean().default(true),
  /** Player ids chosen for the strip, in squad order. Empty means the first five players with a photo. */
  players: z.array(z.string().trim().min(1).max(120)).max(FEATURED_PLAYER_LIMIT).default([]),
});

export type HomepageBanner = z.infer<typeof homepageSchema>;

export const homepageDefaults: HomepageBanner = {
  mode: "static",
  title: "THE NEXT GAME",
  accent: "STARTS HERE",
  tagline: "BIGGER BOLDER TOGETHER",
  ctaLabel: "BACK OUR TIGERS",
  ctaHref: "/team",
  image: "",
  roar: "LET’S GO HUNT",
  showPlayers: true,
  players: [],
};

function uniquePlayers(ids: string[]) {
  return [...new Set(ids)].slice(0, FEATURED_PLAYER_LIMIT);
}

/** Players shown in the homepage hero strip: the admin's picks, or the first five with a photo when nothing is picked. */
export function featuredPlayers<T extends { id: string; profileImage: string | null }>(players: T[], banner: Pick<HomepageBanner, "showPlayers" | "players">) {
  if (!banner.showPlayers) return [];
  const withPhoto = players.filter((player) => player.profileImage);
  const picked = withPhoto.filter((player) => banner.players.includes(player.id));
  return (picked.length ? picked : withPhoto).slice(0, FEATURED_PLAYER_LIMIT);
}

function safeAsset(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /["'()\\\s]/.test(trimmed)) return "";
  if (trimmed.startsWith("/") || /^https?:\/\//.test(trimmed)) return trimmed;
  return "";
}

export function readHomepageBanner(value: unknown): HomepageBanner {
  const parsed = homepageSchema.safeParse(value ?? {});
  if (!parsed.success) return homepageDefaults;
  const image = safeAsset(parsed.data.image);
  return { ...homepageDefaults, ...parsed.data, image, players: uniquePlayers(parsed.data.players), mode: parsed.data.mode === "image" && image ? "image" : "static" };
}

const smtpSchema = z.object({
  host: z.string().trim().max(200).optional().default(""),
  port: z.coerce.number().int().min(1).max(65535).optional().default(587),
  secure: z.boolean().optional().default(false),
  user: z.string().trim().max(200).optional().default(""),
  password: z.string().max(300).optional().default(""),
  fromEmail: z.string().trim().max(200).optional().default(""),
  fromName: z.string().trim().max(80).optional().default("United Tigers"),
  adminEmail: z.string().trim().max(600).optional().default(""),});

export type SmtpSettings = z.infer<typeof smtpSchema>;

const stripeSchema = z.object({
  enabled: z.boolean().optional().default(false),
  publishableKey: z.string().trim().max(300).optional().default(""),
  secretKey: z.string().trim().max(300).optional().default(""),
  webhookSecret: z.string().trim().max(300).optional().default(""),
  currency: z.string().trim().regex(/^[a-zA-Z]{3}$/).optional().default("aed"),
  removeKeys: z.boolean().optional().default(false),
});

export function redactSettingValue(key: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  if (key === "storage") {
    const { accessKey, secretKey, ...rest } = source;
    return { ...rest, hasAccessKey: Boolean(accessKey), hasSecretKey: Boolean(secretKey) };
  }
  if (key === "smtp") {
    const { password, ...rest } = source;
    return { ...rest, hasPassword: Boolean(password) };
  }
  if (key === "stripe") {
    const { secretKey, webhookSecret, ...rest } = source;
    return { ...rest, hasSecretKey: Boolean(secretKey), hasWebhookSecret: Boolean(webhookSecret), mode: typeof secretKey === "string" && secretKey.includes("_live_") ? "live" : secretKey ? "test" : "" };
  }
  // The admin form shows exactly what the homepage renders, so saving never changes copy by surprise.
  if (key === "homepage") return readHomepageBanner(value);
  return value;
}

export function redactSettingRow<T>(row: T): T {
  if (!row || typeof row !== "object" || !("key" in row) || !("value" in row)) return row;
  const record = row as T & { key: unknown; value: unknown };
  if (typeof record.key !== "string") return row;
  return { ...record, value: redactSettingValue(record.key, record.value) };
}
