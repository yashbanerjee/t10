import type { Metadata } from "next";
import Link from "next/link";
import { getGallery } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";
import { PhotoFrame } from "@/components/PhotoFrame";
import { VideoPoster } from "@/components/VideoPoster";

export const metadata: Metadata = {
  title: "Player Draft",
  description: "Videos and photos from United Tigers draft night.",
  alternates: { canonical: "/draft" },
};

export default async function DraftPage() {
  const items = (await getGallery()).filter((item) => /draft/i.test(item.category));
  const videos = items.filter((item) => item.type === "VIDEO");
  const photos = items.filter((item) => item.type !== "VIDEO");

  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap">
      <Link className="eyebrow" href="/updates"><i className="eyebrow-dot" />Recent activity</Link>
      <h1>PLAYER<br />DRAFT</h1>
      <p>The night the squad came together. Watch the draft, then look through the room.</p>
    </div></section>
    <section className="section"><div className="wrap">
      {items.length ? <div className="album-stack">
        {videos.length > 0 && <section>
          <header className="album-head"><h2>Videos</h2><small>{videos.length} video{videos.length === 1 ? "" : "s"}</small></header>
          <div className="gallery-grid">
            {videos.map((item) => <figure className="gallery-item" key={item.id}>
              <VideoPoster src={item.mediaUrl} label={item.altText || item.title} />
              <figcaption className="gallery-caption">{item.title}</figcaption>
            </figure>)}
          </div>
        </section>}
        {photos.length > 0 && <section>
          <header className="album-head"><h2>Photos</h2><small>{photos.length} photo{photos.length === 1 ? "" : "s"}</small></header>
          <div className="gallery-grid">
            {photos.map((item) => <figure className="gallery-item" key={item.id}>
              <PhotoFrame src={item.mediaUrl} label={item.altText || item.title} />
              <figcaption className="gallery-caption">{item.title}</figcaption>
            </figure>)}
          </div>
        </section>}
      </div> : <EmptyState title="Draft night is on its way" description="Videos and photos from the player draft will appear here once they are published." kind="gallery" />}
    </div></section>
  </div>;
}
