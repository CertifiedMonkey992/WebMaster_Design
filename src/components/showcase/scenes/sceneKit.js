/* ═══════════════════════════════════════════════════════════════════════════
   sceneKit.js — WHAT EVERY LANDING-PAGE SCENE SHARES
   ---------------------------------------------------------------------------
   A scene is a component rendered inside a ProductFrame, inside that frame's
   demo learner. It registers the frame's performances with the Stage
   (MOTION_RULES.md revision 5 → The sanctioned performances) and drives the
   learner through the real reducer.

     useFramePerformer(spec)   usePerformer on the frame, with the frame's
                               region and its cue
     useLatest(value)          a ref that always holds the latest value, for
                               scripts that await across re-renders
     useResetWhenAway(test)    return the demo learner to its seed once its
                               frame is off screen, if test() says the scene
                               has run its course — nobody watches a figure
                               run backwards
     within(ref, selector)     querySelector inside the frame
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { useProgression } from '../../../state/ProgressionContext'
import { usePerformer } from '../../../motion/stage'
import { onVisibility } from '../../../motion/ambient'
import { useFrame } from '../ProductFrame'

export function useFramePerformer(spec) {
  const frame = useFrame()
  usePerformer(frame.figureRef, { region: frame.region, cue: frame.cue, ...spec })
}

export function useLatest(value) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

export function useResetWhenAway(test) {
  const { demo } = useProgression()
  const { figureRef } = useFrame()
  const testRef = useLatest(test)
  useEffect(() => {
    const el = figureRef.current
    if (!el || !demo) return undefined
    return onVisibility(el, (on) => {
      if (!on && testRef.current()) demo.reset()
    })
  }, [demo, figureRef, testRef])
}

export const within = (ref, selector) => ref.current?.querySelector(selector) ?? null
export const allWithin = (ref, selector) => [...(ref.current?.querySelectorAll(selector) ?? [])]
