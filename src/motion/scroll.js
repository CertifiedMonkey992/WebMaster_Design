/* ═══════════════════════════════════════════════════════════════════════════
   scroll.js — ONE LISTENER FOR EVERYTHING THAT MOVES WITH THE PAGE
   ---------------------------------------------------------------------------
   Parallax, scrubbing and the ticker's scroll push all need the same two
   facts every frame: where an element is relative to the viewport, and how
   fast the page is moving. Rather than each component adding its own scroll
   listener (four did), they register here.

     useScrollProgress({ onProgress, cssVar })
         A callback ref. While the element is near the viewport, `progress`
         runs 0 → 1 as it travels from entering the bottom of the screen to
         leaving the top. Written to `cssVar` (default --sp) on the element,
         and/or passed to `onProgress(p, rect)`.

     onScrollVelocity(fn)
         fn(pxPerSecond) each frame while the page moves, decaying to 0 after
         it stops. Positive = scrolling down.

   Reads are batched before writes, elements far offscreen are skipped (a
   shared IntersectionObserver gates them), and the rAF loop sleeps when the
   page is still.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useRef } from 'react'
import { prefersReducedMotion } from './env'

const entries = new Map()     // element → { onProgress, cssVar, near }
const velocityListeners = new Set()

let raf = 0
let lastY = 0
let lastT = 0
let velocity = 0
let bound = false
let io = null

function measureAndWrite() {
  const vh = window.innerHeight
  const reads = []
  entries.forEach((entry, el) => {
    if (!entry.near) return
    reads.push([el, entry, el.getBoundingClientRect()])
  })
  for (const [el, entry, r] of reads) {
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)))
    if (entry.last === p) continue
    entry.last = p
    if (entry.cssVar) el.style.setProperty(entry.cssVar, p.toFixed(4))
    entry.onProgress?.(p, r)
  }
}

function frame(now) {
  raf = 0
  const y = window.scrollY
  const dt = lastT ? Math.max(1, now - lastT) : 16
  const instant = ((y - lastY) / dt) * 1000
  lastY = y
  lastT = now
  /* Smooth toward the instantaneous speed; decays naturally when it is 0. */
  velocity += (instant - velocity) * 0.25
  if (Math.abs(velocity) < 4) velocity = 0

  measureAndWrite()
  velocityListeners.forEach((fn) => fn(velocity))

  if (velocity !== 0) raf = requestAnimationFrame(frame)
  else lastT = 0
}

function wake() {
  if (raf) return
  /* The loop went to sleep with a stale position; starting from where the
     page is NOW keeps a jump made while asleep from reading as a velocity. */
  lastY = window.scrollY
  lastT = 0
  raf = requestAnimationFrame(frame)
}

function bind() {
  if (bound || typeof window === 'undefined') return
  bound = true
  lastY = window.scrollY
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', wake, { passive: true })
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (list) => {
        for (const e of list) {
          const entry = entries.get(e.target)
          if (entry) entry.near = e.isIntersecting
        }
        wake()
      },
      { rootMargin: '40% 0px 40% 0px' },
    )
  }
}

export function onScrollVelocity(fn) {
  bind()
  velocityListeners.add(fn)
  return () => velocityListeners.delete(fn)
}

export function useScrollProgress({ onProgress, cssVar = '--sp', disabled = false } = {}) {
  const node = useRef(null)
  const handler = useRef(onProgress)
  handler.current = onProgress

  const ref = useCallback((el) => {
    if (node.current) {
      entries.delete(node.current)
      io?.unobserve(node.current)
    }
    node.current = el
    if (!el || disabled || prefersReducedMotion()) return
    bind()
    entries.set(el, {
      cssVar,
      near: !io,
      last: -1,
      onProgress: (p, r) => handler.current?.(p, r),
    })
    io?.observe(el)
    /* First measurement without waiting for a scroll. */
    const entry = entries.get(el)
    entry.near = true
    requestAnimationFrame(() => { measureAndWrite() })
    window.setTimeout(measureAndWrite, 60)
  }, [cssVar, disabled])

  /* No effect cleanup: React calls a callback ref with null on unmount, which
     unregisters above. An effect cleanup would also run during StrictMode's
     simulated unmount — which does NOT re-attach refs — and silently drop
     the registration. */
  return ref
}
