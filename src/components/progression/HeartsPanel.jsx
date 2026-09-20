/* ═══════════════════════════════════════════════════════════════════════════
   HeartsPanel.jsx — HEART STATE, RECOVERY AND THE 0-HEART FALLBACK
   ---------------------------------------------------------------------------
   Recovery times come from `getHeartRecoveryTime`, which derives everything
   from the stored anchor timestamp — correct even after the tab was closed.

   Revision 2:
     · five hearts, and the one that is coming back FILLS LIVE, a sliver at a
       time, with its own countdown in a tooltip
     · a three-step strip explaining the whole mechanic in pictures
     · refilling with gems sends the gems out of the gem counter into the
       row, and the hearts fill one after another
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { HeartIcon, GemIcon, Icon } from './Icons'
import { HEARTS } from '../../config/progressionConfig'
import { HEART_REFILL_COST } from '../../config/shopConfig'
import { formatClock, formatDuration } from '../../utils/dateUtils'
import { getHeartRecoveryTime } from '../../services/currencyService'
import { fly } from '../../motion/flight'
import { shake } from '../../motion/burst'
import RollingNumber from '../../motion/RollingNumber'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'

export default function HeartsPanel({ onClose, onOpenShop }) {
  const { state, vm, actions } = useProgression()
  const now = useClock()
  const rowRef = useRef(null)
  const refillRef = useRef(null)

  const recovery = getHeartRecoveryTime(state, now)
  const canAfford = vm.gems >= HEART_REFILL_COST
  const isFull = vm.hearts >= vm.maxHearts
  const cycle = Math.max(0, Math.min(1, recovery.cycleProgress ?? 0))
  /* A learner has five hearts and a row of five is the clearest thing to
     draw. The reviewer's profile has a hundred, and a hundred glyphs is not
     a row — it is wallpaper — so past this many the panel counts instead.
     COMPONENT_RULES.md → Hearts. */
  const ROW_MAX = 10
  const drawRow = vm.maxHearts <= ROW_MAX

  const refill = () => {
    if (isFull || !canAfford) {
      shake(refillRef.current)
      return
    }
    fly({ from: 'gems', to: rowRef.current, icon: 'gem', count: 5, label: `−${HEART_REFILL_COST}` })
    actions.refillHeartsWithGems()
  }

  return (
    <div className="pg-panel">
      {!drawRow && (
        <div ref={rowRef} className="pg-hearts-many" role="img" aria-label={`${vm.hearts} of ${vm.maxHearts} hearts`}>
          <HeartIcon size={34} fill={Math.max(0.06, vm.hearts / vm.maxHearts)} />
          <span className="pg-hearts-many-count tnum">
            <RollingNumber value={vm.hearts} />
            <span className="pg-hearts-many-max">of {vm.maxHearts}</span>
          </span>
        </div>
      )}

      {drawRow && <div
        ref={rowRef}
        className={`pg-hearts-row${isFull ? ' is-full' : ''}`}
        role="img"
        aria-label={`${vm.hearts} of ${vm.maxHearts} hearts`}
      >
        {Array.from({ length: vm.maxHearts }, (_, i) => {
          const filled = i < vm.hearts
          const next = i === vm.hearts
          const fill = filled ? 1 : next ? Math.max(0.06, cycle) : 0
          const tip = filled
            ? `Heart ${i + 1} · ready`
            : next
              ? `Heart ${i + 1} · back in ${formatClock(recovery.msUntilNext)}`
              : `Heart ${i + 1} · after the one before it`
          return (
            <span
              key={i}
              className={`pg-heart-slot${filled ? ' is-filled' : ''}${next ? ' is-next' : ''}`}
              style={{ '--i': i }}
              data-tip={tip}
            >
              <HeartIcon size={26} fill={fill} />
            </span>
          )
        })}
      </div>}

      <p className="pg-panel-lead">
        {isFull
          ? 'All hearts full — you’re ready for anything.'
          : vm.hearts === 0
            ? 'You’re out of hearts. Lessons are paused until one comes back.'
            : `${vm.hearts} of ${vm.maxHearts} hearts remaining.`}
      </p>

      {/* The mechanic, in three pictures. */}
      <ol className="pg-how" aria-label="How hearts work">
        <li style={{ '--i': 0 }}>
          <span className="pg-how-ico pg-how-ico--lose"><HeartIcon size={18} fill={0.5} /></span>
          <span><b>Wrong answer</b> costs one</span>
        </li>
        <li style={{ '--i': 1 }}>
          <span className="pg-how-ico pg-how-ico--time"><Icon name="clock" size={17} strokeWidth={2.2} /></span>
          <span><b>{HEARTS.RECOVERY_MINUTES} min</b> brings one back</span>
        </li>
        <li style={{ '--i': 2 }}>
          <span className="pg-how-ico pg-how-ico--free"><Icon name="target" size={17} strokeWidth={2.2} /></span>
          <span><b>Practice</b> is always free</span>
        </li>
      </ol>

      {!isFull && (
        <div className="pg-recovery">
          <div className="pg-recovery-head">
            <Icon name="clock" size={14} className="pg-recovery-clock-ico" />
            <span>Next heart in</span>
            <strong className="pg-recovery-clock tnum">{formatClock(recovery.msUntilNext)}</strong>
          </div>
          <div className="pg-recovery-track">
            <div className="pg-recovery-fill" style={{ width: `${Math.round(cycle * 100)}%` }} />
          </div>
          <div className="pg-recovery-foot">
            Full again in {formatDuration(recovery.msUntilFull)} · one heart every {HEARTS.RECOVERY_MINUTES} min
          </div>
        </div>
      )}

      <div className="pg-panel-facts">
        <div className="pg-fact">
          <span className="pg-fact-label">Lost all-time</span>
          <RollingNumber className="pg-fact-value" value={Math.max(0, state.stats.totalHeartsLost)} />
        </div>
        <div className="pg-fact">
          <span className="pg-fact-label">Recovery rate</span>
          <span className="pg-fact-value">{HEARTS.RECOVERY_MINUTES} min</span>
        </div>
      </div>

      <div className="pg-panel-actions">
        <button
          ref={refillRef}
          type="button"
          className={`btn btn-primary btn-sm pg-refill${!isFull && canAfford ? ' fx-shine' : ''}`}
          aria-disabled={isFull || !canAfford}
          data-tip={isFull ? 'Your hearts are already full' : !canAfford ? `You need ${HEART_REFILL_COST - vm.gems} more gems` : undefined}
          onClick={refill}
        >
          <GemIcon size={15} />
          Refill for {HEART_REFILL_COST}
        </button>
        {onOpenShop && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onOpenShop}>Shop</button>
        )}
        {onClose && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        )}
      </div>

      {/* Reviewer only: a heart lost here cracks and sheds exactly as one lost
          to a wrong answer does, because it is the same action. */}
      <JudgeMargin className="pg-judge-margin" label="Reviewer heart controls">
        <JudgeChip op={OPS.HEARTS} payload={{ amount: -1 }} icon="heart" label="Lose one"
          disabled={vm.hearts === 0} tip="Runs the same loss a wrong answer causes" />
        <JudgeChip op={OPS.HEARTS} payload={{ amount: -vm.hearts }} icon="heart" label="Empty"
          quiet disabled={vm.hearts === 0} tip="See the out-of-hearts state and the practice fallback" />
        <JudgeChip op={OPS.TOP_UP} icon="sparkle" label="Refill" tip={`Back to ${vm.maxHearts}`} />
      </JudgeMargin>
    </div>
  )
}
