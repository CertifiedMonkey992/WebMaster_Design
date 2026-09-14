/* ═══════════════════════════════════════════════════════════════════════════
   ProductFrame.jsx — HOW REAL PRODUCT UI IS PRESENTED ON THE LANDING PAGE
   ---------------------------------------------------------------------------
   A thin window frame around the app's own components, mounted through a
   demo learner (ProgressionDemo). Nothing inside is redrawn for marketing.

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
       simply scrolls by hand.
     · the chrome says, truthfully, that what is inside is live

   Revision 5 — a frame is a STAGE REGION with a demo scene:
     · `scene` is a component rendered inside the frame (not inside the inert
       content) that registers the frame's performances with the Stage and
       drives the demo learner
     · the chrome NARRATES: a scene calls cue('Finishes a lesson') before the
       effect lands, so a visitor always knows what they are watching; the
       words rise in, the old line leaves upward, and the Live dot beats
       faster while a scene plays
     · the frame is a FLIGHT SCOPE: a reward earned inside it lands on the
       counter inside it, not on another frame's counter elsewhere on the page
   ═══════════════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Reveal from '../../motion/Reveal'
import useInView from '../../motion/useInView'
import useAmbient, { onVisibility } from '../../motion/ambient'
import { createTour } from '../../motion/tour'
import { prefersReducedMotion } from '../../motion/env'
import { DUR } from '../../motion/timing'
import './showcase.css'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const FrameContext = createContext(null)

/** Inside a frame: { cue(text), figureRef, tourRef, region }. */
export function useFrame() {
  return useContext(FrameContext)
}

/* The narration line. The newest cue's words rise in one after another; the
   line it replaces leaves upward on the same clock. */
function Cue({ cue, leaving }) {
  return (
    <span className="pf-cue">
      {leaving && (
        <span className="pf-cue-line is-leaving" key={`l${leaving.n}`}>{leaving.text}</span>
      )}
      {cue.text && (
        <span className="pf-cue-line" key={`c${cue.n}`}>
          {cue.text.split(' ').map((word, i) => (
            <span className="pf-cue-w" key={i} style={{ '--i': i }}>{word}{' '}</span>
          ))}
        </span>
      )}
    </span>
  )
}

export default function ProductFrame({
  path,
  caption,
  maxHeight,
  tour = null,
  side = 'right',
  region = null,
  scene = null,
  children,
}) {
  const figureRef = useRef(null)
  const bodyRef = useRef(null)
  const innerRef = useRef(null)
  const thumbRef = useRef(null)
  const tourRef = useRef(null)
  const [seenRef, seen] = useInView({ threshold: 0.25 })
  const ambientRef = useAmbient(figureRef)
  const [manual] = useState(() => Boolean(tour) && prefersReducedMotion())

  const figRef = useCallback((node) => { seenRef.current = node; ambientRef(node) }, [seenRef, ambientRef])

  /* ── Narration ── */
  const [cue, setCue] = useState({ text: null, n: 0 })
  const [leaving, setLeaving] = useState(null)
  const cueRef = useRef(cue)
  const leaveTimer = useRef(0)
  const say = useCallback((text) => {
    const prev = cueRef.current
    const next = text || null
    if (prev.text === next) return
    if (prev.text) {
      setLeaving({ text: prev.text, n: prev.n })
      clearTimeout(leaveTimer.current)
      leaveTimer.current = window.setTimeout(() => setLeaving(null), DUR.move + 40)
    }
    const value = { text: next, n: prev.n + 1 }
    cueRef.current = value
    setCue(value)
  }, [])
  useEffect(() => () => clearTimeout(leaveTimer.current), [])

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
    tourRef.current = t

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
      tourRef.current = null
    }
  }, [seen, manual])

  const frame = useMemo(() => ({ cue: say, figureRef, tourRef, region: region ?? path }), [say, region, path])

  return (
    <FrameContext.Provider value={frame}>
      <Reveal variant="tilt" threshold={0.12} style={{ '--side': side === 'left' ? -1 : 1 }}>
        <figure
          ref={figRef}
          className={`pf fx-sheen${seen ? ' is-seen' : ''}${cue.text ? ' is-acting' : ''}`}
          data-tilt
          data-flight-scope=""
          data-stage-region={region ?? path}
        >
          <div className="pf-chrome" aria-hidden="true">
            <span className="pf-crumbs">
              <span className="pf-crumb-root">LunX</span>
              <span className="pf-crumb-sep">/</span>
              {path && <span className="pf-path">{path}</span>}
            </span>
            <Cue cue={cue} leaving={leaving} />
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
          {seen && scene}
        </figure>
      </Reveal>
    </FrameContext.Provider>
  )
}
