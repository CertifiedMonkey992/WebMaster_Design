/* ═══════════════════════════════════════════════════════════════════════════
   WheelScene.jsx — THE SPIN FRAME SPINS
   ---------------------------------------------------------------------------
   MOTION_RULES.md → The sanctioned performances → Spin frame.

     wheel:spin  (Major)   a spin is waiting: the Spin button presses and the
                           wheel's own sequence runs — the real draw, the
                           disc slowing onto the result, the reward flying to
                           its counter in the frame's top bar
     wheel:day   (Minor)   today's spin is used: the learner's clock moves on
                           a day and a new spin becomes available

   The wheel is the real component with its real spin handler; the learner
   is the frame's demo learner (real reducer, in memory, never saved), so
   what it wins is a genuine draw with the published odds.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../../state/ProgressionContext'
import { press } from '../../../motion/demo'
import { DUR } from '../../../motion/timing'
import { useFramePerformer, useLatest, useSceneLoop, within } from './sceneKit'
import { useFrame } from '../ProductFrame'

export default function WheelScene() {
  const { vm, demo } = useProgression()
  const { figureRef } = useFrame()
  const vmRef = useLatest(vm)

  useFramePerformer({
    id: 'wheel:spin',
    tier: 'major',
    when: () => vmRef.current.wheel.available,
    run: async (ctx) => {
      ctx.cue('Spins the wheel')
      await ctx.wait(DUR.open + 380)
      const ok = await press(within(figureRef, '.wh-spin'), ctx)
      if (!ok) return
      /* The disc turns and slows, then the reward flies to its counter. */
      await ctx.wait(DUR.spin + 900)
      const won = vmRef.current.wheel.lastSpin?.granted?.label
      if (won) ctx.cue(`Won ${won}`)
      await ctx.wait(1800)
    },
  })

  useFramePerformer({
    id: 'wheel:day',
    tier: 'minor',
    when: () => !vmRef.current.wheel.available,
    run: async (ctx) => {
      ctx.cue('Next day')
      await ctx.wait(DUR.open + 240)
      demo.nextDay()
      await ctx.wait(DUR.reveal)
      ctx.cue('A new spin is ready')
      await ctx.wait(1500)
    },
  })

  /* A few days of spins — then start over while nobody is looking. */
  useSceneLoop(() => demo.days() >= 5, { id: 'wheel:loop', cue: 'Back to the first day' })

  return null
}
