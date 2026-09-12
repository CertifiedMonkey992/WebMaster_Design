import { useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   useReveal — SCROLL REVEAL, SCOPED TO A SECTION
   ---------------------------------------------------------------------------
   The `.reveal` / `.animate-in` classes existed in the CSS before this pass
   but nothing ever added `animate-in`, so the animation never ran. Rather
   than delete a behaviour the design calls for, it is implemented properly —
   and at the level the design calls for.

   ONE observer per SECTION, not one per card with staggered d1/d2/d3 delays.
   The staggered version is the generated-page signature: it communicates
   nothing except that an IntersectionObserver was installed.

   Returns [ref, animate]. `animate` is true only for a section the reader
   SCROLLED to. Anything already on screen at first paint is skipped, because
   you cannot reveal something the reader has not scrolled to — animating the
   first screen on load only delays reading it.

   The content is never hidden by default (`.reveal` is opacity: 1), so every
   failure path here leaves the page fully readable rather than blank.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function useReveal() {
  const ref = useRef(null)
  const [animate, setAnimate] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || done.current) return undefined

    /* Already on screen at first paint, or no observer available: nothing to
       reveal. Mark it handled and never animate it. */
    const onScreenNow = el.getBoundingClientRect().top < window.innerHeight
    if (onScreenNow || typeof IntersectionObserver === 'undefined') {
      done.current = true
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        done.current = true
        setAnimate(true)
        observer.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, animate]
}
