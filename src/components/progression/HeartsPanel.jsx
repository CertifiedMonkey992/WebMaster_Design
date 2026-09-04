/* ═══════════════════════════════════════════════════════════════════════════
   HeartsPanel.jsx — HEART STATE, RECOVERY AND THE 0-HEART FALLBACK
   ---------------------------------------------------------------------------
   Recovery times come from `getHeartRecoveryTime`, which derives everything
   from the stored anchor timestamp — so the countdown shown here is correct
   even if the tab was closed for six hours.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, useClock } from '../../state/ProgressionContext'
import { HeartIcon, GemIcon, Icon } from './Icons'
import { HEARTS } from '../../config/progressionConfig'
import { formatClock, formatDuration } from '../../utils/dateUtils'
import { getHeartRecoveryTime } from '../../services/currencyService'

export default function HeartsPanel({ onClose }) {
  const { state, vm, actions } = useProgression()
  const now = useClock()

  /* Recompute against the live clock so the countdown ticks every second. */
  const recovery = getHeartRecoveryTime(state, now)
  const canAfford = vm.gems >= HEARTS.REFILL_GEM_COST
  const isFull = vm.hearts >= vm.maxHearts

  return (
    <div className="pg-panel">
      <div className="pg-hearts-row" role="img" aria-label={`${vm.hearts} of ${vm.maxHearts} hearts`}>
        {Array.from({ length: vm.maxHearts }, (_, i) => (
          <span key={i} className={`pg-heart-slot${i < vm.hearts ? ' is-filled' : ''}`}>
            <HeartIcon size={22} empty={i >= vm.hearts} />
          </span>
        ))}
      </div>

      <p className="pg-panel-lead">
        {isFull
          ? 'All hearts full — you’re ready for anything.'
          : vm.hearts === 0
            ? 'You’re out of hearts. Lessons are paused until one comes back.'
            : `${vm.hearts} of ${vm.maxHearts} hearts remaining.`}
      </p>

      {!isFull && (
        <div className="pg-recovery">
          <div className="pg-recovery-head">
            <Icon name="clock" size={14} />
            <span>Next heart in</span>
            <strong className="pg-recovery-clock">{formatClock(recovery.msUntilNext)}</strong>
          </div>
          <div className="pg-recovery-track">
            <div
              className="pg-recovery-fill"
              style={{ width: `${Math.round((recovery.cycleProgress ?? 0) * 100)}%` }}
            />
          </div>
          <div className="pg-recovery-foot">
            Full again in {formatDuration(recovery.msUntilFull)} · one heart every {HEARTS.RECOVERY_MINUTES} min
          </div>
        </div>
      )}

      <div className="pg-panel-facts">
        <div className="pg-fact">
          <span className="pg-fact-label">Lost all-time</span>
          <span className="pg-fact-value">{Math.max(0, state.stats.totalHeartsLost)}</span>
        </div>
        <div className="pg-fact">
          <span className="pg-fact-label">Recovery rate</span>
          <span className="pg-fact-value">{HEARTS.RECOVERY_MINUTES} min</span>
        </div>
      </div>

      <p className="pg-panel-note">
        Hearts are spent on wrong answers in a lesson. Practice sessions never cost
        hearts — you can always keep learning there.
      </p>

      <div className="pg-panel-actions">
        <button
          className="pg-btn pg-btn--primary"
          disabled={isFull || !canAfford}
          onClick={() => { actions.refillHeartsWithGems(); }}
        >
          <GemIcon size={15} />
          Refill for {HEARTS.REFILL_GEM_COST}
        </button>
        {onClose && (
          <button className="pg-btn pg-btn--ghost" onClick={onClose}>Close</button>
        )}
      </div>

      {!isFull && !canAfford && (
        <p className="pg-panel-warn">
          You need {HEARTS.REFILL_GEM_COST - vm.gems} more gems for an instant refill.
        </p>
      )}
    </div>
  )
}
