import { z } from "zod";

const stat = z.union([z.null(), z.coerce.number().min(0).max(100000)]).optional();
const overs = z.union([z.null(), z.literal(""), z.string().trim().regex(/^\d{1,4}(\.[0-5])?$/, "Overs use cricket notation, for example 48.2")]).optional();

export const careerRecordSchema = z.object({
  matches: stat,
  innings: stat,
  runs: stat,
  strikeRate: stat,
  average: stat,
  bestScore: stat,
  fifties: stat,
  hundreds: stat,
  fours: stat,
  sixes: stat,
  overs,
  wickets: stat,
  bowlingRuns: stat,
  economy: stat,
  bowlingAverage: stat,
  bowlingStrikeRate: stat,
  bestBowling: z.union([z.null(), z.literal(""), z.string().trim().regex(/^\d{1,2}\/\d{1,3}$/, "Best figures use wickets/runs, for example 4/18")]).optional(),
  catches: stat,
  runOuts: stat,
  stumpings: stat,
});

export type CareerRecord = {
  matches?: number | null;
  innings?: number | null;
  runs?: number | null;
  strikeRate?: number | null;
  average?: number | null;
  bestScore?: number | null;
  fifties?: number | null;
  hundreds?: number | null;
  fours?: number | null;
  sixes?: number | null;
  overs?: string | null;
  wickets?: number | null;
  bowlingRuns?: number | null;
  economy?: number | null;
  bowlingAverage?: number | null;
  bowlingStrikeRate?: number | null;
  bestBowling?: string | null;
  catches?: number | null;
  runOuts?: number | null;
  stumpings?: number | null;
};

/** Form field key → stored career record key. */
export const careerFormKeys = {
  careerMatches: "matches",
  careerInnings: "innings",
  careerRuns: "runs",
  careerStrikeRate: "strikeRate",
  careerAverage: "average",
  careerBest: "bestScore",
  careerFifties: "fifties",
  careerHundreds: "hundreds",
  careerFours: "fours",
  careerSixes: "sixes",
  careerOvers: "overs",
  careerWickets: "wickets",
  careerBowlingRuns: "bowlingRuns",
  careerEconomy: "economy",
  careerBowlingAverage: "bowlingAverage",
  careerBowlingStrikeRate: "bowlingStrikeRate",
  careerBestBowling: "bestBowling",
  careerCatches: "catches",
  careerRunOuts: "runOuts",
  careerStumpings: "stumpings",
} as const;

export function careerFromForm(body: Record<string, unknown>) {
  const record: Record<string, unknown> = {};
  for (const [formKey, recordKey] of Object.entries(careerFormKeys)) {
    if (formKey in body) record[recordKey] = body[formKey];
    delete body[formKey];
  }
  if ("careerRecord" in body && body.careerRecord && typeof body.careerRecord === "object") {
    Object.assign(record, body.careerRecord);
  }
  return cleanCareer(record);
}

export function cleanCareer(value: unknown): { ok: true; value: CareerRecord | null } | { ok: false; message: string } {
  const parsed = careerRecordSchema.safeParse(value ?? {});
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Career record is invalid." };
  const entries = Object.entries(parsed.data).filter(([, item]) => item != null && item !== "");
  if (!entries.length) return { ok: true, value: null };
  return { ok: true, value: Object.fromEntries(entries) as CareerRecord };
}

export function readCareer(value: unknown): CareerRecord | null {
  const cleaned = cleanCareer(value);
  return cleaned.ok ? cleaned.value : null;
}

export function flattenCareer(record: unknown) {
  const cleaned = readCareer(record);
  const values: Record<string, string | number> = {};
  for (const [formKey, recordKey] of Object.entries(careerFormKeys)) {
    const item = cleaned?.[recordKey as keyof CareerRecord];
    values[formKey] = item == null ? "" : item;
  }
  return values;
}
