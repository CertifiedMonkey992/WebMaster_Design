/* ═══════════════════════════════════════════════════════════════════════════
   ProductSections.jsx — THE MARKETING STORY, TOLD WITH THE REAL PRODUCT
   ---------------------------------------------------------------------------
   Every panel on this page is the app's own component, mounted against a
   demo learner built by the real reducer.

   Revision 5: each frame has its OWN demo learner (ProgressionDemo) and a
   SCENE that uses it — the course frame finishes a lesson, the streak frame
   keeps a day, the bonus frame claims its way along the track, the quest
   frame completes a quest and is paid — each narrated in the frame's chrome
   and scheduled by the Stage (MOTION_RULES.md → The Stage). Nothing is
   saved; the visitor's own progress is never read or written here.

   Choreography, per section (MOTION_RULES.md → Scroll):
     · the eyebrow's index number and rule draw in
     · the heading assembles word by word
     · the paragraphs rise in sequence; each bold term gets a highlighter
       stroke laid under it as it comes into view
     · the frame slides in from its own side, stands up out of a tilt, and
       then floats on a slow parallax against the copy, which stays put
     · the real components inside perform their own entrance when seen
   ═══════════════════════════════════════════════════════════════════════════ */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { TOTAL_LESSONS } from '../../data/learnData'
import { SHOP_ITEMS } from '../../config/shopConfig'
import { STREAK, QUESTS } from '../../config/progressionConfig'
import { DAILY_BONUS } from '../../config/dailyBonusConfig'
import { SHORTEST_LESSON, LONGEST_LESSON } from '../guide/guideData'

import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import { useScrollProgress } from '../../motion/scroll'
import { usePerformer } from '../../motion/stage'
import { DUR } from '../../motion/timing'
/* The frames' stylesheets are imported here, not only by the lazily loaded
   components that use them, so they stay in the page's first stylesheet in
   the same order as before — under motion.css, whose verbs sit on top. */
import '../progression/icons.css'
import '../daily/dailyBonus.css'
import './showcase.css'

/* The four live frames (ShowcaseFrames.jsx) are most of this page's code and
   DOM, and all of them sit below the fold. They are fetched when the browser
   is idle, and each mounts as its section comes within a screen of view — so
   the first paint is the page's words and the book, not four apps at once. */
const loadFrames = () => import('./ShowcaseFrames')
const frame = (name) => lazy(() => loadFrames().then((m) => ({ default: m[name] })))
const CourseFrame = frame('CourseFrame')
const StreakFrame = frame('StreakFrame')
const BonusFrame = frame('BonusFrame')
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

function Section({ id, index, eyebrow, heading, children, frame: Frame, flip = false }) {
  /* Writes --sp (0 entering → 1 leaving) for the frame's parallax. */
  const parallaxRef = useScrollProgress()
  const copyRef = useRef(null)

  /* The frame mounts once its column is within a screen of view. Until then
     the column is empty and holds the frame's height (showcase.css). */
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
    }, { rootMargin: '100% 0px' })
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
    <section className="sc-section" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap${flip ? ' flip' : ''}`}>
        <div className="sc-copy" ref={copyRef}>
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
          <SplitText as="h2" className="sc-heading" id={`${id}-heading`} stagger={48}>
            {heading}
          </SplitText>
          <Reveal stagger delay={220}>{children}</Reveal>
        </div>
        <div className="sc-frame" ref={setFrameNode} style={{ '--side': flip ? -1 : 1 }}>
          {near && <Suspense fallback={null}><Frame /></Suspense>}
        </div>
      </div>
    </section>
  )
}

/* ── 1. Learn ─────────────────────────────────────────────────────────────── */

function LearnSection() {
  return (
    <Section
      id="learn"
      index={1}
      eyebrow="The course"
      heading={<>{TOTAL_LESSONS} lessons,<br />one module at a time.</>}
      frame={CourseFrame}
    >
      <p className="sc-body">
        Finishing a module <Mark>unlocks the next one</Mark>, so you learn how AI
        works before the tools, and the tools before the ethics of using them.
        Lessons take {SHORTEST_LESSON}–{LONGEST_LESSON} minutes, and the course
        map always marks the one to do next.
      </p>
      <p className="sc-body">
        Lessons are questions, not videos: fill in the blank, decide whether a
        system is AI or ordinary code, choose the best answer. A wrong
        answer <Mark tone="berry">costs a heart</Mark>, so you can’t click
        through on autopilot.
      </p>
    </Section>
  )
}

/* ── 2. Streak ────────────────────────────────────────────────────────────── */

function StreakSection() {
  return (
    <Section
      id="streak"
      index={2}
      eyebrow="Streaks"
      heading={<>A day counts once<br />you finish something.</>}
      flip
      frame={StreakFrame}
    >
      <p className="sc-body">
        Finishing a lesson or a practice session extends your streak; opening
        LunX doesn’t. Days follow the <Mark tone="clay">calendar</Mark>, not
        24-hour windows, so a lesson late at night and another the next morning
        count as two days.
      </p>
      <p className="sc-body">
        Streak milestones pay gems, starting at {STREAK.MILESTONES[0]} days and
        going up to {STREAK.MILESTONES[STREAK.MILESTONES.length - 1]}. If you miss one day, a <Mark tone="moss">Streak Shield</Mark> covers
        it, as long as you have one. Miss two days in a row and the streak resets.
      </p>
    </Section>
  )
}

/* ── 3. Daily bonus ───────────────────────────────────────────────────────── */

function BonusSection() {
  return (
    <Section
      id="daily-bonus"
      index={3}
      eyebrow="Daily bonus"
      heading={<>{DAILY_BONUS.CYCLE_LENGTH} days,<br />{DAILY_BONUS.CYCLE_LENGTH} rewards.</>}
      frame={BonusFrame}
    >
      <p className="sc-body">
        The track pays gems, XP and hearts, with a <Mark>Streak Shield on
        day {DAILY_BONUS.CYCLE_LENGTH}</Mark>. Each day you visit, the next reward
        is waiting for you to claim.
      </p>
      <p className="sc-body">
        Miss a day and the track picks up where you left off instead of
        resetting. A missed day can already cost you your streak, so the bonus
        doesn’t take anything away as well.
      </p>
    </Section>
  )
}

/* ── 4. Quests and the shop ───────────────────────────────────────────────── */

function QuestSection() {
  return (
    <Section
      id="quests"
      index={4}
      eyebrow="Quests & shop"
      heading={<>Quests earn gems.<br />Gems buy second chances.</>}
      flip
      frame={QuestFrame}
    >
      <p className="sc-body">
        Each day brings {inWords(QUESTS.DAILY_COUNT)} new quests: an easy one, a medium
        one and a challenge, such as reaching your XP goal or finishing lessons
        without losing a heart. Targets rise with your level, and weekly quests
        work the same way over seven days.
      </p>
      <p className="sc-body">
        The shop sells {inWords(SHOP_ITEMS.length)} things: <Mark tone="berry">a full heart
        refill</Mark>, a single extra heart, and a <Mark tone="moss">Streak Shield</Mark>.
        Nothing in it is cosmetic: every item either gets you back into a lesson
        or protects your streak.
      </p>
    </Section>
  )
}

/* ── Root ─────────────────────────────────────────────────────────────────── */

export default function ProductSections() {
  /* Fetch the frames' code once the page has settled, so a section's frame
     is ready by the time the reader scrolls to it. */
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 1200))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => { loadFrames().catch(() => {}) })
    return () => cancel(id)
  }, [])

  return (
    <>
      <LearnSection />
      <StreakSection />
      <BonusSection />
      <QuestSection />
    </>
  )
}
