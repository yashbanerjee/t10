import { prisma } from "@/lib/db";
import { LEAGUE_TEAMS, findLeagueTeam } from "@/lib/league";

/** Site setting that records which Team row is the club itself (United Tigers). */
export const HOME_TEAM_SETTING = "homeTeamId";

export type ClubTeam = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  description: string | null;
  isHome: boolean;
};

const normalise = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

/** The id saved in site settings, falling back to the seeded United Tigers row and then the oldest team. */
export async function getHomeTeamId(): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: HOME_TEAM_SETTING } });
  if (typeof setting?.value === "string" && setting.value) {
    const exists = await prisma.team.findUnique({ where: { id: setting.value }, select: { id: true } });
    if (exists) return exists.id;
  }
  const seeded = await prisma.team.findUnique({ where: { slug: "united-tigers" }, select: { id: true } });
  if (seeded) return seeded.id;
  const oldest = await prisma.team.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  return oldest?.id ?? null;
}

export async function setHomeTeam(id: string) {
  await prisma.siteSetting.upsert({ where: { key: HOME_TEAM_SETTING }, create: { key: HOME_TEAM_SETTING, value: id }, update: { value: id } });
}

/** Every team created in admin, our own team first and the rest alphabetical. */
export async function getTeams(): Promise<ClubTeam[]> {
  const [homeId, teams] = await Promise.all([getHomeTeamId(), prisma.team.findMany({ orderBy: { name: "asc" } })]);
  return teams
    .map((team) => ({ id: team.id, name: team.name, shortName: team.shortName, slug: team.slug, logoUrl: team.logoUrl, primaryColor: team.primaryColor, secondaryColor: team.secondaryColor, description: team.description, isHome: team.id === homeId }))
    .sort((a, b) => Number(b.isHome) - Number(a.isHome) || a.name.localeCompare(b.name));
}

export async function getHomeTeam(): Promise<ClubTeam | null> {
  return (await getTeams()).find((team) => team.isHome) ?? null;
}

/** Opponents the admin can schedule: every created team except our own. */
export async function getOpponentTeams(): Promise<ClubTeam[]> {
  return (await getTeams()).filter((team) => !team.isHome);
}

/** Matches a typed or stored team name to a created team, tolerating case, punctuation and the short code. */
export function matchTeam(teams: ClubTeam[], name: string | null | undefined): ClubTeam | undefined {
  if (!name) return undefined;
  const needle = normalise(name);
  if (!needle) return undefined;
  return teams.find((team) => normalise(team.name) === needle || normalise(team.slug) === needle || normalise(team.shortName) === needle);
}

/** Name, short code and crest for an opponent: the created team first, then the league identity sheet. */
export async function opponentIdentity(name: string): Promise<{ name: string; shortName: string | null; logo: string | null; isHome: boolean }> {
  const teams = await getTeams();
  const team = matchTeam(teams, name);
  if (team) return { name: team.name, shortName: team.shortName, logo: team.logoUrl ?? findLeagueTeam(team.name)?.logo ?? null, isHome: team.isHome };
  const league = findLeagueTeam(name);
  return { name: league?.name ?? name.trim(), shortName: league?.shortName ?? null, logo: league?.logo ?? null, isHome: false };
}

/**
 * Creates any of the six Abu Dhabi T10 franchises that are missing and fills in blank crests and colours
 * on teams that already exist. Our own team is the seeded United Tigers row unless admin picked another.
 */
export async function importLeagueTeams() {
  let created = 0; let updated = 0;
  for (const identity of LEAGUE_TEAMS) {
    const existing = await prisma.team.findFirst({ where: { OR: [{ slug: identity.slug }, { name: identity.name }] } });
    if (!existing) {
      await prisma.team.create({ data: { name: identity.name, shortName: identity.shortName, slug: identity.slug, logoUrl: identity.logo, primaryColor: identity.colors[0], secondaryColor: identity.colors[1] } });
      created++;
      continue;
    }
    const data = { logoUrl: existing.logoUrl ?? identity.logo, primaryColor: existing.primaryColor ?? identity.colors[0], secondaryColor: existing.secondaryColor ?? identity.colors[1] };
    if (data.logoUrl !== existing.logoUrl || data.primaryColor !== existing.primaryColor || data.secondaryColor !== existing.secondaryColor) { await prisma.team.update({ where: { id: existing.id }, data }); updated++; }
  }
  const homeId = await getHomeTeamId();
  if (homeId) await setHomeTeam(homeId);
  return { created, updated, total: await prisma.team.count() };
}
