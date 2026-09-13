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
import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../../data/learnData'
import { SHOP_ITEMS } from '../../config/shopConfig'

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

/* A bold term that gets a highlighter stroke when it is read. */
function Mark({ children, tone = 'ochre' }) {
  const [ref, inView] = useInView({ threshold: 0.9, rootMargin: '0px 0px -12% 0px' })
  return (
    <strong ref={ref} className={`mark mark--${tone}${inView ? ' is-in' : ''}`}>
      {children}
    </strong>
  )
}

/* ── Section shell ───────────────────────────────────────────────────────── */

function Section({ id, index, eyebrow, heading, children, frame, flip = false }) {
  const [ref, inView] = useInView({ threshold: 0.2 })
  /* Writes --sp (0 entering → 1 leaving) for the frame's parallax. */
  const parallaxRef = useScrollProgress()
  return (
    <section className="sc-section" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap${flip ? ' flip' : ''}`}>
        <div className="sc-copy">
          <span ref={ref} className={`sc-eyebrow${inView ? ' is-in' : ''}`}>
            <span className="sc-eyebrow-num">{String(index).padStart(2, '0')}</span>
            <span className="sc-eyebrow-rule" aria-hidden="true" />
            <span className="sc-eyebrow-text">{eyebrow}</span>
          </span>
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

function LearnSection() {
  return (
    <Section
      id="learn"
      index={1}
      eyebrow="The course"
      heading={<>{TOTAL_LESSONS} lessons.<br />One path through AI.</>}
      frame={
        <ProductFrame
          path="Learn"
          caption="The Learn tab. Scroll — the frame scrolls the real course with you."
          maxHeight="30rem"
          scrub
        >
          <ModuleList onStartLesson={noop} />
        </ProductFrame>
      }
    >
      <p className="sc-body">
        {TOTAL_SECTIONS} modules, from what AI actually is through to the ethics
        of using it. Lessons run 4–8 minutes and <Mark>unlock in order</Mark>,
        so there is never a question about what to do next — and the map tracks
        exactly how far you have got.
      </p>
      <p className="sc-body">
        Lessons are interactive rather than video: fill in the blank, judge a
        scenario, pick the right call. A wrong answer <Mark tone="berry">costs a heart</Mark>,
        so there is no clicking through on autopilot.
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
      heading={<>Miss a day and<br />you start over.</>}
      flip
      frame={
        <ProductFrame path="Streak" caption="The live top bar — hover the figures, click the flame." side="left">
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
        A day only counts once you finish something. The streak tracks
        <Mark tone="clay"> calendar days</Mark>, not 24-hour gaps, so a late-night
        session and a morning one are two days — exactly as you would expect.
      </p>
      <p className="sc-body">
        Milestones at 3, 7, 14 and 30 days pay gems. Miss one day and a
        <Mark tone="moss"> Streak Shield</Mark> covers it, if you have one banked. Miss
        two, and you start again.
      </p>
    </Section>
  )
}

/* ── 3. Daily bonus ───────────────────────────────────────────────────────── */

function BonusFrame() {
  const { vm } = useProgression()
  return (
    <ProductFrame path="Daily bonus" caption="The bonus panel, mid-track. Day 4 is today's.">
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
      heading={<>Come back.<br />Get paid.</>}
      frame={<BonusFrame />}
    >
      <p className="sc-body">
        A seven-day track with a reward waiting on each one: gems, XP, hearts,
        and a <Mark>Streak Shield on day 7</Mark>. Claim it, and tomorrow the
        next day unlocks.
      </p>
      <p className="sc-body">
        Nothing collects itself — you press the button. And miss a day? The track
        waits where you left it. The streak is what punishes absence; the bonus
        does not pile on.
      </p>
    </Section>
  )
}

/* ── 4. Quests and the shop ───────────────────────────────────────────────── */

function QuestFrame() {
  const { vm } = useProgression()
  const quests = vm.quests.daily.slice(0, 3)

  return (
    <ProductFrame path="Quests" caption="Daily quests, generated fresh each morning. Gems are the payout." side="left">
      <div className="sc-stack">
        <span className="sc-stack-label">Today&apos;s quests</span>
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} variant="compact" />
        ))}

        <span className="sc-stack-label" style={{ marginTop: '0.5rem' }}>
          What gems buy
        </span>
        <ul className="sc-shop-mini">
          {SHOP_ITEMS.map((item) => (
            <li className="sc-shop-mini-item" key={item.id} data-tip={item.description}>
              <span className="sc-shop-mini-art"><ShopArt name={item.art} size={40} /></span>
              <span className="sc-shop-mini-name">{item.name}</span>
              <span className="sc-shop-mini-price">
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
      heading={<>Always something<br />to work toward.</>}
      flip
      frame={<QuestFrame />}
    >
      <p className="sc-body">
        Three quests are generated each day and scale with your level — earn XP,
        finish lessons, keep a perfect run. Claim them for gems. Weekly quests
        run alongside for the longer haul.
      </p>
      <p className="sc-body">
        Gems buy exactly three things: <Mark tone="berry">refill your hearts</Mark>, add a
        single heart, or bank a <Mark tone="moss">Streak Shield</Mark>. That is the whole
        shop — no cosmetics, no filler.
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
