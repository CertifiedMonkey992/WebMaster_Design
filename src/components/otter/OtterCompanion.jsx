/* ═══════════════════════════════════════════════════════════════════════════
   OtterCompanion.jsx — THE OTTER IN THE APP
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → The companion. The otter roams the top
   edge of the Your Progress card (an OtterLane), hides behind it, plays
   with the field guide, and:

     · takes the temperament of the destination it is in, and makes a small
       gesture on arriving there (reactions.js → DESTINATIONS)
     · answers the learner's real progress events — XP, a quest, a level, a
       lost streak — gathered over a moment so a lesson's whole payout gets
       one reaction, the most important one (reactions.js → EVENT_REACTIONS)
     · holds that reaction while a lesson or dialog covers the page, and
       plays it the moment the page is uncovered: close a lesson and the
       otter is celebrating it
     · says hello once a session

   Its idle acts go through the Stage like every other performer.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import OtterLane from './OtterLane'
import { useRewards } from '../../state/ProgressionContext'
import { somethingOpen } from '../../motion/stage'
import { DESTINATIONS, strongest } from './reactions'

const GREETED = 'lunx_companion_greeted'
const GATHER = 380

export default function OtterCompanion({ destination = 'learn' }) {
  const otter = useRef(null)
  const { rewards } = useRewards()
  const seen = useRef(new Set())
  const batch = useRef([])
  const pending = useRef(null)
  const gatherTimer = useRef(0)
  const waitTimer = useRef(0)
  const arrived = useRef(null)
  const hello = useRef(null)
  const here = DESTINATIONS[destination] || DESTINATIONS.learn

  /* Play the held reaction, or wait for whatever covers the page to close. */
  const release = useRef(() => {})
  release.current = () => {
    window.clearTimeout(waitTimer.current)
    const r = pending.current
    const o = otter.current
    if (!r || !o) return
    if (somethingOpen()) {
      waitTimer.current = window.setTimeout(() => release.current(), 450)
      return
    }
    pending.current = null
    o.stop()
    if (r.sequence) o.cue(r.acts.filter((a) => o.can(a)))
    else {
      const act = r.acts.find((a) => o.can(a))
      if (act) o.cue(act)
    }
  }

  useEffect(() => {
    let fresh = false
    for (const event of rewards) {
      if (seen.current.has(event.key)) continue
      seen.current.add(event.key)
      batch.current.push(event)
      fresh = true
    }
    if (!fresh) return
    window.clearTimeout(gatherTimer.current)
    gatherTimer.current = window.setTimeout(() => {
      const best = strongest(batch.current)
      batch.current = []
      if (best && (!pending.current || best.priority >= pending.current.priority)) pending.current = best
      release.current()
    }, GATHER)
  }, [rewards])

  /* Hello, once a session (decided once per mount: StrictMode runs this
     twice in development, against two different drawings). */
  useEffect(() => {
    if (hello.current === null) {
      hello.current = true
      try { hello.current = !sessionStorage.getItem(GREETED); sessionStorage.setItem(GREETED, '1') } catch { /* storage off: say hello */ }
    }
    if (hello.current && !pending.current) otter.current?.cue(['notice', 'wave'])
  }, [])

  /* A small gesture on arriving at a different destination. */
  useEffect(() => {
    const o = otter.current
    const from = arrived.current
    arrived.current = destination
    if (!o || from === null || from === destination || pending.current) return
    const arrive = (DESTINATIONS[destination] || DESTINATIONS.learn).arrive.filter((a) => o.can(a))
    if (arrive.length && !o.acting) o.cue(arrive)
  }, [destination])

  useEffect(() => () => {
    window.clearTimeout(gatherTimer.current)
    window.clearTimeout(waitTimer.current)
  }, [])

  return (
    <OtterLane
      ref={otter}
      variant="card"
      pose="stand"
      mood={here.mood}
      intensity="calm"
      region="app:otter"
    />
  )
}
