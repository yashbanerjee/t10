import type { Metadata } from "next";
import Image from "next/image";
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

export default async function FranchisesPage() {
  const franchises = await getFranchises();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap">
      <span className="eyebrow"><i className="eyebrow-dot" />ABOUT</span>
      <h1>OUR<br />FRANCHISES.</h1>
      <p>The clubs in the group, the league each one plays in, and where to follow them.</p>
    </div></section>
    <section className="section"><div className="wrap">
      {franchises.length ? <div className="franchise-grid">
        {franchises.map((franchise) => {
          const links = channels.flatMap(([key, Icon, label]) => {
            const href = franchise[key];
            return href ? [{ href, Icon, label }] : [];
          });
          return <article className="franchise-card" key={franchise.id}>
            <div className="franchise-logo">
              {franchise.logoUrl ? <Image src={franchise.logoUrl} alt="" fill sizes="160px" /> : <span>{mark(franchise.name)}</span>}
            </div>
            <h2>{franchise.name}</h2>
            <p>{franchise.league}</p>
            {links.length > 0 && <div className="franchise-socials">
              {links.map(({ href, Icon, label }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${franchise.name} on ${label}`}><Icon size={15} /></a>)}
            </div>}
          </article>;
        })}
      </div> : <EmptyState title="Franchises will be listed here" description="Names, logos, leagues and social links are added from the admin Franchises section." />}
    </div></section>
  </div>;
}
