import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPlayers } from "@/lib/data";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { alternates: { canonical: "/team" }, title: "The Team", description: "Meet the United Tigers squad for the 2026 Abu Dhabi T10 season." };

export default async function TeamPage() {
  const players = await getPlayers();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS · 2026</span><h1>THE SQUAD</h1><p>Meet the names announced for the Tigers’ first season. Player roles, numbers and biographies will be added as confirmed by the club.</p></div></section>
    <section className="section"><div className="wrap">
      {players.length ? <div className="player-grid">{players.map((player) => <PlayerCard key={player.id} player={player} />)}</div> : <EmptyState title="Squad updates are coming" description="The official squad will be shared here as it is confirmed." />}
      <div className="staff-section"><Link className="button button-outline" href="/management">MEET THE TEAM MANAGEMENT <ArrowUpRight size={15} /></Link></div>
    </div></section>
  </div>;
}
