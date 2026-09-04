/* ═══════════════════════════════════════════════════════════════════════════
   QuestWidget.jsx — DAILY QUEST SIDEBAR
   ---------------------------------------------------------------------------
   Reads the generated quest set for TODAY and the current week. Nothing here
   is hardcoded: targets, progress, completion and claim state all come from
   the quest engine, so the bars move the instant a lesson finishes.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, useClock } from '../../state/ProgressionContext'
import QuestCard from '../progression/QuestCard'
import { Icon } from '../progression/Icons'
import { msUntilEndOfDay, formatDuration } from '../../utils/dateUtils'

export default function QuestWidget({ onViewAll }) {
  const { vm } = useProgression()
  const now = useClock()

  const { daily, weekly, summary, claimableCount } = vm.quests
  const featuredWeekly = weekly.find((q) => !q.completed) ?? weekly[0]

  return (
    <div className="quest-widget">
      <div className="qw-header">
        <span className="qw-title">
          Daily Quests
          {claimableCount > 0 && <span className="qw-badge">{claimableCount}</span>}
        </span>
        <button className="qw-view-all" onClick={onViewAll}>View All</button>
      </div>

      <div className="qw-reset">
        <Icon name="clock" size={10} />
        Resets in {formatDuration(msUntilEndOfDay(new Date(now)))}
        <span className="qw-reset-count">{summary.completed}/{summary.total} done</span>
      </div>

      <div className="qw-list">
        {daily.length === 0 && <p className="qw-empty">New quests arrive at midnight.</p>}
        {daily.map((quest) => <QuestCard key={quest.id} quest={quest} variant="compact" />)}
      </div>

      {featuredWeekly && (
        <div className="qw-weekly">
          <div className="qw-weekly-label">This Week</div>
          <QuestCard quest={featuredWeekly} variant="compact" />
        </div>
      )}
    </div>
  )
}
