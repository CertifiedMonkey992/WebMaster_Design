/* ═══════════════════════════════════════════════════════════════════════════
   progressionService.js — THE CENTRAL PROGRESSION ENGINE
   ---------------------------------------------------------------------------
   One reducer. Every XP point, gem, heart, streak day, quest tick and
   achievement in LunX flows through it.

   Components never mutate progression state. They dispatch an action; this
   file runs the FULL pipeline for that action:

       action
         → resource changes (XP / gems / hearts)
         → daily + weekly counters
         → streak evaluation
         → level evaluation
         → achievement evaluation
         → quest re-evaluation
         → team mission contribution
         → events for the reward animations
         → persisted state

   Everything is pure: `(state, payload, now) => { state, events }`. No React,
   no storage, no timers — which is exactly why the whole loop is testable and
   why a backend can later replace the persistence layer without touching it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { XP, CURRENCY, HEARTS, COURSEWORK, PRACTICE } from '../config/progressionConfig'
import { SHIELD, SHOP_ITEMS } from '../config/shopConfig'
import { getLevelFromXP, getXPProgress, clamp } from '../utils/progressionUtils'
import { getLocalDateKey, getWeekKey } from '../utils/dateUtils'
import { emptyDaily, emptyWeekly, emptyWheel } from './storageService'
import currency from './currencyService'
import streakService from './streakService'
import questService from './questService'
import achievementService from './achievementService'
import teamService from './teamQuestService'
import shopService from './shopService'
import wheelService from './wheelService'
import judgeService from './judgeService'
import practice from './practiceService'
import { practiceSessionXp, PRACTICE_XP } from '../utils/practiceXp'
import { deriveCourse, getSectionById, getLessonById, isLesson } from '../data/learnData'

/* ── Action names ────────────────────────────────────────────────────────── */
export const ACTIONS = {
  RECONCILE:          'RECONCILE',
  AWARD_XP:           'AWARD_XP',
  AWARD_GEMS:         'AWARD_GEMS',
  SPEND_GEMS:         'SPEND_GEMS',
  LOSE_HEART:         'LOSE_HEART',
  RESTORE_HEART:      'RESTORE_HEART',
  RESTORE_ALL_HEARTS: 'RESTORE_ALL_HEARTS',
  REFILL_HEARTS_GEMS: 'REFILL_HEARTS_GEMS',
  RECORD_ANSWER:      'RECORD_ANSWER',
  COMPLETE_LESSON:    'COMPLETE_LESSON',
  COMPLETE_PRACTICE:  'COMPLETE_PRACTICE',
  ADD_PRACTICE_TIME:  'ADD_PRACTICE_TIME',
  /* An answered question that pays nothing and costs nothing — a Learn
     part's practice question, or a question inside a Practice session —
     recorded in the Practice history (services/practiceService.js). */
  RECORD_ATTEMPT:     'RECORD_ATTEMPT',
  /* A reward the LunX server recorded (a league result, a won challenge),
     claimed into this economy once. */
  CLAIM_SERVER_AWARD: 'CLAIM_SERVER_AWARD',
  PURCHASE_ITEM:      'PURCHASE_ITEM',
  SPIN_WHEEL:         'SPIN_WHEEL',
  CLAIM_QUEST:        'CLAIM_QUEST',
  CLAIM_ALL_QUESTS:   'CLAIM_ALL_QUESTS',
  CLAIM_TEAM_REWARD:  'CLAIM_TEAM_REWARD',
  REROLL_TEAM_MISSION:'REROLL_TEAM_MISSION',
  SET_DAILY_GOAL:     'SET_DAILY_GOAL',
  /* Coursework: a lesson's resume point, the Field Journal, the scans. None
     of them pays anything — they are the learner's own record. */
  SAVE_PART:          'SAVE_PART',
  SAVE_JOURNAL:       'SAVE_JOURNAL',
  RECORD_SCAN:        'RECORD_SCAN',
  /* Developer-only */
  DEV_SET:            'DEV_SET',
  DEV_RESET_DAILY:    'DEV_RESET_DAILY',
  DEV_RESET_WEEKLY:   'DEV_RESET_WEEKLY',
  DEV_SHIFT_DAYS:     'DEV_SHIFT_DAYS',
  DEV_RESET_WHEEL:    'DEV_RESET_WHEEL',
  /* The reviewer's controls (services/judgeService.js). One action, an `op`
     in its payload, and only ever a no-op on a profile without the powers. */
  JUDGE:              'JUDGE',
}

/* ── Small internal helpers ──────────────────────────────────────────────── */

const merge = (acc, result) => {
  acc.state = result.state
  acc.events.push(...result.events)
  return result
}

/** Bump the same counter on the daily and weekly buckets plus lifetime stats. */
function addCounters(state, { daily = {}, weekly = {}, stats = {} }) {
  const nextDaily = { ...state.daily }
  for (const [k, v] of Object.entries(daily)) nextDaily[k] = (nextDaily[k] ?? 0) + v
  const nextWeekly = { ...state.weekly }
  for (const [k, v] of Object.entries(weekly)) nextWeekly[k] = (nextWeekly[k] ?? 0) + v
  const nextStats = { ...state.stats }
  for (const [k, v] of Object.entries(stats)) nextStats[k] = (nextStats[k] ?? 0) + v
  return { ...state, daily: nextDaily, weekly: nextWeekly, stats: nextStats }
}

/* ── XP + levels ─────────────────────────────────────────────────────────── */

/**
 * The ONLY place XP is ever added. Updates lifetime, daily and weekly totals,
 * re-derives the level, and pays the level-up bonus at most once per level
 * (guarded by `levelRewardedUpTo`, so a rerender or a refresh can never
 * double-pay).
 */
export function awardXP(state, amount, reason = 'unknown', meta = {}) {
  const value = Math.max(0, Math.floor(amount))
  if (value === 0) return { state, events: [] }

  let next = addCounters(state, {
    daily: { xp: value },
    weekly: { xp: value },
    stats: { totalXPEarned: value },
  })
  next = { ...next, xp: next.xp + value }
  next = currency.pushLedger(next, { kind: 'xp', amount: value, reason, ...meta })

  const events = [{ type: 'XP_AWARDED', amount: value, reason, total: next.xp, ...meta }]

  /* Level evaluation — always derived from total XP, never incremented. */
  const newLevel = getLevelFromXP(next.xp)
  if (newLevel > next.level) {
    const previous = next.level
    next = { ...next, level: newLevel }
    events.push({
      type: 'LEVEL_UP',
      level: newLevel,
      previous,
    })
  }

  /* Level-up gems: paid once per level, for every level crossed. */
  if (next.level > next.levelRewardedUpTo) {
    const levelsGained = next.level - next.levelRewardedUpTo
    next = { ...next, levelRewardedUpTo: next.level }
    const bonus = CURRENCY.LEVEL_UP_GEMS * levelsGained
    const result = currency.awardGems(next, bonus, 'level-up', { level: next.level })
    next = result.state
    events.push(...result.events)
  }

  /* Daily goal bonus — flagged first so the recursive award cannot re-trigger it. */
  if (!next.daily.goalAwarded && next.daily.xp >= next.goals.dailyXP) {
    next = { ...next, daily: { ...next.daily, goalAwarded: true } }
    events.push({ type: 'DAILY_GOAL_MET', xp: next.daily.xp, goal: next.goals.dailyXP })
    const bonus = awardXP(next, XP.DAILY_GOAL_BONUS, 'daily-goal')
    next = bonus.state
    events.push(...bonus.events)
  }

  return { state: next, events }
}

/* ── Period rollover ─────────────────────────────────────────────────────────
   Daily and weekly buckets are keyed by a LOCAL CALENDAR key. When the key no
   longer matches "now", the period is over — regardless of how many hours
   have passed. Lifetime totals, gems, streak and completed lessons are never
   touched by a rollover.
   ─────────────────────────────────────────────────────────────────────────── */
export function applyRollover(state, now = Date.now()) {
  const dateKey = getLocalDateKey(new Date(now))
  const weekKey = getWeekKey(new Date(now))
  const events = []
  let next = state

  const dayOver = next.daily.dateKey !== dateKey
  const weekOver = next.weekly.weekKey !== weekKey
  if (dayOver) events.push({ type: 'DAY_ROLLOVER', from: next.daily.dateKey, to: dateKey })
  if (weekOver) events.push({ type: 'WEEK_ROLLOVER', from: next.weekly.weekKey, to: weekKey })

  /* Quests first, while the old buckets are still in place: a reward the
     rollover pays on the learner's behalf belongs to the period it was
     earned in, not to the new day's gem count. */
  const quests = questService.ensureQuests(next, now)
  next = quests.state

  if (dayOver) next = { ...next, daily: emptyDaily(dateKey) }
  if (weekOver) next = { ...next, weekly: emptyWeekly(weekKey) }
  events.push(...quests.events)

  const team = teamService.ensureMission(next, now)
  next = team.state
  events.push(...team.events)

  return { state: next, events }
}

/**
 * Re-derive everything that depends on the passage of time or on the state
 * that an action just changed. Runs after EVERY action and on every tick.
 */
export function runPipeline(state, now = Date.now()) {
  const acc = { state, events: [] }
  merge(acc, achievementService.evaluateAchievements(acc.state, now))
  merge(acc, questService.evaluateQuests(acc.state, now))
  /* An unlimited purse stays unlimited. This is a no-op on every profile but
     the reviewer's, and it runs LAST so the spend that emptied it has
     already produced its events and its animation. */
  acc.state = judgeService.topUpGems(acc.state)
  return acc
}

/**
 * Full time-based reconciliation: heart regen, streak decay, calendar
 * rollover, quest generation, team mission, then the standard pipeline.
 * Safe to call as often as you like — it is idempotent for a given `now`.
 */
export function reconcile(state, now = Date.now()) {
  const acc = { state, events: [] }
  merge(acc, currency.applyHeartRegen(acc.state, now))
  merge(acc, streakService.reconcileStreak(acc.state, now))
  merge(acc, applyRollover(acc.state, now))
  merge(acc, runPipeline(acc.state, now))
  return acc
}

/* ── Qualifying activity (streak + history + team) ───────────────────────── */

/** The XP an action has paid so far: every XP_AWARDED it emitted, including
 *  answer XP, the perfect bonus, a section bonus and the daily-goal bonus. */
const xpAwarded = (events) => events.reduce((sum, e) => (e.type === 'XP_AWARDED' ? sum + e.amount : sum), 0)

function recordActivity(state, { xp = 0, lessons = 0, seconds = 0, perfect = 0 }, now) {
  const acc = { state, events: [] }
  const today = getLocalDateKey(new Date(now))
  const isFirstActivityToday = acc.state.streak.lastActivityDate !== today

  merge(acc, streakService.updateStreak(acc.state, now))

  if (isFirstActivityToday) {
    acc.state = addCounters(acc.state, { stats: { daysActive: 1 } })
  }

  acc.state = streakService.recordHistory(acc.state, { xp, lessons, seconds }, now)

  merge(acc, teamService.contribute(acc.state, { xp, lessons, seconds, perfect }, now))

  /* A streak milestone pays gems — routed through the currency service so it
     lands in the ledger and counts toward gem quests like any other award. */
  for (const event of acc.events) {
    if (event.type === 'STREAK_MILESTONE' && event.gems > 0) {
      const result = currency.awardGems(acc.state, event.gems, 'streak-milestone', { streak: event.streak })
      acc.state = result.state
      acc.events.push(...result.events)
    }
  }

  return acc
}

/* ── Lessons ─────────────────────────────────────────────────────────────── */

/** Did this completion finish a whole section? Pays the section bonus once. */
function checkSectionCompletion(state, lessonId, now) {
  const lesson = getLessonById(lessonId)
  if (!lesson) return { state, events: [] }
  const section = getSectionById(lesson.sectionId)
  if (!section) return { state, events: [] }
  if (state.sectionsCompleted[section.id]) return { state, events: [] }

  const allDone = section.lessons.every((l) => Boolean(state.lessons[l.id]))
  if (!allDone) return { state, events: [] }

  const acc = { state, events: [] }
  acc.state = {
    ...acc.state,
    sectionsCompleted: { ...acc.state.sectionsCompleted, [section.id]: now },
  }
  acc.state = addCounters(acc.state, {
    daily: { sections: 1 },
    weekly: { sections: 1 },
    stats: { totalSectionsCompleted: 1 },
  })
  acc.events.push({ type: 'SECTION_COMPLETE', section: { id: section.id, title: section.title } })

  merge(acc, awardXP(acc.state, XP.SECTION_COMPLETE, 'section-complete', { sectionId: section.id }))
  merge(acc, currency.awardGems(acc.state, CURRENCY.SECTION_COMPLETE_GEMS, 'section-complete', { sectionId: section.id }))
  return acc
}

/**
 * Record one answer inside a lesson.
 *
 * Correct → XP through the central system, capped per lesson so replaying a
 *           lesson can never farm XP.
 * Wrong   → one heart, through the central heart system.
 *
 * Either way the answer joins the Practice history under `reviewKey`, so a
 * missed Check question comes back in Review mistakes and a right one is
 * scheduled for spaced review (services/practiceService.js).
 */
export function recordAnswer(state, { lessonId, correct, maxAnswerXP = 0, reviewKey = null, answer = null }, now = Date.now()) {
  const acc = { state, events: [] }
  if (reviewKey) {
    acc.state = practice.recordAttempt(acc.state, { key: reviewKey, correct: Boolean(correct), source: 'check', answer }, now).state
  }

  if (!correct) {
    acc.state = addCounters(acc.state, {
      stats: { totalWrongAnswers: 1 },
    })
    merge(acc, currency.loseHeart(acc.state, 'wrong-answer', now))
    return acc
  }

  acc.state = addCounters(acc.state, {
    daily: { correctAnswers: 1 },
    weekly: { correctAnswers: 1 },
    stats: { totalCorrectAnswers: 1 },
  })

  /* Per-lesson XP budget: the total answer XP a lesson can ever pay out is
     fixed, so a replay of a finished lesson yields nothing. */
  const spent = acc.state.answerXP?.[lessonId] ?? 0
  const budget = Math.max(0, maxAnswerXP - spent)
  const award = Math.min(XP.CORRECT_ANSWER, budget)

  if (award > 0) {
    acc.state = {
      ...acc.state,
      answerXP: { ...(acc.state.answerXP ?? {}), [lessonId]: spent + award },
    }
    merge(acc, awardXP(acc.state, award, 'correct-answer', { lessonId }))
  }

  /* Answer XP is real XP: it shows in the streak calendar and counts toward
     the squad's XP mission, though answering alone does not keep a streak. */
  const earned = xpAwarded(acc.events)
  if (earned > 0) {
    acc.state = streakService.recordHistory(acc.state, { xp: earned }, now)
    merge(acc, teamService.contribute(acc.state, { xp: earned }, now))
  }

  merge(acc, runPipeline(acc.state, now))
  return acc
}

/**
 * THE MAIN LOOP. Completing a lesson drives the entire progression system.
 *
 * Idempotent: a lesson that has already been completed pays no completion XP
 * again (config `XP.LESSON_REPLAY`, 0 by default). A replay still counts as a
 * genuine review — it keeps the streak alive and adds practice time — but it
 * can never inflate lesson counts, perfect counts or lesson quests.
 */
export function completeLesson(state, payload, now = Date.now()) {
  const { lessonId, perfect = false, seconds = 0, accuracy = 0 } = payload
  const lesson = getLessonById(lessonId)
  if (!lesson) return { state, events: [{ type: 'ERROR', reason: 'unknown-lesson', lessonId }] }

  const acc = { state, events: [] }
  const existing = acc.state.lessons[lessonId]
  const isReplay = Boolean(existing)
  const safeSeconds = clamp(Math.floor(seconds), 0, 60 * 60)
  /* Lessons proper count as lessons; a Case File, a Part project or the
     capstone completes the same way but is not "a lesson" in any count. */
  const countsAsLesson = isLesson(lesson)
  const kind = lesson.kind ?? 'lesson'

  /* ── Lesson record (idempotency anchor) ── */
  acc.state = {
    ...acc.state,
    lessons: {
      ...acc.state.lessons,
      [lessonId]: {
        firstCompletedAt: existing?.firstCompletedAt ?? now,
        lastCompletedAt: now,
        attempts: (existing?.attempts ?? 0) + 1,
        perfect: existing?.perfect || perfect,
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
      },
    },
  }
  /* A finished item needs no resume point. */
  if (acc.state.lessonParts?.[lessonId]) {
    const { [lessonId]: _done, ...rest } = acc.state.lessonParts
    acc.state = { ...acc.state, lessonParts: rest }
  }

  if (isReplay) {
    /* A review pass: time and streak count, rewards do not. */
    acc.state = addCounters(acc.state, {
      daily: { practiceSessions: 1, practiceSeconds: safeSeconds },
      weekly: { practiceSessions: 1, practiceSeconds: safeSeconds },
      stats: { totalLessonAttempts: 1, totalPracticeSessions: 1, totalPracticeSeconds: safeSeconds },
    })
    acc.events.push({ type: 'LESSON_REVIEWED', lessonId, title: lesson.title })

    if (XP.LESSON_REPLAY > 0) {
      merge(acc, awardXP(acc.state, XP.LESSON_REPLAY, 'lesson-replay', { lessonId }))
    }

    merge(acc, recordActivity(acc.state, { xp: xpAwarded(acc.events), seconds: safeSeconds }, now))
    merge(acc, runPipeline(acc.state, now))
    return acc
  }

  /* ── First completion ── */
  const lessonCount = countsAsLesson ? 1 : 0
  const perfectCount = countsAsLesson && perfect ? 1 : 0
  acc.state = addCounters(acc.state, {
    daily: { lessons: lessonCount, practiceSeconds: safeSeconds, perfectLessons: perfectCount },
    weekly: { lessons: lessonCount, practiceSeconds: safeSeconds, perfectLessons: perfectCount },
    stats: {
      totalLessonsCompleted: lessonCount,
      totalLessonAttempts: 1,
      totalPracticeSeconds: safeSeconds,
      totalPerfectLessons: perfectCount,
    },
  })

  acc.events.push({ type: 'LESSON_COMPLETE', lessonId, title: lesson.title, perfect, kind })

  merge(acc, awardXP(acc.state, XP.ITEM?.[kind] ?? XP.LESSON, 'lesson-complete', { lessonId }))

  if (perfect) {
    merge(acc, awardXP(acc.state, XP.PERFECT_BONUS, 'perfect-lesson', { lessonId }))
    merge(acc, currency.awardGems(acc.state, CURRENCY.PERFECT_LESSON_GEMS, 'perfect-lesson', { lessonId }))
    acc.events.push({ type: 'PERFECT_LESSON', lessonId })
  }

  merge(acc, checkSectionCompletion(acc.state, lessonId, now))

  merge(acc, recordActivity(acc.state, {
    xp: xpAwarded(acc.events), lessons: lessonCount, seconds: safeSeconds, perfect: perfectCount,
  }, now))

  merge(acc, runPipeline(acc.state, now))
  return acc
}

/**
 * A finished Practice session. Never costs hearts.
 *
 * A session run in the Practice tab names its `sessionId`, and everything
 * about it — what was answered, what was right, which questions are fresh
 * enough to pay — is read from the attempts it recorded (RECORD_ATTEMPT),
 * then paid by the shared practice rule (utils/practiceXp.js). A session id
 * is closed once: replaying the completion pays nothing.
 *
 * The reviewer's console, the developer panel and the landing page's demo
 * learners finish a session without answering questions; they pass counts
 * (`correct`, `total`) instead, which the same rule pays as fresh answers.
 */
export function completePractice(state, payload = {}, now = Date.now()) {
  const { sessionId = null, seconds = 0, mode = 'quick', topic = null, startMistakes = [] } = payload
  const acc = { state, events: [] }
  const safeSeconds = clamp(Math.floor(seconds), 0, 60 * 60)

  let summary
  let pay
  const recorded = sessionId ? practice.sessionEntries(acc.state, sessionId) : []
  if (recorded.length) {
    pay = practice.sessionXp(acc.state, recorded, now)
    const closed = practice.closeSession(acc.state, { sessionId, mode, topic, startMistakes }, now)
    if (closed.duplicate || !closed.summary) return { state, events: [{ type: 'PRACTICE_DUPLICATE', sessionId }] }
    acc.state = closed.state
    summary = closed.summary
  } else {
    const p = practice.practiceOf(acc.state)
    const id = sessionId ? String(sessionId).slice(0, 48) : `s${now.toString(36)}`
    if (p.sessions.some((s) => s.id === id)) return { state, events: [{ type: 'PRACTICE_DUPLICATE', sessionId: id }] }
    const total = clamp(Math.floor(payload.total ?? 0), 0, 50)
    const correct = clamp(Math.floor(payload.correct ?? 0), 0, total)
    const since = now - PRACTICE_XP.WINDOW_HOURS * 3600000
    const recent = p.sessions.filter((s) => s.at >= since)
    pay = practiceSessionXp({
      answered: total,
      freshCorrect: correct,
      sessionsInWindow: recent.length,
      xpInWindow: recent.reduce((sum, s) => sum + (s.xp || 0), 0),
    })
    summary = {
      id, at: now, mode: practice.MODES[mode] ? mode : 'quick', topic: null, total, correct,
      xp: pay.xp, reduced: pay.reduced, capped: pay.capped, concepts: [], corrected: [], needs: [], modules: [],
    }
    acc.state = { ...acc.state, practice: { ...p, sessions: [summary, ...p.sessions].slice(0, PRACTICE.SESSION_LIMIT) } }
  }

  acc.state = addCounters(acc.state, {
    daily: { practiceSessions: 1, practiceSeconds: safeSeconds },
    weekly: { practiceSessions: 1, practiceSeconds: safeSeconds },
    stats: { totalPracticeSessions: 1, totalPracticeSeconds: safeSeconds },
  })

  acc.events.push({
    type: 'PRACTICE_COMPLETE',
    sessionId: summary.id,
    correct: summary.correct,
    total: summary.total,
    xp: pay.xp,
    bonus: pay.bonus,
    perAnswer: pay.perAnswer,
    reduced: pay.reduced,
    capped: pay.capped,
  })

  merge(acc, awardXP(acc.state, pay.xp, 'practice-complete'))
  merge(acc, recordActivity(acc.state, { xp: xpAwarded(acc.events), seconds: safeSeconds }, now))
  merge(acc, runPipeline(acc.state, now))
  return acc
}

/**
 * Claim a reward the LunX server recorded — a league result, a tournament
 * round, a won challenge — into this economy. The server pays it once (its
 * reward has a unique key); this pays it once here, by remembering its id.
 */
export function claimServerAward(state, { id, gems = 0, kind = 'reward' } = {}, now = Date.now()) {
  if (typeof id !== 'string' || !id || id.length > 64) return { state, events: [] }
  const seen = state.serverAwards ?? []
  if (seen.includes(id)) return { state, events: [{ type: 'AWARD_ALREADY_CLAIMED', id }] }
  const acc = { state: { ...state, serverAwards: [id, ...seen].slice(0, PRACTICE.AWARD_MEMORY) }, events: [] }
  const amount = clamp(Math.floor(gems), 0, 1000)
  if (amount > 0) {
    merge(acc, currency.awardGems(acc.state, amount, kind.startsWith('challenge') ? 'challenge-reward' : 'league-reward', { awardId: id }))
  }
  acc.events.push({ type: 'SERVER_AWARD_CLAIMED', id, gems: amount, kind })
  merge(acc, runPipeline(acc.state, now))
  return acc
}

/** Add learning time without finishing anything (time spent inside a lesson
 *  that was abandoned, or the developer panel). */
export function addPracticeTime(state, seconds, now = Date.now()) {
  const safeSeconds = clamp(Math.floor(seconds), 0, 60 * 60)
  if (safeSeconds <= 0) return { state, events: [] }
  const acc = { state, events: [] }
  acc.state = addCounters(acc.state, {
    daily: { practiceSeconds: safeSeconds },
    weekly: { practiceSeconds: safeSeconds },
    stats: { totalPracticeSeconds: safeSeconds },
  })
  acc.state = streakService.recordHistory(acc.state, { seconds: safeSeconds }, now)
  merge(acc, teamService.contribute(acc.state, { seconds: safeSeconds }, now))
  merge(acc, runPipeline(acc.state, now))
  return acc
}

/* ── Coursework ──────────────────────────────────────────────────────────────
   The learner's own record inside the lessons. None of it pays XP or gems:
   a resume point, a journal entry and a scan are things the learner did, not
   things the economy rewards, so none of them can be farmed.
   ─────────────────────────────────────────────────────────────────────────── */

/** Remember how many parts of an item are finished, so it resumes there. */
export function savePart(state, { lessonId, part }) {
  if (!getLessonById(lessonId) || state.lessons[lessonId]) return { state, events: [] }
  const n = clamp(Math.floor(part ?? 0), 0, 8)
  if (n <= (state.lessonParts?.[lessonId] ?? 0)) return { state, events: [] }
  return { state: { ...state, lessonParts: { ...(state.lessonParts ?? {}), [lessonId]: n } }, events: [] }
}

/** Add or replace one Field Journal entry (keyed by the step it came from). */
export function saveJournal(state, { lessonId, entry }, now = Date.now()) {
  if (!getLessonById(lessonId) || !entry || typeof entry.key !== 'string') return { state, events: [] }
  if (entry.kind !== 'prediction' && entry.kind !== 'reflection') return { state, events: [] }
  const clean = {
    kind: entry.kind,
    key: entry.key,
    prompt: String(entry.prompt ?? '').slice(0, 400),
    at: now,
  }
  if (entry.kind === 'reflection') clean.text = String(entry.text ?? '').slice(0, COURSEWORK.JOURNAL_TEXT_MAX)
  if (entry.kind === 'prediction') {
    clean.text = String(entry.text ?? '').slice(0, 400)
    clean.confidence = ['sure', 'think', 'guess'].includes(entry.confidence) ? entry.confidence : 'guess'
    if (typeof entry.correct === 'boolean') clean.correct = entry.correct
  }
  const prior = state.journal?.[lessonId]?.entries ?? []
  const entries = [...prior.filter((e) => e.key !== clean.key), clean].slice(-COURSEWORK.JOURNAL_ENTRIES_PER_ITEM)
  return { state: { ...state, journal: { ...(state.journal ?? {}), [lessonId]: { entries } } }, events: [] }
}

/** Store a Launch or Final Scan. A scan can be retaken; the latest counts. */
export function recordScan(state, { which, form = 'A', answers = {} }, now = Date.now()) {
  if (which !== 'launch' && which !== 'final') return { state, events: [] }
  const clean = {}
  let correct = 0
  for (const [id, a] of Object.entries(answers).slice(0, COURSEWORK.SCAN_ITEMS)) {
    const ok = a?.correct === true
    if (ok) correct++
    clean[id] = { correct: ok, confidence: ['sure', 'think', 'guess'].includes(a?.confidence) ? a.confidence : 'guess' }
  }
  const scan = { at: now, form: form === 'B' ? 'B' : 'A', answers: clean, correct, total: Object.keys(clean).length }
  return {
    state: { ...state, scans: { ...(state.scans ?? { launch: null, final: null }), [which]: scan } },
    events: [{ type: 'SCAN_RECORDED', which, correct, total: scan.total }],
  }
}

/* ── Reducer ─────────────────────────────────────────────────────────────── */

/**
 * The single entry point used by the React layer.
 * Always returns `{ state, events }` — never mutates its input.
 *
 * If the calendar has moved on since the state was last reconciled — an
 * answer given a moment after midnight, before the next poll — the period
 * is rolled over FIRST, so the action lands in today's buckets rather than
 * in yesterday's, which the next reconcile would wipe.
 */
export function reduce(state, action, now = Date.now()) {
  if (action.type !== ACTIONS.RECONCILE && !action.type.startsWith('DEV_')) {
    const stale = state.daily.dateKey !== getLocalDateKey(new Date(now))
      || state.weekly.weekKey !== getWeekKey(new Date(now))
    if (stale) {
      const settled = reconcile(state, now)
      const result = reduceAction(settled.state, action, now)
      return { state: result.state, events: [...settled.events, ...result.events] }
    }
  }
  return reduceAction(state, action, now)
}

function reduceAction(state, action, now) {
  const payload = action.payload ?? {}
  const acc = { state, events: [] }

  switch (action.type) {
    case ACTIONS.RECONCILE:
      return reconcile(state, now)

    case ACTIONS.AWARD_XP:
      merge(acc, awardXP(acc.state, payload.amount, payload.reason ?? 'manual'))
      merge(acc, runPipeline(acc.state, now))
      return acc

    case ACTIONS.AWARD_GEMS:
      merge(acc, currency.awardGems(acc.state, payload.amount, payload.reason ?? 'manual'))
      merge(acc, runPipeline(acc.state, now))
      return acc

    case ACTIONS.SPEND_GEMS: {
      const result = currency.spendGems(acc.state, payload.amount, payload.reason ?? 'manual')
      acc.state = result.state
      acc.events.push(...result.events)
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.LOSE_HEART: {
      const result = currency.loseHeart(acc.state, payload.reason ?? 'mistake', now)
      acc.state = result.state
      acc.events.push(...result.events)
      return acc
    }

    case ACTIONS.RESTORE_HEART:
      merge(acc, currency.restoreHeart(acc.state, payload.count ?? 1, payload.reason ?? 'restore', now))
      return acc

    case ACTIONS.RESTORE_ALL_HEARTS:
      merge(acc, currency.restoreAllHearts(acc.state, payload.reason ?? 'refill'))
      return acc

    case ACTIONS.REFILL_HEARTS_GEMS: {
      const result = currency.refillHeartsWithGems(acc.state)
      acc.state = result.state
      acc.events.push(...result.events)
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.RECORD_ANSWER:
      return recordAnswer(state, payload, now)

    case ACTIONS.COMPLETE_LESSON:
      return completeLesson(state, payload, now)

    case ACTIONS.COMPLETE_PRACTICE:
      return completePractice(state, payload, now)

    case ACTIONS.ADD_PRACTICE_TIME:
      return addPracticeTime(state, payload.seconds ?? 0, now)

    case ACTIONS.RECORD_ATTEMPT:
      return practice.recordAttempt(state, payload, now)

    case ACTIONS.CLAIM_SERVER_AWARD:
      return claimServerAward(state, payload, now)

    case ACTIONS.PURCHASE_ITEM: {
      const result = shopService.purchaseItem(acc.state, payload, now)
      acc.state = result.state
      acc.events.push(...result.events)
      /* Spending gems can complete a quest or an achievement, so a successful
         purchase runs the same pipeline as any other progression event. */
      if (result.ok) merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.SPIN_WHEEL: {
      /* `awardXP` is handed in rather than imported by the wheel service,
         which keeps the dependency pointing one way. The draw (payload.roll)
         was made by the caller with crypto.getRandomValues. */
      const result = wheelService.spin(acc.state, payload, { awardXP }, now)
      acc.state = result.state
      acc.events.push(...result.events)
      /* A spin can finish a gem quest or unlock an achievement, so a
         successful one runs the same pipeline as any other award. */
      if (result.ok) merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.CLAIM_QUEST: {
      const result = questService.claimQuest(acc.state, payload.questId, now)
      acc.state = result.state
      acc.events.push(...result.events)
      if (result.ok) merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.CLAIM_ALL_QUESTS: {
      const result = questService.claimAllQuests(acc.state, now)
      acc.state = result.state
      acc.events.push(...result.events)
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.CLAIM_TEAM_REWARD: {
      const result = teamService.claimMissionReward(acc.state, now)
      acc.state = result.state
      acc.events.push(...result.events)
      if (result.ok) merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.REROLL_TEAM_MISSION:
      return teamService.rerollMission(state, now)

    case ACTIONS.SAVE_PART:
      return savePart(state, payload)

    case ACTIONS.SAVE_JOURNAL:
      return saveJournal(state, payload, now)

    case ACTIONS.RECORD_SCAN:
      return recordScan(state, payload, now)

    case ACTIONS.SET_DAILY_GOAL: {
      const dailyXP = clamp(Math.floor(payload.dailyXP ?? 50), 10, 500)
      acc.state = { ...acc.state, goals: { ...acc.state.goals, dailyXP } }
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    /* ── The reviewer's controls ─────────────────────────────────────────────
       Every op runs the REAL path — judgeService.completeLesson is this
       file's completeLesson — and then the standard pipeline, so a skipped
       lesson pays, unlocks and animates exactly like a finished one. */
    case ACTIONS.JUDGE: {
      const result = judgeService.apply(acc.state, payload, now, { awardXP, completeLesson })
      acc.state = result.state
      acc.events.push(...result.events)
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    /* ── Developer actions ── */
    case ACTIONS.DEV_SET:
      acc.state = { ...acc.state, ...payload }
      merge(acc, runPipeline(acc.state, now))
      return acc

    case ACTIONS.DEV_RESET_DAILY: {
      acc.state = {
        ...acc.state,
        daily: emptyDaily(getLocalDateKey(new Date(now))),
        quests: { ...acc.state.quests, dailyKey: null },
      }
      merge(acc, applyRollover(acc.state, now))
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.DEV_RESET_WEEKLY: {
      acc.state = {
        ...acc.state,
        weekly: emptyWeekly(getWeekKey(new Date(now))),
        quests: { ...acc.state.quests, weeklyKey: null },
      }
      merge(acc, applyRollover(acc.state, now))
      merge(acc, runPipeline(acc.state, now))
      return acc
    }

    /* Give today's free spin back and forget the clock guard — so the
       wheel can be exercised again without waiting for midnight UTC. */
    case ACTIONS.DEV_RESET_WHEEL:
      acc.state = { ...acc.state, wheel: { ...emptyWheel(), totalSpins: acc.state.wheel.totalSpins, jackpots: acc.state.wheel.jackpots, history: acc.state.wheel.history } }
      return acc

    default:
      return acc
  }
}

/* ── View model ──────────────────────────────────────────────────────────────
   One derived object for the whole UI. Components read from this instead of
   recomputing progression maths, which is what keeps the top bar, the quest
   sidebar and the course map from ever disagreeing.
   ─────────────────────────────────────────────────────────────────────────── */
export function buildViewModel(state, now = Date.now()) {
  const levelInfo = getXPProgress(state.xp)
  const course = deriveCourse(state.lessons, {
    unlockAll: judgeService.hasPower(state, 'unlockAll'),
  })
  const hearts = currency.getHeartRecoveryTime(state, now)
  const practiceView = practice.practiceSummary(state, now)

  return {
    xp: state.xp,
    gems: state.gems,
    /* The reviewer's profile, and its powers. Null everywhere else, so a
       component can ask `vm.judge?.powers.chips` without a guard. */
    judge: state.judge,
    unlimitedGems: judgeService.hasPower(state, 'infiniteGems'),
    hearts: state.hearts,
    maxHearts: state.maxHearts,
    heartsFull: state.hearts >= state.maxHearts,
    heartRecovery: hearts,
    canStartLesson: state.hearts >= HEARTS.COST_TO_START_LESSON,

    level: levelInfo.level,
    levelProgress: levelInfo,

    streak: state.streak.current,
    longestStreak: state.streak.longest,
    activeToday: streakService.hasActivityToday(state, now),
    nextMilestone: streakService.getNextMilestone(state.streak.current),
    shields: state.streak.shields,
    shieldsUsed: state.streak.shieldsUsed,
    maxShields: SHIELD.MAX_OWNED,

    daily: state.daily,
    weekly: state.weekly,
    goals: state.goals,
    dailyGoalPercent: clamp(Math.round((state.daily.xp / Math.max(1, state.goals.dailyXP)) * 100), 0, 100),

    course,
    quests: {
      daily: state.quests.daily,
      weekly: state.quests.weekly,
      summary: questService.getQuestSummary(state),
      claimable: questService.getClaimableQuests(state),
      claimableCount: questService.getClaimableCount(state),
    },
    team: teamService.getMissionView(state, now),
    /* One availability verdict per item, derived from the same function the
       reducer uses to accept or refuse the purchase — so a card can never
       offer something the engine would reject. */
    shop: {
      items: SHOP_ITEMS.map((item) => {
        const { ok, reason, shortfall } = shopService.getAvailability(state, item.id, now)
        return { ...item, ok, reason, shortfall, owned: shopService.getOwnedCount(state, item.id) }
      }),
      purchaseCount: state.shop.purchaseCount,
    },
    wheel: wheelService.getWheelView(state, now),
    achievements: achievementService.listAchievements(state),
    achievementsUnlocked: achievementService.getUnlockedCount(state),
    stats: state.stats,
    ledger: state.ledger,
    /* Coursework */
    lessonParts: state.lessonParts ?? {},
    journal: state.journal ?? {},
    scans: state.scans ?? { launch: null, final: null },
    /* Practice, at the level that needs no lesson content: how many
       concepts are tracked, missed, due and mastered. The Practice tab
       builds the full picture itself, once the questions are loaded. */
    practice: practiceView,
    reviewCount: practiceView.missedQuestions,
    serverAwards: state.serverAwards ?? [],
  }
}

export default {
  ACTIONS, reduce, reconcile, buildViewModel, awardXP,
  completeLesson, completePractice, recordAnswer, applyRollover, runPipeline,
  savePart, saveJournal, recordScan, claimServerAward,
}
