/* ═══════════════════════════════════════════════════════════════════════════
   flight.js — A REWARD GOES SOMEWHERE
   ---------------------------------------------------------------------------
   The "Fly" verb. When a learner earns gems, the gems leave the thing that
   paid them and travel to the counter they belong to; the counter catches
   each one and only then rolls to its new value.

   Three pieces:

     fly({ from, to, icon, count, amount })
         Launch particles. `from` and `to` may each be an element, a rect, a
         point, or a TARGET KEY ('gems', 'hearts', 'streak', 'xp').

     useFlightTarget(key)
         A callback ref that registers an element as a landing site. Several
         elements can share a key (the top bar AND the lesson overlay both
         have a gem counter); a flight lands on the most recently registered
         one that is actually visible and not covered.

     useLandedValue(key, value)
         What a counter should DISPLAY. If a flight toward `key` is in the
         air, it keeps showing the old value until the last particle lands.
         This is display lag only — the stored value changed the moment the
         reducer ran, so nothing here can lose or duplicate a reward.

   Pure DOM + Web Animations. No React state per particle, and every node
   removes itself. Under reduced motion a flight resolves instantly.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, fxLayer, centerOf } from './env'
import { burst, bump, sparkle } from './burst'

const targets = new Map()    // key → element[] (registration order)
const inFlight = new Map()   // key → number of flights still travelling
const listeners = new Map()  // key → Set<() => void>
const launched = new Map()   // key → timestamp of the last flight toward it

/* ── Registry ─────────────────────────────────────────────────────────────── */

function register(key, el) {
  const list = targets.get(key) || []
  targets.set(key, [...list.filter((x) => x !== el), el])
}

function unregister(key, el) {
  const list = targets.get(key) || []
  targets.set(key, list.filter((x) => x !== el))
}

function isShowing(el, allowCovered = false) {
  if (!el?.isConnected) return false
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return false
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return false
  /* Behind a translucent scrim is still "there" for a flight that starts in
     front of that scrim (the daily bonus panel). */
  if (allowCovered) return true
  /* Covered by a modal? elementFromPoint skips pointer-events:none layers,
     so the fx layer and tooltips never count as covering anything. */
  const hit = document.elementFromPoint(cx, cy)
  return Boolean(hit) && (el === hit || el.contains(hit))
}

/* Revision 5: a landing page holds several product frames, each with its own
   demo learner and its own counters. A reward earned inside a frame
   ([data-flight-scope]) lands on the counter inside that frame first. */
const scopeOf = (el) => el?.closest?.('[data-flight-scope]') ?? null

export function findTarget(key, allowCovered = false, near = null) {
  const list = targets.get(key) || []
  const scope = scopeOf(near)
  if (scope) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (scope.contains(list[i]) && isShowing(list[i], allowCovered)) return list[i]
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    /* Never another frame's counter: a scoped flight with no counter of its
       own simply has nowhere to land. */
    if (scope && scopeOf(list[i]) && scopeOf(list[i]) !== scope) continue
    if (isShowing(list[i], allowCovered)) return list[i]
  }
  return null
}

function resolve(point, allowCovered = false, near = null) {
  if (typeof point === 'string') {
    const el = findTarget(point, allowCovered, near)
    return el ? { el, p: centerOf(el) } : null
  }
  const p = centerOf(point)
  return p ? { el: point?.getBoundingClientRect ? point : null, p } : null
}

function notify(key) {
  listeners.get(key)?.forEach((fn) => fn())
}

function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key).add(fn)
  return () => listeners.get(key)?.delete(fn)
}

/**
 * Hold a counter at its old value BEFORE its flight launches — for a
 * sequence that charges up first (the daily bonus). Returns a release
 * function; the hold also lets go on its own after `ms`.
 */
export function hold(key, ms = 2200) {
  inFlight.set(key, (inFlight.get(key) || 0) + 1)
  launched.set(key, Date.now())
  notify(key)
  let released = false
  const release = () => {
    if (released) return
    released = true
    inFlight.set(key, Math.max(0, (inFlight.get(key) || 1) - 1))
    notify(key)
  }
  window.setTimeout(release, ms)
  return release
}

/** Was a flight toward `key` launched in the last `ms`? Lets the toast layer
 *  avoid flying a second set of gems for a claim that already flew its own. */
export function recentlyLaunched(key, ms = 900) {
  return Date.now() - (launched.get(key) || 0) < ms
}

/* ── Particle art ─────────────────────────────────────────────────────────── */

const SVG = {
  gem: '<svg viewBox="0 0 24 24"><path class="p-face" d="M7.4 2.6h9.2L22 9.1 12 21.6 2 9.1Z"/><path class="p-light" d="M7.4 2.6h9.2L18.6 9H5.4Z"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path class="p-face" d="M20.5 5.1a5.1 5.1 0 0 0-7.2 0L12 6.4l-1.3-1.3a5.1 5.1 0 1 0-7.2 7.2l8.5 8.4 8.5-8.4a5.1 5.1 0 0 0 0-7.2Z"/><path class="p-stroke" d="M6.4 6.2c-1.2.3-2 1.3-2 2.6 0 .5.1 1 .4 1.4"/></svg>',
  xp: '<svg viewBox="0 0 24 24"><path class="p-face" d="M13.5 1.8 4 13.6h6.8L9.6 22.2 20 9.9h-6.9Z"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path class="p-face" d="M13.1 1.5c.3 2.6-.7 4.3-2.2 5.8-1.7 1.7-3.8 3.2-4.4 5.9-.8 3.6 1.3 7.1 4.8 8.2 4 1.2 8.1-1.3 8.6-5.4.4-3.1-1-5.1-2.9-6.9-.3 1.1-.9 1.9-1.8 2.3.5-3.6-.5-7.1-2.1-9.9Z"/><path class="p-light" d="M12.3 12.4c.2 1.4-.4 2.2-1.2 3-.7.7-1.3 1.4-1.3 2.4 0 1.6 1.4 2.8 3.1 2.8 1.8 0 3.2-1.2 3.2-2.9 0-1.4-.8-2.3-1.8-3.1-.1.6-.4 1-.9 1.2.2-1.3-.4-2.5-1.1-3.4Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path class="p-face" d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6Z"/><path class="p-stroke" d="M12 5 7 7.2"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path class="p-face" d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z"/></svg>',
}

const PALETTE_FOR = { gem: 'gem', heart: 'heart', xp: 'xp', flame: 'streak', shield: 'shield', star: 'reward' }

/** The "+20" that rises from where a reward was earned. */
function riseLabel(p, text, icon) {
  const tag = document.createElement('span')
  tag.className = `fx-label fx-label--${icon}`
  tag.textContent = text
  tag.style.left = `${p.x}px`
  tag.style.top = `${p.y}px`
  fxLayer().appendChild(tag)
  tag.animate(
    [
      { transform: 'translate(-50%, -50%) translateY(6px) scale(0.7)', opacity: 0 },
      { transform: 'translate(-50%, -50%) translateY(-14px) scale(1.08)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -50%) translateY(-26px) scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'translate(-50%, -50%) translateY(-40px) scale(0.95)', opacity: 0 },
    ],
    { duration: 1100, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' },
  ).onfinish = () => tag.remove()
}

/* ── fly ──────────────────────────────────────────────────────────────────── */

const bezier = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b

export function fly({
  from,
  to,
  icon = 'gem',
  count = 5,
  amount,
  label,
  size = 18,
  onLand,
  allowCovered = false,
  orRise = false,
} = {}) {
  const key = typeof to === 'string' ? to : null
  if (key) launched.set(key, Date.now())

  const src = resolve(from)
  const dst = resolve(to, allowCovered, src?.el)

  const done = () => { onLand?.() }

  const text = label ?? (amount != null ? `+${amount}` : null)

  if (prefersReducedMotion() || !src || !dst) {
    /* Nowhere on screen to land (XP earned in a frame with no XP counter):
       with `orRise`, the amount still rises from where it was earned, and
       light catches it. Off by default — a toast chip already shows its own
       amount. */
    if (orRise && src && text && !prefersReducedMotion()) {
      riseLabel(src.p, text, icon)
      sparkle(src.el || src.p, { tone: icon === 'heart' ? 'heart' : icon === 'xp' ? 'xp' : 'gem', count: 5, radius: 26 })
    }
    done()
    return Promise.resolve(false)
  }

  if (key) {
    inFlight.set(key, (inFlight.get(key) || 0) + 1)
    notify(key)
  }

  const layer = fxLayer()
  const n = Math.max(1, Math.min(9, count))

  /* A floating "+20" that rises from the source while the particles leave. */
  if (text) riseLabel(src.p, text, icon)

  return new Promise((resolveFlight) => {
    let landed = 0

    for (let i = 0; i < n; i++) {
      const node = document.createElement('span')
      node.className = `fx-p fx-p--${icon}`
      node.style.width = `${size}px`
      node.style.height = `${size}px`
      node.style.left = '0px'
      node.style.top = '0px'
      node.innerHTML = SVG[icon] || SVG.gem
      layer.appendChild(node)

      /* Each particle first scatters from the source, then arcs to the
         target. The arc bends to one side of the straight line, alternating,
         so the swarm reads as several objects rather than one smeared one. */
      const scatterA = (Math.PI * 2 * i) / n + Math.random() * 0.6
      const scatterR = 16 + Math.random() * 18
      const sx = src.p.x + Math.cos(scatterA) * scatterR
      const sy = src.p.y + Math.sin(scatterA) * scatterR
      const ex = dst.p.x
      const ey = dst.p.y
      const mx = (sx + ex) / 2
      const my = (sy + ey) / 2
      const dx = ex - sx
      const dy = ey - sy
      const len = Math.hypot(dx, dy) || 1
      const bend = (i % 2 ? 1 : -1) * (0.18 + Math.random() * 0.14) * len
      const cx = mx + (-dy / len) * bend
      const cy = my + (dx / len) * bend - len * 0.12

      const frames = []
      frames.push({ transform: `translate(${src.p.x}px, ${src.p.y}px) translate(-50%, -50%) scale(0.2) rotate(0deg)`, opacity: 0, offset: 0 })
      frames.push({ transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(1.15) rotate(${(i % 2 ? 1 : -1) * 20}deg)`, opacity: 1, offset: 0.16 })
      const steps = 10
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const x = bezier(sx, cx, ex, t)
        const y = bezier(sy, cy, ey, t)
        const scale = 1.15 - 0.55 * t
        frames.push({
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale}) rotate(${(i % 2 ? 1 : -1) * (20 - 40 * t)}deg)`,
          opacity: t > 0.94 ? 0.2 : 1,
          offset: 0.16 + 0.84 * t,
        })
      }

      let anim
      try {
        anim = node.animate(frames, {
          duration: 760 + Math.min(260, len * 0.25),
          delay: i * 55,
          easing: 'cubic-bezier(0.5, 0, 0.25, 1)',
          fill: 'both',
        })
      } catch {
        /* No Web Animations here: nothing to watch, so the flight is over
           before it began and the counter is released at once. */
        node.remove()
        if (key) {
          inFlight.set(key, Math.max(0, (inFlight.get(key) || 1) - 1))
          notify(key)
        }
        done()
        resolveFlight(false)
        return
      }

      anim.onfinish = () => {
        node.remove()
        landed++
        const live = key ? findTarget(key, allowCovered, src.el) || dst.el : dst.el
        if (live) bump(live, { to: 1.14 + Math.min(0.1, landed * 0.015) })
        if (landed === n) {
          burst(live || dst.p, { palette: PALETTE_FOR[icon] || 'reward', count: 10, spread: 34, gravity: 14, duration: 560 })
          if (key) {
            inFlight.set(key, Math.max(0, (inFlight.get(key) || 1) - 1))
            notify(key)
          }
          done()
          resolveFlight(true)
        }
      }
    }
  })
}

/** Something leaves a counter and falls away — a heart lost, gems spent. */
export function drop({ from, icon = 'heart', count = 1, size = 18, fall = 46 } = {}) {
  if (prefersReducedMotion()) return
  const src = resolve(from)
  if (!src) return
  const layer = fxLayer()
  for (let i = 0; i < count; i++) {
    const node = document.createElement('span')
    node.className = `fx-p fx-p--${icon} fx-p--drop`
    node.style.width = `${size}px`
    node.style.height = `${size}px`
    node.style.left = '0px'
    node.style.top = '0px'
    node.innerHTML = SVG[icon] || SVG.heart
    layer.appendChild(node)
    const side = (i % 2 ? 1 : -1) * (10 + Math.random() * 14)
    node.animate(
      [
        { transform: `translate(${src.p.x}px, ${src.p.y}px) translate(-50%, -50%) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${src.p.x + side * 0.5}px, ${src.p.y - 10}px) translate(-50%, -50%) scale(0.95) rotate(${side}deg)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${src.p.x + side}px, ${src.p.y + fall}px) translate(-50%, -50%) scale(0.7) rotate(${side * 3}deg)`, opacity: 0 },
      ],
      { duration: 820, delay: i * 70, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'both' },
    ).onfinish = () => node.remove()
  }
}

/* ── Hooks ────────────────────────────────────────────────────────────────── */

export function useFlightTarget(key) {
  const current = useRef(null)
  return useCallback((el) => {
    if (current.current) unregister(key, current.current)
    current.current = el
    if (el) register(key, el)
  }, [key])
}

export function useLandedValue(key, value) {
  const [shown, setShown] = useState(value)
  const latest = useRef(value)
  latest.current = value

  useEffect(() => {
    if (value === shown) return undefined
    if ((inFlight.get(key) || 0) === 0) {
      setShown(value)
      return undefined
    }
    const off = subscribe(key, () => {
      if ((inFlight.get(key) || 0) === 0) setShown(latest.current)
    })
    /* A flight can be interrupted (tab hidden, element unmounted). The value
       is never held hostage for longer than a flight could plausibly take. */
    const t = window.setTimeout(() => setShown(latest.current), 1800)
    return () => { off(); clearTimeout(t) }
  }, [key, value, shown])

  return shown
}
