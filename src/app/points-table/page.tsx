import type { Metadata } from "next";
import { getPointsTable, getCurrentSeason } from "@/lib/data";
import Image from "next/image";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Points Table", description: "Current Abu Dhabi T10 standings and United Tigers position." };
export default async function PointsTablePage() {
  const [rows, season] = await Promise.all([getPointsTable(), getCurrentSeason()]);
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE LEAGUE</span><h1>POINTS<br />TABLE.</h1><p>{season.name} standings for every franchise, built from completed scorecards and confirmed by the club.</p></div></section><section className="section"><div className="wrap">{rows.length ? <div className="stats-table-wrap"><table className="stats-table points-table"><thead><tr><th>POS</th><th>TEAM</th><th>P</th><th>W</th><th>L</th><th>NR</th><th>PTS</th><th>NRR</th></tr></thead><tbody>{rows.map((row) => { const logo = row.logoUrl; return <tr key={row.teamName}><td>{row.position}</td><td><span className="table-team">{logo ? <Image src={logo} alt="" width={64} height={64} /> : null}{row.teamName}</span></td><td>{row.played}</td><td>{row.won}</td><td>{row.lost}</td><td>{row.noResult}</td><td>{row.points}</td><td>{row.netRunRate.toString()}</td></tr>; })}</tbody></table></div> : <EmptyState title="Standings begin with the first ball" description="The table will calculate matches played, wins, losses, points and net run rate from match results." />}</div></section></div>;
}

