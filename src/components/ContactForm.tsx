"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { track } from "@/lib/analytics";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/v1/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (response?.ok) { event.currentTarget.reset(); setState("sent"); track("contact_submission"); } else setState("error");
  }
  return <form className="contact-form" onSubmit={submit}>
    <div className="form-pair"><label>YOUR NAME<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name" /></label><label>EMAIL ADDRESS<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label></div>
    <div className="form-pair"><label>PHONE <span>(OPTIONAL)</span><input name="phone" autoComplete="tel" maxLength={40} placeholder="+971 ..." /></label><label>SUBJECT<input name="subject" required minLength={3} maxLength={120} placeholder="What would you like to discuss?" /></label></div>
    <label>MESSAGE<textarea name="message" required minLength={10} maxLength={4000} rows={5} placeholder="Tell us a little more..." /></label>
    {state === "sent" && <p className="form-status form-status-success"><Check size={16} /> Message received. The team will be in touch.</p>}
    {state === "error" && <p className="form-status form-status-error">We couldn’t send that right now. Please try again.</p>}
    <button className="button button-primary" disabled={state === "sending"}>{state === "sending" ? "SENDING…" : "SEND MESSAGE"}<ArrowRight size={16} /></button>
  </form>;
}

