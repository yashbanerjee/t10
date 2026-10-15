import type { Metadata } from "next";
import { Facebook, Instagram } from "lucide-react";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { getOwners } from "@/lib/owners";

export const metadata: Metadata = { alternates: { canonical: "/owners" }, title: "Meet the owners", description: "The people who own United Tigers, the club’s franchise in the Abu Dhabi T10 League." };
export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */

const listNames = (names: string[]) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

export default async function OwnersPage() {
  const owners = await getOwners();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE CLUB</span><h1>MEET THE<br />OWNERS</h1><p>{owners.length ? `United Tigers is owned by ${listNames(owners.map((owner) => owner.name))}.` : "Owner profiles will appear here soon."}</p></div></section>
    {owners.map((owner, index) => <section className={`section owner-section${index % 2 ? " section-dark" : ""}`} id={owner.slug} key={owner.id}><div className="wrap owner-profile">
      <div className="owner-photo">{owner.image ? <img src={owner.image} alt={owner.name} loading={index ? "lazy" : "eager"} /> : <span aria-hidden="true"><img src="/brand/tiger-gold.png" alt="" /></span>}</div>
      <div className="owner-text">
        <span className="eyebrow"><i className="eyebrow-dot" />{owner.title.toUpperCase()}</span>
        <h2>{owner.name}</h2>
        {(owner.facebook || owner.instagram) && <div className="owner-socials">
          {owner.facebook && <a className="is-facebook" href={owner.facebook} target="_blank" rel="noreferrer" aria-label={`${owner.name} on Facebook`}><Facebook size={16} /> Facebook</a>}
          {owner.instagram && <a className="is-instagram" href={owner.instagram} target="_blank" rel="noreferrer" aria-label={`${owner.name} on Instagram`}><Instagram size={16} /> Instagram</a>}
        </div>}
        {owner.headline && <p className="owner-headline">{owner.headline}</p>}
        {owner.summary && <p className="owner-summary">{owner.summary}</p>}
        {owner.bio ? <div className="article-content owner-bio"><SafeMarkdown content={owner.bio} /></div> : <p className="owner-summary">A full profile is coming soon.</p>}
        {owner.quote && <blockquote className="owner-quote">{owner.quote}</blockquote>}
      </div>
    </div></section>)}
  </div>;
}
