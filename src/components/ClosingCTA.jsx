/* ═══════════════════════════════════════════════════════════════════════════
   ClosingCTA.jsx — THE LAST THING ON THE PAGE
   ---------------------------------------------------------------------------
   One promise, and it is one the build actually keeps: the course opens
   without an account. There is no sign-up wall, so the copy does not imply
   one, and the three figures below are read from the real course data rather
   than typed in.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import useReveal from '../hooks/useReveal'
import { DAILY_BONUS } from '../config/dailyBonusConfig'

export default function ClosingCTA({ onStartLearning }) {
  const [ref, animate] = useReveal()

  const stats = [
    { value: TOTAL_LESSONS, label: 'interactive lessons' },
    { value: TOTAL_SECTIONS, label: 'modules, beginner to advanced' },
    { value: `${DAILY_BONUS.CYCLE_LENGTH}-day`, label: 'reward track' },
  ]

  return (
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className={`cta-wrap reveal${animate ? ' animate-in' : ''}`} ref={ref}>
        <div>
          <h2 className="cta-heading" id="cta-heading">
            Lesson one takes five minutes.
          </h2>
          <p className="cta-body">
            No account, no card. Your progress saves in this browser, and the
            next lesson is always waiting at the top of the course.
          </p>

          <button type="button" className="btn btn-next btn-lg" onClick={onStartLearning}>
            Start learning
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

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
