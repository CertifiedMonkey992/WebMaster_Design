/* ═══════════════════════════════════════════════════════════════════════════
   CourseScene.jsx — THE COURSE FRAME FINISHES A LESSON
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The sanctioned performances → Course frame.

     course:lesson  (Major)  the frame's tour takes the reader to the current
                             lesson; the demo learner finishes it; its check
                             stamps, the module's bar and the heading's count
                             move, and the next lesson becomes the one to do —
                             or, at the end of a module, the next module opens

   The tour (motion/tour.js) is the frame's ambient motion; this scene borrows
   it with visit() and hands it back with resume(), so the content never
   jumps and the reader is always shown where the change happens.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { useProgression, ACTIONS } from '../../../state/ProgressionContext'
import { DUR } from '../../../motion/timing'
import { useFramePerformer, useLatest, useResetWhenAway } from './sceneKit'
import { useFrame } from '../ProductFrame'

/* Three lessons a visit: enough to watch the map fill, not enough to finish
   the course in front of the reader. */
const PER_VISIT = 3

export default function CourseScene() {
  const { vm, dispatch } = useProgression()
  const { tourRef } = useFrame()
  const vmRef = useLatest(vm)
  /* Lessons the seed learner had already finished. */
  const seedCount = useRef(null)
  if (seedCount.current === null) seedCount.current = vm.course.completedCount

  useFramePerformer({
    id: 'course:lesson',
    tier: 'major',
    when: () => Boolean(tourRef.current && vmRef.current.course.current)
      && vmRef.current.course.completedCount - seedCount.current < PER_VISIT,
    run: async (ctx) => {
      const tour = tourRef.current
      if (!tour) return
      ctx.onStop(() => tour.resume(900))

      ctx.cue('Up next')
      const arrived = await tour.visit('.lesson-row--current', { place: 0.3 })
      if (ctx.stopped || !arrived) { tour.resume(600); return }

      const current = vmRef.current.course.current
      ctx.cue(`Finishes “${current.lesson.title}”`)
      await ctx.wait(DUR.open + 500)

      const sectionsBefore = vmRef.current.course.completedSections
      dispatch(ACTIONS.COMPLETE_LESSON, { lessonId: current.lesson.id, perfect: true, seconds: 300, accuracy: 1 })
      await ctx.wait(DUR.celebrate + 500)

      const after = vmRef.current.course
      if (after.completedSections > sectionsBefore) ctx.cue('Next module unlocked')
      else if (after.current) ctx.cue('Next lesson unlocked')
      await ctx.wait(1300)
      tour.resume(1400)
    },
  })

  useResetWhenAway(() => vmRef.current.course.completedCount > seedCount.current)

  return null
}
