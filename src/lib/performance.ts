export type PlayerPerformanceInput = {
  matches: number;
  innings: number;
  runs: number;
  average: number | null;
  strikeRate: number | null;
  wickets: number;
  economy: number | null;
  catches: number;
  runOuts: number;
  stumpings: number;
};

export type PlayerReportCard = { overall: number; batting: number | null; bowling: number | null; fielding: number | null };
const bounded = (value: number, max: number) => Math.round(Math.min(max, Math.max(0, value)));

/** A transparent club-only index derived from verified scorecard totals. */
export function calculatePlayerReport(input: PlayerPerformanceInput): PlayerReportCard | null {
  const battingAvailable = input.innings > 0;
  const bowlingAvailable = input.wickets > 0 || input.economy !== null;
  const fieldingAvailable = input.catches + input.runOuts + input.stumpings > 0;
  const metrics = [
    battingAvailable ? bounded(input.runs * 0.5 + Math.max(0, (input.strikeRate ?? 80) - 80) * 0.5 + Math.max(0, (input.average ?? 10) - 10), 100) : null,
    bowlingAvailable ? bounded(input.wickets * 12 + Math.max(0, 12 - (input.economy ?? 12)) * 4, 100) : null,
    fieldingAvailable ? bounded(input.catches * 15 + input.runOuts * 20 + input.stumpings * 15, 100) : null,
  ];
  const available = metrics.filter((value): value is number => value !== null);
  if (!available.length) return null;
  return { overall: Math.round(available.reduce((sum, value) => sum + value, 0) / available.length), batting: metrics[0], bowling: metrics[1], fielding: metrics[2] };
}
