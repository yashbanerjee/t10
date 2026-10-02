import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const storage = await prisma.siteSetting.findUnique({ where: { key: "storage" } });
const value = storage?.value && typeof storage.value === "object" ? storage.value : {};
const players = await prisma.player.findMany({ where: { isDemo: false, isActive: true }, select: { fullName: true, role: true, jerseyNumber: true, profileImage: true }, orderBy: { displayOrder: "asc" } });
const counts = {
  matches: await prisma.match.count({ where: { isDemo: false } }),
  news: await prisma.newsArticle.count({ where: { isDemo: false, status: "PUBLISHED" } }),
  updates: await prisma.teamUpdate.count({ where: { isDemo: false, isPublished: true } }),
  gallery: await prisma.gallery.count({ where: { isDemo: false, isPublished: true } }),
  sponsors: await prisma.sponsor.count({ where: { isDemo: false, isPublished: true } }),
  records: await prisma.teamRecord.count({ where: { isDemo: false } }),
  staff: await prisma.staffMember.count({ where: { isActive: true } }),
  users: await prisma.user.count(),
};
console.log(JSON.stringify({
  storage: { endpoint: value.endpoint, bucket: value.bucket, region: value.region, hasAccessKey: Boolean(value.accessKey), hasSecret: Boolean(value.secretKey) },
  siteUrl: (await prisma.siteSetting.findUnique({ where: { key: "siteUrl" } }))?.value,
  counts,
  players,
}, null, 2));
await prisma.$disconnect();
