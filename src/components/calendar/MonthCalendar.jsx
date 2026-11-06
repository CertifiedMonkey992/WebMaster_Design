/* ═══════════════════════════════════════════════════════════════════════════
   MonthCalendar.jsx — A MONTH OF DATES
   ---------------------------------------------------------------------------
   One month as a grid of real dates, the week starting on the product's week
   start (progressionConfig → MISC.WEEK_START_DAY). Each day can carry a short
   summary, shown in its square; choosing a day hands its key to the parent,
   which shows the detail. Used by the streak panel (the learner's own
   activity) and the About page's work log (the project's history).

     <MonthCalendar
       days={{ '2026-11-04': { summary: '+40 XP', label: '40 XP earned' } }}
       selected={key} onSelect={setKey}
       today="2026-11-05" min="2026-08-31" max="2026-11-30"
       size="compact"        // 'full' (default) or 'compact' for a panel
       jump                  // a row of month buttons under the header
     />

   Keyboard: arrows move a day or a week, Page Up / Page Down a month, Home
   and End to the week's ends — selection follows, so the detail does too.
   Days outside `min`–`max` are shown but cannot be chosen.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import { MISC } from '../../config/progressionConfig'
import { addDays, parseDateKey } from '../../utils/dateUtils'
import './calendar.css'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const monthOf = (key) => key.slice(0, 7)
const firstOf = (month) => `${month}-01`
const shiftMonth = (month, n) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
/* The same day of the month in month `m`, held to that month's last day. */
const sameDayIn = (m, day) => {
  const [y, mo] = m.split('-').map(Number)
  return `${m}-${String(Math.min(day, new Date(y, mo, 0).getDate())).padStart(2, '0')}`
}
const monthName = (month, style = 'long') =>
  new Date(`${firstOf(month)}T00:00:00`).toLocaleDateString('en-US', { month: style, year: style === 'long' ? 'numeric' : undefined })
const longDate = (key) =>
  parseDateKey(key)?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) ?? key

/** Six weeks of keys covering `month`, starting on the week-start day. */
function weeksOf(month) {
  const first = parseDateKey(firstOf(month))
  const lead = ((first?.getDay() ?? 0) - MISC.WEEK_START_DAY + 7) % 7
  const start = addDays(firstOf(month), -lead)
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
}

export default function MonthCalendar({
  days = {}, selected = null, onSelect, today, min = null, max = null,
  size = 'full', jump = false, label = 'Calendar',
}) {
  const [month, setMonth] = useState(() => monthOf(selected ?? today ?? max ?? min))
  const [dir, setDir] = useState(0)
  const gridRef = useRef(null)
  const keyMoved = useRef(false)

  const minMonth = min ? monthOf(min) : null
  const maxMonth = max ? monthOf(max) : null
  const inRange = (key) => (!min || key >= min) && (!max || key <= max)
  const weeks = useMemo(() => weeksOf(month), [month])
  const weekdays = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(MISC.WEEK_START_DAY + i) % 7])

  const goMonth = (next) => {
    if ((minMonth && next < minMonth) || (maxMonth && next > maxMonth) || next === month) return
    setDir(next > month ? 1 : -1)
    setMonth(next)
  }

  /* A selection made elsewhere (or by the keyboard) brings its month along —
     adjusted while rendering, the way React asks for state that follows a prop. */
  const [followed, setFollowed] = useState(selected)
  if (selected !== followed) {
    setFollowed(selected)
    if (selected && monthOf(selected) !== month) {
      setDir(monthOf(selected) > month ? 1 : -1)
      setMonth(monthOf(selected))
    }
  }

  /* Focus follows a keyboard move once the right month is on screen. */
  useEffect(() => {
    if (!keyMoved.current || !selected) return
    keyMoved.current = false
    gridRef.current?.querySelector(`[data-date="${selected}"]`)?.focus()
  }, [selected, month])

  const choose = (key) => {
    if (!inRange(key)) return
    onSelect?.(key)
  }

  /* The one day in the tab order: the selection if it is on this page, else
     today, else the first of the month. */
  const visible = (key) => monthOf(key) === month
  const focusKey = [selected, today, firstOf(month)].find((k) => k && visible(k) && inRange(k))
    ?? weeks.flat().find((k) => visible(k) && inRange(k))

  const onKeyDown = (e) => {
    const from = e.target.dataset?.date
    if (!from) return
    const dow = (parseDateKey(from).getDay() - MISC.WEEK_START_DAY + 7) % 7
    const moves = {
      ArrowLeft: () => addDays(from, -1),
      ArrowRight: () => addDays(from, 1),
      ArrowUp: () => addDays(from, -7),
      ArrowDown: () => addDays(from, 7),
      Home: () => addDays(from, -dow),
      End: () => addDays(from, 6 - dow),
      PageUp: () => sameDayIn(shiftMonth(monthOf(from), -1), Number(from.slice(8))),
      PageDown: () => sameDayIn(shiftMonth(monthOf(from), 1), Number(from.slice(8))),
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    const to = move()
    if (!to || !inRange(to)) return
    keyMoved.current = true
    choose(to)
  }

  const compact = size === 'compact'
  const jumpMonths = useMemo(() => {
    if (!jump || !minMonth || !maxMonth) return []
    const out = []
    for (let m = minMonth; m <= maxMonth; m = shiftMonth(m, 1)) out.push(m)
    return out
  }, [jump, minMonth, maxMonth])
  const countIn = (m) => Object.keys(days).filter((k) => monthOf(k) === m).length

  return (
    <div className={`cal cal--${size}`}>
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => goMonth(shiftMonth(month, -1))}
          disabled={minMonth != null && month <= minMonth} aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h3 className="cal-title" aria-live="polite">{monthName(month)}</h3>
        <button type="button" className="cal-nav" onClick={() => goMonth(shiftMonth(month, 1))}
          disabled={maxMonth != null && month >= maxMonth} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {jumpMonths.length > 1 && (
        <div className="cal-jump" role="group" aria-label="Months">
          {jumpMonths.map((m) => (
            <button key={m} type="button" className={`cal-jump-btn${m === month ? ' is-on' : ''}`}
              aria-pressed={m === month} onClick={() => goMonth(m)}>
              {monthName(m, 'short')}
              <span className="cal-jump-count tnum">{countIn(m)}</span>
            </button>
          ))}
        </div>
      )}

      <table className="cal-grid" ref={gridRef} aria-label={`${label}, ${monthName(month)}`} onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {weekdays.map((d) => (
              <th key={d} scope="col" abbr={d}>{compact ? d[0] : d.slice(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody key={month} className="cal-body" style={{ '--cal-dir': dir }}>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((key) => {
                const day = days[key]
                const outside = !visible(key)
                const enabled = inRange(key)
                const cls = [
                  'cal-day',
                  day ? 'has-entry' : '',
                  day?.tone ? `is-${day.tone}` : '',
                  outside ? 'is-outside' : '',
                  key === today ? 'is-today' : '',
                  key === selected ? 'is-selected' : '',
                  today && key > today ? 'is-future' : '',
                ].filter(Boolean).join(' ')
                return (
                  <td key={key}>
                    <button
                      type="button"
                      className={cls}
                      data-date={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      disabled={!enabled}
                      aria-pressed={key === selected}
                      aria-current={key === today ? 'date' : undefined}
                      aria-label={`${longDate(key)}${day?.label ? ` — ${day.label}` : ''}`}
                      onClick={() => choose(key)}
                    >
                      <span className="cal-num tnum">{Number(key.slice(8))}</span>
                      {day?.summary && <span className="cal-sum" aria-hidden="true">{day.summary}</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { longDate }
