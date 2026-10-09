/**
 * United Tigers palette, sampled from the "The Next Game" hero banner:
 * gold #FFE8AC → #EEC873 → #D2A95A → #AC884A, pink #FB3BA6 → #C9177E → #8D135E,
 * purples at hue 271 (#8830DB accent, #390966 page, #2B074D cards). White #FCFCFC.
 * Cards sit slightly darker than the page background.
 */
export const theme = {
  "--primary": "#D2A95A",
  "--primary-light": "#F4DB96",
  "--secondary": "#390966",
  "--accent": "#C9177E",
  "--deluge": "#8830DB",
  "--background": "#390966",
  "--surface": "#2B074D",
  "--surface-raised": "#460B7D",
  "--text": "#FCFCFC",
  "--muted": "#d3c8e6",
  "--border": "rgba(210, 169, 90,.3)",
  "--success": "#16c784",
  "--danger": "#e86d60",
  "--warning": "#e8b53a",
} as const;
