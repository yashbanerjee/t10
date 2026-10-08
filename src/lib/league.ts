/**
 * Abu Dhabi T10 2026 brand assets and the six franchise identities, taken from the league's
 * creative guidelines. Logos are self-hosted under /public/brand so they load with the rest of the site.
 */

export const LEAGUE_NAME = "Abu Dhabi T10";

/** White lockups for the purple site. Landscape is the primary mark; portrait is for tight spaces only. */
export const LEAGUE_LOGO = {
  landscape: { src: "/brand/league/abu-dhabi-t10-landscape-white.png", width: 1400, height: 132 },
  portrait: { src: "/brand/league/abu-dhabi-t10-portrait-white.png", width: 800, height: 463 },
} as const;

export type LeagueTeam = {
  name: string;
  shortName: string;
  slug: string;
  logo: string;
  /** Primary, secondary and accent colours from the 2026 team identity sheet. */
  colors: [string, string, string];
};

export const LEAGUE_TEAMS: LeagueTeam[] = [
  { name: "Arabian Aces", shortName: "AA", slug: "arabian-aces", logo: "/brand/teams/arabian-aces.png", colors: ["#5B0A18", "#1A0308", "#C69214"] },
  { name: "Emirates Eagles", shortName: "EE", slug: "emirates-eagles", logo: "/brand/teams/emirates-eagles.png", colors: ["#EC5E08", "#0B2C5B", "#E10500"] },
  { name: "Royal Desert Champions", shortName: "RDC", slug: "royal-desert-champions", logo: "/brand/teams/royal-desert-champions.png", colors: ["#E50B0A", "#EED1AA", "#4D175F"] },
  { name: "UAE Bulls", shortName: "UAB", slug: "uae-bulls", logo: "/brand/teams/uae-bulls.png", colors: ["#D8FF00", "#E33A27", "#1307AA"] },
  { name: "United Tigers", shortName: "UT", slug: "united-tigers", logo: "/brand/teams/united-tigers.png", colors: ["#3A2D61", "#E5D9A8", "#D3317A"] },
  { name: "Yas Lions", shortName: "YL", slug: "yas-lions", logo: "/brand/teams/yas-lions.png", colors: ["#01368C", "#2168C2", "#EAAA00"] },
];

export const HOME_TEAM = LEAGUE_TEAMS.find((team) => team.slug === "united-tigers")!;

/** Opponents the admin can pick from; United Tigers never play themselves. */
export const OPPONENT_NAMES = LEAGUE_TEAMS.filter((team) => team !== HOME_TEAM).map((team) => team.name);

const normalise = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

/** Matches a free-text team name to a league identity, tolerating case, punctuation and the short code. */
export function findLeagueTeam(name: string | null | undefined): LeagueTeam | undefined {
  if (!name) return undefined;
  const needle = normalise(name);
  if (!needle) return undefined;
  return LEAGUE_TEAMS.find((team) => normalise(team.name) === needle || normalise(team.slug) === needle || team.shortName.toLowerCase() === needle);
}

/** Logo for a team name: the stored CMS logo first, then the league identity sheet. */
export function teamLogo(name: string | null | undefined, stored?: string | null): string | null {
  return stored || findLeagueTeam(name)?.logo || null;
}

/** Short code for a team name: the stored CMS code first, then the league sheet, then the initials. */
export function teamShortName(name: string, stored?: string | null): string {
  return stored || findLeagueTeam(name)?.shortName || name.split(/\s+/).map((word) => word[0] ?? "").join("").slice(0, 3).toUpperCase();
}
