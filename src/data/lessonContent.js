/* ═══════════════════════════════════════════════════════════════════════════
   lessonContent.js — WHERE A LESSON'S STEPS COME FROM
   ---------------------------------------------------------------------------
   The course's content lives in src/data/course/, one file per module, and
   each file is its own chunk: opening a lesson fetches its module's steps
   and nothing else. This file is the one door to them —

     loadLessonContent(id)   → Promise<content>   (fetch once, then cached)
     getLessonContent(id)    → content | null     (only what is loaded)
     useLessonContent(id)    → content | null     (React; re-renders on load)

   and the one place that knows how a lesson is shaped:

     content = { title, subtitle, takeaway, tabs: [{ id, label, graded?, steps }] }

   A lesson's tabs are its three PARTS (8.15 of the course plan): explore,
   explain & apply, check. Only a part marked `graded` spends hearts.

   Practice draws from the same content — graded steps of what the learner
   has finished, with the items they missed first.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { getLessonById } from './learnData'
import { isGradable } from '../utils/stepLogic'

const MODULES = {
  m01: () => import('./course/m01.js'),
  m02: () => import('./course/m02.js'),
  m03: () => import('./course/m03.js'),
  m04: () => import('./course/m04.js'),
  m05: () => import('./course/m05.js'),
  m06: () => import('./course/m06.js'),
  m07: () => import('./course/m07.js'),
}

/* Which content file holds an item. The Part projects sit with the module
   that closes their Part. */
export function moduleKeyOf(itemId) {
  if (typeof itemId !== 'string') return null
  if (itemId.startsWith('p1-')) return 'm03'
  if (itemId.startsWith('p2-')) return 'm05'
  const key = itemId.slice(0, 3)
  return MODULES[key] ? key : null
}

const cache = new Map()      // itemId -> content
const pending = new Map()    // moduleKey -> Promise

function loadModule(key) {
  if (!MODULES[key]) return Promise.resolve()
  if (!pending.has(key)) {
    pending.set(key, MODULES[key]().then((mod) => {
      for (const [id, content] of Object.entries(mod.default ?? {})) cache.set(id, content)
    }).catch((error) => {
      pending.delete(key)
      throw error
    }))
  }
  return pending.get(key)
}

/** Fetch an item's content (and the rest of its module). */
export async function loadLessonContent(itemId) {
  if (cache.has(itemId)) return cache.get(itemId)
  const key = moduleKeyOf(itemId)
  if (!key) return null
  await loadModule(key)
  return cache.get(itemId) ?? null
}

/** An item's content if it has already been fetched, else null. */
export function getLessonContent(itemId) {
  return cache.get(itemId) ?? null
}

/** Warm the content for several items at once (Practice uses this). */
export function preloadContent(itemIds = []) {
  const keys = [...new Set(itemIds.map(moduleKeyOf).filter(Boolean))]
  return Promise.all(keys.map((k) => loadModule(k).catch(() => {})))
}

/** The content for an item, loading it if need be. */
export function useLessonContent(itemId) {
  const [content, setContent] = useState(() => getLessonContent(itemId))
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    setFailed(false)
    const ready = getLessonContent(itemId)
    if (ready) { setContent(ready); return undefined }
    setContent(null)
    loadLessonContent(itemId)
      .then((c) => { if (alive) { setContent(c); if (!c) setFailed(true) } })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [itemId])
  return { content, failed }
}

/** Every step, in order, with where it sits. */
export function flattenSteps(content) {
  if (!content) return []
  return content.tabs.flatMap((tab, t) => tab.steps.map((step, s) => ({ step, tab, t, s })))
}

/** Total number of steps in an item. */
export function countSteps(content) {
  return content ? content.tabs.reduce((sum, tab) => sum + tab.steps.length, 0) : 0
}

/** Steps that can cost a heart and pay answer XP: gradable steps in a graded part. */
export function countGraded(content) {
  if (!content) return 0
  return content.tabs.reduce((sum, tab) => sum + (tab.graded ? tab.steps.filter(isGradable).length : 0), 0)
}

/** The key a graded step is remembered by for spaced review. */
export const reviewKeyOf = (itemId, tabId, stepId) => `${itemId}:${tabId}:${stepId}`

const PRACTICE_TYPES = new Set(['mcq', 'binary', 'fill-blank'])

/**
 * Build a practice deck from loaded content. Items the learner missed come
 * first (spaced review), then graded steps from finished items, shuffled.
 * Call preloadContent() for the same ids first.
 */
export function buildPracticeDeck(completedIds = [], size = 5, reviewKeys = []) {
  const byKey = new Map()
  const ids = completedIds.length ? completedIds : ['m01-l01']
  for (const id of ids) {
    const content = getLessonContent(id)
    if (!content) continue
    for (const tab of content.tabs) {
      if (!tab.graded) continue
      for (const step of tab.steps) {
        if (!PRACTICE_TYPES.has(step.type)) continue
        const key = reviewKeyOf(id, tab.id, step.id)
        byKey.set(key, { ...step, sourceLesson: id, key, sourceTitle: getLessonById(id)?.title })
      }
    }
  }

  const review = reviewKeys.map((k) => byKey.get(k)).filter(Boolean).map((s) => ({ ...s, isReview: true }))
  const rest = [...byKey.values()].filter((s) => !reviewKeys.includes(s.key))

  /* Shuffle with Math.random: practice is meant to vary every session. */
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }

  return [...review.slice(0, Math.ceil(size / 2) + 1), ...rest].slice(0, Math.max(1, size))
}
