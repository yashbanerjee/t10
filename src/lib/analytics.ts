export type AnalyticsEvent = "page_view" | "player_profile_view" | "match_view" | "news_article_view" | "fixture_click" | "social_click" | "contact_submission";
export type AnalyticsPayload = { path?: string; id?: string; href?: string; [key: string]: string | number | boolean | undefined };

/** Small vendor-neutral event boundary; a first-party analytics adapter can subscribe to this later. */
export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("unitedtigers:analytics", { detail: { event, ...payload, timestamp: new Date().toISOString() } }));
}

