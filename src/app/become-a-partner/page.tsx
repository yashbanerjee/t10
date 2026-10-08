import type { Metadata } from "next";
import { PartnerRequestForm } from "@/components/PartnerBrochure";

export const metadata: Metadata = {
  title: "Become a partner",
  description: "Partner with United Tigers. Share your details and download the partnership brochure.",
  alternates: { canonical: "/become-a-partner" },
};

const points = [
  { label: "ON THE WEBSITE", text: "Your brand sits with the club across the public site, from the partners page to match coverage." },
  { label: "ON MATCH DAYS", text: "Partnership conversations cover the Abu Dhabi T10 season, the fastest format in the game." },
  { label: "WITH THE FANS", text: "United Tigers tell the season on the site and on the club’s social channels." },
  { label: "THE BROCHURE", text: "Send your name, email and mobile number. The brochure downloads here, and a copy of the request goes to your inbox and to the club." },
];

export default function BecomeAPartnerPage() {
  return <div className="inner-page">
    <section className="inner-hero">
      <div className="wrap">
        <span className="eyebrow"><i className="eyebrow-dot" />BUILD WITH THE TIGERS</span>
        <h1>BECOME A<br />PARTNER.</h1>
        <p>United Tigers are building a platform for ambitious partners in cricket’s fastest format. Tell us who you are and take the brochure with you.</p>
      </div>
    </section>
    <section className="section">
      <div className="wrap contact-layout">
        <aside className="contact-aside">
          <span className="eyebrow"><i className="eyebrow-dot" />WHAT A PARTNERSHIP COVERS</span>
          <h2>A SEASON<br />WITH THE CLUB.</h2>
          <p>Share a few details and the partnerships team will follow up on the email you enter.</p>
          <ul className="partner-points">
            {points.map((point) => <li key={point.label}><span>{point.label}</span><strong>{point.text}</strong></li>)}
          </ul>
        </aside>
        <PartnerRequestForm />
      </div>
    </section>
  </div>;
}
