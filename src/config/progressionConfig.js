/* ═══════════════════════════════════════════════════════════════════════════
   progressionConfig.js — SINGLE SOURCE OF TRUTH FOR GAME BALANCE
   ---------------------------------------------------------------------------
   Every tunable number in the LunX progression system lives here. Nothing
   else in the codebase should hardcode an XP value, a gem reward, a heart
   count or a timer duration. Change a value here and the whole system
   rebalances.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Persistence ─────────────────────────────────────────────────────────── */
export const STORAGE_KEY = 'lunx_user_progress_v1'
export const STATE_VERSION = 1

/* ── Hearts ──────────────────────────────────────────────────────────────── */
export const HEARTS = {
  MAX: 5,
  /** Minutes of real time to regenerate a single heart. */
  RECOVERY_MINUTES: 30,
  /** Hearts required to begin a graded lesson. */
  COST_TO_START_LESSON: 1,
  /** Practice/review mode never consumes hearts — it is the 0-heart fallback. */
  PRACTICE_REQUIRES_HEART: false,
  /* Gem prices for refills and extra hearts live in shopConfig.js, so the
     shop and the hearts popover can never quote different numbers. */
}

/* ── Currency ────────────────────────────────────────────────────────────── */
export const CURRENCY = {
  STARTING_GEMS: 100,
  /** Gems granted each time the learner gains a level. */
  LEVEL_UP_GEMS: 15,
  /** Gems for finishing an entire section. */
  SECTION_COMPLETE_GEMS: 50,
  /** Gems for a flawless lesson (no hearts lost). */
  PERFECT_LESSON_GEMS: 5,
}

/* ── XP awards ───────────────────────────────────────────────────────────── */
export const XP = {
  /** First-time completion of a lesson. */
  LESSON: 25,
  /** Per correct answer inside a lesson or practice session. */
  CORRECT_ANSWER: 5,
  /** Bonus for completing a lesson without losing a heart. */
  PERFECT_BONUS: 10,
  /** Completing a practice / review session. */
  PRACTICE: 10,
  /** Repeating an already-completed lesson. Kept at 0 so replays can never
   *  farm XP — raise it if you want review to be rewarded. */
  LESSON_REPLAY: 0,
  /** One-off bonus the first time the daily XP goal is met. */
  DAILY_GOAL_BONUS: 15,
  /** Bonus applied on top of LESSON when a whole section is finished. */
  SECTION_COMPLETE: 50,
}

/* ── Goals ───────────────────────────────────────────────────────────────── */
export const GOALS = {
  DAILY_XP: 50,
  WEEKLY_XP: 300,
}

/* ── Levels ──────────────────────────────────────────────────────────────────
   Cumulative XP required to REACH level L:
       total(L) = 25 · (L − 1) · (L + 2)

   L1 → 0    L2 → 100   L3 → 250   L4 → 450   L5 → 700   L6 → 1000 …
   The gap between levels grows by LEVEL_STEP each level, so later levels
   cost meaningfully more without ever becoming a wall.
   ─────────────────────────────────────────────────────────────────────────── */
export const LEVELS = {
  BASE: 100,      // XP from level 1 → 2
  STEP: 50,       // extra XP added to each subsequent level gap
  MAX_LEVEL: 99,
  /** Display titles unlocked at given levels (highest match wins). */
  TITLES: [
    { level: 1,  title: 'Curious'    },
    { level: 3,  title: 'Explorer'   },
    { level: 6,  title: 'Analyst'    },
    { level: 10, title: 'Engineer'   },
    { level: 15, title: 'Researcher' },
    { level: 22, title: 'Architect'  },
    { level: 30, title: 'Luminary'   },
  ],
}

/* ── Quests ──────────────────────────────────────────────────────────────── */
export const QUESTS = {
  /** How many daily quests are generated each calendar day. */
  DAILY_COUNT: 3,
  /** How many weekly quests are generated each calendar week. */
  WEEKLY_COUNT: 3,
  /** Default gem payouts by difficulty tier. */
  REWARD: {
    easy: 20,
    medium: 30,
    hard: 50,
  },
  /** Weekly quests pay more because they span seven days. */
  WEEKLY_REWARD: {
    easy: 60,
    medium: 100,
    hard: 150,
  },
  /** Difficulty mix a generated day always tries to contain. */
  DAILY_MIX: ['easy', 'medium', 'hard'],
  WEEKLY_MIX: ['easy', 'medium', 'hard'],
  /** Completed daily quest sets kept for the history view. */
  ARCHIVE_LIMIT: 14,
}

/* ── Streak ──────────────────────────────────────────────────────────────── */
export const STREAK = {
  /** Milestones surfaced in the streak panel + achievement checks. */
  MILESTONES: [3, 7, 14, 30, 60, 100, 365],
  /** Gems awarded when a milestone day is reached. */
  MILESTONE_GEMS: { 3: 10, 7: 25, 14: 50, 30: 100, 60: 200, 100: 400, 365: 1000 },
  /* Streak Shields (price, stock limit, how far one shield reaches) are
     defined in shopConfig.js — the streak engine reads them from there. */
  /** Days of activity history retained for the calendar UI. */
  HISTORY_DAYS: 120,
}

/* ── Team missions (collaborative quests) ────────────────────────────────── */
export const TEAM = {
  /** Days a mission runs before rolling over. */
  DURATION_DAYS: 7,
  /** Simulated squad size while there is no backend. */
  SQUAD_SIZE: 4,
  /** Gems each member receives when the shared goal is met. */
  REWARD_GEMS: 50,
}

/* ── Misc ────────────────────────────────────────────────────────────────── */
export const MISC = {
  /** Entries kept in the reward/transaction ledger. */
  LEDGER_LIMIT: 60,
  /** Seconds of a session that count toward practice time before the
   *  learner is considered idle (guards against a tab left open). */
  MAX_IDLE_SECONDS: 120,
  /** Week starts on Monday (1). 0 = Sunday. */
  WEEK_START_DAY: 1,
}

/** Convenience: heart recovery interval in milliseconds. */
export const HEART_RECOVERY_MS = HEARTS.RECOVERY_MINUTES * 60 * 1000

export default {
  STORAGE_KEY, STATE_VERSION, HEARTS, CURRENCY, XP, GOALS,
  LEVELS, QUESTS, STREAK, TEAM, MISC, HEART_RECOVERY_MS,
}
