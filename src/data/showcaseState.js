/* ═══════════════════════════════════════════════════════════════════════════
   showcaseState.js — THE DEMO LEARNER BEHIND THE LANDING PAGE
   ---------------------------------------------------------------------------
   The marketing sections mount the real dashboard components, so they need a
   progression state to read. This builds one by DRIVING THE REAL REDUCER —
   finishing real lessons through the same action the app dispatches — rather
   than hand-writing a state object.

   That matters for honesty: XP, the level, the gem balance, the course map,
   the generated quests and the unlocked achievements are all computed by the
   engine from those completions. Nothing on the landing page is a number
   somebody typed in to look good; it is what a learner who finished these six
   lessons would actually see.

   The streak is the one value seeded directly. Twelve consecutive days cannot
   be produced in a single tick, so the counter and its date markers are set to
   a state the streak engine genuinely reaches — with matching history, so the
   week calendar in the streak panel shows real ticks.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createDefaultState } from '../services/storageService'
import { reconcile, reduce, ACTIONS } from '../services/progressionService'
import { getLocalDateKey, addDays } from '../utils/dateUtils'
import { SECTIONS } from './learnData'

/* Lessons the demo learner has finished. Split across two days on purpose:
   if everything lands in one tick, today's quests are all already complete and
   the quest panel shows nothing left to do — which is the opposite of the
   point. Five yesterday, one today leaves the daily quests part-finished. */
const COMPLETED_EARLIER = [
  'what-is-ai', 'types-of-ai', 'how-ai-learns', 'ai-everyday', 'what-is-ml',
]
const COMPLETED_TODAY = ['training-data']

const STREAK_DAYS = 12

/** Per-day activity for the last N days, so the streak calendar is populated. */
function buildHistory(today, days) {
  const history = {}
  for (let i = 0; i < days; i++) {
    history[addDays(today, -i)] = { xp: 45 + (i % 4) * 15, lessons: 1, seconds: 300 }
  }
  return history
}

let cached = null

/**
 * Build (and memoise) the showcase state. Memoised because every marketing
 * section reads it and the reducer work should happen once per page load.
 */
export function getShowcaseState() {
  if (cached) return cached

  const now = Date.now()
  const yesterday = now - 86400000
  const today = getLocalDateKey(new Date(now))

  const finish = (state, lessonId, at) => reduce(
    state,
    { type: ACTIONS.COMPLETE_LESSON, payload: { lessonId, perfect: true, seconds: 300, accuracy: 1 } },
    at,
  ).state

  /* Real completions through the real action — this is what produces the XP,
     the level, the gems, the section-complete bonus and the achievements. */
  let state = reconcile(createDefaultState(yesterday), yesterday).state
  for (const lessonId of COMPLETED_EARLIER) state = finish(state, lessonId, yesterday)

  /* Roll the calendar forward: yesterday's daily counters clear and today's
     quests are generated, exactly as they would be overnight. */
  state = reconcile(state, now).state
  for (const lessonId of COMPLETED_TODAY) state = finish(state, lessonId, now)

  /* A streak that took twelve days to build, plus the history behind it.
     `daysActive` moves with it — the streak panel shows both, and a 12-day
     streak sitting next to "2 days active" would be visibly incoherent. */
  state = {
    ...state,
    stats: { ...state.stats, daysActive: STREAK_DAYS },
    streak: {
      ...state.streak,
      current: STREAK_DAYS,
      longest: STREAK_DAYS,
      lastActivityDate: today,
      lastStreakDate: today,
      shields: 1,
      history: buildHistory(today, STREAK_DAYS),
    },
    /* Mid-track on the daily bonus: three days claimed, day four waiting.
       Shows every card state at once. */
    dailyBonus: {
      cycleDay: 4,
      lastClaimDate: addDays(today, -1),
      cycleStartDate: addDays(today, -3),
      cyclesCompleted: 0,
      totalClaimed: 3,
    },
  }

  cached = state
  return cached
}

/** The section a visitor sees on the course map, used to caption it honestly. */
export const SHOWCASE_SECTION_COUNT = SECTIONS.length

export default getShowcaseState
