/* ═══════════════════════════════════════════════════════════════════════════
   ClosingCTA.jsx — THE LAST THING ON THE PAGE
   ---------------------------------------------------------------------------
   One promise the build actually keeps: the course opens without an account.
   The three figures are read from real course data, and they are TALLIED as
   they arrive — the page counting the course out for you.

   Revision 5: an Accent on the Stage — now and then the button's arrow
   leans on toward where it goes (an Invitation), in its turn with
   everything else on the page.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { DAILY_BONUS } from '../config/dailyBonusConfig'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import CountUp from '../motion/CountUp'
import { useScrollProgress } from '../motion/scroll'
import { DUR, STAGGER } from '../motion/timing'
import { usePerformer } from '../motion/stage'
import { PageLink } from '../nav'

export default function ClosingCTA() {
  const planeRef = useScrollProgress()
  const actionRef = useRef(null)

  usePerformer(actionRef, {
    id: 'cta:arrow',
    region: 'cta',
    tier: 'accent',
    cooldown: 7000,
    share: 0.9,
    run: async (ctx) => {
      const btn = actionRef.current?.querySelector('.btn')
      if (!btn) return
      btn.setAttribute('data-nudge', '')
      ctx.onStop(() => btn.removeAttribute('data-nudge'))
      await ctx.wait(DUR.celebrate * 1.5)
      btn.removeAttribute('data-nudge')
    },
  })
  const stats = [
    { value: TOTAL_LESSONS, label: 'interactive lessons', tip: 'Fill-in-the-blank, AI-or-not and multiple-choice questions' },
    { value: TOTAL_SECTIONS, label: 'modules, beginner to advanced', tip: 'Foundations → machine learning → neural networks → tools → ethics' },
    { value: DAILY_BONUS.CYCLE_LENGTH, suffix: '-day', label: 'bonus track', tip: `Gems, XP, hearts, and a Streak Shield on day ${DAILY_BONUS.CYCLE_LENGTH}` },
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
            It covers what makes a system AI rather than ordinary code. There is
            nothing to register for: open the course, and your progress saves in
            this browser as you go.
          </Reveal>

          <div ref={actionRef} className="cta-action">
          <Reveal variant="scale" delay={DUR.move}>
            <PageLink page="learn" className="btn btn-next btn-lg fx-shine" data-magnetic="8">
              Open the course
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </PageLink>
          </Reveal>
          </div>
        </div>

        <div className="cta-stats-plane" ref={planeRef}>
          <Reveal as="ul" className="cta-stats" variant="right" stagger delay={DUR.hover}>
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
      </div>
    </section>
  )
}
