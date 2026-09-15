/* ═══════════════════════════════════════════════════════════════════════════
   ShowcaseFrames.jsx — THE FOUR LIVE FRAMES
   ---------------------------------------------------------------------------
   The real app, each frame on its own demo learner (ProgressionDemo) with the
   scene that performs it (ProductSections.jsx explains the story they tell).

   Loaded apart from the landing page's first bundle: these frames are most of
   its code and DOM, and all of them sit below the fold. ProductSections
   mounts each one as its section comes within a screen of view, so the first
   paint is the page's words and the book.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ProgressionDemo, useProgression } from '../../state/ProgressionContext'
import { getShowcaseState, getBonusShowcaseState } from '../../data/showcaseState'
import { SHOP_ITEMS } from '../../config/shopConfig'

import ModuleList from '../learn/ModuleList'
import PlayerStatusBar from '../progression/PlayerStatusBar'
import StreakPanel from '../progression/StreakPanel'
import { QuestCard } from '../progression/QuestCard'
import DailyBonusTrack from '../daily/DailyBonusTrack'
import DailyBonusIndicator from '../daily/DailyBonusIndicator'
import ShopArt from '../shop/ShopArt'
import { GemIcon } from '../progression/Icons'

import ProductFrame from './ProductFrame'
import CourseScene from './scenes/CourseScene'
import StreakScene from './scenes/StreakScene'
import BonusScene from './scenes/BonusScene'
import QuestScene from './scenes/QuestScene'

const noop = () => {}

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

export function CourseFrame() {
  return (
    <ProgressionDemo seed={getShowcaseState}>
      <ProductFrame
        path="Learn"
        caption="The Learn tab on a demo learner. It tours the course and finishes a lesson now and then; hover to pause it."
        maxHeight="30rem"
        tour={COURSE_TOUR}
        scene={<CourseScene />}
      >
        <ModuleList onStartLesson={noop} />
      </ProductFrame>
    </ProgressionDemo>
  )
}

/* ── 2. Streak ────────────────────────────────────────────────────────────── */

export function StreakFrame() {
  return (
    <ProgressionDemo seed={getShowcaseState}>
      <ProductFrame
        path="Streak"
        caption="The app’s top bar and streak panel on a demo learner, one day at a time. Hover a number to see what it counts."
        side="left"
        scene={<StreakScene />}
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
    </ProgressionDemo>
  )
}

/* ── 3. Daily bonus ───────────────────────────────────────────────────────── */

function BonusPanel() {
  const { vm, actions } = useProgression()
  return (
    <ProductFrame
      path="Daily bonus"
      caption="The top bar and daily bonus panel on a demo learner. It claims a day at a time; press Claim to try it yourself."
      scene={<BonusScene />}
    >
      <div className="sc-stats-frame">
        <div className="sc-topbar">
          <DailyBonusIndicator onOpen={noop} />
          <PlayerStatusBar />
        </div>
        <DailyBonusTrack view={vm.dailyBonus} variant="showcase" showHeader={false} onClaim={actions.claimDailyBonus} />
      </div>
    </ProductFrame>
  )
}

export function BonusFrame() {
  return <ProgressionDemo seed={getBonusShowcaseState}><BonusPanel /></ProgressionDemo>
}

/* ── 4. Quests and the shop ───────────────────────────────────────────────── */

const FLOAT_K = [1, 1.23, 0.87]

function QuestsAndShop() {
  const { vm, state } = useProgression()
  const quests = vm.quests.daily.slice(0, 3)

  return (
    <ProductFrame
      path="Quests"
      caption="Today’s quests on a demo learner, and everything the shop sells. Claim a finished quest to try it yourself."
      side="left"
      scene={<QuestScene />}
    >
      <div className="sc-stack">
        <div className="sc-topbar">
          <PlayerStatusBar />
        </div>
        <span className="sc-stack-label">Today&apos;s quests</span>
        {/* Keyed on the day, so tomorrow's set is dealt in rather than
            swapped in place. */}
        <div className="sc-quests" key={state.quests.dailyKey}>
          {quests.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} variant="compact" index={i} />
          ))}
        </div>

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

export function QuestFrame() {
  return <ProgressionDemo seed={getShowcaseState}><QuestsAndShop /></ProgressionDemo>
}
