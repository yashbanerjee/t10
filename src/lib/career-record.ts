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

/** Form field key → stored T20 International record key. Kept apart from the club career record. */
export const t20FormKeys = Object.fromEntries(Object.entries(careerFormKeys).map(([formKey, recordKey]) => [formKey.replace(/^career/, "t20"), recordKey])) as Record<string, keyof CareerRecord>;

function recordFromForm(body: Record<string, unknown>, keys: Record<string, string>, jsonKey: string) {
  const record: Record<string, unknown> = {};
  let touched = false;
  for (const [formKey, recordKey] of Object.entries(keys)) {
    if (formKey in body) { record[recordKey] = body[formKey]; touched = true; }
    delete body[formKey];
  }
  if (jsonKey in body) {
    touched = true;
    if (body[jsonKey] && typeof body[jsonKey] === "object") Object.assign(record, body[jsonKey]);
  }
  return { ...cleanCareer(record), touched };
}

export function careerFromForm(body: Record<string, unknown>) {
  return recordFromForm(body, careerFormKeys, "careerRecord");
}

/** `touched` is false when the request carried no T20 fields, so the stored record is left alone. */
export function t20FromForm(body: Record<string, unknown>) {
  return recordFromForm(body, t20FormKeys, "t20Record");
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

export function flattenCareer(record: unknown, keys: Record<string, string> = careerFormKeys) {
  const cleaned = readCareer(record);
  const values: Record<string, string | number> = {};
  for (const [formKey, recordKey] of Object.entries(keys)) {
    const item = cleaned?.[recordKey as keyof CareerRecord];
    values[formKey] = item == null ? "" : item;
  }
  return values;
}
