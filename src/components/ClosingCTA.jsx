/* ═══════════════════════════════════════════════════════════════════════════
   ClosingCTA.jsx — THE LAST THING ON THE PAGE
   ---------------------------------------------------------------------------
   One promise, and it is one the build actually keeps: the course opens
   without an account. There is no sign-up wall, so the copy does not imply
   one, and the three figures below are read from the real course data rather
   than typed in.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { DAILY_BONUS } from '../config/dailyBonusConfig'

export default function ClosingCTA({ onStartLearning }) {
  const stats = [
    { value: TOTAL_LESSONS, label: 'interactive lessons' },
    { value: TOTAL_SECTIONS, label: 'modules, beginner to advanced' },
    { value: `${DAILY_BONUS.CYCLE_LENGTH}-day`, label: 'reward track' },
  ]

  return (
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className="cta-wrap reveal">
        <h2 className="cta-heading" id="cta-heading">
          Start with lesson one.
        </h2>
        <p className="cta-body">
          No account, no card. Your progress saves in this browser and the
          first lesson takes five minutes.
        </p>

        <button type="button" className="btn btn-primary cta-btn" onClick={onStartLearning}>
          Start learning →
        </button>

        <ul className="cta-stats" role="list">
          {stats.map((s) => (
            <li className="cta-stat" key={s.label}>
              <span className="cta-stat-value">{s.value}</span>
              <span className="cta-stat-label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
