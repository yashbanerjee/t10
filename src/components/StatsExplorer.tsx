"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Figures = Record<string, number | string | null>;
type Scope = "season" | "allT20" | "t20";
type Row = { player: { fullName: string; slug: string }; stats: Figures; t20: Figures | null; allT20: Figures | null };
const tabs = [
  { key: "batting", label: "BATTING", columns: [["runs", "Runs"], ["matches", "Matches"], ["average", "Average"], ["strikeRate", "Strike rate"], ["highestScore", "High score"], ["fours", "Fours"], ["sixes", "Sixes"]] },
  { key: "bowling", label: "BOWLING", columns: [["wickets", "Wickets"], ["economy", "Economy"], ["bowlingAverage", "Average"], ["bowlingOvers", "Overs"], ["bowlingStrikeRate", "Strike rate"], ["bestBowling", "Best"]] },
  { key: "fielding", label: "FIELDING", columns: [["catches", "Catches"], ["runOuts", "Run outs"], ["stumpings", "Stumpings"]] },
];
const format = (value: number | string | null) => value == null ? "—" : typeof value === "number" ? value.toFixed(Number.isInteger(value) ? 0 : 2) : value;
const played = (stats: Figures | null) => Boolean(stats && (Number(stats.matches) > 0 || Number(stats.runs) > 0 || Number(stats.wickets) > 0));
const figuresFor = (row: Row, scope: Scope) => scope === "season" ? row.stats : row[scope];

export function StatsExplorer({ rows, year }: { rows: Row[]; year: number }) {
  // Until most of the squad has season figures, open on the All T20 view so visitors see full records first.
  const [scope, setScope] = useState<Scope>(() => rows.filter((row) => played(row.stats)).length * 2 >= rows.length ? "season" : rows.some((row) => row.allT20) ? "allT20" : rows.some((row) => row.t20) ? "t20" : "season");
  const [active, setActive] = useState("batting");
  const [sortKey, setSortKey] = useState("runs");
  const [ascending, setAscending] = useState(false);
  const scopes: [Scope, string][] = [["season", `${year} T10 SEASON`], ["allT20", "ALL T20"], ["t20", "T20 INTERNATIONALS"]];
  const visibleTabs = scope === "t20" ? tabs.filter((tab) => tab.key !== "fielding") : tabs;
  const current = visibleTabs.find((tab) => tab.key === active) ?? visibleTabs[0];
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = figuresFor(a, scope)?.[sortKey]; const bv = figuresFor(b, scope)?.[sortKey];
    const left = av == null ? -1 : typeof av === "number" ? av : Number.parseFloat(String(av)) || 0;
    const right = bv == null ? -1 : typeof bv === "number" ? bv : Number.parseFloat(String(bv)) || 0;
    return ascending ? left - right : right - left;
  }), [rows, scope, sortKey, ascending]);
  function changeScope(next: Scope) {
    setScope(next);
    if (next === "t20" && active === "fielding") { setActive("batting"); setSortKey("runs"); setAscending(false); }
  }
  const footnote = scope === "t20" ? "Career T20 International figures for each player’s country. A dash means the player has not played a T20I."
    : scope === "allT20" ? "Career figures across every recognised T20: internationals, franchise leagues and domestic T20s. A dash means no T20 record is available."
    : `United Tigers ${year} Abu Dhabi T10 figures from match scorecards. Averages, strike rates and economy rates are derived from scorecard deliveries and dismissals.`;
  return <><div className="stats-explorer-head"><div className="filter-tabs" role="tablist" aria-label="Statistic category">{visibleTabs.map((tab) => <button key={tab.key} role="tab" aria-selected={current.key === tab.key} onClick={() => { setActive(tab.key); setSortKey(tab.columns[0][0]); setAscending(false); }}>{tab.label}</button>)}</div><div className="filter-tabs stats-scope" role="tablist" aria-label="Competition">{scopes.map(([key, label]) => <button key={key} role="tab" aria-selected={scope === key} onClick={() => changeScope(key)}>{label}</button>)}</div></div>
    {rows.length ? <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>PLAYER</th>{current.columns.map(([key, label]) => <th key={key}><button className="sort-heading" onClick={() => { if (sortKey === key) setAscending(!ascending); else { setSortKey(key); setAscending(false); } }}>{label} {sortKey === key ? (ascending ? "↑" : "↓") : "↕"}</button></th>)}</tr></thead><tbody>{sorted.map((row) => { const values = figuresFor(row, scope); return <tr key={row.player.slug}><td><Link href={`/players/${row.player.slug}`}>{row.player.fullName}</Link></td>{values || scope === "season" ? current.columns.map(([key]) => <td key={key}>{format(values?.[key] ?? null)}</td>) : <td className="stats-no-record" colSpan={current.columns.length}>{scope === "t20" ? row.allT20 ? <>No T20 Internationals yet. <button type="button" onClick={() => changeScope("allT20")}>See his All T20 record</button></> : "No T20 Internationals yet." : "No T20 record available yet."}</td>}</tr>; })}</tbody></table></div> : <div className="stats-empty"><div className="eyebrow"><i className="eyebrow-dot" />OFFICIAL SCORECARDS AWAITING ENTRY</div><h2>THE NUMBERS WILL<br />WRITE THEMSELVES.</h2><p>Batting, bowling and fielding tables are calculated from each match scorecard once entered by the statistics team.</p></div>}
    <div className="stats-footnote">{scope === "season" ? footnote : `${footnote} These figures are not part of United Tigers T10 statistics.`}</div>
  </>;
}
