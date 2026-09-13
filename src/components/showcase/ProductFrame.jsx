/* ═══════════════════════════════════════════════════════════════════════════
   ProductFrame.jsx — HOW REAL PRODUCT UI IS PRESENTED ON THE LANDING PAGE
   ---------------------------------------------------------------------------
   A thin window frame around the app's own components, mounted through
   ProgressionShowcase. Nothing inside is redrawn for marketing.

   Revision 2:
     · the frame stands up out of a backward tilt as it enters (Reveal tilt)
     · it leans a couple of degrees toward the pointer, with a warm sheen
     · `scrub` — a cropped surface scrolls its OWN content as the page
       scrolls past it, so the further you read, the more of the course the
       frame shows. Cropping is allowed; altering what is inside is not.
     · the chrome says, truthfully, that what is inside is live
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import Reveal from '../../motion/Reveal'
import { prefersReducedMotion } from '../../motion/env'
import './showcase.css'

export default function ProductFrame({
  path,
  caption,
  maxHeight,
  scrub = false,
  align = 'left',
  children,
}) {
  const figRef = useRef(null)
  const bodyRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    if (!scrub || prefersReducedMotion()) return undefined
    const fig = figRef.current
    const body = bodyRef.current
    const inner = innerRef.current
    if (!fig || !body || !inner) return undefined

    let raf = 0
    const run = () => {
      raf = 0
      const r = fig.getBoundingClientRect()
      const vh = window.innerHeight
      /* 0 when the frame's top enters the bottom of the screen, 1 when its
         bottom reaches the top third. */
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height * 0.6)))
      const overflow = Math.max(0, inner.scrollHeight - body.clientHeight + 40)
      inner.style.transform = `translateY(${(-p * overflow).toFixed(1)}px)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    run()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scrub])

  return (
    <Reveal variant="tilt" threshold={0.12}>
      <figure
        ref={figRef}
        className={`pf fx-sheen${align === 'right' ? ' pf--right' : ''}`}
        data-tilt
      >
        <div className="pf-chrome" aria-hidden="true">
          <span className="pf-crumbs">
            <span className="pf-crumb-root">LunX</span>
            <span className="pf-crumb-sep">/</span>
            {path && <span className="pf-path">{path}</span>}
          </span>
          <span
            className="pf-live"
            data-tip="The real component, running on a demo learner"
          >
            <span className="pf-live-dot" />
            Live
          </span>
        </div>

        <div
          ref={bodyRef}
          className={`pf-body${maxHeight ? ' is-cropped' : ''}${scrub ? ' is-scrub' : ''}`}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <div ref={innerRef} className="pf-inner">{children}</div>
        </div>

        {caption && <figcaption className="pf-caption">{caption}</figcaption>}
      </figure>
    </Reveal>
  )
}
