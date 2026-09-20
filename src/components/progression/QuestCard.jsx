/* ═══════════════════════════════════════════════════════════════════════════
   QuestCard.jsx — ONE QUEST, TWO DENSITIES
   ---------------------------------------------------------------------------
   `compact` renders the sidebar row, `full` renders the board card. Both read
   the same quest object.

   Claiming is guarded three ways: the button only exists while the quest is
   complete-and-unclaimed, it disables itself the instant it is pressed, and
   questService refuses a second claim regardless of what the UI does.

   Revision 2:
     · a compact row OPENS on hover or focus — difficulty, reward, what is
       left — so the sidebar stays one line per quest until you ask
     · progress bars settle with a shine when progress changes
     · a claimable reward invites: its gem bobs and its button shines
     · CLAIM → the button presses, the gems fly to the gem counter, the row
       stamps a check, and the number rolls when they land
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'
import { percent } from '../../utils/progressionUtils'
import useProgressWidth from '../../hooks/useProgressWidth'
import { fly } from '../../motion/flight'
import { ring } from '../../motion/burst'
import RollingNumber from '../../motion/RollingNumber'

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Challenge' }

/* True from the frame after `progress` changes: the shine class comes off
   for one frame and goes back on, so the fill is never remounted and its
   width transition (--dur-settle) gets to play. */
function useProgressShine(progress) {
  const prev = useRef(progress)
  const [shining, setShining] = useState(false)
  useEffect(() => {
    if (prev.current === progress) return undefined
    prev.current = progress
    setShining(false)
    const raf = requestAnimationFrame(() => setShining(true))
    return () => cancelAnimationFrame(raf)
  }, [progress])
  return shining
}

export function QuestCard({ quest, variant = 'full', index = 0, style, className = '' }) {
  const { actions } = useProgression()
  const [claiming, setClaiming] = useState(false)
  const [stamped, setStamped] = useState(false)
  const claimGuard = useRef(false)
  const claimRef = useRef(null)

  const pct = percent(quest.progress, quest.target)
  const fillWidth = useProgressWidth(pct)
  const claimable = quest.completed && !quest.claimed
  const shining = useProgressShine(quest.progress)
  const remaining = Math.max(0, quest.target - quest.progress)

  const claim = () => {
    if (claimGuard.current || !claimable) return
    claimGuard.current = true
    setClaiming(true)
    const source = claimRef.current
    const events = actions.claimQuest(quest.id) ?? []
    const paid = events.find((e) => e.type === 'QUEST_CLAIMED')
    if (paid) {
      fly({ from: source, to: 'gems', icon: 'gem', count: Math.min(7, 3 + Math.round(quest.reward.gems / 10)), amount: quest.reward.gems })
      ring(source, { color: '--ochre', size: 60 })
      setStamped(true)
      window.setTimeout(() => setStamped(false), 1200)
    }
    window.setTimeout(() => { claimGuard.current = false; setClaiming(false) }, 600)
  }

  if (variant === 'compact') {
    return (
      <div
        className={[
          'qc-compact',
          quest.completed ? 'is-complete' : '',
          claimable ? 'is-claimable' : '',
          quest.claimed ? 'is-claimed' : '',
          stamped ? 'is-stamped' : '',
          className,
        ].filter(Boolean).join(' ')}
        style={{ ...style, '--i': index }}
        data-quest={quest.id}
        role="group"
        tabIndex={claimable ? -1 : 0}
        aria-label={`${quest.description}: ${quest.progress} of ${quest.target}${quest.claimed ? ', claimed' : claimable ? ', ready to claim' : ''}`}
      >
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
            <div
              className={`qc-compact-fill${quest.completed ? ' is-done' : ''}${shining ? ' fx-fill-shine' : ''}`}
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          {/* Opens on hover / focus. */}
          <div className="qc-compact-more" aria-hidden="true">
            <div className="qc-compact-more-inner">
              <span className={`qc-chip qc-chip--${quest.difficulty}`}>{DIFFICULTY_LABEL[quest.difficulty] ?? quest.difficulty}</span>
              <span className="qc-compact-reward"><GemIcon size={11} /> +{quest.reward.gems}</span>
              <span className="qc-compact-left">
                {quest.claimed ? 'Claimed' : quest.completed ? 'Ready' : `${remaining} to go`}
              </span>
            </div>
          </div>
        </div>
        {claimable ? (
          <button
            ref={claimRef}
            className="qc-compact-claim fx-shine"
            onClick={claim}
            disabled={claiming}
            data-tip={`Claim ${quest.reward.gems} gems`}
          >
            <GemIcon size={12} className="qc-claim-gem" />+{quest.reward.gems}
          </button>
        ) : (
          <span className={`qc-compact-count${quest.completed ? ' is-done' : ''}`}>
            {quest.completed
              ? <span className="qc-check is-drawing"><Icon name="check" size={13} strokeWidth={3} /></span>
              : <><RollingNumber value={quest.progress} />/{quest.target}</>}
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
        stamped ? 'is-stamped' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{ ...style, '--i': index }}
      data-quest={quest.id}
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
          data-tip={`${pct}% · ${remaining} to go`}
        >
          <div
            className={`qc-card-fill${quest.completed ? ' is-done' : ''}${shining ? ' fx-fill-shine' : ''}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        <span className="qc-card-count"><RollingNumber value={quest.progress} />/{quest.target}</span>
      </div>

      <div className="qc-card-foot">
        <span className="qc-card-reward">
          <GemIcon size={14} className="qc-claim-gem" /> +{quest.reward.gems}
        </span>

        {claimable && (
          <button ref={claimRef} className="btn btn-primary btn-sm qc-claim-btn fx-shine" onClick={claim} disabled={claiming}>
            <GemIcon size={13} />
            Claim reward
          </button>
        )}
        {quest.claimed && (
          <span className="qc-claimed-tag">
            <span className="qc-check is-drawing"><Icon name="check" size={12} strokeWidth={3} /></span> Claimed
          </span>
        )}
        {!quest.completed && (
          <span className="qc-card-remaining">
            <RollingNumber value={remaining} /> to go
          </span>
        )}
      </div>
    </article>
  )
}

export default QuestCard
