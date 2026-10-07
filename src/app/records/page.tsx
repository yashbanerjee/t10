import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRecords } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = { title: "Team Records", description: "United Tigers season, tournament and career records." };
export default async function RecordsPage() {
  const records = await getRecords();
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />MILESTONES & MOMENTS</span><h1>THE RECORD<br />BOOK.</h1><p>Every record is calculated from match data or entered by an authorized statistics manager, and tagged by season, tournament or career scope.</p><div className="hero-links"><Link className="text-link" href="/stats">STATS CENTRE · LEADERBOARDS <ArrowUpRight size={14} /></Link><Link className="text-link" href="/points-table">POINTS TABLE <ArrowUpRight size={14} /></Link></div></div></section><section className="section"><div className="wrap"><SectionHeading overline={records.length ? "CLUB RECORDS" : "A NEW CHAPTER"} title={records.length ? "THE MARKS TO BEAT" : "FIRSTS STILL TO COME"} />{records.length ? <div className="record-grid">{records.map((record) => <div className="record-card" key={record.id}><span>{record.scope} · {record.category}</span><strong>{record.value}</strong><h3>{record.title}</h3><p>{record.playerName || "United Tigers"}{record.seasonYear ? ` · ${record.seasonYear}` : ""}</p></div>)}</div> : <EmptyState title="The record book is open" description="United Tigers are beginning their first season. Records will be added from official scorecards and verified team data." />}</div></section></div>;
}

