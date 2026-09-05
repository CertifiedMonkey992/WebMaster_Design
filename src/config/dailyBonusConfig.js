/* ═══════════════════════════════════════════════════════════════════════════
   dailyBonusConfig.js — THE DAILY BONUS CYCLE
   ---------------------------------------------------------------------------
   The reward track is DATA. Adding a day, rebalancing a payout or changing the
   cycle length means editing the list below — no component and no service
   changes, because dailyBonusService applies rewards by `type`.

   Every reward here must be something the app can genuinely deliver: gems, XP,
   hearts and streak shields all already exist as central systems. Nothing in
   this file invents a new currency.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reward kinds the service knows how to apply ──────────────────────────── */
export const REWARD_TYPES = {
  GEMS:          'GEMS',
  XP:            'XP',
  HEARTS:        'HEARTS',
  STREAK_SHIELD: 'STREAK_SHIELD',
}

/**
 * What happens when a day is missed.
 *
 *   CONTINUE     the track picks up where it left off — missing Tuesday just
 *                means Day 2 is waiting on Wednesday. This is the shipped rule:
 *                the daily bonus rewards returning, and the STREAK is already
 *                the mechanic that punishes absence.
 *   RESET_CYCLE  a missed day sends the learner back to Day 1.
 *
 * Both are implemented in dailyBonusService.resolveCycleDay, so switching this
 * value is the only change needed to swap the rule.
 */
export const MISSED_DAY_POLICY = {
  CONTINUE:    'CONTINUE',
  RESET_CYCLE: 'RESET_CYCLE',
}

export const DAILY_BONUS = {
  /** Days in one full track. Must match CYCLE.length. */
  CYCLE_LENGTH: 7,
  /** Which missed-day rule is active. */
  ON_MISSED_DAY: MISSED_DAY_POLICY.CONTINUE,
}

/**
 * The seven-day track. Value climbs toward Day 7, which is the only day that
 * pays a shield — the single most valuable thing gems can buy.
 *
 *   day         position in the cycle, 1-based
 *   type        tells the service which central system to award through
 *   amount      how much
 *   fallback    what to pay instead when the primary reward would land on a
 *               full resource. Hearts refill on their own overnight, so a
 *               returning learner is usually already at maximum — without a
 *               fallback, Day 4 would silently pay nothing.
 */
export const CYCLE = [
  {
    day: 1,
    type: REWARD_TYPES.GEMS,
    amount: 20,
    label: '20 Gems',
    short: '+20',
    art: 'gems',
    accent: 'gem',
  },
  {
    day: 2,
    type: REWARD_TYPES.XP,
    amount: 30,
    label: '30 XP',
    short: '+30',
    art: 'xp',
    accent: 'xp',
  },
  {
    day: 3,
    type: REWARD_TYPES.GEMS,
    amount: 30,
    label: '30 Gems',
    short: '+30',
    art: 'gems',
    accent: 'gem',
  },
  {
    day: 4,
    type: REWARD_TYPES.HEARTS,
    amount: 2,
    label: '2 Hearts',
    short: '+2',
    art: 'hearts',
    accent: 'heart',
    fallback: { type: REWARD_TYPES.GEMS, amount: 15, label: '15 Gems', short: '+15' },
  },
  {
    day: 5,
    type: REWARD_TYPES.GEMS,
    amount: 50,
    label: '50 Gems',
    short: '+50',
    art: 'gems',
    accent: 'gem',
  },
  {
    day: 6,
    type: REWARD_TYPES.XP,
    amount: 75,
    label: '75 XP',
    short: '+75',
    art: 'xp',
    accent: 'xp',
  },
  {
    day: 7,
    type: REWARD_TYPES.STREAK_SHIELD,
    amount: 1,
    label: 'Streak Shield',
    short: '×1',
    art: 'shield',
    accent: 'shield',
    featured: true,
    fallback: { type: REWARD_TYPES.GEMS, amount: 60, label: '60 Gems', short: '+60' },
  },
]

/** The reward for a given cycle day, or null when the day is out of range. */
export function getReward(day) {
  return CYCLE.find((r) => r.day === day) ?? null
}

/** Wrap any integer into a valid 1..CYCLE_LENGTH position. */
export function normalizeDay(day) {
  const n = Math.floor(Number(day))
  if (!Number.isFinite(n) || n < 1) return 1
  return ((n - 1) % DAILY_BONUS.CYCLE_LENGTH) + 1
}

export default { DAILY_BONUS, CYCLE, REWARD_TYPES, MISSED_DAY_POLICY, getReward, normalizeDay }
