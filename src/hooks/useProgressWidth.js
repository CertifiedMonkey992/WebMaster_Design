/* ═══════════════════════════════════════════════════════════════════════════
   useProgressWidth.js — LET A PROGRESS BAR ARRIVE INSTEAD OF APPEARING
   ---------------------------------------------------------------------------
   Every fill in the app is a plain `width: X%` div with a CSS width
   transition, which means it animates beautifully when a value CHANGES and
   not at all on first paint — the bar is simply already there. This hook
   reports 0 for the first painted frame and the real value from the next one,
   so the transition has somewhere to travel from.

   It is deliberately not a tweening hook:

     · The value is never smoothed, delayed or interpolated in JS. After the
       first frame this is a pass-through, so the number the bar settles on is
       always exactly the number progression state produced.
     · The 0 is only ever shown on mount. Later updates flow straight through,
       so a re-render caused by an unrelated part of the dashboard (the clock
       ticking, a popover opening) can never restart the animation.
     · With `prefers-reduced-motion: reduce` it starts settled — no travel,
       no frame of empty bar.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function useProgressWidth(value) {
  const [settled, setSettled] = useState(prefersReducedMotion)

  useEffect(() => {
    if (settled) return

    /* Two frames: the first guarantees the browser has painted the 0 state,
       the second flips to the real value so the transition actually runs.
       A single rAF is often coalesced with the initial paint and the bar
       snaps instead of sliding.

       The timer is a safety net, not a second animation. Browsers pause rAF
       entirely in a hidden tab, so a dashboard opened in a background tab
       would otherwise sit on empty bars showing the wrong numbers until it
       was looked at. Timers are only throttled, never stopped — whichever
       lands first settles the bar, and the other is cancelled. */
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettled(true))
    })
    const fallback = setTimeout(() => setSettled(true), 120)

    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      clearTimeout(fallback)
    }
  }, [settled])

  return settled ? value : 0
}
