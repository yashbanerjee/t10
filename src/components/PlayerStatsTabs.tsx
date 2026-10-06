"use client";

import { useState } from "react";

type Values = Record<string, string | number | null>;
const groups = [
  { label: "BATTING", keys: [["matches", "Matches"], ["innings", "Innings"], ["runs", "Runs"], ["average", "Average"], ["strikeRate", "Strike rate"], ["highestScore", "High score"], ["fifties", "50s"], ["hundreds", "100s"], ["fours", "Fours"], ["sixes", "Sixes"]] },
  { label: "BOWLING", keys: [["bowlingOvers", "Overs"], ["bowlingRuns", "Runs conceded"], ["wickets", "Wickets"], ["economy", "Economy"], ["bowlingAverage", "Average"], ["bowlingStrikeRate", "Strike rate"], ["bestBowling", "Best figures"]] },
  { label: "FIELDING", keys: [["catches", "Catches"], ["runOuts", "Run outs"], ["stumpings", "Stumpings"]] },
];
const format = (value: string | number | null | undefined) => value == null ? "—" : typeof value === "number" ? value.toFixed(Number.isInteger(value) ? 0 : 2) : value;

function hasFigures(values: Values | null) {
  if (!values) return false;
  return ["matches", "runs", "wickets", "catches"].some((key) => Number(values[key]) > 0) || Boolean(values.bestBowling);
}

export function PlayerStatsTabs({ currentSeason, career }: { currentSeason: Values | null; career: Values | null }) {
  const [active, setActive] = useState<"current" | "career">(hasFigures(currentSeason) || !hasFigures(career) ? "current" : "career");
  const values = active === "current" ? currentSeason : career;
  return <div className="player-stats-module">
    <div className="stats-switch" role="tablist" aria-label="Choose statistic period"><button role="tab" aria-selected={active === "current"} onClick={() => setActive("current")}>CURRENT SEASON</button><button role="tab" aria-selected={active === "career"} onClick={() => setActive("career")}>CAREER / LIFETIME</button></div>
    {!values && <p className="stats-disclaimer">Official player statistics will appear here after the first scorecard is entered.</p>}
    {groups.map((group) => <div className="stats-group" key={group.label}><h3>{group.label}</h3><div className="player-stat-grid">{group.keys.map(([key, label]) => <div className="player-stat" key={key}><span>{label}</span><strong>{values ? format(values[key] as Values[string]) : "—"}</strong></div>)}</div></div>)}
  </div>;
}

