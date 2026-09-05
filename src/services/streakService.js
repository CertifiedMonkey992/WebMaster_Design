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
import { SHIELD } from '../config/shopConfig'
import { getLocalDateKey, getDaysBetween, addDays } from '../utils/dateUtils'

/** Activities that count toward a streak. Opening the site does NOT. */
export const QUALIFYING_ACTIVITIES = ['lesson', 'practice']

export function isQualifyingActivity(kind) {
  return QUALIFYING_ACTIVITIES.includes(kind)
}

/* ── Streak shields ──────────────────────────────────────────────────────────
   A shield bridges a missed day so the streak survives. Two rules keep a long
   absence from quietly draining the whole stock:

     1. The gap must be small enough for ONE shield to cover it
        (SHIELD.COVERS_MISSED_DAYS). A three-day disappearance is a real
        break, not something to spend three shields on.

     2. A shield may only be spent once the learner has actually come back
        since the last one was spent. Without this, an app left open across a
        week would burn a shield every midnight: each rescue advances the
        streak marker by a day, which makes the NEXT day look like a fresh
        single-day gap. Comparing the last recorded activity against the last
        rescued day is what tells the two situations apart.
   ─────────────────────────────────────────────────────────────────────────── */

/** Can one shield rescue this gap right now? Pure predicate, no side effects. */
export function canConsumeShield(streak, gapDays) {
  if ((streak.shields ?? 0) <= 0) return false
  /* gap counts days since the last streak day, so a gap of N leaves N-1 missed days. */
  if (gapDays - 1 > SHIELD.COVERS_MISSED_DAYS) return false
  if (SHIELD.ALLOW_CONSECUTIVE_USE) return true

  const lastRescued = streak.lastShieldDate
  if (!lastRescued) return true
  /* The learner must have logged activity on or after the day we last rescued. */
  return Boolean(streak.lastActivityDate) && streak.lastActivityDate >= lastRescued
}

/**
 * Spend one shield to cover the day after `lastStreakDate`, advancing the
 * streak marker across it so the streak reads as unbroken.
 */
function consumeShield(streak) {
  const rescuedDay = addDays(streak.lastStreakDate, 1)
  return {
    ...streak,
    shields: streak.shields - 1,
    lastStreakDate: rescuedDay,
    lastShieldDate: rescuedDay,
    shieldsUsed: (streak.shieldsUsed ?? 0) + 1,
  }
}

/**
 * Reconcile a stored streak against today's date, WITHOUT recording activity.
 * Run on every load and at every midnight rollover so a broken streak shows
 * as broken the moment the learner returns.
 *
 * A streak survives while the last counted day is today or yesterday. One
 * fully missed day ends it — unless a Streak Shield is available and eligible.
 */
export function reconcileStreak(state, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const last = state.streak.lastStreakDate
  const events = []

  if (!last || state.streak.current === 0) return { state, events }

  const gap = getDaysBetween(last, today)
  if (gap === null || gap <= 1) return { state, events }   // today or yesterday → alive

  if (canConsumeShield(state.streak, gap)) {
    const streak = consumeShield(state.streak)
    events.push({
      type: 'STREAK_SHIELD_USED',
      remaining: streak.shields,
      streak: streak.current,
      rescuedDate: streak.lastShieldDate,
    })
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
  let prev = state.streak
  const wasStreak = prev.current

  /* Already counted today — record the activity date but never double-count. */
  if (prev.lastStreakDate === today) {
    if (prev.lastActivityDate === today) return { state, events }
    return {
      state: { ...state, streak: { ...prev, lastActivityDate: today } },
      events,
    }
  }

  /* Returning after a gap: give a shield its one chance to bridge the missed
     day before the streak is evaluated. reconcileStreak usually gets here
     first, in which case the marker is already advanced and this is a no-op. */
  const gap = prev.lastStreakDate ? getDaysBetween(prev.lastStreakDate, today) : null
  if (gap !== null && gap > 1 && prev.current > 0 && canConsumeShield(prev, gap)) {
    prev = consumeShield(prev)
    events.push({
      type: 'STREAK_SHIELD_USED',
      remaining: prev.shields,
      streak: prev.current,
      rescuedDate: prev.lastShieldDate,
    })
  }

  let next
  if (!prev.lastStreakDate || prev.current === 0) {
    next = 1
  } else {
    const settled = getDaysBetween(prev.lastStreakDate, today)
    if (settled === 1) next = prev.current + 1
    else if (settled === 0) next = prev.current      // defensive: same day
    else next = 1
  }

  const streak = {
    ...prev,
    current: next,
    longest: Math.max(prev.longest, next),
    lastActivityDate: today,
    lastStreakDate: today,
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

/** Add shields to the bank, capped at the stock limit. The shop calls this so
 *  it never has to know how the streak engine stores things. */
export function grantShield(state, count = 1) {
  const shields = Math.min(SHIELD.MAX_OWNED, state.streak.shields + Math.max(1, Math.floor(count)))
  return { ...state, streak: { ...state.streak, shields } }
}

/** True when the bank is full — the shop disables the buy button on this. */
export function hasMaxShields(state) {
  return state.streak.shields >= SHIELD.MAX_OWNED
}

export default {
  updateStreak, reconcileStreak, recordHistory, hasActivityToday,
  getNextMilestone, getActivityMap, grantShield, hasMaxShields,
  canConsumeShield, isQualifyingActivity,
}
