/* ═══════════════════════════════════════════════════════════════════════════
   GemsPanel.jsx — CURRENCY INFORMATION + RECENT LEDGER
   ---------------------------------------------------------------------------
   Every gem movement is written to the ledger by currencyService, so this
   panel is a genuine transaction history rather than a decorative list.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { GemIcon, Icon } from './Icons'
import { CURRENCY, QUESTS, HEARTS } from '../../config/progressionConfig'
import { formatNumber } from '../../utils/progressionUtils'

const REASON_LABELS = {
  quest: 'Quest reward',
  'level-up': 'Level up',
  'perfect-lesson': 'Perfect lesson',
  'section-complete': 'Section complete',
  'streak-milestone': 'Streak milestone',
  achievement: 'Achievement',
  'team-mission': 'Team mission',
  'heart-refill': 'Heart refill',
  manual: 'Adjustment',
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function GemsPanel({ onClose }) {
  const { state, vm } = useProgression()
  const history = state.ledger.filter((e) => e.kind === 'gems').slice(0, 6)

  return (
    <div className="pg-panel">
      <div className="pg-gem-hero">
        <GemIcon size={34} className="pg-gem-hero-icon" />
        <div>
          <div className="pg-gem-hero-value">{formatNumber(vm.gems)}</div>
          <div className="pg-gem-hero-label">gems available</div>
        </div>
      </div>

      <div className="pg-panel-facts">
        <div className="pg-fact">
          <span className="pg-fact-label">Earned today</span>
          <span className="pg-fact-value">+{formatNumber(state.daily.gems)}</span>
        </div>
        <div className="pg-fact">
          <span className="pg-fact-label">Earned all-time</span>
          <span className="pg-fact-value">{formatNumber(state.stats.totalGemsEarned)}</span>
        </div>
      </div>

      <div className="pg-earn-list">
        <div className="pg-subhead">How to earn</div>
        <ul>
          <li><Icon name="target" size={13} /> Complete a daily quest <b>+{QUESTS.REWARD.easy}–{QUESTS.REWARD.hard}</b></li>
          <li><Icon name="chevron-up" size={13} /> Gain a level <b>+{CURRENCY.LEVEL_UP_GEMS}</b></li>
          <li><Icon name="star" size={13} /> Finish a lesson perfectly <b>+{CURRENCY.PERFECT_LESSON_GEMS}</b></li>
          <li><Icon name="layers" size={13} /> Complete a whole section <b>+{CURRENCY.SECTION_COMPLETE_GEMS}</b></li>
        </ul>
      </div>

      <div className="pg-earn-list">
        <div className="pg-subhead">Where they go</div>
        <ul>
          <li><Icon name="clock" size={13} /> Instant heart refill <b>−{HEARTS.REFILL_GEM_COST}</b></li>
          <li className="pg-muted-li"><Icon name="shield" size={13} /> Streak freeze <b>coming soon</b></li>
        </ul>
      </div>

      {history.length > 0 && (
        <div className="pg-ledger">
          <div className="pg-subhead">Recent activity</div>
          {history.map((entry, i) => (
            <div className="pg-ledger-row" key={`${entry.ts}-${i}`}>
              <span className="pg-ledger-reason">
                {entry.questTitle ?? REASON_LABELS[entry.reason] ?? entry.reason}
              </span>
              <span className="pg-ledger-time">{timeAgo(entry.ts)}</span>
              <span className={`pg-ledger-amount${entry.amount < 0 ? ' is-negative' : ''}`}>
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {onClose && (
        <div className="pg-panel-actions">
          <button className="pg-btn pg-btn--ghost" onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  )
}
