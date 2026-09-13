/* ═══════════════════════════════════════════════════════════════════════════
   idle.js — WHAT A LIVING OBJECT DOES WHEN NOBODY IS TOUCHING IT
   ---------------------------------------------------------------------------
   Idle events (MOTION_RULES.md revision 4) are occasional, self-contained
   gestures: the field guide lifts its cover, a gem catches the light. They
   must never read as a loop you could learn, never run in step with each
   other, and never run while someone is handling the object. This module is
   the shared machinery for that:

     idleFor()                ms since the last pointer, key, wheel, touch or
                              scroll anywhere on the page. One set of passive
                              listeners for the whole app.

     every({ min, max, run, first })
                              calls run() after a random wait in [min, max],
                              then again after a NEW random wait — never the
                              same interval twice. Paused while the tab is
                              hidden. Returns a cancel function. Nothing is
                              scheduled under reduced motion.

     pick(options, last)      weighted choice that never repeats `last`.

     seedOf(string)           0–1, stable per string — a per-instance offset
                              for CSS idle loops (`--seed`), so three gems in
                              one list glint at three different moments.

   Timers, not frames: nothing here costs anything between events.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion } from './env'

let lastActivity = typeof performance !== 'undefined' ? performance.now() : 0
let bound = false

function touch() { lastActivity = performance.now() }

function bind() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const opts = { passive: true, capture: true }
  ;['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((type) => {
    window.addEventListener(type, touch, opts)
  })
}

/** Milliseconds since the learner last did anything on the page. */
export function idleFor() {
  bind()
  return performance.now() - lastActivity
}

const rand = (a, b) => a + Math.random() * (b - a)

/**
 * Run `run` at jittered intervals. `first` overrides the first wait.
 * `run` may return a number of ms to add to the next wait (a long gesture
 * buys itself a longer rest afterwards).
 */
export function every({ min, max, run, first }) {
  bind()
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => {}
  let timer = 0
  let cancelled = false
  let lastWait = -1

  const schedule = (wait) => {
    if (cancelled) return
    timer = window.setTimeout(tick, wait)
  }

  const nextWait = () => {
    let w = rand(min, max)
    /* Never the same rhythm twice: if the draw lands within 8% of the last
       wait, push it to the other side of the range. */
    if (lastWait > 0 && Math.abs(w - lastWait) < (max - min) * 0.08) {
      w = w > (min + max) / 2 ? rand(min, (min + max) / 2) : rand((min + max) / 2, max)
    }
    lastWait = w
    return w
  }

  function tick() {
    if (cancelled) return
    if (document.hidden) {
      const resume = () => {
        document.removeEventListener('visibilitychange', resume)
        schedule(rand(600, 1400))
      }
      document.addEventListener('visibilitychange', resume)
      return
    }
    const extra = Number(run()) || 0
    schedule(nextWait() + extra)
  }

  schedule(first ?? nextWait())
  return () => { cancelled = true; clearTimeout(timer) }
}

/**
 * Weighted pick from [{ id, weight, when? }], skipping `last` and any option
 * whose `when()` is false. Returns the option or null.
 */
export function pick(options, last) {
  const pool = options.filter((o) => o.id !== last && (!o.when || o.when()))
  const total = pool.reduce((s, o) => s + (o.weight ?? 1), 0)
  if (!total) return null
  let r = Math.random() * total
  for (const o of pool) {
    r -= o.weight ?? 1
    if (r <= 0) return o
  }
  return pool[pool.length - 1]
}

/** A stable 0–1 value for a string (React's useId works well). */
export function seedOf(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}
