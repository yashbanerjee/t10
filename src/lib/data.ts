import { prisma } from "@/lib/db";
import { demoPlayers, sampleNews, sampleUpdates } from "@/lib/demo";
import { PRIVATE_SETTING_KEYS } from "@/lib/site-settings";
import { LEAGUE_TEAMS } from "@/lib/league";

export async function getPlayers() {
  try {
    const players = await prisma.player.findMany({ where: { isActive: true, isDemo: false }, orderBy: [{ displayOrder: "asc" }, { fullName: "asc" }] });
    return players.length ? players : demoPlayers;
  } catch {
    return demoPlayers;
  }
}

export async function getStaff() {
  try { return await prisma.staffMember.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { displayOrder: "asc" }] }); }
  catch { return []; }
}

export async function getPlayerBySlug(slug: string) {
  try {
    const player = await prisma.player.findFirst({ where: { slug, isDemo: false } });
    if (player) return player;
  } catch { /* no database configured in the visual demo */ }
  return demoPlayers.find((player) => player.slug === slug) ?? null;
}

export async function getMatches() {
  try {
    return await prisma.match.findMany({ where: { isDemo: false }, include: { venue: true, season: true, innings: { orderBy: { number: "asc" } } }, orderBy: { date: "asc" } });
  } catch {
    return [];
  }
}

export async function getMatchBySlug(slug: string) {
  try { return await prisma.match.findFirst({ where: { slug, isDemo: false }, include: { venue: true, tournament: true, innings: { orderBy: { number: "asc" }, include: { batting: { include: { player: true } }, bowling: { include: { player: true } } } } } }); }
  catch { return null; }
}

export async function getNews() {
  try {
    const rows = await prisma.newsArticle.findMany({ where: { status: "PUBLISHED", isDemo: false, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 12 });
    return rows.length ? rows : sampleNews;
  } catch {
    return sampleNews;
  }
}

export async function getNewsBySlug(slug: string) {
  try {
    const row = await prisma.newsArticle.findFirst({ where: { slug, status: "PUBLISHED" } });
    if (row) return row;
  } catch { /* visual demo fallback */ }
  return sampleNews.find((item) => item.slug === slug) ?? null;
}

export async function getUpdates() {
  try {
    const rows = await prisma.teamUpdate.findMany({ where: { isPublished: true, isDemo: false, publishedAt: { lte: new Date() } }, include: { player: true }, orderBy: { publishedAt: "desc" }, take: 20 });
    return rows.length ? rows : sampleUpdates;
  } catch {
    return sampleUpdates;
  }
}

export async function getUpdateBySlug(slug: string) {
  try {
    const row = await prisma.teamUpdate.findFirst({ where: { slug, isPublished: true }, include: { player: true } });
    if (row) return row;
  } catch { /* visual demo fallback */ }
  return sampleUpdates.find((item) => item.slug === slug) ?? null;
}

export async function getPublicSettings() {
  try {
    const rows = await prisma.siteSetting.findMany();
    return Object.fromEntries(rows.filter((row) => !PRIVATE_SETTING_KEYS.has(row.key)).map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export async function getSponsors() {
  try { return await prisma.sponsor.findMany({ where: { isPublished: true, isDemo: false }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }); }
  catch { return []; }
}

export async function getRecords() {
  try { return await prisma.teamRecord.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" } }); }
  catch { return []; }
}

export async function getGallery() {
  try { return await prisma.gallery.findMany({ where: { isPublished: true, isDemo: false }, orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] }); }
  catch { return []; }
}

export async function getPointsTable() {
  try {
    const matches = await prisma.match.findMany({ where: { isDemo: false, status: "COMPLETED", season: { isCurrent: true, isDemo: false } }, include: { matchTeams: true, innings: true }, orderBy: { date: "asc" } });
    type TableRow = { teamName: string; played: number; won: number; lost: number; noResult: number; points: number; runsFor: number; ballsFor: number; runsAgainst: number; ballsAgainst: number };
    const table = new Map<string, TableRow>();
    const ballsIn = (value: number) => Math.trunc(value) * 6 + Math.round((value - Math.trunc(value)) * 10);
    const row = (teamName: string) => {
      let entry = table.get(teamName);
      if (!entry) { entry = { teamName, played: 0, won: 0, lost: 0, noResult: 0, points: 0, runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0 }; table.set(teamName, entry); }
      return entry;
    };
    for (const match of matches) {
      const teams = match.matchTeams.map((team) => team.teamName.trim()).filter(Boolean);
      if (teams.length !== 2 || match.innings.length < 2) continue;
      const first = row(teams[0]!); const second = row(teams[1]!);
      const byTeam = new Map(teams.map((name) => [name.toLowerCase(), name]));
      const totals = new Map<string, { runs: number; balls: number; wickets: number }>();
      for (const innings of match.innings) {
        const name = byTeam.get(innings.battingTeam.trim().toLowerCase());
        if (!name) continue;
        const value = totals.get(name) ?? { runs: 0, balls: 0, wickets: 0 };
        value.runs += innings.runs;
        value.balls += innings.wickets >= 10 ? 60 : ballsIn(Number(innings.overs));
        value.wickets += innings.wickets;
        totals.set(name, value);
      }
      if (!totals.has(teams[0]!) || !totals.has(teams[1]!)) continue;
      for (const team of [first, second]) { team.played++; const scored = totals.get(team.teamName)!; const conceded = totals.get(team === first ? teams[1]! : teams[0]!)!; team.runsFor += scored.runs; team.ballsFor += scored.balls; team.runsAgainst += conceded.runs; team.ballsAgainst += conceded.balls; }
      const resultText = (match.result || "").toLowerCase();
      const explicitWinner = teams.find((name, index) => /\b(win|won)\b/i.test(match.matchTeams[index]?.result || "") || resultText.includes(`${name.toLowerCase()} won`) || resultText.includes(`${name.toLowerCase()} win`));
      if (explicitWinner) { const winner = row(explicitWinner); const loser = row(teams.find((name) => name !== explicitWinner)!); winner.won++; winner.points += 2; loser.lost++; }
      else if (/no result|abandon|cancel|tied|tie\b/i.test(resultText)) { first.noResult++; second.noResult++; first.points++; second.points++; }
      else if (/\b(loss|lost)\b/i.test(match.matchTeams[0]?.result || "")) { first.lost++; second.won++; second.points += 2; }
      else if (/\b(loss|lost)\b/i.test(match.matchTeams[1]?.result || "")) { second.lost++; first.won++; first.points += 2; }
    }
    type StandingRow = { teamName: string; played: number; won: number; lost: number; noResult: number; points: number; netRunRate: number; manual: boolean };
    const calculated = new Map<string, StandingRow>([...table.values()].map((team) => [team.teamName.toLowerCase(), { ...team, netRunRate: team.ballsFor && team.ballsAgainst ? Number((team.runsFor / (team.ballsFor / 6) - team.runsAgainst / (team.ballsAgainst / 6)).toFixed(3)) : 0, manual: false }]));
    // Rows entered in admin (Points table) override the calculated figures for that team.
    const entered = await prisma.pointsEntry.findMany({ where: { isDemo: false, season: { isCurrent: true } } });
    const manual = new Map<string, StandingRow & { position: number }>(entered.map((entry) => [entry.teamName.trim().toLowerCase(), { teamName: entry.teamName.trim(), played: entry.played, won: entry.won, lost: entry.lost, noResult: entry.noResult, points: entry.points, netRunRate: Number(entry.netRunRate), position: entry.position, manual: true }]));
    // Every league team is listed, including those yet to play, so the table always shows the full competition.
    const names = [...new Set([...LEAGUE_TEAMS.map((team) => team.name), ...entered.map((entry) => entry.teamName.trim()), ...[...table.values()].map((team) => team.teamName)].map((name) => name.toLowerCase()))];
    const rows = names.map((key) => manual.get(key) ?? calculated.get(key) ?? { teamName: LEAGUE_TEAMS.find((team) => team.name.toLowerCase() === key)?.name ?? key, played: 0, won: 0, lost: 0, noResult: 0, points: 0, netRunRate: 0, manual: false });
    const pinned = (row: StandingRow) => ("position" in row && typeof row.position === "number" && row.position > 0 ? row.position : 0);
    // Teams without a pinned position are ranked on points, then net run rate; pinned teams are then slotted into the place set in admin.
    const ordered = rows.filter((row) => !pinned(row)).sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate || b.won - a.won || a.teamName.localeCompare(b.teamName));
    for (const row of rows.filter(pinned).sort((a, b) => pinned(a) - pinned(b))) ordered.splice(Math.min(pinned(row) - 1, ordered.length), 0, row);
    return ordered.map((team, index) => ({ teamName: team.teamName, played: team.played, won: team.won, lost: team.lost, noResult: team.noResult, points: team.points, netRunRate: team.netRunRate, position: index + 1 }));
  } catch { return []; }
}

const asMoney = (value: { toString(): string } | number | null | undefined) => value == null ? null : Number(value);

export async function getProducts() {
  try {
    const rows = await prisma.product.findMany({ where: { isPublished: true }, include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } }, orderBy: { createdAt: "desc" } });
    return rows.map((product) => ({ ...product, price: Number(product.price), variants: product.variants.map((variant) => ({ ...variant, price: asMoney(variant.price) })) }));
  } catch { return []; }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findFirst({ where: { slug, isPublished: true }, include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } } });
    return product ? { ...product, price: Number(product.price), variants: product.variants.map((variant) => ({ ...variant, price: asMoney(variant.price) })) } : null;
  } catch { return null; }
}

export async function getPolls() {
  try {
    const rows = await prisma.poll.findMany({ where: { isPublished: true }, include: { options: { orderBy: { displayOrder: "asc" }, include: { _count: { select: { votes: true } } } } }, orderBy: { createdAt: "desc" } });
    return rows.map((poll) => ({ id: poll.id, title: poll.title, slug: poll.slug, question: poll.question, description: poll.description, closesAt: poll.closesAt, options: poll.options.map((option) => ({ id: option.id, label: option.label, votes: option._count.votes })) }));
  } catch { return []; }
}

export async function getPollBySlug(slug: string) {
  const polls = await getPolls();
  return polls.find((poll) => poll.slug === slug) ?? null;
}

export async function getContests() {
  try {
    const rows = await prisma.contest.findMany({ where: { isPublished: true }, include: { _count: { select: { entries: true } } }, orderBy: { createdAt: "desc" } });
    return rows.map((contest) => ({ ...contest, entries: contest._count.entries }));
  } catch { return []; }
}

export async function getContestBySlug(slug: string) {
  const contests = await getContests();
  return contests.find((contest) => contest.slug === slug) ?? null;
}

export async function getCurrentSeason() {
  try { return (await prisma.season.findFirst({ where: { isCurrent: true }, orderBy: { year: "desc" } })) ?? { year: 2026, name: "2026 Season", isDemo: false }; }
  catch { return { year: 2026, name: "2026 Season", isDemo: false }; }
}

