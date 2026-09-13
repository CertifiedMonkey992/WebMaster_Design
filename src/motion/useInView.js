/* ═══════════════════════════════════════════════════════════════════════════
   useInView.js — ONCE, WHEN IT IS FIRST SEEN
   ---------------------------------------------------------------------------
   Returns [ref, inView]. Flips true the first time the element crosses the
   threshold and never flips back, so an entrance plays once per element and a
   re-render can never replay it.

   Unlike the old useReveal, content that is already on screen at first paint
   DOES animate — revision 2 treats arrival as a Report. `immediate` skips the
   observer entirely for things that should assemble on mount (the hero).

   Every failure path — no observer, reduced motion — returns true, so the
   content is never left hidden.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './env'

export default function useInView({
  threshold = 0.18,
  rootMargin = '0px 0px -6% 0px',
  immediate = false,
  delay = 0,
} = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (inView) return undefined
    const el = ref.current

    let timer = 0
    let raf1 = 0
    let raf2 = 0
    let backup = 0
    const show = () => {
      /* Two frames so the hidden state is painted before the class lands —
         otherwise the browser coalesces both and nothing travels. A timer
         races the frames: a background tab renders none, and content must
         never wait on a frame that is not coming. */
      let fired = false
      const go = () => {
        if (fired) return
        fired = true
        timer = window.setTimeout(() => setInView(true), delay)
      }
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(go)
      })
      backup = window.setTimeout(go, 150)
    }

    if (immediate || !el || typeof IntersectionObserver === 'undefined') {
      show()
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timer); clearTimeout(backup) }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        show()
      },
      { threshold, rootMargin },
    )
    observer.observe(el)

    /* Safety net: a tab opened in the background never intersects until it
       is looked at, and a hidden section must never stay hidden forever. */
    const fallback = window.setTimeout(() => {
      if (document.hidden) setInView(true)
    }, 2500)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(timer)
      clearTimeout(backup)
      clearTimeout(fallback)
    }
  }, [inView, immediate, threshold, rootMargin, delay])

  return [ref, inView]
}
