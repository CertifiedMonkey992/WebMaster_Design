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
   ═══════════════════════════════════════════════════════════════════════════ */

import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './env'

let busy = false

export function turnPage(update, { dir = 1 } = {}) {
  const root = document.documentElement
  if (busy || typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
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
