"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";

export default function AdminLoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) }); const result = await response.json(); if (!response.ok) setError(result.message || "Sign-in failed"); else router.replace("/admin"); }
    catch { setError("Could not reach the sign-in service."); } finally { setBusy(false); }
  }
  return <div className="login-page"><div className="login-card"><TeamMark /><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS · CMS</span><h1>WELCOME<br />BACK.</h1><p>Sign in to manage the team’s official website.</p><form className="login-form" onSubmit={submit}><label>EMAIL ADDRESS<input name="email" autoComplete="username" type="email" required placeholder="admin@unitedtigers.ae" /></label><label>PASSWORD<input name="password" autoComplete="current-password" type="password" required minLength={8} placeholder="Your password" /></label>{error && <p className="form-status form-status-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "SIGNING IN…" : "SIGN IN TO CMS"}<ArrowRight size={15} /></button></form>{process.env.NODE_ENV !== "production" && <div className="login-hint">Local demo only: <strong>admin@unitedtigers.ae</strong> / <strong>tigers-demo</strong>. Replace with seeded credentials when PostgreSQL is configured.</div>}</div></div>;
}

