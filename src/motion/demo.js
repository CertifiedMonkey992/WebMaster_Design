/* ═══════════════════════════════════════════════════════════════════════════
   demo.js — WHAT A SCENE DOES WITH ITS HANDS
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → Demonstrations. A scene (a Stage performer)
   demonstrates the product by using the product's own controls, so every
   Report it produces is the real one. These are the few gestures a scene
   needs that a component cannot do to itself:

     show(el) / hide(el)  the hover-revealed state, performed (data-shown)
     press(el)            the control goes down and comes back up exactly as
                          it does under a finger, then is clicked — its own
                          click handler runs the real sequence
     reveal(el, ms, ctx)  a hover-revealed detail shown for a while (a quest
                          row opening), withdrawn when the performance ends or
                          is stopped
     ghost(fillEl, {...}) a preview on REAL data: a hatched fill runs from the
                          real fill to the target, a label rises, both
                          withdraw. The real figure never moves.

   None of these schedule anything. The Stage decides when; these decide how.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion } from './env'
import { DUR, EASE } from './timing'

const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms))

export const show = (el) => el?.setAttribute('data-shown', '')
export const hide = (el) => el?.removeAttribute('data-shown')

/**
 * Is at least `share` of this element on screen right now? Inside a product
 * frame the frame's cropped body is the screen: a row scrolled out of the
 * crop is not visible just because it is inside the window.
 */
export function inView(el, share = 0.8) {
  if (!el?.isConnected) return false
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return false
  let top = 0
  let bottom = window.innerHeight
  let left = 0
  let right = window.innerWidth
  const crop = el.closest('.pf-body')?.getBoundingClientRect()
  if (crop) {
    top = Math.max(top, crop.top)
    bottom = Math.min(bottom, crop.bottom)
    left = Math.max(left, crop.left)
    right = Math.min(right, crop.right)
  }
  const h = Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top))
  const w = Math.max(0, Math.min(r.right, right) - Math.max(r.left, left))
  return h / r.height >= share && w / r.width >= Math.min(share, 0.9)
}

/** Press a control the way a finger would, then click it. Given the
 *  performance's `ctx`, the hold waits on the Stage's clock — so a scene
 *  stopped mid-press (the reader scrolled away, or touched the frame) lets
 *  go without ever clicking. */
export async function press(el, ctx = null) {
  if (!el?.isConnected) return false
  if (!prefersReducedMotion()) {
    el.setAttribute('data-pressed', '')
    const release = () => el.removeAttribute('data-pressed')
    ctx?.onStop(release)
    await (ctx ? ctx.wait(DUR.micro + DUR.press) : sleep(DUR.micro + DUR.press))
    release()
  }
  if (ctx?.stopped) return false
  if (!el.isConnected || el.disabled) return false
  el.click()
  return true
}

/**
 * Show a hover-revealed state on `el` for `ms` — `data-shown`, an attribute
 * rather than a class, because React rewrites className when the component
 * re-renders mid-scene. Withdrawn early if the performance is stopped.
 * Resolves when it has closed again.
 */
export function reveal(el, ms, ctx) {
  if (!el) return Promise.resolve()
  el.setAttribute('data-shown', '')
  const close = () => el.removeAttribute('data-shown')
  ctx?.onStop(close)
  return new Promise((resolve) => {
    const run = ctx ? ctx.after.bind(ctx) : (t, fn) => window.setTimeout(fn, t)
    run(ms, () => { close(); resolve() })
  })
}

/**
 * Ghost: what finishing this would look like. `track` is the progress track,
 * `from` and `to` are 0–100. Draws a hatched bar over the track (in the fill's
 * own colour, via --ghost), optionally raises a label from `labelFrom`, holds,
 * and withdraws. Returns the total length in ms.
 */
export function ghost(track, { from = 0, to = 100, label = null, labelFrom = null, hold = 1400, ctx = null } = {}) {
  if (!track?.isConnected || prefersReducedMotion()) return 0
  const bar = document.createElement('span')
  bar.className = 'fx-ghost'
  bar.setAttribute('aria-hidden', 'true')
  bar.style.left = `${from}%`
  bar.style.width = `${Math.max(0, to - from)}%`
  if (getComputedStyle(track).position === 'static') track.style.position = 'relative'
  track.appendChild(bar)

  let tag = null
  if (label && labelFrom?.isConnected) {
    tag = document.createElement('span')
    tag.className = 'fx-ghost-label'
    tag.setAttribute('aria-hidden', 'true')
    tag.textContent = label
    if (getComputedStyle(labelFrom).position === 'static') labelFrom.style.position = 'relative'
    labelFrom.appendChild(tag)
    tag.animate(
      [{ opacity: 0, transform: 'translateY(4px) scale(0.9)' }, { opacity: 1, transform: 'translateY(-2px) scale(1)' }],
      { duration: DUR.open, delay: DUR.move, easing: EASE.snap, fill: 'both' },
    )
  }

  bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DUR.settle, easing: EASE.settle, fill: 'both' })

  const total = DUR.settle + hold + DUR.open
  const withdraw = () => {
    const out = { duration: DUR.open, easing: EASE.in, fill: 'forwards' }
    const a = bar.animate([{ opacity: 1 }, { opacity: 0 }], out)
    a.onfinish = () => bar.remove()
    window.setTimeout(() => bar.remove(), DUR.open + 200)
    if (tag) {
      tag.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], out).onfinish = () => tag.remove()
      window.setTimeout(() => tag?.remove(), DUR.open + 200)
    }
  }
  const cleanNow = () => { bar.remove(); tag?.remove() }

  if (ctx) {
    ctx.onStop(cleanNow)
    ctx.after(DUR.settle + hold, withdraw)
  } else {
    window.setTimeout(withdraw, DUR.settle + hold)
  }
  return total
}
