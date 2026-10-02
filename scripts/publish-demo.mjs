import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutBucketPolicyCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const endpoint = process.env.STORAGE_ENDPOINT?.replace(/\/$/, "");
const bucket = process.env.STORAGE_BUCKET;
const accessKey = process.env.STORAGE_ACCESS_KEY;
const secretKey = process.env.STORAGE_SECRET_KEY;
const region = process.env.STORAGE_REGION || "auto";
if (!endpoint || !bucket || !accessKey || !secretKey) {
  throw new Error("Set STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY before running this script.");
}

const prisma = new PrismaClient();
const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});
const generated = path.join(process.cwd(), "scripts", "generated");

async function upload(fileName, key) {
  const body = await readFile(path.join(generated, fileName));
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
    ACL: "public-read",
  }));
  return `${endpoint}/${bucket}/${key}`;
}

try {
  await client.send(new PutBucketPolicyCommand({
    Bucket: bucket,
    Policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Sid: "PublicReadUnitedTigersMedia",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/united-tigers/*`],
      }],
    }),
  }));
  console.log("Storage prefix is publicly readable.");
} catch (error) {
  console.log(`Bucket policy was not updated (${error.name || "error"}). Uploads will still be saved.`);
}

let storageReady = true;
try {
  await upload("fakhar-zaman.png", "united-tigers/players/fakhar-zaman.png");
} catch (error) {
  storageReady = false;
  console.log(`Storage upload skipped (${error.Code || error.name}). Player images will use files shipped with the site.`);
}

const local = (file) => `/images/demo/${file}`;
const files = storageReady ? {
  "fakhar-zaman": `${endpoint}/${bucket}/united-tigers/players/fakhar-zaman.png`,
  "iftikhar-ahmed": await upload("iftikhar-ahmed.png", "united-tigers/players/iftikhar-ahmed.png"),
  "faheem-ashraf": await upload("faheem-ashraf.png", "united-tigers/players/faheem-ashraf.png"),
  "azmatullah-omarzai": await upload("azmatullah-omarzai.png", "united-tigers/players/azmatullah-omarzai.png"),
  "abbas-afridi": await upload("abbas-afridi.png", "united-tigers/players/abbas-afridi.png"),
  "odean-smith": await upload("odean-smith.png", "united-tigers/players/odean-smith.png"),
  "nurul-hasan": await upload("nurul-hasan.png", "united-tigers/players/nurul-hasan.png"),
  "paul-van-meekeren": await upload("paul-van-meekeren.png", "united-tigers/players/paul-van-meekeren.png"),
  "adithya-shetty": await upload("adithya-shetty.png", "united-tigers/players/adithya-shetty.png"),
  training: await upload("gallery-training.png", "united-tigers/gallery/training.png"),
  matchNight: await upload("gallery-match.png", "united-tigers/gallery/match-night.png"),
  huddle: await upload("gallery-huddle.png", "united-tigers/gallery/huddle.png"),
  stadium: await upload("gallery-stadium.png", "united-tigers/gallery/stadium.png"),
  newsOpener: await upload("news-opener.png", "united-tigers/news/season-opener.png"),
  newsCamp: await upload("news-camp.png", "united-tigers/news/preseason-camp.png"),
  updateNets: await upload("update-nets.png", "united-tigers/updates/nets.png"),
  sponsorTitle: await upload("sponsor-title.png", "united-tigers/sponsors/title.png"),
  sponsorKit: await upload("sponsor-kit.png", "united-tigers/sponsors/kit.png"),
  sponsorMedia: await upload("sponsor-media.png", "united-tigers/sponsors/media.png"),
  sponsorOfficial: `${endpoint}/${bucket}/united-tigers/sponsors/official.png`,
} : {
  "fakhar-zaman": local("fakhar-zaman.png"),
  "iftikhar-ahmed": local("iftikhar-ahmed.png"),
  "faheem-ashraf": local("faheem-ashraf.png"),
  "azmatullah-omarzai": local("azmatullah-omarzai.png"),
  "abbas-afridi": local("abbas-afridi.png"),
  "odean-smith": local("odean-smith.png"),
  "nurul-hasan": local("nurul-hasan.png"),
  "paul-van-meekeren": local("paul-van-meekeren.png"),
  "adithya-shetty": local("adithya-shetty.png"),
  training: local("gallery-training.png"),
  matchNight: local("gallery-match.png"),
  huddle: local("gallery-huddle.png"),
  stadium: local("gallery-stadium.png"),
  newsOpener: local("news-opener.png"),
  newsCamp: local("news-camp.png"),
  updateNets: local("update-nets.png"),
  sponsorTitle: local("sponsor-title.png"),
  sponsorKit: local("sponsor-kit.png"),
  sponsorMedia: local("sponsor-media.png"),
  sponsorOfficial: local("sponsor-official.png"),
};

if (storageReady) {
  const names = [
    ["iftikhar-ahmed.png", "united-tigers/players/iftikhar-ahmed.png"],
    ["faheem-ashraf.png", "united-tigers/players/faheem-ashraf.png"],
    ["azmatullah-omarzai.png", "united-tigers/players/azmatullah-omarzai.png"],
    ["abbas-afridi.png", "united-tigers/players/abbas-afridi.png"],
    ["odean-smith.png", "united-tigers/players/odean-smith.png"],
    ["nurul-hasan.png", "united-tigers/players/nurul-hasan.png"],
    ["paul-van-meekeren.png", "united-tigers/players/paul-van-meekeren.png"],
    ["adithya-shetty.png", "united-tigers/players/adithya-shetty.png"],
    ["gallery-training.png", "united-tigers/gallery/training.png"],
    ["gallery-match.png", "united-tigers/gallery/match-night.png"],
    ["gallery-huddle.png", "united-tigers/gallery/huddle.png"],
    ["gallery-stadium.png", "united-tigers/gallery/stadium.png"],
    ["news-opener.png", "united-tigers/news/season-opener.png"],
    ["news-camp.png", "united-tigers/news/preseason-camp.png"],
    ["update-nets.png", "united-tigers/updates/nets.png"],
    ["sponsor-title.png", "united-tigers/sponsors/title.png"],
    ["sponsor-kit.png", "united-tigers/sponsors/kit.png"],
    ["sponsor-media.png", "united-tigers/sponsors/media.png"],
    ["sponsor-official.png", "united-tigers/sponsors/official.png"],
  ];
  for (const [fileName, key] of names) await upload(fileName, key);
  const probe = await fetch(files["fakhar-zaman"]);
  console.log(`Public image check: ${probe.status}`);
}

const publicUrl = endpoint;
await prisma.siteSetting.upsert({
  where: { key: "storage" },
  create: { key: "storage", value: { endpoint, bucket, accessKey, secretKey, region, publicUrl } },
  update: { value: { endpoint, bucket, accessKey, secretKey, region, publicUrl } },
});
await prisma.siteSetting.upsert({
  where: { key: "siteUrl" },
  create: { key: "siteUrl", value: "https://t10-production.up.railway.app" },
  update: { value: "https://t10-production.up.railway.app" },
});

const profiles = [
  { slug: "fakhar-zaman", role: "BATTER", jerseyNumber: 10, nationality: "Pakistan", country: "Pakistan", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox", isCaptain: true, isIconPlayer: true, bio: "Icon player and captain for the 2026 season. Opens the batting and sets the tone for the Tigers." },
  { slug: "iftikhar-ahmed", role: "ALL_ROUNDER", jerseyNumber: 95, nationality: "Pakistan", country: "Pakistan", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm offbreak", bio: "Middle-order batter who can also bowl offspin through the middle overs." },
  { slug: "faheem-ashraf", role: "ALL_ROUNDER", jerseyNumber: 32, nationality: "Pakistan", country: "Pakistan", battingStyle: "Left-hand bat", bowlingStyle: "Right-arm fast-medium", isViceCaptain: true, bio: "Vice-captain. Bowls at the death and offers a left-hand option down the order." },
  { slug: "azmatullah-omarzai", role: "ALL_ROUNDER", jerseyNumber: 50, nationality: "Afghanistan", country: "Afghanistan", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast", bio: "Seam-bowling all-rounder used in the powerplay and at the death." },
  { slug: "abbas-afridi", role: "BOWLER", jerseyNumber: 81, nationality: "Pakistan", country: "Pakistan", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", bio: "Frontline quick who looks for wickets with the new ball." },
  { slug: "odean-smith", role: "ALL_ROUNDER", jerseyNumber: 58, nationality: "West Indies", country: "West Indies", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", bio: "Power hitter and seam option through the middle overs." },
  { slug: "nurul-hasan", role: "WICKETKEEPER", jerseyNumber: 77, nationality: "Bangladesh", country: "Bangladesh", battingStyle: "Right-hand bat", bio: "Wicketkeeper-batter who finishes innings and keeps to both pace and spin." },
  { slug: "paul-van-meekeren", role: "BOWLER", jerseyNumber: 18, nationality: "Netherlands", country: "Netherlands", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", bio: "Experienced seamer trusted with both new-ball and death overs." },
  { slug: "adithya-shetty", role: "BATTER", jerseyNumber: 7, nationality: "India", country: "India", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm offbreak", bio: "Top-order batter in the Tigers squad for the 2026 T10 season." },
];

for (const profile of profiles) {
  await prisma.player.update({
    where: { slug: profile.slug },
    data: { ...profile, profileImage: files[profile.slug], isDemo: false, isActive: true },
  });
}

const players = Object.fromEntries((await prisma.player.findMany({ where: { slug: { in: profiles.map((item) => item.slug) } } })).map((player) => [player.slug, player]));
const team = await prisma.team.findUnique({ where: { slug: "united-tigers" } });
const season = await prisma.season.findFirst({ where: { isCurrent: true } });
const venue = await prisma.venue.findFirst({ where: { name: "Zayed Cricket Stadium" } });
if (!team || !season || !venue) throw new Error("Seed the database before publishing demo content.");

const staff = [
  { fullName: "Haroon Qureshi", title: "Head coach", category: "COACHING", displayOrder: 1, bio: "Leads match preparation and the playing group for the 2026 season." },
  { fullName: "Daniel Okoye", title: "Bowling coach", category: "COACHING", displayOrder: 2, bio: "Works with the pace unit on plans for ten-over cricket." },
  { fullName: "Layla Hassan", title: "Team manager", category: "MANAGEMENT", displayOrder: 1, bio: "Runs logistics, travel and match-day operations." },
  { fullName: "Samir Patel", title: "Physiotherapist", category: "SUPPORT", displayOrder: 1, bio: "Looks after player availability through the tournament." },
];
for (const member of staff) {
  const existing = await prisma.staffMember.findFirst({ where: { fullName: member.fullName, teamId: team.id } });
  if (existing) await prisma.staffMember.update({ where: { id: existing.id }, data: member });
  else await prisma.staffMember.create({ data: { ...member, teamId: team.id, profileImage: files.huddle } });
}

const sponsors = [
  { id: "partner-fmc-dockyard", name: "FMC Dockyard", category: "TITLE PARTNER", logoUrl: files.sponsorTitle, website: "https://t10-production.up.railway.app/partners", displayOrder: 1 },
  { id: "partner-swift-kit", name: "Swift Kit Co", category: "PRINCIPAL PARTNER", logoUrl: files.sponsorKit, website: "https://t10-production.up.railway.app/partners", displayOrder: 2 },
  { id: "partner-den-live", name: "Den Live", category: "MEDIA PARTNER", logoUrl: files.sponsorMedia, website: "https://t10-production.up.railway.app/partners", displayOrder: 3 },
  { id: "partner-harbour-gold", name: "Harbour Gold", category: "OFFICIAL PARTNER", logoUrl: files.sponsorOfficial, website: "https://t10-production.up.railway.app/partners", displayOrder: 4 },
];
for (const sponsor of sponsors) {
  await prisma.sponsor.upsert({ where: { id: sponsor.id }, update: { ...sponsor, isDemo: false, isPublished: true, teamId: team.id }, create: { ...sponsor, isDemo: false, isPublished: true, teamId: team.id } });
}

const gallery = [
  { id: "gallery-training", title: "Morning nets in Abu Dhabi", category: "TRAINING", mediaUrl: files.training },
  { id: "gallery-match", title: "Lights on at the Zayed Cricket Stadium", category: "MATCH DAY", mediaUrl: files.matchNight },
  { id: "gallery-huddle", title: "Tigers huddle before training", category: "BEHIND THE SCENES", mediaUrl: files.huddle },
  { id: "gallery-stadium", title: "Arrival in Abu Dhabi", category: "TRAVEL", mediaUrl: files.stadium },
];
for (const [index, item] of gallery.entries()) {
  await prisma.gallery.upsert({ where: { id: item.id }, update: { ...item, isDemo: false, isPublished: true, displayOrder: index + 1, altText: item.title, type: "IMAGE" }, create: { ...item, isDemo: false, isPublished: true, displayOrder: index + 1, altText: item.title, type: "IMAGE" } });
}

const articles = [
  { slug: "tigers-confirm-2026-squad", title: "Tigers confirm the 2026 squad", excerpt: "Nine names are in place as United Tigers build toward their first Abu Dhabi T10 season.", category: "TEAM NEWS", coverImage: files.newsOpener, content: "United Tigers have confirmed the first group of players for the 2026 Abu Dhabi T10.\n\nFakhar Zaman leads the squad as icon player and captain, with Faheem Ashraf named vice-captain. The group covers batting, pace, spin and wicketkeeping as the club prepares for its opening season." },
  { slug: "preseason-camp-opens", title: "Preseason camp opens in Abu Dhabi", excerpt: "The squad is into net sessions ahead of the first ball of the tournament.", category: "CAMP", coverImage: files.newsCamp, content: "The United Tigers camp is underway at the Zayed Cricket Stadium.\n\nSessions are focused on powerplay plans, death bowling and finishing innings inside ten overs. Match fixtures will be added as the official schedule is confirmed." },
];
for (const article of articles) {
  await prisma.newsArticle.upsert({
    where: { slug: article.slug },
    update: { ...article, status: "PUBLISHED", isDemo: false, isFeatured: true, authorName: "United Tigers", publishedAt: new Date("2026-10-01T12:00:00Z") },
    create: { ...article, status: "PUBLISHED", isDemo: false, isFeatured: true, authorName: "United Tigers", publishedAt: new Date("2026-10-01T12:00:00Z") },
  });
}

const updates = [
  { slug: "nets-session-complete", title: "Nets session complete", description: "The batters faced the new ball in a full training block this evening.", category: "TRAINING", image: files.updateNets, publishedAt: new Date("2026-10-02T15:00:00Z") },
  { slug: "captain-leads-first-drill", title: "Captain leads the first drill", description: "Fakhar Zaman opened the session and stayed through the fielding drills.", category: "TEAM_NEWS", image: files["fakhar-zaman"], publishedAt: new Date("2026-10-01T17:30:00Z") },
  { slug: "squad-arrives-in-abu-dhabi", title: "Squad arrives in Abu Dhabi", description: "Players and staff are on the ground and into the first team meeting.", category: "TRAVEL", image: files.stadium, publishedAt: new Date("2026-09-30T11:00:00Z") },
];
for (const update of updates) {
  await prisma.teamUpdate.upsert({
    where: { slug: update.slug },
    update: { ...update, isPublished: true, isDemo: false, content: update.description },
    create: { ...update, isPublished: true, isDemo: false, content: update.description },
  });
}

const records = [
  { id: "record-highest-score", title: "Highest individual score", value: "61", category: "BATTING", scope: "SEASON", playerName: "Azmatullah Omarzai", seasonYear: 2026 },
  { id: "record-best-bowling", title: "Best bowling figures", value: "3/19", category: "BOWLING", scope: "SEASON", playerName: "Abbas Afridi", seasonYear: 2026 },
  { id: "record-team-total", title: "Highest team total", value: "142/4", category: "TEAM", scope: "SEASON", playerName: "United Tigers", seasonYear: 2026 },
];
for (const record of records) {
  await prisma.teamRecord.upsert({ where: { id: record.id }, update: { ...record, isDemo: false, teamId: team.id }, create: { ...record, isDemo: false, teamId: team.id } });
}

const fixtures = [
  { slug: "united-tigers-vs-northern-strikers", opponent: "Northern Strikers", opponentShort: "NS", date: new Date("2026-11-08T14:00:00Z"), status: "COMPLETED", result: "United Tigers won by 8 runs", matchNumber: "MATCH 01", tigers: { runs: 142, wickets: 4 }, opponentScore: { runs: 134, wickets: 7 } },
  { slug: "united-tigers-vs-desert-falcons", opponent: "Desert Falcons", opponentShort: "DF", date: new Date("2026-11-10T14:00:00Z"), status: "COMPLETED", result: "Desert Falcons won by 7 wickets", matchNumber: "MATCH 02", tigers: { runs: 118, wickets: 6 }, opponentScore: { runs: 119, wickets: 3 } },
  { slug: "united-tigers-vs-marina-kings", opponent: "Marina Kings", opponentShort: "MK", date: new Date("2026-11-12T18:00:00Z"), status: "COMPLETED", result: "United Tigers won by 5 wickets", matchNumber: "MATCH 03", tigers: { runs: 129, wickets: 5 }, opponentScore: { runs: 128, wickets: 8 } },
  { slug: "united-tigers-vs-capital-chargers", opponent: "Capital Chargers", opponentShort: "CC", date: new Date("2026-11-18T14:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 04" },
  { slug: "united-tigers-vs-harbour-lions", opponent: "Harbour Lions", opponentShort: "HL", date: new Date("2026-11-20T18:00:00Z"), status: "UPCOMING", result: null, matchNumber: "MATCH 05" },
];

for (const fixture of fixtures) {
  const match = await prisma.match.upsert({
    where: { slug: fixture.slug },
    update: { opponent: fixture.opponent, opponentShort: fixture.opponentShort, date: fixture.date, status: fixture.status, result: fixture.result, matchNumber: fixture.matchNumber, competition: "Abu Dhabi T10", isDemo: false, seasonId: season.id, venueId: venue.id },
    create: { slug: fixture.slug, opponent: fixture.opponent, opponentShort: fixture.opponentShort, date: fixture.date, status: fixture.status, result: fixture.result, matchNumber: fixture.matchNumber, competition: "Abu Dhabi T10", isDemo: false, seasonId: season.id, venueId: venue.id },
  });
  await prisma.matchTeam.deleteMany({ where: { matchId: match.id } });
  await prisma.matchTeam.createMany({ data: [
    { matchId: match.id, teamName: "United Tigers", isHome: true, result: fixture.result?.startsWith("United Tigers won") ? "won" : fixture.status === "COMPLETED" ? "lost" : null },
    { matchId: match.id, teamName: fixture.opponent, isHome: false, result: fixture.result?.startsWith(`${fixture.opponent} won`) ? "won" : fixture.status === "COMPLETED" ? "lost" : null },
  ] });
  await prisma.innings.deleteMany({ where: { matchId: match.id } });
  if (fixture.status !== "COMPLETED") continue;
  const firstBatting = fixture.slug.includes("desert-falcons") ? "United Tigers" : fixture.slug.includes("marina-kings") ? fixture.opponent : "United Tigers";
  const secondBatting = firstBatting === "United Tigers" ? fixture.opponent : "United Tigers";
  const firstScore = firstBatting === "United Tigers" ? fixture.tigers : fixture.opponentScore;
  const secondScore = secondBatting === "United Tigers" ? fixture.tigers : fixture.opponentScore;
  const inningsOne = await prisma.innings.create({ data: { matchId: match.id, number: 1, battingTeam: firstBatting, runs: firstScore.runs, wickets: firstScore.wickets, overs: 10 } });
  const inningsTwo = await prisma.innings.create({ data: { matchId: match.id, number: 2, battingTeam: secondBatting, runs: secondScore.runs, wickets: secondScore.wickets, overs: 10 } });
  const tigersInnings = firstBatting === "United Tigers" ? inningsOne : inningsTwo;
  const bowlingInnings = firstBatting === "United Tigers" ? inningsTwo : inningsOne;
  await prisma.battingPerformance.createMany({ data: [
    { inningsId: tigersInnings.id, playerId: players["fakhar-zaman"].id, runs: fixture.slug.includes("marina-kings") ? 28 : 54, balls: 22, fours: 6, sixes: 2, dismissal: "caught" },
    { inningsId: tigersInnings.id, playerId: players["iftikhar-ahmed"].id, runs: fixture.slug.includes("desert-falcons") ? 40 : 31, balls: 16, fours: 2, sixes: 2, dismissal: "bowled" },
    { inningsId: tigersInnings.id, playerId: players["azmatullah-omarzai"].id, runs: fixture.slug.includes("marina-kings") ? 61 : 18, balls: 24, fours: 4, sixes: 3, dismissal: fixture.slug.includes("marina-kings") ? "not out" : "caught" },
    { inningsId: tigersInnings.id, playerId: players["nurul-hasan"].id, runs: 12, balls: 8, fours: 1, sixes: 0, dismissal: "not out" },
  ] });
  await prisma.bowlingPerformance.createMany({ data: [
    { inningsId: bowlingInnings.id, playerId: players["abbas-afridi"].id, overs: 2, maidens: 0, runs: fixture.slug.includes("marina-kings") ? 19 : 24, wickets: fixture.slug.includes("marina-kings") ? 3 : 1 },
    { inningsId: bowlingInnings.id, playerId: players["faheem-ashraf"].id, overs: 2, maidens: 0, runs: 22, wickets: 1 },
    { inningsId: bowlingInnings.id, playerId: players["paul-van-meekeren"].id, overs: 2, maidens: 0, runs: 18, wickets: 2 },
    { inningsId: bowlingInnings.id, playerId: players["odean-smith"].id, overs: 2, maidens: 0, runs: 27, wickets: 0 },
  ] });
  await prisma.fieldingPerformance.deleteMany({ where: { matchId: match.id } });
  await prisma.fieldingPerformance.create({ data: { matchId: match.id, playerId: players["nurul-hasan"].id, catches: 1, stumpings: fixture.slug.includes("northern-strikers") ? 1 : 0 } });
}

console.log("Demo content published.");
await prisma.$disconnect();
