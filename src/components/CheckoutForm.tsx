"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";
import type { CheckoutCountry } from "@/lib/countries";

const fields = [
  ["name", "Full name", "text"],
  ["email", "Email", "email"],
  ["address", "Delivery address", "text"],
  ["city", "City", "text"],
] as const;

export function CheckoutForm({ onlinePayment = false, cancelledOrderId = "", countries = [] }: { onlinePayment?: boolean; cancelledOrderId?: string; countries?: CheckoutCountry[] }) {
  const cart = useCart();
  const [notice, setNotice] = useState("");
  const cancelHandled = useRef(false);

  useEffect(() => {
    if (!cancelledOrderId || cancelHandled.current) return;
    cancelHandled.current = true;
    window.history.replaceState(null, "", "/checkout");
    void fetch("/api/v1/shop/checkout/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: cancelledOrderId }) })
      .then((response) => response.json().catch(() => null))
      .then((result) => {
        if (result?.data?.paymentStatus === "PAID") setNotice(`Order ${result.data.number} is already paid. Check your email for the confirmation.`);
        else setNotice("Payment was not completed, so nothing was charged. Your bag is still here when you are ready.");
      })
      .catch(() => setNotice("Payment was not completed. Your bag is still here when you are ready."));
  }, [cancelledOrderId]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", country: countries[0]?.name ?? "United Arab Emirates", notes: "" });
  // The phone code follows the chosen country until the fan picks a different one.
  const [dialId, setDialId] = useState(countries[0]?.id ?? "");
  const [dialTouched, setDialTouched] = useState(false);
  const dial = countries.find((item) => item.id === dialId);
  function chooseCountry(name: string) {
    setForm((current) => ({ ...current, country: name }));
    const match = countries.find((item) => item.name === name);
    if (match && !dialTouched) setDialId(match.id);
  }
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const [bookedEmail, setBookedEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const total = cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/v1/shop/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, phone: dial ? `${dial.dialCode} ${form.phone.trim()}` : form.phone, items: cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "The order could not be booked.");
      if (typeof result.data.checkoutUrl === "string") {
        window.location.assign(result.data.checkoutUrl);
        return;
      }
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
      {fields.slice(0, 2).map(([key, label, type]) => <label key={key}><span>{label}</span><input required type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <label><span>Phone</span>
        <span className="phone-field">
          {countries.length > 0 && <span className="phone-code">
            <select aria-label="Country code" value={dialId} onChange={(event) => { setDialId(event.target.value); setDialTouched(true); }}>{countries.map((item) => <option key={item.id} value={item.id}>{item.dialCode} {item.name}</option>)}</select>
            <span aria-hidden="true">{dial?.dialCode}</span>
          </span>}
          <input required type="tel" inputMode="tel" autoComplete="tel-national" placeholder={dial ? "Mobile number" : "+971 50 123 4567"} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </span>
      </label>
      {fields.slice(2).map(([key, label, type]) => <label key={key}><span>{label}</span><input required type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <label><span>Country</span>{countries.length > 0
        ? <select required value={form.country} onChange={(event) => chooseCountry(event.target.value)}>{countries.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
        : <input required type="text" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />}</label>
      <label className="field-wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Size help, delivery notes, or a gift message" /></label>
    </div>
    <aside className="checkout-summary">
      {cart.lines.map((line) => <p key={line.variantId}><span>{line.name}<small>{[line.color, line.size].filter(Boolean).join(" · ")} · {line.quantity}</small></span><strong>{formatMoney(line.price * line.quantity)}</strong></p>)}
      <p className="checkout-total"><span>Total</span><strong>{formatMoney(total)}</strong></p>
      <p>{onlinePayment ? "You will pay securely by card on Stripe. Your items are held while you pay." : "Online payment is unavailable right now, so orders cannot be placed. Please check back soon."}</p>
      {notice && <p className="form-status">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={saving || !onlinePayment}>{saving ? "OPENING PAYMENT…" : onlinePayment ? `PAY ${formatMoney(total)} SECURELY` : "PAYMENT UNAVAILABLE"}</button>
    </aside>
  </form>;
}
