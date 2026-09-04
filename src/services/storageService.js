/* ═══════════════════════════════════════════════════════════════════════════
   storageService.js — VERSIONED PERSISTENCE LAYER
   ---------------------------------------------------------------------------
   ONE key holds ALL progression state: `lunx_user_progress_v1`.

   This module is the only place that touches localStorage. Swapping it for a
   real backend later means replacing `load` / `save` with async calls — the
   shape of the state and every service above it stays identical.

   Corrupted, partial or missing data always degrades to a valid default state
   rather than throwing: a learner should never see a white screen because a
   browser extension mangled a storage value.
   ═══════════════════════════════════════════════════════════════════════════ */

import { STORAGE_KEY, STATE_VERSION, HEARTS, CURRENCY, GOALS } from '../config/progressionConfig'
import { getLocalDateKey, getWeekKey } from '../utils/dateUtils'

/* ── Default state ───────────────────────────────────────────────────────── */

export function createDefaultState(now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  return {
    version: STATE_VERSION,
    createdAt: now,
    updatedAt: now,

    /* Core resources */
    xp: 0,
    gems: CURRENCY.STARTING_GEMS,
    hearts: HEARTS.MAX,
    maxHearts: HEARTS.MAX,
    /** Timestamp the current heart-regeneration cycle started. null when full.
     *  This is the SOURCE OF TRUTH for recovery — never a running timer. */
    heartAnchor: null,

    /* Levels */
    level: 1,
    /** Highest level that has already paid out its level-up bonus. Prevents
     *  a bonus ever being granted twice for the same level. */
    levelRewardedUpTo: 1,

    /* Streak */
    streak: {
      current: 0,
      longest: 0,
      lastActivityDate: null,   // "YYYY-MM-DD" of the last qualifying activity
      lastStreakDate: null,     // "YYYY-MM-DD" the streak counter last advanced
      freezes: 0,               // architecture hook for a future freeze item
      history: {},              // dateKey -> { xp, lessons, seconds }
    },

    /* Rolling windows */
    daily: emptyDaily(today),
    weekly: emptyWeekly(getWeekKey(new Date(now))),

    goals: {
      dailyXP: GOALS.DAILY_XP,
      weeklyXP: GOALS.WEEKLY_XP,
    },

    /* Course progress — keyed by lesson id, so completion is idempotent */
    lessons: {},              // id -> { firstCompletedAt, lastCompletedAt, attempts, perfect, bestAccuracy }
    sectionsCompleted: {},    // id -> timestamp
    /** Per-lesson XP budget already paid out for correct answers. Replaying a
     *  lesson can therefore never farm XP — the budget is spent once. */
    answerXP: {},             // lessonId -> xp already awarded

    /* Quests */
    quests: {
      dailyKey: null,         // date key the daily set was generated for
      weeklyKey: null,        // week key the weekly set was generated for
      daily: [],
      weekly: [],
      archive: [],            // finished daily sets, newest first
    },

    /* Achievements — id -> unlockedAt timestamp */
    achievements: {},

    /* Collaborative team mission (locally simulated until there is a backend) */
    team: null,

    /* Lifetime statistics — never reset by daily/weekly rollover */
    stats: {
      totalXPEarned: 0,
      totalGemsEarned: 0,
      totalGemsSpent: 0,
      totalLessonsCompleted: 0,     // unique lessons
      totalLessonAttempts: 0,       // including replays
      totalPerfectLessons: 0,
      totalSectionsCompleted: 0,
      totalPracticeSessions: 0,
      totalPracticeSeconds: 0,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      totalHeartsLost: 0,
      totalQuestsCompleted: 0,
      totalQuestsClaimed: 0,
      totalTeamMissionsCompleted: 0,
      daysActive: 0,
    },

    /* Recent transactions — powers the reward history view */
    ledger: [],
  }
}

export function emptyDaily(dateKey) {
  return {
    dateKey,
    xp: 0,
    lessons: 0,
    perfectLessons: 0,
    practiceSessions: 0,
    practiceSeconds: 0,
    gems: 0,
    sections: 0,
    correctAnswers: 0,
    goalAwarded: false,
  }
}

export function emptyWeekly(weekKey) {
  return {
    weekKey,
    xp: 0,
    lessons: 0,
    perfectLessons: 0,
    practiceSessions: 0,
    practiceSeconds: 0,
    gems: 0,
    sections: 0,
    correctAnswers: 0,
  }
}

/* ── Validation / repair ─────────────────────────────────────────────────── */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback)

/**
 * Merge a loaded blob onto the default shape, keeping only values of the
 * expected type. Anything missing, corrupted or from an older build is filled
 * in from defaults, so the app always receives a complete, valid state.
 */
export function sanitizeState(raw, now = Date.now()) {
  const base = createDefaultState(now)
  if (!isObj(raw)) return base

  const s = { ...base }

  s.createdAt = num(raw.createdAt, base.createdAt)
  s.updatedAt = num(raw.updatedAt, now)

  s.xp = Math.max(0, Math.floor(num(raw.xp, 0)))
  s.gems = Math.max(0, Math.floor(num(raw.gems, base.gems)))
  s.maxHearts = Math.max(1, Math.floor(num(raw.maxHearts, HEARTS.MAX)))
  s.hearts = Math.min(s.maxHearts, Math.max(0, Math.floor(num(raw.hearts, s.maxHearts))))
  s.heartAnchor = Number.isFinite(raw.heartAnchor) ? raw.heartAnchor : null
  s.level = Math.max(1, Math.floor(num(raw.level, 1)))
  s.levelRewardedUpTo = Math.max(1, Math.floor(num(raw.levelRewardedUpTo, 1)))

  if (isObj(raw.streak)) {
    s.streak = {
      current: Math.max(0, Math.floor(num(raw.streak.current, 0))),
      longest: Math.max(0, Math.floor(num(raw.streak.longest, 0))),
      lastActivityDate: typeof raw.streak.lastActivityDate === 'string' ? raw.streak.lastActivityDate : null,
      lastStreakDate: typeof raw.streak.lastStreakDate === 'string' ? raw.streak.lastStreakDate : null,
      freezes: Math.max(0, Math.floor(num(raw.streak.freezes, 0))),
      history: isObj(raw.streak.history) ? raw.streak.history : {},
    }
    s.streak.longest = Math.max(s.streak.longest, s.streak.current)
  }

  if (isObj(raw.daily) && typeof raw.daily.dateKey === 'string') {
    s.daily = { ...emptyDaily(raw.daily.dateKey), ...pickNumbers(raw.daily, emptyDaily(raw.daily.dateKey)) }
    s.daily.dateKey = raw.daily.dateKey
    s.daily.goalAwarded = raw.daily.goalAwarded === true
  }

  if (isObj(raw.weekly) && typeof raw.weekly.weekKey === 'string') {
    s.weekly = { ...emptyWeekly(raw.weekly.weekKey), ...pickNumbers(raw.weekly, emptyWeekly(raw.weekly.weekKey)) }
    s.weekly.weekKey = raw.weekly.weekKey
  }

  if (isObj(raw.goals)) {
    s.goals = {
      dailyXP: Math.max(10, Math.floor(num(raw.goals.dailyXP, GOALS.DAILY_XP))),
      weeklyXP: Math.max(10, Math.floor(num(raw.goals.weeklyXP, GOALS.WEEKLY_XP))),
    }
  }

  if (isObj(raw.lessons)) {
    s.lessons = {}
    for (const [id, rec] of Object.entries(raw.lessons)) {
      if (!isObj(rec)) continue
      s.lessons[id] = {
        firstCompletedAt: num(rec.firstCompletedAt, now),
        lastCompletedAt: num(rec.lastCompletedAt, num(rec.firstCompletedAt, now)),
        attempts: Math.max(1, Math.floor(num(rec.attempts, 1))),
        perfect: rec.perfect === true,
        bestAccuracy: Math.min(1, Math.max(0, num(rec.bestAccuracy, 0))),
      }
    }
  }

  if (isObj(raw.sectionsCompleted)) s.sectionsCompleted = { ...raw.sectionsCompleted }
  if (isObj(raw.achievements)) s.achievements = { ...raw.achievements }

  if (isObj(raw.answerXP)) {
    s.answerXP = {}
    for (const [id, value] of Object.entries(raw.answerXP)) {
      s.answerXP[id] = Math.max(0, Math.floor(num(value, 0)))
    }
  }

  if (isObj(raw.quests)) {
    s.quests = {
      dailyKey: typeof raw.quests.dailyKey === 'string' ? raw.quests.dailyKey : null,
      weeklyKey: typeof raw.quests.weeklyKey === 'string' ? raw.quests.weeklyKey : null,
      daily: Array.isArray(raw.quests.daily) ? raw.quests.daily.filter(isValidQuest) : [],
      weekly: Array.isArray(raw.quests.weekly) ? raw.quests.weekly.filter(isValidQuest) : [],
      archive: Array.isArray(raw.quests.archive) ? raw.quests.archive.slice(0, 30) : [],
    }
  }

  if (isObj(raw.team)) s.team = raw.team

  if (isObj(raw.stats)) {
    s.stats = { ...base.stats }
    for (const key of Object.keys(base.stats)) {
      s.stats[key] = Math.max(0, Math.floor(num(raw.stats[key], 0)))
    }
    /* Older builds tracked minutes; accept and convert. */
    if (!Number.isFinite(raw.stats.totalPracticeSeconds) && Number.isFinite(raw.stats.totalPracticeMinutes)) {
      s.stats.totalPracticeSeconds = Math.floor(raw.stats.totalPracticeMinutes * 60)
    }
  }

  if (Array.isArray(raw.ledger)) {
    s.ledger = raw.ledger.filter((e) => isObj(e) && typeof e.reason === 'string').slice(0, 100)
  }

  s.version = STATE_VERSION
  return s
}

function pickNumbers(source, template) {
  const out = {}
  for (const key of Object.keys(template)) {
    if (typeof template[key] === 'number') out[key] = Math.max(0, Math.floor(num(source[key], 0)))
  }
  return out
}

function isValidQuest(q) {
  return isObj(q) && typeof q.id === 'string' && typeof q.type === 'string' && Number.isFinite(q.target)
}

/* ── Migrations ──────────────────────────────────────────────────────────────
   Each entry upgrades state from version N to N+1. Add a new function when
   the shape changes; sanitizeState then fills in anything still missing.
   ─────────────────────────────────────────────────────────────────────────── */
const MIGRATIONS = {
  // 1: (state) => ({ ...state, version: 2, newField: default }),
}

export function migrate(raw) {
  let state = raw
  let guard = 0
  while (isObj(state) && Number(state.version) < STATE_VERSION && guard++ < 20) {
    const step = MIGRATIONS[Number(state.version)]
    if (!step) break
    state = step(state)
  }
  return state
}

/* ── Read / write ────────────────────────────────────────────────────────── */

function getStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    /* Some browsers throw on access in private mode — probe once. */
    const probe = '__lunx_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

/** Load progression state. Always returns a complete, valid state object. */
export function load(now = Date.now()) {
  const store = getStorage()
  if (!store) return { state: createDefaultState(now), isNew: true, recovered: false }

  let text = null
  try {
    text = store.getItem(STORAGE_KEY)
  } catch {
    return { state: createDefaultState(now), isNew: true, recovered: false }
  }

  if (!text) return { state: createDefaultState(now), isNew: true, recovered: false }

  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    /* Corrupted JSON — start fresh rather than crash, and keep the bad blob
       under a side key so nothing is silently destroyed. */
    try { store.setItem(`${STORAGE_KEY}__corrupt`, text.slice(0, 20000)) } catch { /* ignore */ }
    return { state: createDefaultState(now), isNew: true, recovered: true }
  }

  const migrated = migrate(parsed)
  const state = sanitizeState(migrated, now)
  return { state, isNew: false, recovered: !isObj(parsed) }
}

/** Persist progression state. Failures are non-fatal — the session keeps
 *  working in memory even when storage is unavailable or full. */
export function save(state) {
  const store = getStorage()
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }))
    return true
  } catch {
    return false
  }
}

/** Wipe progression state (used by the developer panel). */
export function clear() {
  const store = getStorage()
  if (!store) return false
  try {
    store.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/** Export the raw JSON so a learner (or a future backend sync) can move it. */
export function exportState(state) {
  return JSON.stringify(state, null, 2)
}

export default { load, save, clear, createDefaultState, sanitizeState, migrate, exportState }
