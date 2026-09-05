/* ═══════════════════════════════════════════════════════════════════════════
   dailyBonusService.js — DAILY LOGIN BONUS
   ---------------------------------------------------------------------------
   Calendar-day based, exactly like the streak engine: availability is decided
   by comparing LOCAL DATE KEYS ("YYYY-MM-DD"), never by "24 hours since the
   last claim". A claim at 11:50 PM and the next at 12:05 AM are two days, and
   a countdown shown in the UI is decoration — this file is the source of truth.

   Opening LunX never claims anything. The learner has to press the button, and
   pressing it twice cannot pay twice: `lastClaimDate` IS the idempotency
   anchor. Once it reads today, every further claim today is refused — by the
   second click, by a rerender, and by a refresh, because the anchor is part of
   the persisted state rather than a flag in a component.

   Rewards are awarded through the EXISTING central systems (currencyService
   for gems and hearts, streakService for shields, and the injected `awardXP`
   from progressionService). Nothing here touches a resource directly, so a
   daily bonus lands in the ledger and counts toward quests like any other
   award.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  CYCLE, DAILY_BONUS, MISSED_DAY_POLICY, REWARD_TYPES, getReward, normalizeDay,
} from '../config/dailyBonusConfig'
import { getLocalDateKey, getDaysBetween, msUntilEndOfDay } from '../utils/dateUtils'
import currency from './currencyService'
import streakService from './streakService'

/* ── Cycle position ──────────────────────────────────────────────────────────
   ONE function decides which day is on offer, and both the view and the claim
   read it — so the card the learner sees can never disagree with the reward
   the reducer hands out. */

/** How many whole calendar days were skipped between the last claim and today. */
export function getMissedDays(bonus, today) {
  if (!bonus.lastClaimDate) return 0
  const gap = getDaysBetween(bonus.lastClaimDate, today)
  if (gap === null || gap <= 1) return 0
  return gap - 1
}

/**
 * The cycle day currently on offer, after applying the missed-day policy.
 * Under CONTINUE (the shipped rule) an absence changes nothing: the track
 * resumes where it stopped.
 */
export function resolveCycleDay(bonus, today) {
  const stored = normalizeDay(bonus.cycleDay)
  if (DAILY_BONUS.ON_MISSED_DAY !== MISSED_DAY_POLICY.RESET_CYCLE) return stored
  return getMissedDays(bonus, today) > 0 ? 1 : stored
}

/** Has today's reward already been taken? The whole double-claim guard. */
export function hasClaimedToday(state, now = Date.now()) {
  return state.dailyBonus.lastClaimDate === getLocalDateKey(new Date(now))
}

/** Is there a reward waiting right now? */
export function isAvailable(state, now = Date.now()) {
  return !hasClaimedToday(state, now)
}

/* ── Reward effects ──────────────────────────────────────────────────────────
   One handler per reward type. Each reports whether the reward actually
   LANDED, which is what lets a full-hearts or full-shields day fall back to
   gems instead of silently paying nothing. */

const EFFECTS = {
  [REWARD_TYPES.GEMS]: (state, reward, ctx) => ({
    ...currency.awardGems(state, reward.amount, ctx.reason, ctx.meta),
    delivered: true,
  }),

  [REWARD_TYPES.XP]: (state, reward, ctx) => ({
    ...ctx.awardXP(state, reward.amount, ctx.reason, ctx.meta),
    delivered: true,
  }),

  [REWARD_TYPES.HEARTS]: (state, reward, ctx) => {
    const result = currency.restoreHeart(state, reward.amount, ctx.reason, ctx.now)
    return { ...result, delivered: result.state.hearts > state.hearts }
  },

  [REWARD_TYPES.STREAK_SHIELD]: (state, reward) => {
    const next = streakService.grantShield(state, reward.amount)
    const delivered = next.streak.shields > state.streak.shields
    return {
      state: next,
      events: delivered ? [{ type: 'SHIELD_ACQUIRED', total: next.streak.shields }] : [],
      delivered,
    }
  },
}

/**
 * Pay out one reward, switching to its fallback when the primary would land on
 * an already-full resource.
 *
 * Returns the reward that was ACTUALLY granted so the UI can say "hearts were
 * full — 15 gems instead" rather than claiming something that did not happen.
 */
export function applyReward(state, reward, ctx) {
  const effect = EFFECTS[reward.type]
  if (!effect) return { state, events: [], granted: null, substituted: false }

  const primary = effect(state, reward, ctx)
  if (primary.delivered || !reward.fallback) {
    return {
      state: primary.state,
      events: primary.events,
      granted: reward,
      substituted: false,
    }
  }

  /* The primary paid nothing. Keep whatever bookkeeping it did (heart regen is
     applied on the way through) and pay the fallback on top of it. */
  const fallbackEffect = EFFECTS[reward.fallback.type]
  if (!fallbackEffect) {
    return { state: primary.state, events: primary.events, granted: reward, substituted: false }
  }

  const fallback = fallbackEffect(primary.state, reward.fallback, ctx)
  return {
    state: fallback.state,
    events: [...primary.events, ...fallback.events],
    granted: reward.fallback,
    substituted: true,
  }
}

/* ── The claim ───────────────────────────────────────────────────────────── */

/**
 * Claim today's reward.
 *
 * @param deps  `{ awardXP }` — injected from progressionService so this file
 *              never has to import it back (which would be a cycle).
 *
 * Refused when today's reward is already taken. The refusal is not an error
 * the learner needs to see; the button is disabled long before it can happen.
 */
export function claimDailyBonus(state, deps = {}, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const bonus = state.dailyBonus

  if (bonus.lastClaimDate === today) {
    return {
      state,
      events: [{ type: 'DAILY_BONUS_ALREADY_CLAIMED', date: today }],
      ok: false,
    }
  }

  const day = resolveCycleDay(bonus, today)
  const reward = getReward(day)
  if (!reward) {
    return { state, events: [{ type: 'DAILY_BONUS_FAILED', reason: 'unknown-day', day }], ok: false }
  }

  const isFinalDay = day >= DAILY_BONUS.CYCLE_LENGTH
  const nextDay = isFinalDay ? 1 : day + 1

  /* Anchor the claim BEFORE the reward is applied: from here on, every other
     claim today reduces to the refusal above. */
  const claimed = {
    ...state,
    dailyBonus: {
      cycleDay: nextDay,
      lastClaimDate: today,
      cycleStartDate: isFinalDay ? null : (bonus.cycleStartDate ?? today),
      cyclesCompleted: bonus.cyclesCompleted + (isFinalDay ? 1 : 0),
      totalClaimed: bonus.totalClaimed + 1,
    },
  }

  const reason = `daily-bonus-day-${day}`
  const payout = applyReward(claimed, reward, {
    reason,
    meta: { dailyBonusDay: day },
    now,
    awardXP: deps.awardXP ?? ((s) => ({ state: s, events: [] })),
  })

  const events = [
    ...payout.events,
    {
      type: 'DAILY_BONUS_CLAIMED',
      day,
      reward,
      granted: payout.granted,
      substituted: payout.substituted,
      nextDay,
      cycleComplete: isFinalDay,
    },
  ]

  if (isFinalDay) {
    events.push({
      type: 'DAILY_CYCLE_COMPLETE',
      cyclesCompleted: payout.state.dailyBonus.cyclesCompleted,
    })
  }

  return { state: payout.state, events, ok: true }
}

/* ── View ────────────────────────────────────────────────────────────────────
   Everything the UI needs, derived here rather than in a component: which day
   each card is in, what is claimable, how the track should read. */

export function getBonusView(state, now = Date.now()) {
  const today = getLocalDateKey(new Date(now))
  const bonus = state.dailyBonus
  const claimedToday = bonus.lastClaimDate === today
  const nextDay = resolveCycleDay(bonus, today)

  /* How far through the track the learner has actually got. When today's
     reward is already taken, the day they took is the one BEFORE the stored
     pointer — and a pointer back at 1 means the whole cycle just finished. */
  const claimedThrough = claimedToday
    ? (nextDay === 1 ? DAILY_BONUS.CYCLE_LENGTH : nextDay - 1)
    : nextDay - 1

  const cycleJustCompleted = claimedToday && nextDay === 1 && bonus.totalClaimed > 0

  const days = CYCLE.map((reward) => {
    let status
    if (reward.day <= claimedThrough) status = 'claimed'
    else if (!claimedToday && reward.day === nextDay) status = 'today'
    else if (claimedToday && reward.day === nextDay && !cycleJustCompleted) status = 'next'
    else status = 'locked'
    return { ...reward, status, isFinal: reward.day === DAILY_BONUS.CYCLE_LENGTH }
  })

  return {
    available: !claimedToday,
    claimedToday,
    /** The day the learner is ON — the one to claim, or the one just taken. */
    currentDay: claimedToday ? Math.max(1, claimedThrough) : nextDay,
    nextDay,
    cycleLength: DAILY_BONUS.CYCLE_LENGTH,
    cycleJustCompleted,
    cyclesCompleted: bonus.cyclesCompleted,
    totalClaimed: bonus.totalClaimed,
    lastClaimDate: bonus.lastClaimDate,
    missedDays: getMissedDays(bonus, today),
    /** The reward on offer right now, or null once today is claimed. */
    todayReward: claimedToday ? null : getReward(nextDay),
    /** What tomorrow holds, for the "come back tomorrow" line. */
    upcomingReward: getReward(nextDay),
    days,
    /** Visual aid only — availability is decided by the date key above. */
    msUntilTomorrow: msUntilEndOfDay(new Date(now)),
  }
}

export default {
  claimDailyBonus, getBonusView, isAvailable, hasClaimedToday,
  resolveCycleDay, getMissedDays, applyReward,
}
