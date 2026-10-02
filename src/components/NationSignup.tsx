"use client";

import { FormEvent, useState } from "react";

export function NationSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Tigers Nation", email, subject: "Tigers Nation signup", message: "Please add this email to Tigers Nation updates." }),
    });
    setBusy(false);
    if (!response.ok) {
      setStatus("Enter a valid email and try again.");
      return;
    }
    setEmail("");
    setStatus("You are on the list.");
  }

  return <form className="nation-form" onSubmit={submit}>
    <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" aria-label="Email address" />
    <button type="submit" disabled={busy}>{busy ? "..." : "SIGN UP"}</button>
    {status && <small>{status}</small>}
  </form>;
}
