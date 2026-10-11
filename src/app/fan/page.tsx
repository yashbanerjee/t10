import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Fan zone", description: "The United Tigers Fan Zone is coming soon." };

export default function FanPage() {
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />FAN ZONE</span><h1>FAN ZONE IS<br />COMING SOON.</h1><p>A home for Tigers supporters is on its way. Until it opens, you can vote in club polls and enter contests on the Vote page.</p></div></section>
    <section className="section"><div className="wrap fan-empty">
      <h2>Stay tuned, Tigers.</h2>
      <p>We will announce the Fan Zone on our social channels as soon as it is ready.</p>
      <Link className="button button-accent" href="/vote">VOTE & CONTESTS <ArrowUpRight size={15} /></Link>
    </div></section>
  </div>;
}
