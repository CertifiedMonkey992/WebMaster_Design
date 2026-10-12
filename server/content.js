/* ═══════════════════════════════════════════════════════════════════════════
   content.js — THE COURSE, AS THE SERVER SEES IT
   ---------------------------------------------------------------------------
   The server grades answers itself, with the SAME course files and the SAME
   grading function the app uses (src/data/course, src/utils/stepLogic.js),
   imported directly — there is no second copy of any answer key to drift.

     QUESTIONS   every gradable step: "item:part:step" → the step, its item,
                 module and concept, and whether its part is graded
     GRADED      per item, the keys of its graded questions (a Check, a
                 Checkpoint) — what a completion must have answered
   ═══════════════════════════════════════════════════════════════════════════ */

import { SECTIONS, ALL_LESSONS, getLessonById, getSectionById, deriveCourse, isLesson } from '../src/data/learnData.js'
import { isGradable, isAnswerCorrect } from '../src/utils/stepLogic.js'
import { conceptOf } from '../src/data/concepts.js'
import m01 from '../src/data/course/m01.js'
import m02 from '../src/data/course/m02.js'
import m03 from '../src/data/course/m03.js'
import m04 from '../src/data/course/m04.js'
import m05 from '../src/data/course/m05.js'
import m06 from '../src/data/course/m06.js'
import m07 from '../src/data/course/m07.js'

const CONTENT = { ...m01, ...m02, ...m03, ...m04, ...m05, ...m06, ...m07 }

export const QUESTIONS = new Map()
export const GRADED = new Map()

for (const [itemId, content] of Object.entries(CONTENT)) {
  const item = getLessonById(itemId)
  if (!item) continue
  const graded = []
  for (const tab of content.tabs) {
    for (const step of tab.steps) {
      if (!isGradable(step)) continue
      const key = `${itemId}:${tab.id}:${step.id}`
      QUESTIONS.set(key, {
        key,
        step,
        itemId,
        moduleId: item.sectionId,
        concept: conceptOf(key),
        graded: Boolean(tab.graded),
      })
      if (tab.graded) graded.push(key)
    }
  }
  GRADED.set(itemId, graded)
}

/** Only the fields grading reads, with their types checked. */
export function cleanAnswer(raw) {
  const a = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  if (typeof a.selected === 'string' || typeof a.selected === 'number') out.selected = String(a.selected).slice(0, 80)
  if (Array.isArray(a.filled)) out.filled = a.filled.slice(0, 8).map((x) => (typeof x === 'string' ? x.slice(0, 80) : null))
  if (a.assign && typeof a.assign === 'object' && !Array.isArray(a.assign)) {
    out.assign = {}
    for (const [k, v] of Object.entries(a.assign).slice(0, 24)) if (typeof v === 'string') out.assign[String(k).slice(0, 16)] = v.slice(0, 40)
  }
  if (typeof a.value === 'string' || typeof a.value === 'number') out.value = String(a.value).slice(0, 40)
  return out
}

/** Grade an answer: true, false, or null for a key the course does not have. */
export function grade(key, answer) {
  const q = QUESTIONS.get(key)
  if (!q) return null
  return isAnswerCorrect(q.step, { filled: [], selected: null, assign: {}, value: '', ...cleanAnswer(answer) }) === true
}

/** The items a learner may open, from what they have finished (the app's own rule). */
export function playableItems(completedIds, unlockAll = false) {
  return new Set(deriveCourse(completedIds, { unlockAll }).playableLessonIds)
}

export { SECTIONS, ALL_LESSONS, getLessonById, getSectionById, isLesson }

export default { QUESTIONS, GRADED, cleanAnswer, grade, playableItems }
