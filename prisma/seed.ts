import { PrismaClient, PlayerRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const roster = [
  { fullName: "Fakhar Zaman", slug: "fakhar-zaman", country: "Pakistan", isIconPlayer: true, displayOrder: 1 },
  { fullName: "Iftikhar Ahmed", slug: "iftikhar-ahmed", displayOrder: 2 },
  { fullName: "Faheem Ashraf", slug: "faheem-ashraf", displayOrder: 3 },
  { fullName: "Azmatullah Omarzai", slug: "azmatullah-omarzai", displayOrder: 4 },
  { fullName: "Abbas Afridi", slug: "abbas-afridi", displayOrder: 5 },
  { fullName: "Odean Smith", slug: "odean-smith", displayOrder: 6 },
  { fullName: "Nurul Hasan", slug: "nurul-hasan", displayOrder: 7 },
  { fullName: "Paul van Meekeren", slug: "paul-van-meekeren", displayOrder: 8 },
  { fullName: "Adithya Shetty", slug: "adithya-shetty", displayOrder: 9 },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 12 || adminPassword.includes("change-this")) {
    throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters in .env before seeding.");
  }

  const team = await prisma.team.upsert({
    where: { slug: "united-tigers" },
    update: { name: "United Tigers", shortName: "TIGERS" },
    create: { name: "United Tigers", shortName: "TIGERS", slug: "united-tigers", description: "Official franchise content and match information." },
  });
  const season = await prisma.season.upsert({ where: { year: 2026 }, update: { isCurrent: true, teamId: team.id }, create: { name: "Abu Dhabi T10 2026", year: 2026, isCurrent: true, teamId: team.id } });
  const tournament = await prisma.tournament.upsert({ where: { name_seasonId: { name: "Abu Dhabi T10", seasonId: season.id } }, update: {}, create: { name: "Abu Dhabi T10", seasonId: season.id } });
  const venue = await prisma.venue.upsert({ where: { name_city: { name: "Zayed Cricket Stadium", city: "Abu Dhabi" } }, update: { country: "United Arab Emirates" }, create: { name: "Zayed Cricket Stadium", city: "Abu Dhabi", country: "United Arab Emirates" } });

  const players = [];
  for (const item of roster) {
    const player = await prisma.player.upsert({
      where: { slug: item.slug },
      update: { fullName: item.fullName, country: item.country, isIconPlayer: item.isIconPlayer ?? false, teamId: team.id, displayOrder: item.displayOrder },
      create: { ...item, teamId: team.id },
    });
    players.push(player);
    await prisma.playerSeason.upsert({ where: { playerId_seasonId: { playerId: player.id, seasonId: season.id } }, update: {}, create: { playerId: player.id, seasonId: season.id } });
  }
  const demoPlayer = await prisma.player.upsert({ where: { slug: "sample-player" }, update: { isDemo: true, teamId: team.id }, create: { fullName: "Sample Player", slug: "sample-player", displayName: "Sample Player", role: PlayerRole.ALL_ROUNDER, teamId: team.id, isDemo: true, displayOrder: 10 } });
  await prisma.playerSeason.upsert({ where: { playerId_seasonId: { playerId: demoPlayer.id, seasonId: season.id } }, update: {}, create: { playerId: demoPlayer.id, seasonId: season.id } });

  const sampleDates = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const sampleMatches = [];
  for (let index = 0; index < sampleDates.length; index++) {
    const number = index + 1;
    const match = await prisma.match.upsert({
      where: { slug: `sample-fixture-${String(number).padStart(2, "0")}` },
      update: { isDemo: true, seasonId: season.id, tournamentId: tournament.id, venueId: venue.id },
      create: { slug: `sample-fixture-${String(number).padStart(2, "0")}`, matchNumber: `SAMPLE ${String(number).padStart(2, "02")}`, date: new Date(`2026-11-${String(sampleDates[index]).padStart(2, "0")}T18:00:00+04:00`), opponent: `Sample Opponent ${number}`, opponentShort: `S${number}`, competition: "DEMO DATA", status: "UPCOMING", seasonId: season.id, tournamentId: tournament.id, venueId: venue.id, isDemo: true },
    });
    sampleMatches.push(match);
    await prisma.matchTeam.deleteMany({ where: { matchId: match.id } });
    await prisma.matchTeam.createMany({ data: [{ matchId: match.id, teamName: "United Tigers", isHome: true }, { matchId: match.id, teamName: `Sample Opponent ${number}`, isHome: false }] });
  }

  const firstDemoMatch = sampleMatches[0];
  await prisma.innings.deleteMany({ where: { matchId: firstDemoMatch.id } });
  const inningsOne = await prisma.innings.create({ data: { matchId: firstDemoMatch.id, number: 1, battingTeam: "United Tigers", runs: 104, wickets: 4, overs: 10 } });
  const inningsTwo = await prisma.innings.create({ data: { matchId: firstDemoMatch.id, number: 2, battingTeam: "Sample Opponent 1", runs: 98, wickets: 8, overs: 10 } });
  await prisma.battingPerformance.createMany({ data: [
    { inningsId: inningsOne.id, playerId: demoPlayer.id, runs: 52, balls: 21, fours: 5, sixes: 3, dismissal: "caught" },
    { inningsId: inningsTwo.id, playerId: demoPlayer.id, runs: 18, balls: 14, fours: 2, sixes: 0, dismissal: "not out" },
  ] });
  await prisma.bowlingPerformance.create({ data: { inningsId: inningsTwo.id, playerId: demoPlayer.id, overs: 2, runs: 15, wickets: 2 } });
  await prisma.fieldingPerformance.create({ data: { playerId: demoPlayer.id, matchId: firstDemoMatch.id, catches: 1 } });

  await prisma.newsArticle.upsert({ where: { slug: "sample-season-preview" }, update: { isDemo: true }, create: { title: "A new chapter begins", slug: "sample-season-preview", excerpt: "Sample article content. Replace this with approved franchise news before publishing.", content: "This is sample CMS content for development. Editors can replace the copy, category and imagery from the admin panel.", category: "TEAM NEWS", authorName: "United Tigers", status: "PUBLISHED", publishedAt: new Date("2026-10-01T12:00:00Z"), isFeatured: true, isDemo: true } });
  await prisma.newsArticle.upsert({ where: { slug: "sample-matchday-guide" }, update: { isDemo: true }, create: { title: "Match-day guide — sample", slug: "sample-matchday-guide", excerpt: "A sample editorial card for match previews and team stories.", content: "Replace this sample copy with confirmed match-day details.", category: "SAMPLE", authorName: "United Tigers", status: "PUBLISHED", publishedAt: new Date("2026-09-28T12:00:00Z"), isDemo: true } });
  await prisma.teamUpdate.upsert({ where: { slug: "sample-training-note" }, update: { isDemo: true }, create: { title: "Training notes — sample", slug: "sample-training-note", description: "Sample content for daily team updates. Publish real club updates from the admin panel.", content: "Development-only sample update.", category: "TRAINING", publishedAt: new Date("2026-10-01T17:00:00Z"), isPublished: true, isDemo: true } });
  await prisma.teamUpdate.upsert({ where: { slug: "sample-team-arrival" }, update: { isDemo: true }, create: { title: "Behind the scenes — sample", slug: "sample-team-arrival", description: "A second sample timeline entry for the CMS preview.", category: "BEHIND_THE_SCENES", publishedAt: new Date("2026-09-30T16:30:00Z"), isPublished: true, isDemo: true } });
  await prisma.sponsor.upsert({ where: { id: "sample-sponsor-title" }, update: { isDemo: true }, create: { id: "sample-sponsor-title", name: "Sample Title Partner", category: "TITLE PARTNER", isDemo: true, isPublished: true, displayOrder: 1, teamId: team.id } });
  await prisma.sponsor.upsert({ where: { id: "sample-sponsor-official" }, update: { isDemo: true }, create: { id: "sample-sponsor-official", name: "Sample Official Partner", category: "OFFICIAL PARTNER", isDemo: true, isPublished: true, displayOrder: 2, teamId: team.id } });
  await prisma.teamRecord.upsert({ where: { id: "sample-record-score" }, update: { isDemo: true }, create: { id: "sample-record-score", title: "Highest team score", value: "104/4", category: "TEAM", scope: "SAMPLE", playerName: "Sample record", seasonYear: 2026, isDemo: true, teamId: team.id } });
  await prisma.gallery.upsert({ where: { id: "sample-gallery-hero" }, update: { isDemo: true }, create: { id: "sample-gallery-hero", title: "Sample stadium image", category: "SAMPLE", mediaUrl: "/images/stadium-hero.png", altText: "Cinematic cricket stadium at night", isDemo: true } });
  const teams = ["United Tigers", "Sample Team 2", "Sample Team 3", "Sample Team 4"];
  for (const [index, teamName] of teams.entries()) {
    await prisma.pointsEntry.upsert({ where: { seasonId_teamName: { seasonId: season.id, teamName } }, update: { isDemo: true }, create: { seasonId: season.id, teamName, played: index === 0 ? 1 : 0, won: index === 0 ? 1 : 0, points: index === 0 ? 2 : 0, position: index + 1, netRunRate: index === 0 ? 0.6 : 0, isDemo: true } });
  }
  await prisma.siteSetting.upsert({ where: { key: "homepage" }, update: {}, create: { key: "homepage", value: { title: "THE TIGERS ARE READY.", subtitle: "2026 T10 SEASON", heroImage: "/images/stadium-hero.png", primaryCta: { label: "VIEW SQUAD", href: "/team" }, secondaryCta: { label: "FIXTURES", href: "/fixtures" } } } });
  await prisma.socialLink.upsert({ where: { id: "instagram-united-tigers" }, update: {}, create: { id: "instagram-united-tigers", platform: "Instagram", handle: "@unitedtigers.ae", url: "https://www.instagram.com/unitedtigers.ae/", displayOrder: 1 } });

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({ data: { email: adminEmail, name: "United Tigers Admin", passwordHash, role: "SUPER_ADMIN" } });
  }
  console.log(`Seeded ${roster.length} reported roster names, ${sampleMatches.length} clearly marked sample fixtures, sample content, and one administrator.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

