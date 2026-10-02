import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const storage = await prisma.siteSetting.findUnique({ where: { key: "storage" } });
const value = storage?.value || {};
const accessKey = typeof value.accessKey === "string" ? value.accessKey : "";
console.log(JSON.stringify({
  endpoint: value.endpoint,
  bucket: value.bucket,
  region: value.region,
  correctedKey: accessKey.includes("LVfdv") && accessKey.includes("IvfKYK"),
  hasSecret: typeof value.secretKey === "string" && value.secretKey.startsWith("tsec_"),
}, null, 2));

const players = await prisma.player.findMany({
  where: { isActive: true },
  select: { slug: true, fullName: true, profileImage: true },
  orderBy: { displayOrder: "asc" },
});
for (const player of players) console.log(`${player.slug}: ${player.profileImage || "(none)"}`);
await prisma.$disconnect();
