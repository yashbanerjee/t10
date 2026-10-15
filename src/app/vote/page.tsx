import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getContests, getPolls } from "@/lib/data";

export const metadata: Metadata = { alternates: { canonical: "/vote" }, title: "Vote", description: "Vote in United Tigers fan polls, including player of the match, and enter club contests." };

/* eslint-disable @next/next/no-img-element */

const isOpen = (closesAt: Date | null) => !closesAt || closesAt.getTime() > Date.now();

export default async function VotePage() {
  const [polls, contests] = await Promise.all([getPolls(), getContests()]);
  const open = polls.filter((poll) => isOpen(poll.closesAt));
  const closed = polls.filter((poll) => !isOpen(poll.closesAt));
  const card = (poll: (typeof polls)[number]) => <Link className="fan-card" href={`/polls/${poll.slug}`} key={poll.id}><span>{isOpen(poll.closesAt) ? "OPEN" : "CLOSED"}</span><h2>{poll.question}</h2><p>{poll.options.map((option) => option.label).join(" · ")}</p><small>{isOpen(poll.closesAt) ? "VOTE" : "SEE THE RESULT"} <ArrowUpRight size={14} /></small></Link>;
  const contestCard = (contest: (typeof contests)[number]) => <Link className="fan-card" href={`/contests/${contest.slug}`} key={contest.id}>{contest.image && <img className="fan-card-image" src={contest.image} alt="" loading="lazy" />}<span>{isOpen(contest.closesAt) ? contest.prize || "CLUB CONTEST" : "CLOSED"}</span><h2>{contest.title}</h2><p>{contest.description}</p><small>{isOpen(contest.closesAt) ? "ENTER" : "VIEW"} <ArrowUpRight size={14} /></small></Link>;
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE VOTE</span><h1>YOUR CALL,<br />TIGERS.</h1><p>Pick your player of the match, have your say on the big club questions and enter club contests. One vote and one entry per fan, and your details stay with the team.</p></div></section>
    <section className="section" id="open"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />OPEN NOW</span><h2>CAST VOTE</h2></div></div>
      {open.length ? <div className="fan-grid">{open.map(card)}</div> : <div className="fan-empty"><h2>No poll is open right now.</h2><p>The next vote opens on match day. Check back after the first ball.</p></div>}
    </div></section>
    <section className="section section-dark" id="contests"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />CONTESTS</span><h2>THE PRIZE</h2></div></div>
      {contests.length ? <div className="fan-grid">{contests.map(contestCard)}</div> : <div className="fan-empty"><h2>The next contest is still in the dugout.</h2></div>}
    </div></section>
    {closed.length > 0 && <section className="section"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />RESULTS</span><h2>CLOSED POLLS</h2></div></div>
      <div className="fan-grid">{closed.map(card)}</div>
    </div></section>}
  </div>;
}
