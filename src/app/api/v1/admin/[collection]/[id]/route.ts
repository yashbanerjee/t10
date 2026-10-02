import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { redactSettingRow } from "@/lib/site-settings";
import { z } from "zod";

const grants: Record<string, { read: string; write: string }> = { players: { read: "TEAM_READ", write: "TEAM_WRITE" }, staff: { read: "TEAM_READ", write: "TEAM_WRITE" }, matches: { read: "MATCH_READ", write: "MATCH_WRITE" }, news: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, updates: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, contacts: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, gallery: { read: "CONTENT_READ", write: "MEDIA_WRITE" }, sponsors: { read: "CONTENT_READ", write: "SETTINGS_WRITE" }, records: { read: "STATS_READ", write: "STATS_WRITE" }, settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" } };
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int().min(min).max(max)]).optional();
const managedSettingKeys = new Set(["siteUrl", "livePollIntervalMs", "storage"]);

async function getRecord(collection: string, id: string): Promise<unknown> {
  if (collection === "matches") {
    const match = await prisma.match.findUnique({ where: { id }, include: { venue: true } });
    return match ? { ...match, venueName: match.venue?.name ?? null } : null;
  }
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
    const modelName = collection === "contacts" ? "contactSubmission" : collection === "news" ? "newsArticle" : collection === "updates" ? "teamUpdate" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "records" ? "teamRecord" : collection === "settings" ? "siteSetting" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : "player";
    const model = (prisma as unknown as Record<string, { update(args: unknown): Promise<unknown> }>)[modelName];
    if (collection === "contacts") {
      const parsed = z.object({ isRead: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); if (!hasPermission(session.role, "MESSAGES_READ")) return failure("Forbidden", 403); body = parsed.data;
    } else if (collection === "players") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100).optional(), displayName: z.string().trim().max(80).nullable().optional(), shortName: z.string().trim().max(40).nullable().optional(), slug: z.string().trim().max(120).nullable().optional(), country: z.string().trim().max(80).nullable().optional(), nationality: z.string().trim().max(80).nullable().optional(), dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), battingStyle: z.string().trim().max(80).nullable().optional(), bowlingStyle: z.string().trim().max(80).nullable().optional(), heightCm: optionalInt(100, 250), jerseyNumber: optionalInt(0, 999), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), displayOrder: optionalInt(0, 9999) }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.dateOfBirth === "string") body.dateOfBirth = new Date(`${body.dateOfBirth}T00:00:00.000Z`); if (typeof body.slug === "string" && body.slug.trim()) body.slug = slugify(body.slug); else delete body.slug; if (body.displayOrder == null) delete body.displayOrder;
    } else if (collection === "staff") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100).optional(), title: z.string().trim().min(2).max(100).optional(), category: z.enum(["COACHING", "SUPPORT", "MANAGEMENT"]).optional(), bio: z.string().trim().max(2500).nullable().optional(), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), displayOrder: optionalInt(0, 9999), isActive: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (body.displayOrder == null) delete body.displayOrder;
    } else if (collection === "news") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), excerpt: z.string().trim().min(3).max(400).optional(), content: z.string().trim().min(3).max(50000).optional(), category: z.string().trim().min(2).max(50).optional(), authorName: z.string().trim().max(100).optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional(), seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "updates") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), description: z.string().trim().min(3).max(500).optional(), content: z.string().trim().max(10000).nullable().optional(), category: z.string().trim().min(2).max(40).optional(), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), video: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), publishedAt: z.string().datetime().optional(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "matches") {
      const parsed = z.object({ opponent: z.string().trim().min(2).max(120).optional(), date: z.string().datetime().optional(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).optional(), competition: z.string().trim().max(120).nullable().optional(), matchNumber: z.string().trim().max(30).nullable().optional(), venueName: z.string().trim().max(140).nullable().optional(), result: z.string().trim().max(250).nullable().optional(), toss: z.string().trim().max(250).nullable().optional(), playerOfMatchId: z.string().nullable().optional(), liveState: z.unknown().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.date === "string") body.date = new Date(body.date); if ("venueName" in body) { const name = typeof body.venueName === "string" ? body.venueName : ""; delete body.venueName; if (name) { const existingVenue = await prisma.venue.findFirst({ where: { name } }); body.venueId = existingVenue?.id ?? (await prisma.venue.create({ data: { name } })).id; } else body.venueId = null; }
    }
    if (collection === "contacts") delete body.isRead;
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
  try {
    if (collection === "players") await prisma.match.updateMany({ where: { playerOfMatchId: id }, data: { playerOfMatchId: null } });
    const modelName = collection === "news" ? "newsArticle" : collection === "updates" ? "teamUpdate" : collection === "gallery" ? "gallery" : collection === "sponsors" ? "sponsor" : collection === "matches" ? "match" : collection === "staff" ? "staffMember" : collection === "players" ? "player" : collection === "settings" ? "siteSetting" : null;
    if (!modelName) return failure("This record cannot be deleted", 405);
    const deleted = await (prisma as unknown as Record<string, { delete(args: { where: { id: string } }): Promise<unknown> }>)[modelName].delete({ where: { id } });
    await recordAudit(session.sub, "DELETE", collection, id, original, deleted, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success({ id }, "Record deleted");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2003") return failure("This record is still used by other data and could not be deleted", 409);
    return failure("The record could not be deleted", 503);
  }
}

