/* ═══════════════════════════════════════════════════════════════════════════
   sims/kit.jsx — WHAT EVERY SIMULATION IS BUILT FROM
   ---------------------------------------------------------------------------
   The course's simulations are real: a classifier really trains, a network
   really runs gradient descent, a language model really counts its corpus.
   They are drawn as a field guide draws a diagram — ink on paper, hairlines,
   the four semantic hues — never as glowing dashboards.

     SimFrame    the hairline box a simulation sits in, with its provenance
     Slider      a labelled range control with its value beside it
     Seg         a segmented control (one of a few)
     Meter       a labelled bar for a proportion
     Stat        a figure and what it counts
     usePlot     a crisp canvas that redraws when its inputs change
     ink(name)   a design token's colour, for drawing on canvas
     rng(seed)   a seeded random source, so every learner sees the same data
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Provenance } from '../StepRenderer'
import './sims.css'

export function SimFrame({ title, provenance = 'live', note, children, className = '', controls, footer }) {
  return (
    <section className={`sim ${className}`.trim()} aria-label={title}>
      <header className="sim-head">
        <span className="sim-title">{title}</span>
        <Provenance kind={provenance} />
      </header>
      {note && <p className="sim-note">{note}</p>}
      {controls && <div className="sim-controls">{controls}</div>}
      <div className="sim-body">{children}</div>
      {footer && <footer className="sim-foot">{footer}</footer>}
    </section>
  )
}

export function Slider({ label, min, max, step = 1, value, onChange, format = (v) => v, id, disabled }) {
  const fid = id ?? `sl-${label.replace(/\W+/g, '-').toLowerCase()}`
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="sim-slider" htmlFor={fid}>
      <span className="sim-slider-head">
        <span className="sim-label">{label}</span>
        <span className="sim-value tnum">{format(value)}</span>
      </span>
      <input
        id={fid}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function Seg({ label, options, value, onChange, disabled }) {
  return (
    <div className="sim-seg-wrap">
      {label && <span className="sim-label">{label}</span>}
      <div className="sim-seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`st-seg${value === o.value ? ' is-on' : ''}`}
            disabled={disabled || o.disabled}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Meter({ label, value, max = 1, tone = 'moss', format = (v) => `${Math.round(v * 100)}%` }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100
  return (
    <div className={`sim-meter sim-meter--${tone}`}>
      <span className="sim-meter-head">
        <span className="sim-label">{label}</span>
        <span className="sim-value tnum">{format(value)}</span>
      </span>
      <span className="sim-meter-track"><span className="sim-meter-fill" style={{ width: `${pct}%` }} /></span>
    </div>
  )
}

export function Stat({ label, value, tone }) {
  return (
    <div className={`sim-stat${tone ? ` sim-stat--${tone}` : ''}`}>
      <span className="sim-stat-value tnum">{value}</span>
      <span className="sim-stat-label">{label}</span>
    </div>
  )
}

export function Btn({ children, onClick, disabled, quiet, primary }) {
  return (
    <button
      type="button"
      className={`btn btn-sm ${primary ? 'btn-primary' : quiet ? 'btn-ghost' : 'btn-outline'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

/* ── Colour for canvas ─────────────────────────────────────────────────── */

const inkCache = new Map()
/** The resolved value of a colour token, e.g. ink('--moss'). */
export function ink(name, alpha = 1) {
  let value = inkCache.get(name)
  if (value === undefined) {
    value = (typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      : '') || 'currentColor'
    inkCache.set(name, value)
  }
  if (alpha >= 1) return value
  const rgb = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(`${name}-rgb`).trim()
    : ''
  return rgb ? `rgba(${rgb}, ${alpha})` : value
}

/* ── A seeded random source (mulberry32) ───────────────────────────────── */

export function rng(seed = 1) {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** A normally distributed sample from a uniform source (Box–Muller). */
export function gauss(rand) {
  const u = Math.max(1e-9, rand())
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/* ── A crisp canvas ────────────────────────────────────────────────────── */

/**
 * `draw(ctx, w, h)` runs whenever `deps` change and when the canvas is
 * resized. The canvas is sized in CSS pixels by its container and drawn at
 * the device's pixel ratio, so lines stay one hairline wide.
 */
export function usePlot(draw, deps, { aspect = 0.62, min = 180, max = 340 } = {}) {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const measure = () => {
      const w = Math.floor(canvas.parentElement?.clientWidth ?? 320)
      const h = Math.max(min, Math.min(max, Math.floor(w * aspect)))
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(canvas.parentElement)
    return () => ro?.disconnect()
  }, [aspect, min, max])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !size.w) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    draw(ctx, size.w, size.h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, ...deps])

  return { ref, size }
}

/** Run `step()` on animation frames while `running`, at most `perFrame` times a frame. */
export function useLoop(running, step, perFrame = 1) {
  const stepRef = useRef(step)
  stepRef.current = step
  useEffect(() => {
    if (!running) return undefined
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      let keep = true
      for (let i = 0; i < perFrame && keep; i++) keep = stepRef.current() !== false
      if (keep) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [running, perFrame])
}

export const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`
