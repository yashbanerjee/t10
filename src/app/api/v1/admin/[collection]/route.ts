import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { normalizeSiteSetting, redactSettingRow, redactSettingValue } from "@/lib/site-settings";
import { careerFromForm, careerRecordSchema } from "@/lib/career-record";
import { linksFromForm } from "@/lib/player-links";
import { personName, playerTextRules } from "@/lib/admin-validation";
import { getHomeTeam, getTeams, opponentIdentity, setHomeTeam } from "@/lib/teams";
import { getPointsTable } from "@/lib/data";
import { PARTNER_REQUEST_SUBJECT } from "@/lib/partner-brochure";

const permissions: Record<string, { read: string; write: string }> = {
  players: { read: "TEAM_READ", write: "TEAM_WRITE" }, staff: { read: "TEAM_READ", write: "TEAM_WRITE" }, teams: { read: "TEAM_READ", write: "TEAM_WRITE" }, matches: { read: "MATCH_READ", write: "MATCH_WRITE" },
  news: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, updates: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  contacts: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, partnerRequests: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, gallery: { read: "CONTENT_READ", write: "MEDIA_WRITE" },
  sponsors: { read: "CONTENT_READ", write: "SETTINGS_WRITE" }, records: { read: "STATS_READ", write: "STATS_WRITE" }, standings: { read: "STATS_READ", write: "STATS_WRITE" },
  products: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, polls: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  contests: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, orders: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
  settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" }, audit: { read: "AUDIT_READ", write: "AUDIT_READ" },
  franchises: { read: "CONTENT_READ", write: "CONTENT_WRITE" },
};
const assetUrl = z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional();
const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int().min(min).max(max)]).optional();
const playerInput = z.object({ fullName: personName(100), ...playerTextRules, slug: z.string().trim().max(120).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), profileImage: assetUrl, coverImage: assetUrl, bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), careerRecord: careerRecordSchema.nullable().optional() });
const articleInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), excerpt: z.string().trim().min(3).max(400), content: z.string().trim().min(3).max(50000), category: z.string().trim().min(2).max(50), authorName: z.string().trim().max(100).nullable().optional(), coverImage: assetUrl, seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional() });
const updateInput = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().trim().max(200).optional(), description: z.string().trim().min(3).max(500), content: z.string().trim().max(10000).nullable().optional(), category: z.enum(["TRAINING", "MATCH_DAY", "TEAM_NEWS", "PLAYER_NEWS", "ANNOUNCEMENT", "BEHIND_THE_SCENES", "MEDIA", "TRAVEL", "COMMUNITY"]), image: assetUrl, video: assetUrl, publishedAt: z.string().datetime(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() });
const optionalLabel = (max: number) => z.union([z.null(), z.literal(""), z.string().trim().max(max)]).optional();
const matchInput = z.object({ opponent: z.string().trim().min(2).max(120), date: z.string().datetime(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).default("UPCOMING"), competition: optionalLabel(120), matchNumber: optionalLabel(30), venueName: optionalLabel(140), result: optionalLabel(250) });
const sponsorInput = z.object({ name: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(60), logoUrl: assetUrl, website: z.union([z.string().trim().url().max(300), z.literal(""), z.null()]).optional(), displayOrder: optionalInt(0, 9999), isPublished: z.boolean().optional() });
const socialUrl = z.union([z.string().trim().url().max(500), z.literal(""), z.null()]).optional();
const franchiseInput = z.object({ name: z.string().trim().min(2).max(120), league: z.string().trim().min(2).max(120), logoUrl: assetUrl, facebook: socialUrl, instagram: socialUrl, x: socialUrl, youtube: socialUrl, displayOrder: optionalInt(0, 9999), isPublished: z.boolean().optional() });
const blankToNull = (value: string | null | undefined) => (value ? value : null);
const galleryInput = z.object({ title: z.string().trim().min(2).max(160), category: z.string().trim().min(2).max(60), mediaUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/), type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"), altText: z.string().trim().max(300).nullable().optional(), displayOrder: optionalInt(0, 9999), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() });
const recordInput = z.object({ title: z.string().trim().min(2).max(160), value: z.string().trim().min(1).max(40), category: z.string().trim().min(2).max(60), scope: z.string().trim().min(2).max(40), playerName: z.string().trim().max(120).nullable().optional(), seasonYear: optionalInt(1990, 2100) });
const tally = z.union([z.null(), z.literal(""), z.coerce.number().int().min(0).max(999)]).optional().transform((value) => (typeof value === "number" ? value : 0));
const standingInput = z.object({ teamName: z.string().trim().min(2).max(120), played: tally, won: tally, lost: tally, noResult: tally, points: tally, netRunRate: z.union([z.null(), z.literal(""), z.coerce.number().min(-99).max(99)]).optional().transform((value) => (typeof value === "number" ? Number(value.toFixed(3)) : 0)) });
const hexColour = z.union([z.null(), z.literal(""), z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #3A2D61")]).optional();
const teamInput = z.object({ name: z.string().trim().min(2).max(80), shortName: z.string().trim().min(1).max(8).transform((value) => value.toUpperCase()), slug: z.string().trim().max(120).nullable().optional(), logoUrl: assetUrl, primaryColor: hexColour, secondaryColor: hexColour, description: z.string().trim().max(500).nullable().optional(), isHome: z.boolean().optional() });
const variantInput = z.object({ color: z.string().trim().min(1).max(40), size: z.string().trim().min(1).max(24), stock: z.coerce.number().int().min(0).max(9999), price: z.union([z.null(), z.coerce.number().min(0).max(100000)]).optional(), image: assetUrl });
const productInput = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().max(140).optional(), description: z.string().trim().min(3).max(4000), price: z.coerce.number().positive().max(100000), image: assetUrl, category: z.enum(["JERSEY", "TRAINING", "CAP", "ACCESSORY"]), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional(), variants: z.array(variantInput).min(1).max(40) });
const pollInput = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), question: z.string().trim().min(3).max(240), description: z.string().trim().max(1000).nullable().optional(), closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional(), options: z.array(z.object({ label: z.string().trim().min(1).max(80) })).min(2).max(8) });
const contestInput = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), description: z.string().trim().min(3).max(4000), prize: z.string().trim().max(160).nullable().optional(), prompt: z.string().trim().min(3).max(240), image: assetUrl, closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional() });
const settingInput = z.object({ key: z.string().trim().min(2).max(100), value: z.unknown() });
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function list(collection: string) {
  if (collection === "teams") return getTeams();
  // One row per created team, in table order: the admin edits a team's figures rather than adding rows.
  if (collection === "standings") return (await getPointsTable()).map((row) => ({ ...row, id: row.entryId ?? `team:${row.teamId}`, source: row.manual ? "Entered" : "Calculated" }));
  const db = prisma as unknown as Record<string, { findMany(args?: unknown): Promise<unknown> }>;
  const args: Record<string, unknown> = {
    players: { orderBy: [{ displayOrder: "asc" }, { fullName: "asc" }] }, staff: { orderBy: [{ category: "asc" }, { displayOrder: "asc" }] },
    matches: { include: { season: true, venue: true }, orderBy: { date: "desc" } },
    news: { orderBy: { updatedAt: "desc" } }, updates: { orderBy: { publishedAt: "desc" } },
    contacts: { where: { subject: { not: PARTNER_REQUEST_SUBJECT } }, orderBy: { createdAt: "desc" } }, partnerRequests: { where: { subject: PARTNER_REQUEST_SUBJECT }, orderBy: { createdAt: "desc" } }, gallery: { orderBy: { createdAt: "desc" } },
    sponsors: { orderBy: { displayOrder: "asc" } }, franchises: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }, records: { orderBy: { createdAt: "desc" } },
    products: { include: { _count: { select: { variants: true } } }, orderBy: { createdAt: "desc" } },
    polls: { include: { _count: { select: { votes: true, options: true } } }, orderBy: { createdAt: "desc" } },
    contests: { include: { _count: { select: { entries: true } } }, orderBy: { createdAt: "desc" } },
    orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
    settings: { orderBy: { key: "asc" } }, audit: { include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 },
  };
  if (!(collection in args)) throw new Error("NOT_FOUND");
  const model = collection === "contacts" || collection === "partnerRequests" ? "contactSubmission" : collection === "updates" ? "teamUpdate" : collection === "news" ? "newsArticle" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "franchises" ? "franchise" : collection === "records" ? "teamRecord" : collection === "settings" ? "siteSetting" : collection === "audit" ? "auditLog" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : collection === "products" ? "product" : collection === "polls" ? "poll" : collection === "contests" ? "contest" : collection === "orders" ? "order" : "player";
  const rows = await db[model].findMany(args[collection]) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const count = row._count as { variants?: number; votes?: number; options?: number; entries?: number } | undefined;
    return { ...row, price: row.price != null ? Number(row.price) : row.price, total: row.total != null ? Number(row.total) : row.total, netRunRate: row.netRunRate != null ? Number(row.netRunRate) : row.netRunRate, variantCount: count?.variants, voteCount: count?.votes, optionCount: count?.options, entryCount: count?.entries };
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
      const incoming = body && typeof body === "object" && !Array.isArray(body) ? { ...body as Record<string, unknown> } : {};
      const career = careerFromForm(incoming); if (!career.ok) return failure(career.message, 400);
      const links = linksFromForm(incoming); if (!links.ok) return failure(links.message, 400);
      const parsed = playerInput.safeParse({ ...incoming, careerRecord: career.value }); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const team = await getHomeTeam(); if (!team) return failure("Create our team in the Teams section before adding players", 409);
      const { dateOfBirth, slug, displayOrder, careerRecord, ...playerFields } = parsed.data; result = await prisma.player.create({ data: { ...playerFields, careerRecord: careerRecord ?? undefined, socialLinks: links.value ?? undefined, dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00.000Z`) : null, displayOrder: displayOrder ?? 0, slug: slug ? slugify(slug) : slugify(parsed.data.fullName), teamId: team.id } });
    } else if (collection === "staff") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100), title: z.string().trim().min(2).max(100), category: z.enum(["COACHING", "SUPPORT", "MANAGEMENT"]), bio: z.string().trim().max(2500).nullable().optional(), profileImage: assetUrl, displayOrder: optionalInt(0, 9999), isActive: z.boolean().optional() }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const team = await getHomeTeam(); if (!team) return failure("Create our team in the Teams section before adding staff", 409);
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
      // The opponent comes from the Teams section and brings its short code and crest with it, so the app and the site show the same identity.
      const identity = await opponentIdentity(data.opponent); if (identity.isHome) return failure("Pick an opponent other than our own team", 400);
      result = await prisma.match.create({ data: { slug: slugify(`united-tigers-vs-${identity.name}-${new Date(data.date).toISOString().slice(0, 10)}`), opponent: identity.name, opponentShort: identity.shortName, opponentLogoUrl: identity.logo, date: new Date(data.date), status: data.status, competition: data.competition || null, matchNumber: data.matchNumber || null, result: data.result || null, venueId, seasonId: season.id, isDemo: false } });
    } else if (collection === "teams") {
      const parsed = teamInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const { isHome, slug, ...team } = parsed.data;
      const created = await prisma.team.create({ data: { ...team, slug: slugify(slug || team.name), primaryColor: team.primaryColor || null, secondaryColor: team.secondaryColor || null, description: team.description || null } });
      if (isHome) await setHomeTeam(created.id);
      result = { ...created, isHome: Boolean(isHome) };
    } else if (collection === "sponsors") {
      const parsed = sponsorInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data; result = await prisma.sponsor.create({ data: { ...data, website: data.website || null, displayOrder: data.displayOrder ?? 0 } });
    } else if (collection === "franchises") {
      const parsed = franchiseInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      result = await prisma.franchise.create({ data: { name: data.name, slug: slugify(data.name), league: data.league, logoUrl: data.logoUrl || null, facebook: blankToNull(data.facebook), instagram: blankToNull(data.instagram), x: blankToNull(data.x), youtube: blankToNull(data.youtube), displayOrder: data.displayOrder ?? 0, isPublished: data.isPublished ?? true } });
    } else if (collection === "gallery") {
      const parsed = galleryInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      result = await prisma.gallery.create({ data: { ...parsed.data, displayOrder: parsed.data.displayOrder ?? 0 } });
    } else if (collection === "records") {
      const parsed = recordInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      result = await prisma.teamRecord.create({ data: { ...parsed.data, seasonYear: parsed.data.seasonYear ?? null, isDemo: false } });
    } else if (collection === "standings") {
      const parsed = standingInput.safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const season = await prisma.season.findFirst({ where: { isCurrent: true } }); if (!season) return failure("Create a current season before editing the points table", 409);
      // One row per team and season: saving a team again simply replaces its figures.
      const { teamName, ...figures } = parsed.data; const name = (await opponentIdentity(teamName)).name;
      result = await prisma.pointsEntry.upsert({ where: { seasonId_teamName: { seasonId: season.id, teamName: name } }, create: { seasonId: season.id, teamName: name, ...figures, isDemo: false }, update: { ...figures, isDemo: false } });
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
      const existing = parsed.data.key === "storage" || parsed.data.key === "smtp" ? await prisma.siteSetting.findUnique({ where: { key: parsed.data.key } }) : null;
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

