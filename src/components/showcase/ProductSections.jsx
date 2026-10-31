/* ═══════════════════════════════════════════════════════════════════════════
   ProductSections.jsx — THE MARKETING STORY, TOLD WITH THE REAL PRODUCT
   ---------------------------------------------------------------------------
   Every panel on this page is the app's own component, mounted against a
   demo learner built by the real reducer.

   Revision 5: each frame has its OWN demo learner (ProgressionDemo) and a
   SCENE that uses it — the course frame finishes a lesson, the streak frame
   keeps a day, the spin frame spins the wheel and waits a day, the quest
   frame completes a quest and is paid — each narrated in the frame's chrome
   and scheduled by the Stage (MOTION_RULES.md → The Stage). Nothing is
   saved; the visitor's own progress is never read or written here.

   Revision 12: the sections are the home page's feature rows (a 988px
   column, copy and frame alternating sides, one paragraph each); the streak
   row's frame has the otter peeking over its top edge. Eyebrow and Mark
   stay exported for the About page.

   Choreography, per section (MOTION_RULES.md → Scroll):
     · the heading assembles word by word
     · the paragraphs rise in sequence; each bold term gets a highlighter
       stroke laid under it as it comes into view
     · the frame slides in from its own side, stands up out of a tilt, and
       then floats on a slow parallax against the copy, which stays put
     · the real components inside perform their own entrance when seen
   ═══════════════════════════════════════════════════════════════════════════ */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { TOTAL_LESSONS } from '../../data/learnData'
import { STREAK, QUESTS } from '../../config/progressionConfig'
import { WHEEL, SLOTS, percentOf } from '../../config/wheelConfig'
import { SHORTEST_LESSON, LONGEST_LESSON } from '../guide/guideData'

import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import { useScrollProgress } from '../../motion/scroll'
import { afterArrival, usePerformer } from '../../motion/stage'
import { DUR } from '../../motion/timing'
/* The frames' stylesheets are imported here, not only by the lazily loaded
   components that use them, so they stay in the page's first stylesheet in
   the same order as before — under motion.css, whose verbs sit on top. */
import '../progression/icons.css'
import '../wheel/wheel.css'
import './showcase.css'
import Otter from '../otter/Otter'

/* The four live frames (ShowcaseFrames.jsx) are most of this page's code and
   DOM, and all of them sit below the fold. Their code is fetched once the
   page has arrived, and each frame mounts as its column comes into view —
   where its own entrance plays — so the first paint is the page's words and
   the book, not four apps at once. */
const loadFrames = () => import('./ShowcaseFrames')
const frame = (name) => lazy(() => loadFrames().then((m) => ({ default: m[name] })))
const CourseFrame = frame('CourseFrame')
const StreakFrame = frame('StreakFrame')
const WheelFrame = frame('WheelFrame')
const QuestFrame = frame('QuestFrame')

/* Small counts read as words in running prose ("three quests"), not numerals. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const inWords = (n) => WORDS[n] ?? String(n)

/* A bold term that gets a highlighter stroke when it is read. Exported for the
   About page, which uses the same section vocabulary. */
export function Mark({ children, tone = 'ochre' }) {
  const [ref, inView] = useInView({ threshold: 0.9, rootMargin: '0px 0px -12% 0px' })
  return (
    <strong ref={ref} className={`mark mark--${tone}${inView ? ' is-in' : ''}`}>
      {children}
    </strong>
  )
}

/* ── Section shell ───────────────────────────────────────────────────────── */

/* The eyebrow: the section's number, a clay rule that draws, then the label. */
export function Eyebrow({ index, children }) {
  const [ref, inView] = useInView({ threshold: 0.2 })
  return (
    <span ref={ref} className={`sc-eyebrow${inView ? ' is-in' : ''}`}>
      <span className="sc-eyebrow-num">{String(index).padStart(2, '0')}</span>
      <span className="sc-eyebrow-rule" aria-hidden="true" />
      <span className="sc-eyebrow-text">{children}</span>
    </span>
  )
}

function Section({ id, heading, children, frame: Frame, flip = false, peek = false }) {
  /* Writes --sp (0 entering → 1 leaving) for the frame's parallax. */
  const parallaxRef = useScrollProgress()
  const copyRef = useRef(null)

  /* The frame mounts when its column comes into view (its code is usually
     already fetched — see ProductSections below). Until then the column is
     empty and holds about a frame's height (showcase.css). */
  const frameNode = useRef(null)
  const setFrameNode = useCallback((el) => { frameNode.current = el; parallaxRef(el) }, [parallaxRef])
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = frameNode.current
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      setNear(true)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* Accent (revision 5): now and then the copy answers the frame beside it —
     a highlighter stroke is laid again under one of its bold terms, the
     eyebrow's rule is drawn again, or the heading's emphasised word lifts
     and settles — never the same gesture twice running. It draws the eye
     from the demonstration back to the words that explain it. */
  const lastCopy = useRef(null)
  usePerformer(copyRef, {
    id: `copy:${id}`,
    region: `${id}:copy`,
    tier: 'accent',
    weight: 0.6,
    cooldown: 8000,
    share: 0.5,
    run: async (ctx) => {
      const root = copyRef.current
      if (!root) return
      const marks = [...root.querySelectorAll('.mark.is-in')]
      const words = [...root.querySelectorAll('.sc-heading .st-i')]
      const options = [
        marks.length && 'mark',
        root.querySelector('.sc-eyebrow.is-in') && 'rule',
        words.length && 'word',
      ].filter((o) => o && o !== lastCopy.current)
      const kind = options[Math.floor(Math.random() * options.length)]
      lastCopy.current = kind
      const target = kind === 'mark'
        ? marks[Math.floor(Math.random() * marks.length)]
        : kind === 'rule'
          ? root.querySelector('.sc-eyebrow')
          : words[Math.floor(Math.random() * Math.min(3, words.length))]
      if (!target) return
      target.setAttribute('data-relay', '')
      ctx.onStop(() => target.removeAttribute('data-relay'))
      await ctx.wait(DUR.celebrate + 200)
      target.removeAttribute('data-relay')
    },
  })

  return (
    <section className="sc-section fr" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap fr-wrap${flip ? ' flip' : ''}`}>
        <div className="sc-copy fr-copy" ref={copyRef}>
          <SplitText as="h2" className="sc-heading home-feature-heading" id={`${id}-heading`} stagger={48}>
            {heading}
          </SplitText>
          <Reveal stagger delay={220}>{children}</Reveal>
        </div>
        <div className="sc-frame fr-frame" ref={setFrameNode} style={{ '--side': flip ? -1 : 1 }}>
          {peek && <span className="fr-peek" aria-hidden="true"><Otter pose="peek" mood="curious" moodWeight={0.45} region={`${id}:otter`} /></span>}
          {near && <Suspense fallback={null}><Frame /></Suspense>}
        </div>
      </div>
    </section>
  )
}

/* ── 1. Learn ─────────────────────────────────────────────────────────────── */

function LearnSection() {
  return (
    <Section id="learn" heading="Learn by doing." frame={CourseFrame}>
      <p className="home-feature-body">
        {TOTAL_LESSONS} short lessons of {SHORTEST_LESSON}–{LONGEST_LESSON} minutes, each a Learn
        part and a graded Check. You <Mark>train real models</Mark> in your browser, sort
        real systems and look inside a neural network — and a wrong answer
        in a Check <Mark tone="berry">costs a heart</Mark>.
      </p>
    </Section>
  )
}

/* ── 2. Streak ────────────────────────────────────────────────────────────── */

function StreakSection() {
  return (
    <Section id="streak" heading="Keep your streak." flip peek frame={StreakFrame}>
      <p className="home-feature-body">
        A day counts once you finish a lesson or a practice session — opening
        LunX doesn’t. Milestones from {STREAK.MILESTONES[0]} to {STREAK.MILESTONES[STREAK.MILESTONES.length - 1]} days
        pay gems, and if you miss a day a <Mark tone="moss">Streak Shield</Mark> covers it.
      </p>
    </Section>
  )
}

/* ── 3. Daily spin ────────────────────────────────────────────────────────── */

const JACKPOT = SLOTS.find((s) => s.tier === 'jackpot')

function WheelSection() {
  return (
    <Section id="daily-spin" heading="Spin once a day." frame={WheelFrame}>
      <p className="home-feature-body">
        {WHEEL.SPINS_PER_DAY === 1 ? 'One free spin' : `${WHEEL.SPINS_PER_DAY} free spins`} a day
        pays gems, XP or a Streak Shield — and now and then
        the <Mark>{JACKPOT.label} jackpot</Mark>, at {percentOf(JACKPOT.weight)}. The odds of
        every reward are printed beside the wheel.
      </p>
    </Section>
  )
}

/* ── 4. Quests and the shop ───────────────────────────────────────────────── */

function QuestSection() {
  return (
    <Section id="quests" heading="Quests pay in gems." flip frame={QuestFrame}>
      <p className="home-feature-body">
        {inWords(QUESTS.DAILY_COUNT)[0].toUpperCase() + inWords(QUESTS.DAILY_COUNT).slice(1)} new
        quests every day: an easy one, a medium one and a challenge. Gems buy
        a <Mark tone="berry">heart refill</Mark>, a single heart or a Streak Shield — nothing in
        the shop is cosmetic.
      </p>
    </Section>
  )
}

/* ── Root ─────────────────────────────────────────────────────────────────── */

export default function ProductSections() {
  /* Fetch the frames' code once the page has arrived, so a section's frame
     is ready by the time the reader scrolls to it. */
  useEffect(() => afterArrival(() => { loadFrames().catch(() => {}) }), [])

  return (
    <>
      <LearnSection />
      <StreakSection />
      <WheelSection />
      <QuestSection />
    </>
  )
}
