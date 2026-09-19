/* ═══════════════════════════════════════════════════════════════════════════
   env.js — WHAT THE DEVICE CAN TAKE
   ---------------------------------------------------------------------------
   Every JS-driven motion asks these before it runs. The CSS layer already
   collapses durations under reduced motion; these cover the motion CSS
   cannot see — flights, bursts, tilt and magnet.
   ═══════════════════════════════════════════════════════════════════════════ */

const mq = (query) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false

export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)')

/** A mouse or trackpad: somewhere hover and pointer-following make sense. */
export const hasFinePointer = () => mq('(hover: hover) and (pointer: fine)')

/** The fixed, non-interactive layer every flight, burst and tooltip lives on. */
export function fxLayer() {
  let el = document.getElementById('fx-layer')
  if (!el) {
    el = document.createElement('div')
    el.id = 'fx-layer'
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
  }
  return el
}

/** Center point of an element, a DOMRect, or an {x, y}. */
export function centerOf(source) {
  if (!source) return null
  if (typeof source.getBoundingClientRect === 'function') {
    const r = source.getBoundingClientRect()
    if (!r.width && !r.height) return null
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  if ('left' in source && 'width' in source) {
    return { x: source.left + source.width / 2, y: source.top + source.height / 2 }
  }
  if ('x' in source && 'y' in source) return { x: source.x, y: source.y }
  return null
}
