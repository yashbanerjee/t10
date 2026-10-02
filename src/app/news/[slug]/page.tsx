import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getNewsBySlug } from "@/lib/data";
import { SampleBadge } from "@/components/Badge";
import { TrackEvent } from "@/components/TrackEvent";
import { SafeMarkdown } from "@/components/SafeMarkdown";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const article = await getNewsBySlug(slug); return article ? { title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, alternates: { canonical: `/news/${article.slug}` }, openGraph: { type: "article", title: article.title, description: article.excerpt, images: article.ogImage || article.coverImage ? [article.ogImage || article.coverImage!] : undefined } } : { title: "Story not found" }; }
export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params; const article = await getNewsBySlug(slug); if (!article) notFound();
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, image: article.ogImage || article.coverImage || undefined, author: { "@type": "Organization", name: article.authorName || "United Tigers" } }).replaceAll("<", "\\u003c");
  return <><TrackEvent event="news_article_view" payload={{ id: article.id, path: `/news/${article.slug}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><div className="inner-page"><section className="article-hero"><div className="wrap"><Link className="back-link" href="/news"><ArrowLeft size={14} /> THE NEWSROOM</Link><div className="article-meta"><span>{article.category}</span><span><Clock3 size={13} />{date}</span>{article.isDemo && <SampleBadge />}</div><h1>{article.title}</h1><p>{article.excerpt}</p></div></section><section className="section"><article className="article-content">{article.coverImage && <div className="article-image"><Image src={article.coverImage} alt="" fill sizes="100vw" priority /></div>}<SafeMarkdown content={article.content} /><p className="article-byline">{article.authorName || "United Tigers"} · {date}</p></article></section></div></>;
}

