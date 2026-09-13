/* ═══════════════════════════════════════════════════════════════════════════
   RewardToaster.jsx — REWARD FEEDBACK LAYER
   ---------------------------------------------------------------------------
   Reads the event stream the progression reducer emits and turns it into
   motion. Nothing here computes rewards — it only reacts to what already
   happened, so an animation can never disagree with the stored numbers.

   Revision 2:
     · a "+25 XP" or "+10 gems" chip is where the reward APPEARS, and its
       particles then fly to the counter they belong to — unless the thing
       that paid them already launched its own flight
     · toasts arrive from the edge with a spring, show how long they will
       stay as a draining rule along their foot, and leave by sliding away
     · level up: the badge spins in, its number rolls from the old level to
       the new, and paper shards burst behind it
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRewards, useProgression } from '../../state/ProgressionContext'
import { GemIcon, FlameIcon, HeartIcon, BoltIcon, ShieldIcon, Icon, QuestIcon } from './Icons'
import { fly, recentlyLaunched } from '../../motion/flight'
import { burst, ring } from '../../motion/burst'
import RollingNumber from '../../motion/RollingNumber'

const LIFETIME = {
  XP_AWARDED: 1600,
  GEMS_AWARDED: 1900,
  GEMS_SPENT: 1600,
  GEMS_INSUFFICIENT: 2600,
  HEART_LOST: 1400,
  HEARTS_RESTORED: 1800,
  HEARTS_EMPTY: 3200,
  STREAK_UPDATED: 2600,
  STREAK_MILESTONE: 3400,
  STREAK_LOST: 3200,
  STREAK_SHIELD_USED: 4600,
  PURCHASE_COMPLETE: 2600,
  QUEST_COMPLETED: 3400,
  QUEST_CLAIMED: 2000,
  ACHIEVEMENT_UNLOCKED: 4000,
  SECTION_COMPLETE: 3600,
  PERFECT_LESSON: 2400,
  DAILY_GOAL_MET: 3000,
  TEAM_MISSION_COMPLETE: 3600,
  TEAM_MISSION_CLAIMED: 2400,
  DAILY_CYCLE_COMPLETE: 4200,
  LEVEL_UP: 4200,
}

const EXIT_MS = 260

/* Which chips fly, and where. */
const CHIP_FLIGHT = {
  XP_AWARDED:      (r) => ({ to: 'xp', icon: 'xp', count: Math.min(5, 2 + Math.round(r.amount / 10)) }),
  GEMS_AWARDED:    (r) => ({ to: 'gems', icon: 'gem', count: Math.min(6, 2 + Math.round(r.amount / 8)) }),
  HEARTS_RESTORED: (r) => ({ to: 'hearts', icon: 'heart', count: Math.min(5, r.amount) }),
}

function Toast({ reward }) {
  switch (reward.type) {
    case 'XP_AWARDED':
      return <div className="rt-chip rt-chip--xp"><BoltIcon size={14} />+{reward.amount} XP</div>
    case 'GEMS_AWARDED':
      return <div className="rt-chip rt-chip--gem"><GemIcon size={15} />+{reward.amount}</div>
    case 'GEMS_SPENT':
      return <div className="rt-chip rt-chip--spend"><GemIcon size={15} />−{reward.amount}</div>
    case 'GEMS_INSUFFICIENT':
      return (
        <div className="rt-toast rt-toast--warn">
          <span className="rt-toast-icon"><GemIcon size={18} /></span>
          <span><b>Not enough gems</b><em>You need {reward.required - reward.balance} more.</em></span>
        </div>
      )
    case 'HEART_LOST':
      return <div className="rt-chip rt-chip--heart"><HeartIcon size={14} fill={0.5} />−1</div>
    case 'HEARTS_RESTORED':
      return <div className="rt-chip rt-chip--heart-up"><HeartIcon size={14} />+{reward.amount}</div>
    case 'HEARTS_EMPTY':
      return (
        <div className="rt-toast rt-toast--warn">
          <span className="rt-toast-icon"><HeartIcon size={18} empty /></span>
          <span><b>Out of hearts</b><em>They refill over time — practice is still free.</em></span>
        </div>
      )
    case 'STREAK_UPDATED':
      return (
        <div className="rt-toast rt-toast--streak">
          <span className="rt-toast-icon rt-toast-icon--flare"><FlameIcon size={22} /></span>
          <span><b>{reward.streak}-day streak!</b><em>Keep it burning.</em></span>
        </div>
      )
    case 'STREAK_MILESTONE':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon rt-toast-icon--flare"><FlameIcon size={22} /></span>
          <span><b>{reward.streak} days in a row.</b><em>+{reward.gems} gems</em></span>
        </div>
      )
    case 'STREAK_LOST':
      return (
        <div className="rt-toast rt-toast--muted">
          <span className="rt-toast-icon"><FlameIcon size={20} dim /></span>
          <span><b>Your {reward.previous}-day streak ended</b><em>Start a new one today.</em></span>
        </div>
      )
    case 'STREAK_SHIELD_USED':
      return (
        <div className="rt-toast rt-toast--shield">
          <span className="rt-toast-icon rt-toast-icon--guard"><ShieldIcon size={22} /></span>
          <span>
            <b>Streak Shield used — your {reward.streak}-day streak is safe.</b>
            <em>{reward.remaining} shield{reward.remaining === 1 ? '' : 's'} left</em>
          </span>
        </div>
      )
    case 'PURCHASE_COMPLETE':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon"><Icon name="check-circle" size={20} className="is-drawing" /></span>
          <span><b>{reward.name} added</b><em>Balance: {reward.balance} gems</em></span>
        </div>
      )
    case 'QUEST_COMPLETED':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon rt-toast-icon--pop"><QuestIcon name={reward.quest.icon} size={20} /></span>
          <span><b>Quest complete — {reward.quest.title}</b><em>Reward ready to claim</em></span>
        </div>
      )
    case 'QUEST_CLAIMED':
      return <div className="rt-chip rt-chip--gem"><GemIcon size={15} />+{reward.quest.reward.gems}</div>
    case 'ACHIEVEMENT_UNLOCKED':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon rt-toast-icon--medal"><QuestIcon name={reward.achievement.icon} size={20} /></span>
          <span><b>Achievement unlocked</b><em>{reward.achievement.title}</em></span>
        </div>
      )
    case 'SECTION_COMPLETE':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon rt-toast-icon--pop"><Icon name="layers" size={20} /></span>
          <span><b>Section complete</b><em>{reward.section.title}</em></span>
        </div>
      )
    case 'PERFECT_LESSON':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon rt-toast-icon--spin"><Icon name="star" size={20} /></span>
          <span><b>Perfect lesson</b><em>No hearts lost</em></span>
        </div>
      )
    case 'DAILY_GOAL_MET':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon"><Icon name="check-circle" size={20} className="is-drawing" /></span>
          <span><b>Daily goal reached</b><em>{reward.goal} XP today</em></span>
        </div>
      )
    case 'TEAM_MISSION_COMPLETE':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon"><Icon name="users" size={20} /></span>
          <span><b>Team mission complete</b><em>{reward.mission.title}</em></span>
        </div>
      )
    case 'TEAM_MISSION_CLAIMED':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon"><Icon name="users" size={20} /></span>
          <span><b>Shared reward claimed</b></span>
        </div>
      )
    case 'DAILY_CYCLE_COMPLETE':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon rt-toast-icon--pop"><Icon name="calendar" size={20} /></span>
          <span><b>Seven days complete</b><em>A fresh bonus track starts tomorrow</em></span>
        </div>
      )
    default:
      return null
  }
}

function StreamItem({ reward, leaving }) {
  const ref = useRef(null)

  /* Launch in a LAYOUT effect: this runs in the same commit as the counter's
     value change and before the counter's passive effect, so the counter
     sees the flight in the air and holds its old value. */
  useLayoutEffect(() => {
    const route = CHIP_FLIGHT[reward.type]
    if (!route || !ref.current) return
    const r = route(reward)
    if (recentlyLaunched(r.to, 900)) return
    fly({ from: ref.current, ...r })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isChip = Boolean(CHIP_FLIGHT[reward.type]) || reward.type === 'GEMS_SPENT' || reward.type === 'HEART_LOST' || reward.type === 'QUEST_CLAIMED'

  return (
    <div
      ref={ref}
      className={`rt-item${leaving ? ' is-leaving' : ''}${isChip ? ' rt-item--chip' : ''}`}
      style={{ '--life': `${LIFETIME[reward.type] ?? 2000}ms` }}
    >
      <Toast reward={reward} />
      {!isChip && <span className="rt-life" aria-hidden="true" />}
    </div>
  )
}

function LevelUpBanner({ reward, onDismiss }) {
  const badgeRef = useRef(null)
  const [shown, setShown] = useState(Math.max(1, reward.level - 1))
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setShown(reward.level)
      ring(badgeRef.current, { color: '--ochre', size: 200, duration: 900 })
      burst(badgeRef.current, { palette: 'reward', count: 30, spread: 170, gravity: 70, duration: 1100 })
    }, 520)
    const t2 = window.setTimeout(() => setLeaving(true), LIFETIME.LEVEL_UP - 300)
    const t3 = window.setTimeout(onDismiss, LIFETIME.LEVEL_UP)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`rt-levelup${leaving ? ' is-leaving' : ''}`} role="status">
      <div className="rt-levelup-card">
        <div className="rt-levelup-badge" ref={badgeRef}>
          <RollingNumber value={shown} />
          <span className="rt-levelup-bolt"><BoltIcon size={16} /></span>
        </div>
        <div className="rt-levelup-label">Level up</div>
        <div className="rt-levelup-title">{reward.title}</div>
        <div className="rt-levelup-sub">You reached level {reward.level}</div>
      </div>
    </div>
  )
}

export default function RewardToaster() {
  const { rewards, dismissReward } = useRewards()
  const { vm } = useProgression()
  const [leaving, setLeaving] = useState(() => new Set())

  const levelUp = useMemo(() => rewards.find((r) => r.type === 'LEVEL_UP'), [rewards])
  const stream = useMemo(() => rewards.filter((r) => r.type !== 'LEVEL_UP').slice(-5), [rewards])

  useEffect(() => {
    if (!stream.length) return undefined
    const timers = stream.flatMap((reward) => {
      const life = LIFETIME[reward.type] ?? 2000
      return [
        window.setTimeout(() => setLeaving((s) => new Set(s).add(reward.key)), Math.max(0, life - EXIT_MS)),
        window.setTimeout(() => {
          dismissReward(reward.key)
          setLeaving((s) => { const n = new Set(s); n.delete(reward.key); return n })
        }, life),
      ]
    })
    return () => timers.forEach(window.clearTimeout)
  }, [stream, dismissReward])

  return (
    <>
      <div className="rt-stream" aria-live="polite" aria-atomic="false">
        {stream.map((reward) => (
          <StreamItem key={reward.key} reward={reward} leaving={leaving.has(reward.key)} />
        ))}
      </div>

      {levelUp && (
        <LevelUpBanner
          key={levelUp.key}
          reward={levelUp}
          onDismiss={() => dismissReward(levelUp.key)}
        />
      )}

      <span className="pg-sr-only" aria-live="polite">
        {vm.xp} XP, level {vm.level}, {vm.gems} gems, {vm.hearts} hearts, {vm.streak} day streak
      </span>
    </>
  )
}
