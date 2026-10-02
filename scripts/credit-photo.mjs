import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const credit = "Match photo: Pakistan Cricket Board, CC BY 3.0, via Wikimedia Commons.";
const player = await prisma.player.findUnique({ where: { slug: "fakhar-zaman" }, select: { bio: true } });
const bio = player?.bio || "";
if (!bio.includes("Wikimedia Commons")) {
  await prisma.player.update({
    where: { slug: "fakhar-zaman" },
    data: { bio: bio ? `${bio} ${credit}` : credit },
  });
  console.log("Photo credit added.");
} else {
  console.log("Photo credit already present.");
}
await prisma.$disconnect();
