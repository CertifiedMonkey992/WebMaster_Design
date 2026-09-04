/* ═══════════════════════════════════════════════════════════════════════════
   StreakPanel.jsx — STREAK DETAIL, WEEK CALENDAR AND NEXT MILESTONE
   ---------------------------------------------------------------------------
   The calendar reads the real per-day activity history recorded by
   streakService, so a tick mark means the learner genuinely did something
   that day — not that the app happened to be open.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, useClock } from '../../state/ProgressionContext'
import { FlameIcon, Icon } from './Icons'
import { getActivityMap } from '../../services/streakService'
import {
  getWeekDays, getWeekDayLabels, getLocalDateKey,
  msUntilEndOfDay, formatDuration,
} from '../../utils/dateUtils'

export default function StreakPanel() {
  const { state, vm } = useProgression()
  const now = useClock()

  const today = getLocalDateKey(new Date(now))
  const week = getWeekDays(new Date(now))
  const labels = getWeekDayLabels()
  const activity = getActivityMap(state, week)
  const milestone = vm.nextMilestone

  return (
    <div className="pg-panel">
      <div className="pg-streak-hero">
        <FlameIcon size={40} className={`pg-streak-hero-icon${vm.streak > 0 ? ' is-lit' : ''}`} dim={vm.streak === 0} />
        <div>
          <div className="pg-streak-hero-value">
            {vm.streak} <span>day{vm.streak === 1 ? '' : 's'}</span>
          </div>
          <div className="pg-streak-hero-label">
            {vm.streak === 0
              ? 'Finish a lesson to start your streak'
              : vm.activeToday
                ? 'Locked in for today — nice work'
                : 'Learn today to keep it alive'}
          </div>
        </div>
      </div>

      {/* ── This week ── */}
      <div className="pg-week">
        <div className="pg-week-head">
          <span>This week</span>
          {!vm.activeToday && (
            <span className="pg-week-timer">
              <Icon name="clock" size={11} /> {formatDuration(msUntilEndOfDay(new Date(now)))} left
            </span>
          )}
        </div>
        <div className="pg-week-grid">
          {week.map((dateKey, i) => {
            const day = activity[i]
            const isToday = dateKey === today
            const isFuture = dateKey > today
            return (
              <div
                key={dateKey}
                className={[
                  'pg-day',
                  day.active ? 'is-active' : '',
                  isToday ? 'is-today' : '',
                  isFuture ? 'is-future' : '',
                ].join(' ')}
                title={`${dateKey}${day.active ? ` — ${day.xp} XP` : ''}`}
              >
                <span className="pg-day-label">{labels[i]}</span>
                <span className="pg-day-dot">
                  {day.active
                    ? <Icon name="check" size={12} strokeWidth={3} />
                    : <span className="pg-day-empty" />}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Milestone ── */}
      {milestone && (
        <div className="pg-milestone">
          <div className="pg-milestone-head">
            <span className="pg-subhead">Next milestone</span>
            <span className="pg-milestone-reward">+{milestone.gems} gems</span>
          </div>
          <div className="pg-milestone-row">
            <FlameIcon size={16} />
            <strong>{milestone.target} days</strong>
            <span className="pg-milestone-remaining">
              {milestone.remaining} day{milestone.remaining === 1 ? '' : 's'} to go
            </span>
          </div>
          <div className="pg-milestone-track">
            <div
              className="pg-milestone-fill"
              style={{ width: `${Math.round((vm.streak / milestone.target) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="pg-panel-facts">
        <div className="pg-fact">
          <span className="pg-fact-label">Longest streak</span>
          <span className="pg-fact-value">
            {vm.longestStreak} day{vm.longestStreak === 1 ? '' : 's'}
          </span>
        </div>
        <div className="pg-fact">
          <span className="pg-fact-label">Days active</span>
          <span className="pg-fact-value">{state.stats.daysActive}</span>
        </div>
      </div>

      <p className="pg-panel-note">
        A day counts once you finish a lesson or a practice session. Simply opening
        LunX doesn’t extend a streak.
      </p>
    </div>
  )
}
