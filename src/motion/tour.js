/* ═══════════════════════════════════════════════════════════════════════════
   tour.js — A CROPPED SURFACE THAT SHOWS ITSELF AROUND
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 4 → Auto-tour. The course frame on the landing
   page used to scrub its content with the page scroll, so it only moved while
   the reader was scrolling past it. It now tours the real course on its own:
   hold, glide to the thing worth seeing, hold, glide on, and come back round.

     const tour = createTour({ viewport, content, thumb, stops })
     tour.hold('hover')      pause for a reason (mid-glide or mid-hold)
     tour.release('hover')   resume once no reasons remain
     tour.destroy()

   `stops(ctx)` is asked for the route at the start of every lap, so a layout
   that changed since the last lap is measured fresh. ctx gives `max` (the
   furthest the content can travel), `height` (the visible height) and
   `offsetOf(selector)` (an element's resting offset inside the content).
   Each stop is { y, hold }.

   Glides are Web Animations on `transform` — the compositor runs them, so a
   glide costs no main-thread frames — and holds are timers. The optional
   thumb travels on the same timing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { EASE } from './timing'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export function createTour({
  viewport,
  content,
  thumb,
  stops,
  msPerPx = 2.6,
  minGlide = 900,
  maxGlide = 2600,
  returnGlide = 1200,
}) {
  const reasons = new Set()
  let y = 0
  let route = []
  let leg = 0
  let anim = null
  let thumbAnim = null
  let holdTimer = 0
  let holdLeft = 0
  let holdStarted = 0
  let phase = 'idle'          // idle | hold | glide
  let destroyed = false

  const visibleHeight = () => {
    const cs = getComputedStyle(viewport)
    return viewport.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  }

  const measure = () => {
    const height = visibleHeight()
    const max = Math.max(0, content.offsetHeight - height)
    /* Layout offsets, not rects: the frame is tilted toward the pointer and
       stood up out of a 3D tilt as it arrives, and a rect measured through
       those transforms would aim the tour a few dozen pixels wide. */
    const offsetOf = (selector) => {
      const el = content.querySelector(selector)
      if (!el) return null
      let top = 0
      let node = el
      while (node && node !== content && content.contains(node)) {
        top += node.offsetTop
        node = node.offsetParent
      }
      /* The content itself is not positioned, so the walk ended at the
         viewport it shares an offset parent with. */
      if (node !== content) top -= content.offsetTop
      return top
    }
    return { max, height, offsetOf }
  }

  const sizeThumb = (max, height) => {
    if (!thumb) return 0
    const track = thumb.parentElement?.clientHeight || height
    const size = clamp(track * (height / (height + max || 1)), 24, track)
    thumb.style.height = `${size.toFixed(1)}px`
    return track - size
  }

  const place = (value, travel, max) => `translate3d(0, ${max ? ((value / max) * travel).toFixed(1) : 0}px, 0)`

  const planLap = () => {
    const ctx = measure()
    route = (stops(ctx) || [])
      .filter(Boolean)
      .map((s) => ({ y: clamp(s.y, 0, ctx.max), hold: s.hold ?? 1600 }))
    if (!route.length) route = [{ y: 0, hold: 2000 }]
    leg = 0
    return ctx
  }

  const running = () => !destroyed && reasons.size === 0

  function beginHold(ms) {
    phase = 'hold'
    holdLeft = ms
    holdStarted = performance.now()
    if (running()) holdTimer = window.setTimeout(nextLeg, ms)
  }

  function nextLeg() {
    holdTimer = 0
    leg += 1
    if (leg >= route.length) planLap()
    glideTo(route[leg])
  }

  function glideTo(stop) {
    const { max, height } = measure()
    const to = clamp(stop.y, 0, max)
    const dist = Math.abs(to - y)
    if (dist < 2) { y = to; beginHold(stop.hold); return }

    const back = to < y && leg === 0
    const duration = back ? returnGlide : clamp(dist * msPerPx, minGlide, maxGlide)
    const timing = { duration, easing: EASE.swing, fill: 'forwards' }
    const travel = sizeThumb(max, height)

    phase = 'glide'
    anim = content.animate(
      [{ transform: `translate3d(0, ${-y}px, 0)` }, { transform: `translate3d(0, ${-to}px, 0)` }],
      timing,
    )
    if (thumb) {
      thumbAnim = thumb.animate(
        [{ transform: place(y, travel, max) }, { transform: place(to, travel, max) }],
        timing,
      )
    }
    if (!running()) { anim.pause(); thumbAnim?.pause() }

    anim.onfinish = () => {
      if (destroyed) return
      y = to
      content.style.transform = `translate3d(0, ${-to}px, 0)`
      if (thumb) thumb.style.transform = place(to, travel, max)
      anim.cancel(); anim = null
      thumbAnim?.cancel(); thumbAnim = null
      beginHold(stop.hold)
    }
  }

  const pauseNow = () => {
    if (phase === 'glide') { anim?.pause(); thumbAnim?.pause() }
    if (phase === 'hold' && holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = 0
      holdLeft = Math.max(0, holdLeft - (performance.now() - holdStarted))
    }
  }

  const resumeNow = () => {
    if (phase === 'glide') { anim?.play(); thumbAnim?.play() }
    if (phase === 'hold' && !holdTimer) {
      holdStarted = performance.now()
      holdTimer = window.setTimeout(nextLeg, Math.max(250, holdLeft))
    }
  }

  /* Start: sit at the top for the first stop's hold. */
  const { max, height } = planLap()
  y = route[0].y
  content.style.transform = `translate3d(0, ${-y}px, 0)`
  if (thumb) thumb.style.transform = place(y, sizeThumb(max, height), max)
  beginHold(route[0].hold)

  /* Where the content actually is right now, mid-glide included. */
  const liveY = () => {
    const m = getComputedStyle(content).transform
    if (!m || m === 'none') return y
    const parts = m.match(/matrix(3d)?\(([^)]+)\)/)
    if (!parts) return y
    const v = parts[2].split(',').map(Number)
    return -(parts[1] ? v[13] : v[5])
  }

  let visitAnim = null
  let visitThumb = null

  return {
    hold(reason) {
      const was = running()
      reasons.add(reason)
      if (was) pauseNow()
    },
    release(reason) {
      if (!reasons.delete(reason)) return
      if (running()) resumeNow()
    },
    /**
     * Revision 5 — a scene asks the tour to take the reader somewhere: the
     * route pauses, the content glides to `selector` (placed a little above
     * the middle) and the promise resolves on arrival. `resume()` hands the
     * frame back to its route.
     */
    visit(selector, { place: at = 0.28 } = {}) {
      if (destroyed) return Promise.resolve(false)
      const was = running()
      reasons.add('visit')
      if (was) pauseNow()
      if (phase === 'glide' && anim) {
        y = liveY()
        anim.cancel(); anim = null
        thumbAnim?.cancel(); thumbAnim = null
        content.style.transform = `translate3d(0, ${-y}px, 0)`
        phase = 'hold'
        holdLeft = 600
      }
      const ctx = measure()
      const top = ctx.offsetOf(selector)
      if (top == null) return Promise.resolve(false)
      const to = clamp(top - ctx.height * at, 0, ctx.max)
      const dist = Math.abs(to - y)
      const travel = sizeThumb(ctx.max, ctx.height)
      if (dist < 2) return Promise.resolve(true)
      const timing = { duration: clamp(dist * msPerPx, minGlide, maxGlide), easing: EASE.swing, fill: 'forwards' }
      visitAnim = content.animate([{ transform: `translate3d(0, ${-y}px, 0)` }, { transform: `translate3d(0, ${-to}px, 0)` }], timing)
      if (thumb) visitThumb = thumb.animate([{ transform: place(y, travel, ctx.max) }, { transform: place(to, travel, ctx.max) }], timing)
      return new Promise((resolve) => {
        visitAnim.onfinish = () => {
          y = to
          content.style.transform = `translate3d(0, ${-to}px, 0)`
          if (thumb) thumb.style.transform = place(to, travel, ctx.max)
          visitAnim?.cancel(); visitAnim = null
          visitThumb?.cancel(); visitThumb = null
          resolve(true)
        }
        /* A hidden tab renders no frames; the visit must still arrive. */
        window.setTimeout(() => visitAnim?.finish(), timing.duration + 250)
      })
    },
    /** Hand the frame back to its route after a visit. */
    resume(holdMs = 1200) {
      if (!reasons.has('visit')) return
      if (visitAnim) {
        y = liveY()
        visitAnim.cancel(); visitAnim = null
        visitThumb?.cancel(); visitThumb = null
        content.style.transform = `translate3d(0, ${-y}px, 0)`
      }
      reasons.delete('visit')
      clearTimeout(holdTimer)
      holdTimer = 0
      phase = 'hold'
      holdLeft = holdMs
      if (running()) beginHold(holdMs)
    },
    destroy() {
      destroyed = true
      clearTimeout(holdTimer)
      anim?.cancel()
      thumbAnim?.cancel()
      visitAnim?.cancel()
      visitThumb?.cancel()
    },
  }
}
