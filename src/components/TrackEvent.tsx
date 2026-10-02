"use client";

import { useEffect } from "react";
import type { AnalyticsEvent, AnalyticsPayload } from "@/lib/analytics";
import { track } from "@/lib/analytics";

export function TrackEvent({ event, payload }: { event: AnalyticsEvent; payload: AnalyticsPayload }) {
  useEffect(() => { track(event, payload); }, [event, payload]);
  return null;
}

