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
     · it floats on a slow parallax against the copy beside it
     · it leans a couple of degrees toward the pointer, with a warm sheen
     · `scrub` — a cropped surface scrolls its OWN content as the page scrolls
       past it, so the further you read, the more of the course the frame
       shows. Cropping is allowed; altering what is inside is not.
     · the chrome says, truthfully, that what is inside is live
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useRef } from 'react'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import { useScrollProgress } from '../../motion/scroll'
import './showcase.css'

export default function ProductFrame({
  path,
  caption,
  maxHeight,
  scrub = false,
  side = 'right',
  children,
}) {
  const bodyRef = useRef(null)
  const innerRef = useRef(null)
  const [seenRef, seen] = useInView({ threshold: 0.25 })

  const scrubRef = useScrollProgress({
    cssVar: null,
    disabled: !scrub,
    onProgress: (p) => {
      const body = bodyRef.current
      const inner = innerRef.current
      if (!body || !inner) return
      const overflow = Math.max(0, inner.scrollHeight - body.clientHeight + 40)
      /* Starts once the frame is well into view, finishes as it leaves. */
      const t = Math.max(0, Math.min(1, (p - 0.2) / 0.62))
      inner.style.transform = `translate3d(0, ${(-t * overflow).toFixed(1)}px, 0)`
    },
  })

  const figRef = useCallback((node) => { seenRef.current = node; scrubRef(node) }, [seenRef, scrubRef])

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

        <div
          ref={bodyRef}
          className={`pf-body${maxHeight ? ' is-cropped' : ''}${scrub ? ' is-scrub' : ''}`}
          style={maxHeight ? { maxHeight } : undefined}
        >
          {/* A scrubbing frame is watch-only: its content slides under the pointer
              with the page, and its lesson buttons are a demo that goes nowhere —
              the landing page's only routes into the course are the navbar and
              the closing CTA. */}
          <div ref={innerRef} className="pf-inner" {...(scrub ? { inert: '' } : {})}>{children}</div>
        </div>

        {caption && <figcaption className="pf-caption">{caption}</figcaption>}
      </figure>
    </Reveal>
  )
}
