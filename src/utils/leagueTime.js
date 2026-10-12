/* ═══════════════════════════════════════════════════════════════════════════
   leagueTime.js — WEEKS IN SOMEONE ELSE'S TIME ZONE
   ---------------------------------------------------------------------------
   A league week starts on Sunday in the leaderboard's own time zone
   (config/leagueConfig.js → LEAGUE.WEEK_START_DAY). The server decides every
   boundary with these functions and its own clock; the app uses them only to
   print "ends Sunday, 12:00 AM" in the reader's time.

   dateUtils.js works in the PROCESS's local time, which is right for the
   learner's own streak and quests in their browser and wrong on a server
   that serves every time zone at once. These take an IANA zone name and do
   the arithmetic with Intl, so a Sunday in Sydney and a Sunday in Los Angeles
   are each computed where they happen — daylight-saving changes included.
   ═══════════════════════════════════════════════════════════════════════════ */

const DAY_MS = 86400000

/** @type {Map<string, Intl.DateTimeFormat>} */
const formats = new Map()

/** @param {string} timeZone */
function formatterFor(timeZone) {
  let f = formats.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'short',
    })
    formats.set(timeZone, f)
  }
  return f
}

/** Is this a time zone name the runtime knows?
 *  @param {unknown} timeZone */
export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 64) return false
  try {
    formatterFor(timeZone)
    return true
  } catch {
    return false
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * The wall-clock reading of an instant in a time zone.
 * @param {string} timeZone
 * @param {number} t  epoch milliseconds
 * @returns {{ y: number, m: number, d: number, hh: number, mm: number, ss: number, dow: number }}
 */
export function localParts(timeZone, t) {
  /** @type {Record<string, string>} */
  const p = {}
  for (const part of formatterFor(timeZone).formatToParts(new Date(t))) p[part.type] = part.value
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    hh: Number(p.hour) % 24,
    mm: Number(p.minute),
    ss: Number(p.second),
    dow: Math.max(0, WEEKDAYS.indexOf(p.weekday)),
  }
}

/** Minutes the zone is ahead of UTC at an instant (negative west of it).
 *  @param {string} timeZone @param {number} t */
export function offsetMinutes(timeZone, t) {
  const p = localParts(timeZone, t)
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss)
  return Math.round((asUtc - Math.floor(t / 1000) * 1000) / 60000)
}

/**
 * The instant at which a wall-clock time happens in a zone. In the hour a
 * clock skips (spring forward) the result lands just after the gap; in the
 * hour it repeats, on the first of the two.
 * @param {string} timeZone
 * @param {number} y @param {number} m @param {number} d
 * @param {number} [hh] @param {number} [mm]
 */
export function zonedToUtc(timeZone, y, m, d, hh = 0, mm = 0) {
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  let guess = wall - offsetMinutes(timeZone, wall) * 60000
  for (let i = 0; i < 3; i++) {
    const next = wall - offsetMinutes(timeZone, guess) * 60000
    if (next === guess) break
    guess = next
  }
  return guess
}

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" for a calendar date.
 *  @param {{ y: number, m: number, d: number }} date */
export const ymdKey = (date) => `${date.y}-${pad(date.m)}-${pad(date.d)}`

/** A calendar date moved by whole days (calendar arithmetic, no zone).
 *  @param {{ y: number, m: number, d: number }} date @param {number} days */
export function addCalendarDays(date, days) {
  const t = Date.UTC(date.y, date.m - 1, date.d) + days * DAY_MS
  const u = new Date(t)
  return { y: u.getUTCFullYear(), m: u.getUTCMonth() + 1, d: u.getUTCDate() }
}

/** Parse "YYYY-MM-DD".
 *  @param {string} key @returns {{ y: number, m: number, d: number } | null} */
export function parseYmd(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key ?? ''))
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

/** The local calendar date of an instant in a zone, as "YYYY-MM-DD".
 *  @param {string} timeZone @param {number} t */
export function dayKeyIn(timeZone, t) {
  return ymdKey(localParts(timeZone, t))
}

/**
 * The league week containing an instant, in a zone: from the start day and
 * hour to the same moment seven days later. `weekId` is the start date, so
 * the same calendar week has the same id in every zone.
 * @param {string} timeZone
 * @param {number} t
 * @param {{ startDay?: number, startHour?: number }} [opts]
 * @returns {{ weekId: string, start: number, end: number }}
 */
export function weekWindow(timeZone, t, { startDay = 0, startHour = 0 } = {}) {
  const p = localParts(timeZone, t)
  let back = (p.dow - startDay + 7) % 7
  if (back === 0 && p.hh < startHour) back = 7
  const startDate = addCalendarDays(p, -back)
  const endDate = addCalendarDays(startDate, 7)
  return {
    weekId: ymdKey(startDate),
    start: zonedToUtc(timeZone, startDate.y, startDate.m, startDate.d, startHour),
    end: zonedToUtc(timeZone, endDate.y, endDate.m, endDate.d, startHour),
  }
}

/**
 * The window of a given week id in a zone (the week that starts that day).
 * @param {string} timeZone
 * @param {string} weekId
 * @param {{ startHour?: number }} [opts]
 */
export function windowOfWeek(timeZone, weekId, { startHour = 0 } = {}) {
  const date = parseYmd(weekId)
  if (!date) return null
  const endDate = addCalendarDays(date, 7)
  return {
    weekId,
    start: zonedToUtc(timeZone, date.y, date.m, date.d, startHour),
    end: zonedToUtc(timeZone, endDate.y, endDate.m, endDate.d, startHour),
  }
}

/** The id of the week `n` weeks after `weekId`.
 *  @param {string} weekId @param {number} n */
export function shiftWeek(weekId, n) {
  const date = parseYmd(weekId)
  return date ? ymdKey(addCalendarDays(date, 7 * n)) : weekId
}

export default {
  isValidTimeZone, localParts, offsetMinutes, zonedToUtc, ymdKey, addCalendarDays,
  parseYmd, dayKeyIn, weekWindow, windowOfWeek, shiftWeek,
}
