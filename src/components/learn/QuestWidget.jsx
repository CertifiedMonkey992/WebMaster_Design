import { DAILY_QUESTS, WEEKLY_QUEST } from '../../data/learnData'

function QuestItem({ quest }) {
  const pct = Math.min(100, Math.round((quest.current / quest.total) * 100))
  return (
    <div className="qw-item">
      <span className="qw-icon" aria-hidden="true">{quest.icon}</span>
      <div className="qw-info">
        <div className="qw-label">{quest.label}</div>
        <div className="qw-track" role="progressbar" aria-valuenow={quest.current} aria-valuemin={0} aria-valuemax={quest.total}>
          <div className={`qw-fill${quest.done ? ' qw-fill-done' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={`qw-count${quest.done ? ' done' : ''}`}>
        {quest.done ? '✓' : `${quest.current}/${quest.total}`}
      </span>
    </div>
  )
}

export default function QuestWidget() {
  return (
    <div className="quest-widget">
      <div className="qw-header">
        <span className="qw-title">Today's Goals</span>
        <button className="qw-view-all">View All</button>
      </div>

      <div className="qw-list">
        {DAILY_QUESTS.map((q) => <QuestItem key={q.id} quest={q} />)}
      </div>

      <div className="qw-weekly">
        <div className="qw-weekly-label">This Week</div>
        <QuestItem quest={WEEKLY_QUEST} />
      </div>
    </div>
  )
}
