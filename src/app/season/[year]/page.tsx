import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatches, getCurrentSeason } from "@/lib/data";
import { getStatsLeaderboard } from "@/lib/stats";
import { ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

type Props = { params: Promise<{ year: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { year } = await params; return { title: `${year} Season`, description: `United Tigers ${year} season overview, fixtures and statistics.` }; }

export default async function SeasonPage({ params }: Props) {
  const { year: raw } = await params; const year = Number(raw); const current = await getCurrentSeason();
  if (!Number.isInteger(year) || year < 2026 || year > current.year) notFound();
  const [allMatches, leaders] = await Promise.all([getMatches(), getStatsLeaderboard(year)]);
  const matches = allMatches.filter((match) => match.season.year === year);
  const completed = matches.filter((match) => match.status === "COMPLETED");
  const wins = completed.filter((match) => match.result?.toLowerCase().includes("united tigers won")).length;
  const topBatter = [...leaders].sort((a, b) => b.stats.runs - a.stats.runs)[0];
  const topBowler = [...leaders].sort((a, b) => b.stats.wickets - a.stats.wickets)[0];
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />SEASON OVERVIEW</span><h1>{year}<br />SEASON.</h1><p>One team. A brand-new chapter. Follow the United Tigers across every match of the {year} Abu Dhabi T10 season.</p></div></section><section className="section"><div className="wrap"><div className="season-strip season-strip-large"><div className="season-stat"><span>Matches played</span><strong>{completed.length || "—"}</strong><small>Completed scorecards</small></div><div className="season-stat"><span>Wins</span><strong>{completed.length ? wins : "—"}</strong><small>Match results</small></div><div className="season-stat"><span>Losses</span><strong>{completed.length ? completed.length - wins : "—"}</strong><small>Match results</small></div><div className="season-stat"><span>Win rate</span><strong>{completed.length ? `${Math.round(wins / completed.length * 100)}%` : "—"}</strong><small>Calculated from results</small></div></div><div className="season-leaders"><div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />SEASON LEADERS</span><h2>MAKE IT COUNT.</h2></div><Link className="text-link" href="/stats">FULL STATS <ArrowUpRight size={14} /></Link></div><div className="leader-cards">{topBatter ? <div className="leader-card"><span>TOP BATTER</span><strong>{topBatter.stats.runs}</strong><p>{topBatter.player.fullName} · runs</p></div> : <div className="leader-card"><span>TOP BATTER</span><strong>—</strong><p>Scorecards to come</p></div>}{topBowler ? <div className="leader-card"><span>TOP BOWLER</span><strong>{topBowler.stats.wickets}</strong><p>{topBowler.player.fullName} · wickets</p></div> : <div className="leader-card"><span>TOP BOWLER</span><strong>—</strong><p>Scorecards to come</p></div>}<div className="leader-card"><span>POINTS</span><strong>—</strong><p>League table pending</p></div></div></div><div className="season-fixtures"><div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />THE ROAD AHEAD</span><h2>FIXTURES & RESULTS</h2></div><Link className="text-link" href="/fixtures">VIEW ALL <ArrowUpRight size={14} /></Link></div>{matches.length ? <p className="section-intro">The official season schedule is available in the fixtures centre.</p> : <EmptyState title="Fixture list pending" description="The season page will update as official United Tigers fixtures and results are added." kind="calendar" />}</div></div></section></div>;
}

