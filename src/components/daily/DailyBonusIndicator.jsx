/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusIndicator.jsx — THE TOP-BAR ACCESS POINT
   ---------------------------------------------------------------------------
   A gift button beside the player stats. It carries a pulsing dot while a
   reward is waiting and drops to a quiet claimed state once it has been taken,
   so the top bar gains a signal rather than another permanent stat card.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import './dailyBonus.css'

export default function DailyBonusIndicator({ onOpen }) {
  const { vm } = useProgression()
  const { available, currentDay, cycleLength } = vm.dailyBonus

  return (
    <button
      type="button"
      className={`db-indicator${available ? ' is-ready' : ' is-claimed'}`}
      onClick={onOpen}
      aria-label={
        available
          ? `Daily bonus ready to claim — day ${currentDay} of ${cycleLength}`
          : `Daily bonus already claimed today — day ${currentDay} of ${cycleLength}`
      }
    >
      <span className="db-indicator-icon" aria-hidden="true">
        <Icon name={available ? 'gift' : 'check-circle'} size={18} strokeWidth={2.1} />
      </span>
      <span className="db-indicator-text">
        {available ? 'Daily bonus' : `Day ${currentDay}`}
      </span>
      {available && <span className="db-indicator-dot" aria-hidden="true" />}
    </button>
  )
}
