import type { Metadata } from "next";
import { getPlayers, getStaff } from "@/lib/data";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "The Team", description: "Meet the United Tigers squad for the 2026 Abu Dhabi T10 season." };

export default async function TeamPage() {
  const [players, staff] = await Promise.all([getPlayers(), getStaff()]);
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS · 2026</span><h1>THE SQUAD</h1><p>Meet the names announced for the Tigers’ first season. Player roles, numbers and biographies will be added as confirmed by the club.</p></div></section><section className="section"><div className="wrap"><div className="team-roster-note"><span className="eyebrow"><i className="eyebrow-dot" />ANNOUNCED NAMES</span><p>Player profile details are being completed. Each profile is ready for official photography, roles and statistics from the CMS.</p></div>{players.length ? <div className="player-grid">{players.map((player) => <PlayerCard key={player.id} player={player} />)}</div> : <EmptyState title="Squad updates are coming" description="The official squad will be shared here as it is confirmed." />}{["COACHING", "SUPPORT", "MANAGEMENT"].map((category) => { const members = staff.filter((member) => member.category.toUpperCase() === category); return <section className="staff-section" key={category}><div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h2>{category === "COACHING" ? "COACHING STAFF" : category === "SUPPORT" ? "SUPPORT STAFF" : "MANAGEMENT"}</h2></div></div>{members.length ? <div className="staff-grid">{members.map((member) => <article className="staff-card" key={member.id}><span className="staff-mark">UT</span><div><h3>{member.fullName}</h3><p>{member.title}</p></div></article>)}</div> : <p className="muted-copy">Details will be shared by the club.</p>}</section>; })}</div></section></div>;
}

