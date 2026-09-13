/* ═══════════════════════════════════════════════════════════════════════════
   ambient.js — ALIVE, BUT ONLY WHERE SOMEONE CAN SEE IT
   ---------------------------------------------------------------------------
   Ambient loops (MOTION_RULES.md → Ambient) cost frames whether or not they
   are on screen. One shared IntersectionObserver marks every registered
   element `data-offscreen` while it is out of view, and CSS pauses the loops
   inside it:

     [data-offscreen] .anything { animation-play-state: paused }

   The rule lives in motion.css, so a component only has to attach the ref.
   Under reduced motion the loops are off anyway; the observer still runs so
   JS consumers (the ticker, the book's springs) can ask `isOnScreen(el)`.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useRef } from 'react'

const visible = new WeakMap()
const listeners = new WeakMap()
let observer = null

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const on = entry.isIntersecting
        visible.set(entry.target, on)
        if (on) entry.target.removeAttribute('data-offscreen')
        else entry.target.setAttribute('data-offscreen', '')
        listeners.get(entry.target)?.forEach((fn) => fn(on))
      }
    },
    /* A little margin so a loop is already running as it scrolls in. */
    { rootMargin: '120px 0px 120px 0px' },
  )
  return observer
}

/** Is a registered element currently near the viewport? Unregistered → true. */
export function isOnScreen(el) {
  if (!el) return false
  return visible.has(el) ? visible.get(el) : true
}

/** Be told when a registered element enters or leaves the viewport. */
export function onVisibility(el, fn) {
  if (!el) return () => {}
  if (!listeners.has(el)) listeners.set(el, new Set())
  listeners.get(el).add(fn)
  return () => listeners.get(el)?.delete(fn)
}

/**
 * A callback ref that registers an element as an ambient host.
 * Pass an optional ref to receive the node as well.
 */
export default function useAmbient(forwardRef) {
  const current = useRef(null)
  return useCallback((node) => {
    const io = getObserver()
    if (current.current && io) io.unobserve(current.current)
    current.current = node
    if (forwardRef) forwardRef.current = node
    if (node && io) io.observe(node)
  }, [forwardRef])
}
