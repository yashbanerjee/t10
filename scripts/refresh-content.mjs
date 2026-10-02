import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const team = await prisma.team.findFirst({ orderBy: { createdAt: "asc" } });
const season = await prisma.season.findFirst({ where: { isCurrent: true } });
const venue = await prisma.venue.findFirst({ orderBy: { name: "asc" } });
if (!team || !season || !venue) throw new Error("Team, current season, or venue is missing.");

const players = Object.fromEntries((await prisma.player.findMany({ where: { isDemo: false } })).map((player) => [player.slug, player]));
const photo = (slug) => `/images/demo/${slug}.jpg`;

for (const slug of ["iftikhar-ahmed", "faheem-ashraf", "azmatullah-omarzai", "abbas-afridi", "odean-smith", "nurul-hasan", "paul-van-meekeren", "adithya-shetty"]) {
  if (!players[slug]) continue;
  await prisma.player.update({ where: { slug }, data: { profileImage: photo(slug) } });
}

const sponsors = [
  ["partner-fmc-dockyard", "/images/demo/logo-fmc.png"],
  ["partner-swift-kit", "/images/demo/logo-swift.png"],
  ["partner-den-live", "/images/demo/logo-den.png"],
  ["partner-harbour-gold", "/images/demo/logo-harbour.png"],
];
for (const [id, logoUrl] of sponsors) {
  await prisma.sponsor.update({ where: { id }, data: { logoUrl, isPublished: true, isDemo: false } });
}

const gallery = [
  ["gallery-training", "Morning nets in Abu Dhabi", "TRAINING", "/images/demo/gallery-training.jpg"],
  ["gallery-match", "Lights on at the Zayed Cricket Stadium", "MATCH DAY", "/images/demo/gallery-match.jpg"],
  ["gallery-huddle", "Tigers huddle before training", "BEHIND THE SCENES", "/images/demo/gallery-huddle.jpg"],
  ["gallery-stadium", "Arrival in Abu Dhabi", "TRAVEL", "/images/demo/gallery-stadium.jpg"],
];
for (const [index, item] of gallery.entries()) {
  await prisma.gallery.update({ where: { id: item[0] }, data: { title: item[1], category: item[2], mediaUrl: item[3], altText: item[1], isPublished: true, isDemo: false, displayOrder: index + 1, type: "IMAGE" } });
}

await prisma.newsArticle.update({ where: { slug: "tigers-confirm-2026-squad" }, data: { coverImage: "/images/demo/news-opener.jpg", publishedAt: new Date("2026-09-20T08:00:00Z") } });
await prisma.newsArticle.update({ where: { slug: "preseason-camp-opens" }, data: { coverImage: "/images/demo/news-camp.jpg", publishedAt: new Date("2026-09-22T08:00:00Z") } });
await prisma.newsArticle.upsert({
  where: { slug: "tigers-open-with-eight-run-win" },
  update: { coverImage: "/images/demo/news-result.jpg", publishedAt: new Date("2026-09-24T18:00:00Z"), status: "PUBLISHED", isDemo: false },
  create: {
    slug: "tigers-open-with-eight-run-win",
    title: "Tigers open the season with an eight-run win",
    excerpt: "Fakhar Zaman’s 54 set up 142 for 4, and the bowlers held Northern Strikers to 134 for 7.",
    content: "United Tigers began their Abu Dhabi T10 season with an eight-run win over Northern Strikers at the Zayed Cricket Stadium.\n\nFakhar Zaman made 54 from 22 balls and Azmatullah Omarzai added 18 as the Tigers posted 142 for 4. Abbas Afridi, Faheem Ashraf and Paul van Meekeren then kept the chase in check.",
    category: "MATCH REPORT",
    coverImage: "/images/demo/news-result.jpg",
    authorName: "United Tigers",
    status: "PUBLISHED",
    isDemo: false,
    isFeatured: true,
    publishedAt: new Date("2026-09-24T18:00:00Z"),
  },
});

await prisma.teamUpdate.update({ where: { slug: "nets-session-complete" }, data: { image: "/images/demo/update-nets.jpg" } });
await prisma.teamUpdate.update({ where: { slug: "squad-arrives-in-abu-dhabi" }, data: { image: "/images/demo/gallery-stadium.jpg" } });
await prisma.teamUpdate.update({ where: { slug: "captain-leads-first-drill" }, data: { image: "/images/demo/fakhar-zaman.jpg" } });

const fixtures = [
  { slug: "united-tigers-vs-northern-strikers", opponent: "Northern Strikers", opponentShort: "NS", date: new Date("2026-09-24T14:00:00Z"), status: "COMPLETED", result: "United Tigers won by 8 runs", matchNumber: "MATCH 01", toss: "United Tigers won the toss and elected to bat", tigersFirst: true, tigers: { runs: 142, wickets: 4 }, opponentScore: { runs: 134, wickets: 7 }, batting: { fakhar: 54, iftikhar: 31, azmatullah: 18, nurul: 12 }, bowling: { abbas: [1, 24], faheem: [1, 22], paul: [2, 18], odean: [0, 27] } },
  { slug: "united-tigers-vs-desert-falcons", opponent: "Desert Falcons", opponentShort: "DF", date: new Date("2026-09-27T18:00:00Z"), status: "COMPLETED", result: "Desert Falcons won by 7 wickets", matchNumber: "MATCH 02", toss: "Desert Falcons won the toss and elected to field", tigersFirst: true, tigers: { runs: 118, wickets: 6 }, opponentScore: { runs: 119, wickets: 3 }, batting: { fakhar: 36, iftikhar: 40, azmatullah: 22, nurul: 8 }, bowling: { abbas: [1, 21], faheem: [1, 19], paul: [1, 16], odean: [0, 28] } },
  { slug: "united-tigers-vs-capital-chargers", opponent: "Capital Chargers", opponentShort: "CC", date: new Date("2026-10-04T14:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 03", toss: null },
  { slug: "united-tigers-vs-harbour-lions", opponent: "Harbour Lions", opponentShort: "HL", date: new Date("2026-10-07T18:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 04", toss: null },
  { slug: "united-tigers-vs-marina-kings", opponent: "Marina Kings", opponentShort: "MK", date: new Date("2026-10-10T14:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 05", toss: null },
  { slug: "united-tigers-vs-oasis-riders", opponent: "Oasis Riders", opponentShort: "OR", date: new Date("2026-10-13T18:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 06", toss: null },
  { slug: "united-tigers-vs-skyline-hawks", opponent: "Skyline Hawks", opponentShort: "SH", date: new Date("2026-10-16T14:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 07", toss: null },
];

const keep = new Set(fixtures.map((fixture) => fixture.slug));
await prisma.match.updateMany({ where: { isDemo: false, slug: { notIn: [...keep] } }, data: { isDemo: true } });

for (const fixture of fixtures) {
  const match = await prisma.match.upsert({
    where: { slug: fixture.slug },
    update: { opponent: fixture.opponent, opponentShort: fixture.opponentShort, date: fixture.date, status: fixture.status, result: fixture.result, matchNumber: fixture.matchNumber, toss: fixture.toss, competition: "Abu Dhabi T10", isDemo: false, seasonId: season.id, venueId: venue.id },
    create: { slug: fixture.slug, opponent: fixture.opponent, opponentShort: fixture.opponentShort, date: fixture.date, status: fixture.status, result: fixture.result, matchNumber: fixture.matchNumber, toss: fixture.toss, competition: "Abu Dhabi T10", isDemo: false, seasonId: season.id, venueId: venue.id },
  });
  await prisma.fieldingPerformance.deleteMany({ where: { matchId: match.id } });
  await prisma.innings.deleteMany({ where: { matchId: match.id } });
  await prisma.matchTeam.deleteMany({ where: { matchId: match.id } });
  await prisma.matchTeam.createMany({ data: [
    { matchId: match.id, teamName: "United Tigers", isHome: true, result: fixture.result?.startsWith("United Tigers won") ? "won" : fixture.status === "COMPLETED" ? "lost" : null },
    { matchId: match.id, teamName: fixture.opponent, isHome: false, result: fixture.result?.startsWith(`${fixture.opponent} won`) ? "won" : fixture.status === "COMPLETED" ? "lost" : null },
  ] });
  if (fixture.status !== "COMPLETED") continue;
  const inningsOne = await prisma.innings.create({ data: { matchId: match.id, number: 1, battingTeam: "United Tigers", runs: fixture.tigers.runs, wickets: fixture.tigers.wickets, overs: 10 } });
  const inningsTwo = await prisma.innings.create({ data: { matchId: match.id, number: 2, battingTeam: fixture.opponent, runs: fixture.opponentScore.runs, wickets: fixture.opponentScore.wickets, overs: 10 } });
  await prisma.battingPerformance.createMany({ data: [
    { inningsId: inningsOne.id, playerId: players["fakhar-zaman"].id, runs: fixture.batting.fakhar, balls: 22, fours: 6, sixes: 2, dismissal: "caught" },
    { inningsId: inningsOne.id, playerId: players["iftikhar-ahmed"].id, runs: fixture.batting.iftikhar, balls: 16, fours: 2, sixes: 2, dismissal: "bowled" },
    { inningsId: inningsOne.id, playerId: players["azmatullah-omarzai"].id, runs: fixture.batting.azmatullah, balls: 18, fours: 1, sixes: 1, dismissal: "caught" },
    { inningsId: inningsOne.id, playerId: players["nurul-hasan"].id, runs: fixture.batting.nurul, balls: 8, fours: 1, sixes: 0, dismissal: "not out" },
  ] });
  await prisma.bowlingPerformance.createMany({ data: [
    { inningsId: inningsTwo.id, playerId: players["abbas-afridi"].id, overs: 2, maidens: 0, runs: fixture.bowling.abbas[1], wickets: fixture.bowling.abbas[0] },
    { inningsId: inningsTwo.id, playerId: players["faheem-ashraf"].id, overs: 2, maidens: 0, runs: fixture.bowling.faheem[1], wickets: fixture.bowling.faheem[0] },
    { inningsId: inningsTwo.id, playerId: players["paul-van-meekeren"].id, overs: 2, maidens: 0, runs: fixture.bowling.paul[1], wickets: fixture.bowling.paul[0] },
    { inningsId: inningsTwo.id, playerId: players["odean-smith"].id, overs: 2, maidens: 0, runs: fixture.bowling.odean[1], wickets: fixture.bowling.odean[0] },
  ] });
  await prisma.fieldingPerformance.create({ data: { matchId: match.id, playerId: players["nurul-hasan"].id, catches: 1, stumpings: fixture.slug.includes("northern") ? 1 : 0 } });
}

const visible = await prisma.match.findMany({ where: { isDemo: false }, select: { slug: true, status: true }, orderBy: { date: "asc" } });
console.log(visible.map((match) => `${match.status} ${match.slug}`).join("\n"));
await prisma.$disconnect();
