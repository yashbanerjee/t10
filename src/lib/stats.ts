import { prisma } from "@/lib/db";

type Batting = { innings: { id: string; matchId: string; match: { season: { year: number } } }; runs: number; balls: number; fours: number; sixes: number; dismissal: string | null };
type Bowling = { innings: { matchId: string; match: { season: { year: number } } }; overs: { toNumber(): number } | number; runs: number; wickets: number; maidens: number };

function oversToBalls(overs: number) {
  const whole = Math.trunc(overs);
  const balls = Math.round((overs - whole) * 10);
  return whole * 6 + balls;
}

function ballsToOversText(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

type Fielding = { catches: number; runOuts: number; stumpings: number; match: { season: { year: number } } };
export function summarize(batting: Batting[], bowling: Bowling[], fielding: Fielding[], year?: number) {
  const b = year ? batting.filter((x) => x.innings.match.season.year === year) : batting;
  const w = year ? bowling.filter((x) => x.innings.match.season.year === year) : bowling;
  const f = year ? fielding.filter((x) => x.match.season.year === year) : fielding;
  const battingBalls = b.reduce((n, x) => n + x.balls, 0);
  const bowlingBalls = w.reduce((n, x) => n + oversToBalls(typeof x.overs === "number" ? x.overs : x.overs.toNumber()), 0);
  const runs = b.reduce((n, x) => n + x.runs, 0);
  const conceded = w.reduce((n, x) => n + x.runs, 0);
  const wickets = w.reduce((n, x) => n + x.wickets, 0);
    const outs = b.filter((x) => Boolean(x.dismissal) && !["not out", "retired hurt", "retired not out"].includes(x.dismissal!.toLowerCase())).length;
  const scores = b.map((x) => x.runs);
  return {
    matches: new Set([...b.map((x) => x.innings.matchId), ...w.map((x) => x.innings.matchId)]).size,
    innings: b.length,
    runs,
    average: outs ? runs / outs : null,
    strikeRate: battingBalls ? (runs / battingBalls) * 100 : null,
    highestScore: scores.length ? Math.max(...scores) : 0,
    fifties: scores.filter((score) => score >= 50 && score < 100).length,
    hundreds: scores.filter((score) => score >= 100).length,
    fours: b.reduce((n, x) => n + x.fours, 0),
    sixes: b.reduce((n, x) => n + x.sixes, 0),
    bowlingOvers: ballsToOversText(bowlingBalls),
    bowlingRuns: conceded,
    wickets,
    economy: bowlingBalls ? conceded / (bowlingBalls / 6) : null,
    bowlingAverage: wickets ? conceded / wickets : null,
    bowlingStrikeRate: wickets ? bowlingBalls / wickets : null,
    catches: f.reduce((n, x) => n + x.catches, 0),
    runOuts: f.reduce((n, x) => n + x.runOuts, 0),
    stumpings: f.reduce((n, x) => n + x.stumpings, 0),
  };
}

export async function getStatsLeaderboard(year = 2026) {
  try {
    const players = await prisma.player.findMany({
      where: { isActive: true, isDemo: false },
      include: {
        batting: { where: { innings: { match: { isDemo: false, season: { year } } } }, include: { innings: { include: { match: { include: { season: true } } } } } },
        bowling: { where: { innings: { match: { isDemo: false, season: { year } } } }, include: { innings: { include: { match: { include: { season: true } } } } } },
        fielding: { where: { match: { isDemo: false, season: { year } } }, include: { match: { include: { season: true } } } },
      },
      orderBy: [{ displayOrder: "asc" }, { fullName: "asc" }],
    });
    return players.map((player) => ({ player, stats: summarize(player.batting as unknown as Batting[], player.bowling as unknown as Bowling[], player.fielding, year) }));
  } catch {
    return [];
  }
}

export async function getPlayerStats(playerId: string, currentYear = 2026) {
  try {
    const player = await prisma.player.findUnique({ where: { id: playerId }, include: {
      batting: { where: { innings: { match: { isDemo: false } } }, include: { innings: { include: { match: { include: { season: true } } } } } },
      bowling: { where: { innings: { match: { isDemo: false } } }, include: { innings: { include: { match: { include: { season: true } } } } } },
      fielding: { where: { match: { isDemo: false } }, include: { match: { include: { season: true } } } },
    } });
    if (!player) return { currentSeason: null, career: null };
    return {
      currentSeason: summarize(player.batting as unknown as Batting[], player.bowling as unknown as Bowling[], player.fielding, currentYear),
      career: summarize(player.batting as unknown as Batting[], player.bowling as unknown as Bowling[], player.fielding),
    };
  } catch {
    return { currentSeason: null, career: null };
  }
}

