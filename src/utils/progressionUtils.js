/* ═══════════════════════════════════════════════════════════════════════════
   progressionUtils.js — PURE MATH FOR THE PROGRESSION SYSTEM
   ---------------------------------------------------------------------------
   No React, no storage, no side effects. Everything here is a pure function
   so the level curve and quest generation are deterministic and testable.
   ═══════════════════════════════════════════════════════════════════════════ */

import { LEVELS } from '../config/progressionConfig'

/* ── Small helpers ───────────────────────────────────────────────────────── */

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

export const safeInt = (n, fallback = 0) =>
  Number.isFinite(n) ? Math.trunc(n) : fallback

/** 1240 → "1,240" */
export const formatNumber = (n) =>
  Number.isFinite(n) ? n.toLocaleString() : '0'

/* ── Level curve ─────────────────────────────────────────────────────────────
   Cumulative XP required to REACH level L:

       total(L) = BASE·(L−1) + STEP·(L−1)(L−2)/2

   With the defaults (BASE 100, STEP 50) that produces exactly:
       L1 0 · L2 100 · L3 250 · L4 450 · L5 700 · L6 1000 · L7 1350 …
   Each level costs STEP more XP than the one before it.
   ─────────────────────────────────────────────────────────────────────────── */

/** Total cumulative XP needed to reach `level`. Level 1 costs 0. */
export function getXPForLevel(level) {
  const L = clamp(Math.floor(level), 1, LEVELS.MAX_LEVEL + 1)
  if (L <= 1) return 0
  return LEVELS.BASE * (L - 1) + (LEVELS.STEP * (L - 1) * (L - 2)) / 2
}

/** The level a given lifetime XP total corresponds to.
 *  Closed-form inverse of the quadratic above, then verified/corrected by a
 *  bounded walk so floating point can never put us on the wrong side. */
export function getLevelFromXP(xp) {
  const total = Math.max(0, safeInt(xp))
  if (total < LEVELS.BASE) return 1

  // Solve STEP/2·L² + (BASE − 3·STEP/2)·L + (STEP − BASE) − total = 0 for L.
  const a = LEVELS.STEP / 2
  const b = LEVELS.BASE - (3 * LEVELS.STEP) / 2
  const c = LEVELS.STEP - LEVELS.BASE - total
  let level = a === 0
    ? Math.floor(total / LEVELS.BASE) + 1
    : Math.floor((-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a))

  level = clamp(level, 1, LEVELS.MAX_LEVEL)
  // Correct any off-by-one from floating point.
  while (level < LEVELS.MAX_LEVEL && getXPForLevel(level + 1) <= total) level++
  while (level > 1 && getXPForLevel(level) > total) level--
  return level
}

/** XP earned inside the current level, and how much that level costs. */
export function getXPProgress(xp) {
  const total = Math.max(0, safeInt(xp))
  const level = getLevelFromXP(total)
  const floorXP = getXPForLevel(level)
  const ceilXP = getXPForLevel(level + 1)
  const span = Math.max(1, ceilXP - floorXP)
  const into = total - floorXP
  const isMax = level >= LEVELS.MAX_LEVEL
  return {
    level,
    totalXP: total,
    levelFloorXP: floorXP,
    levelCeilXP: ceilXP,
    xpIntoLevel: into,
    xpForThisLevel: span,
    xpUntilNextLevel: isMax ? 0 : Math.max(0, ceilXP - total),
    percent: isMax ? 100 : clamp(Math.round((into / span) * 100), 0, 100),
    isMaxLevel: isMax,
  }
}

/** XP still required before the next level-up. */
export function getXPUntilNextLevel(xp) {
  return getXPProgress(xp).xpUntilNextLevel
}

/** Flavour title for a level ("Explorer", "Architect"…). */
export function getLevelTitle(level) {
  let title = LEVELS.TITLES[0]?.title ?? 'Learner'
  for (const t of LEVELS.TITLES) if (level >= t.level) title = t.title
  return title
}

/* ── Deterministic randomness ────────────────────────────────────────────────
   Quest generation must be stable: opening the site five times on the same
   day must produce the SAME three quests. We seed a tiny PRNG from the date
   key rather than using Math.random().
   ─────────────────────────────────────────────────────────────────────────── */

/** 32-bit string hash (FNV-1a style) used to seed the PRNG. */
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small, fast, well-distributed seeded PRNG. */
export function createRandom(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates using a seeded random source. Does not mutate the input. */
export function shuffleWith(random, arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Pick one item using a seeded random source. */
export function pickWith(random, arr) {
  if (!arr.length) return undefined
  return arr[Math.floor(random() * arr.length)]
}

/** Round a target to a friendly number (5s below 50, 10s below 200, 25s above). */
export function roundTarget(n) {
  const v = Math.max(1, Math.round(n))
  if (v <= 10) return v
  if (v < 50) return Math.round(v / 5) * 5
  if (v < 200) return Math.round(v / 10) * 10
  return Math.round(v / 25) * 25
}

/** Progress ratio 0..1, guarding divide-by-zero. */
export const ratio = (current, target) =>
  target > 0 ? clamp(current / target, 0, 1) : 0

/** Percent 0..100 for progress bars. */
export const percent = (current, target) => Math.round(ratio(current, target) * 100)
