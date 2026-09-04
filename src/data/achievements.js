/* ═══════════════════════════════════════════════════════════════════════════
   achievements.js — PERMANENT MILESTONES
   ---------------------------------------------------------------------------
   Quests are temporary and reset. Achievements are permanent and never reset.
   Each one is a pure predicate over progression state, evaluated after every
   action, and unlocked exactly once (achievementService records unlockedAt).
   ═══════════════════════════════════════════════════════════════════════════ */

export const ACHIEVEMENT_TIER = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD:   'gold',
}

/**
 * Each achievement:
 *   id       stable key, also the storage key — never rename an existing one
 *   icon     icon id resolved by components/progression/Icons.jsx
 *   test(s)  predicate over progression state → boolean
 *   progress(s) → { current, target } for the partially-complete bar
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your very first lesson',
    icon: 'sparkle',
    tier: ACHIEVEMENT_TIER.BRONZE,
    gems: 10,
    progress: (s) => ({ current: s.stats.totalLessonsCompleted, target: 1 }),
  },
  {
    id: 'first-streak',
    title: 'First Streak',
    description: 'Learn two days in a row',
    icon: 'flame',
    tier: ACHIEVEMENT_TIER.BRONZE,
    gems: 10,
    progress: (s) => ({ current: s.streak.longest, target: 2 }),
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: 'flame',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 40,
    progress: (s) => ({ current: s.streak.longest, target: 7 }),
  },
  {
    id: 'unbroken',
    title: 'Unbroken',
    description: 'Reach a 30-day streak',
    icon: 'flame',
    tier: ACHIEVEMENT_TIER.GOLD,
    gems: 150,
    progress: (s) => ({ current: s.streak.longest, target: 30 }),
  },
  {
    id: 'knowledge-seeker',
    title: 'Knowledge Seeker',
    description: 'Complete 10 lessons',
    icon: 'book',
    tier: ACHIEVEMENT_TIER.BRONZE,
    gems: 25,
    progress: (s) => ({ current: s.stats.totalLessonsCompleted, target: 10 }),
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Complete 25 lessons',
    icon: 'book',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 75,
    progress: (s) => ({ current: s.stats.totalLessonsCompleted, target: 25 }),
  },
  {
    id: 'xp-machine',
    title: 'XP Machine',
    description: 'Earn 1,000 lifetime XP',
    icon: 'bolt',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 60,
    progress: (s) => ({ current: s.stats.totalXPEarned, target: 1000 }),
  },
  {
    id: 'gem-collector',
    title: 'Gem Collector',
    description: 'Earn 500 gems in total',
    icon: 'gem',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 50,
    progress: (s) => ({ current: s.stats.totalGemsEarned, target: 500 }),
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Complete 5 lessons without losing a heart',
    icon: 'star',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 50,
    progress: (s) => ({ current: s.stats.totalPerfectLessons, target: 5 }),
  },
  {
    id: 'section-master',
    title: 'Section Master',
    description: 'Finish an entire section',
    icon: 'layers',
    tier: ACHIEVEMENT_TIER.BRONZE,
    gems: 30,
    progress: (s) => ({ current: s.stats.totalSectionsCompleted, target: 1 }),
  },
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    description: 'Spend 60 minutes learning',
    icon: 'timer',
    tier: ACHIEVEMENT_TIER.BRONZE,
    gems: 25,
    progress: (s) => ({
      current: Math.floor(s.stats.totalPracticeSeconds / 60),
      target: 60,
    }),
  },
  {
    id: 'quest-runner',
    title: 'Quest Runner',
    description: 'Claim 10 quest rewards',
    icon: 'target',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 50,
    progress: (s) => ({ current: s.stats.totalQuestsClaimed, target: 10 }),
  },
  {
    id: 'level-ten',
    title: 'Double Digits',
    description: 'Reach level 10',
    icon: 'chevron-up',
    tier: ACHIEVEMENT_TIER.GOLD,
    gems: 100,
    progress: (s) => ({ current: s.level, target: 10 }),
  },
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Help a team mission reach its goal',
    icon: 'users',
    tier: ACHIEVEMENT_TIER.SILVER,
    gems: 60,
    progress: (s) => ({ current: s.stats.totalTeamMissionsCompleted, target: 1 }),
  },
]

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
