/* ═══════════════════════════════════════════════════════════════════════════
   BonusScene.jsx — THE BONUS FRAME CLAIMS ITS WAY ALONG THE TRACK
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The sanctioned performances → Bonus frame.

     bonus:claim  (Major)   today's reward is waiting: the claim button
                            presses and the track's own claim sequence runs —
                            the art charges and bursts, the reward flies to
                            its counter in the top bar, the day turns over
     bonus:day    (Minor)   today is claimed: the learner's clock moves on and
                            tomorrow's card becomes today
     bonus:peek   (Accent)  a day still to come lifts to show what it holds

   The track is the real component with its real claim handler; the learner
   is the frame's demo learner, so day 7 really pays a Streak Shield and a
   finished track really starts again at day 1.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../../state/ProgressionContext'
import { press, show, hide } from '../../../motion/demo'
import { DUR } from '../../../motion/timing'
import { useFramePerformer, useLatest, useSceneLoop, within, allWithin } from './sceneKit'
import { useFrame } from '../ProductFrame'

export default function BonusScene() {
  const { vm, demo } = useProgression()
  const { figureRef } = useFrame()
  const vmRef = useLatest(vm)

  useFramePerformer({
    id: 'bonus:claim',
    tier: 'major',
    when: () => vmRef.current.dailyBonus.available,
    run: async (ctx) => {
      const { nextDay, todayReward } = vmRef.current.dailyBonus
      ctx.cue(`Claims day ${nextDay}: ${todayReward?.label ?? 'reward'}`)
      await ctx.wait(DUR.open + 380)
      const ok = await press(within(figureRef, '.db-hero .db-claim-btn'), ctx)
      if (!ok) return
      /* charge 300 → burst and flight → the card turns → the receipt. */
      await ctx.wait(1500)
      ctx.cue(`${todayReward?.label ?? 'Reward'} added`)
      await ctx.wait(1600)
    },
  })

  useFramePerformer({
    id: 'bonus:day',
    tier: 'minor',
    when: () => !vmRef.current.dailyBonus.available,
    run: async (ctx) => {
      ctx.cue('Next day')
      await ctx.wait(DUR.open + 240)
      demo.nextDay()
      await ctx.wait(DUR.reveal)
      const { nextDay, todayReward } = vmRef.current.dailyBonus
      ctx.cue(`Day ${nextDay} unlocks: ${todayReward?.label ?? ''}`.trim())
      await ctx.wait(1500)
    },
  })

  useFramePerformer({
    id: 'bonus:peek',
    tier: 'accent',
    run: async (ctx) => {
      const days = allWithin(figureRef, '.db-day.is-locked, .db-day.is-next')
      const day = days[Math.floor(Math.random() * days.length)]
      if (!day) return
      show(day)
      ctx.onStop(() => hide(day))
      await ctx.wait(1250)
      hide(day)
      await ctx.wait(DUR.lift)
    },
  })

  /* A whole track (and a little) — then start over while nobody is looking. */
  useSceneLoop(() => demo.days() >= 5, { id: 'bonus:loop', cue: 'A new week begins' })

  return null
}
