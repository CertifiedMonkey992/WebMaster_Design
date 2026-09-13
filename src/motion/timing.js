/* ═══════════════════════════════════════════════════════════════════════════
   timing.js — THE MOTION TOKENS, FOR JAVASCRIPT
   ---------------------------------------------------------------------------
   Web Animations need numbers, not CSS variables. These mirror the tiers in
   index.css exactly (MOTION_RULES.md, revision 4). Change one, change both.
   ═══════════════════════════════════════════════════════════════════════════ */

export const DUR = {
  micro: 90,
  press: 120,
  hover: 160,
  move: 240,
  lift: 320,
  enter: 240,
  modal: 320,
  open: 420,
  reveal: 560,
  settle: 600,
  turn: 760,
  celebrate: 800,
}

export const EASE = {
  out: 'cubic-bezier(0.33, 1, 0.68, 1)',
  snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
  settle: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
  lift: 'cubic-bezier(0.3, 1.3, 0.5, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  press: 'cubic-bezier(0.4, 0, 0.6, 1)',
  in: 'cubic-bezier(0.5, 0, 0.75, 0)',
  swing: 'cubic-bezier(0.65, 0, 0.35, 1)',
}

export const STAGGER = 40
export const LAG = { follow: 40, finish: 90 }

/* Idle periods (revision 4), in ms. */
export const IDLE = {
  glint: 6700,
  beat: 5300,
  zap: 7900,
  float: 5900,
  sweep: 9700,
  run: 7300,
  wave: 6100,
}
