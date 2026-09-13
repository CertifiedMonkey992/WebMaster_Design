/* ═══════════════════════════════════════════════════════════════════════════
   ProductFrame.jsx — HOW REAL PRODUCT UI IS PRESENTED ON THE LANDING PAGE
   ---------------------------------------------------------------------------
   A thin window frame around the app's own components, mounted through
   ProgressionShowcase. Nothing inside is redrawn for marketing.

   Motion (MOTION_RULES.md → Scroll):
     · it stands up out of a backward tilt as it enters, sliding in from the
       side of the page it lives on
     · the real components inside keep their OWN entrance animations paused
       until the frame is actually seen (.pf:not(.is-seen) in showcase.css) —
       so the day tiles are dealt, the hearts pop in and the quest bars fill
       for the reader, not offscreen at page load
     · it is an AMBIENT HOST: every loop and idle event inside it stops while
       it is offscreen
     · it floats on a slow parallax against the copy beside it
     · it leans a couple of degrees toward the pointer, with a warm sheen
     · `tour` (revision 4) — a cropped surface TOURS its own content: it holds
       at the top, glides to the thing worth seeing, holds, glides on, and
       comes back round (motion/tour.js). A slim thumb on the frame's edge
       travels with it. The pointer on the frame holds the tour still; it is
       paused offscreen. Under reduced motion there is no tour and the frame
       simply scrolls by hand. (Revision 3 scrubbed the content with the page
       scroll, so it only moved while the reader was scrolling past it.)
     · the chrome says, truthfully, that what is inside is live
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import useAmbient, { onVisibility } from '../../motion/ambient'
import { createTour } from '../../motion/tour'
import { prefersReducedMotion } from '../../motion/env'
import './showcase.css'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function ProductFrame({
  path,
  caption,
  maxHeight,
  tour = null,
  side = 'right',
  children,
}) {
  const figureRef = useRef(null)
  const bodyRef = useRef(null)
  const innerRef = useRef(null)
  const thumbRef = useRef(null)
  const [seenRef, seen] = useInView({ threshold: 0.25 })
  const ambientRef = useAmbient(figureRef)
  const [manual] = useState(() => Boolean(tour) && prefersReducedMotion())

  const figRef = useCallback((node) => { seenRef.current = node; ambientRef(node) }, [seenRef, ambientRef])

  /* ── The tour ── */
  const stopsRef = useRef(tour)
  stopsRef.current = tour

  useEffect(() => {
    const figure = figureRef.current
    const body = bodyRef.current
    const inner = innerRef.current
    if (!stopsRef.current || manual || !seen || !figure || !body || !inner) return undefined

    const t = createTour({
      viewport: body,
      content: inner,
      thumb: thumbRef.current,
      stops: (ctx) => stopsRef.current(ctx, clamp),
    })

    /* The hand holds it still; it picks up again a moment after the hand
       leaves, so a reader moving across the frame does not restart it. */
    let resume = 0
    const enter = () => { clearTimeout(resume); t.hold('hand') }
    const leave = () => { clearTimeout(resume); resume = window.setTimeout(() => t.release('hand'), 700) }
    figure.addEventListener('pointerenter', enter)
    figure.addEventListener('pointerleave', leave)

    const offVisibility = onVisibility(figure, (on) => (on ? t.release('offscreen') : t.hold('offscreen')))
    const onHidden = () => (document.hidden ? t.hold('hidden') : t.release('hidden'))
    document.addEventListener('visibilitychange', onHidden)

    return () => {
      clearTimeout(resume)
      figure.removeEventListener('pointerenter', enter)
      figure.removeEventListener('pointerleave', leave)
      offVisibility()
      document.removeEventListener('visibilitychange', onHidden)
      t.destroy()
    }
  }, [seen, manual])

  return (
    <Reveal variant="tilt" threshold={0.12} style={{ '--side': side === 'left' ? -1 : 1 }}>
      <figure
        ref={figRef}
        className={`pf fx-sheen${seen ? ' is-seen' : ''}`}
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

        <div className="pf-viewport">
          <div
            ref={bodyRef}
            className={`pf-body${maxHeight ? ' is-cropped' : ''}${tour ? (manual ? ' is-manual' : ' is-tour') : ''}`}
            style={maxHeight ? { maxHeight } : undefined}
          >
            {/* A touring frame is watch-only: its content moves by itself, and
                its lesson buttons are a demo that goes nowhere — the landing
                page's only routes into the course are the navbar and the
                closing CTA. */}
            <div ref={innerRef} className="pf-inner" {...(tour ? { inert: '' } : {})}>{children}</div>
          </div>
          {/* The thumb sits outside the body's crop fade, so it never fades
              out at the ends of its track. */}
          {tour && !manual && (
            <span className="pf-scroll" aria-hidden="true"><span ref={thumbRef} className="pf-scroll-thumb" /></span>
          )}
        </div>

        {caption && <figcaption className="pf-caption">{caption}</figcaption>}
      </figure>
    </Reveal>
  )
}
