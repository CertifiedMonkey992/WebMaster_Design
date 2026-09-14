/* ═══════════════════════════════════════════════════════════════════════════
   QuestScene.jsx — THE QUEST FRAME DEMONSTRATES A QUEST
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The sanctioned performances → Quest frame.

     quests:finish  (Major)  the demo learner does what the nearest quest
                             asks — finishes a lesson, or practises — one step
                             at a time; the row that moves opens to show what
                             is left; when it completes, its claim presses and
                             the gems fly to the frame's own gem counter
     quests:day     (Minor)  nothing left within reach: the learner's clock
                             moves to tomorrow and a new set is dealt
     quests:shop    (Accent) something the learner can afford lifts from the
                             shop list

   Which quest, and how many steps, is PLANNED by running the real reducer on
   a copy of the learner — so the scene never promises a completion the engine
   would not produce, whatever quests today's date generated.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression, ACTIONS } from '../../../state/ProgressionContext'
import { reduce, buildViewModel } from '../../../services/progressionService'
import { SHOP_ITEMS } from '../../../config/shopConfig'
import { press, show, hide } from '../../../motion/demo'
import { ring, burst } from '../../../motion/burst'
import { DUR } from '../../../motion/timing'
import { useFramePerformer, useLatest, useResetWhenAway, within, allWithin } from './sceneKit'
import { useFrame } from '../ProductFrame'

const MAX_STEPS = 3

const STEPS = {
  lesson: {
    cue: 'Finishes a lesson',
    action: (vm) => vm.course.current && {
      type: ACTIONS.COMPLETE_LESSON,
      payload: { lessonId: vm.course.current.lesson.id, perfect: true, seconds: 300, accuracy: 1 },
    },
  },
  practice: {
    cue: 'Practises for five minutes',
    action: () => ({ type: ACTIONS.COMPLETE_PRACTICE, payload: { seconds: 300, correct: 6, total: 6 } }),
  },
}

/* Planned once per learner state: the Stage asks `when()` often. */
const plans = new WeakMap()

/** The quickest real route to a completed quest, found on a copy. */
function plan(state, now) {
  if (plans.has(state)) return plans.get(state)
  const best = route(state, now)
  plans.set(state, best)
  return best
}

function route(state, now) {
  let best = null
  for (const kind of Object.keys(STEPS)) {
    let s = state
    for (let step = 1; step <= MAX_STEPS; step++) {
      const action = STEPS[kind].action(buildViewModel(s, now))
      if (!action) break
      s = reduce(s, action, now).state
      const done = s.quests.daily.find((q) => q.completed && !state.quests.daily.find((o) => o.id === q.id)?.completed)
      if (done) {
        if (!best || step < best.steps) best = { kind, steps: step, questId: done.id }
        break
      }
    }
  }
  return best
}

export default function QuestScene() {
  const { vm, demo, dispatch } = useProgression()
  const { figureRef } = useFrame()
  const vmRef = useLatest(vm)

  const claimable = () => vmRef.current.quests.daily.find((q) => q.completed && !q.claimed)
  const rowOf = (id) => within(figureRef, `.qc-compact[data-quest="${CSS.escape(id)}"]`)

  useFramePerformer({
    id: 'quests:finish',
    tier: 'major',
    when: () => Boolean(claimable() || plan(demo.raw(), demo.now())),
    run: async (ctx) => {
      let quest = claimable()
      const opened = new Set()
      const open = (row) => { if (row) { show(row); opened.add(row) } }
      ctx.onStop(() => opened.forEach(hide))

      if (!quest) {
        const path = plan(demo.raw(), demo.now())
        if (!path) return
        for (let i = 0; i < path.steps; i++) {
          ctx.cue(STEPS[path.kind].cue)
          await ctx.wait(i === 0 ? DUR.open + 260 : DUR.open)
          open(rowOf(path.questId))
          const action = STEPS[path.kind].action(vmRef.current)
          if (!action) return
          const events = dispatch(action.type, action.payload)
          const completed = events.some((e) => e.type === 'QUEST_COMPLETED' && e.quest.id === path.questId)
          await ctx.wait(DUR.settle + 480)
          if (completed) {
            /* The row's count turns into a check; the room notices. */
            const row = rowOf(path.questId)
            const icon = row?.querySelector('.qc-compact-icon')
            ring(icon, { color: '--moss', size: 56 })
            burst(icon, { palette: 'moss', count: 10, spread: 34, gravity: 12, duration: 560 })
            ctx.cue('Quest complete')
            await ctx.wait(DUR.celebrate + 300)
          }
        }
        quest = vmRef.current.quests.daily.find((q) => q.id === path.questId && q.completed && !q.claimed)
        if (!quest) return
      }

      const row = rowOf(quest.id)
      open(row)
      ctx.cue(`Claims ${quest.reward.gems} gems`)
      await ctx.wait(DUR.open + 180)
      await press(row?.querySelector('.qc-compact-claim'))
      /* The gems leave the button, arc to the counter and land; it rolls. */
      await ctx.wait(1650)
      opened.forEach(hide)
      await ctx.wait(DUR.open)
    },
  })

  useFramePerformer({
    id: 'quests:day',
    tier: 'minor',
    when: () => !claimable() && !plan(demo.raw(), demo.now()),
    run: async (ctx) => {
      ctx.cue('Next day')
      await ctx.wait(DUR.open + 240)
      demo.nextDay()
      await ctx.wait(DUR.reveal)
      ctx.cue('New quests arrive')
      await ctx.wait(1500)
    },
  })

  useFramePerformer({
    id: 'quests:shop',
    tier: 'accent',
    weight: 0.8,
    run: async (ctx) => {
      const gems = vmRef.current.gems
      const rows = allWithin(figureRef, '.sc-shop-mini-item')
      const affordable = rows.filter((_, i) => (SHOP_ITEMS[i]?.price ?? Infinity) <= gems)
      const pool = affordable.length ? affordable : rows
      const row = pool[Math.floor(Math.random() * pool.length)]
      if (!row) return
      show(row)
      show(row.querySelector('.sc-shop-mini-price'))
      ctx.onStop(() => { hide(row); hide(row.querySelector('.sc-shop-mini-price')) })
      await ctx.wait(1300)
      hide(row)
      hide(row.querySelector('.sc-shop-mini-price'))
      await ctx.wait(DUR.lift)
    },
  })

  /* A week of demo days is plenty; start over while nobody is looking. */
  useResetWhenAway(() => demo.days() >= 4 || vmRef.current.course.completedCount > 12)

  return null
}
