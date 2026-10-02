import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Trophy } from "lucide-react";
import { getMatchBySlug } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/Badge";
import { LiveScore } from "@/components/LiveScore";
import { TrackEvent } from "@/components/TrackEvent";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const match = await getMatchBySlug(slug);
  return match ? { title: `United Tigers vs ${match.opponent}`, description: `${match.competition || "Abu Dhabi T10"} match centre and scorecard.`, alternates: { canonical: `/matches/${slug}` }, openGraph: { type: "article", title: `United Tigers vs ${match.opponent}` } } : { title: "Match Centre" };
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params; const match = await getMatchBySlug(slug); if (!match) notFound();
  const innings = match.innings;
  const event = JSON.stringify({ "@context": "https://schema.org", "@type": "SportsEvent", name: `United Tigers vs ${match.opponent}`, startDate: match.date.toISOString(), location: match.venue ? { "@type": "Place", name: match.venue.name, address: match.venue.city } : undefined, eventStatus: `https://schema.org/Event${match.status === "COMPLETED" ? "Completed" : "Scheduled"}` }).replaceAll("<", "\\u003c");
  return <><TrackEvent event="match_view" payload={{ id: match.id, path: `/matches/${match.slug}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: event }} /><div className="inner-page"><section className="match-centre-hero"><div className="wrap"><Link className="back-link" href="/fixtures"><ArrowLeft size={14} /> ALL FIXTURES</Link><div className="match-centre-top"><StatusBadge live={match.status === "LIVE"}>{match.status}</StatusBadge><span>{match.competition ?? "ABU DHABI T10"} · {match.matchNumber ?? "MATCH"}</span></div><div className="match-centre-score"><div><span>UT</span><strong>UNITED<br />TIGERS</strong>{innings.find((entry) => entry.battingTeam === "United Tigers") && <small>{innings.find((entry) => entry.battingTeam === "United Tigers")!.runs}/{innings.find((entry) => entry.battingTeam === "United Tigers")!.wickets}</small>}</div><b>VS</b><div><span className="opponent-mark">{match.opponentShort ?? match.opponent.slice(0, 2).toUpperCase()}</span><strong>{match.opponent.toUpperCase()}</strong>{innings.find((entry) => entry.battingTeam === match.opponent) && <small>{innings.find((entry) => entry.battingTeam === match.opponent)!.runs}/{innings.find((entry) => entry.battingTeam === match.opponent)!.wickets}</small>}</div></div><p className="match-centre-result">{match.result ?? (match.status === "LIVE" ? "LIVE SCORE · UPDATING" : "OFFICIAL MATCH INFORMATION")}</p><div className="match-centre-details"><span><MapPin size={14} />{match.venue?.name ?? "Venue TBC"}</span><span>{new Date(match.date).toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })} GST</span>{match.toss && <span><Trophy size={14} />{match.toss}</span>}</div></div></section>
    {match.status === "LIVE" && <LiveScore slug={match.slug} initial={{ status: match.status, liveState: match.liveState as never, innings: innings.map((entry) => ({ runs: entry.runs, wickets: entry.wickets, overs: entry.overs.toString() })) }} />}
    <section className="section"><div className="wrap">{innings.length ? innings.map((entry) => <div className="scorecard-section" key={entry.id}><div className="scorecard-heading"><div><span className="eyebrow">INNINGS {entry.number}</span><h2>{entry.battingTeam}</h2></div><strong>{entry.runs}/{entry.wickets}<small>({entry.overs.toString()} overs)</small></strong></div>
      {entry.batting.length ? <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>BATTER</th><th>DISMISSAL</th><th>R</th><th>B</th><th>4S</th><th>6S</th><th>SR</th></tr></thead><tbody>{entry.batting.map((row) => <tr key={row.id}><td>{row.player.fullName}</td><td>{row.dismissal ?? "not out"}</td><td>{row.runs}</td><td>{row.balls}</td><td>{row.fours}</td><td>{row.sixes}</td><td>{row.balls ? (row.runs / row.balls * 100).toFixed(2) : "—"}</td></tr>)}</tbody></table></div> : <EmptyState title="Scorecard pending" description="Batting and bowling details will be published by the match centre team." />}
      {entry.bowling.length > 0 && <div className="stats-table-wrap" style={{ marginTop: 14 }}><table className="stats-table"><thead><tr><th>BOWLER</th><th>OVERS</th><th>MAIDENS</th><th>RUNS</th><th>WICKETS</th><th>ECONOMY</th></tr></thead><tbody>{entry.bowling.map((row) => <tr key={row.id}><td>{row.player.fullName}</td><td>{row.overs.toString()}</td><td>{row.maidens}</td><td>{row.runs}</td><td>{row.wickets}</td><td>{Number(row.overs) ? (row.runs / Number(row.overs)).toFixed(2) : "—"}</td></tr>)}</tbody></table></div>}
    </div>) : <EmptyState title="Scorecard pending" description="Full innings, batting, bowling and fielding details will appear here." />}</div></section></div></>;
}

