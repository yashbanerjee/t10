/** Blocks that rise into view on their own as the visitor scrolls. */
export const REVEAL_SELECTORS = [
  ".inner-hero .wrap > *",
  ".board-head",
  ".dash-card",
  ".stay-card",
  ".last-match-card",
  ".match-live-strip",
  ".season-strip",
  ".player-feature",
  ".news-feature",
  ".home-feature",
  ".about-grid > *",
  ".stats-table-wrap",
  ".scorecard",
  ".report-card",
  ".stats-card",
  ".timeline-item",
  ".fixture-row",
  ".daily-list > *",
  ".result-list > *",
  ".section-head",
];

/** Grids whose children enter one after another. */
export const STAGGER_SELECTORS = [
  ".player-grid",
  ".news-grid",
  ".update-grid",
  ".partner-grid",
  ".franchise-grid",
  ".gallery-grid",
  ".record-grid",
  ".about-pillars",
  ".product-grid",
  ".fan-grid",
  ".fan-launch-grid",
  ".profile-grid",
  ".moment-grid",
  ".highlight-row",
  ".kit-row",
  ".pulse-grid",
  ".frame-row",
  ".player-stat-grid",
  ".leader-cards",
];

export const MOTION_TARGETS = [...REVEAL_SELECTORS, ...STAGGER_SELECTORS.map((selector) => `${selector} > *`)];

/**
 * Hides targets before first paint so they can animate in without a flash. The fallback keyframe
 * shows everything after three seconds in case the script never runs.
 */
const targets = `main :is(${MOTION_TARGETS.join(",")}):not(.is-revealed)`;
export const motionCss = `html.motion-ready ${targets}{opacity:0;animation:motion-fallback 0s 3s forwards}html.motion-ready.motion-live ${targets}{animation:none}`;

export const motionBootScript = `(function(){try{var d=document.documentElement;if(location.pathname.indexOf("/admin")===0)return;if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-ready")}catch(e){}})();`;
