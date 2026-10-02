import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { SampleBadge } from "@/components/Badge";

export function NewsCard({ item, featured = false }: { item: { title: string; slug: string; excerpt: string; category: string; coverImage?: string | null; publishedAt?: Date | string | null; isDemo?: boolean }; featured?: boolean }) {
  const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Latest";
  return <article className={`news-card ${featured ? "news-card-featured" : ""}`}>
    <Link href={`/news/${item.slug}`} className="news-image">
      {item.coverImage ? <Image src={item.coverImage} alt="" fill sizes={featured ? "60vw" : "(max-width: 768px) 100vw, 34vw"} /> : <span className="image-placeholder-mark">UT<span> / </span>26</span>}
      <span className="image-corner">{item.category}</span>
    </Link>
    <div className="news-meta"><span><Clock3 size={13} />{date}</span>{item.isDemo && <SampleBadge />}</div>
    <h3><Link href={`/news/${item.slug}`}>{item.title}<ArrowUpRight size={16} /></Link></h3>
    <p>{item.excerpt}</p>
  </article>;
}

export function UpdateCard({ item }: { item: { title: string; slug: string; description: string; category: string; image?: string | null; publishedAt?: Date | string | null; isDemo?: boolean } }) {
  const time = item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "";
  return <Link className="update-card" href={`/updates/${item.slug}`}>
    <div className="update-card-top"><span className="update-category">{item.category.replaceAll("_", " ")}</span><span className="update-time">{time}</span></div>
    <h3>{item.title}</h3><p>{item.description}</p>
    <div className="update-card-bottom">{item.isDemo && <SampleBadge />}<span>OPEN UPDATE <ArrowUpRight size={14} /></span></div>
  </Link>;
}

