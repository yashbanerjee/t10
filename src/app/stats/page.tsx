import type { Metadata } from "next";
import { getCurrentSeason } from "@/lib/data";
import { getStatsLeaderboard } from "@/lib/stats";
import { StatsExplorer } from "@/components/StatsExplorer";

export const metadata: Metadata = { title: "Stats Centre", description: "United Tigers batting, bowling and fielding leaderboards, calculated from official match scorecards." };
export default async function StatsPage() {
  const [season, initialRows] = await Promise.all([getCurrentSeason(), getStatsLeaderboard()]);
  const year = season.year;
  const rows = year === 2026 ? initialRows : await getStatsLeaderboard(year);
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE NUMBERS GAME</span><h1>STATS<br />CENTRE</h1><p>Season leaderboards built from scorecard data. Batting, bowling and fielding totals update as official match performances are entered.</p></div></section><section className="section"><div className="wrap"><StatsExplorer rows={rows} year={year} /><div className="stats-footnote">Averages, strike rates and economy rates are derived from scorecard deliveries and dismissals.</div></div></section></div>;
}

