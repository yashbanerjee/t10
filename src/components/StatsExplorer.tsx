"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = { player: { fullName: string; slug: string }; stats: Record<string, number | string | null> };
const tabs = [
  { key: "batting", label: "BATTING", columns: [["runs", "Runs"], ["average", "Average"], ["strikeRate", "Strike rate"], ["highestScore", "High score"], ["fours", "Fours"], ["sixes", "Sixes"]] },
  { key: "bowling", label: "BOWLING", columns: [["wickets", "Wickets"], ["economy", "Economy"], ["bowlingAverage", "Average"], ["bowlingOvers", "Overs"], ["bowlingStrikeRate", "Strike rate"]] },
  { key: "fielding", label: "FIELDING", columns: [["catches", "Catches"], ["runOuts", "Run outs"], ["stumpings", "Stumpings"]] },
];
const format = (value: number | string | null) => value == null ? "—" : typeof value === "number" ? value.toFixed(Number.isInteger(value) ? 0 : 2) : value;

export function StatsExplorer({ rows, year }: { rows: Row[]; year: number }) {
  const [active, setActive] = useState("batting");
  const [sortKey, setSortKey] = useState("runs");
  const [ascending, setAscending] = useState(false);
  const current = tabs.find((tab) => tab.key === active)!;
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = a.stats[sortKey]; const bv = b.stats[sortKey];
    const left = typeof av === "number" ? av : Number(av) || 0;
    const right = typeof bv === "number" ? bv : Number(bv) || 0;
    return ascending ? left - right : right - left;
  }), [rows, sortKey, ascending]);
  return <><div className="stats-explorer-head"><div className="filter-tabs" role="tablist" aria-label="Statistic category">{tabs.map((tab) => <button key={tab.key} role="tab" aria-selected={active === tab.key} onClick={() => { setActive(tab.key); setSortKey(tab.columns[0][0]); setAscending(false); }}>{tab.label}</button>)}</div><span className="stats-season-tag">{year} SEASON</span></div>
    {rows.length ? <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>PLAYER</th>{current.columns.map(([key, label]) => <th key={key}><button className="sort-heading" onClick={() => { if (sortKey === key) setAscending(!ascending); else { setSortKey(key); setAscending(false); } }}>{label} {sortKey === key ? (ascending ? "↑" : "↓") : "↕"}</button></th>)}</tr></thead><tbody>{sorted.map((row) => <tr key={row.player.slug}><td><Link href={`/players/${row.player.slug}`}>{row.player.fullName}</Link></td>{current.columns.map(([key]) => <td key={key}>{format(row.stats[key] ?? null)}</td>)}</tr>)}</tbody></table></div> : <div className="stats-empty"><div className="eyebrow"><i className="eyebrow-dot" />OFFICIAL SCORECARDS AWAITING ENTRY</div><h2>THE NUMBERS WILL<br />WRITE THEMSELVES.</h2><p>Batting, bowling and fielding tables are calculated from each match scorecard once entered by the statistics team.</p></div>}
  </>;
}

