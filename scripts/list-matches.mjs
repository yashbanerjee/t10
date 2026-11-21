import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const matches = await prisma.match.findMany({
  where: { isDemo: false },
  select: {
    slug: true,
    opponent: true,
    date: true,
    status: true,
    result: true,
    matchNumber: true,
  },
  orderBy: { date: "asc" },
});
for (const x of matches) {
  console.log(
    x.date.toISOString().slice(0, 10),
    x.status.padEnd(10),
    x.matchNumber || "-",
    "vs",
    x.opponent,
    "|",
    x.result || "",
  );
}
await prisma.$disconnect();
