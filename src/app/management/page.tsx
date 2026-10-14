import type { Metadata } from "next";
import { getStaff } from "@/lib/data";
import { StaffCard } from "@/components/StaffCard";
import { EmptyState } from "@/components/EmptyState";
import { STAFF_AREAS } from "@/lib/staff";

export const metadata: Metadata = { title: "Team management", description: "Meet the leadership, coaches, support and media staff behind United Tigers." };
export const dynamic = "force-dynamic";

export default async function ManagementPage() {
  const staff = await getStaff();
  const known = new Set<string>(STAFF_AREAS.map(([key]) => key));
  const sections = [...STAFF_AREAS.map(([key, title]) => ({ key, title, members: staff.filter((member) => member.category.toUpperCase() === key) })), { key: "OTHER", title: "Club staff", members: staff.filter((member) => !known.has(member.category.toUpperCase())) }].filter((section) => section.members.length);
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS · 2026</span><h1>TEAM<br />MANAGEMENT</h1><p>The leadership, coaches, support and media staff working behind the Tigers.</p></div></section>
    <section className="section"><div className="wrap">
      {sections.length ? sections.map((section, index) => <section className={index ? "staff-section" : undefined} key={section.key}>
        <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h2>{section.title.toUpperCase()}</h2></div></div>
        <div className="player-grid">{section.members.map((member) => <StaffCard key={member.id} member={member} />)}</div>
      </section>) : <EmptyState title="Team management is coming" description="The club’s management team will be shared here soon." />}
    </div></section>
  </div>;
}
