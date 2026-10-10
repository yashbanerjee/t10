import type { Metadata } from "next";
import { getFranchises } from "@/lib/data";
import { EmptyState } from "@/components/EmptyState";
import { FranchiseGrid } from "@/components/FranchiseGrid";

export const metadata: Metadata = { title: "About", description: "United Tigers and the sister franchises: names, logos, leagues and social channels." };

export default async function FranchisesPage() {
  const franchises = await getFranchises();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap">
      <span className="eyebrow"><i className="eyebrow-dot" />ABOUT</span>
      <h1>OUR<br />FRANCHISES.</h1>
      <p>The clubs in the group, the league each one plays in, and where to follow them.</p>
    </div></section>
    <section className="section"><div className="wrap">
      {franchises.length ? <FranchiseGrid franchises={franchises} /> : <EmptyState title="Franchises will be listed here" description="Names, logos, leagues and social links are added from the admin Franchises section." />}
    </div></section>
  </div>;
}
