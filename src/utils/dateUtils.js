/* ═══════════════════════════════════════════════════════════════════════════
   dateUtils.js — LOCAL CALENDAR DATE HELPERS
   ---------------------------------------------------------------------------
   Streaks, daily quests and weekly quests are all CALENDAR based, never
   "24 hours since X". Every helper here works in the learner's own local
   timezone and represents a day as a "YYYY-MM-DD" string key.

   Why string keys: they are timezone-stable once produced, they sort
   lexicographically, they survive JSON round-trips and they cannot drift the
   way raw Date objects do.
   ═══════════════════════════════════════════════════════════════════════════ */

import { MISC } from '../config/progressionConfig'

const pad = (n) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" for a Date (or now), in LOCAL time. */
export function getLocalDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse "YYYY-MM-DD" into a local Date at midnight. Avoids the classic
 *  `new Date("2025-01-01")` UTC-parsing bug that shifts the day. */
export function parseDateKey(key) {
  if (typeof key !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export function isValidDateKey(key) {
  return parseDateKey(key) !== null
}

/** Whole calendar days from `fromKey` to `toKey`. Positive when `toKey` is later. */
export function getDaysBetween(fromKey, toKey) {
  const a = parseDateKey(fromKey)
  const b = parseDateKey(toKey)
  if (!a || !b) return null
  // Compare midnight-to-midnight, then round to absorb DST hour shifts.
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function isToday(key, now = new Date()) {
  return key === getLocalDateKey(now)
}

export function isYesterday(key, now = new Date()) {
  return getDaysBetween(key, getLocalDateKey(now)) === 1
}

/** Shift a date key by N days (negative goes backwards). */
export function addDays(key, days) {
  const d = parseDateKey(key)
  if (!d) return null
  d.setDate(d.getDate() + days)
  return getLocalDateKey(d)
}

/** The date key for the start of the week containing `date`.
 *  Week start is configurable (default Monday) and used as the weekly-quest
 *  boundary so weeklies always roll over at the same local moment. */
export function getWeekStartKey(date = new Date()) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  const start = MISC.WEEK_START_DAY
  const diff = (d.getDay() - start + 7) % 7
  d.setDate(d.getDate() - diff)
  return getLocalDateKey(d)
}

/** Stable identifier for the current week — the Monday's date key. */
export function getWeekKey(date = new Date()) {
  return getWeekStartKey(date)
}

/** The seven date keys of the week containing `date`, in display order. */
export function getWeekDays(date = new Date()) {
  const start = getWeekStartKey(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Short weekday initials matching getWeekDays() order. */
export function getWeekDayLabels() {
  const base = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const start = MISC.WEEK_START_DAY
  return Array.from({ length: 7 }, (_, i) => base[(start + i) % 7])
}

/** Milliseconds from `now` until the next local midnight. This is derived
 *  from the actual date boundary, never from a running countdown, so it is
 *  always correct after a refresh or a laptop sleeping overnight. */
export function msUntilEndOfDay(now = new Date()) {
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return Math.max(0, end.getTime() - now.getTime())
}

/** Milliseconds until the weekly boundary (next week-start midnight). */
export function msUntilEndOfWeek(now = new Date()) {
  const startKey = getWeekStartKey(now)
  const nextStart = parseDateKey(addDays(startKey, 7))
  return Math.max(0, nextStart.getTime() - now.getTime())
}

/** "5h 42m" / "3d 4h" / "48s" — compact human countdown. */
export function formatDuration(ms, { compact = true } = {}) {
  if (ms == null || ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return compact ? `${d}d ${h}h` : `${d} days ${h} hours`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return compact ? `${m}m` : `${m} min`
  return `${s}s`
}

/** "mm:ss" — used for the heart recovery countdown. */
export function formatClock(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** "Mon", "Tue"… for a date key. */
export function getShortWeekday(key) {
  const d = parseDateKey(key)
  return d ? d.toLocaleDateString(undefined, { weekday: 'short' }) : ''
}

/** "Sep 4" for a date key. */
export function getShortDate(key) {
  const d = parseDateKey(key)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
}
