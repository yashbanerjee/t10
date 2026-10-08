"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Download } from "lucide-react";
import { track } from "@/lib/analytics";

const countries = [
  ["United Arab Emirates", "+971"],
  ["Afghanistan", "+93"], ["Australia", "+61"], ["Bahrain", "+973"], ["Bangladesh", "+880"], ["Canada", "+1"],
  ["China", "+86"], ["Egypt", "+20"], ["France", "+33"], ["Germany", "+49"], ["India", "+91"], ["Indonesia", "+62"],
  ["Iran", "+98"], ["Iraq", "+964"], ["Ireland", "+353"], ["Italy", "+39"], ["Jordan", "+962"], ["Kenya", "+254"],
  ["Kuwait", "+965"], ["Lebanon", "+961"], ["Malaysia", "+60"], ["Nepal", "+977"], ["Netherlands", "+31"],
  ["New Zealand", "+64"], ["Nigeria", "+234"], ["Oman", "+968"], ["Pakistan", "+92"], ["Philippines", "+63"],
  ["Qatar", "+974"], ["Saudi Arabia", "+966"], ["Singapore", "+65"], ["South Africa", "+27"], ["Spain", "+34"],
  ["Sri Lanka", "+94"], ["Switzerland", "+41"], ["Turkey", "+90"], ["United Kingdom", "+44"], ["United States", "+1"],
  ["Yemen", "+967"], ["Zimbabwe", "+263"],
] as const;

function download(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "United-Tigers-Partnership-Brochure.pdf";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function PartnerRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [brochureUrl, setBrochureUrl] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("sending");
    const data = new FormData(form);
    const dial = String(data.get("dial") || "+971");
    const mobile = String(data.get("mobile") || "").replace(/[^\d]/g, "");
    const body = { name: data.get("name"), email: data.get("email"), phone: `${dial} ${mobile}` };
    const response = await fetch("/api/v1/partners/brochure", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;
    if (!response?.ok) { setState("error"); return; }
    const url = typeof result?.data?.brochureUrl === "string" ? result.data.brochureUrl : "";
    form.reset();
    setBrochureUrl(url);
    setState("sent");
    track("partner_brochure_request");
    if (url) download(url);
  }

  if (state === "sent") {
    return <div className="partner-popup-done">
      <p className="form-status form-status-success"><Check size={16} /> Thank you. A confirmation is on its way to your email, and our partnerships team will be in touch.</p>
      {brochureUrl ? <><p>Your brochure download has started.</p><button type="button" className="button button-accent" onClick={() => download(brochureUrl)}><Download size={16} /> DOWNLOAD AGAIN</button></> : <p>We will email the partnership brochure to you shortly.</p>}
    </div>;
  }

  return <form className="contact-form partner-form" onSubmit={submit}>
    <label>YOUR NAME<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name" /></label>
    <label>EMAIL ADDRESS<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
    <label>MOBILE NUMBER<span className="phone-row"><select name="dial" defaultValue="+971" aria-label="Country">{countries.map(([name, dial]) => <option value={dial} key={`${name}-${dial}`}>{name} {dial}</option>)}</select><input name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="[0-9 ]{6,16}" title="Mobile number without the country code" maxLength={16} placeholder="50 000 0000" /></span></label>
    {state === "error" && <p className="form-status form-status-error">We could not send that right now. Please check your details and try again.</p>}
    <button className="button button-accent" disabled={state === "sending"}>{state === "sending" ? "SENDING…" : "GET THE BROCHURE"}<ArrowRight size={16} /></button>
  </form>;
}
