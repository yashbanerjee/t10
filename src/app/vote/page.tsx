import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPolls } from "@/lib/data";

export const metadata: Metadata = { title: "Vote", description: "Vote in United Tigers fan polls, including player of the match." };

const isOpen = (closesAt: Date | null) => !closesAt || closesAt.getTime() > Date.now();

export default async function VotePage() {
  const polls = await getPolls();
  const open = polls.filter((poll) => isOpen(poll.closesAt));
  const closed = polls.filter((poll) => !isOpen(poll.closesAt));
  const card = (poll: (typeof polls)[number]) => <Link className="fan-card" href={`/polls/${poll.slug}`} key={poll.id}><span>{isOpen(poll.closesAt) ? "OPEN" : "CLOSED"}</span><h2>{poll.question}</h2><p>{poll.options.map((option) => option.label).join(" · ")}</p><small>{isOpen(poll.closesAt) ? "VOTE" : "SEE THE RESULT"} <ArrowUpRight size={14} /></small></Link>;
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE VOTE</span><h1>YOUR CALL,<br />TIGERS.</h1><p>Pick your player of the match and have your say on the big club questions. One vote per fan, and your details stay with the team.</p></div></section>
    <section className="section" id="open"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />OPEN NOW</span><h2>CAST YOUR VOTE</h2></div><Link className="text-link" href="/fan">FAN ZONE <ArrowUpRight size={14} /></Link></div>
      {open.length ? <div className="fan-grid">{open.map(card)}</div> : <div className="fan-empty"><h2>No poll is open right now.</h2><p>The next vote opens on match day. Check back after the first ball.</p></div>}
    </div></section>
    {closed.length > 0 && <section className="section section-dark"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />RESULTS</span><h2>CLOSED POLLS</h2></div></div>
      <div className="fan-grid">{closed.map(card)}</div>
    </div></section>}
  </div>;
}
