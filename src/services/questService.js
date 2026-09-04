/* ═══════════════════════════════════════════════════════════════════════════
   questService.js — THE QUEST ENGINE
   ---------------------------------------------------------------------------
   Three responsibilities, kept strictly separate:

     1. GENERATE  — turn templates into concrete, dated quest instances,
                    scaled to the learner and seeded by the date so the same
                    day always produces the same quests.
     2. EVALUATE  — recompute every active quest's progress from live state.
                    Quests are never "incremented"; they are derived, which
                    makes double-counting structurally impossible.
     3. CLAIM     — pay out a completed quest exactly once.

   Adding a quest type = adding one entry to METRICS plus a template.
   ═══════════════════════════════════════════════════════════════════════════ */

import { QUESTS } from '../config/progressionConfig'
import { DAILY_TEMPLATES, WEEKLY_TEMPLATES, QUEST_TYPES } from '../data/questTemplates'
import { createRandom, shuffleWith, clamp } from '../utils/progressionUtils'
import {
  getLocalDateKey, getWeekKey, parseDateKey, addDays,
} from '../utils/dateUtils'
import { awardGems } from './currencyService'
import { deriveCourse } from '../data/learnData'

/* ── Metrics ─────────────────────────────────────────────────────────────────
   Each quest type maps to a reader over live progression state. `scope` picks
   the daily or weekly counter bucket.
   ─────────────────────────────────────────────────────────────────────────── */
export const METRICS = {
  [QUEST_TYPES.EARN_XP]:            (s, scope) => bucket(s, scope).xp,
  [QUEST_TYPES.COMPLETE_LESSONS]:   (s, scope) => bucket(s, scope).lessons,
  [QUEST_TYPES.COMPLETE_PRACTICE]:  (s, scope) => bucket(s, scope).practiceSessions,
  [QUEST_TYPES.PERFECT_LESSON]:     (s, scope) => bucket(s, scope).perfectLessons,
  [QUEST_TYPES.EARN_GEMS]:          (s, scope) => bucket(s, scope).gems,
  [QUEST_TYPES.COMPLETE_SECTION]:   (s, scope) => bucket(s, scope).sections,
  [QUEST_TYPES.SPEND_TIME]:         (s, scope) => Math.floor(bucket(s, scope).practiceSeconds / 60),
  /* Streak-based quests read the streak itself, not a period bucket. */
  [QUEST_TYPES.REACH_STREAK]:       (s) => s.streak.current,
  [QUEST_TYPES.MAINTAIN_STREAK]:    (s) => (s.daily.lessons + s.daily.practiceSessions > 0 ? 1 : 0),
  [QUEST_TYPES.COMPLETE_DAILY_GOAL]:(s) => (s.daily.xp >= s.goals.dailyXP ? 1 : 0),
}

const bucket = (state, scope) => (scope === 'weekly' ? state.weekly : state.daily)

/* ── Generation context ──────────────────────────────────────────────────── */

/** Everything a template needs to size itself to this specific learner. */
export function buildContext(state) {
  const course = deriveCourse(state.lessons)
  return {
    level: state.level,
    xp: state.xp,
    gems: state.gems,
    streak: state.streak.current,
    longestStreak: state.streak.longest,
    lessonsCompleted: course.completedCount,
    lessonsRemaining: course.lessonsRemaining,
    totalLessons: course.totalLessons,
    sectionsRemaining: course.sectionsRemaining,
    lessonsLeftInCurrentSection: course.lessonsLeftInCurrentSection,
    dailyGoalXP: state.goals.dailyXP,
    weeklyGoalXP: state.goals.weeklyXP,
  }
}

/* ── Generation ──────────────────────────────────────────────────────────── */

function instantiate(template, tier, ctx, { scope, periodKey, expiresAt }) {
  const target = Math.max(1, Math.floor(template.targets[tier](ctx)))
  const rewardTable = scope === 'weekly' ? QUESTS.WEEKLY_REWARD : QUESTS.REWARD
  return {
    id: `${scope}:${periodKey}:${template.key}`,
    templateKey: template.key,
    scope,
    periodKey,
    type: template.type,
    title: template.title[tier] ?? template.title.easy,
    description: template.describe(target, ctx),
    icon: template.icon,
    category: template.category,
    difficulty: tier,
    target,
    progress: 0,
    reward: { gems: rewardTable[tier] },
    expiresAt,
    completed: false,
    completedAt: null,
    claimed: false,
    claimedAt: null,
    createdAt: Date.now(),
  }
}

/**
 * Pick a balanced set of quests for one period.
 *
 * Guarantees:
 *   • a spread of easy / medium / hard where possible
 *   • never the identical set two days running (seeded on the date key)
 *   • never an impossible quest — `available()` filters targets the learner
 *     could not reach (no "reach a 100-day streak" for a day-one account)
 */
function generateSet({ templates, mix, count, scope, periodKey, expiresAt, ctx, seed }) {
  const random = createRandom(seed)
  const pool = shuffleWith(random, templates)
  const used = new Set()
  const quests = []

  const eligible = (template, tier) => {
    if (used.has(template.key)) return false
    if (template.fixedTier && template.fixedTier !== tier) return false
    if (typeof template.available === 'function' && !template.available(ctx, tier)) return false
    return typeof template.targets?.[tier] === 'function'
  }

  /* Pass 1 — fill each difficulty slot from the shuffled pool. */
  for (const tier of mix.slice(0, count)) {
    const template = pool.find((t) => eligible(t, tier))
    if (!template) continue
    used.add(template.key)
    quests.push(instantiate(template, tier, ctx, { scope, periodKey, expiresAt }))
  }

  /* Pass 2 — if a slot could not be filled (e.g. a brand-new account where
     most templates are gated), backfill with any remaining eligible quest. */
  for (const tier of mix) {
    if (quests.length >= count) break
    const template = pool.find((t) => eligible(t, tier))
    if (!template) continue
    used.add(template.key)
    quests.push(instantiate(template, tier, ctx, { scope, periodKey, expiresAt }))
  }

  /* Show easiest first — it reads as a ladder rather than a wall. */
  const order = { easy: 0, medium: 1, hard: 2 }
  return quests.sort((a, b) => order[a.difficulty] - order[b.difficulty])
}

export function generateDailyQuests(state, now = Date.now()) {
  const dateKey = getLocalDateKey(new Date(now))
  const expires = parseDateKey(addDays(dateKey, 1))?.getTime() ?? now + 86400000
  return generateSet({
    templates: DAILY_TEMPLATES,
    mix: QUESTS.DAILY_MIX,
    count: QUESTS.DAILY_COUNT,
    scope: 'daily',
    periodKey: dateKey,
    expiresAt: expires,
    ctx: buildContext(state),
    /* Seeded on the date + the account's creation stamp: stable across
       refreshes, different between days and between learners. */
    seed: `daily|${dateKey}|${state.createdAt}`,
  })
}

export function generateWeeklyQuests(state, now = Date.now()) {
  const weekKey = getWeekKey(new Date(now))
  const expires = parseDateKey(addDays(weekKey, 7))?.getTime() ?? now + 7 * 86400000
  return generateSet({
    templates: WEEKLY_TEMPLATES,
    mix: QUESTS.WEEKLY_MIX,
    count: QUESTS.WEEKLY_COUNT,
    scope: 'weekly',
    periodKey: weekKey,
    expiresAt: expires,
    ctx: buildContext(state),
    seed: `weekly|${weekKey}|${state.createdAt}`,
  })
}

/**
 * Make sure the stored quest sets belong to the CURRENT calendar day/week.
 * Called on load, on midnight rollover and before any evaluation.
 * Archives the finished daily set so history is not lost.
 */
export function ensureQuests(state, now = Date.now()) {
  const dateKey = getLocalDateKey(new Date(now))
  const weekKey = getWeekKey(new Date(now))
  const events = []
  let quests = state.quests
  let next = state

  if (quests.dailyKey !== dateKey) {
    const archive = quests.dailyKey
      ? [{
          periodKey: quests.dailyKey,
          scope: 'daily',
          quests: quests.daily.map(stripForArchive),
          completed: quests.daily.filter((q) => q.completed).length,
          total: quests.daily.length,
        }, ...quests.archive].slice(0, QUESTS.ARCHIVE_LIMIT)
      : quests.archive

    quests = {
      ...quests,
      dailyKey: dateKey,
      daily: generateDailyQuests(next, now),
      archive,
    }
    events.push({ type: 'DAILY_QUESTS_GENERATED', dateKey })
  }

  if (quests.weeklyKey !== weekKey) {
    quests = {
      ...quests,
      weeklyKey: weekKey,
      weekly: generateWeeklyQuests(next, now),
    }
    events.push({ type: 'WEEKLY_QUESTS_GENERATED', weekKey })
  }

  if (quests === state.quests) return { state, events }
  return { state: { ...state, quests }, events }
}

function stripForArchive(q) {
  return {
    id: q.id, title: q.title, description: q.description, icon: q.icon,
    difficulty: q.difficulty, target: q.target, progress: q.progress,
    reward: q.reward, completed: q.completed, claimed: q.claimed,
  }
}

/* ── Evaluation ──────────────────────────────────────────────────────────── */

function evaluateOne(quest, state, now) {
  const metric = METRICS[quest.type]
  if (!metric) return { quest, justCompleted: false }

  const raw = metric(state, quest.scope)
  const progress = clamp(Math.floor(Number.isFinite(raw) ? raw : 0), 0, quest.target)
  const isComplete = progress >= quest.target

  /* Completion latches: once a quest is complete it stays complete for the
     period, even if the underlying metric could later go down (e.g. a streak
     target). Progress on a latched quest is pinned at the target. */
  if (quest.completed) {
    return {
      quest: quest.progress === quest.target ? quest : { ...quest, progress: quest.target },
      justCompleted: false,
    }
  }

  if (progress === quest.progress && !isComplete) return { quest, justCompleted: false }

  return {
    quest: {
      ...quest,
      progress,
      completed: isComplete,
      completedAt: isComplete ? now : null,
    },
    justCompleted: isComplete,
  }
}

/**
 * Recompute every active quest from live state.
 * Runs after EVERY progression action — this is what makes quest bars update
 * the instant a lesson finishes, with no refresh and no manual increments.
 */
export function evaluateQuests(state, now = Date.now()) {
  const events = []
  let changed = false
  let completedCount = 0

  const run = (list) => list.map((q) => {
    const { quest, justCompleted } = evaluateOne(q, state, now)
    if (quest !== q) changed = true
    if (justCompleted) {
      completedCount++
      events.push({ type: 'QUEST_COMPLETED', quest })
    }
    return quest
  })

  const daily = run(state.quests.daily)
  const weekly = run(state.quests.weekly)

  if (!changed) return { state, events }

  const next = {
    ...state,
    quests: { ...state.quests, daily, weekly },
    stats: completedCount
      ? { ...state.stats, totalQuestsCompleted: state.stats.totalQuestsCompleted + completedCount }
      : state.stats,
  }
  return { state: next, events }
}

/* ── Claiming ────────────────────────────────────────────────────────────── */

export function findQuest(state, questId) {
  return (
    state.quests.daily.find((q) => q.id === questId) ??
    state.quests.weekly.find((q) => q.id === questId) ??
    null
  )
}

/**
 * Pay out a completed quest. Idempotent by construction: the `claimed` flag
 * is checked first and set in the same transaction, so a double-click, a
 * duplicated React effect or a refresh mid-claim can never pay twice.
 */
export function claimQuest(state, questId, now = Date.now()) {
  const quest = findQuest(state, questId)
  if (!quest) return { state, events: [], ok: false, error: 'not-found' }
  if (!quest.completed) return { state, events: [], ok: false, error: 'not-complete' }
  if (quest.claimed) return { state, events: [], ok: false, error: 'already-claimed' }

  const claimed = { ...quest, claimed: true, claimedAt: now }
  const replace = (list) => list.map((q) => (q.id === questId ? claimed : q))

  let next = {
    ...state,
    quests: { ...state.quests, daily: replace(state.quests.daily), weekly: replace(state.quests.weekly) },
    stats: { ...state.stats, totalQuestsClaimed: state.stats.totalQuestsClaimed + 1 },
  }

  const events = [{ type: 'QUEST_CLAIMED', quest: claimed }]

  if (quest.reward?.gems) {
    const result = awardGems(next, quest.reward.gems, 'quest', { questId, questTitle: quest.title })
    next = result.state
    events.push(...result.events)
  }

  return { state: next, events, ok: true }
}

/** Claim every completed-but-unclaimed quest in one transaction. */
export function claimAllQuests(state, now = Date.now()) {
  const pending = getClaimableQuests(state)
  let next = state
  const events = []
  for (const quest of pending) {
    const result = claimQuest(next, quest.id, now)
    if (result.ok) {
      next = result.state
      events.push(...result.events)
    }
  }
  return { state: next, events, claimed: pending.length }
}

/* ── Selectors ───────────────────────────────────────────────────────────── */

export function getActiveQuests(state) {
  return [...state.quests.daily, ...state.quests.weekly]
}

export function getClaimableQuests(state) {
  return getActiveQuests(state).filter((q) => q.completed && !q.claimed)
}

export function getClaimableCount(state) {
  return getClaimableQuests(state).length
}

/** Summary used by the sidebar header ("2 of 3 done"). */
export function getQuestSummary(state) {
  const daily = state.quests.daily
  return {
    total: daily.length,
    completed: daily.filter((q) => q.completed).length,
    claimable: daily.filter((q) => q.completed && !q.claimed).length,
    allDone: daily.length > 0 && daily.every((q) => q.completed),
  }
}

export default {
  generateDailyQuests, generateWeeklyQuests, ensureQuests, evaluateQuests,
  claimQuest, claimAllQuests, findQuest, getActiveQuests, getClaimableQuests,
  getClaimableCount, getQuestSummary, buildContext, METRICS,
}
