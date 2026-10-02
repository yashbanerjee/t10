"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

type LiveState = { innings?: number; runs?: number; wickets?: number; overs?: string | number; currentBatsmen?: string[]; currentBowler?: string; partnership?: string; currentRunRate?: number; requiredRunRate?: number; latestEvent?: string };
type LiveMatch = { status: string; liveState?: LiveState | null; innings?: { runs: number; wickets: number; overs: string | number }[] };
export function LiveScore({ slug, initial, pollIntervalMs = 15000 }: { slug: string; initial: LiveMatch; pollIntervalMs?: number }) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    if (match.status !== "LIVE") return;
    const interval = Math.min(60000, Math.max(5000, Number.isFinite(pollIntervalMs) ? pollIntervalMs : 15000));
    const poll = async () => { try { const response = await fetch(`/api/v1/matches/${encodeURIComponent(slug)}`, { cache: "no-store" }); if (response.ok) { const result = await response.json(); if (result.success) setMatch(result.data); } } catch { /* score stays at last known update while offline */ } };
    const timer = window.setInterval(poll, interval); return () => window.clearInterval(timer);
  }, [match.status, pollIntervalMs, slug]);
  if (match.status !== "LIVE") return null;
  const live = match.liveState ?? {};
  const score = live.runs == null ? match.innings?.at(-1) : null;
  return <div className="live-score-panel" role="status" aria-live="polite"><div className="live-score-heading"><span><Radio size={14} /> LIVE NOW</span><small>UPDATES AUTOMATICALLY</small></div><div className="live-score-numbers"><strong>{live.runs ?? score?.runs ?? 0}/{live.wickets ?? score?.wickets ?? 0}</strong><span>OVERS <b>{live.overs ?? score?.overs ?? "0.0"}</b></span><span>CRR <b>{live.currentRunRate?.toFixed(2) ?? "—"}</b></span><span>REQ <b>{live.requiredRunRate?.toFixed(2) ?? "—"}</b></span></div><div className="live-score-details">{live.currentBatsmen?.length ? <span>AT THE CREASE · {live.currentBatsmen.join(" & ")}</span> : null}{live.currentBowler ? <span>BOWLER · {live.currentBowler}</span> : null}{live.partnership ? <span>PARTNERSHIP · {live.partnership}</span> : null}{live.latestEvent ? <span className="live-latest-event">{live.latestEvent}</span> : null}</div></div>;
}

