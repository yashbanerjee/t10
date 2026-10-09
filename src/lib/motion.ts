/**
 * Scroll motion for the public site. Each group enters with its own style; anything matched by
 * BLOCK_FALLBACK that no group claims simply rises.
 */
export const MOTION_GROUPS = {
  slide: [
    ".inner-hero .wrap > *",
    ".board-head",
    ".section-heading",
    ".album-head",
    ".stats-head",
    ".stats-block-head",
    ".stats-explorer-head",
    ".scorecard-heading",
    ".profile-section-title",
    ".live-score-heading",
    "table tbody > tr",
  ],
  zoom: [
    ".player-profile-hero",
    ".match-centre-hero",
    ".article-hero",
    ".last-match-card",
    ".match-live-strip",
  ],
  left: [
    ".about-grid > :first-child",
    ".contact-layout > :first-child",
    ".cart-layout > :first-child",
    ".checkout-layout > :first-child",
  ],
  right: [
    ".about-grid > :last-child",
    ".contact-layout > :last-child",
    ".cart-layout > :last-child",
    ".checkout-layout > :last-child",
  ],
  wipe: [
    ".gallery-item",
    ".highlight-row > *",
    ".moment-grid > *",
    ".kit-row > *",
    ".product-grid > *",
  ],
  flip: [
    ".player-grid > *",
    ".news-grid > *",
    ".update-grid > *",
    ".partner-grid > *",
    ".franchise-grid > *",
    ".record-grid > *",
    ".about-pillars > *",
    ".fan-grid > *",
    ".fan-launch-grid > *",
    ".profile-grid > *",
    ".pulse-grid > *",
    ".frame-row > *",
    ".player-stat-grid > *",
    ".leader-cards > *",
    ".season-strip > *",
    ".nation-stats > li",
    ".mini-squad > a",
    ".vote-faces > span",
    ".result-list > *",
    ".daily-list > *",
    ".fixture-list > *",
    ".stats-group > *",
    ".filter-tabs > *",
    ".stats-switch > *",
    ".hero-links > *",
    ".contact-detail",
    ".fan-card",
    ".player-stat",
    ".season-stat",
  ],
  rise: [
    ".dash-card",
    ".stay-card",
    ".stats-card",
    ".report-card",
    ".stats-table-wrap",
    ".scorecard-section",
    ".stats-block",
    ".player-stats-module",
    ".player-profile-bio",
    ".staff-section",
    ".contact-form",
    ".contact-aside",
    ".partner-form",
    ".fan-form",
    ".fan-panel",
    ".checkout-summary",
    ".empty-state",
    ".fan-empty",
    ".stats-empty",
    ".live-score-panel",
    ".match-centre-details",
    ".timeline-item",
    ".fixture-row",
    ".about-copy",
    ".article-meta",
    ".stats-intro",
    ".stats-disclaimer",
    ".choice-row",
  ],
} as const;

export type MotionVariant = keyof typeof MOTION_GROUPS;

/** Top-level blocks of every page section, so pages without named boxes still animate. */
export const BLOCK_FALLBACK = ["section > .wrap > *", ".section .wrap > article", ".section .wrap > form"];

/** The homepage banner has its own entrance; dialogs and the header never animate. */
export const MOTION_EXCLUDE = ".stage-top, .stage-top *, dialog, dialog *";

/** Numbers that count up from zero the first time they appear. */
export const COUNT_SELECTORS = [".nation-stats strong", ".season-stat strong", ".season-strip strong"];

export const MOTION_TARGETS = [...Object.values(MOTION_GROUPS).flat(), ...BLOCK_FALLBACK];

/**
 * A first visit hides targets briefly so they can enter. Later visits stay visible, so the page
 * never waits on the animation script. The fallback shows anything still hidden after 1.2s.
 */
const targets = `main :is(${MOTION_TARGETS.join(",")}):not(${MOTION_EXCLUDE}):not(.is-revealed)`;
export const motionCss = `html.is-welcome.motion-ready ${targets}{opacity:0;animation:motion-fallback 0s 1.2s forwards}html.is-welcome.motion-ready.motion-live ${targets}{animation:none}`;

/** Each area of the site carries its own neon colour pair, read by CSS through html[data-mood]. */
export const MOODS: Record<string, string> = {
  team: "magenta", players: "magenta", draft: "magenta",
  fixtures: "cyan", matches: "cyan", season: "cyan", "points-table": "cyan",
  stats: "amber", records: "amber",
  news: "violet", updates: "violet",
  gallery: "sunset",
  shop: "gold", cart: "gold", checkout: "gold",
  vote: "electric", polls: "electric", fan: "electric",
  partners: "royal", "become-a-partner": "royal", franchises: "royal", about: "royal", contact: "royal",
};

export function moodFor(pathname: string) {
  return MOODS[pathname.split("/")[1] ?? ""] ?? "home";
}

export const motionBootScript = `(function(){try{var d=document.documentElement;var m=${JSON.stringify(MOODS)};d.setAttribute("data-mood",m[location.pathname.split("/")[1]||""]||"home");if(location.pathname.indexOf("/admin")===0)return;var seen=false;try{seen=localStorage.getItem("ut-welcome")==="1"}catch(err){}d.classList.add(seen?"is-return":"is-welcome");if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-ready")}catch(e){}})();`;
