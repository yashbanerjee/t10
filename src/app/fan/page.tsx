import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getContests, getPolls } from "@/lib/data";

export const metadata: Metadata = { title: "Fan zone", description: "Vote in United Tigers polls and enter club contests." };

const open = (closesAt: Date | null) => !closesAt || closesAt.getTime() > Date.now();

export default async function FanPage() {
  const [polls, contests] = await Promise.all([getPolls(), getContests()]);
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />FAN ZONE</span><h1>HAVE YOUR<br />SAY.</h1><p>Vote in the club poll and enter the contest. Your name, email and phone stay with the team.</p></div></section>
    <section className="section" id="vote"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />POLLS</span><h2>THE VOTE</h2></div></div>
      {polls.length ? <div className="fan-grid">{polls.map((poll) => <Link className="fan-card" href={`/polls/${poll.slug}`} key={poll.id}><span>{open(poll.closesAt) ? "OPEN" : "CLOSED"}</span><h2>{poll.question}</h2><p>{poll.options.map((option) => option.label).join(" · ")}</p><small>VOTE <ArrowUpRight size={14} /></small></Link>)}</div> : <div className="fan-empty"><h2>No poll is live yet.</h2></div>}
    </div></section>
    <section className="section section-dark"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />CONTESTS</span><h2>THE PRIZE</h2></div></div>
      {contests.length ? <div className="fan-grid">{contests.map((contest) => <Link className="fan-card" href={`/contests/${contest.slug}`} key={contest.id}><span>{contest.prize || "CLUB CONTEST"}</span><h2>{contest.title}</h2><p>{contest.description}</p><small>ENTER <ArrowUpRight size={14} /></small></Link>)}</div> : <div className="fan-empty"><h2>The next contest is still in the dugout.</h2></div>}
    </div></section>
  </div>;
}
