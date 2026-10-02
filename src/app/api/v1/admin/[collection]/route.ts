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
  settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" }, audit: { read: "AUDIT_READ", write: "AUDIT_READ" },
};
const assetUrl = z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional();
const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int().min(min).max(max)]).optional();
const playerInput = z.object({ fullName: z.string().trim().min(2).max(100), displayName: z.string().trim().max(80).nullable().optional(), shortName: z.string().trim().max(40).nullable().optional(), slug: z.string().trim().max(120).nullable().optional(), country: z.string().trim().max(80).nullable().optional(), nationality: z.string().trim().max(80).nullable().optional(), dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), battingStyle: z.string().trim().max(80).nullable().optional(), bowlingStyle: z.string().trim().max(80).nullable().optional(), heightCm: optionalInt(100, 250), jerseyNumber: optionalInt(0, 999), profileImage: assetUrl, coverImage: assetUrl, bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), displayOrder: optionalInt(0, 9999) });
const articleInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), excerpt: z.string().trim().min(3).max(400), content: z.string().trim().min(3).max(50000), category: z.string().trim().min(2).max(50), authorName: z.string().trim().max(100).optional(), coverImage: z.string().url().nullable().optional(), seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional() });
const updateInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), description: z.string().trim().min(3).max(500), content: z.string().trim().max(10000).nullable().optional(), category: z.enum(["TRAINING", "MATCH_DAY", "TEAM_NEWS", "PLAYER_NEWS", "ANNOUNCEMENT", "BEHIND_THE_SCENES", "MEDIA", "TRAVEL", "COMMUNITY"]), image: z.string().url().nullable().optional(), video: z.string().url().nullable().optional(), publishedAt: z.string().datetime(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() });
const matchInput = z.object({ opponent: z.string().trim().min(2).max(120), date: z.string().datetime(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).default("UPCOMING"), competition: z.string().trim().max(120).optional(), matchNumber: z.string().trim().max(30).optional(), venueName: z.string().trim().max(140).optional(), result: z.string().trim().max(250).optional() });
const sponsorInput = z.object({ name: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(60), logoUrl: z.string().url().nullable().optional(), website: z.string().url().nullable().optional(), displayOrder: z.coerce.number().int().min(0).optional(), isPublished: z.boolean().optional() });
const galleryInput = z.object({ title: z.string().trim().min(2).max(160), category: z.string().trim().min(2).max(60), mediaUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/), type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"), altText: z.string().trim().max(300).optional(), displayOrder: z.coerce.number().int().min(0).optional(), isPublished: z.boolean().optional() });
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
    settings: { orderBy: { key: "asc" } }, audit: { include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 },
  };
  if (!(collection in args)) throw new Error("NOT_FOUND");
  return db[collection === "contacts" ? "contactSubmission" : collection === "updates" ? "teamUpdate" : collection === "news" ? "newsArticle" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "records" ? "teamRecord" : collection === "settings" ? "siteSetting" : collection === "audit" ? "auditLog" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : "player"].findMany(args[collection]);
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
      const parsed = sponsorInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); result = await prisma.sponsor.create({ data: parsed.data });
    } else if (collection === "gallery") {
      const parsed = galleryInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); result = await prisma.gallery.create({ data: parsed.data });
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

