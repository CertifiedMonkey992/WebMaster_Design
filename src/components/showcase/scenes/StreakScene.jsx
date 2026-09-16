/* ═══════════════════════════════════════════════════════════════════════════
   StreakScene.jsx — THE STREAK FRAME KEEPS A DAY
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The sanctioned performances → Streak frame.

     streak:day    (Major)   a new day begins and the flame goes at risk —
                             paler, swaying, today's square waiting; the demo
                             learner practises and the day is kept: the flame
                             flares, the figure rolls, today's square stamps,
                             the marker walks on. At a milestone the stone
                             pays its gems into the gem pill.
     streak:heart  (Minor)   a wrong answer costs a heart — it cracks and
                             drops — and the recovery ring gives it back
     streak:gem    (Accent)  the gem pill tips toward the light

   Everything is the engine's: the streak only rises because updateStreak saw
   a qualifying activity on the day after the last one.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, ACTIONS } from '../../../state/ProgressionContext'
import { show, hide } from '../../../motion/demo'
import { fly, hold } from '../../../motion/flight'
import { ring } from '../../../motion/burst'
import { DUR } from '../../../motion/timing'
import { useFramePerformer, useLatest, useSceneLoop, within, allWithin } from './sceneKit'
import { useFrame } from '../ProductFrame'

export default function StreakScene() {
  const { vm, demo, dispatch } = useProgression()
  const { figureRef } = useFrame()
  const vmRef = useLatest(vm)

  useFramePerformer({
    id: 'streak:day',
    tier: 'major',
    run: async (ctx) => {
      if (vmRef.current.activeToday) {
        ctx.cue('Next day')
        await ctx.wait(DUR.open + 240)
        demo.nextDay()
        /* The flame pales and sways; today's square waits. Let it be seen. */
        await ctx.wait(1500)
      }

      ctx.cue('Practises for five minutes')
      await ctx.wait(DUR.open + 420)

      const before = vmRef.current
      const milestone = before.nextMilestone?.remaining === 1 ? before.nextMilestone : null
      const release = milestone ? hold('gems', 3200) : null
      ctx.onStop(() => release?.())

      dispatch(ACTIONS.COMPLETE_PRACTICE, { seconds: 300, correct: 6, total: 6 })
      ctx.cue(`${before.streak + 1} days in a row`)
      await ctx.wait(DUR.celebrate + 300)

      if (milestone) {
        const stone = allWithin(figureRef, '.pg-stone').find((s) => s.textContent.trim() === String(milestone.target))
        ctx.cue(`Milestone: +${milestone.gems} gems`)
        ring(stone, { color: '--clay', size: 52 })
        await ctx.wait(DUR.move)
        fly({ from: stone, to: 'gems', icon: 'gem', count: 6, amount: milestone.gems, onLand: release })
        await ctx.wait(1700)
      } else {
        await ctx.wait(700)
      }
    },
  })

  useFramePerformer({
    id: 'streak:heart',
    tier: 'minor',
    /* A heart spent and refilled is a story worth telling now and then, not
       every few seconds. */
    cooldown: 20000,
    when: () => vmRef.current.hearts >= 2,
    run: async (ctx) => {
      ctx.cue('Answers wrong: loses a heart')
      await ctx.wait(DUR.open + 300)
      dispatch(ACTIONS.LOSE_HEART, { reason: 'mistake' })
      await ctx.wait(1700)
      ctx.cue('Hearts refill over time')
      await ctx.wait(DUR.open)
      dispatch(ACTIONS.RESTORE_HEART, { count: 1, reason: 'recovery' })
      await ctx.wait(1300)
    },
  })

  useFramePerformer({
    id: 'streak:gem',
    tier: 'accent',
    run: async (ctx) => {
      const pill = within(figureRef, '.pg-pill--gems')
      if (!pill) return
      show(pill)
      ctx.onStop(() => hide(pill))
      await ctx.wait(DUR.celebrate + 200)
      hide(pill)
      await ctx.wait(DUR.move)
    },
  })

  useSceneLoop(() => demo.days() >= 6, { id: 'streak:loop', cue: 'A new week begins' })

  return null
}
