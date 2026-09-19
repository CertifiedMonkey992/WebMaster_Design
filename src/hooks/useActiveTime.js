/* ═══════════════════════════════════════════════════════════════════════════
   useActiveTime.js — TIME THE LEARNER WAS ACTUALLY LEARNING
   ---------------------------------------------------------------------------
   Wall-clock time inside a lesson is not learning time: a tab left open on a
   question for an hour is idle, not studying. Every interaction calls
   `touch()`, and the gap since the previous one counts only up to
   MISC.MAX_IDLE_SECONDS — so an abandoned session can never be credited
   with more than one idle window, however long it sat there.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { MISC } from '../config/progressionConfig'

export default function useActiveTime() {
  const api = useRef(null)
  if (api.current === null) {
    const r = { started: null, last: null, total: 0 }
    const touch = () => {
      if (r.last === null) return
      const now = Date.now()
      r.total += Math.min((now - r.last) / 1000, MISC.MAX_IDLE_SECONDS)
      r.last = now
    }
    api.current = {
      start: () => { r.started = Date.now(); r.last = r.started; r.total = 0 },
      touch,
      started: () => r.started !== null,
      /** Active seconds so far, counting the time since the last interaction
       *  (capped at the idle limit like any other gap). */
      seconds: () => { touch(); return Math.round(r.total) },
    }
  }
  return api.current
}
