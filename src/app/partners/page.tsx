import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSponsors } from "@/lib/data";

export const metadata: Metadata = { title: "Partners", description: "Meet the United Tigers partners and learn about partnership opportunities." };
export default async function PartnersPage() {
  const sponsors = await getSponsors();
  const categories = ["TITLE PARTNER", "PRINCIPAL PARTNER", "OFFICIAL PARTNER", "MEDIA PARTNER"];
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />TOGETHER, WE MOVE FORWARD</span><h1>OUR<br />PARTNERS.</h1><p>United Tigers are building a platform for ambitious partners to connect with cricket’s fastest format.</p></div></section><section className="section"><div className="wrap"><div className="partner-stack">{categories.map((category) => <section className="partner-category" key={category}><h2>{category}</h2>{sponsors.filter((sponsor) => sponsor.category.toUpperCase() === category).length ? <div className="partner-grid">{sponsors.filter((sponsor) => sponsor.category.toUpperCase() === category).map((sponsor) => <a className="partner-item" key={sponsor.id} href={sponsor.website || "#"} target={sponsor.website ? "_blank" : undefined} rel="noreferrer">{sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={sponsor.name} width={180} height={70} /> : <span>{sponsor.name}</span>}</a>)}</div> : <p className="muted-copy">Partner announcements will be shared here.</p>}</section>)}</div><div className="sponsor-cta"><div><span className="eyebrow"><i className="eyebrow-dot" />BUILD WITH THE TIGERS</span><h3>LET’S MAKE A MARK.</h3><p>Talk to our team about 2026 partnership opportunities.</p></div><Link className="button button-primary" href="/contact">GET IN TOUCH <ArrowUpRight size={15} /></Link></div></div></section></div>;
}

