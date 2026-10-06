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

type Props = { params: Promise<{ slug: string }> };
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
  const facts = [
    player.battingStyle ? ["Batting", player.battingStyle] : null,
    player.bowlingStyle ? ["Bowling", player.bowlingStyle] : null,
    player.heightCm ? ["Height", `${player.heightCm} cm`] : null,
    player.dateOfBirth ? ["Born", new Date(player.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })] : null,
    player.shortName ? ["Short name", player.shortName] : null,
  ].filter((item): item is [string, string] => Boolean(item));
  const personData = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: player.fullName, jobTitle: player.role?.replaceAll("_", " ") || undefined, nationality: player.nationality || player.country || undefined, image: player.profileImage || undefined, url: `${siteUrl}/players/${player.slug}` }).replaceAll("<", "\\u003c");
  return <>
    <TrackEvent event="player_profile_view" payload={{ id: player.id, path: `/players/${player.slug}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personData }} />
    <section className={`player-profile-hero ${player.coverImage ? "has-cover" : ""}`} style={player.coverImage ? { backgroundImage: `url('${player.coverImage}')` } : undefined}>
      <div className="player-profile-number">{player.jerseyNumber ? String(player.jerseyNumber).padStart(2, "0") : "UT"}</div><div className="wrap player-profile-content"><Link className="back-link" href="/team"><ArrowLeft size={14} /> BACK TO SQUAD</Link><div><span className="eyebrow"><i className="eyebrow-dot" />{badge}</span></div><h1>{player.displayName || player.fullName}</h1><div className="player-profile-meta">{meta.map((value) => <span key={value}>{value}</span>)}</div>{player.bio && <p className="player-profile-bio">{player.bio}</p>}{facts.length > 0 && <div className="player-profile-facts">{facts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}{player.isDemo && <div style={{ marginTop: 12 }}><span className="sample-badge">SAMPLE PLAYER PROFILE</span></div>}</div>
    </section>
    <section className="section"><div className="wrap profile-grid"><div><div className="eyebrow"><i className="eyebrow-dot" />PLAYER REPORT</div><h2 className="profile-section-title">THE NUMBERS<br />SO FAR.</h2><p className="profile-copy">This season comes from match scorecards. Career figures add the lifetime record saved on the player.</p><PlayerReportCard stats={stats.currentSeason as Parameters<typeof PlayerReportCard>[0]["stats"]} /><Link className="text-link" href="/stats">EXPLORE STATS CENTRE <ArrowUpRight size={14} /></Link></div><PlayerStatsTabs currentSeason={stats.currentSeason as never} career={stats.career as never} /></div></section>
    <section className="section section-dark"><div className="wrap"><div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />TIGERS SQUAD</span><h2>MORE FROM THE TEAM</h2></div><Link className="text-link" href="/team">VIEW SQUAD <ArrowUpRight size={14} /></Link></div><div className="player-grid">{roster.filter((item) => item.slug !== player.slug).slice(0, 4).map((item) => <PlayerCard key={item.id} player={item} />)}</div></div></section>
  </>;
}

