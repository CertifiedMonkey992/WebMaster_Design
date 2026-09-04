/* ═══════════════════════════════════════════════════════════════════════════
   streakService.js — CALENDAR-DAY STREAK ENGINE
   ---------------------------------------------------------------------------
   A streak counts CONSECUTIVE LOCAL CALENDAR DAYS on which the learner did at
   least one qualifying activity (finishing a lesson or a practice session).

   Explicitly NOT "24 hours since last activity": activity at 11:59 PM and
   again at 12:01 AM is two consecutive days, exactly as a learner expects.

   Every function here is pure — `(state, …) => { state, events }` — which makes
   the rules deterministic and directly testable.
   ═══════════════════════════════════════════════════════════════════════════ */

import { STREAK } from '../config/progressionConfig'
import { getLocalDateKey, getDaysBetween, addDays } from '../utils/dateUtils'

/** Activities that count toward a streak. Opening the site does NOT. */
export const QUALIFYING_ACTIVITIES = ['lesson', 'practice']

export function isQualifyingActivity(kind) {
  return QUALIFYING_ACTIVITIES.includes(kind)
}

/**
 * Reconcile a stored streak against today's date, WITHOUT recording activity.
 * Run on every load and at every midnight rollover so a broken streak shows
 * as broken the moment the learner returns.
 *
 * A streak survives while the last counted day is today or yesterday. One
 * fully missed day ends it — unless a streak freeze is available (feature
 * flagged off by default, but the machinery is live).
 */
export function reconcileStreak(state, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const last = state.streak.lastStreakDate
  const events = []

  if (!last || state.streak.current === 0) return { state, events }

  const gap = getDaysBetween(last, today)
  if (gap === null || gap <= 1) return { state, events }   // today or yesterday → alive

  /* Exactly one missed day and a freeze in the bank → spend it and keep the
     streak alive by advancing the marker over the missed day. */
  if (STREAK.FREEZE_ENABLED && gap === 2 && state.streak.freezes > 0) {
    const streak = {
      ...state.streak,
      freezes: state.streak.freezes - 1,
      lastStreakDate: addDays(last, 1),
    }
    events.push({ type: 'STREAK_FROZEN', remaining: streak.freezes })
    return { state: { ...state, streak }, events }
  }

  events.push({ type: 'STREAK_LOST', previous: state.streak.current })
  return {
    state: { ...state, streak: { ...state.streak, current: 0 } },
    events,
  }
}

/**
 * Record a qualifying activity for today and advance the streak.
 *
 *   no previous activity          → streak = 1
 *   already counted today         → unchanged (idempotent)
 *   last counted day = yesterday  → streak + 1
 *   last counted day older        → streak = 1
 */
export function updateStreak(state, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const events = []
  const prev = state.streak
  const wasStreak = prev.current

  /* Already counted today — record the activity date but never double-count. */
  if (prev.lastStreakDate === today) {
    if (prev.lastActivityDate === today) return { state, events }
    return {
      state: { ...state, streak: { ...prev, lastActivityDate: today } },
      events,
    }
  }

  let next
  if (!prev.lastStreakDate || prev.current === 0) {
    next = 1
  } else {
    const gap = getDaysBetween(prev.lastStreakDate, today)
    if (gap === 1) next = prev.current + 1
    else if (gap === 0) next = prev.current          // defensive: same day
    else if (STREAK.FREEZE_ENABLED && gap === 2 && prev.freezes > 0) next = prev.current + 1
    else next = 1
  }

  const usedFreeze =
    STREAK.FREEZE_ENABLED &&
    prev.lastStreakDate &&
    getDaysBetween(prev.lastStreakDate, today) === 2 &&
    prev.freezes > 0

  const streak = {
    ...prev,
    current: next,
    longest: Math.max(prev.longest, next),
    lastActivityDate: today,
    lastStreakDate: today,
    freezes: usedFreeze ? prev.freezes - 1 : prev.freezes,
  }

  const isNewDay = next !== wasStreak || wasStreak === 0
  if (isNewDay) {
    events.push({ type: 'STREAK_UPDATED', streak: next, previous: wasStreak, extended: next > wasStreak })
  }
  if (next > prev.longest) {
    events.push({ type: 'STREAK_RECORD', streak: next })
  }

  const milestone = STREAK.MILESTONES.includes(next) ? next : null
  if (milestone) {
    events.push({
      type: 'STREAK_MILESTONE',
      streak: next,
      gems: STREAK.MILESTONE_GEMS[next] ?? 0,
    })
  }

  return { state: { ...state, streak }, events }
}

/** Record per-day activity so the streak calendar can show real history. */
export function recordHistory(state, { xp = 0, lessons = 0, seconds = 0 } = {}, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const prev = state.streak.history?.[today] ?? { xp: 0, lessons: 0, seconds: 0 }
  const history = {
    ...state.streak.history,
    [today]: {
      xp: prev.xp + xp,
      lessons: prev.lessons + lessons,
      seconds: prev.seconds + seconds,
    },
  }
  return { ...state, streak: { ...state.streak, history: trimHistory(history, now) } }
}

/** Keep the history map bounded so storage never grows without limit. */
function trimHistory(history, now = Date.now()) {
  const cutoff = addDays(getLocalDateKey(new Date(now)), -STREAK.HISTORY_DAYS)
  const out = {}
  for (const [key, value] of Object.entries(history)) {
    if (key >= cutoff) out[key] = value
  }
  return out
}

/** True when the learner has already done something that counts today. */
export function hasActivityToday(state, now = Date.now()) {
  return state.streak.lastActivityDate === getLocalDateKey(new Date(now))
}

/** The next streak milestone and how far away it is. */
export function getNextMilestone(currentStreak) {
  const next = STREAK.MILESTONES.find((m) => m > currentStreak)
  if (!next) return null
  return { target: next, remaining: next - currentStreak, gems: STREAK.MILESTONE_GEMS[next] ?? 0 }
}

/** Activity flags for a list of date keys — powers the week calendar. */
export function getActivityMap(state, dateKeys) {
  const history = state.streak.history ?? {}
  return dateKeys.map((key) => {
    const entry = history[key]
    return {
      dateKey: key,
      active: !!entry && (entry.lessons > 0 || entry.xp > 0 || entry.seconds > 0),
      xp: entry?.xp ?? 0,
      lessons: entry?.lessons ?? 0,
      seconds: entry?.seconds ?? 0,
    }
  })
}

/** Grant a streak freeze (future shop item). Kept here so the shop never has
 *  to know how the streak engine stores things. */
export function grantFreeze(state, count = 1) {
  const freezes = Math.min(STREAK.MAX_FREEZES, state.streak.freezes + count)
  return { ...state, streak: { ...state.streak, freezes } }
}

export default {
  updateStreak, reconcileStreak, recordHistory, hasActivityToday,
  getNextMilestone, getActivityMap, grantFreeze, isQualifyingActivity,
}
