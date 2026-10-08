import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { redactSettingRow } from "@/lib/site-settings";
import { careerFromForm, careerRecordSchema } from "@/lib/career-record";
import { linksFromForm } from "@/lib/player-links";
import { personName, playerTextRules } from "@/lib/admin-validation";
import { getHomeTeamId, getTeams, HOME_TEAM_SETTING, opponentIdentity, setHomeTeam } from "@/lib/teams";
import { getPointsTable } from "@/lib/data";
import { z } from "zod";

const grants: Record<string, { read: string; write: string }> = { players: { read: "TEAM_READ", write: "TEAM_WRITE" }, staff: { read: "TEAM_READ", write: "TEAM_WRITE" }, teams: { read: "TEAM_READ", write: "TEAM_WRITE" }, matches: { read: "MATCH_READ", write: "MATCH_WRITE" }, news: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, updates: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, contacts: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, gallery: { read: "CONTENT_READ", write: "MEDIA_WRITE" }, sponsors: { read: "CONTENT_READ", write: "SETTINGS_WRITE" }, records: { read: "STATS_READ", write: "STATS_WRITE" }, standings: { read: "STATS_READ", write: "STATS_WRITE" }, settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" }, products: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, polls: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, contests: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, orders: { read: "CONTENT_READ", write: "CONTENT_WRITE" } };
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int().min(min).max(max)]).optional();
const managedSettingKeys = new Set(["siteUrl", "livePollIntervalMs", "storage", "homepage", "smtp", HOME_TEAM_SETTING]);
const hexColour = z.union([z.null(), z.literal(""), z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #3A2D61")]).optional();

/** Points-table rows for teams without entered figures use a `team:<id>` id; saving one creates the entry. */
async function standingRow(id: string) {
  const row = (await getPointsTable()).find((entry) => (entry.entryId ?? `team:${entry.teamId}`) === id);
  return row ? { ...row, id, source: row.manual ? "Entered" : "Calculated" } : null;
}

async function getRecord(collection: string, id: string): Promise<unknown> {
  if (collection === "matches") {
    const match = await prisma.match.findUnique({ where: { id }, include: { venue: true } });
    return match ? { ...match, venueName: match.venue?.name ?? null } : null;
  }
  if (collection === "products") return prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } } });
  if (collection === "polls") return prisma.poll.findUnique({ where: { id }, include: { options: { orderBy: { displayOrder: "asc" } } } });
  if (collection === "contests") return prisma.contest.findUnique({ where: { id }, include: { entries: { orderBy: { createdAt: "desc" } } } });
  if (collection === "orders") return prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (collection === "standings") return standingRow(id);
  if (collection === "teams") return (await getTeams()).find((team) => team.id === id) ?? null;
  const model = collection === "contacts" ? prisma.contactSubmission : collection === "news" ? prisma.newsArticle : collection === "updates" ? prisma.teamUpdate : collection === "gallery" ? prisma.gallery : collection === "sponsors" ? prisma.sponsor : collection === "records" ? prisma.teamRecord : collection === "settings" ? prisma.siteSetting : collection === "staff" ? prisma.staffMember : collection === "players" ? prisma.player : null;
  if (!model) return null;
  return (model as unknown as { findUnique(args: { where: { id: string } }): Promise<unknown> }).findUnique({ where: { id } });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params; const grant = grants[collection]; const session = await getSession();
  if (!grant) return failure("Collection not found", 404);
  if (!session || !hasPermission(session.role, grant.read)) return failure("You do not have permission to view this record", 403);
  const record = await getRecord(collection, id);
  if (!record) return failure("Record not found", 404);
  if (collection === "settings") return success(redactSettingRow(record));
  return success(record);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params; const grant = grants[collection]; const session = await getSession();
  if (!grant) return failure("Collection not found", 404);
  if (!session || !hasPermission(session.role, grant.write)) return failure("You do not have permission to edit this record", 403);
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return failure("Validation failed", 400);
  let body: Record<string, unknown> = raw as Record<string, unknown>;
  const original = await getRecord(collection, id);
  if (!original) return failure("Record not found", 404);
  try {
    const modelName = collection === "contacts" ? "contactSubmission" : collection === "news" ? "newsArticle" : collection === "updates" ? "teamUpdate" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "records" ? "teamRecord" : collection === "standings" ? "pointsEntry" : collection === "settings" ? "siteSetting" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : collection === "teams" ? "team" : collection === "products" ? "product" : collection === "polls" ? "poll" : collection === "contests" ? "contest" : collection === "orders" ? "order" : "player";
    const model = (prisma as unknown as Record<string, { update(args: unknown): Promise<unknown> }>)[modelName];
    if (collection === "teams") {
      const parsed = z.object({ name: z.string().trim().min(2).max(80).optional(), shortName: z.string().trim().min(1).max(8).transform((value) => value.toUpperCase()).optional(), slug: z.string().trim().max(120).nullable().optional(), logoUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), primaryColor: hexColour, secondaryColor: hexColour, description: z.string().trim().max(500).nullable().optional(), isHome: z.boolean().optional() }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const { isHome, slug, ...team } = parsed.data;
      body = { ...team, ...(typeof slug === "string" && slug.trim() ? { slug: slugify(slug) } : {}) };
      if (body.primaryColor === "") body.primaryColor = null; if (body.secondaryColor === "") body.secondaryColor = null;
      // Ticking "our team" moves the club identity here; unticking is ignored because exactly one team is always ours.
      if (isHome) await setHomeTeam(id);
    } else if (collection === "contacts") {
      const parsed = z.object({ isRead: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); if (!hasPermission(session.role, "MESSAGES_READ")) return failure("Forbidden", 403); body = parsed.data;
    } else if (collection === "players") {
      const incoming = { ...body };
      const career = careerFromForm(incoming); if (!career.ok) return failure(career.message, 400);
      const links = linksFromForm(incoming); if (!links.ok) return failure(links.message, 400);
      const parsed = z.object({ fullName: personName(100).optional(), ...playerTextRules, slug: z.string().trim().max(120).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), careerRecord: careerRecordSchema.nullable().optional() }).safeParse({ ...incoming, careerRecord: career.value }); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.dateOfBirth === "string") body.dateOfBirth = new Date(`${body.dateOfBirth}T00:00:00.000Z`); if (typeof body.slug === "string" && body.slug.trim()) body.slug = slugify(body.slug); else delete body.slug; if (body.displayOrder == null) delete body.displayOrder; if (links.touched) body.socialLinks = links.value ?? Prisma.DbNull;
    } else if (collection === "staff") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100).optional(), title: z.string().trim().min(2).max(100).optional(), category: z.enum(["COACHING", "SUPPORT", "MANAGEMENT"]).optional(), bio: z.string().trim().max(2500).nullable().optional(), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), displayOrder: optionalInt(0, 9999), isActive: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (body.displayOrder == null) delete body.displayOrder;
    } else if (collection === "news") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), excerpt: z.string().trim().min(3).max(400).optional(), content: z.string().trim().min(3).max(50000).optional(), category: z.string().trim().min(2).max(50).optional(), authorName: z.string().trim().max(100).optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional(), seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "updates") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), description: z.string().trim().min(3).max(500).optional(), content: z.string().trim().max(10000).nullable().optional(), category: z.string().trim().min(2).max(40).optional(), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), video: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), publishedAt: z.string().datetime().optional(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "gallery") {
      const parsed = z.object({ title: z.string().trim().min(2).max(160).optional(), category: z.string().trim().min(2).max(60).optional(), mediaUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).optional(), type: z.enum(["IMAGE", "VIDEO"]).optional(), altText: z.string().trim().max(300).nullable().optional(), displayOrder: optionalInt(0, 9999), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (body.displayOrder == null) body.displayOrder = 0;
    } else if (collection === "sponsors") {
      const parsed = z.object({ name: z.string().trim().min(2).max(120).optional(), category: z.string().trim().min(2).max(60).optional(), logoUrl: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), website: z.union([z.string().trim().url().max(300), z.literal(""), z.null()]).optional(), displayOrder: optionalInt(0, 9999), isPublished: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (body.website === "") body.website = null; if (body.displayOrder == null) body.displayOrder = 0;
    } else if (collection === "products") {
      const parsed = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().max(140).optional(), description: z.string().trim().min(3).max(4000), price: z.coerce.number().positive().max(100000), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), category: z.enum(["JERSEY", "TRAINING", "CAP", "ACCESSORY"]), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional(), variants: z.array(z.object({ color: z.string().trim().min(1).max(40), size: z.string().trim().min(1).max(24), stock: z.coerce.number().int().min(0).max(9999), price: z.union([z.null(), z.coerce.number().min(0).max(100000)]).optional(), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional() })).min(1).max(40) }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      const updated = await prisma.product.update({ where: { id }, data: { name: data.name, ...(data.slug ? { slug: slugify(data.slug) } : {}), description: data.description, price: data.price, image: data.image || null, category: data.category, isFeatured: data.isFeatured ?? false, isPublished: data.isPublished ?? true, variants: { deleteMany: {}, create: data.variants.map((variant) => ({ color: variant.color, size: variant.size, stock: variant.stock, price: variant.price ?? null, image: variant.image || null })) } } });
      await recordAudit(session.sub, "UPDATE", collection, id, original, updated, request.headers.get("x-forwarded-for")?.split(",")[0]);
      return success(updated, "Updated");
    } else if (collection === "polls") {
      const parsed = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), question: z.string().trim().min(3).max(240), description: z.string().trim().max(1000).nullable().optional(), closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional(), options: z.array(z.object({ id: z.string().optional(), label: z.string().trim().min(1).max(80) })).min(2).max(8) }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      const current = await prisma.pollOption.findMany({ where: { pollId: id }, include: { _count: { select: { votes: true } } } });
      const kept = new Set(data.options.flatMap((option) => option.id ? [option.id] : []));
      const removing = current.filter((option) => !kept.has(option.id));
      if (removing.some((option) => option._count.votes > 0)) return failure("An option that already has votes cannot be removed", 409);
      const updated = await prisma.$transaction(async (tx) => {
        if (removing.length) await tx.pollOption.deleteMany({ where: { id: { in: removing.map((option) => option.id) } } });
        for (const [index, option] of data.options.entries()) {
          if (option.id) await tx.pollOption.update({ where: { id: option.id }, data: { label: option.label, displayOrder: index } });
          else await tx.pollOption.create({ data: { pollId: id, label: option.label, displayOrder: index } });
        }
        return tx.poll.update({ where: { id }, data: { title: data.title, ...(data.slug ? { slug: slugify(data.slug) } : {}), question: data.question, description: data.description || null, closesAt: data.closesAt ? new Date(data.closesAt) : null, isPublished: data.isPublished ?? true } });
      });
      await recordAudit(session.sub, "UPDATE", collection, id, original, updated, request.headers.get("x-forwarded-for")?.split(",")[0]);
      return success(updated, "Updated");
    } else if (collection === "contests") {
      const parsed = z.object({ title: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(), description: z.string().trim().min(3).max(4000), prize: z.string().trim().max(160).nullable().optional(), prompt: z.string().trim().min(3).max(240), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), closesAt: z.string().datetime().nullable().optional(), isPublished: z.boolean().optional() }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      const data = parsed.data;
      body = { title: data.title, ...(data.slug ? { slug: slugify(data.slug) } : {}), description: data.description, prize: data.prize || null, prompt: data.prompt, image: data.image || null, closesAt: data.closesAt ? new Date(data.closesAt) : null, isPublished: data.isPublished ?? true };
    } else if (collection === "orders") {
      const parsed = z.object({ status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]) }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      body = parsed.data;
    } else if (collection === "records") {
      const parsed = z.object({ title: z.string().trim().min(2).max(160).optional(), value: z.string().trim().min(1).max(40).optional(), category: z.string().trim().min(2).max(60).optional(), scope: z.string().trim().min(2).max(40).optional(), playerName: z.string().trim().max(120).nullable().optional(), seasonYear: optionalInt(1990, 2100) }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data;
    } else if (collection === "standings") {
      // Fields left out of the request keep their stored value; a cleared field saves as 0. The team itself is fixed by the row.
      const tally = z.union([z.null(), z.literal(""), z.coerce.number().int().min(0).max(999)]).optional().transform((value) => (value === undefined ? undefined : typeof value === "number" ? value : 0));
      const parsed = z.object({ played: tally, won: tally, lost: tally, noResult: tally, points: tally, netRunRate: z.union([z.null(), z.literal(""), z.coerce.number().min(-99).max(99)]).optional().transform((value) => (value === undefined ? undefined : typeof value === "number" ? Number(value.toFixed(3)) : 0)) }).safeParse(body);
      if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues);
      body = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));
      if (id.startsWith("team:")) {
        // First figures for this team: create its entry from the calculated totals plus whatever was changed.
        const season = await prisma.season.findFirst({ where: { isCurrent: true } }); if (!season) return failure("Create a current season before editing the points table", 409);
        const row = original as NonNullable<Awaited<ReturnType<typeof standingRow>>>;
        const figures = { played: row.played, won: row.won, lost: row.lost, noResult: row.noResult, points: row.points, netRunRate: row.netRunRate, ...body };
        const updated = await prisma.pointsEntry.upsert({ where: { seasonId_teamName: { seasonId: season.id, teamName: row.teamName } }, create: { seasonId: season.id, teamName: row.teamName, ...figures, isDemo: false }, update: { ...figures, isDemo: false } });
        await recordAudit(session.sub, "UPDATE", collection, updated.id, original, updated, request.headers.get("x-forwarded-for")?.split(",")[0]);
        return success({ ...updated, netRunRate: Number(updated.netRunRate) }, "Updated");
      }
    } else if (collection === "matches") {
      const parsed = z.object({ opponent: z.string().trim().min(2).max(120).optional(), date: z.string().datetime().optional(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).optional(), competition: z.string().trim().max(120).nullable().optional(), matchNumber: z.string().trim().max(30).nullable().optional(), venueName: z.string().trim().max(140).nullable().optional(), result: z.string().trim().max(250).nullable().optional(), toss: z.string().trim().max(250).nullable().optional(), playerOfMatchId: z.string().nullable().optional(), liveState: z.unknown().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.date === "string") body.date = new Date(body.date); if (typeof body.opponent === "string") { const identity = await opponentIdentity(body.opponent); if (identity.isHome) return failure("Pick an opponent other than our own team", 400); body.opponent = identity.name; body.opponentShort = identity.shortName; body.opponentLogoUrl = identity.logo; } if ("venueName" in body) { const name = typeof body.venueName === "string" ? body.venueName : ""; delete body.venueName; if (name) { const existingVenue = await prisma.venue.findFirst({ where: { name } }); body.venueId = existingVenue?.id ?? (await prisma.venue.create({ data: { name } })).id; } else body.venueId = null; }
    }
    if (collection === "contacts" && typeof body.isRead !== "boolean") return failure("Send isRead as true or false", 400);
    if (collection === "players" && body.careerRecord === null) body.careerRecord = Prisma.DbNull;
    const updated = await model.update({ where: { id }, data: body });
    await recordAudit(session.sub, "UPDATE", collection, id, original, updated, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(updated, "Updated");
  } catch { return failure("The record could not be updated", 503); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params; const grant = grants[collection]; const session = await getSession();
  if (!grant || !session || !hasPermission(session.role, grant.write)) return failure("You do not have permission to delete this record", 403);
  const original = await getRecord(collection, id); if (!original) return failure("Record not found", 404);
  if (collection === "settings" && managedSettingKeys.has(String((original as { key?: string }).key))) return failure("This setting is managed from the site settings form", 409);
  if (collection === "standings" && id.startsWith("team:")) return failure("This team already shows the figures calculated from scorecards", 409);
  if (collection === "teams" && id === await getHomeTeamId()) return failure("Our own team cannot be deleted. Mark another team as ours first.", 409);
  try {
    if (collection === "players") await prisma.match.updateMany({ where: { playerOfMatchId: id }, data: { playerOfMatchId: null } });
    const modelName = collection === "news" ? "newsArticle" : collection === "updates" ? "teamUpdate" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "records" ? "teamRecord" : collection === "standings" ? "pointsEntry" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : collection === "teams" ? "team" : collection === "players" ? "player" : collection === "settings" ? "siteSetting" : collection === "products" ? "product" : collection === "polls" ? "poll" : collection === "contests" ? "contest" : collection === "orders" ? "order" : null;
    if (!modelName) return failure("This record cannot be deleted", 405);
    const deleted = await (prisma as unknown as Record<string, { delete(args: { where: { id: string } }): Promise<unknown> }>)[modelName].delete({ where: { id } });
    await recordAudit(session.sub, "DELETE", collection, id, original, deleted, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success({ id }, collection === "standings" ? "Entered figures cleared" : "Record deleted");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2003") return failure("This record is still used by other data and could not be deleted", 409);
    return failure("The record could not be deleted", 503);
  }
}

