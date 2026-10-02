import type { Metadata } from "next";
import { getUpdates } from "@/lib/data";
import { UpdatesTimeline } from "@/components/UpdatesTimeline";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Tigers Daily", description: "Daily training, team news and behind-the-scenes updates from United Tigers." };
export default async function UpdatesPage() {
  const updates = await getUpdates();
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />INSIDE THE TIGERS</span><h1>TIGERS<br />DAILY</h1><p>From camp to match day: the moments, voices and updates that bring you closer to the team.</p></div></section><section className="section"><div className="wrap">{updates.length ? <UpdatesTimeline updates={updates} /> : <EmptyState title="No updates today" description="Check back soon for training notes, team news and moments from the Tigers camp." />}</div></section></div>;
}

