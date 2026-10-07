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
  return <div className="login-page"><div className="login-card"><TeamMark tone="light" /><p className="login-product">United Tigers CMS</p><h1>Log in to continue</h1><p>Use your administrator account to manage players, fixtures and published content.</p><form className="login-form" onSubmit={submit}><label>Email address<input name="email" autoComplete="username" type="email" required placeholder="name@club.com" /></label><label>Password<input name="password" autoComplete="current-password" type="password" required minLength={8} placeholder="Enter your password" /></label>{error && <p className="form-status form-status-error" role="alert">{error}</p>}<button className="admin-primary-btn" disabled={busy}>{busy ? "Signing in…" : "Log in"}<ArrowRight size={15} /></button></form></div></div>;
}

