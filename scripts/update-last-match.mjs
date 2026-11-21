import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Last night (18 Nov 2026, Match 26): UAE Bulls beat United Tigers by 28 runs.
 * UBL 98/6 (10) · UT 70/8 (10) · PoM Shadab Khan (UBL 3/7)
 * Toss: United Tigers elected to bowl
 */
async function update() {
  const match = await prisma.match.findFirst({
    where: { slug: "united-tigers-vs-uae-bulls-2026-11-18" },
    include: { innings: true, matchTeams: true },
  });
  if (!match) throw new Error("Match not found: united-tigers-vs-uae-bulls-2026-11-18");

  const result =
    "UAE Bulls won by 28 runs · Player of the Match: Shadab Khan (UAE Bulls)";
  const toss = "United Tigers won the toss and elected to bowl";

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "COMPLETED",
        result,
        toss,
        liveState: null,
      },
    });

    await tx.innings.deleteMany({ where: { matchId: match.id } });
    await tx.innings.createMany({
      data: [
        {
          matchId: match.id,
          number: 1,
          battingTeam: "UAE Bulls",
          runs: 98,
          wickets: 6,
          overs: 10.0,
        },
        {
          matchId: match.id,
          number: 2,
          battingTeam: "United Tigers",
          runs: 70,
          wickets: 8,
          overs: 10.0,
        },
      ],
    });

    for (const team of match.matchTeams) {
      const isHome = /united tigers/i.test(team.teamName);
      await tx.matchTeam.update({
        where: { id: team.id },
        data: {
          result: isHome ? "lost" : "won",
          score: isHome ? "70/8" : "98/6",
          overs: 10.0,
        },
      });
    }
  });

  const updated = await prisma.match.findFirst({
    where: { id: match.id },
    include: { innings: { orderBy: { number: "asc" } }, matchTeams: true },
  });

  console.log("Updated Match 26:");
  console.log(`  status: ${updated.status}`);
  console.log(`  result: ${updated.result}`);
  console.log(`  toss:   ${updated.toss}`);
  for (const inn of updated.innings) {
    console.log(`  innings ${inn.number}: ${inn.battingTeam} ${inn.runs}/${inn.wickets} (${inn.overs})`);
  }
  for (const team of updated.matchTeams) {
    console.log(`  team: ${team.teamName} ${team.score} (${team.overs}) → ${team.result}`);
  }
}

update()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
