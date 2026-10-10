import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/TrackOrderForm";

export const metadata: Metadata = { title: "Track your booking", description: "Check the status of your United Tigers shop booking with your tracking number." };

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ number?: string; email?: string }> }) {
  const params = await searchParams;
  const number = typeof params.number === "string" ? params.number.slice(0, 40) : "";
  const email = typeof params.email === "string" ? params.email.slice(0, 180) : "";
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />OFFICIAL KIT</span><h1>TRACK YOUR<br />BOOKING.</h1><p>Enter the tracking number from your confirmation email and the email you booked with.</p></div></section>
    <section className="section"><div className="wrap"><TrackOrderForm initialNumber={number} initialEmail={email} /></div></section>
  </div>;
}
