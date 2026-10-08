import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SampleBadge } from "@/components/Badge";

export function UpdatesTimeline({ updates }: { updates: { title: string; slug: string; description: string; category: string; publishedAt: Date | string; isDemo?: boolean }[] }) {
  const byDay = new Map<string, typeof updates>();
  for (const update of updates) {
    const day = new Date(update.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dubai" });
    byDay.set(day, [...(byDay.get(day) ?? []), update]);
  }
  return <div className="update-timeline">{[...byDay.entries()].map(([day, items]) => <div key={day}><div className="timeline-day">{day.toUpperCase()}</div>{items.map((item) => <div className="timeline-item" key={item.slug}>
    <time>{new Date(item.publishedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}</time>
    <div><span className="update-category">{item.category.replaceAll("_", " ")}</span><h3><Link href={item.slug === "player-draft" ? "/draft" : `/updates/${item.slug}`}>{item.title} <ArrowUpRight size={14} /></Link></h3><p>{item.description}</p>{item.isDemo && <SampleBadge />}</div>
  </div>)}</div>)}</div>;
}

