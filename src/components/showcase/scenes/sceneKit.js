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
import { usePerformer, stageMode } from '../../../motion/stage'
import { onVisibility } from '../../../motion/ambient'
import { DUR } from '../../../motion/timing'
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

/**
 * Keep a scene running for as long as anybody is watching.
 *
 * `useResetWhenAway` alone means a scene that has run its course goes quiet
 * until its frame scrolls off screen — which, for a visitor who parks on the
 * frame, is for ever. In `continuous` mode (MOTION_RULES.md revision 6 → The
 * demonstrations loop) the reset instead becomes a performance of its own:
 * the frame says what is about to happen, the learner goes back to its seed,
 * and the loop starts again. It is narrated for the same reason every other
 * Demonstration is — the visitor must never wonder whether the product is
 * changing numbers at random.
 *
 * In `considered` mode nothing changes: the reset still waits to be unseen.
 */
export function useSceneLoop(test, { id, cue = 'Back to the start' } = {}) {
  const { demo } = useProgression()
  const frame = useFrame()
  const testRef = useLatest(test)

  useResetWhenAway(() => stageMode() !== 'continuous' && testRef.current())

  usePerformer(frame.figureRef, {
    id,
    region: frame.region,
    cue: frame.cue,
    tier: 'minor',
    weight: 0.9,
    cooldown: 4000,
    when: () => stageMode() === 'continuous' && testRef.current(),
    run: async (ctx) => {
      ctx.cue(cue)
      await ctx.wait(DUR.open + 320)
      demo?.reset()
      await ctx.wait(DUR.reveal + 520)
    },
  })
}

export const within = (ref, selector) => ref.current?.querySelector(selector) ?? null
export const allWithin = (ref, selector) => [...(ref.current?.querySelectorAll(selector) ?? [])]
