import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [players, matches, news, updates, gallery, sponsors, records, staff, settings, users] = await Promise.all([
  prisma.player.findMany({ select: { id: true, fullName: true, slug: true, isDemo: true, isActive: true, profileImage: true, role: true, jerseyNumber: true } }),
  prisma.match.count(),
  prisma.newsArticle.count(),
  prisma.teamUpdate.count(),
  prisma.gallery.count(),
  prisma.sponsor.count(),
  prisma.teamRecord.count(),
  prisma.staffMember.count(),
  prisma.siteSetting.findMany({ select: { key: true } }),
  prisma.user.findMany({ select: { email: true, role: true, isActive: true } }),
]);
console.log(JSON.stringify({ players, counts: { matches, news, updates, gallery, sponsors, records, staff }, settings, users }, null, 2));
await prisma.$disconnect();
