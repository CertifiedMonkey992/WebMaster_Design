/* ═══════════════════════════════════════════════════════════════════════════
   Gamification.jsx — DAILY REWARDS SECTION
   ---------------------------------------------------------------------------
   The visual here is not a mockup and not a screenshot: it is the REAL
   DailyBonusTrack component from the product, rendered against a view built by
   the real dailyBonusService. Nothing about the track is re-drawn for
   marketing, so the section cannot drift away from the shipped feature — if a
   reward or a card state changes, this section changes with it.

   The showcase state puts the learner mid-track (three days claimed, day four
   waiting), which is the state that shows every card variation at once. Dates
   are derived from the real clock so "today" is genuinely today.

   `onClaim` is deliberately not passed: the landing track is inert, and there
   is no progression provider out here to claim against.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo } from 'react'
import DailyBonusTrack from './daily/DailyBonusTrack'
import { getBonusView } from '../services/dailyBonusService'
import { createDefaultState } from '../services/storageService'
import { getLocalDateKey, addDays } from '../utils/dateUtils'

/** Everything the section claims the feature does — and does. */
const FACTS = [
  'A new reward every calendar day you come back',
  'Gems, XP and hearts paid into the same balances you spend',
  'Day 7 hands you a Streak Shield that covers a missed day',
  'Miss a day and the track waits — it never resets you to zero',
  'Nothing auto-collects; you claim it yourself',
]

export default function Gamification({ onStartLearning }) {
  /* A representative mid-cycle state, run through the real service. Recomputed
     only when the calendar day changes. */
  const today = getLocalDateKey()
  const view = useMemo(() => {
    const base = createDefaultState()
    return getBonusView({
      ...base,
      dailyBonus: {
        ...base.dailyBonus,
        cycleDay: 4,
        lastClaimDate: addDays(today, -1),
        cycleStartDate: addDays(today, -3),
        cyclesCompleted: 0,
        totalClaimed: 3,
      },
    })
  }, [today])

  return (
    <section className="gamification" id="progress" aria-labelledby="gamif-heading">
      <div className="gamif-wrap">

        {/* Left: copy */}
        <div className="reveal">
          <span className="section-eyebrow">Daily Rewards</span>
          <h2 className="gamif-heading" id="gamif-heading">
            Seven days.<br />Seven rewards.<br />One habit.
          </h2>
          <p className="gamif-body">
            Learning sticks when you keep turning up. LunX pays you for it —
            a reward waiting every day you return, climbing across a seven-day
            track to a Streak Shield that protects the run you have built.
          </p>

          <ul className="feature-list">
            {FACTS.map((f, i) => (
              <li className="feature-item" key={i}>
                <span className="feature-dot" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-outline section-cta"
            style={{ marginTop: '2rem' }}
            onClick={onStartLearning}
          >
            Claim your first reward →
          </button>
        </div>

        {/* Right: the live Daily Bonus, framed as the product surface it is */}
        <div className="reveal d2">
          <figure className="gamif-shot">
            <div className="gamif-shot-bar" aria-hidden="true">
              <span className="gamif-shot-dots"><i /><i /><i /></span>
              <span className="gamif-shot-title">LunX · Daily Bonus</span>
            </div>
            <div className="gamif-shot-body">
              <DailyBonusTrack view={view} variant="showcase" showHeader={false} />
            </div>
            <figcaption className="gamif-shot-caption">
              The daily bonus panel, exactly as it appears in the app.
            </figcaption>
          </figure>
        </div>

      </div>
    </section>
  )
}
