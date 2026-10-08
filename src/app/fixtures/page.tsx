import type { Metadata } from "next";
import { getMatches } from "@/lib/data";
import { FixtureExplorer } from "@/components/FixtureExplorer";
import { LeagueMark } from "@/components/LeagueMark";

export const metadata: Metadata = { title: "Fixtures & Results", description: "Follow United Tigers fixtures, results and match scorecards." };
export default async function FixturesPage() {
  const matches = await getMatches();
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow eyebrow-league"><i className="eyebrow-dot" /><LeagueMark height={12} /> · 2026</span><h1>FIXTURES<br />& RESULTS</h1><p>Every Tigers match, result and scorecard. Official fixtures will be added as soon as they are confirmed.</p></div></section><section className="section"><div className="wrap"><FixtureExplorer matches={matches} /></div></section></div>;
}

