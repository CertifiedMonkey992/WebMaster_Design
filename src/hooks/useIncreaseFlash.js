/* ═══════════════════════════════════════════════════════════════════════════
   useIncreaseFlash.js — REACT TO A NUMBER GOING UP
   ---------------------------------------------------------------------------
   Returns true for a moment when `value` rises, and only when it rises.

   Deliberately narrow: it never fires on mount (so a page load isn't a
   celebration), never fires when the number falls (losing a streak is not a
   moment to bounce), and holds for well under a second. It exists so that
   earning something is acknowledged — which is the only reason to animate a
   statistic at all.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'

export default function useIncreaseFlash(value, ms = 600) {
  const previous = useRef(value)
  const [flashing, setFlashing] = useState(false)

  useEffect(() => {
    const rose = typeof value === 'number' && value > previous.current
    previous.current = value
    if (!rose) return

    setFlashing(true)
    const timer = setTimeout(() => setFlashing(false), ms)
    return () => clearTimeout(timer)
  }, [value, ms])

  return flashing
}
