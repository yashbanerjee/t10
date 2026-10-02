"use client";

import { FormEvent, useState } from "react";

function FanDetails({ form, setForm }: { form: { name: string; email: string; phone: string }; setForm: (value: { name: string; email: string; phone: string }) => void }) {
  return <>
    <label><span>Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
    <label><span>Email</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
    <label><span>Phone</span><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
  </>;
}

export function PollBallot({ slug, options, closed }: { slug: string; options: { id: string; label: string; votes: number }[]; closed: boolean }) {
  const total = options.reduce((sum, option) => sum + option.votes, 0);
  const [choice, setChoice] = useState(options[0]?.id ?? "");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/polls/${slug}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, optionId: choice }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "The vote could not be saved.");
      setMessage("Your vote is in. Refresh the page to see the updated tally.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The vote could not be saved."); }
    finally { setSaving(false); }
  }

  return <div className="fan-panel">
    <div className="poll-bars">{options.map((option) => <div key={option.id}><div><span>{option.label}</span><strong>{total ? Math.round((option.votes / total) * 100) : 0}%</strong></div><i style={{ width: `${total ? (option.votes / total) * 100 : 0}%` }} /></div>)}</div>
    {closed ? <p>This poll has closed.</p> : message ? <p className="fan-success">{message}</p> : <form className="fan-form" onSubmit={submit}>
      <div className="choice-row">{options.map((option) => <button type="button" key={option.id} className={choice === option.id ? "is-selected" : ""} onClick={() => setChoice(option.id)}>{option.label}</button>)}</div>
      <FanDetails form={form} setForm={setForm} />
      {error && <p className="form-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? "SENDING…" : "CAST VOTE"}</button>
    </form>}
  </div>;
}

export function ContestEntryForm({ slug, prompt, closed }: { slug: string; prompt: string; closed: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/v1/contests/${slug}/enter`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, answer }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "The entry could not be saved.");
      setMessage("You are in. We will use this email and phone if you are selected.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The entry could not be saved."); }
    finally { setSaving(false); }
  }

  if (closed) return <p>This contest has closed.</p>;
  if (message) return <p className="fan-success">{message}</p>;
  return <form className="fan-form" onSubmit={submit}>
    <FanDetails form={form} setForm={setForm} />
    <label className="field-wide"><span>{prompt}</span><textarea required value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="button button-primary" type="submit" disabled={saving}>{saving ? "SENDING…" : "ENTER CONTEST"}</button>
  </form>;
}
