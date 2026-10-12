/* ═══════════════════════════════════════════════════════════════════════════
   practiceXp.js — WHAT A PRACTICE SESSION PAYS
   ---------------------------------------------------------------------------
   One rule, run in two places: the browser's own economy (progressionService
   → completePractice) and the LunX server's league XP (server/activity.js),
   each against its own record of what was already paid. Same inputs, same
   number.

   Practice is the one thing in LunX that can be repeated without end, so it
   is the one thing that could be farmed. The rule pays for learning and stops
   paying for repetition:

     · a session of at least MIN_FOR_BONUS answers earns the session bonus;
       after FULL_SESSIONS sessions in a rolling day, a smaller one
     · each correct answer to a question that has not paid in the last
       FRESH_HOURS earns PER_FRESH_CORRECT — answering the same easy question
       again pays nothing until it is fresh again
     · everything practice pays in a rolling day stops at DAILY_CAP

   Review still counts for the streak, the quests and the learner's history
   whatever it pays — the rule caps XP, never practice.
   ═══════════════════════════════════════════════════════════════════════════ */

import { XP } from '../config/progressionConfig'

export const PRACTICE_XP = {
  BONUS: XP.PRACTICE,
  MIN_FOR_BONUS: 5,
  PER_FRESH_CORRECT: 1,
  FRESH_HOURS: 20,
  FULL_SESSIONS: 4,
  REDUCED_BONUS: 3,
  WINDOW_HOURS: 24,
  DAILY_CAP: 100,
}

/**
 * @param {{ answered: number, freshCorrect: number, sessionsInWindow: number, xpInWindow: number }} session
 *   answered          questions answered in this session
 *   freshCorrect      distinct questions answered correctly that had not paid within FRESH_HOURS
 *   sessionsInWindow  sessions already finished in the last WINDOW_HOURS
 *   xpInWindow        practice XP already paid in the last WINDOW_HOURS
 * @param {typeof PRACTICE_XP} [rules]
 * @returns {{ xp: number, bonus: number, perAnswer: number, reduced: boolean, capped: boolean }}
 */
export function practiceSessionXp(session, rules = PRACTICE_XP) {
  const answered = Math.max(0, Math.floor(session.answered || 0))
  const fresh = Math.max(0, Math.floor(session.freshCorrect || 0))
  const bonus = answered >= rules.MIN_FOR_BONUS
    ? (session.sessionsInWindow < rules.FULL_SESSIONS ? rules.BONUS : rules.REDUCED_BONUS)
    : 0
  const perAnswer = Math.min(fresh, answered) * rules.PER_FRESH_CORRECT
  const raw = bonus + perAnswer
  const room = Math.max(0, rules.DAILY_CAP - Math.max(0, session.xpInWindow || 0))
  const xp = Math.min(raw, room)
  return { xp, bonus, perAnswer, reduced: bonus > 0 && bonus < rules.BONUS, capped: xp < raw }
}

/** Has a question's last payment gone stale enough to pay again?
 *  @param {number | undefined} paidAt @param {number} now @param {typeof PRACTICE_XP} [rules] */
export function isFresh(paidAt, now, rules = PRACTICE_XP) {
  return !Number.isFinite(paidAt) || now - /** @type {number} */ (paidAt) >= rules.FRESH_HOURS * 3600000
}

export default { PRACTICE_XP, practiceSessionXp, isFresh }
