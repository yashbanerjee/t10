import { z } from "zod";

/** Letters (any script), combining marks, spaces, apostrophes, hyphens and periods. Used for people and place names. */
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .\u2019-]*$/u;
/** Letters, numbers, spaces and light punctuation. Used for short descriptive labels such as batting style. */
export const TEXT_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}' .,/()&\u2019-]*$/u;

/** HTML `pattern` attribute versions of the rules above (browsers compile these with the `v` flag, so `-`, `/` and brackets are escaped). */
export const NAME_PATTERN_HTML = "[\\p{L}\\p{M}][\\p{L}\\p{M}' .’\\-]*";
export const TEXT_PATTERN_HTML = "[\\p{L}\\p{M}\\p{N}][\\p{L}\\p{M}\\p{N}' .,\\/\\(\\)&’\\-]*";
export const NAME_HINT = "Use letters, spaces, apostrophes, hyphens or periods only.";
export const TEXT_HINT = "Use letters, numbers, spaces and basic punctuation only.";

export const personName = (max: number) => z.string().trim().min(2, "Enter at least 2 characters").max(max, `Keep this under ${max} characters`).regex(NAME_PATTERN, NAME_HINT);
export const optionalName = (max: number) => z.union([z.null(), personName(max)]).optional();
export const optionalText = (max: number) => z.union([z.null(), z.string().trim().min(2, "Enter at least 2 characters").max(max, `Keep this under ${max} characters`).regex(TEXT_PATTERN, TEXT_HINT)]).optional();
export const optionalInt = (min: number, max: number) => z.union([z.null(), z.coerce.number().int("Use a whole number").min(min, `Enter ${min} or more`).max(max, `Enter ${max} or less`)]).optional();

const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
export const MIN_PLAYER_AGE = 12;
export const MAX_PLAYER_AGE = 60;

/** ISO day (YYYY-MM-DD) that is a real calendar date and gives a playing age between 12 and 60. */
export const birthDate = z.union([z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const age = (Date.now() - date.getTime()) / ONE_YEAR_MS;
  return age >= MIN_PLAYER_AGE && age <= MAX_PLAYER_AGE;
}, `Date of birth must be a real date for a player aged ${MIN_PLAYER_AGE} to ${MAX_PLAYER_AGE}`)]).optional();

/** Field rules shared by the create and edit player endpoints. */
export const playerTextRules = {
  displayName: optionalName(80),
  shortName: optionalName(40),
  country: optionalName(80),
  nationality: optionalName(80),
  battingStyle: optionalText(80),
  bowlingStyle: optionalText(80),
  dateOfBirth: birthDate,
  heightCm: optionalInt(100, 250),
  jerseyNumber: optionalInt(0, 999),
  displayOrder: optionalInt(0, 9999),
};

/** Turns zod issues into one readable sentence per field using the admin form labels. */
type Issue = { path?: unknown[]; message?: string; code?: string; minimum?: number | bigint; maximum?: number | bigint; origin?: string; format?: string };

const humanise = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

/** Zod's own wording ("Too small: expected string to have >=3 characters") is replaced; messages written in the schemas are kept. */
const isZodDefault = (message = "") => /^(Too small|Too big|Invalid|Expected|Required)/i.test(message);

function sentence(issue: Issue, label: string) {
  const min = issue.minimum != null ? Number(issue.minimum) : undefined;
  const max = issue.maximum != null ? Number(issue.maximum) : undefined;
  const message = issue.message ?? "";
  if (message && !isZodDefault(message)) return /[.!?]$/.test(message) ? `${label}: ${message}` : `${label}: ${message}.`;
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "string") return min && min > 1 ? `${label} needs at least ${min} characters.` : `${label} is required.`;
      if (issue.origin === "array" || issue.origin === "set") return `Add at least ${min} ${label.toLowerCase()}.`;
      return `${label} must be at least ${min}.`;
    case "too_big":
      if (issue.origin === "string") return `${label} can be at most ${max} characters.`;
      if (issue.origin === "array" || issue.origin === "set") return `Add no more than ${max} ${label.toLowerCase()}.`;
      return `${label} must be ${max} or less.`;
    case "invalid_type":
      return /received (undefined|null)/i.test(message) ? `${label} is required.` : `${label} has an invalid value.`;
    case "invalid_format":
      if (issue.format === "email") return `Enter a valid email address for ${label}.`;
      if (issue.format === "url") return `${label} must be a full web address starting with https://.`;
      if (issue.format === "datetime" || issue.format === "date") return `Enter a valid date for ${label}.`;
      return `${label} is not in the right format.`;
    case "invalid_value":
    case "invalid_union":
      return `Choose a valid option for ${label}.`;
    default:
      return `Check ${label}.`;
  }
}

/** Turns API validation issues into short sentences naming the field and the fix, e.g. "Excerpt needs at least 3 characters." */
export function describeIssues(issues: unknown, labels: Record<string, string> = {}) {
  if (!Array.isArray(issues)) return "";
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const issue of issues as Issue[]) {
    const path = Array.isArray(issue.path) ? issue.path.map(String) : [];
    const id = path.join(".");
    if (seen.has(id)) continue;
    seen.add(id);
    const key = path[0] ?? "";
    let label = labels[key] ?? (key ? humanise(key) : "This form");
    // Rows inside a list, e.g. variants.1.size → "Variant 2 size".
    if (path.length > 2 && /^\d+$/.test(path[1])) label = `${label.replace(/s$/, "")} ${Number(path[1]) + 1} ${humanise(path[2]).toLowerCase()}`;
    lines.push(sentence(issue, label));
    if (lines.length === 4) break;
  }
  return lines.join(" ");
}
