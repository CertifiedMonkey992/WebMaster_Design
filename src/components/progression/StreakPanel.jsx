/* ═══════════════════════════════════════════════════════════════════════════
   StreakPanel.jsx — STREAK DETAIL, WEEK CALENDAR AND MILESTONE PATH
   ---------------------------------------------------------------------------
   The calendar reads the real per-day activity history, so a tick means the
   learner genuinely did something that day.

   Revision 4 (idle life): embers leave the hero flame; a warm sheen runs
   across the ticked days and the squares hop in turn; a spark walks from
   today's streak to the next milestone stone; a banked shield catches the
   light.

   Revision 2:
     · the flame is alive, and the number rolls
     · the week's days are dealt in; today, unfinished, pings; each day's
       tooltip gives what was earned
     · milestones are a PATH — stones at 3 / 7 / 14 / 30… with a flame marker
       standing at today's streak and the next stone's reward in its tooltip
     · a banked Streak Shield stands guard with its count shown as pips
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, useClock } from '../../state/ProgressionContext'
import { FlameIcon, ShieldIcon, Icon } from './Icons'
import { LiveFlame } from './LiveIcons'
import RollingNumber from '../../motion/RollingNumber'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'
import { getActivityMap } from '../../services/streakService'
import { STREAK } from '../../config/progressionConfig'
import {
  getWeekDays, getWeekDayLabels, getLocalDateKey, getShortDate,
  msUntilEndOfDay, formatDuration,
} from '../../utils/dateUtils'

function milestoneWindow(streak) {
  const all = STREAK.MILESTONES
  const nextIdx = all.findIndex((m) => m > streak)
  if (nextIdx === -1) return all.slice(-4)
  const start = Math.max(0, nextIdx - 1)
  return all.slice(start, start + 4)
}

export default function StreakPanel({ onOpenShop }) {
  const { state, vm } = useProgression()
  const now = useClock()

  const today = getLocalDateKey(new Date(now))
  const week = getWeekDays(new Date(now))
  const labels = getWeekDayLabels()
  const activity = getActivityMap(state, week)
  const milestone = vm.nextMilestone

  /* Stones sit evenly along the path (a path of stops, not a ruler), and a
     streak between two stones is placed proportionally between them. */
  const stones = milestoneWindow(vm.streak)
  const stops = [stones[0] > 3 ? Math.max(0, stones[0] - (stones[1] - stones[0])) : 0, ...stones]
  const at = (v) => {
    const last = stops.length - 1
    if (v <= stops[0]) return '0%'
    if (v >= stops[last]) return '100%'
    let k = 0
    while (k < last - 1 && v > stops[k + 1]) k++
    const t = (v - stops[k]) / (stops[k + 1] - stops[k])
    return `${(((k + t) / last) * 100).toFixed(2)}%`
  }

  return (
    <div className="pg-panel">
      <div className={`pg-streak-hero${vm.streak > 0 ? ' is-lit' : ''}`}>
        <span className="pg-streak-hero-icon fx-flare-host" tabIndex={-1}>
          <LiveFlame streak={vm.streak} activeToday={vm.activeToday} shields={0} size={44} showShield={false} />
        </span>
        <div>
          <div className="pg-streak-hero-value">
            <RollingNumber value={vm.streak} /> <span>day{vm.streak === 1 ? '' : 's'}</span>
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
      <div className={`pg-week${vm.streak > 0 ? ' is-running' : ''}`}>
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
            const tip = isFuture
              ? `${getShortDate(dateKey)} · still to come`
              : day.active
                ? `${getShortDate(dateKey)} · ${day.xp} XP earned`
                : isToday
                  ? `Today · finish a lesson to tick it`
                  : `${getShortDate(dateKey)} · no activity`
            return (
              <div
                key={dateKey}
                className={[
                  'pg-day',
                  day.active ? 'is-active' : '',
                  isToday ? 'is-today' : '',
                  isFuture ? 'is-future' : '',
                ].join(' ')}
                style={{ '--i': i }}
                data-tip={tip}
              >
                <span className="pg-day-label">{labels[i]}</span>
                <span className={`pg-day-dot${isToday && !day.active ? ' fx-ping' : ''}${day.active ? ' is-drawing' : ''}`}>
                  {day.active
                    ? <Icon name="check" size={12} strokeWidth={3} />
                    : <span className="pg-day-empty" />}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Milestone path ── */}
      {milestone && (
        <div className="pg-milestone">
          <div className="pg-milestone-head">
            <span className="pg-subhead">Next milestone</span>
            <span className="pg-milestone-reward">
              {milestone.remaining} day{milestone.remaining === 1 ? '' : 's'} to +{milestone.gems} gems
            </span>
          </div>
          <div className="pg-path" role="img" aria-label={`${vm.streak} days, next milestone at ${milestone.target}`}>
            <span className="pg-path-track" />
            <span className="pg-path-fill" style={{ width: at(vm.streak) }} />
            {/* Invitation: a spark walks from where you are to the next stone. */}
            {vm.streak < milestone.target && (
              <span
                className="fx-walk pg-path-walk"
                style={{ left: at(vm.streak), width: `calc(${at(milestone.target)} - ${at(vm.streak)})` }}
                aria-hidden="true"
              >
                <i />
              </span>
            )}
            {stones.map((m) => (
              <span
                key={m}
                className={`pg-stone${vm.streak >= m ? ' is-reached' : ''}${m === milestone.target ? ' is-next' : ''}`}
                style={{ left: at(m) }}
                data-tip={`${m} days · +${STREAK.MILESTONE_GEMS[m]} gems${vm.streak >= m ? ' · reached' : ''}`}
              >
                <span className="pg-stone-dot" />
                <span className="pg-stone-label">{m}</span>
              </span>
            ))}
            <span className="pg-path-marker" style={{ left: at(vm.streak) }} aria-hidden="true">
              <FlameIcon size={16} dim={vm.streak === 0} />
            </span>
          </div>
        </div>
      )}

      {/* ── Shields ── */}
      <div className={`pg-shields${vm.shields > 0 ? ' is-stocked' : ''}`}>
        <span className={`pg-shields-icon${vm.shields > 0 ? ' fx-gleam' : ''}`} aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <div className="pg-shields-text">
          <span className="pg-shields-count">
            <RollingNumber value={vm.shields} /> Streak Shield{vm.shields === 1 ? '' : 's'}
            <span className="pg-shield-pips" aria-hidden="true">
              {Array.from({ length: vm.maxShields }, (_, i) => (
                <i key={i} className={i < vm.shields ? 'is-on' : ''} />
              ))}
            </span>
          </span>
          <span className="pg-shields-note">
            {vm.shields > 0
              ? 'One is spent automatically if you miss a day.'
              : 'Buy one in the shop to cover a missed day.'}
          </span>
        </div>
        {onOpenShop && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onOpenShop}>
            {vm.shields > 0 ? 'Shop' : 'Get one'}
          </button>
        )}
      </div>

      <div className="pg-panel-facts">
        <div className="pg-fact" data-tip="Your best run so far">
          <span className="pg-fact-label">Longest streak</span>
          <span className="pg-fact-value">
            {vm.longestStreak} day{vm.longestStreak === 1 ? '' : 's'}
          </span>
        </div>
        <div className="pg-fact" data-tip="Every day you finished something">
          <span className="pg-fact-label">Days active</span>
          <span className="pg-fact-value">{state.stats.daysActive}</span>
        </div>
      </div>

      <p className="pg-panel-note">
        A day counts once you finish a lesson or a practice session. Simply opening
        LunX doesn’t extend a streak.
      </p>

      {/* Reviewer only. A streak set here writes the days behind it, so the
          calendar above and the milestones below agree with the number. */}
      <JudgeMargin className="pg-judge-margin" label="Reviewer streak controls">
        <JudgeChip op={OPS.STREAK} payload={{ days: 7 }} icon="flame" label="7 days" tip="Crosses the one-week milestone" />
        <JudgeChip op={OPS.STREAK} payload={{ days: 30 }} icon="flame" label="30 days" tip="Crosses the one-month milestone" />
        <JudgeChip op={OPS.STREAK} payload={{ days: 0 }} icon="flame" label="Break it" quiet tip="See the lost-streak state and the flame go out" />
        <JudgeChip op={OPS.SHIELDS} payload={{ count: 2 }} icon="shield" label="Bank shields" tip="A shield covers a missed day automatically" />
      </JudgeMargin>
    </div>
  )
}
