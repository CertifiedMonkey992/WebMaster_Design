/* ═══════════════════════════════════════════════════════════════════════════
   RollingNumber.jsx — THE ODOMETER
   ---------------------------------------------------------------------------
   Every live figure in LunX is a row of digit columns. When the value
   changes, each column travels to its new digit — up when the number rose,
   down when it fell — staggered right to left, the way a mechanical counter
   carries.

   Columns are keyed by their position from the RIGHT, so "9" → "10" keeps the
   ones column in place and adds a tens column rather than re-mounting both.

   Never rolls on first render: a value that was already 12 when the page
   loaded did not just become 12. The accessible text is the plain value.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function RollingNumber({ value, format, className = '', ...rest }) {
  const text = format ? format(value) : String(value ?? '')
  const prev = useRef(value)
  const [dir, setDir] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const before = prev.current
    prev.current = value
    if (before === value || typeof value !== 'number' || typeof before !== 'number') return undefined
    setDir(value > before ? 'up' : 'down')
    const t = window.setTimeout(() => setDir(null), 700)
    return () => clearTimeout(t)
  }, [value])

  const chars = text.split('')
  const n = chars.length

  return (
    <span
      {...rest}
      className={`rn${mounted ? ' is-live' : ''}${dir ? ` rn--${dir}` : ''} ${className}`.trim()}
    >
      <span className="pg-sr-only">{text}</span>
      <span className="rn-track" aria-hidden="true">
        {chars.map((ch, i) => {
          const fromRight = n - 1 - i
          if (!DIGITS.includes(ch)) {
            return <span className="rn-sym" key={`s${fromRight}`} data-d={ch} />
          }
          const d = Number(ch)
          /* The ghost glyph stays in flow so the column keeps the real
             digit's width AND baseline; the rolling strip is clipped over it
             by an absolutely-positioned window. (overflow:hidden on the
             column itself would move its baseline to the bottom edge and
             knock every figure out of line with the text beside it.) */
          /* Digits are drawn with generated content (data-d → ::before), so
             the strip is not real text: copy, find-in-page and innerText see
             the value once, from the sr-only span, not "0123456789". */
          return (
            <span className="rn-col" key={`d${fromRight}`} style={{ '--c': fromRight }}>
              <span className="rn-ghost" data-d={ch} />
              <span className="rn-clip">
                <span className="rn-strip" style={{ transform: `translateY(${-d * 10}%)` }}>
                  {DIGITS.map((g) => <span className="rn-digit" key={g} data-d={g} />)}
                </span>
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
