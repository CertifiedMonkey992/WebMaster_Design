/* ═══════════════════════════════════════════════════════════════════════════
   QuestCard.jsx — ONE QUEST, TWO DENSITIES
   ---------------------------------------------------------------------------
   `compact` renders the sidebar row, `full` renders the panel card. Both read
   the same quest object, so a quest can never look complete in one place and
   incomplete in the other.

   Claiming is guarded three ways: the button only exists while the quest is
   complete-and-unclaimed, it disables itself the instant it is pressed, and
   questService refuses a second claim regardless of what the UI does.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'
import { percent } from '../../utils/progressionUtils'

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Challenge' }

export function QuestCard({ quest, variant = 'full' }) {
  const { actions } = useProgression()
  const [claiming, setClaiming] = useState(false)
  const claimGuard = useRef(false)

  const pct = percent(quest.progress, quest.target)
  const claimable = quest.completed && !quest.claimed

  /* Idempotency at the UI layer too: the ref blocks a second synchronous
     click before React has re-rendered the disabled state. */
  const claim = () => {
    if (claimGuard.current || !claimable) return
    claimGuard.current = true
    setClaiming(true)
    actions.claimQuest(quest.id)
    window.setTimeout(() => { claimGuard.current = false; setClaiming(false) }, 600)
  }

  if (variant === 'compact') {
    return (
      <div className={`qc-compact${quest.completed ? ' is-complete' : ''}${claimable ? ' is-claimable' : ''}`}>
        <span className="qc-compact-icon"><QuestIcon name={quest.icon} size={16} /></span>
        <div className="qc-compact-body">
          <div className="qc-compact-label">{quest.description}</div>
          <div
            className="qc-compact-track"
            role="progressbar"
            aria-valuenow={quest.progress}
            aria-valuemin={0}
            aria-valuemax={quest.target}
            aria-label={quest.description}
          >
            <div className={`qc-compact-fill${quest.completed ? ' is-done' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {claimable ? (
          <button className="qc-compact-claim" onClick={claim} disabled={claiming}>
            <GemIcon size={12} />+{quest.reward.gems}
          </button>
        ) : (
          <span className={`qc-compact-count${quest.completed ? ' is-done' : ''}`}>
            {quest.completed
              ? <Icon name="check" size={13} strokeWidth={3} />
              : `${quest.progress}/${quest.target}`}
          </span>
        )}
      </div>
    )
  }

  return (
    <article
      className={[
        'qc-card',
        `qc-${quest.difficulty}`,
        quest.completed ? 'is-complete' : '',
        claimable ? 'is-claimable' : '',
        quest.claimed ? 'is-claimed' : '',
      ].join(' ')}
    >
      <div className="qc-card-head">
        <span className="qc-card-icon"><QuestIcon name={quest.icon} size={20} /></span>
        <div className="qc-card-titles">
          <h4 className="qc-card-title">{quest.title}</h4>
          <p className="qc-card-desc">{quest.description}</p>
        </div>
        <span className={`qc-chip qc-chip--${quest.difficulty}`}>
          {DIFFICULTY_LABEL[quest.difficulty] ?? quest.difficulty}
        </span>
      </div>

      <div className="qc-card-progress">
        <div
          className="qc-card-track"
          role="progressbar"
          aria-valuenow={quest.progress}
          aria-valuemin={0}
          aria-valuemax={quest.target}
        >
          <div className={`qc-card-fill${quest.completed ? ' is-done' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="qc-card-count">{quest.progress}/{quest.target}</span>
      </div>

      <div className="qc-card-foot">
        <span className="qc-card-reward">
          <GemIcon size={14} /> +{quest.reward.gems}
        </span>

        {claimable && (
          <button className="qc-claim-btn" onClick={claim} disabled={claiming}>
            Claim reward
          </button>
        )}
        {quest.claimed && (
          <span className="qc-claimed-tag">
            <Icon name="check" size={12} strokeWidth={3} /> Claimed
          </span>
        )}
        {!quest.completed && (
          <span className="qc-card-remaining">
            {Math.max(0, quest.target - quest.progress)} to go
          </span>
        )}
      </div>
    </article>
  )
}

export default QuestCard
