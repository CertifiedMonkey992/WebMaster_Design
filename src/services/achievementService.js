/* ═══════════════════════════════════════════════════════════════════════════
   achievementService.js — PERMANENT MILESTONE ENGINE
   ---------------------------------------------------------------------------
   Quests expire. Achievements do not. Each achievement is a pure predicate
   over lifetime statistics, evaluated after every action and unlocked exactly
   once — the `achievements` map in state doubles as the idempotency guard.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ACHIEVEMENTS, getAchievement } from '../data/achievements'
import { awardGems } from './currencyService'
import { clamp } from '../utils/progressionUtils'

/** Current progress toward one achievement, safe against missing stats. */
export function getProgress(achievement, state) {
  let current = 0
  let target = 1
  try {
    const p = achievement.progress(state)
    current = Number.isFinite(p.current) ? p.current : 0
    target = Number.isFinite(p.target) && p.target > 0 ? p.target : 1
  } catch {
    /* A broken predicate must never break the dashboard. */
  }
  return {
    current: clamp(current, 0, target),
    target,
    percent: clamp(Math.round((current / target) * 100), 0, 100),
    met: current >= target,
  }
}

export function isUnlocked(state, id) {
  return Boolean(state.achievements?.[id])
}

/**
 * Unlock every achievement whose condition is now met.
 * Runs a few settling passes because unlocking pays gems, which can itself
 * satisfy a gem-based achievement. The pass count is bounded, so this can
 * never spin.
 */
export function evaluateAchievements(state, now = Date.now()) {
  let next = state
  const events = []

  for (let pass = 0; pass < 3; pass++) {
    let unlockedThisPass = 0

    for (const achievement of ACHIEVEMENTS) {
      if (isUnlocked(next, achievement.id)) continue
      const { met } = getProgress(achievement, next)
      if (!met) continue

      next = {
        ...next,
        achievements: { ...next.achievements, [achievement.id]: now },
      }
      events.push({ type: 'ACHIEVEMENT_UNLOCKED', achievement })
      unlockedThisPass++

      if (achievement.gems) {
        const result = awardGems(next, achievement.gems, 'achievement', {
          achievementId: achievement.id,
        })
        next = result.state
        events.push(...result.events)
      }
    }

    if (unlockedThisPass === 0) break
  }

  return { state: next, events }
}

/** Every achievement with its unlock state — powers the profile grid. */
export function listAchievements(state) {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: isUnlocked(state, achievement.id),
    unlockedAt: state.achievements?.[achievement.id] ?? null,
    ...getProgress(achievement, state),
  }))
}

export function getUnlockedCount(state) {
  return ACHIEVEMENTS.filter((a) => isUnlocked(state, a.id)).length
}

export { getAchievement }

export default { evaluateAchievements, listAchievements, getUnlockedCount, getProgress, isUnlocked }
