/* ═══════════════════════════════════════════════════════════════════════════
   wheelService.js — THE DAILY SPIN
   ---------------------------------------------------------------------------
   One spin, decided and paid in one reducer step:

     1. refuse if this spin id was already used (a double click, a retried
        dispatch, a restored tab), if the device clock has gone backwards
        past the last spin, or if no spin is left today
     2. take the spin out of the allowance and RECORD it — before any reward
        is applied, so every later attempt today reduces to step 1
     3. find the slot the draw (an integer 0–999, drawn by the caller from
        crypto.getRandomValues) falls in — config/wheelConfig.js → SLOTS
     4. pay that slot through the central systems (currencyService,
        streakService, the injected awardXP), falling back to its
        `fallback` when the primary would land on a full resource
     5. report WHEEL_SPUN with the slot, so the wheel animates to exactly
        the result that was paid

   The allowance is keyed by the UTC calendar day (WHEEL.RESET_ZONE), not by
   "24 hours since the last spin": the reset is one moment for everyone.

   The result persists with the rest of the learner's state the moment the
   reducer returns, so closing the panel mid-spin or refreshing the page can
   neither lose the reward nor earn a second one.
   ═══════════════════════════════════════════════════════════════════════════ */

import { WHEEL, SLOTS, TIERS, REWARD_TYPES, getSlot, slotForRoll, percentOf } from '../config/wheelConfig'
import currency from './currencyService'
import streakService from './streakService'

/* ── The calendar ────────────────────────────────────────────────────────── */

/** "YYYY-MM-DD" of the UTC day containing `now`. */
export function dayKeyOf(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10)
}

/** The next 00:00 UTC after `now`, in ms. */
export function nextResetAt(now = Date.now()) {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
}

/* ── Allowance ───────────────────────────────────────────────────────────── */

/** Free spins still available today. */
export function freeSpinsLeft(wheel, now = Date.now()) {
  const used = wheel.dayKey === dayKeyOf(now) ? wheel.spinsUsed : 0
  return Math.max(0, WHEEL.SPINS_PER_DAY - used)
}

/** Has the clock moved back past the last spin (beyond the tolerance)? */
export function clockWentBack(wheel, now = Date.now()) {
  return wheel.highWater > 0 && now + WHEEL.CLOCK_TOLERANCE_MS < wheel.highWater
}

/** Every spin available now: today's free ones plus any banked extras. */
export function spinsLeft(wheel, now = Date.now()) {
  if (clockWentBack(wheel, now)) return 0
  return freeSpinsLeft(wheel, now) + wheel.extraSpins
}

/* ── Paying a slot ───────────────────────────────────────────────────────────
   One handler per reward type. Each reports whether the reward actually
   LANDED, which is what lets a shield with a full stock pay gems instead of
   silently paying nothing. */

const EFFECTS = {
  [REWARD_TYPES.GEMS]: (state, reward, ctx) => ({
    ...currency.awardGems(state, reward.amount, ctx.reason, ctx.meta),
    delivered: true,
  }),

  [REWARD_TYPES.XP]: (state, reward, ctx) => ({
    ...ctx.awardXP(state, reward.amount, ctx.reason, ctx.meta),
    delivered: true,
  }),

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
 * Pay one reward, switching to its fallback when the primary would land on
 * a full resource. Returns what was ACTUALLY granted, so the panel can say
 * "your shields were full — 75 gems instead" rather than claiming something
 * that did not happen.
 */
export function applyReward(state, reward, ctx) {
  const effect = EFFECTS[reward.type]
  if (!effect) return { state, events: [], granted: null, substituted: false }

  const primary = effect(state, reward, ctx)
  if (primary.delivered || !reward.fallback) {
    return { state: primary.state, events: primary.events, granted: reward, substituted: false }
  }

  const fallbackEffect = EFFECTS[reward.fallback.type]
  if (!fallbackEffect) return { state: primary.state, events: primary.events, granted: reward, substituted: false }
  const fallback = fallbackEffect(primary.state, reward.fallback, ctx)
  return {
    state: fallback.state,
    events: [...primary.events, ...fallback.events],
    granted: reward.fallback,
    substituted: true,
  }
}

/* ── The spin ────────────────────────────────────────────────────────────── */

const refuse = (state, reason) => ({ state, events: [{ type: 'WHEEL_REFUSED', reason }], ok: false })

/**
 * Spin once.
 *
 * @param {object} state
 * @param {{ roll: number, spinId?: string }} payload  roll: an integer 0–999
 * @param {{ awardXP?: Function }} deps  injected from progressionService
 */
export function spin(state, { roll, spinId = null } = {}, deps = {}, now = Date.now()) {
  const wheel = state.wheel
  if (!Number.isInteger(roll) || roll < 0 || roll >= WHEEL.WEIGHT_TOTAL) return refuse(state, 'bad-roll')
  if (spinId && wheel.seenIds.includes(spinId)) return refuse(state, 'duplicate')
  if (clockWentBack(wheel, now)) return refuse(state, 'clock')

  const today = dayKeyOf(now)
  const free = freeSpinsLeft(wheel, now)
  if (free + wheel.extraSpins <= 0) return refuse(state, 'none-left')

  const slot = slotForRoll(roll)
  if (!slot) return refuse(state, 'bad-roll')
  const id = spinId ?? `spin-${now.toString(36)}-${roll}`

  /* Anchor the spin BEFORE paying it: from here on, every other attempt
     with no spin left reduces to the refusal above. */
  const usedToday = wheel.dayKey === today ? wheel.spinsUsed : 0
  const anchored = {
    ...state,
    wheel: {
      ...wheel,
      dayKey: today,
      spinsUsed: free > 0 ? usedToday + 1 : usedToday,
      extraSpins: free > 0 ? wheel.extraSpins : wheel.extraSpins - 1,
      seenIds: [id, ...wheel.seenIds].slice(0, WHEEL.SEEN_IDS),
      highWater: Math.max(wheel.highWater, now),
      totalSpins: wheel.totalSpins + 1,
      jackpots: wheel.jackpots + (slot.tier === 'jackpot' ? 1 : 0),
    },
  }

  const payout = applyReward(anchored, slot, {
    reason: `wheel:${slot.id}`,
    meta: { wheelSlot: slot.id },
    now,
    awardXP: deps.awardXP ?? ((s) => ({ state: s, events: [] })),
  })

  const granted = payout.granted ? { type: payout.granted.type, amount: payout.granted.amount, label: payout.granted.label } : null
  const record = { id, at: now, slotId: slot.id, granted, substituted: payout.substituted }
  const next = {
    ...payout.state,
    wheel: {
      ...payout.state.wheel,
      lastSpin: record,
      history: [{ at: now, slotId: slot.id }, ...payout.state.wheel.history].slice(0, WHEEL.HISTORY),
    },
  }

  const events = [
    ...payout.events,
    {
      type: 'WHEEL_SPUN',
      spinId: id,
      slotId: slot.id,
      slotIndex: SLOTS.indexOf(slot),
      tier: slot.tier,
      reward: slot,
      granted,
      substituted: payout.substituted,
    },
  ]
  return { state: next, events, ok: true }
}

/** Bank extra spins (the reviewer's control only — judgeService gates it). */
export function grantSpins(state, count = 1) {
  const n = Math.max(0, Math.floor(count))
  const extraSpins = Math.min(WHEEL.EXTRA_SPINS_MAX, state.wheel.extraSpins + n)
  return { ...state, wheel: { ...state.wheel, extraSpins } }
}

/* ── View ────────────────────────────────────────────────────────────────── */

/** The odds, by slot and by tier, straight from the weights. */
export const ODDS = {
  slots: SLOTS.map((s) => ({ ...s, percent: percentOf(s.weight) })),
  tiers: TIERS.map((t) => {
    const weight = SLOTS.filter((s) => s.tier === t.id).reduce((sum, s) => sum + s.weight, 0)
    return { ...t, weight, percent: percentOf(weight) }
  }),
}

export function getWheelView(state, now = Date.now()) {
  const wheel = state.wheel
  const left = spinsLeft(wheel, now)
  const last = wheel.lastSpin
  return {
    slots: ODDS.slots,
    tiers: ODDS.tiers,
    spinsLeft: left,
    freeLeft: clockWentBack(wheel, now) ? 0 : freeSpinsLeft(wheel, now),
    extraSpins: wheel.extraSpins,
    spinsPerDay: WHEEL.SPINS_PER_DAY,
    available: left > 0,
    clockBlocked: clockWentBack(wheel, now),
    resetAt: nextResetAt(now),
    msUntilReset: Math.max(0, nextResetAt(now) - now),
    lastSpin: last ? { ...last, slot: getSlot(last.slotId) } : null,
    spunToday: wheel.dayKey === dayKeyOf(now) && wheel.spinsUsed > 0,
    totalSpins: wheel.totalSpins,
    jackpots: wheel.jackpots,
  }
}

export default {
  spin, grantSpins, getWheelView, applyReward, spinsLeft, freeSpinsLeft, clockWentBack,
  dayKeyOf, nextResetAt, ODDS,
}
