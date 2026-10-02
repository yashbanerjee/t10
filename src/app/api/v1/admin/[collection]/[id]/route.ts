import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { z } from "zod";

const grants: Record<string, { read: string; write: string }> = { players: { read: "TEAM_READ", write: "TEAM_WRITE" }, staff: { read: "TEAM_READ", write: "TEAM_WRITE" }, matches: { read: "MATCH_READ", write: "MATCH_WRITE" }, news: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, updates: { read: "CONTENT_READ", write: "CONTENT_WRITE" }, contacts: { read: "MESSAGES_READ", write: "MESSAGES_READ" }, gallery: { read: "CONTENT_READ", write: "MEDIA_WRITE" }, sponsors: { read: "CONTENT_READ", write: "SETTINGS_WRITE" }, records: { read: "STATS_READ", write: "STATS_WRITE" }, settings: { read: "SETTINGS_WRITE", write: "SETTINGS_WRITE" } };
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function getRecord(collection: string, id: string): Promise<unknown> {
  const model = collection === "contacts" ? prisma.contactSubmission : collection === "news" ? prisma.newsArticle : collection === "updates" ? prisma.teamUpdate : collection === "gallery" ? prisma.gallery : collection === "sponsors" ? prisma.sponsor : collection === "records" ? prisma.teamRecord : collection === "settings" ? prisma.siteSetting : collection === "matches" ? prisma.match : collection === "staff" ? prisma.staffMember : collection === "players" ? prisma.player : null;
  if (!model) return null;
  return (model as unknown as { findUnique(args: { where: { id: string } }): Promise<unknown> }).findUnique({ where: { id } });
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
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100).optional(), displayName: z.string().trim().max(80).nullable().optional(), country: z.string().trim().max(80).nullable().optional(), nationality: z.string().trim().max(80).nullable().optional(), role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"]).nullable().optional(), jerseyNumber: z.coerce.number().int().min(0).max(999).nullable().optional(), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), bio: z.string().trim().max(2500).nullable().optional(), isCaptain: z.boolean().optional(), isViceCaptain: z.boolean().optional(), isIconPlayer: z.boolean().optional(), isActive: z.boolean().optional(), displayOrder: z.coerce.number().int().min(0).optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.fullName === "string") body.slug = slugify(body.fullName);
    } else if (collection === "staff") {
      const parsed = z.object({ fullName: z.string().trim().min(2).max(100).optional(), title: z.string().trim().min(2).max(100).optional(), category: z.enum(["COACHING", "SUPPORT", "MANAGEMENT"]).optional(), bio: z.string().trim().max(2500).nullable().optional(), profileImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), displayOrder: z.coerce.number().int().min(0).optional(), isActive: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data;
    } else if (collection === "news") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), excerpt: z.string().trim().min(3).max(400).optional(), content: z.string().trim().min(3).max(50000).optional(), category: z.string().trim().min(2).max(50).optional(), authorName: z.string().trim().max(100).optional(), coverImage: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(), publishedAt: z.string().datetime().nullable().optional(), isFeatured: z.boolean().optional(), seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(300).nullable().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "updates") {
      const parsed = z.object({ title: z.string().trim().min(3).max(180).optional(), description: z.string().trim().min(3).max(500).optional(), content: z.string().trim().max(10000).nullable().optional(), category: z.string().trim().min(2).max(40).optional(), image: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), video: z.string().trim().max(1000).regex(/^(https?:\/\/|\/)/).nullable().optional(), publishedAt: z.string().datetime().optional(), isFeatured: z.boolean().optional(), isPublished: z.boolean().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.title === "string") body.slug = slugify(body.title); if (typeof body.publishedAt === "string") body.publishedAt = new Date(body.publishedAt);
    } else if (collection === "matches") {
      const parsed = z.object({ opponent: z.string().trim().min(2).max(120).optional(), date: z.string().datetime().optional(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).optional(), result: z.string().trim().max(250).nullable().optional(), toss: z.string().trim().max(250).nullable().optional(), playerOfMatchId: z.string().nullable().optional(), liveState: z.unknown().optional() }).safeParse(body); if (!parsed.success) return failure("Validation failed", 400, parsed.error.issues); body = parsed.data; if (typeof body.date === "string") body.date = new Date(body.date);
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
  try {
    let result: unknown;
    if (collection === "players") result = await prisma.player.update({ where: { id }, data: { isActive: false } });
    else if (collection === "staff") result = await prisma.staffMember.update({ where: { id }, data: { isActive: false } });
    else if (collection === "news") result = await prisma.newsArticle.update({ where: { id }, data: { status: "DRAFT", isFeatured: false } });
    else if (collection === "updates") result = await prisma.teamUpdate.update({ where: { id }, data: { isPublished: false, isFeatured: false } });
    else if (collection === "matches") result = await prisma.match.update({ where: { id }, data: { status: "CANCELLED" } });
    else if (collection === "gallery") result = await prisma.gallery.update({ where: { id }, data: { isPublished: false } });
    else if (collection === "sponsors") result = await prisma.sponsor.update({ where: { id }, data: { isPublished: false } });
    else return failure("This record cannot be deleted", 405);
    await recordAudit(session.sub, "DEACTIVATE", collection, id, original, result, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(result, "Record deactivated");
  } catch { return failure("The record could not be deactivated", 503); }
}

