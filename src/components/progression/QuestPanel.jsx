/* ═══════════════════════════════════════════════════════════════════════════
   QuestPanel.jsx — THE FULL QUEST BOARD
   ---------------------------------------------------------------------------
   Rendered as the "View all" overlay and as the Quests destination.

   Revision 2: one tab indicator slides between tabs; each tab's list deals
   its cards in; "Claim all" pays out one flight per quest, staggered; the
   countdown rolls; the overlay rises and settles back down on close.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import QuestCard from './QuestCard'
import TeamMissionCard from './TeamMissionCard'
import { GemIcon, Icon } from './Icons'
import { msUntilEndOfDay, msUntilEndOfWeek, formatDuration } from '../../utils/dateUtils'
import RollingNumber from '../../motion/RollingNumber'
import SplitText from '../../motion/SplitText'
import { fly } from '../../motion/flight'

const TABS = [
  { id: 'today',  label: 'Today',  icon: 'target' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar' },
  { id: 'team',   label: 'Team',   icon: 'users' },
]

function QuestList({ quests, emptyMessage }) {
  if (!quests.length) return <p className="qp-empty">{emptyMessage}</p>
  return (
    <div className="qp-list">
      {quests.map((quest, i) => <QuestCard key={quest.id} quest={quest} index={i} />)}
    </div>
  )
}

export function QuestBoard({ initialTab = 'today', heading = true }) {
  const { vm, actions } = useProgression()
  const now = useClock()
  const [tab, setTab] = useState(initialTab)
  const tabsRef = useRef(null)
  const claimAllRef = useRef(null)

  const dailyDone = vm.quests.daily.filter((q) => q.completed).length
  const weeklyDone = vm.quests.weekly.filter((q) => q.completed).length
  const claimable = vm.quests.claimableCount

  useLayoutEffect(() => {
    const el = tabsRef.current
    const active = el?.querySelector('.qp-tab.is-active')
    if (!el || !active) return
    el.style.setProperty('--tab-x', `${active.offsetLeft}px`)
    el.style.setProperty('--tab-w', `${active.offsetWidth}px`)
  }, [tab])

  const claimAll = () => {
    const source = claimAllRef.current
    const events = actions.claimAllQuests() ?? []
    const paid = events.filter((e) => e.type === 'QUEST_CLAIMED')
    paid.forEach((e, i) => {
      window.setTimeout(() => fly({ from: source, to: 'gems', icon: 'gem', count: 4, amount: e.quest.reward.gems }), i * 180)
    })
  }

  return (
    <div className="qp-board">
      {heading && (
        <header className="qp-board-head">
          <span className="qp-eyebrow">Quests</span>
          <SplitText as="h1" className="qp-title" immediate stagger={55}>Always something to work toward</SplitText>
        </header>
      )}

      <div className="qp-tabs" role="tablist" aria-label="Quest categories" ref={tabsRef}>
        <span className="qp-tab-ink" aria-hidden="true" />
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
            {t.id === 'today' && dailyDone > 0 && <span className="qp-tab-badge" key={dailyDone}>{dailyDone}</span>}
          </button>
        ))}
      </div>

      {claimable > 0 && (
        <button ref={claimAllRef} className="btn btn-primary qp-claim-all fx-shine" onClick={claimAll} key={claimable}>
          <GemIcon size={16} className="qc-claim-gem" />
          Claim {claimable} reward{claimable === 1 ? '' : 's'}
        </button>
      )}

      <div className="qp-tab-view" key={tab}>
        {tab === 'today' && (
          <section className="qp-section">
            <header className="qp-section-head">
              <div>
                <h3 className="qp-section-title">Daily quests</h3>
                <p className="qp-section-sub">{dailyDone} of {vm.quests.daily.length} complete</p>
              </div>
              <span className="qp-reset">
                <Icon name="clock" size={12} />
                Resets in <RollingNumber value={formatDuration(msUntilEndOfDay(new Date(now)))} />
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
                Resets in <RollingNumber value={formatDuration(msUntilEndOfWeek(new Date(now)))} />
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
    </div>
  )
}

/** Overlay version used by the sidebar's "View all". */
export default function QuestPanel({ open, onClose, initialTab = 'today' }) {
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); return undefined }
    if (!mounted) return undefined
    setLeaving(true)
    const t = window.setTimeout(() => { setMounted(false); setLeaving(false) }, 220)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div className={`qp-overlay${leaving ? ' is-leaving' : ''}`} onClick={onClose}>
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
          <QuestBoard initialTab={initialTab} heading={false} />
        </div>
      </div>
    </div>
  )
}
