/* ═══════════════════════════════════════════════════════════════════════════
   practiceService.js — THE ADAPTIVE PRACTICE ENGINE
   ---------------------------------------------------------------------------
   Practice is built from the learner's own answers. Every gradable question
   they answer — in a lesson's Learn part, in a Check, in a Case File, in
   Practice — is recorded here, against the question AND the concept it tests
   (data/concepts.js). From that history the engine works out, for each
   concept, whether it is:

     mistake    missed and not yet put right (two correct answers in a row
                clear it)
     due        answered right before, and its spaced review has come round
     learning   answered right, not due yet, not yet secure
     mastered   three spaced correct answers (Leitner box ≥ MASTERED_BOX)
     new        never answered
   — and separately whether it is WEAK (low accuracy over several answers)
   or OLDER (not practiced for OLDER_DAYS).

   Pure, like every service: (state, payload, now) → { state, events }, plus
   read-only views. No React, no storage, no network. The XP a session pays
   is decided by utils/practiceXp.js, which the LunX server runs too.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PRACTICE } from '../config/progressionConfig'
import { CONCEPTS, QUESTION_CONCEPTS, conceptOf, getConcept, itemOfKey } from '../data/concepts'
import { SECTIONS, getLessonById, getSectionById, lessonNumber } from '../data/learnData'
import { isGradable } from '../utils/stepLogic'
import { practiceSessionXp, isFresh, PRACTICE_XP } from '../utils/practiceXp'

const DAY = 86400000
const HOUR = 3600000
const SOURCES = new Set(['check', 'learn', 'practice'])

/** The modes Practice offers, in the order the dashboard lists them. */
export const MODES = {
  mistakes: { id: 'mistakes', name: 'Review mistakes', icon: 'review', focused: true },
  due:      { id: 'due',      name: 'Due for review',  icon: 'due', focused: true },
  weak:     { id: 'weak',     name: 'Improve weak areas', icon: 'trending-up', focused: true },
  older:    { id: 'older',    name: 'Older material',  icon: 'hourglass', focused: true },
  mixed:    { id: 'mixed',    name: 'Mixed practice',  icon: 'shuffle', focused: false },
  quick:    { id: 'quick',    name: 'Quick practice',  icon: 'timer', focused: false },
  topic:    { id: 'topic',    name: 'Practice by topic', icon: 'book', focused: false },
  concept:  { id: 'concept',  name: 'One concept',     icon: 'review', focused: true },
}

export function emptyPractice() {
  return { items: {}, concepts: {}, log: [], sessions: [], credits: {} }
}

/** The practice record on any state, old or new. */
export const practiceOf = (state) => state?.practice ?? emptyPractice()

/** Is this one of the course's gradable question keys? */
export const isQuestionKey = (key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(QUESTION_CONCEPTS, key)

const clip = (v, n = 120) => (v == null ? null : String(v).slice(0, n))

/* ── Stats and scheduling ────────────────────────────────────────────────── */

/**
 * One answer applied to a question's or a concept's record.
 *   correct → one more in a row; up a box if the review was on time (a review
 *             long before it was due counts, but does not climb); due again
 *             after that box's interval
 *   wrong   → back to box 0, due at once
 */
export function bump(prev, ok, now) {
  const s = prev
    ? { ...prev }
    : { n: 0, c: 0, w: 0, first: now, last: 0, lastOk: 0, lastMiss: 0, run: 0, box: 0, due: 0 }
  s.n += 1
  s.last = now
  if (ok) {
    s.c += 1
    s.run += 1
    s.lastOk = now
    const onTime = s.box === 0 || now >= s.due - PRACTICE.EARLY_GRACE_HOURS * HOUR
    if (onTime) s.box = Math.min(PRACTICE.BOX_DAYS.length - 1, s.box + 1)
    s.due = now + PRACTICE.BOX_DAYS[s.box] * DAY
  } else {
    s.w += 1
    s.run = 0
    s.lastMiss = now
    s.box = 0
    s.due = now
  }
  return s
}

/** mistake · due · mastered · learning · new — see the header. */
export function statusOf(s, now) {
  if (!s || !s.n) return 'new'
  if (s.w > 0 && (s.lastMiss >= s.lastOk || s.run < PRACTICE.CLEAR_RUN)) return 'mistake'
  if (s.due <= now) return 'due'
  if (s.box >= PRACTICE.MASTERED_BOX) return 'mastered'
  return 'learning'
}

export const accuracyOf = (s) => (s && s.n ? s.c / s.n : null)
export const isWeak = (s) => Boolean(s && s.n >= PRACTICE.WEAK_MIN_ATTEMPTS && s.c / s.n < PRACTICE.WEAK_ACCURACY)
export const isOlder = (s, now) => Boolean(s && s.n && now - s.last >= PRACTICE.OLDER_DAYS * DAY)

/* ── Recording ───────────────────────────────────────────────────────────── */

/**
 * Record one answered question. No XP and no hearts here — those belong to
 * the lesson (recordAnswer) and to the end of a Practice session.
 * @param {object} state
 * @param {{ key: string, correct: boolean, source?: string, answer?: string|null, sessionId?: string|null }} payload
 * @param {number} now
 */
export function recordAttempt(state, { key, correct, source = 'practice', answer = null, sessionId = null } = {}, now = Date.now()) {
  if (!isQuestionKey(key)) return { state, events: [] }
  const p = practiceOf(state)
  const ok = correct === true
  const concept = conceptOf(key)

  const item = bump(p.items[key], ok, now)
  if (!ok && answer != null) item.ans = clip(answer)
  const items = { ...p.items, [key]: item }
  const concepts = concept ? { ...p.concepts, [concept]: bump(p.concepts[concept], ok, now) } : p.concepts

  const entry = { k: key, ok, at: now, src: SOURCES.has(source) ? source : 'practice' }
  if (sessionId) entry.s = String(sessionId).slice(0, 48)
  if (!ok && answer != null) entry.a = clip(answer)
  const log = [entry, ...p.log].slice(0, PRACTICE.LOG_LIMIT)

  return {
    state: { ...state, practice: { ...p, items, concepts, log } },
    events: [{ type: 'ATTEMPT_RECORDED', key, concept, correct: ok }],
  }
}

/** The attempts one Practice session recorded, oldest first. */
export function sessionEntries(state, sessionId) {
  if (!sessionId) return []
  return practiceOf(state).log.filter((e) => e.s === sessionId && e.src === 'practice').reverse()
}

/**
 * What finishing a session would pay, from the history alone: each correct
 * question counts once, and only if it has not paid within FRESH_HOURS.
 */
export function sessionXp(state, entries, now) {
  const p = practiceOf(state)
  const correctKeys = [...new Set(entries.filter((e) => e.ok).map((e) => e.k))]
  const fresh = correctKeys.filter((k) => isFresh(p.credits[k], now))
  const since = now - PRACTICE_XP.WINDOW_HOURS * HOUR
  const recent = p.sessions.filter((s) => s.at >= since)
  return {
    ...practiceSessionXp({
      answered: entries.length,
      freshCorrect: fresh.length,
      sessionsInWindow: recent.length,
      xpInWindow: recent.reduce((sum, s) => sum + (s.xp || 0), 0),
    }),
    freshKeys: fresh,
  }
}

/**
 * Close a Practice session: work out what it covered and what it paid, and
 * keep a summary. The XP itself is awarded by progressionService, which
 * calls this. Idempotent: a session id is closed once.
 * @param {object} state
 * @param {{ sessionId: string, mode?: string, topic?: string|null, startMistakes?: string[] }} payload
 */
export function closeSession(state, { sessionId, mode = 'quick', topic = null, startMistakes = [] } = {}, now = Date.now()) {
  const p = practiceOf(state)
  if (!sessionId || p.sessions.some((s) => s.id === sessionId)) return { state, summary: null, duplicate: true }
  const entries = sessionEntries(state, sessionId)
  if (!entries.length) return { state, summary: null, duplicate: false }

  const xp = sessionXp(state, entries, now)
  const credits = { ...p.credits }
  for (const k of xp.freshKeys) credits[k] = now
  /* Bounded: the oldest payments are forgotten first. */
  const creditKeys = Object.keys(credits)
  if (creditKeys.length > PRACTICE.CREDIT_LIMIT) {
    creditKeys.sort((a, b) => credits[a] - credits[b])
    for (const k of creditKeys.slice(0, creditKeys.length - PRACTICE.CREDIT_LIMIT)) delete credits[k]
  }

  const concepts = [...new Set(entries.map((e) => conceptOf(e.k)).filter(Boolean))]
  const corrected = (Array.isArray(startMistakes) ? startMistakes : [])
    .filter((c) => concepts.includes(c) && statusOf(p.concepts[c], now) !== 'mistake')
  const needs = concepts.filter((c) => {
    const s = p.concepts[c]
    return statusOf(s, now) === 'mistake' || isWeak(s)
  })
  const modules = [...new Set(entries.map((e) => getLessonById(itemOfKey(e.k))?.sectionId).filter(Boolean))]

  const summary = {
    id: String(sessionId).slice(0, 48),
    at: now,
    mode: MODES[mode] ? mode : 'quick',
    topic: topic ? String(topic).slice(0, 40) : null,
    total: entries.length,
    correct: entries.filter((e) => e.ok).length,
    xp: xp.xp,
    reduced: xp.reduced,
    capped: xp.capped,
    concepts: concepts.slice(0, 20),
    corrected: corrected.slice(0, 20),
    needs: needs.slice(0, 20),
    modules,
  }
  const sessions = [summary, ...p.sessions].slice(0, PRACTICE.SESSION_LIMIT)
  return { state: { ...state, practice: { ...p, credits, sessions } }, summary, duplicate: false }
}

/* ── Migration from the review pile (state v2) ───────────────────────────── */

/** The v2 review pile ({ key: { lessonId, since, misses } }) as history. */
export function practiceFromReview(review = {}) {
  let p = emptyPractice()
  const keys = Object.keys(review).filter(isQuestionKey)
    .sort((a, b) => (review[a].since ?? 0) - (review[b].since ?? 0))
  for (const key of keys) {
    const r = review[key]
    const misses = Math.max(1, Math.min(9, Math.floor(r.misses ?? 1)))
    const at = Number.isFinite(r.since) ? r.since : Date.now()
    let next = { practice: p }
    for (let i = 0; i < misses; i++) next = recordAttempt(next, { key, correct: false, source: 'check' }, at).state
    p = next.practice
  }
  return p
}

/* ── Reading the content ─────────────────────────────────────────────────── */

/**
 * The items a learner has studied: everything finished, plus anything they
 * have answered a question in (a Check missed in a lesson not yet finished).
 * A learner who has studied nothing yet practises Lesson 1.1.
 */
export function studiedItems(state) {
  const done = Object.keys(state?.lessons ?? {})
  const tried = Object.keys(practiceOf(state).items).map(itemOfKey)
  const ids = [...new Set([...done, ...tried])].filter((id) => getLessonById(id))
  return ids.length ? { ids, starter: false } : { ids: ['m01-l01'], starter: true }
}

/** Every module whose content Practice needs: the studied items, and the
 *  lessons that teach their concepts (for "The idea"). */
export function contentNeeded(state) {
  const { ids } = studiedItems(state)
  const lessons = new Set(ids)
  for (const key of Object.keys(QUESTION_CONCEPTS)) {
    if (!lessons.has(itemOfKey(key))) continue
    const home = CONCEPTS[QUESTION_CONCEPTS[key]]?.lesson
    if (home) lessons.add(home)
  }
  return [...lessons]
}

/**
 * The question bank: every gradable step of the studied items whose content
 * has been loaded, with the concept it tests.
 * @param {string[]} itemIds
 * @param {(id: string) => any} getContent
 */
export function buildBank(itemIds, getContent) {
  const bank = []
  for (const id of itemIds) {
    const content = getContent(id)
    const item = getLessonById(id)
    if (!content || !item) continue
    for (const tab of content.tabs) {
      for (const step of tab.steps) {
        if (!isGradable(step)) continue
        const key = `${id}:${tab.id}:${step.id}`
        const concept = conceptOf(key)
        if (!concept) continue
        bank.push({ key, step, itemId: id, moduleId: item.sectionId, concept, graded: Boolean(tab.graded), part: tab.label })
      }
    }
  }
  return bank
}

/**
 * "The idea": the explanation card from the lesson that teaches a concept,
 * as written there. Null when the card's lesson is not loaded or the concept
 * has no card (the question's own explanation is shown instead).
 */
export function ideaFor(conceptId, getContent) {
  const concept = getConcept(conceptId)
  if (!concept?.card) return null
  const [itemId, tabId, stepId] = concept.card.split(':')
  const content = getContent(itemId)
  const step = content?.tabs.find((t) => t.id === tabId)?.steps.find((s) => s.id === stepId)
  if (!step) return null
  const body = Array.isArray(step.body) ? step.body : step.body ? [step.body] : []
  return {
    title: step.title,
    body,
    list: Array.isArray(step.list) ? step.list : [],
    takeaway: step.takeaway ?? null,
    lessonId: itemId,
    lessonLabel: lessonNumber(itemId) ? `Lesson ${lessonNumber(itemId)}` : getLessonById(itemId)?.title ?? '',
  }
}

/* ── Need, reasons and recommendations ───────────────────────────────────── */

const dateOf = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const daysSince = (t, now) => Math.max(0, Math.floor((now - t) / DAY))
const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`)

/**
 * Why a concept is being recommended, in one plain sentence.
 * @returns {{ code: string, text: string }}
 */
export function reasonFor(s, now) {
  const status = statusOf(s, now)
  if (status === 'new') return { code: 'new', text: 'Not practiced yet.' }
  if (status === 'mistake') {
    if (s.run === 1) return { code: 'mistake', text: `Missed on ${dateOf(s.lastMiss)}, right once since — one more right answer clears it.` }
    return { code: 'mistake', text: `You missed this ${times(s.w)} — last on ${dateOf(s.lastMiss)}.` }
  }
  if (isWeak(s)) return { code: 'weak', text: `${s.c} of ${s.n} right so far — worth strengthening.` }
  if (status === 'due') {
    const d = daysSince(s.last, now)
    return { code: 'due', text: d >= 1 ? `Due for review — last practiced ${d} day${d === 1 ? '' : 's'} ago.` : 'Due for review today.' }
  }
  if (isOlder(s, now)) return { code: 'older', text: `You haven’t practiced this since ${dateOf(s.last)}.` }
  if (status === 'mastered') return { code: 'mastered', text: `Secure — next review ${dateOf(s.due)}.` }
  return { code: 'learning', text: s.run >= 1 ? 'Right so far — a spaced review later makes it stick.' : 'Still settling in.' }
}

/** How much a bank entry is needed right now (higher first), and why. */
function needOf(entry, p, now) {
  const c = p.concepts[entry.concept]
  const it = p.items[entry.key]
  const cs = statusOf(c, now)
  let score = 0
  let reason = 'new'
  if (cs === 'mistake') { score = 100 + 10 * Math.min(5, c.w); reason = 'mistake' }
  else if (cs === 'due') { score = 60 + Math.min(30, ((now - c.due) / DAY) * 3); reason = 'due' }
  else if (isWeak(c)) { score = 45 + (1 - c.c / c.n) * 30; reason = 'weak' }
  else if (isOlder(c, now)) { score = 30 + Math.min(30, (now - c.last) / DAY); reason = 'older' }
  else if (!c || !c.n) { score = 25; reason = 'new' }
  else if (cs === 'mastered') { score = -30; reason = 'mastered' }
  else { score = 10; reason = 'learning' }
  if (statusOf(it, now) === 'mistake') score += 15
  if (!it || !it.n) score += 8
  if (it && now - it.last < 15 * 60000) score -= 60
  return { score, reason }
}

/* ── Building a session ──────────────────────────────────────────────────── */

/**
 * Choose the questions for a session.
 * @param {{ mode: string, size?: number, topic?: string|null, concept?: string|null }} opts
 * @param {Array} bank    buildBank()
 * @param {object} state
 * @param {number} now
 * @param {() => number} [rand]
 * @returns {Array} entries, each with `reason` and `original` (the exact question missed)
 */
export function buildDeck({ mode, size, topic = null, concept = null }, bank, state, now = Date.now(), rand = Math.random) {
  const p = practiceOf(state)
  const want = Math.max(1, Math.floor(size ?? (MODES[mode]?.focused ? PRACTICE.FOCUSED_SIZE : PRACTICE.DEFAULT_SIZE)))
  const scored = bank.map((e) => ({ ...e, ...needOf(e, p, now), jitter: rand() * 6 }))
  const status = (e) => statusOf(p.concepts[e.concept], now)

  let pool
  switch (mode) {
    case 'mistakes': pool = scored.filter((e) => status(e) === 'mistake'); break
    case 'due':      pool = scored.filter((e) => status(e) === 'due'); break
    case 'weak':     pool = scored.filter((e) => isWeak(p.concepts[e.concept])); break
    case 'older':    pool = scored.filter((e) => isOlder(p.concepts[e.concept], now)); break
    case 'topic':    pool = scored.filter((e) => e.moduleId === topic || e.itemId === topic); break
    case 'concept':  pool = scored.filter((e) => e.concept === concept); break
    default:         pool = scored
  }

  const cap = mode === 'mistakes' || mode === 'concept' ? PRACTICE.PER_CONCEPT + 1 : PRACTICE.PER_CONCEPT
  const order = (list) => [...list].sort((a, b) => (b.score + b.jitter) - (a.score + a.jitter))
  const picked = []
  const perConcept = new Map()
  const take = (e, reason) => {
    if (picked.length >= want || picked.some((x) => x.key === e.key)) return false
    const n = perConcept.get(e.concept) ?? 0
    if (n >= cap && mode !== 'concept') return false
    perConcept.set(e.concept, n + 1)
    picked.push({ ...e, reason: reason ?? e.reason, original: statusOf(p.items[e.key], now) === 'mistake' })
    return true
  }

  if (mode === 'mixed') {
    /* Round-robin across modules, so every studied module is represented. */
    const byModule = new Map()
    for (const e of order(pool)) {
      if (!byModule.has(e.moduleId)) byModule.set(e.moduleId, [])
      byModule.get(e.moduleId).push(e)
    }
    const queues = [...byModule.values()]
    let progress = true
    while (picked.length < want && progress) {
      progress = false
      for (const q of queues) {
        while (q.length) {
          if (take(q.shift(), 'mixed')) { progress = true; break }
        }
      }
    }
  } else {
    for (const e of order(pool)) take(e)
  }

  /* A focused session that came up short is topped up with questions on the
     same concepts first, then from the same lessons, so it still has enough
     to be worth finishing. Topic and mixed never borrow outside their pool. */
  const minimum = Math.min(want, PRACTICE.SESSION_SIZES[0])
  if (picked.length < minimum && MODES[mode]?.focused) {
    const concepts = new Set(picked.map((e) => e.concept))
    const items = new Set(picked.map((e) => e.itemId))
    for (const e of order(scored.filter((x) => concepts.has(x.concept)))) take(e, 'related')
    for (const e of order(scored.filter((x) => items.has(x.itemId)))) take(e, 'related')
  }

  /* Spread concepts out, and put a varied question before the original miss
     when a concept has both — "a new question on the same idea" first. */
  return spread(picked).map((e) => ({
    key: e.key,
    step: e.step,
    itemId: e.itemId,
    moduleId: e.moduleId,
    concept: e.concept,
    reason: e.reason,
    original: e.original,
  }))
}

/** Reorder so the same concept never comes twice in a row when avoidable,
 *  and a concept's exact missed question comes after its fresh one. */
function spread(list) {
  const groups = new Map()
  for (const e of list) {
    if (!groups.has(e.concept)) groups.set(e.concept, [])
    groups.get(e.concept).push(e)
  }
  for (const g of groups.values()) g.sort((a, b) => Number(a.original) - Number(b.original))
  const out = []
  let last = null
  while (out.length < list.length) {
    const candidates = [...groups.entries()].filter(([, g]) => g.length).sort((a, b) => b[1].length - a[1].length)
    const pick = candidates.find(([c]) => c !== last) ?? candidates[0]
    out.push(pick[1].shift())
    last = pick[0]
  }
  return out
}

/**
 * After a miss: another question testing the same concept, not already in
 * the session — an unseen one if there is one, else the least recently seen.
 * Null when the bank has no other question on it.
 */
export function followUpFor(entry, usedKeys, bank, state, now = Date.now()) {
  const p = practiceOf(state)
  const used = usedKeys instanceof Set ? usedKeys : new Set(usedKeys)
  const candidates = bank.filter((e) => e.concept === entry.concept && !used.has(e.key))
  if (!candidates.length) return null
  candidates.sort((a, b) => (p.items[a.key]?.last ?? 0) - (p.items[b.key]?.last ?? 0))
  const e = candidates[0]
  return { key: e.key, step: e.step, itemId: e.itemId, moduleId: e.moduleId, concept: e.concept, reason: 'follow-up', original: statusOf(p.items[e.key], now) === 'mistake' }
}

/* ── Views ───────────────────────────────────────────────────────────────── */

/** Concept-level counts that need no content (the view model, nav badges). */
export function practiceSummary(state, now = Date.now()) {
  const p = practiceOf(state)
  let mistakes = 0, due = 0, mastered = 0, weak = 0
  const all = Object.values(p.concepts)
  for (const s of all) {
    const st = statusOf(s, now)
    if (st === 'mistake') mistakes++
    else if (st === 'due') due++
    else if (st === 'mastered') mastered++
    if (isWeak(s)) weak++
  }
  const missedQuestions = Object.values(p.items).filter((s) => statusOf(s, now) === 'mistake').length
  return { tracked: all.length, mistakes, due, mastered, weak, missedQuestions, sessions: p.sessions.length }
}

/** The last `n` attempts on a concept, oldest first, as booleans. */
export function marksFor(conceptId, state, n = 8) {
  const out = []
  for (const e of practiceOf(state).log) {
    if (conceptOf(e.k) !== conceptId) continue
    out.push({ ok: e.ok, at: e.at, src: e.src })
    if (out.length >= n) break
  }
  return out.reverse()
}

/**
 * Everything the Practice dashboard shows, from the history and the bank.
 * @param {object} state
 * @param {Array} bank
 * @param {number} now
 */
export function practiceView(state, bank, now = Date.now()) {
  const p = practiceOf(state)
  const conceptIds = [...new Set(bank.map((e) => e.concept))]
  const concepts = conceptIds.map((id) => {
    const s = p.concepts[id] ?? null
    const status = statusOf(s, now)
    const moduleId = bank.find((e) => e.concept === id)?.moduleId ?? null
    const section = getSectionById(moduleId)
    return {
      id,
      label: CONCEPTS[id]?.label ?? id,
      moduleId,
      moduleNumber: section ? SECTIONS.indexOf(section) + 1 : null,
      moduleTitle: section?.title ?? '',
      status,
      weak: isWeak(s),
      older: isOlder(s, now),
      stats: s,
      accuracy: accuracyOf(s),
      reason: reasonFor(s, now),
      questions: bank.filter((e) => e.concept === id).length,
    }
  })

  const by = (pred) => concepts.filter(pred)
  const mistakes = by((c) => c.status === 'mistake')
  const due = by((c) => c.status === 'due')
  const weak = by((c) => c.weak)
  const older = by((c) => c.older)
  const fresh = by((c) => c.status === 'new')

  const rank = { mistake: 0, due: 1 }
  const attention = [...mistakes, ...due.filter((c) => !c.weak), ...weak.filter((c) => c.status !== 'mistake'), ...older]
    .filter((c, i, list) => list.findIndex((x) => x.id === c.id) === i)
    .sort((a, b) => (rank[a.status] ?? 2) - (rank[b.status] ?? 2) || (b.stats?.w ?? 0) - (a.stats?.w ?? 0))
    .slice(0, 6)
    .map((c) => ({ ...c, marks: marksFor(c.id, state) }))

  const modules = SECTIONS.map((section, i) => {
    const entries = bank.filter((e) => e.moduleId === section.id)
    const ids = [...new Set(entries.map((e) => e.concept))]
    const stats = ids.map((id) => p.concepts[id]).filter(Boolean)
    const answered = stats.reduce((sum, s) => sum + s.n, 0)
    const right = stats.reduce((sum, s) => sum + s.c, 0)
    const masteredN = ids.filter((id) => statusOf(p.concepts[id], now) === 'mastered').length
    return {
      id: section.id,
      number: i + 1,
      title: section.title,
      studied: entries.length > 0,
      questions: entries.length,
      concepts: ids.length,
      mastered: masteredN,
      attempted: stats.length,
      accuracy: answered ? right / answered : null,
      masteryPct: ids.length ? Math.round((masteredN / ids.length) * 100) : 0,
    }
  })

  const recommendation =
    mistakes.length ? { mode: 'mistakes', count: mistakes.length, lead: mistakes[0] }
    : due.length ? { mode: 'due', count: due.length, lead: due[0] }
    : weak.length ? { mode: 'weak', count: weak.length, lead: weak[0] }
    : older.length ? { mode: 'older', count: older.length, lead: older[0] }
    : fresh.length ? { mode: 'mixed', count: fresh.length, lead: fresh[0] }
    : bank.length ? { mode: 'quick', count: bank.length, lead: null }
    : null

  const sessions = p.sessions
  const acc = (list) => {
    const total = list.reduce((s, x) => s + x.total, 0)
    return total ? list.reduce((s, x) => s + x.correct, 0) / total : null
  }

  return {
    bankSize: bank.length,
    concepts,
    counts: { mistakes: mistakes.length, due: due.length, weak: weak.length, older: older.length, fresh: fresh.length },
    attention,
    modules,
    recommendation,
    tracked: concepts.filter((c) => c.status !== 'new').length,
    mastered: concepts.filter((c) => c.status === 'mastered').length,
    history: {
      sessions: sessions.length,
      recentAccuracy: acc(sessions.slice(0, 5)),
      earlierAccuracy: acc(sessions.slice(5, 15)),
      answered: Object.values(p.items).reduce((s, x) => s + x.n, 0),
    },
  }
}

/** The learner's recent sessions of the same kind, for "compared with before". */
export function previousComparable(state, summary) {
  const others = practiceOf(state).sessions.filter((s) => s.id !== summary.id && (s.mode === summary.mode || (summary.topic && s.topic === summary.topic)))
  const recent = others.slice(0, 5)
  const total = recent.reduce((s, x) => s + x.total, 0)
  return total ? { sessions: recent.length, accuracy: recent.reduce((s, x) => s + x.correct, 0) / total } : null
}

export default {
  MODES, emptyPractice, practiceOf, isQuestionKey, bump, statusOf, accuracyOf, isWeak, isOlder,
  recordAttempt, sessionEntries, sessionXp, closeSession, practiceFromReview,
  studiedItems, contentNeeded, buildBank, ideaFor, reasonFor, buildDeck, followUpFor,
  practiceSummary, marksFor, practiceView, previousComparable,
}
