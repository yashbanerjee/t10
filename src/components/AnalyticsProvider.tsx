"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { Analytics } from "firebase/analytics";
import { track } from "@/lib/analytics";
import { firebaseConfig } from "@/lib/firebase";

type QueuedEvent = { name: string; params: Record<string, string | number | boolean> };

const isAdminPath = (path: string) => path === "/admin" || path.startsWith("/admin/");

export function AnalyticsProvider() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (isAdminPath(pathname)) return;
    let analytics: Analytics | null = null;
    let cancelled = false;
    const queue: QueuedEvent[] = [];

    const flush = (logEvent: typeof import("firebase/analytics").logEvent) => {
      if (!analytics) return;
      for (const item of queue.splice(0)) logEvent(analytics, item.name, item.params);
    };

    const onTrack = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      const name = detail?.event;
      if (typeof name !== "string") return;
      const path = typeof detail.path === "string" ? detail.path : pathnameRef.current;
      if (isAdminPath(path)) return;
      const params: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(detail)) {
        if (key === "event" || key === "timestamp" || value == null) continue;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") params[key === "path" ? "page_path" : key] = value;
      }
      if (!analytics) { queue.push({ name, params }); return; }
      void import("firebase/analytics").then(({ logEvent }) => { if (!cancelled && analytics) logEvent(analytics, name, params); });
    };

    window.addEventListener("unitedtigers:analytics", onTrack);
    void (async () => {
      const [{ getApps, initializeApp }, analyticsSdk] = await Promise.all([import("firebase/app"), import("firebase/analytics")]);
      if (cancelled || !(await analyticsSdk.isSupported())) return;
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      try {
        analytics = analyticsSdk.initializeAnalytics(app, { config: { send_page_view: false } });
      } catch {
        analytics = analyticsSdk.getAnalytics(app);
      }
      flush(analyticsSdk.logEvent);
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("unitedtigers:analytics", onTrack);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isAdminPath(pathname)) track("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
