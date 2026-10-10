"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, PackageSearch, X } from "lucide-react";
import { formatMoney } from "@/lib/money";

type TrackedOrder = {
  number: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  name: string;
  createdAt: string;
  city: string;
  country: string;
  total: number;
  items: { productName: string; color: string; size: string; quantity: number; unitPrice: number }[];
};

const statusCopy: Record<TrackedOrder["status"], { label: string; text: string }> = {
  PENDING: { label: "BOOKED", text: "Your items are reserved. The club will contact you by phone or email to confirm payment and delivery." },
  CONFIRMED: { label: "CONFIRMED", text: "Payment and delivery are agreed. The club will hand over or deliver your kit as arranged." },
  CANCELLED: { label: "CANCELLED", text: "This booking was cancelled. Get in touch with the club if you think this is a mistake." },
};

export function TrackOrderForm({ initialNumber = "", initialEmail = "" }: { initialNumber?: string; initialEmail?: string }) {
  const [number, setNumber] = useState(initialNumber);
  const [email, setEmail] = useState(initialEmail);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const autoRan = useRef(false);

  const lookup = useCallback(async (trackingNumber: string, bookingEmail: string) => {
    setLoading(true); setError(""); setOrder(null);
    try {
      const response = await fetch("/api/v1/shop/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ number: trackingNumber.trim(), email: bookingEmail.trim() }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "We could not find that booking.");
      setOrder(result.data as TrackedOrder);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not find that booking.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRan.current || !initialNumber || !initialEmail) return;
    autoRan.current = true;
    void lookup(initialNumber, initialEmail);
  }, [initialNumber, initialEmail, lookup]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup(number, email);
  }

  const steps = order?.status === "CANCELLED" ? ["BOOKED", "CANCELLED"] : ["BOOKED", "CONFIRMED"];
  const reached = order ? (order.status === "PENDING" ? 0 : 1) : -1;

  return <div className="track-layout">
    <form className="contact-form track-form" onSubmit={submit}>
      <label>TRACKING NUMBER<input value={number} onChange={(event) => setNumber(event.target.value.toUpperCase())} required minLength={3} maxLength={40} placeholder="UT-XXXXXXXX" autoComplete="off" spellCheck={false} /></label>
      <label>EMAIL ADDRESS<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={180} placeholder="The email you booked with" autoComplete="email" /></label>
      {error && <p className="form-status form-status-error">{error}</p>}
      <button className="button button-accent" disabled={loading}>{loading ? "SEARCHING…" : "TRACK BOOKING"}<PackageSearch size={16} /></button>
      <p className="track-help">Your tracking number is in your booking confirmation email and starts with UT-.</p>
    </form>
    {order && <section className={`track-result is-${order.status.toLowerCase()}`} aria-live="polite">
      <header>
        <span className="eyebrow"><i className="eyebrow-dot" />TRACKING {order.number}</span>
        <h2>{statusCopy[order.status].label}</h2>
        <p>Hello {order.name}, {statusCopy[order.status].text.charAt(0).toLowerCase()}{statusCopy[order.status].text.slice(1)}</p>
      </header>
      <ol className="track-steps">
        {steps.map((step, index) => <li key={step} className={index <= reached ? (step === "CANCELLED" ? "is-cancelled" : "is-done") : ""}>
          <i aria-hidden="true">{index <= reached ? (step === "CANCELLED" ? <X size={14} /> : <Check size={14} />) : index + 1}</i>
          <span>{step}</span>
        </li>)}
      </ol>
      <dl className="track-meta">
        <div><dt>Booked on</dt><dd>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
        <div><dt>Deliver to</dt><dd>{order.city}, {order.country}</dd></div>
      </dl>
      <div className="checkout-summary">
        {order.items.map((item, index) => <p key={`${item.productName}-${index}`}><span>{item.productName}<small> {[item.color, item.size].filter(Boolean).join(" · ")} · {item.quantity}</small></span><strong>{formatMoney(item.unitPrice * item.quantity)}</strong></p>)}
        <p className="checkout-total"><span>Total</span><strong>{formatMoney(order.total)}</strong></p>
      </div>
      <Link className="button button-outline" href="/contact">QUESTIONS? CONTACT THE CLUB</Link>
    </section>}
  </div>;
}
