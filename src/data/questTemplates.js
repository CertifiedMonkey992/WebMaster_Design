/* ═══════════════════════════════════════════════════════════════════════════
   questTemplates.js — THE QUEST CATALOGUE
   ---------------------------------------------------------------------------
   Quests are DATA, not hardcoded progress bars. Each template describes what
   is measured (`type`), how demanding each difficulty tier is (`targets`) and
   when it is even allowed to appear (`available`). questService turns these
   into concrete, dated quest instances.

   Adding a new quest = adding an object here (plus a metric in questService
   if it measures something genuinely new).
   ═══════════════════════════════════════════════════════════════════════════ */

import { roundTarget, clamp } from '../utils/progressionUtils'

/** Every measurable quest type. questService.METRICS maps each of these to a
 *  reader that pulls the live number out of progression state. */
export const QUEST_TYPES = {
  EARN_XP:             'EARN_XP',
  COMPLETE_LESSONS:    'COMPLETE_LESSONS',
  COMPLETE_PRACTICE:   'COMPLETE_PRACTICE',
  MAINTAIN_STREAK:     'MAINTAIN_STREAK',
  REACH_STREAK:        'REACH_STREAK',
  EARN_GEMS:           'EARN_GEMS',
  COMPLETE_SECTION:    'COMPLETE_SECTION',
  PERFECT_LESSON:      'PERFECT_LESSON',
  SPEND_TIME:          'SPEND_TIME',
  COMPLETE_DAILY_GOAL: 'COMPLETE_DAILY_GOAL',
}

export const QUEST_CATEGORY = {
  LEARNING:    'learning',
  MASTERY:     'mastery',
  CONSISTENCY: 'consistency',
  ECONOMY:     'economy',
}

/** Scale factor so a level-20 learner is not handed a level-1 quest.
 *  Grows slowly and caps out, so quests stay achievable in one sitting. */
const scale = (level) => clamp(1 + (level - 1) * 0.06, 1, 2.2)

/* ── Daily quest templates ───────────────────────────────────────────────── */
export const DAILY_TEMPLATES = [
  {
    key: 'quick-start',
    type: QUEST_TYPES.EARN_XP,
    icon: 'bolt',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Quick Start', medium: 'Momentum', hard: 'XP Surge' },
    describe: (t) => `Earn ${t} XP today`,
    unit: 'XP',
    targets: {
      easy:   (c) => roundTarget(40 * scale(c.level)),
      medium: (c) => roundTarget(75 * scale(c.level)),
      hard:   (c) => roundTarget(140 * scale(c.level)),
    },
  },
  {
    key: 'into-gear',
    type: QUEST_TYPES.COMPLETE_LESSONS,
    icon: 'book',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Getting Into Gear', medium: 'Steady Climb', hard: 'Deep Dive' },
    describe: (t) => `Complete ${t} lesson${t === 1 ? '' : 's'} today`,
    unit: 'lessons',
    targets: {
      easy:   () => 1,
      medium: (c) => clamp(Math.round(2 * scale(c.level)), 2, 4),
      hard:   (c) => clamp(Math.round(4 * scale(c.level)), 4, 7),
    },
    /* Never ask for more lessons than the learner can actually reach. */
    available: (c, tier) =>
      c.lessonsRemaining >= (tier === 'hard' ? 4 : tier === 'medium' ? 2 : 1),
  },
  {
    key: 'practice-makes-progress',
    type: QUEST_TYPES.SPEND_TIME,
    icon: 'timer',
    category: QUEST_CATEGORY.MASTERY,
    title: { easy: 'Warm Up', medium: 'Practice Makes Progress', hard: 'Study Marathon' },
    describe: (t) => `Spend ${t} minute${t === 1 ? '' : 's'} learning today`,
    unit: 'min',
    targets: {
      easy:   () => 5,
      medium: () => 10,
      hard:   () => 20,
    },
  },
  {
    key: 'review-round',
    type: QUEST_TYPES.COMPLETE_PRACTICE,
    icon: 'target',
    category: QUEST_CATEGORY.MASTERY,
    title: { easy: 'Review Round', medium: 'Sharpen Up', hard: 'Drill Sergeant' },
    describe: (t) => `Finish ${t} practice session${t === 1 ? '' : 's'}`,
    unit: 'sessions',
    targets: { easy: () => 1, medium: () => 2, hard: () => 3 },
    /* Practice only makes sense once there is something to review. */
    available: (c) => c.lessonsCompleted >= 1,
  },
  {
    key: 'keep-it-going',
    type: QUEST_TYPES.MAINTAIN_STREAK,
    icon: 'flame',
    category: QUEST_CATEGORY.CONSISTENCY,
    title: { easy: 'Keep It Going', medium: 'Keep It Going', hard: 'Keep It Going' },
    describe: () => 'Keep your streak alive today',
    unit: '',
    targets: { easy: () => 1, medium: () => 1, hard: () => 1 },
    fixedTier: 'easy',
    available: (c) => c.streak >= 1,
  },
  {
    key: 'perfect-run',
    type: QUEST_TYPES.PERFECT_LESSON,
    icon: 'star',
    category: QUEST_CATEGORY.MASTERY,
    title: { easy: 'Perfect Run', medium: 'Flawless Pair', hard: 'Untouchable' },
    describe: (t) => `Complete ${t} lesson${t === 1 ? '' : 's'} without losing a heart`,
    unit: 'perfect',
    targets: { easy: () => 1, medium: () => 2, hard: () => 3 },
    available: (c, tier) =>
      c.lessonsRemaining >= (tier === 'hard' ? 3 : tier === 'medium' ? 2 : 1),
  },
  {
    key: 'gem-hunter',
    type: QUEST_TYPES.EARN_GEMS,
    icon: 'gem',
    category: QUEST_CATEGORY.ECONOMY,
    title: { easy: 'Gem Hunter', medium: 'Prospector', hard: 'Gem Baron' },
    describe: (t) => `Earn ${t} gems today`,
    unit: 'gems',
    targets: { easy: () => 20, medium: () => 40, hard: () => 80 },
    available: (c) => c.level >= 2,
  },
  {
    key: 'hit-the-goal',
    type: QUEST_TYPES.COMPLETE_DAILY_GOAL,
    icon: 'check-circle',
    category: QUEST_CATEGORY.CONSISTENCY,
    title: { easy: 'On Target', medium: 'On Target', hard: 'On Target' },
    describe: (t, c) => `Hit your daily goal of ${c.dailyGoalXP} XP`,
    unit: '',
    targets: { easy: () => 1, medium: () => 1, hard: () => 1 },
    fixedTier: 'medium',
  },
  {
    key: 'knowledge-builder',
    type: QUEST_TYPES.COMPLETE_SECTION,
    icon: 'layers',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Knowledge Builder', medium: 'Knowledge Builder', hard: 'Section Sweep' },
    describe: (t) => `Complete ${t} full section${t === 1 ? '' : 's'}`,
    unit: 'sections',
    targets: { easy: () => 1, medium: () => 1, hard: () => 2 },
    fixedTier: 'hard',
    /* Only offered when a section is genuinely within reach today. */
    available: (c) =>
      c.lessonsLeftInCurrentSection > 0 && c.lessonsLeftInCurrentSection <= 3,
  },
]

/* ── Weekly quest templates ──────────────────────────────────────────────── */
export const WEEKLY_TEMPLATES = [
  {
    key: 'weekly-scholar',
    type: QUEST_TYPES.EARN_XP,
    icon: 'bolt',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Weekly Scholar', medium: 'Weekly Scholar', hard: 'XP Machine' },
    describe: (t) => `Earn ${t} XP this week`,
    unit: 'XP',
    targets: {
      easy:   (c) => roundTarget(250 * scale(c.level)),
      medium: (c) => roundTarget(500 * scale(c.level)),
      hard:   (c) => roundTarget(900 * scale(c.level)),
    },
  },
  {
    key: 'dedicated-learner',
    type: QUEST_TYPES.COMPLETE_LESSONS,
    icon: 'book',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Dedicated Learner', medium: 'Dedicated Learner', hard: 'Course Crusher' },
    describe: (t) => `Complete ${t} lessons this week`,
    unit: 'lessons',
    targets: {
      easy:   (c) => clamp(Math.round(5 * scale(c.level)),  3, Math.max(3, c.lessonsRemaining)),
      medium: (c) => clamp(Math.round(10 * scale(c.level)), 5, Math.max(5, c.lessonsRemaining)),
      hard:   (c) => clamp(Math.round(15 * scale(c.level)), 8, Math.max(8, c.lessonsRemaining)),
    },
    available: (c, tier) =>
      c.lessonsRemaining >= (tier === 'hard' ? 8 : tier === 'medium' ? 5 : 3),
  },
  {
    key: 'practice-champion',
    type: QUEST_TYPES.SPEND_TIME,
    icon: 'timer',
    category: QUEST_CATEGORY.MASTERY,
    title: { easy: 'Practice Champion', medium: 'Practice Champion', hard: 'Time Lord' },
    describe: (t) => `Spend ${t} minutes learning this week`,
    unit: 'min',
    targets: { easy: () => 30, medium: () => 60, hard: () => 120 },
  },
  {
    key: 'on-fire',
    type: QUEST_TYPES.REACH_STREAK,
    icon: 'flame',
    category: QUEST_CATEGORY.CONSISTENCY,
    title: { easy: 'On Fire', medium: 'Consistency', hard: 'Unbreakable' },
    describe: (t) => `Reach a ${t}-day streak`,
    unit: 'days',
    /* Targets are always relative to where the learner already is, so a new
     * account never sees "reach a 100-day streak". */
    targets: {
      easy:   (c) => clamp(c.streak + 3, 3, 400),
      medium: (c) => clamp(Math.max(7, c.streak + 5), 7, 400),
      hard:   (c) => clamp(Math.max(14, c.streak + 7), 14, 400),
    },
    available: (c, tier) => {
      /* Only offer streak targets that are reachable inside one week. */
      const need =
        tier === 'hard'   ? Math.max(14, c.streak + 7)
      : tier === 'medium' ? Math.max(7,  c.streak + 5)
      :                     c.streak + 3
      return need - c.streak <= 7
    },
  },
  {
    key: 'perfect-chain',
    type: QUEST_TYPES.PERFECT_LESSON,
    icon: 'star',
    category: QUEST_CATEGORY.MASTERY,
    title: { easy: 'Clean Sweep', medium: 'Perfect Chain', hard: 'Immaculate' },
    describe: (t) => `Complete ${t} perfect lessons this week`,
    unit: 'perfect',
    targets: { easy: () => 2, medium: () => 4, hard: () => 7 },
    available: (c, tier) =>
      c.lessonsRemaining >= (tier === 'hard' ? 7 : tier === 'medium' ? 4 : 2),
  },
  {
    key: 'section-scholar',
    type: QUEST_TYPES.COMPLETE_SECTION,
    icon: 'layers',
    category: QUEST_CATEGORY.LEARNING,
    title: { easy: 'Section Scholar', medium: 'Section Scholar', hard: 'Double Section' },
    describe: (t) => `Complete ${t} full section${t === 1 ? '' : 's'} this week`,
    unit: 'sections',
    targets: { easy: () => 1, medium: () => 1, hard: () => 2 },
    available: (c, tier) => c.sectionsRemaining >= (tier === 'hard' ? 2 : 1),
  },
  {
    key: 'treasury',
    type: QUEST_TYPES.EARN_GEMS,
    icon: 'gem',
    category: QUEST_CATEGORY.ECONOMY,
    title: { easy: 'Treasury', medium: 'Treasury', hard: 'Vault Filler' },
    describe: (t) => `Earn ${t} gems this week`,
    unit: 'gems',
    targets: { easy: () => 100, medium: () => 180, hard: () => 300 },
    available: (c) => c.level >= 2,
  },
]

export const ALL_TEMPLATES = [...DAILY_TEMPLATES, ...WEEKLY_TEMPLATES]

export function getTemplate(key, scope) {
  const pool = scope === 'weekly' ? WEEKLY_TEMPLATES : DAILY_TEMPLATES
  return pool.find((t) => t.key === key) ?? ALL_TEMPLATES.find((t) => t.key === key)
}
