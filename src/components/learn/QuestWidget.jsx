/* ═══════════════════════════════════════════════════════════════════════════
   QuestWidget.jsx — DAILY QUEST SIDEBAR
   ---------------------------------------------------------------------------
   Reads the generated quest set for TODAY and the current week. Targets,
   progress, completion and claim state all come from the quest engine.

   Revision 2: the countdown's digits roll and its clock hand ticks; the
   claimable count pops; each quest row opens on hover/focus to show its
   reward and what is left (QuestCard compact).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import QuestCard from '../progression/QuestCard'
import { Icon } from '../progression/Icons'
import { msUntilEndOfDay, formatDuration } from '../../utils/dateUtils'
import RollingNumber from '../../motion/RollingNumber'
import { useQuestWidgetPreviews } from './previews'

export default function QuestWidget({ onViewAll, style, className = '' }) {
  const { vm } = useProgression()
  const now = useClock()
  const rootRef = useRef(null)
  const questsRef = useRef(null)
  questsRef.current = [...vm.quests.daily, ...vm.quests.weekly]
  useQuestWidgetPreviews(rootRef, () => questsRef.current)

  const { daily, weekly, summary, claimableCount } = vm.quests
  const featuredWeekly = weekly.find((q) => !q.completed) ?? weekly[0]

  return (
    <div className={`quest-widget ${className}`.trim()} style={style} ref={rootRef}>
      <div className="qw-header">
        <span className="qw-title">
          Daily Quests
          {claimableCount > 0 && (
            <span className="qw-badge" key={claimableCount} data-tip={`${claimableCount} reward${claimableCount === 1 ? '' : 's'} ready to claim`}>
              {claimableCount}
            </span>
          )}
        </span>
        <button className="qw-view-all" onClick={onViewAll}>
          View all
          <Icon name="chevron-right" size={12} strokeWidth={2.6} />
        </button>
      </div>

      <div className="qw-reset">
        <Icon name="clock" size={11} />
        Resets in <RollingNumber value={formatDuration(msUntilEndOfDay(new Date(now)))} />
        <span className="qw-reset-count">
          <RollingNumber value={summary.completed} />/{summary.total} done
        </span>
      </div>

      <div className="qw-list">
        {daily.length === 0 && <p className="qw-empty">New quests arrive at midnight.</p>}
        {daily.map((quest, i) => <QuestCard key={quest.id} quest={quest} variant="compact" index={i} />)}
      </div>

      {featuredWeekly && (
        <div className="qw-weekly">
          <div className="qw-weekly-label">This Week</div>
          <QuestCard quest={featuredWeekly} variant="compact" index={3} />
        </div>
      )}
    </div>
  )
}
