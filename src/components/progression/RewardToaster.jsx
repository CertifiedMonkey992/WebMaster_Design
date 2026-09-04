/* ═══════════════════════════════════════════════════════════════════════════
   RewardToaster.jsx — REWARD FEEDBACK LAYER
   ---------------------------------------------------------------------------
   Reads the event stream the progression reducer emits and turns it into
   motion: floating "+25 XP" chips, gem pops, quest-complete toasts and a
   full-screen level-up celebration.

   Nothing here computes rewards — it only reacts to what already happened,
   which is why an animation can never disagree with the stored numbers.
   Everything respects prefers-reduced-motion via CSS.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo } from 'react'
import { useRewards, useProgression } from '../../state/ProgressionContext'
import { GemIcon, FlameIcon, HeartIcon, Icon, QuestIcon } from './Icons'

/* How long each kind of reward stays on screen. */
const LIFETIME = {
  XP_AWARDED: 1500,
  GEMS_AWARDED: 1800,
  GEMS_SPENT: 1600,
  GEMS_INSUFFICIENT: 2600,
  HEART_LOST: 1400,
  HEARTS_RESTORED: 1800,
  HEARTS_EMPTY: 3200,
  STREAK_UPDATED: 2400,
  STREAK_MILESTONE: 3200,
  STREAK_LOST: 3200,
  QUEST_COMPLETED: 3400,
  QUEST_CLAIMED: 2000,
  ACHIEVEMENT_UNLOCKED: 4000,
  SECTION_COMPLETE: 3600,
  PERFECT_LESSON: 2400,
  DAILY_GOAL_MET: 3000,
  TEAM_MISSION_COMPLETE: 3600,
  TEAM_MISSION_CLAIMED: 2400,
  LEVEL_UP: 4200,
}

function useAutoDismiss(rewards, dismiss) {
  useEffect(() => {
    if (!rewards.length) return undefined
    const timers = rewards.map((reward) =>
      window.setTimeout(() => dismiss(reward.key), LIFETIME[reward.type] ?? 2000),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [rewards, dismiss])
}

/* ── Individual toasts ───────────────────────────────────────────────────── */

function Toast({ reward }) {
  switch (reward.type) {
    case 'XP_AWARDED':
      return (
        <div className="rt-chip rt-chip--xp">
          <Icon name="bolt" size={14} strokeWidth={2.5} />
          +{reward.amount} XP
        </div>
      )

    case 'GEMS_AWARDED':
      return (
        <div className="rt-chip rt-chip--gem">
          <GemIcon size={15} />
          +{reward.amount}
        </div>
      )

    case 'GEMS_SPENT':
      return (
        <div className="rt-chip rt-chip--spend">
          <GemIcon size={15} />
          −{reward.amount}
        </div>
      )

    case 'GEMS_INSUFFICIENT':
      return (
        <div className="rt-toast rt-toast--warn">
          <GemIcon size={16} />
          <span>Not enough gems — you need {reward.required - reward.balance} more.</span>
        </div>
      )

    case 'HEART_LOST':
      return (
        <div className="rt-chip rt-chip--heart">
          <HeartIcon size={14} />
          −1
        </div>
      )

    case 'HEARTS_RESTORED':
      return (
        <div className="rt-chip rt-chip--heart-up">
          <HeartIcon size={14} />
          +{reward.amount}
        </div>
      )

    case 'HEARTS_EMPTY':
      return (
        <div className="rt-toast rt-toast--warn">
          <HeartIcon size={16} empty />
          <span>Out of hearts. They refill over time — practice is still free.</span>
        </div>
      )

    case 'STREAK_UPDATED':
      return (
        <div className="rt-toast rt-toast--streak">
          <FlameIcon size={20} />
          <span><b>{reward.streak}-day streak!</b> Keep it burning.</span>
        </div>
      )

    case 'STREAK_MILESTONE':
      return (
        <div className="rt-toast rt-toast--gold">
          <FlameIcon size={20} />
          <span><b>{reward.streak} days in a row.</b> +{reward.gems} gems</span>
        </div>
      )

    case 'STREAK_LOST':
      return (
        <div className="rt-toast rt-toast--muted">
          <FlameIcon size={18} dim />
          <span>Your {reward.previous}-day streak ended. Start a new one today.</span>
        </div>
      )

    case 'QUEST_COMPLETED':
      return (
        <div className="rt-toast rt-toast--quest">
          <span className="rt-toast-icon"><QuestIcon name={reward.quest.icon} size={18} /></span>
          <span>
            <b>Quest complete — {reward.quest.title}</b>
            <em>Reward ready to claim</em>
          </span>
        </div>
      )

    case 'QUEST_CLAIMED':
      return (
        <div className="rt-chip rt-chip--gem">
          <GemIcon size={15} />
          +{reward.quest.reward.gems}
        </div>
      )

    case 'ACHIEVEMENT_UNLOCKED':
      return (
        <div className="rt-toast rt-toast--gold">
          <span className="rt-toast-icon"><QuestIcon name={reward.achievement.icon} size={18} /></span>
          <span>
            <b>Achievement unlocked</b>
            <em>{reward.achievement.title}</em>
          </span>
        </div>
      )

    case 'SECTION_COMPLETE':
      return (
        <div className="rt-toast rt-toast--gold">
          <Icon name="layers" size={18} />
          <span><b>Section complete</b><em>{reward.section.title}</em></span>
        </div>
      )

    case 'PERFECT_LESSON':
      return (
        <div className="rt-toast rt-toast--quest">
          <Icon name="star" size={18} />
          <span><b>Perfect lesson</b><em>No hearts lost</em></span>
        </div>
      )

    case 'DAILY_GOAL_MET':
      return (
        <div className="rt-toast rt-toast--quest">
          <Icon name="check-circle" size={18} />
          <span><b>Daily goal reached</b><em>{reward.goal} XP today</em></span>
        </div>
      )

    case 'TEAM_MISSION_COMPLETE':
      return (
        <div className="rt-toast rt-toast--gold">
          <Icon name="users" size={18} />
          <span><b>Team mission complete</b><em>{reward.mission.title}</em></span>
        </div>
      )

    case 'TEAM_MISSION_CLAIMED':
      return (
        <div className="rt-toast rt-toast--quest">
          <Icon name="users" size={18} />
          <span><b>Shared reward claimed</b></span>
        </div>
      )

    default:
      return null
  }
}

/* ── Level-up celebration ────────────────────────────────────────────────── */

function LevelUpBanner({ reward, onDismiss }) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, LIFETIME.LEVEL_UP)
    return () => window.clearTimeout(id)
  }, [onDismiss])

  return (
    <div className="rt-levelup" role="status">
      <div className="rt-levelup-card">
        <div className="rt-levelup-rays" aria-hidden="true" />
        <div className="rt-levelup-badge">{reward.level}</div>
        <div className="rt-levelup-label">Level up</div>
        <div className="rt-levelup-title">{reward.title}</div>
        <div className="rt-levelup-sub">You reached level {reward.level}</div>
      </div>
    </div>
  )
}

/* ── Root ────────────────────────────────────────────────────────────────── */

export default function RewardToaster() {
  const { rewards, dismissReward } = useRewards()
  const { vm } = useProgression()

  const levelUp = useMemo(() => rewards.find((r) => r.type === 'LEVEL_UP'), [rewards])
  const stream = useMemo(() => rewards.filter((r) => r.type !== 'LEVEL_UP').slice(-5), [rewards])

  useAutoDismiss(stream, dismissReward)

  return (
    <>
      <div className="rt-stream" aria-live="polite" aria-atomic="false">
        {stream.map((reward) => (
          <div className="rt-item" key={reward.key}>
            <Toast reward={reward} />
          </div>
        ))}
      </div>

      {levelUp && (
        <LevelUpBanner
          reward={levelUp}
          onDismiss={() => dismissReward(levelUp.key)}
        />
      )}

      {/* Screen-reader mirror of the live totals */}
      <span className="pg-sr-only" aria-live="polite">
        {vm.xp} XP, level {vm.level}, {vm.gems} gems, {vm.hearts} hearts, {vm.streak} day streak
      </span>
    </>
  )
}
