/* ═══════════════════════════════════════════════════════════════════════════
   ClosingCTA.jsx — THE LAST THING ON THE PAGE
   ---------------------------------------------------------------------------
   One promise the build actually keeps: the course opens without an account.
   The three figures are read from real course data, and they are TALLIED as
   they arrive — the page counting the course out for you.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { DAILY_BONUS } from '../config/dailyBonusConfig'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import CountUp from '../motion/CountUp'
import { DUR, STAGGER } from '../motion/timing'

export default function ClosingCTA({ onStartLearning }) {
  const stats = [
    { value: TOTAL_LESSONS, label: 'interactive lessons', tip: 'Fill the blank, judge a scenario, pick the right call' },
    { value: TOTAL_SECTIONS, label: 'modules, beginner to advanced', tip: 'Foundations → ML → neural networks → tools → ethics' },
    { value: DAILY_BONUS.CYCLE_LENGTH, suffix: '-day', label: 'reward track', tip: 'Gems, XP, hearts — and a Streak Shield on day 7' },
  ]

  return (
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className="cta-wrap">
        <div>
          <SplitText as="h2" className="cta-heading" id="cta-heading" stagger={50}>
            Lesson one takes five minutes
            <svg className="cta-clock" data-st-skip viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" />
              <path className="cta-clock-sweep" d="M12 12V6.5" />
            </svg>.
          </SplitText>
          <Reveal as="p" className="cta-body" delay={DUR.move * 0.5}>
            No account, no card. Your progress saves in this browser, and the
            next lesson is always waiting at the top of the course.
          </Reveal>

          <Reveal variant="scale" delay={DUR.move}>
            <button type="button" className="btn btn-next btn-lg fx-shine" onClick={onStartLearning} data-magnetic="8">
              Start learning
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </Reveal>
        </div>

        <Reveal as="ul" className="cta-stats" role="list" variant="right" stagger delay={DUR.hover}>
          {stats.map((s, i) => (
            <li className="cta-stat" key={s.label} data-tip={s.tip}>
              <span className="cta-stat-value">
                <CountUp value={s.value} suffix={s.suffix || ''} delay={DUR.move + i * STAGGER * 3} duration={DUR.celebrate} />
              </span>
              <span className="cta-stat-label">{s.label}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
