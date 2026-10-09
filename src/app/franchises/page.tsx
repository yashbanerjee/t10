import type { Metadata } from "next";
import Image from "next/image";
import path from "path";
import sharp from "sharp";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { getFranchises } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "About", description: "United Tigers and the sister franchises: names, logos, leagues and social channels." };

function mark(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const last = parts.at(-1) ?? "";
  if (parts.length > 2 && last.length <= 4) return last;
  return parts.slice(0, 2).map((part) => part[0] ?? "").join("");
}

const channels = [
  ["facebook", Facebook, "Facebook"],
  ["instagram", Instagram, "Instagram"],
  ["x", Twitter, "X"],
  ["youtube", Youtube, "YouTube"],
] as const;

const shapes = new Map<string, boolean>();

/** Wide wordmarks sit inside the tile; square crests fill it edge to edge. */
async function isWide(url: string) {
  if (shapes.has(url)) return shapes.get(url)!;
  let wide = false;
  if (url.startsWith("/") && !url.startsWith("//")) {
    try {
      const { width = 1, height = 1 } = await sharp(path.join(process.cwd(), "public", url)).metadata();
      wide = width / height > 1.2;
    } catch { wide = false; }
  }
  shapes.set(url, wide);
  return wide;
}

export default async function FranchisesPage() {
  const franchises = await getFranchises();
  const wide = await Promise.all(franchises.map((franchise) => franchise.logoUrl ? isWide(franchise.logoUrl) : false));
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap">
      <span className="eyebrow"><i className="eyebrow-dot" />ABOUT</span>
      <h1>OUR<br />FRANCHISES.</h1>
      <p>The clubs in the group, the league each one plays in, and where to follow them.</p>
    </div></section>
    <section className="section"><div className="wrap">
      {franchises.length ? <div className="franchise-grid">
        {franchises.map((franchise, index) => {
          const links = channels.flatMap(([key, Icon, label]) => {
            const href = franchise[key];
            return href ? [{ href, Icon, label }] : [];
          });
          const home = franchise.slug === "united-tigers";
          return <article className={`franchise-card${home ? " is-home" : ""}`} key={franchise.id}>
            <div className={`franchise-logo${wide[index] ? " is-wide" : ""}`}>
              {franchise.logoUrl ? <Image src={franchise.logoUrl} alt="" fill sizes={home ? "280px" : "180px"} /> : <span>{mark(franchise.name)}</span>}
            </div>
            <div className="franchise-body">
              {home && <span className="franchise-tag">OUR CLUB</span>}
              <p>{franchise.league}</p>
              <h2>{franchise.name}</h2>
              {links.length > 0 && <div className="franchise-socials">
                {links.map(({ href, Icon, label }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${franchise.name} on ${label}`}><Icon size={15} /></a>)}
              </div>}
            </div>
          </article>;
        })}
      </div> : <EmptyState title="Franchises will be listed here" description="Names, logos, leagues and social links are added from the admin Franchises section." />}
    </div></section>
  </div>;
}
