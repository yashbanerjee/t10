import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { getMatches } from "@/lib/data";
import { getTicketSettings } from "@/lib/site-settings";
import { NationSignup } from "@/components/NationSignup";
import { TicketButton } from "@/components/TicketButton";

export const metadata: Metadata = { title: "Tickets", description: "Buy tickets for United Tigers matches at the Abu Dhabi T10." };

const dubai = (value: Date, options: Intl.DateTimeFormatOptions) => new Date(value).toLocaleString("en-GB", { ...options, timeZone: "Asia/Dubai" });

export default async function TicketsPage() {
  const [matches, tickets] = await Promise.all([getMatches(), getTicketSettings()]);
  const upcoming = matches.filter((match) => match.status === "UPCOMING" || match.status === "LIVE");
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />ABU DHABI T10 · MATCH DAY</span><h1>BE THERE<br />FOR THE HUNT.</h1><p>{tickets.url ? "Secure your seat for every United Tigers fixture. Tickets open with the official seller in a new tab." : "Tickets for United Tigers matches go on sale through the Abu Dhabi T10 official channels. The buy link for each fixture appears here the moment sales open."}</p>
      <div className="ticket-hero-actions"><TicketButton tickets={tickets} className="button button-orange" fallbackHref="#fixtures" fallbackLabel="SEE THE FIXTURES" /><Link className="button button-outline" href="/fixtures">FULL SCHEDULE <ArrowUpRight size={14} /></Link></div>
      {tickets.note && <p className="ticket-note">{tickets.note}</p>}
    </div></section>
    <section className="section" id="fixtures"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UPCOMING FIXTURES</span><h2>PICK YOUR MATCH</h2></div></div>
      {upcoming.length ? <div className="ticket-list">{upcoming.map((match) => <article className="ticket-row" key={match.id}>
        <div className="ticket-date"><span>{dubai(match.date, { day: "2-digit" })}</span><small>{dubai(match.date, { month: "short", year: "numeric" }).toUpperCase()}</small></div>
        <div className="ticket-match"><strong>United Tigers <em>vs</em> {match.opponent}</strong><p><span className="ticket-fact"><CalendarDays size={12} aria-hidden="true" /> {dubai(match.date, { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true })} GST</span><span className="ticket-fact"><MapPin size={12} aria-hidden="true" /> {match.venue?.name ?? "Venue TBC"}</span></p></div>
        <div className="ticket-actions">{match.status === "LIVE" ? <span className="ticket-chip is-live">LIVE NOW</span> : tickets.url ? <TicketButton tickets={tickets} className="button button-orange" /> : <span className="ticket-chip">ON SALE SOON</span>}<Link className="text-link" href={`/matches/${match.slug}`}>MATCH CENTRE <ArrowUpRight size={13} /></Link></div>
      </article>)}</div> : <div className="fan-empty"><h2>The next fixtures are being confirmed.</h2><p>Match dates appear here as soon as the league publishes them.</p></div>}
    </div></section>
    <section className="section section-dark"><div className="wrap ticket-signup">
      <div><span className="eyebrow"><i className="eyebrow-dot" />TIGERS NATION</span><h2>FIRST TO KNOW.</h2><p>Join Tigers Nation and get the ticket release, match-day details and squad news straight from the club.</p></div>
      <div className="ticket-signup-form"><Ticket size={18} aria-hidden="true" /><NationSignup /></div>
    </div></section>
  </div>;
}
