"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { track } from "@/lib/analytics";
import { HOME_TEAM, teamLogo } from "@/lib/league";

type Match = { id: string; slug: string; date: Date | string; status: string; opponent: string; opponentLogoUrl?: string | null; matchNumber?: string | null; competition?: string | null; venue?: { name: string } | null; innings?: { battingTeam: string; runs: number; wickets: number; overs: { toString(): string } | string | number }[] };
export function FixtureExplorer({ matches, homeLogo = HOME_TEAM.logo }: { matches: Match[]; homeLogo?: string }) {
  const [tab, setTab] = useState("UPCOMING");
  const shown = useMemo(() => matches.filter((match) => tab === "UPCOMING" ? match.status === "UPCOMING" || match.status === "LIVE" : match.status === "COMPLETED"), [matches, tab]);
  return <><div className="filter-tabs" role="tablist" aria-label="Fixture status">{["UPCOMING", "COMPLETED"].map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div>
    {shown.length ? <div className="fixture-list">{shown.map((match) => {
      const date = new Date(match.date);
      const score = match.innings?.map((entry) => `${entry.runs}/${entry.wickets}`).join(" · ");
      const logo = teamLogo(match.opponent, match.opponentLogoUrl);
      return <article className="fixture-row" key={match.id}><div className="fixture-date"><span>{date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dubai" })}</span><small>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })} GST</small></div><div className="fixture-opponent"><span className="fixture-team"><i className="fixture-crest"><Image src={homeLogo} alt="" width={375} height={512} /></i>United Tigers</span><span className="vs-mark">vs</span><span className="fixture-team">{logo ? <i className="fixture-crest"><Image src={logo} alt="" width={64} height={64} /></i> : null}{match.opponent}</span></div><div className="fixture-meta">{match.competition ?? "Abu Dhabi T10"} · {match.venue?.name ?? "Venue TBC"}</div>{score ? <div className="fixture-score">{score}</div> : <div className="fixture-score is-tbc" aria-hidden="true">—</div>}<Link className="fixture-link" href={`/matches/${match.slug}`} onClick={() => track("fixture_click", { id: match.id, href: `/matches/${match.slug}` })}>{match.status === "COMPLETED" ? "SCORECARD ↗" : "MATCH CENTRE ↗"}</Link></article>;
    })}</div> : <div className="empty-state"><span>{tab === "UPCOMING" ? "NEXT" : "10"}</span><h3>{tab === "UPCOMING" ? "Fixtures are on the way" : "The story starts soon"}</h3><p>{tab === "UPCOMING" ? "Official United Tigers fixtures will be published as soon as the tournament schedule is confirmed." : "Match results and scorecards will appear here after the first game."}</p></div>}
  </>;
}

