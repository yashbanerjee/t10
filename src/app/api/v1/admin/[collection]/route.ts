import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { normalizeSiteSetting, redactSettingRow, redactSettingValue } from "@/lib/site-settings";

const permissions: Record<string, { read: string; write: string }> = {
  players: { read: "TEAM_READ", write: "TEAM_WRITE" }, staff: { read: "TEAM_READ", write: "TEAM_WRITE" }, matches: { read: "MATCH_READ", write: "MATCH_WRITE" },
  news: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, updates: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  contacts: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, gallery: { read: "CONTENT_READ", write: "MEDIA_WRITE" },
  sponsors: { read: "CONTENT_READ", write: "SETTINGS_WRITE" }, records: { read: "STATS_READ", write: "STATS_WRITE" },
  products: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, polls: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  contests: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, orders: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" }, audit: { read: "AUDIT_READ", write: "AUDIT_READ" },
};
const assetUrl = z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional();
const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int().min(min).max(max)]).optional();
const playerInput = z.object({ fullName: z.string().trim().min(2).max(100), displayName: z.string().trim().max(80).nullable().optional(), shortName: z.string().trim().max(40).nullable().optional(), slug: z.string().trim().max(120).nullable().optional(), country: z.string().trim().max(80).nullable().optional(), nationality: z.string().trim().max(80).nullable().optional(), dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), battingStyle: z.string().trim().max(80).nullable().optional(), bowlingStyle: z.string().trim().max(80).nullable().optional(), heightCm: optionalInt(100, 250), jerseyNumber: optionalInt(0, 999), profileImage: assetUrl, coverImage: assetUrl, bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), displayOrder: optionalInt(0, 9999) });
const articleInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), excerpt: z.string().trim().min(3).max(400), content: z.string().trim().min(3).max(50000), category: z.string().trim().min(2).max(50), authorName: z.string().trim().max(100).optional(), coverImage: z.string().url().nullable().optional(), seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional() });
const updateInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), description: z.string().trim().min(3).max(500), content: z.string().trim().max(10000).nullable().optional(), category: z.enum(["TRAINING", "MATCH_DAY", "TEAM_NEWS", "PLAYER_NEWS", "ANNOUNCEMENT", "BEHIND_THE_SCENES", "MEDIA", "TRAVEL", "COMMUNITY"]), image: z.string().url().nullable().optional(), video: z.string().url().nullable().optional(), publishedAt: z.string().datetime(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() });
const matchInput = z.object({ opponent: z.string().trim().min(2).max(120), date: z.string().datetime(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).default("UPCOMING"), competition: z.string().trim().max(120).optional(), matchNumber: z.string().trim().max(30).optional(), venueName: z.string().trim().max(140).optional(), result: z.string().trim().max(250).optional() });
const sponsorInput = z.object({ name: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(60), logoUrl: assetUrl, website: z.union([z.string().trim().url().max(300), z.literal(""), z.null()]).optional(), displayOrder: optionalInt(0, 9999), isPublished: z.boolean().optional() });
const galleryInput = z.object({ title: z.string().trim().min(2).max(160), category: z.string().trim().min(2).max(60), mediaUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/), type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"), altText: z.string().trim().max(300).nullable().optional(), displayOrder: optionalInt(0, 9999), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() });
const recordInput = z.object({ title: z.string().trim().min(2).max(160), value: z.string().trim().min(1).max(40), category: z.string().trim().min(2).max(60), scope: z.string().trim().min(2).max(40), playerName: z.string().trim().max(120).nullable().optional(), seasonYear: optionalInt(1990, 2100) });
const variantInput = z.object({ color: z.string().trim().min(1).max(40), size: z.string().trim().min(1).max(24), stock: z.coerce.number().int().min(0).max(9999), price: z.union([z.null(), z.coerce.number().min(0).max(100000)]).optional(), image: assetUrl });
const productInput = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().max(140).optional(), description: z.string().trim().min(3).max(4000), price: z.coerce.number().positive().max(100000), image: assetUrl, category: z.enum(["JERSEY", "TRAINING", "CAP", "ACCESSORY"]), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional(), variants: z.array(variantInput).min(1).max(40) });
const pollInput = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), question: z.string().trim().min(3).max(240), description: z.string().trim().max(1000).nullable().optional(), closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional(), options: z.array(z.object({ label: z.string().trim().min(1).max(80) })).min(2).max(8) });
const contestInput = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), description: z.string().trim().min(3).max(4000), prize: z.string().trim().max(160).nullable().optional(), prompt: z.string().trim().min(3).max(240), image: assetUrl, closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional() });
const settingInput = z.object({ key: z.string().trim().min(2).max(100), value: z.unknown() });
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function list(collection: string) {
  const db = prisma as unknown as Record<string, { findMany(args?: unknown): Promise<unknown> }>;
  const args: Record<string, unknown> = {
    players: { orderBy: [{ displayOrder: "asc" }, { fullName: "asc" }] }, staff: { orderBy: [{ category: "asc" }, { displayOrder: "asc" }] },
    matches: { include: { season: true, venue: true }, orderBy: { date: "desc" } },
    news: { orderBy: { updatedAt: "desc" } }, updates: { orderBy: { publishedAt: "desc" } },
    contacts: { orderBy: { createdAt: "desc" } }, gallery: { orderBy: { createdAt: "desc" } },
    sponsors: { orderBy: { displayOrder: "asc" } }, records: { orderBy: { createdAt: "desc" } },
    products: { include: { _count: { select: { variants: true } } }, orderBy: { createdAt: "desc" } },
    polls: { include: { _count: { select: { votes: true, options: true } } }, orderBy: { createdAt: "desc" } },
    contests: { include: { _count: { select: { entries: true } } }, orderBy: { createdAt: "desc" } },
    orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
    settings: { orderBy: { key: "asc" } }, audit: { include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 },
  };
  if (!(collection in args)) throw new Error("NOT_FOUND");
  const model = collection === "contacts" ? "contactSubmission" : collection === "updates" ? "teamUpdate" : collection === "news" ? "newsArticle" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "records" ? "teamRecord" : collection === "settings" ? "siteSetting" : collection === "audit" ? "auditLog" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : collection === "products" ? "product" : collection === "polls" ? "poll" : collection === "contests" ? "contest" : collection === "orders" ? "order" : "player";
  const rows = await db[model].findMany(args[collection]) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const count = row._count as { variants?: number; votes?: number; options?: number; entries?: number } | undefined;
    return { ...row, price: row.price != null ? Number(row.price) : row.price, total: row.total != null ? Number(row.total) : row.total, variantCount: count?.variants, voteCount: count?.votes, optionCount: count?.options, entryCount: count?.entries };
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params; const access = permissions[collection]; const session = await getSession();
  if (!access) return failure("Collection not found", 404);
  if (!session || !hasPermission(session.role, access.read)) return failure("You do not have permission to view this collection", 403);
  try {
    const data = await list(collection);
    if (collection === "settings" && Array.isArray(data)) return success(data.map((row) => redactSettingRow(row)));
    return success(data);
  }
  catch { return success(collection === "players" ? [] : [], "Database is not connected; configure PostgreSQL to load CMS records"); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params; const access = permissions[collection]; const session = await getSession();
  if (!access) return failure("Collection not found", 404);
  if (!session || !hasPermission(session.role, access.write)) return failure("You do not have permission to edit this collection", 403);
  const body = await request.json().catch(() => null);
  let auditBody: unknown = body;
  try {
    let result: unknown;
    if (collection === "players") {
      const parsed = playerInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const team = await prisma.team.findUnique({ where: { slug: "united-tigers" } }); if (!team) return failure("Run the database seed before adding players", 409);
      const { dateOfBirth, slug, displayOrder, ...playerFields } = parsed.data; result = await prisma.player.create({ data: { ...playerFields, dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00.000Z`) : null, displayOrder: displayOrder ?? 0, slug: slug ? slugify(slug) : slugify(parsed.data.fullName), teamId: team.id } });
    } else if (collection === "staff") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100), title: z.string().trim().min(2).max(100), category: z.enum(["COACHING", "SUPPORT", "MANAGEMENT"]), bio: z.string().trim().max(2500).nullable().optional(), profileImage: assetUrl, displayOrder: optionalInt(0, 9999), isActive: z.boolean().optional() }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const team = await prisma.team.findUnique({ where: { slug: "united-tigers" } }); if (!team) return failure("Run the database seed before adding staff", 409);
      result = await prisma.staffMember.create({ data: { ...parsed.data, displayOrder: parsed.data.displayOrder ?? 0, teamId: team.id } });
    } else if (collection === "news") {
      const parsed = articleInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data; result = await prisma.newsArticle.create({ data: { ...data, slug: data.slug ? slugify(data.slug) : slugify(data.title), publishedAt: data.publishedAt ? new Date(data.publishedAt) : data.status === "PUBLISHED" ? new Date() : null, isDemo: false } });
    } else if (collection === "updates") {
      const parsed = updateInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data; result = await prisma.teamUpdate.create({ data: { ...data, slug: data.slug ? slugify(data.slug) : slugify(data.title), publishedAt: new Date(data.publishedAt), isDemo: false } });
    } else if (collection === "matches") {
      const parsed = matchInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data; const season = await prisma.season.findFirst({ where: { isCurrent: true } }); if (!season) return failure("Create a current season before adding matches", 409);
      let venueId: string | undefined; if (data.venueName) { const existingVenue = await prisma.venue.findFirst({ where: { name: data.venueName } }); venueId = existingVenue?.id ?? (await prisma.venue.create({ data: { name: data.venueName } })).id; }
      result = await prisma.match.create({ data: { slug: slugify(`united-tigers-vs-${data.opponent}-${new Date(data.date).toISOString().slice(0, 10)}`), opponent: data.opponent, date: new Date(data.date), status: data.status, competition: data.competition, matchNumber: data.matchNumber, result: data.result, venueId, seasonId: season.id, isDemo: false } });
    } else if (collection === "sponsors") {
      const parsed = sponsorInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data; result = await prisma.sponsor.create({ data: { ...data, website: data.website || null, displayOrder: data.displayOrder ?? 0 } });
    } else if (collection === "gallery") {
      const parsed = galleryInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      result = await prisma.gallery.create({ data: { ...parsed.data, displayOrder: parsed.data.displayOrder ?? 0 } });
    } else if (collection === "records") {
      const parsed = recordInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      result = await prisma.teamRecord.create({ data: { ...parsed.data, seasonYear: parsed.data.seasonYear ?? null, isDemo: false } });
    } else if (collection === "products") {
      const parsed = productInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      result = await prisma.product.create({ data: { name: data.name, slug: slugify(data.slug || data.name), description: data.description, price: data.price, image: data.image || null, category: data.category, isFeatured: data.isFeatured ?? false, isPublished: data.isPublished ?? true, variants: { create: data.variants.map((variant) => ({ color: variant.color, size: variant.size, stock: variant.stock, price: variant.price ?? null, image: variant.image || null })) } } });
    } else if (collection === "polls") {
      const parsed = pollInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      result = await prisma.poll.create({ data: { title: data.title, slug: slugify(data.slug || data.title), question: data.question, description: data.description || null, closesAt: data.closesAt ? new Date(data.closesAt) : null, isPublished: data.isPublished ?? true, options: { create: data.options.map((option, index) => ({ label: option.label, displayOrder: index })) } } });
    } else if (collection === "contests") {
      const parsed = contestInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      result = await prisma.contest.create({ data: { title: data.title, slug: slugify(data.slug || data.title), description: data.description, prize: data.prize || null, prompt: data.prompt, image: data.image || null, closesAt: data.closesAt ? new Date(data.closesAt) : null, isPublished: data.isPublished ?? true } });
    } else if (collection === "settings") {
      const parsed = settingInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const existing = parsed.data.key === "storage" ? await prisma.siteSetting.findUnique({ where: { key: "storage" } }) : null;
      const normalized = normalizeSiteSetting(parsed.data.key, parsed.data.value, existing?.value);
      if (!normalized.ok) return failure(normalized.message, 400);
      result = await prisma.siteSetting.upsert({ where: { key: parsed.data.key }, create: { key: parsed.data.key, value: normalized.value as never }, update: { value: normalized.value as never } });
      auditBody = { key: parsed.data.key, value: redactSettingValue(parsed.data.key, normalized.value) };
    } else return failure("This collection is read-only", 405);
    const entityId = result && typeof result === "object" && "id" in result ? String(result.id) : undefined;
    await recordAudit(session.sub, "CREATE", collection, entityId, undefined, auditBody, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(result, "Created", { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("A record with this name or slug already exists", 409);
    return failure("The record could not be saved. Check the database connection and required fields.", 503);
  }
}

