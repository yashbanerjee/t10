import type { Metadata } from "next";
import { getGallery } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";
import { PhotoFrame } from "@/components/PhotoFrame";
import { VideoPoster } from "@/components/VideoPoster";

export const metadata: Metadata = { title: "Gallery", description: "Photo albums from United Tigers events: the draft, training, match days, travel and the fans." };

type GalleryItem = Awaited<ReturnType<typeof getGallery>>[number];
type Album = { name: string; slug: string; items: GalleryItem[] };

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "album";

/** Groups media into one album per event name (the admin "Album / event" field), keeping the admin's display order. */
function toAlbums(items: GalleryItem[]): Album[] {
  const albums = new Map<string, Album>();
  for (const item of items) {
    const name = item.category.trim().toUpperCase() || "MOMENTS";
    const album = albums.get(name) ?? { name, slug: slugify(name), items: [] };
    album.items.push(item);
    albums.set(name, album);
  }
  return [...albums.values()];
}

function albumSummary(items: GalleryItem[]) {
  const photos = items.filter((item) => item.type !== "VIDEO").length;
  const videos = items.length - photos;
  return [photos ? `${photos} photo${photos === 1 ? "" : "s"}` : "", videos ? `${videos} video${videos === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");
}

export default async function GalleryPage() {
  const albums = toAlbums(await getGallery());
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap">
      <span className="eyebrow"><i className="eyebrow-dot" />THE TIGERS IN FRAME</span>
      <h1>GALLERY.</h1>
      <p>Draft night and past matches. Every event has its own album.</p>
      {albums.length > 1 && <nav className="album-nav" aria-label="Albums">
        {albums.map((album) => <a key={album.slug} href={`#album-${album.slug}`}>{album.name} <b>{album.items.length}</b></a>)}
      </nav>}
    </div></section>
    <section className="section"><div className="wrap">
      {albums.length ? <div className="album-stack">
        {albums.map((album) => <section className="gallery-album" id={`album-${album.slug}`} key={album.slug}>
          <header className="album-head"><h2>{album.name}</h2><small>{albumSummary(album.items)}</small></header>
          <div className={`gallery-grid count-${Math.min(album.items.length, 3)}`}>
            {album.items.map((item) => <figure className="gallery-item" key={item.id}>
              {item.type === "VIDEO"
                ? <VideoPoster src={item.mediaUrl} label={item.altText || item.title} />
                : <PhotoFrame src={item.mediaUrl} label={item.altText || item.title} />}
              <figcaption className="gallery-caption">{item.title}</figcaption>
            </figure>)}
          </div>
        </section>)}
      </div> : <EmptyState title="First frames coming soon" description="Event albums, from the draft to match day, will be published here through the media library." kind="gallery" />}
    </div></section>
  </div>;
}
