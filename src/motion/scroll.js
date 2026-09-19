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

     useScrollScene({ onProgress })              (revision 7)
         A callback ref for a scene's TRACK: a tall element holding a
         sticky, one-screen stage. `onProgress(p)` gets the track's progress
         (0 while the stage is about to pin → 1 as it unpins), weighted by a
         spring so the scrub moves on the first pixel and glides to rest
         after the last. MOTION_RULES.md → Scroll → Scenes.

     scrollToScene(track, p)
         Scroll the page so `track` sits at progress p — how a scene's links,
         rails and controls move it, so the scene plays on the way.

     useSceneEnabled(query)
         Whether a scene should pin at all: motion allowed and `query`
         matching (e.g. '(min-width: 721px)'). Re-evaluates when either
         changes.

   Reads are batched before writes, elements far offscreen are skipped (a
   shared IntersectionObserver gates them), and the rAF loop sleeps when the
   page is still.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './env'
import { createSpring } from './spring'

const entries = new Map()     // element → { onProgress, cssVar, near }
const scenes = new Map()      // track → { spring, placed }
const velocityListeners = new Set()

/* About critically damped: ~400ms to settle, no overshoot. */
export const SCENE_WEIGHT = { stiffness: 170, damping: 26 }

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

/** A track's raw progress: 0 as its stage pins, 1 as it unpins. */
function sceneProgress(track) {
  const r = track.getBoundingClientRect()
  const dist = r.height - window.innerHeight
  if (dist <= 0) return 0
  return Math.max(0, Math.min(1, -r.top / dist))
}

function measureScenes() {
  scenes.forEach((scene, track) => {
    const p = sceneProgress(track)
    /* The first measurement places the scene where the page already is
       (a reload halfway down) instead of playing it from the top. */
    if (!scene.placed) { scene.placed = true; scene.spring.jump(p) }
    else scene.spring.set(p)
  })
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
  measureScenes()
  velocityListeners.forEach((fn) => fn(velocity))

  if (velocity !== 0) raf = requestAnimationFrame(frame)
  else lastT = 0
}

function wake() {
  if (!raf) raf = requestAnimationFrame(frame)
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

/* ── Scenes (revision 7) ─────────────────────────────────────────────────── */

export function useScrollScene({ onProgress } = {}) {
  const node = useRef(null)
  const handler = useRef(onProgress)
  handler.current = onProgress
  const spring = useRef(null)

  return useCallback((el) => {
    if (node.current) {
      scenes.get(node.current)?.spring.stop()
      scenes.delete(node.current)
    }
    node.current = el
    if (!el) return
    bind()
    if (!spring.current) {
      spring.current = createSpring({
        ...SCENE_WEIGHT,
        precision: 0.0002,
        restSpeed: 0.002,
        onUpdate: (p) => handler.current?.(p),
      })
    }
    scenes.set(el, { spring: spring.current, placed: false })
    /* Place it once layout has settled, and again after fonts and frames
       have had a moment to change the page's height. */
    requestAnimationFrame(measureScenes)
    window.setTimeout(measureScenes, 120)
  }, [])
}

export function scrollToScene(track, p, behavior = 'smooth') {
  if (!track) return
  const dist = track.offsetHeight - window.innerHeight
  const top = track.getBoundingClientRect().top + window.scrollY + Math.max(0, Math.min(1, p)) * dist
  window.scrollTo({ top: Math.round(top), behavior: prefersReducedMotion() ? 'instant' : behavior })
}

export function useSceneEnabled(query) {
  const read = () => typeof window !== 'undefined'
    && !prefersReducedMotion()
    && (!query || window.matchMedia(query).matches)
  const [on, setOn] = useState(read)
  useEffect(() => {
    const lists = [window.matchMedia('(prefers-reduced-motion: reduce)')]
    if (query) lists.push(window.matchMedia(query))
    const update = () => setOn(read())
    lists.forEach((l) => l.addEventListener('change', update))
    return () => lists.forEach((l) => l.removeEventListener('change', update))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  return on
}
