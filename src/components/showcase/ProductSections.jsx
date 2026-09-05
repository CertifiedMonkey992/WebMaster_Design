/* ═══════════════════════════════════════════════════════════════════════════
   ProductSections.jsx — THE MARKETING STORY, TOLD WITH THE REAL PRODUCT
   ---------------------------------------------------------------------------
   Every panel on this page is the app's own component, mounted through
   ProgressionShowcase against a demo learner built by the real reducer. There
   are no mockups here and no re-drawn interfaces: if the course map changes,
   this page changes with it.

   The claims are deliberately narrow. Everything stated below is something the
   current build actually does — 22 lessons across 5 modules, a calendar-day
   streak, a 7-day bonus track, generated daily quests, and a 3-item shop.
   Features that exist only as placeholders (leaderboards, team missions,
   accounts) are not mentioned.
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
import './showcase.css'

const noop = () => {}

/* ── Section shell ───────────────────────────────────────────────────────── */

function Section({ id, eyebrow, heading, children, frame, flip = false }) {
  return (
    <section className="sc-section" id={id} aria-labelledby={`${id}-heading`}>
      <div className={`sc-wrap${flip ? ' flip' : ''}`}>
        <div className="sc-copy reveal">
          <span className="section-eyebrow">{eyebrow}</span>
          <h2 className="sc-heading" id={`${id}-heading`}>{heading}</h2>
          {children}
        </div>
        <div className="reveal d2">{frame}</div>
      </div>
    </section>
  )
}

/* ── 1. Learn ─────────────────────────────────────────────────────────────── */

function LearnFrame() {
  return (
    <ProductFrame
      path="lunx.app/learn"
      caption="The Learn tab. Lessons unlock in order and the next one is always waiting at the top."
      maxHeight="30rem"
    >
      <ModuleList onStartLesson={noop} />
    </ProductFrame>
  )
}

function LearnSection() {
  return (
    <Section
      id="learn"
      eyebrow="The course"
      heading={<>{TOTAL_LESSONS} lessons.<br />One path through AI.</>}
      frame={<LearnFrame />}
    >
      <p className="sc-body">
        {TOTAL_SECTIONS} modules, from what AI actually is through to the ethics
        of using it. Lessons run 4–8 minutes and <strong>unlock in order</strong>,
        so there is never a question about what to do next — and the map tracks
        exactly how far you have got.
      </p>
      <p className="sc-body">
        Lessons are interactive rather than video: fill in the blank, judge a
        scenario, pick the right call. A wrong answer <strong>costs a heart</strong>,
        so there is no clicking through on autopilot.
      </p>
    </Section>
  )
}

/* ── 2. Streak ────────────────────────────────────────────────────────────── */

function StreakFrame() {
  return (
    <ProductFrame
      path="lunx.app/learn"
      caption="The live top bar, and the streak panel behind it."
      align="right"
    >
      <div className="sc-stats-frame">
        <div className="sc-topbar">
          <PlayerStatusBar />
        </div>
        <div className="sc-panel-host">
          <StreakPanel />
        </div>
      </div>
    </ProductFrame>
  )
}

function StreakSection() {
  return (
    <Section
      id="streak"
      eyebrow="Streaks"
      heading={<>Miss a day and<br />you start over.</>}
      flip
      frame={<StreakFrame />}
    >
      <p className="sc-body">
        A day only counts once you finish something. The streak tracks
        <strong> calendar days</strong>, not 24-hour gaps, so a late-night
        session and a morning one are two days — exactly as you would expect.
      </p>
      <p className="sc-body">
        Milestones at 3, 7, 14 and 30 days pay gems. Miss one day and a
        <strong> Streak Shield</strong> covers it, if you have one banked. Miss
        two, and you start again.
      </p>
    </Section>
  )
}

/* ── 3. Daily bonus ───────────────────────────────────────────────────────── */

function BonusFrame() {
  const { vm } = useProgression()
  return (
    <ProductFrame
      path="lunx.app/learn · daily bonus"
      caption="The bonus panel, mid-track. Day 4 is today's."
    >
      <DailyBonusTrack view={vm.dailyBonus} variant="showcase" showHeader={false} />
    </ProductFrame>
  )
}

function BonusSection() {
  return (
    <Section
      id="daily-bonus"
      eyebrow="Daily bonus"
      heading={<>Come back.<br />Get paid.</>}
      frame={<BonusFrame />}
    >
      <p className="sc-body">
        A seven-day track with a reward waiting on each one: gems, XP, hearts,
        and a <strong>Streak Shield on day 7</strong>. Claim it, and tomorrow the
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
    <ProductFrame
      path="lunx.app/quests"
      caption="Daily quests, generated fresh each morning. Gems are the payout."
      align="right"
    >
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
            <li className="sc-shop-mini-item" key={item.id}>
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
        Gems buy exactly three things: <strong>refill your hearts</strong>, add a
        single heart, or bank a <strong>Streak Shield</strong>. That is the whole
        shop — no cosmetics, no filler.
      </p>
    </Section>
  )
}

/* ── Root ─────────────────────────────────────────────────────────────────── */

export default function ProductSections() {
  /* Built once. Every section reads the same demo learner, so the streak in the
     top bar and the progress on the course map belong to the same person. */
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
