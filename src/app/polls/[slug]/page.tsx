import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPollBySlug } from "@/lib/data";
import { PollBallot } from "@/components/FanForms";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const poll = await getPollBySlug((await params).slug);
  return { title: poll?.title ?? "Poll", description: poll?.question };
}

export default async function PollPage({ params }: { params: Promise<{ slug: string }> }) {
  const poll = await getPollBySlug((await params).slug);
  if (!poll) notFound();
  const closed = Boolean(poll.closesAt && poll.closesAt.getTime() < Date.now());
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />{closed ? "CLOSED" : "THE VOTE"}</span><h1>{poll.question}</h1>{poll.description && <p>{poll.description}</p>}</div></section><section className="section"><div className="wrap fan-detail">
    <Link className="text-link" href="/fan"><ArrowLeft size={14} /> FAN ZONE</Link>
    <PollBallot slug={poll.slug} options={poll.options} closed={closed} />
  </div></section></div>;
}
