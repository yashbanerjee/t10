export type AnalyticsEvent = "page_view" | "player_profile_view" | "match_view" | "news_article_view" | "fixture_click" | "social_click" | "contact_submission" | "partner_brochure_request";
export type AnalyticsPayload = { path?: string; id?: string; href?: string; [key: string]: string | number | boolean | undefined };

/** Site event boundary. AnalyticsProvider forwards these to Firebase Analytics (GA4). */
export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("unitedtigers:analytics", { detail: { event, ...payload, timestamp: new Date().toISOString() } }));
}

