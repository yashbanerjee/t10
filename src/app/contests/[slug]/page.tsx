import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContestBySlug } from "@/lib/data";
import { ContestEntryForm } from "@/components/FanForms";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const contest = await getContestBySlug((await params).slug);
  return { title: contest?.title ?? "Contest", description: contest?.description };
}

export default async function ContestPage({ params }: { params: Promise<{ slug: string }> }) {
  const contest = await getContestBySlug((await params).slug);
  if (!contest) notFound();
  const closed = Boolean(contest.closesAt && contest.closesAt.getTime() < Date.now());
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />{contest.prize || "CONTEST"}</span><h1>{contest.title}</h1><p>{contest.description}</p></div></section><section className="section"><div className="wrap fan-detail">
    <Link className="text-link" href="/fan"><ArrowLeft size={14} /> FAN ZONE</Link>
    <ContestEntryForm slug={contest.slug} prompt={contest.prompt} closed={closed} />
  </div></section></div>;
}
