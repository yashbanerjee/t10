import { z } from "zod";
import { prisma } from "@/lib/db";

/** Settings that must never be sent to public pages. */
export const PRIVATE_SETTING_KEYS = new Set(["storage"]);

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
  if (key === "homepage") {
    const parsed = homepageSchema.safeParse(value ?? {});
    if (!parsed.success) return { ok: false, message: "Homepage banner settings are invalid." };
    const image = safeAsset(parsed.data.image);
    if (parsed.data.image.trim() && !image) return { ok: false, message: "Banner image must be a site path or an http(s) URL." };
    const href = parsed.data.ctaHref.trim() || "/team";
    if (!href.startsWith("/") && !/^https?:\/\//.test(href)) return { ok: false, message: "Banner button link must start with / or be an http(s) URL." };
    return { ok: true, value: { ...parsed.data, image, ctaHref: href, mode: parsed.data.mode === "image" && image ? "image" : parsed.data.mode === "image" ? "static" : parsed.data.mode } };
  }
  return { ok: true, value };
}

const homepageSchema = z.object({
  mode: z.enum(["static", "image"]).default("static"),
  title: z.string().trim().min(2).max(80),
  accent: z.string().trim().min(2).max(40),
  tagline: z.string().trim().min(2).max(80),
  ctaLabel: z.string().trim().min(2).max(40),
  ctaHref: z.string().trim().max(300).default("/team"),
  image: z.string().trim().max(500).default(""),
  roar: z.string().trim().max(40).default("UNITED TIGERS"),
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
  roar: "UNITED TIGERS",
};

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
  return { ...homepageDefaults, ...parsed.data, image, mode: parsed.data.mode === "image" && image ? "image" : "static" };
}

export function redactSettingValue(key: string, value: unknown) {
  if (key !== "storage" || !value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  const { accessKey, secretKey, ...rest } = source;
  return { ...rest, hasAccessKey: Boolean(accessKey), hasSecretKey: Boolean(secretKey) };
}

export function redactSettingRow<T>(row: T): T {
  if (!row || typeof row !== "object" || !("key" in row) || !("value" in row)) return row;
  const record = row as T & { key: unknown; value: unknown };
  if (typeof record.key !== "string") return row;
  return { ...record, value: redactSettingValue(record.key, record.value) };
}
