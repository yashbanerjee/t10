import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";

const overs = z.coerce.number().min(0).max(10).refine((value) => Math.round((value - Math.floor(value)) * 10) <= 5, "Enter overs using cricket notation, such as 4.3");
const battingLine = z.object({ playerId: z.string().optional(), runs: z.coerce.number().int().min(0).max(500), balls: z.coerce.number().int().min(0).max(500), fours: z.coerce.number().int().min(0).max(100), sixes: z.coerce.number().int().min(0).max(100), dismissal: z.string().trim().max(120).nullable().optional() });
const bowlingLine = z.object({ playerId: z.string().optional(), overs, maidens: z.coerce.number().int().min(0).max(10), runs: z.coerce.number().int().min(0).max(500), wickets: z.coerce.number().int().min(0).max(10), wides: z.coerce.number().int().min(0).max(100), noBalls: z.coerce.number().int().min(0).max(100) });
const liveStateSchema = z.object({ innings: z.coerce.number().int().min(1).max(2).optional(), runs: z.coerce.number().int().min(0).max(1000).optional(), wickets: z.coerce.number().int().min(0).max(10).optional(), overs: z.string().trim().max(8).optional(), currentBatsmen: z.array(z.string().trim().min(1).max(100)).max(2).optional(), currentBowler: z.string().trim().max(100).optional(), partnership: z.string().trim().max(50).optional(), currentRunRate: z.coerce.number().min(0).max(100).optional(), requiredRunRate: z.coerce.number().min(0).max(100).optional(), latestEvent: z.string().trim().max(180).optional() }).nullable();
const scorecardSchema = z.object({
  innings: z.array(z.object({ number: z.coerce.number().int().min(1).max(2), battingTeam: z.string().trim().min(2).max(120), runs: z.coerce.number().int().min(0).max(1000), wickets: z.coerce.number().int().min(0).max(10), overs, batting: z.array(battingLine).max(12), bowling: z.array(bowlingLine).max(12) })).min(1).max(2),
  fielding: z.array(z.object({ playerId: z.string().min(1), catches: z.coerce.number().int().min(0).max(30), runOuts: z.coerce.number().int().min(0).max(30), stumpings: z.coerce.number().int().min(0).max(30) })).max(30).optional(),
  result: z.string().trim().max(250).nullable().optional(), status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).optional(), liveState: liveStateSchema.optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session || !hasPermission(session.role, "STATS_READ")) return failure("You do not have permission to view scorecards", 403);
  const { id } = await params;
  try {
    const [match, players] = await Promise.all([
      prisma.match.findUnique({ where: { id }, include: { venue: true, innings: { orderBy: { number: "asc" }, include: { batting: { include: { player: true } }, bowling: { include: { player: true } } } }, fielding: { include: { player: true } } } }),
      prisma.player.findMany({ where: { isActive: true, isDemo: false }, orderBy: [{ displayOrder: "asc" }, { fullName: "asc" }], select: { id: true, fullName: true } }),
    ]);
    return match ? success({ match, players }) : failure("Match not found", 404);
  } catch { return failure("Could not load scorecard", 503); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session || !hasPermission(session.role, "STATS_WRITE")) return failure("You do not have permission to edit scorecards", 403);
  const { id } = await params; const raw = await request.json().catch(() => null); const parsed = scorecardSchema.safeParse(raw);
  if (!parsed.success) return failure("Scorecard validation failed", 400, parsed.error.issues);
  const match = await prisma.match.findUnique({ where: { id } }); if (!match) return failure("Match not found", 404);
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.innings.deleteMany({ where: { matchId: id } });
      await tx.fieldingPerformance.deleteMany({ where: { matchId: id } });
      for (const entry of parsed.data.innings) {
        const innings = await tx.innings.create({ data: { matchId: id, number: entry.number, battingTeam: entry.battingTeam, runs: entry.runs, wickets: entry.wickets, overs: new Prisma.Decimal(entry.overs) } });
        const batters = entry.batting.filter((row) => row.playerId).map((row) => ({ inningsId: innings.id, playerId: row.playerId!, runs: row.runs, balls: row.balls, fours: row.fours, sixes: row.sixes, dismissal: row.dismissal || null }));
        const bowlers = entry.bowling.filter((row) => row.playerId).map((row) => ({ inningsId: innings.id, playerId: row.playerId!, overs: new Prisma.Decimal(row.overs), maidens: row.maidens, runs: row.runs, wickets: row.wickets, wides: row.wides, noBalls: row.noBalls }));
        if (batters.length) await tx.battingPerformance.createMany({ data: batters });
        if (bowlers.length) await tx.bowlingPerformance.createMany({ data: bowlers });
      }
      const fielding = (parsed.data.fielding ?? []).filter((row) => row.playerId);
      if (fielding.length) await tx.fieldingPerformance.createMany({ data: fielding.map((row) => ({ ...row, matchId: id })) });
      return tx.match.update({ where: { id }, data: { result: parsed.data.result, status: parsed.data.status, ...(parsed.data.liveState !== undefined ? { liveState: parsed.data.liveState ?? Prisma.DbNull } : {}) } });
    });
    await recordAudit(session.sub, "UPDATE_SCORECARD", "Match", id, undefined, parsed.data, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(updated, "Scorecard saved");
  } catch { return failure("Could not save scorecard. Check that each selected player belongs to the squad.", 409); }
}

