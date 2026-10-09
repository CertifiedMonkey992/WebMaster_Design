/* ═══════════════════════════════════════════════════════════════════════════
   wheelConfig.js — THE DAILY SPIN
   ---------------------------------------------------------------------------
   The reward wheel that replaced the seven-day daily bonus. Everything
   tunable is here: the allowance, when it resets, and the reward table with
   its odds. services/wheelService.js applies rewards by `type`, through the
   same central systems every other award uses, so nothing here invents a
   currency.

   THE ODDS ARE THE TABLE. Each slot has a `weight` in tenths of a percent and
   the weights sum to exactly 1000 (the self-check suite enforces it). A spin
   draws one integer from 0–999 with the browser's cryptographic random
   source, and the slot whose range contains it is the result — decided
   before the wheel moves, so the wheel can stop exactly on it. Nothing about
   the learner (their balance, their history, how long since a jackpot)
   enters the draw.

   Balance. The old daily bonus paid about 31 gems' worth and 15 XP a day.
   One spin a day is worth on average about 32 gems' worth and 11 XP:

       gems  .30×20 + .17×35 + .08×75 + .045×150 + .005×500   = 27.2
       XP    .25×25 + .10×50                                  = 11.25
       shield .05 × (a 100-gem item, or 75 gems when stock is full)

   The commonest result, 20 gems, buys a heart. The jackpot, 500 gems, is
   ten heart refills — and comes up once in two hundred spins.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reward kinds the service knows how to apply ──────────────────────────── */
export const REWARD_TYPES = {
  GEMS:          'GEMS',
  XP:            'XP',
  STREAK_SHIELD: 'STREAK_SHIELD',
}

export const WHEEL = {
  /** Free spins each day. */
  SPINS_PER_DAY: 1,
  /** The allowance resets at 00:00 UTC — the same moment on every device,
   *  whatever its time zone is set to, so changing the zone cannot buy a
   *  second spin. The panel shows the reset in the learner's own time. */
  RESET_ZONE: 'UTC',
  /** How far the clock may appear to run backwards before spins pause
   *  (the guard against setting the device clock forward, spinning, and
   *  setting it back). Small drift and a clock sync are tolerated. */
  CLOCK_TOLERANCE_MS: 10 * 60 * 1000,
  /** Spins kept in the history list. */
  HISTORY: 12,
  /** Spin ids remembered for the duplicate guard. */
  SEEN_IDS: 24,
  /** Most extra spins the reviewer's controls can bank at once. */
  EXTRA_SPINS_MAX: 10,
  /** The weights' total: weights are in tenths of a percent. */
  WEIGHT_TOTAL: 1000,
}

/** The five tiers, in order of rarity. `percent` is derived from SLOTS. */
export const TIERS = [
  { id: 'common',   label: 'Common' },
  { id: 'uncommon', label: 'Uncommon' },
  { id: 'rare',     label: 'Rare' },
  { id: 'epic',     label: 'Epic' },
  { id: 'jackpot',  label: 'Jackpot' },
]

/**
 * The wheel, clockwise from the top. Common and rare slots alternate so no
 * two neighbours read alike.
 *
 *   weight     tenths of a percent (all weights sum to 1000)
 *   fallback   paid instead when the primary would land on a full resource
 *              (a fourth shield is not allowed, so it pays gems)
 */
export const SLOTS = [
  { id: 'gems-20',  tier: 'common',   type: REWARD_TYPES.GEMS,          amount: 20,  weight: 300, label: '20 gems' },
  { id: 'xp-50',    tier: 'uncommon', type: REWARD_TYPES.XP,            amount: 50,  weight: 100, label: '50 XP' },
  { id: 'gems-75',  tier: 'rare',     type: REWARD_TYPES.GEMS,          amount: 75,  weight: 80,  label: '75 gems' },
  { id: 'xp-25',    tier: 'common',   type: REWARD_TYPES.XP,            amount: 25,  weight: 250, label: '25 XP' },
  { id: 'gems-150', tier: 'epic',     type: REWARD_TYPES.GEMS,          amount: 150, weight: 45,  label: '150 gems' },
  { id: 'gems-35',  tier: 'uncommon', type: REWARD_TYPES.GEMS,          amount: 35,  weight: 170, label: '35 gems' },
  {
    id: 'shield', tier: 'rare', type: REWARD_TYPES.STREAK_SHIELD, amount: 1, weight: 50, label: 'Streak Shield',
    fallback: { type: REWARD_TYPES.GEMS, amount: 75, label: '75 gems' },
  },
  { id: 'gems-500', tier: 'jackpot',  type: REWARD_TYPES.GEMS,          amount: 500, weight: 5,   label: '500 gems' },
]

/** A slot by id, or null. @param {string} id */
export function getSlot(id) {
  return SLOTS.find((s) => s.id === id) ?? null
}

/** The slot a draw of 0–999 lands in, walking the cumulative weights.
 *  @param {number} roll */
export function slotForRoll(roll) {
  let edge = 0
  for (const slot of SLOTS) {
    edge += slot.weight
    if (roll < edge) return slot
  }
  return null
}

/** A weight as a percentage string: 300 → "30%", 45 → "4.5%".
 *  @param {number} weight */
export const percentOf = (weight) => `${Number((weight / (WHEEL.WEIGHT_TOTAL / 100)).toFixed(1))}%`

export default { WHEEL, TIERS, SLOTS, REWARD_TYPES, getSlot, slotForRoll, percentOf }
