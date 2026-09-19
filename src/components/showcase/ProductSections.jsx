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

   Revision 7 (MOTION_RULES.md → Scroll → Scenes → the tour): above 720px and
   with motion allowed, the four sections are ONE pinned stage. Scrolling
   hands each frame to the next — the outgoing frame lifts away and dims,
   the next rises and stands up out of a tilt — while the copy, the counter
   and the ground's tint change with it, and a rail marks the slide. Only the
   slide on screen is live: the others are inert, so the Stage leaves them
   alone and nothing in them can be focused. Invisible anchors in the track
   carry the section ids, so the navbar's links and underline still work.

   Choreography, per section, when the page is not a scene (phones, reduced
   motion — MOTION_RULES.md → Scroll):
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
import { scrollToScene, useSceneEnabled, useScrollProgress, useScrollScene } from '../../motion/scroll'
import { afterArrival, usePerformer } from '../../motion/stage'
import { DUR } from '../../motion/timing'
/* The frames' stylesheets are imported here, not only by the lazily loaded
   components that use them, so they stay in the page's first stylesheet in
   the same order as before — under motion.css, whose verbs sit on top. */
import '../progression/icons.css'
import '../daily/dailyBonus.css'
import './showcase.css'

/* The four live frames (ShowcaseFrames.jsx) are most of this page's code and
   DOM, and all of them sit below the fold. Their code is fetched once the
   page has arrived, and each frame mounts as its column comes into view —
   where its own entrance plays — so the first paint is the page's words and
   the book, not four apps at once. */
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

/* Accent (revision 5): now and then the copy answers the frame beside it —
   a highlighter stroke is laid again under one of its bold terms, the
   eyebrow's rule is drawn again, or the heading's emphasised word lifts and
   settles — never the same gesture twice running. It draws the eye from the
   demonstration back to the words that explain it. */
function useCopyRelay(copyRef, id) {
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
}

/* A slide's words, the same in a section and in the tour. */
function Copy({ slide, copyRef }) {
  useCopyRelay(copyRef, slide.id)
  return (
    <div className="sc-copy" ref={copyRef}>
      <Eyebrow index={slide.index}>{slide.eyebrow}</Eyebrow>
      <SplitText as="h2" className="sc-heading" id={`${slide.id}-heading`} stagger={48}>
        {slide.heading}
      </SplitText>
      <Reveal stagger delay={220}>{slide.body}</Reveal>
    </div>
  )
}

function Section({ slide, flip = false }) {
  const { id, frame: Frame } = slide
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

  return (
    <section className="sc-section" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap${flip ? ' flip' : ''}`}>
        <Copy slide={slide} copyRef={copyRef} />
        <div className="sc-frame" ref={setFrameNode} style={{ '--side': flip ? -1 : 1 }}>
          {near && <Suspense fallback={null}><Frame /></Suspense>}
        </div>
      </div>
    </section>
  )
}

/* ── The four slides ──────────────────────────────────────────────────────── */

const SLIDES = [
  {
    id: 'learn',
    index: 1,
    eyebrow: 'The course',
    tone: '--moss',
    heading: <>{TOTAL_LESSONS} lessons,<br />one module at a time.</>,
    frame: CourseFrame,
    body: (
      <>
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
      </>
    ),
  },
  {
    id: 'streak',
    index: 2,
    eyebrow: 'Streaks',
    tone: '--clay',
    heading: <>A day counts once<br />you finish something.</>,
    frame: StreakFrame,
    body: (
      <>
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
      </>
    ),
  },
  {
    id: 'daily-bonus',
    index: 3,
    eyebrow: 'Daily bonus',
    tone: '--ochre',
    heading: <>{DAILY_BONUS.CYCLE_LENGTH} days,<br />{DAILY_BONUS.CYCLE_LENGTH} rewards.</>,
    frame: BonusFrame,
    body: (
      <>
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
      </>
    ),
  },
  {
    id: 'quests',
    index: 4,
    eyebrow: 'Quests & shop',
    tone: '--berry',
    heading: <>Quests earn gems.<br />Gems buy second chances.</>,
    frame: QuestFrame,
    body: (
      <>
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
      </>
    ),
  },
]

/* ── The tour (revision 7) ────────────────────────────────────────────────── */

/* The hand-over between slides, in slides: slide i is fully shown for
   q ∈ [i + HAND/2, i + 1 − HAND/2]. MOTION_RULES.md → Scenes → the tour. */
const HAND = 0.36
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const swing = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2)
const pad = (n) => String(n).padStart(2, '0')

function TourSlideCopy({ slide, live, setRef }) {
  const copyRef = useRef(null)
  return (
    <article
      ref={setRef}
      className="tour-slide tour-slide--copy"
      aria-labelledby={`${slide.id}-heading`}
      {...(live ? {} : { inert: '', 'aria-hidden': 'true' })}
    >
      <Copy slide={slide} copyRef={copyRef} />
    </article>
  )
}

function Tour() {
  const n = SLIDES.length
  const track = useRef(null)
  const parts = useRef({ copies: [], frames: [], grounds: [], fills: [] })
  const [active, setActive] = useState(0)
  const now = useRef(0)

  /* Within a hand-over the words take turns — the outgoing copy is gone
     before the next arrives, so two paragraphs never share the column — and
     the frames overlap only while they are travelling apart. */
  const phase = (t, from, to) => swing(clamp01((t - from) / (to - from)))
  const onProgress = useCallback((p) => {
    const q = p * n
    const P = parts.current
    for (let i = 0; i < n; i++) {
      const tIn = i === 0 ? 1 : clamp01((q - i + HAND / 2) / HAND)
      const tOut = i === n - 1 ? 0 : clamp01((q - i - 1 + HAND / 2) / HAND)
      const layers = [
        [P.copies[i], phase(tIn, 0.5, 1), phase(tOut, 0, 0.5)],
        [P.frames[i], phase(tIn, 0.35, 1), phase(tOut, 0, 0.65)],
      ]
      for (const [el, enter, exit] of layers) {
        if (!el) continue
        const shown = Math.min(enter, 1 - exit)
        el.style.setProperty('--e', enter.toFixed(4))
        el.style.setProperty('--x', exit.toFixed(4))
        el.style.opacity = shown.toFixed(3)
        el.classList.toggle('is-on', shown > 0.01)
      }
      if (P.grounds[i]) P.grounds[i].style.opacity = Math.min(swing(tIn), 1 - swing(tOut)).toFixed(3)
      if (P.fills[i]) P.fills[i].style.transform = `scaleX(${clamp01(q - i).toFixed(4)})`
    }
    const at = Math.min(n - 1, Math.max(0, Math.floor(q + 1e-6)))
    if (at !== now.current) { now.current = at; setActive(at) }
  }, [n])

  const setScene = useScrollScene({ onProgress })
  const setTrack = useCallback((el) => { track.current = el; setScene(el) }, [setScene])

  /* Mount the four frames a screen before the tour arrives. */
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = track.current
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      setNear(true)
    }, { rootMargin: '100% 0px 100% 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const go = (i) => scrollToScene(track.current, (i + 0.5) / n)

  return (
    <section ref={setTrack} className="tour-track" style={{ '--n': n }} aria-label="Inside LunX">
      {/* The section ids live here, one per slide's stretch of scroll, so a
          navbar link lands mid-slide and its underline follows the tour. */}
      {SLIDES.map((s, i) => (
        <span key={s.id} id={s.id} className="tour-anchor" style={{ '--i': i }} aria-hidden="true" />
      ))}

      <div className="tour-stage">
        <div className="tour-ground" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <span key={s.id} ref={(el) => { parts.current.grounds[i] = el }} style={{ '--tone': `var(${s.tone})` }} />
          ))}
        </div>

        <div className="tour-wrap">
          <div className="tour-copy">
            <p className="tour-counter" aria-hidden="true">
              <span className="tour-counter-now">{pad(active + 1)}</span>
              <span className="tour-counter-of">/ {pad(n)}</span>
            </p>

            <div className="tour-stack">
              {SLIDES.map((s, i) => (
                <TourSlideCopy
                  key={s.id}
                  slide={s}
                  live={i === active}
                  setRef={(el) => { parts.current.copies[i] = el }}
                />
              ))}
            </div>

            <nav className="tour-rail" aria-label="Inside LunX">
              <ol>
                {SLIDES.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`tour-rail-seg${i === active ? ' is-active' : ''}`}
                      style={{ '--tone': `var(${s.tone})` }}
                      aria-current={i === active ? 'step' : undefined}
                      onClick={() => go(i)}
                    >
                      <span className="tour-rail-line" aria-hidden="true">
                        <span ref={(el) => { parts.current.fills[i] = el }} className="tour-rail-fill" />
                      </span>
                      <span className="tour-rail-label">{s.eyebrow}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="tour-frames">
            {SLIDES.map(({ id, frame: Frame }, i) => (
              <div
                key={id}
                ref={(el) => { parts.current.frames[i] = el }}
                className="tour-slide tour-slide--frame"
                {...(i === active ? {} : { inert: '', 'aria-hidden': 'true' })}
              >
                {near && <Suspense fallback={null}><Frame /></Suspense>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Root ─────────────────────────────────────────────────────────────────── */

export default function ProductSections() {
  /* Fetch the frames' code once the page has arrived, so a section's frame
     is ready by the time the reader scrolls to it. */
  useEffect(() => afterArrival(() => { loadFrames().catch(() => {}) }), [])
  const tour = useSceneEnabled('(min-width: 721px)')

  if (tour) return <Tour />
  return (
    <>
      {SLIDES.map((s, i) => <Section key={s.id} slide={s} flip={i % 2 === 1} />)}
    </>
  )
}
