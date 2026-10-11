import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPlayerBySlug, getPlayers } from "@/lib/data";
import { getPlayerStats } from "@/lib/stats";
import { PlayerStatsTabs } from "@/components/PlayerStatsTabs";
import { PlayerCard } from "@/components/PlayerCard";
import { TrackEvent } from "@/components/TrackEvent";
import { PlayerReportCard } from "@/components/PlayerReportCard";
import { getSiteUrl } from "@/lib/site-settings";
import { readLinks } from "@/lib/player-links";
import { readCareer, type CareerRecord } from "@/lib/career-record";

type Props = { params: Promise<{ slug: string }> };
const formatStat = (value: string | number | null | undefined) => value == null || value === "" ? "—" : typeof value === "number" ? value.toFixed(Number.isInteger(value) ? 0 : 2) : value;
type StatGroup = { label: string; items: [string, string | number | null | undefined][] };
function recordGroups(record: CareerRecord): StatGroup[] {
  const bowled = Boolean(record.overs && record.overs !== "0") || Number(record.wickets) > 0;
  const fielded = record.catches != null || record.stumpings != null;
  return [
    { label: "BATTING", items: [["Matches", record.matches], ["Innings", record.innings], ["Runs", record.runs], ["Average", record.average], ["Strike rate", record.strikeRate], ["High score", record.bestScore], ["50s", record.fifties], ["100s", record.hundreds], ["Fours", record.fours], ["Sixes", record.sixes]] },
    ...(bowled ? [{ label: "BOWLING", items: [["Overs", record.overs], ["Runs conceded", record.bowlingRuns], ["Wickets", record.wickets], ["Economy", record.economy], ["Average", record.bowlingAverage], ["Strike rate", record.bowlingStrikeRate], ["Best figures", record.bestBowling]] } as StatGroup] : []),
    ...(fielded ? [{ label: "FIELDING", items: [["Catches", record.catches], ["Stumpings", record.stumpings]] } as StatGroup] : []),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const player = await getPlayerBySlug(slug);
  if (!player) return { title: "Player not found" };
  return { title: player.fullName, description: player.bio || `${player.fullName}, ${player.isIconPlayer ? "United Tigers icon player" : "United Tigers squad member"}. View profile and official season and career statistics.`, alternates: { canonical: `/players/${player.slug}` }, openGraph: { type: "profile", title: `${player.fullName} | United Tigers`, images: player.profileImage ? [player.profileImage] : undefined } };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { slug } = await params; const player = await getPlayerBySlug(slug); if (!player) notFound();
  const [stats, roster, siteUrl] = await Promise.all([getPlayerStats(player.id), getPlayers(), getSiteUrl()]);
  const meta = [player.role?.replaceAll("_", " ") || "Role to be confirmed", player.nationality || player.country || "Nationality to be confirmed", player.jerseyNumber ? `SQUAD #${player.jerseyNumber}` : "SQUAD NUMBER TBC"];
  const badge = player.isCaptain ? "CAPTAIN" : player.isViceCaptain ? "VICE CAPTAIN" : player.isIconPlayer ? "ICON PLAYER" : "UNITED TIGERS";
  const profileLink = readLinks("socialLinks" in player ? player.socialLinks : null)?.profile ?? null;
  const facts = [
    player.battingStyle ? ["Batting", player.battingStyle] : null,
    player.bowlingStyle ? ["Bowling", player.bowlingStyle] : null,
    player.heightCm ? ["Height", `${player.heightCm} cm`] : null,
    player.dateOfBirth ? ["Born", new Date(player.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })] : null,
    player.shortName ? ["Short name", player.shortName] : null,
  ].filter((item): item is [string, string] => Boolean(item));
  const name = player.displayName || player.fullName;
  const t20Records = [
    { title: "ALL T20 MATCHES", record: readCareer("allT20Record" in player ? player.allT20Record : null), empty: `No T20 record is available for ${name} yet.` },
    { title: "T20 INTERNATIONALS", record: readCareer("t20Record" in player ? player.t20Record : null), empty: `${name} has not played a T20 International yet.` },
  ];
  const personData = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: player.fullName, jobTitle: player.role?.replaceAll("_", " ") || undefined, nationality: player.nationality || player.country || undefined, image: player.profileImage || undefined, url: `${siteUrl}/players/${player.slug}` }).replaceAll("<", "\\u003c");
  return <>
    <TrackEvent event="player_profile_view" payload={{ id: player.id, path: `/players/${player.slug}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personData }} />
    <section className={`player-profile-hero ${player.coverImage ? "has-cover" : ""}`} style={player.coverImage ? { backgroundImage: `url('${player.coverImage}')` } : undefined}>
      <div className="player-profile-number">{player.jerseyNumber ? String(player.jerseyNumber).padStart(2, "0") : "UT"}</div><div className="wrap player-profile-content"><Link className="back-link" href="/team"><ArrowLeft size={14} /> BACK TO SQUAD</Link><div><span className="eyebrow"><i className="eyebrow-dot" />{badge}</span></div><h1>{player.displayName || player.fullName}</h1><div className="player-profile-meta">{meta.map((value) => <span key={value}>{value}</span>)}</div>{player.bio && <p className="player-profile-bio">{player.bio}</p>}{facts.length > 0 && <div className="player-profile-facts">{facts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}{player.isDemo && <div style={{ marginTop: 12 }}><span className="sample-badge">SAMPLE PLAYER PROFILE</span></div>}</div>
    </section>
    <section className="section"><div className="wrap profile-grid"><div><div className="eyebrow"><i className="eyebrow-dot" />PLAYER REPORT</div><h2 className="profile-section-title">THE NUMBERS<br />SO FAR.</h2><p className="profile-copy">This season comes from match scorecards. Career figures add the lifetime record saved on the player.</p><PlayerReportCard stats={stats.currentSeason as Parameters<typeof PlayerReportCard>[0]["stats"]} /><div className="profile-links"><Link className="text-link" href="/stats">EXPLORE STATS CENTRE <ArrowUpRight size={14} /></Link>{profileLink && <a className="text-link" href={profileLink} target="_blank" rel="noreferrer">FULL CAREER PROFILE <ArrowUpRight size={14} /></a>}</div></div><PlayerStatsTabs currentSeason={stats.currentSeason as never} career={stats.career as never} /></div></section>
    <section className="section t20-career-section"><div className="wrap profile-grid"><div><div className="eyebrow"><i className="eyebrow-dot" />T20 CAREER</div><h2 className="profile-section-title">BEYOND<br />THE TIGERS.</h2><p className="profile-copy">{name}&apos;s record across every recognised T20, and for {player.nationality || player.country || "his country"} in T20 Internationals. These figures are separate from United Tigers T10 statistics.</p></div><div className="player-stats-module">{t20Records.map(({ title, record, empty }) => <div className="t20-record" key={title}><h3 className="t20-record-title">{title}</h3>{record ? recordGroups(record).map((group) => <div className="stats-group" key={group.label}><h3>{group.label}</h3><div className="player-stat-grid">{group.items.map(([label, value]) => <div className="player-stat" key={label}><span>{label}</span><strong>{formatStat(value)}</strong></div>)}</div></div>) : <p className="stats-disclaimer">{empty}</p>}</div>)}</div></div></section>
    <section className="section section-dark"><div className="wrap"><div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />TIGERS SQUAD</span><h2>MORE FROM THE TEAM</h2></div><Link className="text-link" href="/team">VIEW SQUAD <ArrowUpRight size={14} /></Link></div><div className="player-grid">{roster.filter((item) => item.slug !== player.slug).slice(0, 4).map((item) => <PlayerCard key={item.id} player={item} />)}</div></div></section>
  </>;
}

