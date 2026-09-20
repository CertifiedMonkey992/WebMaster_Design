/* ═══════════════════════════════════════════════════════════════════════════
   GemsPanel.jsx — CURRENCY INFORMATION + RECENT LEDGER
   ---------------------------------------------------------------------------
   Every gem movement is written to the ledger by currencyService, so this
   panel is a genuine transaction history.

   Revision 2: the stone turns as the panel opens, the balance rolls, the
   ways to earn and spend are rows you can read by hovering, and the ledger
   entries arrive in order, newest first.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { GemIcon, BoltIcon, ShieldIcon, HeartIcon, Icon } from './Icons'
import { CURRENCY, QUESTS } from '../../config/progressionConfig'
import { HEART_REFILL_COST, STREAK_SHIELD_COST, getShopItem } from '../../config/shopConfig'
import { formatNumber } from '../../utils/progressionUtils'
import RollingNumber from '../../motion/RollingNumber'

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
  dev: 'Adjustment',
  unknown: 'Adjustment',
}

/** The ledger's reasons as the services write them: shop purchases are
 *  `shop:<item id>` and bonus claims `daily-bonus-day-<n>`. */
function reasonLabel(entry) {
  if (entry.questTitle) return entry.questTitle
  if (REASON_LABELS[entry.reason]) return REASON_LABELS[entry.reason]
  if (entry.reason.startsWith('shop:')) return getShopItem(entry.reason.slice(5))?.name ?? 'Shop purchase'
  if (entry.reason.startsWith('daily-bonus')) return 'Daily bonus'
  return entry.reason
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function GemsPanel({ onClose, onOpenShop }) {
  const { state, vm } = useProgression()
  const history = state.ledger.filter((e) => e.kind === 'gems').slice(0, 6)

  const earn = [
    { icon: <Icon name="target" size={13} />, text: 'Complete a daily quest', value: `+${QUESTS.REWARD.easy}–${QUESTS.REWARD.hard}` },
    { icon: <BoltIcon size={13} />, text: 'Gain a level', value: `+${CURRENCY.LEVEL_UP_GEMS}` },
    { icon: <Icon name="star" size={13} />, text: 'Finish a lesson perfectly', value: `+${CURRENCY.PERFECT_LESSON_GEMS}` },
    { icon: <Icon name="layers" size={13} />, text: 'Complete a whole section', value: `+${CURRENCY.SECTION_COMPLETE_GEMS}` },
  ]
  const spend = [
    { icon: <HeartIcon size={13} />, text: 'Instant heart refill', value: `−${HEART_REFILL_COST}` },
    { icon: <ShieldIcon size={13} emblem={false} />, text: 'Streak Shield', value: `−${STREAK_SHIELD_COST}` },
  ]

  return (
    <div className="pg-panel">
      <div className="pg-gem-hero fx-glint-host">
        <span className="pg-gem-hero-icon"><GemIcon size={38} /></span>
        <div>
          <div className="pg-gem-hero-value"><RollingNumber value={vm.gems} format={formatNumber} /></div>
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
          {earn.map((row, i) => (
            <li key={row.text} style={{ '--i': i }}>{row.icon} {row.text} <b>{row.value}</b></li>
          ))}
        </ul>
      </div>

      <div className="pg-earn-list pg-earn-list--spend">
        <div className="pg-subhead">Where they go</div>
        <ul>
          {spend.map((row, i) => (
            <li key={row.text} style={{ '--i': i + 4 }}>{row.icon} {row.text} <b>{row.value}</b></li>
          ))}
        </ul>
      </div>

      {history.length > 0 && (
        <div className="pg-ledger">
          <div className="pg-subhead">Recent activity</div>
          {history.map((entry, i) => (
            <div className="pg-ledger-row" key={`${entry.ts}-${i}`} style={{ '--i': i }}>
              <span className="pg-ledger-reason">
                {reasonLabel(entry)}
              </span>
              <span className="pg-ledger-time">{timeAgo(entry.ts)}</span>
              <span className={`pg-ledger-amount${entry.amount < 0 ? ' is-negative' : ''}`}>
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pg-panel-actions">
        {onOpenShop && <button type="button" className="btn btn-primary btn-sm" onClick={onOpenShop}>Open the shop</button>}
        {onClose && <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>}
      </div>
    </div>
  )
}
