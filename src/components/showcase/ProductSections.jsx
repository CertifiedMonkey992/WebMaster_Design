/* ═══════════════════════════════════════════════════════════════════════════
   ProductSections.jsx — THE MARKETING STORY, TOLD WITH THE REAL PRODUCT
   ---------------------------------------------------------------------------
   Every panel on this page is the app's own component, mounted through
   ProgressionShowcase against a demo learner built by the real reducer.

   Choreography, per section (MOTION_RULES.md → Scroll):
     · the eyebrow's index number and rule draw in
     · the heading assembles word by word
     · the paragraphs rise in sequence; each bold term gets a highlighter
       stroke laid under it as it comes into view
     · the frame slides in from its own side, stands up out of a tilt, and
       then floats on a slow parallax against the copy, which stays put
     · the real components inside perform their own entrance when seen
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo } from 'react'
import { ProgressionShowcase, useProgression } from '../../state/ProgressionContext'
import { getShowcaseState } from '../../data/showcaseState'
import { TOTAL_LESSONS } from '../../data/learnData'
import { SHOP_ITEMS } from '../../config/shopConfig'
import { STREAK, QUESTS } from '../../config/progressionConfig'
import { DAILY_BONUS } from '../../config/dailyBonusConfig'
import { SHORTEST_LESSON, LONGEST_LESSON } from '../guide/guideData'

import ModuleList from '../learn/ModuleList'
import PlayerStatusBar from '../progression/PlayerStatusBar'
import StreakPanel from '../progression/StreakPanel'
import { QuestCard } from '../progression/QuestCard'
import DailyBonusTrack from '../daily/DailyBonusTrack'
import ShopArt from '../shop/ShopArt'
import { GemIcon } from '../progression/Icons'

import ProductFrame from './ProductFrame'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import { useScrollProgress } from '../../motion/scroll'
import './showcase.css'

const noop = () => {}

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

function Section({ id, index, eyebrow, heading, children, frame, flip = false }) {
  /* Writes --sp (0 entering → 1 leaving) for the frame's parallax. */
  const parallaxRef = useScrollProgress()
  return (
    <section className="sc-section" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap${flip ? ' flip' : ''}`}>
        <div className="sc-copy">
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
          <SplitText as="h2" className="sc-heading" id={`${id}-heading`} stagger={48}>
            {heading}
          </SplitText>
          <Reveal stagger delay={220}>{children}</Reveal>
        </div>
        <div className="sc-frame" ref={parallaxRef} style={{ '--side': flip ? -1 : 1 }}>{frame}</div>
      </div>
    </section>
  )
}

/* ── 1. Learn ─────────────────────────────────────────────────────────────── */

/* The course frame's route (MOTION_RULES.md → Auto-tour): the top of the
   course, then the current lesson — the loudest object in the product — then
   the rest of the map, and back round. */
const COURSE_TOUR = ({ max, height, offsetOf }, clamp) => {
  const current = offsetOf('.lesson-row--current')
  return [
    { y: 0, hold: 1600 },
    current != null && { y: clamp(current - height * 0.28, 0, max), hold: 2800 },
    { y: max, hold: 1800 },
  ]
}

function LearnSection() {
  return (
    <Section
      id="learn"
      index={1}
      eyebrow="The course"
      heading={<>{TOTAL_LESSONS} lessons,<br />one module at a time.</>}
      frame={
        <ProductFrame
          path="Learn"
          caption="The Learn tab with a sample learner’s progress. It scrolls on its own; hover to pause it."
          maxHeight="30rem"
          tour={COURSE_TOUR}
        >
          <ModuleList onStartLesson={noop} />
        </ProductFrame>
      }
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
      frame={
        <ProductFrame path="Streak" caption="The app’s top bar and streak panel. Hover a number to see what it counts, or click the flame." side="left">
          <div className="sc-stats-frame">
            <div className="sc-topbar">
              <PlayerStatusBar />
            </div>
            <div className="sc-panel-host">
              <StreakPanel />
            </div>
          </div>
        </ProductFrame>
      }
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

function BonusFrame() {
  const { vm } = useProgression()
  return (
    <ProductFrame path="Daily bonus" caption="The daily bonus panel for a sample learner on day 4.">
      <DailyBonusTrack view={vm.dailyBonus} variant="showcase" showHeader={false} />
    </ProductFrame>
  )
}

function BonusSection() {
  return (
    <Section
      id="daily-bonus"
      index={3}
      eyebrow="Daily bonus"
      heading={<>{DAILY_BONUS.CYCLE_LENGTH} days,<br />{DAILY_BONUS.CYCLE_LENGTH} rewards.</>}
      frame={<BonusFrame />}
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

const FLOAT_K = [1, 1.23, 0.87]

function QuestFrame() {
  const { vm } = useProgression()
  const quests = vm.quests.daily.slice(0, 3)

  return (
    <ProductFrame path="Quests" caption="Today’s quests for a sample learner, and everything the shop sells." side="left">
      <div className="sc-stack">
        <span className="sc-stack-label">Today&apos;s quests</span>
        {quests.map((quest, i) => (
          <QuestCard key={quest.id} quest={quest} variant="compact" index={i} />
        ))}

        <span className="sc-stack-label" style={{ marginTop: '0.5rem' }}>
          What gems buy
        </span>
        <ul className="sc-shop-mini">
          {SHOP_ITEMS.map((item, i) => (
            <li className="sc-shop-mini-item" key={item.id} data-tip={item.description}>
              {/* Each item floats on its own multiple of --idle-float, so the
                  three never rise together. */}
              <span className="sc-shop-mini-art">
                <span className="fx-float" style={{ '--float-k': FLOAT_K[i % FLOAT_K.length], '--seed': i / SHOP_ITEMS.length }}>
                  <ShopArt name={item.art} size={40} />
                </span>
              </span>
              <span className="sc-shop-mini-name">{item.name}</span>
              <span className="sc-shop-mini-price fx-gleam fx-glint-host">
                <GemIcon size={13} />
                {item.price}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ProductFrame>
  )
}

function QuestSection() {
  return (
    <Section
      id="quests"
      index={4}
      eyebrow="Quests & shop"
      heading={<>Quests earn gems.<br />Gems buy second chances.</>}
      flip
      frame={<QuestFrame />}
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
  const state = useMemo(() => getShowcaseState(), [])

  return (
    <ProgressionShowcase state={state}>
      <LearnSection />
      <StreakSection />
      <BonusSection />
      <QuestSection />
    </ProgressionShowcase>
  )
}
