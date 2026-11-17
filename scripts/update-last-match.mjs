import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Last night (15 Nov 2026, Match 21): Yas Lions beat United Tigers by 8 wickets.
 * UT 88 (8.4) · YAL 90/2 (6.0) · PoM Jason Holder (YAL 3/25)
 * Sources: ESPN / IPL.com / Cricbuzz points table after Match 21.
 */
async function update() {
  const match = await prisma.match.findFirst({
    where: { slug: "united-tigers-vs-yas-lions-2026-11-15" },
    include: { innings: true, matchTeams: true },
  });
  if (!match) throw new Error("Match not found: united-tigers-vs-yas-lions-2026-11-15");

  const result =
    "Yas Lions won by 8 wickets · Player of the Match: Jason Holder (Yas Lions)";
  const toss = "United Tigers won the toss and elected to bat";

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
          battingTeam: "United Tigers",
          runs: 88,
          wickets: 10,
          overs: 8.4,
        },
        {
          matchId: match.id,
          number: 2,
          battingTeam: "Yas Lions",
          runs: 90,
          wickets: 2,
          overs: 6.0,
        },
      ],
    });

    for (const team of match.matchTeams) {
      const isHome = /united tigers/i.test(team.teamName);
      await tx.matchTeam.update({
        where: { id: team.id },
        data: {
          result: isHome ? "lost" : "won",
          score: isHome ? "88/10" : "90/2",
          overs: isHome ? 8.4 : 6.0,
        },
      });
    }
  });

  const updated = await prisma.match.findFirst({
    where: { id: match.id },
    include: { innings: { orderBy: { number: "asc" } }, matchTeams: true },
  });

  console.log("Updated Match 21:");
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
