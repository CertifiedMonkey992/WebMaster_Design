/* ═══════════════════════════════════════════════════════════════════════════
   pageTurn.js — THE LANDING PAGE AND THE APP ARE ONE BOOK
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 4 → Page turns. Moving between the landing page
   and the app turns a page: the new one slides in from the edge you are
   travelling toward, carrying a warm shadow on its leading edge, while the
   old one gives way a third of the distance and dims.

     turnPage(update, { dir })   dir 1 = forward (into the app), -1 = back

   Built on View Transitions: the browser snapshots both pages, so the turn
   costs two composited layers rather than two live React trees. `update`
   runs synchronously inside the transition (flushSync), so the snapshot of
   the new page is the real first frame. No support, or reduced motion: the
   update simply happens.

   The ::view-transition-* rules live here, in a constructed stylesheet
   adopted by the document, rather than in motion.css: the W3C CSS validator
   does not yet parse those pseudo-elements, and a browser without View
   Transitions never needs them. Only browsers that can turn a page load the
   rules that describe the turn.
   ═══════════════════════════════════════════════════════════════════════════ */

import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './env'

const TURN_RULES = `
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: calc(var(--dur-turn) * 0.85);
  animation-timing-function: var(--ease-snap);
  animation-fill-mode: both;
  mix-blend-mode: normal;
}
html[data-turn='forward']::view-transition-new(root) { animation-name: vt-in-from-right; }
html[data-turn='forward']::view-transition-old(root) { animation-name: vt-give-left; }
html[data-turn='back']::view-transition-new(root)    { animation-name: vt-in-from-left; }
html[data-turn='back']::view-transition-old(root)    { animation-name: vt-give-right; }
@keyframes vt-in-from-right {
  from { transform: translateX(100%); box-shadow: -28px 0 56px rgba(var(--ink-rgb), 0.24); }
  to   { transform: none; box-shadow: -28px 0 56px rgba(var(--ink-rgb), 0); }
}
@keyframes vt-in-from-left {
  from { transform: translateX(-100%); box-shadow: 28px 0 56px rgba(var(--ink-rgb), 0.24); }
  to   { transform: none; box-shadow: 28px 0 56px rgba(var(--ink-rgb), 0); }
}
@keyframes vt-give-left  { to { transform: translateX(-33%); filter: brightness(0.92); } }
@keyframes vt-give-right { to { transform: translateX(33%); filter: brightness(0.92); } }
`

let installed = false
function installRules() {
  if (installed) return true
  try {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(TURN_RULES)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    installed = true
  } catch {
    installed = false
  }
  return installed
}

let busy = false

export function turnPage(update, { dir = 1 } = {}) {
  const root = document.documentElement
  if (busy || typeof document.startViewTransition !== 'function' || prefersReducedMotion() || !installRules()) {
    update()
    return
  }
  busy = true
  root.dataset.turn = dir < 0 ? 'back' : 'forward'
  const transition = document.startViewTransition(() => { flushSync(update) })
  transition.finished.finally(() => {
    delete root.dataset.turn
    busy = false
  })
}
