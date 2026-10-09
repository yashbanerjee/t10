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
 * Hides targets before first paint so they can animate in without a flash. The fallback keyframe
 * shows everything after three seconds in case the script never runs.
 */
const targets = `main :is(${MOTION_TARGETS.join(",")}):not(${MOTION_EXCLUDE}):not(.is-revealed)`;
export const motionCss = `html.motion-ready ${targets}{opacity:0;animation:motion-fallback 0s 3s forwards}html.motion-ready.motion-live ${targets}{animation:none}`;

export const motionBootScript = `(function(){try{var d=document.documentElement;if(location.pathname.indexOf("/admin")===0)return;if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-ready")}catch(e){}})();`;
