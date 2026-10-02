import type { Metadata } from "next";
import Image from "next/image";
import { getGallery } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Gallery", description: "Photos and videos from the United Tigers team, matches and fans." };
export default async function GalleryPage() {
  const items = await getGallery();
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE TIGERS IN FRAME</span><h1>GALLERY.</h1><p>Training, match day, travel and everything in between.</p></div></section><section className="section"><div className="wrap">{items.length ? <div className="gallery-grid">{items.map((item) => <figure className="gallery-item" key={item.id}>{item.type === "VIDEO" ? <video src={item.mediaUrl} controls playsInline preload="metadata" aria-label={item.altText || item.title} /> : <Image src={item.mediaUrl} alt={item.altText || item.title} fill sizes="(max-width: 760px) 50vw, 33vw" />}<figcaption className="gallery-caption">{item.title}</figcaption></figure>)}</div> : <EmptyState title="First frames coming soon" description="Team photography and video will be published here through the media library." kind="gallery" />}</div></section></div>;
}

