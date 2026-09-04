/* ═══════════════════════════════════════════════════════════════════════════
   QuestPanel.jsx — THE FULL QUEST BOARD
   ---------------------------------------------------------------------------
   Rendered two ways from one component:
     • `variant="modal"` — the "View All" overlay from the sidebar
     • `variant="page"`  — the Quests destination in the left nav

   Tabs: TODAY · WEEKLY · TEAM. Expiry countdowns are recalculated from the
   real calendar boundary on every render, so reopening the page shows the
   correct remaining time rather than a timer that restarted.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import QuestCard from './QuestCard'
import TeamMissionCard from './TeamMissionCard'
import { GemIcon, Icon } from './Icons'
import { msUntilEndOfDay, msUntilEndOfWeek, formatDuration } from '../../utils/dateUtils'

const TABS = [
  { id: 'today',  label: 'Today',  icon: 'target' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar' },
  { id: 'team',   label: 'Team',   icon: 'users' },
]

function QuestList({ quests, emptyMessage }) {
  if (!quests.length) return <p className="qp-empty">{emptyMessage}</p>
  return (
    <div className="qp-list">
      {quests.map((quest) => <QuestCard key={quest.id} quest={quest} />)}
    </div>
  )
}

export function QuestBoard({ initialTab = 'today' }) {
  const { vm, actions } = useProgression()
  const now = useClock()
  const [tab, setTab] = useState(initialTab)

  const dailyDone = vm.quests.daily.filter((q) => q.completed).length
  const weeklyDone = vm.quests.weekly.filter((q) => q.completed).length
  const claimable = vm.quests.claimableCount

  return (
    <div className="qp-board">
      <div className="qp-tabs" role="tablist" aria-label="Quest categories">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`qp-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.id === 'today' && dailyDone > 0 && <span className="qp-tab-badge">{dailyDone}</span>}
          </button>
        ))}
      </div>

      {claimable > 0 && (
        <button className="qp-claim-all" onClick={() => actions.claimAllQuests()}>
          <GemIcon size={15} />
          Claim {claimable} reward{claimable === 1 ? '' : 's'}
        </button>
      )}

      {tab === 'today' && (
        <section className="qp-section">
          <header className="qp-section-head">
            <div>
              <h3 className="qp-section-title">Daily quests</h3>
              <p className="qp-section-sub">{dailyDone} of {vm.quests.daily.length} complete</p>
            </div>
            <span className="qp-reset">
              <Icon name="clock" size={12} />
              Resets in {formatDuration(msUntilEndOfDay(new Date(now)))}
            </span>
          </header>
          <QuestList quests={vm.quests.daily} emptyMessage="New quests arrive at midnight." />
        </section>
      )}

      {tab === 'weekly' && (
        <section className="qp-section">
          <header className="qp-section-head">
            <div>
              <h3 className="qp-section-title">Weekly quests</h3>
              <p className="qp-section-sub">{weeklyDone} of {vm.quests.weekly.length} complete</p>
            </div>
            <span className="qp-reset">
              <Icon name="clock" size={12} />
              Resets in {formatDuration(msUntilEndOfWeek(new Date(now)))}
            </span>
          </header>
          <QuestList quests={vm.quests.weekly} emptyMessage="Weekly quests refresh on Monday." />
        </section>
      )}

      {tab === 'team' && (
        <section className="qp-section">
          <header className="qp-section-head">
            <div>
              <h3 className="qp-section-title">Team mission</h3>
              <p className="qp-section-sub">One goal, one squad, one shared reward</p>
            </div>
          </header>
          <TeamMissionCard />
        </section>
      )}
    </div>
  )
}

/** Overlay version used by the sidebar's "View All". */
export default function QuestPanel({ open, onClose, initialTab = 'today' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="qp-overlay" onClick={onClose}>
      <div
        className="qp-modal"
        role="dialog"
        aria-modal="true"
        aria-label="All quests"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="qp-modal-head">
          <h2 className="qp-modal-title">Quests</h2>
          <button className="qp-modal-close" onClick={onClose} aria-label="Close quests">
            <Icon name="close" size={16} strokeWidth={2.5} />
          </button>
        </header>
        <div className="qp-modal-body">
          <QuestBoard initialTab={initialTab} />
        </div>
      </div>
    </div>
  )
}
