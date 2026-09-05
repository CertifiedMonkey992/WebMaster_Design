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

import { XP, CURRENCY, HEARTS } from '../config/progressionConfig'
import { SHIELD, SHOP_ITEMS } from '../config/shopConfig'
import { normalizeDay } from '../config/dailyBonusConfig'
import { getLevelFromXP, getXPProgress, getLevelTitle, clamp } from '../utils/progressionUtils'
import { getLocalDateKey, getWeekKey } from '../utils/dateUtils'
import { emptyDaily, emptyWeekly } from './storageService'
import currency from './currencyService'
import streakService from './streakService'
import questService from './questService'
import achievementService from './achievementService'
import teamService from './teamQuestService'
import shopService from './shopService'
import dailyBonusService from './dailyBonusService'
import { deriveCourse, getSectionById, getLessonById } from '../data/learnData'

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
  PURCHASE_ITEM:      'PURCHASE_ITEM',
  CLAIM_DAILY_BONUS:  'CLAIM_DAILY_BONUS',
  CLAIM_QUEST:        'CLAIM_QUEST',
  CLAIM_ALL_QUESTS:   'CLAIM_ALL_QUESTS',
  CLAIM_TEAM_REWARD:  'CLAIM_TEAM_REWARD',
  REROLL_TEAM_MISSION:'REROLL_TEAM_MISSION',
  SET_DAILY_GOAL:     'SET_DAILY_GOAL',
  /* Developer-only */
  DEV_SET:            'DEV_SET',
  DEV_RESET_DAILY:    'DEV_RESET_DAILY',
  DEV_RESET_WEEKLY:   'DEV_RESET_WEEKLY',
  DEV_SHIFT_DAYS:     'DEV_SHIFT_DAYS',
  DEV_SET_BONUS_DAY:  'DEV_SET_BONUS_DAY',
  DEV_RESET_BONUS:    'DEV_RESET_BONUS',
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
      title: getLevelTitle(newLevel),
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

  if (next.daily.dateKey !== dateKey) {
    events.push({ type: 'DAY_ROLLOVER', from: next.daily.dateKey, to: dateKey })
    next = { ...next, daily: emptyDaily(dateKey) }
  }

  if (next.weekly.weekKey !== weekKey) {
    events.push({ type: 'WEEK_ROLLOVER', from: next.weekly.weekKey, to: weekKey })
    next = { ...next, weekly: emptyWeekly(weekKey) }
  }

  const quests = questService.ensureQuests(next, now)
  next = quests.state
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

function recordActivity(state, { xp = 0, lessons = 0, seconds = 0, minutes = 0, perfect = 0 }, now) {
  const acc = { state, events: [] }
  const today = getLocalDateKey(new Date(now))
  const isFirstActivityToday = acc.state.streak.lastActivityDate !== today

  merge(acc, streakService.updateStreak(acc.state, now))

  if (isFirstActivityToday) {
    acc.state = addCounters(acc.state, { stats: { daysActive: 1 } })
  }

  acc.state = streakService.recordHistory(acc.state, { xp, lessons, seconds }, now)

  merge(acc, teamService.contribute(acc.state, { xp, lessons, minutes, perfect }, now))

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
 */
export function recordAnswer(state, { lessonId, correct, maxAnswerXP = 0 }, now = Date.now()) {
  const acc = { state, events: [] }

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
  const minutes = Math.floor(safeSeconds / 60)

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

    merge(acc, recordActivity(acc.state, { xp: XP.LESSON_REPLAY, seconds: safeSeconds, minutes }, now))
    merge(acc, runPipeline(acc.state, now))
    return acc
  }

  /* ── First completion ── */
  acc.state = addCounters(acc.state, {
    daily: { lessons: 1, practiceSeconds: safeSeconds, perfectLessons: perfect ? 1 : 0 },
    weekly: { lessons: 1, practiceSeconds: safeSeconds, perfectLessons: perfect ? 1 : 0 },
    stats: {
      totalLessonsCompleted: 1,
      totalLessonAttempts: 1,
      totalPracticeSeconds: safeSeconds,
      totalPerfectLessons: perfect ? 1 : 0,
    },
  })

  acc.events.push({ type: 'LESSON_COMPLETE', lessonId, title: lesson.title, perfect })

  merge(acc, awardXP(acc.state, XP.LESSON, 'lesson-complete', { lessonId }))

  if (perfect) {
    merge(acc, awardXP(acc.state, XP.PERFECT_BONUS, 'perfect-lesson', { lessonId }))
    merge(acc, currency.awardGems(acc.state, CURRENCY.PERFECT_LESSON_GEMS, 'perfect-lesson', { lessonId }))
    acc.events.push({ type: 'PERFECT_LESSON', lessonId })
  }

  merge(acc, checkSectionCompletion(acc.state, lessonId, now))

  const xpEarned = XP.LESSON + (perfect ? XP.PERFECT_BONUS : 0)
  merge(acc, recordActivity(acc.state, {
    xp: xpEarned, lessons: 1, seconds: safeSeconds, minutes, perfect: perfect ? 1 : 0,
  }, now))

  merge(acc, runPipeline(acc.state, now))
  return acc
}

/** A standalone practice / review session. Never costs hearts. */
export function completePractice(state, { seconds = 0, correct = 0, total = 0 } = {}, now = Date.now()) {
  const acc = { state, events: [] }
  const safeSeconds = clamp(Math.floor(seconds), 0, 60 * 60)
  const minutes = Math.floor(safeSeconds / 60)

  acc.state = addCounters(acc.state, {
    daily: { practiceSessions: 1, practiceSeconds: safeSeconds },
    weekly: { practiceSessions: 1, practiceSeconds: safeSeconds },
    stats: { totalPracticeSessions: 1, totalPracticeSeconds: safeSeconds },
  })

  acc.events.push({ type: 'PRACTICE_COMPLETE', correct, total })

  merge(acc, awardXP(acc.state, XP.PRACTICE, 'practice-complete'))
  merge(acc, recordActivity(acc.state, { xp: XP.PRACTICE, seconds: safeSeconds, minutes }, now))
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
  merge(acc, teamService.contribute(acc.state, { minutes: Math.floor(safeSeconds / 60) }, now))
  merge(acc, runPipeline(acc.state, now))
  return acc
}

/* ── Reducer ─────────────────────────────────────────────────────────────── */

/**
 * The single entry point used by the React layer.
 * Always returns `{ state, events }` — never mutates its input.
 */
export function reduce(state, action, now = Date.now()) {
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
      merge(acc, currency.restoreAllHearts(acc.state, payload.reason ?? 'refill', now))
      return acc

    case ACTIONS.REFILL_HEARTS_GEMS: {
      const result = currency.refillHeartsWithGems(acc.state, now)
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

    case ACTIONS.PURCHASE_ITEM: {
      const result = shopService.purchaseItem(acc.state, payload, now)
      acc.state = result.state
      acc.events.push(...result.events)
      /* Spending gems can complete a quest or an achievement, so a successful
         purchase runs the same pipeline as any other progression event. */
      if (result.ok) merge(acc, runPipeline(acc.state, now))
      return acc
    }

    case ACTIONS.CLAIM_DAILY_BONUS: {
      /* `awardXP` is handed in rather than imported by the bonus service,
         which keeps the dependency pointing one way. */
      const result = dailyBonusService.claimDailyBonus(acc.state, { awardXP }, now)
      acc.state = result.state
      acc.events.push(...result.events)
      /* A bonus can finish a gem quest or unlock an achievement, so a
         successful claim runs the same pipeline as any other award. */
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

    case ACTIONS.SET_DAILY_GOAL: {
      const dailyXP = clamp(Math.floor(payload.dailyXP ?? 50), 10, 500)
      acc.state = { ...acc.state, goals: { ...acc.state.goals, dailyXP } }
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

    /* Jump to a cycle day and mark today unclaimed, so any day of the track
       can be exercised without waiting a week. */
    case ACTIONS.DEV_SET_BONUS_DAY: {
      acc.state = {
        ...acc.state,
        dailyBonus: {
          ...acc.state.dailyBonus,
          cycleDay: normalizeDay(payload.day ?? 1),
          lastClaimDate: null,
        },
      }
      return acc
    }

    case ACTIONS.DEV_RESET_BONUS: {
      acc.state = {
        ...acc.state,
        dailyBonus: {
          cycleDay: 1,
          lastClaimDate: null,
          cycleStartDate: null,
          cyclesCompleted: 0,
          totalClaimed: 0,
        },
      }
      return acc
    }

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
  const course = deriveCourse(state.lessons)
  const hearts = currency.getHeartRecoveryTime(state, now)

  return {
    xp: state.xp,
    gems: state.gems,
    hearts: state.hearts,
    maxHearts: state.maxHearts,
    heartsFull: state.hearts >= state.maxHearts,
    heartRecovery: hearts,
    canStartLesson: state.hearts >= HEARTS.COST_TO_START_LESSON,

    level: levelInfo.level,
    levelTitle: getLevelTitle(levelInfo.level),
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
        const { ok, reason, shortfall } = shopService.getAvailability(state, item.id)
        return { ...item, ok, reason, shortfall, owned: shopService.getOwnedCount(state, item.id) }
      }),
      purchaseCount: state.shop.purchaseCount,
    },
    dailyBonus: dailyBonusService.getBonusView(state, now),
    achievements: achievementService.listAchievements(state),
    achievementsUnlocked: achievementService.getUnlockedCount(state),
    stats: state.stats,
    ledger: state.ledger,
  }
}

export default {
  ACTIONS, reduce, reconcile, buildViewModel, awardXP,
  completeLesson, completePractice, recordAnswer, applyRollover, runPipeline,
}
