/* ═══════════════════════════════════════════════════════════════════════════
   CountUp.jsx — A FIGURE BEING TALLIED
   ---------------------------------------------------------------------------
   Counts from `from` to `value` the first time it is seen, easing out so the
   last few units tick slowly — a tally finishing, not a timer. Used for
   figures that are *read* on arrival (landing stats, lesson rewards, lifetime
   totals). Live values that change while you watch use RollingNumber.

   Writes textContent directly each frame, so the count costs no re-renders.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import useInView from './useInView'
import { prefersReducedMotion } from './env'

const easeOut = (t) => 1 - Math.pow(1 - t, 4)

export default function CountUp({
  value,
  from = 0,
  duration = 1100,
  delay = 0,
  prefix = '',
  suffix = '',
  immediate = false,
  format = (n) => String(n),
  className = '',
}) {
  const [ref, inView] = useInView({ immediate, threshold: 0.4 })
  const out = useRef(null)
  const target = Number(value) || 0
  /* The formatter is read through a ref: a new function each render must
     not restart a count that is under way. */
  const formatRef = useRef(format)
  formatRef.current = format

  /* The tally is drawn through a data attribute and ::before, so the only
     real text in the element is the final value — copying or reading the
     page never picks up a half-counted figure. */
  useEffect(() => {
    const node = out.current
    if (!node) return undefined
    const write = (v) => node.setAttribute('data-d', `${prefix}${formatRef.current(v)}${suffix}`)
    if (!inView) { write(from); return undefined }
    if (prefersReducedMotion() || from === target) {
      write(target)
      return undefined
    }

    let raf = 0
    let start = 0
    /* A timer drives the count as well as rAF, so a tab that renders no
       frames still arrives at the right figure. */
    const settle = window.setTimeout(() => write(target), delay + duration + 200)
    const timer = window.setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts
        const t = Math.min(1, (ts - start) / duration)
        write(Math.round(from + (target - from) * easeOut(t)))
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)

    return () => { clearTimeout(timer); clearTimeout(settle); cancelAnimationFrame(raf) }
  }, [inView, target, from, duration, delay, prefix, suffix])

  return (
    <span ref={ref} className={`cu tnum ${className}`.trim()}>
      <span className="pg-sr-only">{`${prefix}${format(target)}${suffix}`}</span>
      <span ref={out} className="cu-shown" aria-hidden="true" data-d={`${prefix}${format(from)}${suffix}`} />
    </span>
  )
}
