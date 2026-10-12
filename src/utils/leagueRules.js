/* ═══════════════════════════════════════════════════════════════════════════
   leagueRules.js — RANKS, ZONES AND OUTCOMES
   ---------------------------------------------------------------------------
   Pure functions over a leaderboard. The server runs them to finalize a week;
   the app runs the same ones to draw the zones and say "2 places to go". One
   implementation, so a divider on screen can never sit one row away from the
   line the server actually promotes at.
   ═══════════════════════════════════════════════════════════════════════════ */

import { LEAGUES, LEAGUE, LEAGUE_REWARDS, TOURNAMENT } from '../config/leagueConfig'

/**
 * @typedef {{ userId: string, xp: number, xpAt?: number, joinedAt?: number }} Standing
 * @typedef {Standing & { rank: number }} RankedStanding
 */

/**
 * Order a leaderboard: more XP first; on equal XP whoever reached it first;
 * then whoever joined first; then by id, so the order is total and stable.
 * Ranks are positions (1, 2, 3 …) — a tie is broken, never shared, because a
 * zone line has to fall between two people.
 * @template {Standing} T
 * @param {T[]} members
 * @returns {(T & { rank: number })[]}
 */
export function rankStandings(members) {
  return [...members]
    .sort((a, b) =>
      (b.xp - a.xp)
      || ((a.xpAt ?? 0) - (b.xpAt ?? 0))
      || ((a.joinedAt ?? 0) - (b.joinedAt ?? 0))
      || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0))
    .map((m, i) => ({ ...m, rank: i + 1 }))
}

/** A full-leaderboard count scaled to a smaller one.
 *  @param {number} count @param {number} size @param {number} full */
const scaled = (count, size, full) => Math.round((count * size) / full)

/**
 * How many places move up and down in a leaderboard of `size` in a tier.
 * Counts are set for a full leaderboard (LEAGUE.COHORT_SIZE) and scaled down
 * for a smaller one; a tier that promotes always promotes at least one, and
 * the two zones never overlap.
 * @param {number} tier
 * @param {number} size
 * @returns {{ promote: number, demote: number }}
 */
export function zonesFor(tier, size) {
  const league = LEAGUES[tier]
  if (!league || size <= 0) return { promote: 0, demote: 0 }
  let promote = league.promote > 0 ? Math.max(1, scaled(league.promote, size, LEAGUE.COHORT_SIZE)) : 0
  let demote = league.demote > 0 && tier > 0 ? scaled(league.demote, size, LEAGUE.COHORT_SIZE) : 0
  promote = Math.min(promote, size)
  /* Nobody is in both zones; with three or more people, someone is safe. */
  const room = size >= 3 ? size - 1 : size
  demote = Math.max(0, Math.min(demote, room - promote))
  return { promote, demote }
}

/**
 * The outcome of a finished week for one place on the board.
 * @param {number} tier
 * @param {number} rank
 * @param {number} size
 * @param {number} xp
 * @returns {'promoted' | 'stayed' | 'demoted'}
 */
export function outcomeFor(tier, rank, size, xp) {
  const { promote, demote } = zonesFor(tier, size)
  if (rank <= promote && xp >= LEAGUE.MIN_XP_TO_PROMOTE && tier < LEAGUES.length - 1) return 'promoted'
  if (demote > 0 && rank > size - demote) return 'demoted'
  return 'stayed'
}

/**
 * Where one learner stands, in words the leaderboard can print.
 * @param {number} tier
 * @param {RankedStanding[]} ranked   the whole board, ranked
 * @param {string} userId
 */
export function standingOf(tier, ranked, userId) {
  const size = ranked.length
  const me = ranked.find((m) => m.userId === userId) ?? null
  const { promote, demote } = zonesFor(tier, size)
  if (!me) return { rank: null, size, promote, demote, zone: null, placesToPromote: null, xpToPromote: null, placesToSafety: null }
  const zone = me.rank <= promote ? 'promotion' : demote > 0 && me.rank > size - demote ? 'demotion' : 'safe'
  const lastPromoting = promote > 0 ? ranked[promote - 1] : null
  return {
    rank: me.rank,
    size,
    promote,
    demote,
    zone,
    /** Places to climb into the promotion zone (0 when already in it). */
    placesToPromote: promote > 0 ? Math.max(0, me.rank - promote) : null,
    /** XP that would pass the last promoting place (null when in the zone). */
    xpToPromote: lastPromoting && me.rank > promote ? Math.max(1, lastPromoting.xp - me.xp + 1) : null,
    /** Places to climb out of the demotion zone (0 when safe). */
    placesToSafety: demote > 0 ? Math.max(0, me.rank - (size - demote)) : 0,
    /** Short of the XP that promotion needs, even in the zone. */
    belowPromotionMinimum: me.xp < LEAGUE.MIN_XP_TO_PROMOTE,
  }
}

/** Gems for being promoted into `tier`. @param {number} tier */
export const promotionGems = (tier) => LEAGUE_REWARDS.PROMOTION_GEMS[tier] ?? 0

/** Gems for a podium place (1–3) in a tier, else 0. @param {number} tier @param {number} rank */
export function podiumGems(tier, rank) {
  const base = LEAGUE_REWARDS.PODIUM_GEMS[rank - 1]
  return base == null ? 0 : base + tier * LEAGUE_REWARDS.PODIUM_TIER_STEP
}

/**
 * How many advance from a tournament bracket of `size` in round `round`
 * (0 = quarterfinals). Scales like a league zone; the final advances nobody.
 * @param {number} round @param {number} size
 */
export function tournamentAdvance(round, size) {
  const spec = TOURNAMENT.ROUNDS[round]
  if (!spec || spec.advanceTop <= 0 || size <= 0) return 0
  return Math.min(size, Math.max(1, scaled(spec.advanceTop, size, TOURNAMENT.BRACKET_SIZE)))
}

/**
 * The study-habit band for an amount of weekly XP (LEAGUE.ACTIVITY_BANDS).
 * @param {number} weeklyXp
 */
export function activityBand(weeklyXp) {
  let band = 0
  LEAGUE.ACTIVITY_BANDS.forEach((floor, i) => { if (weeklyXp >= floor) band = i })
  return band
}

export default { rankStandings, zonesFor, outcomeFor, standingOf, promotionGems, podiumGems, tournamentAdvance, activityBand }
