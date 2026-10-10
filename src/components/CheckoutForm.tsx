"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";

const fields = [
  ["name", "Full name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "tel"],
  ["address", "Delivery address", "text"],
  ["city", "City", "text"],
  ["country", "Country", "text"],
] as const;

export function CheckoutForm() {
  const cart = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", country: "United Arab Emirates", notes: "" });
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const [bookedEmail, setBookedEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const total = cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/v1/shop/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, items: cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "The order could not be booked.");
      setBookedEmail(form.email.trim());
      setNumber(result.data.number);
      cart.clear();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The order could not be booked.");
    } finally { setSaving(false); }
  }

  if (!cart.lines.length && !number) return <div className="fan-empty"><h2>Your bag is empty.</h2><Link className="button button-primary" href="/shop">BROWSE THE KIT</Link></div>;
  if (number) return <div className="fan-empty">
    <span className="eyebrow"><i className="eyebrow-dot" />BOOKED</span>
    <h2>YOUR KIT IS RESERVED</h2>
    <div className="booking-tracking"><small>TRACKING NUMBER</small><strong>{number}</strong></div>
    <p>Keep this number. It is also in the confirmation email sent to {bookedEmail || "you"}. The club will confirm the kit and arrange payment.</p>
    <div className="booking-actions">
      <Link className="button button-accent" href={`/track-order?number=${encodeURIComponent(number)}${bookedEmail ? `&email=${encodeURIComponent(bookedEmail)}` : ""}`}>TRACK THIS BOOKING</Link>
      <Link className="button button-outline" href="/shop">BACK TO THE SHOP</Link>
    </div>
  </div>;

  return <form className="checkout-layout" onSubmit={submit}>
    <div className="checkout-fields">
      {fields.map(([key, label, type]) => <label key={key}><span>{label}</span><input required type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <label className="field-wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Size help, delivery notes, or a gift message" /></label>
    </div>
    <aside className="checkout-summary">
      {cart.lines.map((line) => <p key={line.variantId}><span>{line.name}<small>{[line.color, line.size].filter(Boolean).join(" · ")} · {line.quantity}</small></span><strong>{formatMoney(line.price * line.quantity)}</strong></p>)}
      <p className="checkout-total"><span>Total</span><strong>{formatMoney(total)}</strong></p>
      <p>Booking holds the stock. Payment is confirmed with you by phone or email.</p>
      {error && <p className="form-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? "BOOKING…" : "BOOK THIS ORDER"}</button>
    </aside>
  </form>;
}
