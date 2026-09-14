/* ═══════════════════════════════════════════════════════════════════════════
   stage.js — THE PAGE'S ATTENTION CLOCK
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The Stage.

   Anything that performs without being asked — the field guide's showcase, a
   demo scene in a product frame, a preview on the learner's real data — is a
   PERFORMER. A performer never decides WHEN it plays; it registers with the
   Stage and the Stage gives it a turn:

     performance ─▶ settle (rest) ─▶ performance ─▶ settle ─▶ …

   One performance at a time, anywhere on the page. Rests are drawn fresh
   every time and never repeat. Only what is on screen performs, a region
   that just scrolled in gets to greet the reader first, and the region that
   just performed steps back so the eye is led somewhere new.

   The hand always wins: pointing at a performer, pressing, typing, scrolling,
   an open dialog or a text selection stops or holds the stage. A performer
   stopped by the hand is left exactly as the hand found it.

     usePerformer(ref, {
       id, region, tier: 'major' | 'minor' | 'accent',
       weight?, cooldown?, when?(), busy?(), cue?(text),
       run(ctx) → ms | Promise,
     })

     ctx.wait(ms)       resolves after ms — never, if the performance was
                        stopped, so a script simply ends where it was
     ctx.after(ms, fn)  a timer that dies with the performance
     ctx.onStop(fn)     called if the performance is stopped early
                        (fn receives the reason: hand | offscreen | hidden |
                        unmount | timeout)
     ctx.cue(text)      narrate (the frame's chrome); cleared at the end
     ctx.stopped        true once stopped

   Timers and one IntersectionObserver. No frames are spent between
   performances. Under reduced motion nothing registers.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './env'
import { idleFor } from './idle'

/* ── Tuning (MOTION_RULES.md → The Stage) ─────────────────────────────────── */

export const TIERS = {
  major:  { rest: [2400, 4600], cooldown: 14000, weight: 1 },
  minor:  { rest: [1800, 3400], cooldown: 6000,  weight: 1.35 },
  accent: { rest: [1200, 2600], cooldown: 3500,  weight: 1.7 },
}

const FIRST_TURN = 2400         // the page's first performance, after arrival
const ARRIVAL_WAIT = 900        // a region that scrolls in waits for its reveal
const SCROLL_QUIET = 600        // nothing starts this soon after a scroll
const HANDS_OFF = 8000          // a region touched waits this long
const PRESS_HOLD = 1500         // the whole stage waits this long after a press
const CALM_AFTER = 25000        // idle this long and rests stretch…
const CALM_FACTOR = 1.6         // …by this much
const MAX_RUN = 14000           // a performance that never settles is ended
const RETRY = [420, 760]        // when nothing may start yet, look again soon

const rand = (a, b) => a + Math.random() * (b - a)
const now = () => performance.now()

/* ── State ────────────────────────────────────────────────────────────────── */

const performers = new Set()
let running = null
let timer = 0
let nextAt = 0
let lastTier = null
let lastRegion = null
let lastRest = 0
let lastScrollAt = -Infinity
let holdUntil = 0
let pointer = null              // { x, y, target, at }
let bound = false
let observer = null
const log = []                  // dev: what performed, when

/* ── Visibility: arrival times per element ────────────────────────────────── */

const seen = new WeakMap()      // element → { on, since }

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver((entries) => {
    const t = now()
    for (const e of entries) {
      const rec = seen.get(e.target) || { on: false, since: 0 }
      const vh = window.innerHeight || 1
      const on = e.intersectionRatio >= 0.35 || e.intersectionRect.height / vh >= 0.35
      if (on && !rec.on) {
        rec.since = t
        /* A region greets the reader again each time it comes back into view. */
        performers.forEach((p) => { if (p.el === e.target) p.greeted = false })
      }
      rec.on = on
      seen.set(e.target, rec)
      if (!on && running?.p.el === e.target) stop('offscreen')
    }
  }, { threshold: [0, 0.2, 0.35, 0.55, 0.8, 1] })
  return observer
}

/** Share of an element on screen, or of the screen it covers, 0–1. */
function onScreen(el) {
  if (!el?.isConnected) return 0
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return 0
  const vh = window.innerHeight
  const vw = window.innerWidth
  const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
  const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0))
  if (!h || !w) return 0
  return Math.max(h / r.height, h / vh >= 0.4 ? 1 : 0) * Math.min(1, w / r.width + 0.2)
}

/* ── The hand ─────────────────────────────────────────────────────────────── */

function bind() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const opt = { passive: true, capture: true }

  window.addEventListener('scroll', () => { lastScrollAt = now() }, opt)
  window.addEventListener('wheel', () => { lastScrollAt = now() }, opt)

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return
    pointer = { x: e.clientX, y: e.clientY, target: e.target, at: now() }
    /* The hand arrives on the thing that is performing: stop it at once. */
    if (running && running.p.el.contains(e.target)) stop('hand')
  }, opt)

  document.documentElement.addEventListener('pointerleave', () => { pointer = null })

  const touch = (e) => {
    holdUntil = Math.max(holdUntil, now() + PRESS_HOLD)
    performers.forEach((p) => {
      if (p.el.contains(e.target) || p.spec.region && regionOf(e.target) === p.spec.region) {
        p.handsOffUntil = now() + HANDS_OFF
      }
    })
    if (running && (running.p.el.contains(e.target) || regionOf(e.target) === running.p.spec.region)) stop('hand')
  }
  window.addEventListener('pointerdown', touch, opt)
  window.addEventListener('keydown', (e) => touch({ target: e.target === document.body ? document.documentElement : e.target }), opt)
  window.addEventListener('focusin', (e) => { if (e.target?.matches?.(':focus-visible')) touch(e) }, opt)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop('hidden'); return }
    schedule(rand(900, 1600))
  })
}

/** A performer's region is marked on an ancestor as data-stage-region. */
function regionOf(node) {
  return node?.closest?.('[data-stage-region]')?.getAttribute('data-stage-region') ?? null
}

/** Something the reader opened is in front of the page. */
function somethingOpen() {
  return Boolean(document.querySelector('[aria-modal="true"], .pg-popover, .lm-overlay'))
}

function selecting() {
  const s = window.getSelection?.()
  return Boolean(s && !s.isCollapsed && String(s).trim())
}

/* A reward the reader caused is still in the air. Particles live ≤ ~1.2s, so
   "something was thrown onto the fx layer in the last 1.3s" is the test — it
   cannot be fooled by a particle whose finish event never came. */
let lastThrown = -Infinity
let layerWatch = null
function reportInFlight() {
  const layer = document.getElementById('fx-layer')
  if (layer && !layerWatch && typeof MutationObserver !== 'undefined') {
    layerWatch = new MutationObserver((records) => {
      if (records.some((r) => [...r.addedNodes].some((n) => !n.classList?.contains('fx-tip')))) lastThrown = now()
    })
    layerWatch.observe(layer, { childList: true })
  }
  return now() - lastThrown < 1300
}

function readingText() {
  if (!pointer || now() - pointer.at > 20000) return false
  const t = pointer.target
  if (!t?.closest) return false
  return Boolean(t.closest('p, h1, h2, h3, blockquote, dd')) && !t.closest('[data-stage-region] .pf, .fg-stage')
}

function hovered(el) {
  if (!pointer) return false
  const r = el.getBoundingClientRect()
  return pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom
}

/* ── The clock ────────────────────────────────────────────────────────────── */

function schedule(wait) {
  clearTimeout(timer)
  if (!performers.size || typeof window === 'undefined') return
  nextAt = now() + wait
  timer = window.setTimeout(attempt, wait)
}

function restAfter(tier) {
  const [a, b] = (TIERS[tier] || TIERS.accent).rest
  let r = rand(a, b)
  /* Never the same rhythm twice. */
  if (lastRest && Math.abs(r - lastRest) < (b - a) * 0.08) r = r > (a + b) / 2 ? rand(a, (a + b) / 2) : rand((a + b) / 2, b)
  /* Now and then the page takes a breath. */
  if (Math.random() < 0.14) r += rand(2000, 3000)
  if (idleFor() > CALM_AFTER) r *= CALM_FACTOR
  lastRest = r
  return r
}

function eligible(p, t, { noMajor }) {
  const { spec } = p
  const tier = TIERS[spec.tier] ? spec.tier : 'accent'
  if (tier === 'major' && (noMajor || lastTier === 'major')) return 0
  if (t < p.handsOffUntil) return 0
  if (t - p.lastEnd < (spec.cooldown ?? TIERS[tier].cooldown)) return 0
  const arrival = seen.get(p.el)
  if (arrival?.on && t - arrival.since < ARRIVAL_WAIT) return 0
  const share = onScreen(p.el)
  if (share < (spec.share ?? 0.55)) return 0
  if (hovered(p.el)) return 0
  try {
    if (spec.busy?.()) return 0
    if (spec.when && !spec.when()) return 0
  } catch { return 0 }

  let w = TIERS[tier].weight * (spec.weight ?? 1)
  if (spec.region && spec.region === lastRegion) w *= 0.3
  if (!p.greeted) w *= 2.4
  /* Overdue: a performer whose cooldown ran out long ago grows more likely,
     so the big moments come round reliably instead of by luck. One that has
     never performed leads with its story if it is a Major. */
  const cd = spec.cooldown ?? TIERS[tier].cooldown
  if (p.lastEnd === -Infinity) w *= tier === 'major' ? 1.8 : 1
  else w *= 1 + Math.min(2, Math.max(0, (t - p.lastEnd - cd) / cd))
  /* Vary the texture: the same small tier twice running is less likely. */
  if (tier !== 'major' && tier === lastTier) w *= 0.55
  /* Near the middle of the screen is where the reader is looking. */
  const r = p.el.getBoundingClientRect()
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight)
  const d = Math.abs(cy - window.innerHeight / 2) / (window.innerHeight / 2)
  w *= 1 + 0.6 * (1 - Math.min(1, d))
  return w
}

function attempt() {
  timer = 0
  if (running || prefersReducedMotion()) return
  /* A hidden tab: look again later. (Not only on visibilitychange — some
     embedded browsers never send it.) */
  if (document.hidden) { schedule(rand(2000, 3000)); return }
  const t = now()
  if (t < holdUntil || t - lastScrollAt < SCROLL_QUIET || somethingOpen() || selecting() || reportInFlight()) {
    schedule(rand(...RETRY))
    return
  }

  const opts = { noMajor: readingText() }
  let total = 0
  const pool = []
  performers.forEach((p) => {
    const w = eligible(p, t, opts)
    if (w > 0) { pool.push([p, w]); total += w }
  })
  if (!total) { schedule(rand(...RETRY)); return }

  let pickAt = Math.random() * total
  let choice = pool[pool.length - 1][0]
  for (const [p, w] of pool) {
    pickAt -= w
    if (pickAt <= 0) { choice = p; break }
  }
  perform(choice)
}

function perform(p) {
  const { spec } = p
  const timers = new Set()
  const stops = []
  const ctx = {
    stopped: false,
    wait: (ms) => new Promise((resolve) => {
      if (ctx.stopped) return
      const id = window.setTimeout(() => { timers.delete(id); if (!ctx.stopped) resolve() }, ms)
      timers.add(id)
    }),
    after: (ms, fn) => {
      const id = window.setTimeout(() => { timers.delete(id); if (!ctx.stopped) fn() }, ms)
      timers.add(id)
    },
    onStop: (fn) => { stops.push(fn) },
    cue: (text) => { try { spec.cue?.(text) } catch { /* ignore */ } },
  }

  const tier = TIERS[spec.tier] ? spec.tier : 'accent'
  running = { p, ctx, timers, stops, tier, started: now() }
  p.greeted = true
  if (import.meta.env?.DEV) {
    log.push({ id: spec.id, tier, region: spec.region, at: Math.round(now()) })
    if (log.length > 200) log.shift()
  }

  const finish = () => {
    if (running?.ctx !== ctx) return
    end(p, ctx, tier)
  }

  let result
  try { result = spec.run(ctx) } catch (err) {
    if (import.meta.env?.DEV) console.error('[stage]', spec.id, err)
    result = 0
  }
  if (result && typeof result.then === 'function') {
    result.then(finish, finish)
  } else {
    ctx.after(Math.max(0, Number(result) || 0), finish)
  }
  ctx.after(MAX_RUN, () => stop('timeout'))
}

function end(p, ctx, tier) {
  running.timers.forEach(clearTimeout)
  running = null
  ctx.stopped = true
  try { p.spec.cue?.(null) } catch { /* ignore */ }
  p.lastEnd = now()
  lastTier = tier
  lastRegion = p.spec.region ?? null
  schedule(restAfter(tier))
}

function stop(reason) {
  if (!running) return
  const { p, ctx, timers, stops, tier } = running
  ctx.stopped = true
  timers.forEach(clearTimeout)
  stops.forEach((fn) => { try { fn(reason) } catch { /* ignore */ } })
  if (reason === 'hand') p.handsOffUntil = now() + HANDS_OFF
  running = null
  try { p.spec.cue?.(null) } catch { /* ignore */ }
  p.lastEnd = now()
  lastTier = tier
  lastRegion = p.spec.region ?? null
  /* Stopped by the reader: give them a moment before anything else starts. */
  schedule(reason === 'hand' ? rand(2600, 4200) : rand(900, 1600))
}

/* ── Registration ─────────────────────────────────────────────────────────── */

function add(record) {
  bind()
  performers.add(record)
  getObserver()?.observe(record.el)
  /* The page's first turn waits for its arrival choreography. */
  if (!timer && !running) schedule(Math.max(FIRST_TURN - now(), rand(...RETRY)))
  return () => {
    if (running?.p === record) stop('unmount')
    performers.delete(record)
    const shared = [...performers].some((p) => p.el === record.el)
    if (!shared) observer?.unobserve(record.el)
    if (!performers.size) { clearTimeout(timer); timer = 0 }
  }
}

/**
 * Register a performer for as long as the component is mounted.
 * `ref` is a React ref to the element that must be on screen (and that the
 * hand stops). The spec is read fresh at every turn, so it may close over
 * current props and state.
 */
export function usePerformer(ref, spec) {
  const specRef = useRef(spec)
  specRef.current = spec
  const { id, disabled } = spec

  useEffect(() => {
    const el = ref?.current
    if (!el || disabled || prefersReducedMotion()) return undefined
    const record = {
      el,
      get spec() { return specRef.current },
      lastEnd: -Infinity,
      handsOffUntil: 0,
      greeted: false,
    }
    return add(record)
  }, [ref, id, disabled])
}

/** Is anything performing right now? (A component may want to know.) */
export const isPerforming = () => Boolean(running)

/**
 * The hand reached `el` by a route the Stage cannot see (the hero's chapter
 * list steering the book, say): stop its performance now, and hold it off.
 */
export function yieldTo(el) {
  if (!el) return
  performers.forEach((p) => { if (p.el === el) p.handsOffUntil = now() + HANDS_OFF })
  if (running?.p.el === el) stop('hand')
}

/** Dev: the recent performance log, for checking the rhythm of a page. */
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.__stage = {
    log,
    get running() { return running ? running.p.spec.id : null },
    /** Why each on-screen performer may or may not perform right now. */
    why() {
      const t = now()
      const global = {
        hold: t < holdUntil, scrolling: t - lastScrollAt < SCROLL_QUIET, open: somethingOpen(),
        selecting: selecting(), inFlight: now() - lastThrown < 1300, reading: readingText(),
        lastTier, lastRegion, nextIn: Math.round(nextAt - t), timer: Boolean(timer),
      }
      const each = [...performers].map((p) => {
        const s = p.spec
        const tier = TIERS[s.tier] ? s.tier : 'accent'
        let when = null
        try { when = s.when ? s.when() : true } catch (e) { when = String(e) }
        return {
          id: s.id, tier, share: +onScreen(p.el).toFixed(2), weight: +eligible(p, t, { noMajor: global.reading }).toFixed(2),
          cooldown: Math.max(0, Math.round((s.cooldown ?? TIERS[tier].cooldown) - (t - p.lastEnd))),
          handsOff: Math.max(0, Math.round(p.handsOffUntil - t)), when, busy: s.busy?.() ?? false, hovered: hovered(p.el), greeted: p.greeted,
        }
      }).filter((x) => x.share > 0)
      return { global, each }
    },
    get performers() { return [...performers].map((p) => ({ id: p.spec.id, tier: p.spec.tier, share: +onScreen(p.el).toFixed(2) })) },
  }
}
