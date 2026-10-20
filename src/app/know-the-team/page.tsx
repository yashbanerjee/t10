import type { Metadata } from "next";
import { getStaff } from "@/lib/data";
import { getOwners } from "@/lib/owners";

export const metadata: Metadata = { alternates: { canonical: "/know-the-team" }, title: "Know the team", description: "Pictures and introductions for the United Tigers owners and coaching staff." };
export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */

const groups = [
  { title: "Owners", names: ["Zaffir Yasin Chowdhury", "Zainab Zehra Rizvi"] },
  { title: "Coaching", names: ["Atul Wassan", "Yasir Arafat", "Mohsin Sheikh", "Umar Gul"] },
] as const;

const keyOf = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

type Person = { name: string; role: string; image: string | null; headline: string | null; intro: string | null };

export default async function KnowTheTeamPage() {
  const [owners, staff] = await Promise.all([getOwners(), getStaff()]);
  const ownersByName = new Map(owners.map((owner) => [keyOf(owner.name), owner]));
  const staffByName = new Map(staff.map((member) => [keyOf(member.fullName), member]));
  const sections = groups.map((group) => ({
    title: group.title,
    people: group.names.flatMap((name): Person[] => {
      if (group.title === "Owners") {
        const owner = ownersByName.get(keyOf(name));
        return owner ? [{ name: owner.name, role: owner.title, image: owner.image, headline: owner.headline, intro: owner.summary }] : [];
      }
      const member = staffByName.get(keyOf(name));
      return member ? [{ name: member.fullName, role: member.title, image: member.profileImage, headline: null, intro: member.bio }] : [];
    }),
  })).filter((section) => section.people.length);

  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />THE CLUB</span><h1>KNOW THE<br />TEAM</h1><p>The owners and coaching staff of United Tigers.</p></div></section>
    <section className="section"><div className="wrap">
      {sections.map((section, index) => <section className={index ? "know-section" : undefined} key={section.title}>
        <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h2>{section.title.toUpperCase()}</h2></div></div>
        <div className="know-grid">
          {section.people.map((person) => <article className="know-card" key={person.name}>
            <div className="know-photo">{person.image ? <img src={person.image} alt="" /> : <span aria-hidden="true"><img src="/brand/tiger-gold.png" alt="" /></span>}</div>
            <div className="know-copy">
              <span className="eyebrow"><i className="eyebrow-dot" />{person.role.toUpperCase()}</span>
              <h3>{person.name}</h3>
              {person.headline && <p className="know-headline">{person.headline}</p>}
              {person.intro && <p className="know-intro">{person.intro}</p>}
            </div>
          </article>)}
        </div>
      </section>)}
    </div></section>
  </div>;
}
