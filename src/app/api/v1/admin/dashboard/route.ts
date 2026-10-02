import { getSession, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "CONTENT_READ")) return failure("You do not have permission to view the dashboard", 403);
  try {
    const [players, matches, news, updates, media, sponsors, unreadMessages, upcoming] = await Promise.all([
      prisma.player.count({ where: { isDemo: false } }), prisma.match.count({ where: { isDemo: false } }),
      prisma.newsArticle.count({ where: { isDemo: false } }), prisma.teamUpdate.count({ where: { isDemo: false } }),
      prisma.gallery.count({ where: { isDemo: false } }), prisma.sponsor.count({ where: { isDemo: false } }),
      prisma.contactSubmission.count({ where: { isRead: false } }), prisma.match.findFirst({ where: { status: "UPCOMING", isDemo: false }, orderBy: { date: "asc" }, include: { venue: true } }),
    ]);
    return success({ players, matches, news, updates, gallery: media, sponsors, unreadMessages, upcoming });
  } catch {
    return success({ players: 9, matches: 0, news: 0, updates: 0, gallery: 0, sponsors: 0, unreadMessages: 0, upcoming: null, storage: "DATABASE_NOT_CONNECTED" });
  }
}

