import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getUpdateBySlug } from "@/lib/data";
import { SampleBadge } from "@/components/Badge";
import { SafeMarkdown } from "@/components/SafeMarkdown";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const update = await getUpdateBySlug(slug); return update ? { title: update.title, description: update.description, alternates: { canonical: `/updates/${update.slug}` }, openGraph: { type: "article", title: update.title, description: update.description, images: update.image ? [update.image] : undefined } } : { title: "Update not found" }; }
export default async function UpdatePage({ params }: Props) {
  const { slug } = await params; const update = await getUpdateBySlug(slug); if (!update) notFound();
  return <div className="inner-page"><section className="article-hero"><div className="wrap"><Link className="back-link" href="/updates"><ArrowLeft size={14} /> TIGERS DAILY</Link><div className="article-meta"><span>{update.category.replaceAll("_", " ")}</span><span><Clock3 size={13} />{new Date(update.publishedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Dubai" })} GST</span>{update.isDemo && <SampleBadge />}</div><h1>{update.title}</h1><p>{update.description}</p></div></section><section className="section"><article className="article-content">{update.image && <div className="article-image"><Image src={update.image} alt="" fill sizes="100vw" /></div>}<SafeMarkdown content={update.content || update.description} /></article></section></div>;
}

