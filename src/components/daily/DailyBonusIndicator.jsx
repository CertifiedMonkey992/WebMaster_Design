/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusIndicator.jsx — THE TOP-BAR ACCESS POINT
   ---------------------------------------------------------------------------
   A gift button beside the player stats. While a reward is waiting it is an
   Invitation: the gift gives a small shake every few seconds, its dot pings,
   and hovering lifts the lid. Once claimed it settles to a quiet "Day N"
   with a check that draws itself, and the invitation stops.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import './dailyBonus.css'

export default function DailyBonusIndicator({ onOpen }) {
  const { vm } = useProgression()
  const { available, currentDay, cycleLength, todayReward, upcomingReward } = vm.dailyBonus

  return (
    <button
      type="button"
      className={`db-indicator${available ? ' is-ready' : ' is-claimed'}`}
      onClick={onOpen}
      data-tip={
        available
          ? `Day ${currentDay} of ${cycleLength} · ${todayReward?.label} waiting`
          : `Day ${currentDay} claimed · tomorrow: ${upcomingReward?.label}`
      }
      data-tip-side="bottom"
      aria-label={
        available
          ? `Daily bonus ready to claim — day ${currentDay} of ${cycleLength}`
          : `Daily bonus already claimed today — day ${currentDay} of ${cycleLength}`
      }
    >
      <span className="db-indicator-icon" aria-hidden="true">
        <Icon
          name={available ? 'gift' : 'check-circle'}
          size={18}
          strokeWidth={2.1}
          className={available ? '' : 'is-drawing'}
        />
      </span>
      <span className="db-indicator-text">
        {available ? 'Daily bonus' : `Day ${currentDay}`}
      </span>
      {/* Seven pips: how far through the track you are. */}
      <span className="db-indicator-pips" aria-hidden="true">
        {Array.from({ length: cycleLength }, (_, i) => (
          <i key={i} className={i < (available ? currentDay - 1 : currentDay) ? 'is-on' : i === currentDay - 1 && available ? 'is-today' : ''} />
        ))}
      </span>
      {available && <span className="db-indicator-dot" aria-hidden="true" />}
    </button>
  )
}
