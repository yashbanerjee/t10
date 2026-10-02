import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rows = [
  ["partner-fmc-dockyard", "/images/demo/logo-fmc.png"],
  ["partner-swift-kit", "/images/demo/logo-swift.png"],
  ["partner-den-live", "/images/demo/logo-den.png"],
  ["partner-harbour-gold", "/images/demo/logo-harbour.png"],
];
for (const [id, logoUrl] of rows) {
  await prisma.sponsor.update({ where: { id }, data: { logoUrl } });
}
console.log("logos updated");
await prisma.$disconnect();
