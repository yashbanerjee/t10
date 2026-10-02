import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "About United Tigers", description: "The story, mission and vision of United Tigers." };
export default function AboutPage() {
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />OUR STORY</span><h1>BUILT FOR<br />THE MOMENT.</h1><p>A new force in cricket’s fastest format. A team with room to grow, and a city ready to roar.</p></div></section><section className="section"><div className="wrap"><div className="about-grid"><div className="about-art" /><div className="about-copy"><span className="eyebrow"><i className="eyebrow-dot" />THE UNITED TIGERS</span><h2>A NEW<br />CHAPTER.</h2><p>United Tigers are a new Abu Dhabi T10 franchise announced for the 2026 season. The club brings a fresh identity to a format built for pace, energy and unforgettable moments.</p><p>Fakhar Zaman has been announced as the team’s icon player. As the squad takes shape, the club’s story will be written alongside its players, partners and fans.</p><Link className="text-link" href="/team">MEET THE SQUAD <ArrowUpRight size={14} /></Link></div></div><div className="about-pillars"><article><span>01</span><h3>OUR MISSION</h3><p>Bring people together through fast, fearless cricket and a shared pride in the Tigers.</p></article><article><span>02</span><h3>OUR VISION</h3><p>Build a team and fan community that grows stronger with every season.</p></article><article><span>03</span><h3>OUR VALUES</h3><p>Play with courage. Move with purpose. Make room for everyone in the pride.</p></article></div></div></section></div>;
}

