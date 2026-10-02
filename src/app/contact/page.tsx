import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Contact United Tigers for supporter enquiries, partnerships and media." };
export default function ContactPage() {
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />GET IN TOUCH</span><h1>LET’S<br />TALK.</h1><p>For partnership, media and supporter enquiries, leave a message for the team.</p></div></section><section className="section"><div className="wrap contact-layout"><aside className="contact-aside"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h2>WE’RE READY<br />TO LISTEN.</h2><p>Send your message and the relevant team will get back to you.</p><div className="contact-detail"><span>FOLLOW THE TEAM</span><strong><a href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer">@unitedtigers.ae ↗</a></strong></div><div className="contact-detail"><span>BASED IN</span><strong>Abu Dhabi, United Arab Emirates</strong></div></aside><ContactForm /></div></section></div>;
}

