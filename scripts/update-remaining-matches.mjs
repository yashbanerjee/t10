import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectKnockouts() {
  const rows = await prisma.match.findMany({
    where: {
      OR: [{ slug: "qualifier-2026-11-20" }, { slug: "final-2026-11-20" }, { slug: "united-tigers-vs-emirates-eagles-2026-11-19" }],
    },
    include: { innings: true, matchTeams: true },
  });
  console.log(JSON.stringify(rows, null, 2));
}

/**
 * Fill remaining Abu Dhabi T10 fixtures after the group stage:
 * - Match 30 already completed (Emirates Eagles won by 40 runs)
 * - Qualifier: Arabian Aces vs UAE Bulls → Bulls won by 7 wickets
 * - Final: Yas Lions vs UAE Bulls → Bulls won by 24 runs (champions)
 */
async function update() {
  const qualifier = await prisma.match.findFirst({
    where: { slug: "qualifier-2026-11-20" },
    include: { matchTeams: true, innings: true },
  });
  const final = await prisma.match.findFirst({
    where: { slug: "final-2026-11-20" },
    include: { matchTeams: true, innings: true },
  });
  if (!qualifier || !final) {
    throw new Error(`Missing knockout fixtures: qualifier=${!!qualifier} final=${!!final}`);
  }

  await prisma.$transaction(async (tx) => {
    // ---- Qualifier: Arabian Aces 98/5 · UAE Bulls 99/3 (9.2) ----
    await tx.match.update({
      where: { id: qualifier.id },
      data: {
        status: "COMPLETED",
        opponent: "Arabian Aces vs UAE Bulls",
        opponentShort: "AA vs UBL",
        opponentLogoUrl: null,
        competition: "Abu Dhabi T10 Qualifier",
        matchNumber: "QUALIFIER",
        toss: "UAE Bulls won the toss and elected to bowl",
        result: "UAE Bulls won by 7 wickets · Player of the Match: Azam Khan (UAE Bulls)",
        liveState: null,
      },
    });
    await tx.innings.deleteMany({ where: { matchId: qualifier.id } });
    await tx.innings.createMany({
      data: [
        {
          matchId: qualifier.id,
          number: 1,
          battingTeam: "Arabian Aces",
          runs: 98,
          wickets: 5,
          overs: 10.0,
        },
        {
          matchId: qualifier.id,
          number: 2,
          battingTeam: "UAE Bulls",
          runs: 99,
          wickets: 3,
          overs: 9.2,
        },
      ],
    });
    await tx.matchTeam.deleteMany({ where: { matchId: qualifier.id } });
    await tx.matchTeam.createMany({
      data: [
        {
          matchId: qualifier.id,
          teamName: "Arabian Aces",
          isHome: true,
          score: "98/5",
          overs: 10.0,
          result: "lost",
        },
        {
          matchId: qualifier.id,
          teamName: "UAE Bulls",
          isHome: false,
          score: "99/3",
          overs: 9.2,
          result: "won",
        },
      ],
    });

    // ---- Final: UAE Bulls 134/3 · Yas Lions 110/4 ----
    await tx.match.update({
      where: { id: final.id },
      data: {
        status: "COMPLETED",
        opponent: "Yas Lions vs UAE Bulls",
        opponentShort: "YL vs UBL",
        opponentLogoUrl: null,
        competition: "Abu Dhabi T10 Final",
        matchNumber: "FINAL",
        toss: "Yas Lions won the toss and elected to bowl",
        result: "UAE Bulls won by 24 runs · Player of the Match: Azam Khan (UAE Bulls)",
        liveState: null,
      },
    });
    await tx.innings.deleteMany({ where: { matchId: final.id } });
    await tx.innings.createMany({
      data: [
        {
          matchId: final.id,
          number: 1,
          battingTeam: "UAE Bulls",
          runs: 134,
          wickets: 3,
          overs: 10.0,
        },
        {
          matchId: final.id,
          number: 2,
          battingTeam: "Yas Lions",
          runs: 110,
          wickets: 4,
          overs: 10.0,
        },
      ],
    });
    await tx.matchTeam.deleteMany({ where: { matchId: final.id } });
    await tx.matchTeam.createMany({
      data: [
        {
          matchId: final.id,
          teamName: "UAE Bulls",
          isHome: true,
          score: "134/3",
          overs: 10.0,
          result: "won",
        },
        {
          matchId: final.id,
          teamName: "Yas Lions",
          isHome: false,
          score: "110/4",
          overs: 10.0,
          result: "lost",
        },
      ],
    });
  });

  const updated = await prisma.match.findMany({
    where: { id: { in: [qualifier.id, final.id] } },
    include: { innings: { orderBy: { number: "asc" } }, matchTeams: true },
    orderBy: { date: "asc" },
  });
  for (const m of updated) {
    console.log(`\n${m.matchNumber} (${m.slug})`);
    console.log(`  status: ${m.status}`);
    console.log(`  opponent: ${m.opponent}`);
    console.log(`  competition: ${m.competition}`);
    console.log(`  result: ${m.result}`);
    for (const inn of m.innings) {
      console.log(`  innings ${inn.number}: ${inn.battingTeam} ${inn.runs}/${inn.wickets} (${inn.overs})`);
    }
  }
}

const mode = process.argv[2] || "update";
(mode === "inspect" ? inspectKnockouts() : update())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
