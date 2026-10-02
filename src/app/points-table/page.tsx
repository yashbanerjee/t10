import type { Metadata } from "next";
import { getPointsTable, getCurrentSeason } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Points Table", description: "Current Abu Dhabi T10 standings and United Tigers position." };
export default async function PointsTablePage() {
  const [rows, season] = await Promise.all([getPointsTable(), getCurrentSeason()]);
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE LEAGUE</span><h1>POINTS<br />TABLE.</h1><p>{season.name} standings, calculated from official match results when available.</p></div></section><section className="section"><div className="wrap">{rows.length ? <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>POS</th><th>TEAM</th><th>P</th><th>W</th><th>L</th><th>NR</th><th>PTS</th><th>NRR</th></tr></thead><tbody>{rows.map((row) => <tr key={row.teamName}><td>{row.position}</td><td>{row.teamName}</td><td>{row.played}</td><td>{row.won}</td><td>{row.lost}</td><td>{row.noResult}</td><td>{row.points}</td><td>{row.netRunRate.toString()}</td></tr>)}</tbody></table></div> : <EmptyState title="Standings begin with the first ball" description="The table will calculate matches played, wins, losses, points and net run rate from match results." />}</div></section></div>;
}

