/* ═══════════════════════════════════════════════════════════════════════════
   leagues.js — THE WEEKLY LEAGUES AND THE DIAMOND TOURNAMENT
   ---------------------------------------------------------------------------
   Every rule is in src/config/leagueConfig.js and src/utils/leagueRules.js
   (shared with the app, which only displays them). This file applies them
   to the database, with the server's clock:

   JOINING   A learner joins a leaderboard the first time they earn league
             XP in a week (activity.js calls creditXp). Matchmaking looks for
             an open board of their league, in a time zone within
             TZ_BAND_HOURS of theirs (so the week ends at about the same
             local time), preferring learners with similar study habits —
             last week's XP band — and avoiding anyone they have blocked.
             None fits: a new board is opened on the learner's own week.
             Membership is fixed for the week (one board per learner per
             week — a UNIQUE index).

   THE WEEK  A board's week is Sunday to Sunday in ITS time zone (the
             reference: "Every Sunday (based on your timezone), a new weekly
             league begins"). The end is an instant decided here; no client
             clock can move it.

   THE END   A board whose end has passed is finalized in one transaction:
             final ranks, promotion and demotion (zones scale with the board's
             size), tiers updated for next week, and rewards — a promotion,
             a podium place, a first visit to a league, a tournament place —
             each recorded once (awards UNIQUE (user, kind, ref)).

   TOURNEY   The top QUALIFY_TOP of a Diamond board in a scheduled qualifying
             week enter that tournament; for its three weeks they compete in
             round brackets instead of Diamond (quarterfinals, semifinals,
             finals), each round eliminating, until a champion. It runs only
             in the scheduled weeks.

   SANDBOX   The reviewer's account never joins a real board. It gets a
             sandbox board of labelled test accounts that only it can see,
             run by the same code (review.js).
   ═══════════════════════════════════════════════════════════════════════════ */

import { LEAGUE, TOURNAMENT, DIAMOND, leagueOf } from '../src/config/leagueConfig.js'
import { weekWindow, offsetMinutes, shiftWeek, parseYmd } from '../src/utils/leagueTime.js'
import {
  rankStandings, zonesFor, outcomeFor, standingOf, promotionGems, podiumGems,
  tournamentAdvance, activityBand,
} from '../src/utils/leagueRules.js'
import { newId } from './accounts.js'
import { grantAward, notify } from './notify.js'

const HOUR = 3600000
const WEEK_OPTS = { startDay: LEAGUE.WEEK_START_DAY, startHour: LEAGUE.WEEK_START_HOUR }
const ORDINAL = ['1st', '2nd', '3rd']
const ordinal = (n) => ORDINAL[n - 1] ?? `${n}th`

/** "Oct 11" for a week id. */
export function weekLabel(weekId) {
  const d = parseYmd(weekId)
  if (!d) return weekId
  return new Date(Date.UTC(d.y, d.m - 1, d.d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * @param {{ db: any, schedule?: Array<{ id: string, name: string, qualifyWeek: string }>, mixing?: boolean }} ctx
 *   mixing: development only — let test accounts share boards with real ones
 */
export function createLeagues({ db, schedule = TOURNAMENT.SCHEDULE, mixing = false }) {
  /* ── The tournament calendar ── */

  function roundOfWeek(weekId) {
    for (const edition of schedule) {
      for (let r = 0; r < TOURNAMENT.ROUNDS.length; r++) {
        if (shiftWeek(edition.qualifyWeek, r + 1) === weekId) return { edition, round: r }
      }
    }
    return null
  }

  const editionSummary = (edition) => ({
    id: edition.id,
    name: edition.name,
    qualifyWeek: edition.qualifyWeek,
    rounds: TOURNAMENT.ROUNDS.map((r, i) => ({ id: r.id, name: r.name, weekId: shiftWeek(edition.qualifyWeek, i + 1) })),
  })

  /* ── Reading ── */

  function activeMembership(userId, now) {
    return db.get(
      `SELECT m.*, c.kind AS c_kind, c.tier AS c_tier, c.end_at, c.start_at, c.timezone AS c_timezone,
              c.tournament_id, c.round, c.sandbox_owner, c.is_test
         FROM cohort_members m JOIN cohorts c ON c.id = m.cohort_id
        WHERE m.user_id = ? AND c.finalized_at IS NULL AND c.end_at > ?
        ORDER BY c.end_at DESC LIMIT 1`,
      userId, now,
    ) ?? null
  }

  function boardOf(cohortId) {
    const rows = db.all(
      `SELECT m.user_id, m.xp, m.xp_at, m.joined_at, u.username, u.avatar, u.tier, u.is_seed
         FROM cohort_members m JOIN users u ON u.id = m.user_id
        WHERE m.cohort_id = ?`,
      cohortId,
    )
    return rankStandings(rows.map((r) => ({ userId: r.user_id, xp: r.xp, xpAt: r.xp_at, joinedAt: r.joined_at, row: r })))
  }

  /** A learner's study-habit band: the XP of their last finished league week. */
  function bandOf(userId) {
    const last = db.get(
      `SELECT m.xp FROM cohort_members m JOIN cohorts c ON c.id = m.cohort_id
        WHERE m.user_id = ? AND c.finalized_at IS NOT NULL AND c.kind = 'league'
        ORDER BY c.end_at DESC LIMIT 1`,
      userId,
    )
    return activityBand(last?.xp ?? 0)
  }

  /* ── Joining ── */

  function joinCohort(user, week, now, { kind, tournamentId = null, round = null }) {
    const offset = offsetMinutes(user.timezone, now)
    const band = bandOf(user.id)
    const tier = kind === 'league' ? user.tier : DIAMOND
    const size = kind === 'league' ? LEAGUE.COHORT_SIZE : TOURNAMENT.BRACKET_SIZE
    const test = user.is_seed ? 1 : 0

    const candidates = db.all(
      `SELECT c.*, (SELECT COUNT(*) FROM cohort_members m WHERE m.cohort_id = c.id) AS n
         FROM cohorts c
        WHERE c.kind = ? AND c.week_id = ? AND c.tier = ? AND c.finalized_at IS NULL
          AND c.sandbox_owner IS NULL AND c.end_at > ?
          AND (c.tournament_id IS ? OR c.tournament_id = ?) AND (c.round IS ? OR c.round = ?)
          AND NOT EXISTS (
            SELECT 1 FROM cohort_members m JOIN blocks b
              ON (b.blocker = ? AND b.blocked = m.user_id) OR (b.blocked = ? AND b.blocker = m.user_id)
             WHERE m.cohort_id = c.id)`,
      kind, week.weekId, tier, now + LEAGUE.JOIN_CUTOFF_HOURS * HOUR,
      tournamentId, tournamentId, round, round, user.id, user.id,
    )
      .filter((c) => Number(c.n) < size)
      .filter((c) => Math.abs(c.offset_min - offset) <= LEAGUE.TZ_BAND_HOURS * 60)
      .filter((c) => mixing || c.is_test === test)
      .sort((a, b) => Math.abs(a.band - band) - Math.abs(b.band - band) || Number(b.n) - Number(a.n) || a.created_at - b.created_at)

    let cohortId = candidates[0]?.id
    if (!cohortId) {
      cohortId = newId('c')
      db.run(
        `INSERT INTO cohorts (id, kind, is_test, week_id, tier, timezone, offset_min, band, tournament_id, round, start_at, end_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cohortId, kind, test, week.weekId, tier, user.timezone, offset, band, tournamentId, round, week.start, week.end, now,
      )
    }
    db.run(
      'INSERT INTO cohort_members (cohort_id, user_id, week_id, kind, xp, xp_at, joined_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
      cohortId, user.id, week.weekId, kind, now, now,
    )
    return activeMembership(user.id, now)
  }

  /**
   * The board a learner's league XP counts on right now — joining one if
   * this is their first league XP of the week. Null when they have left the
   * leagues, or (rarely) when their board ended a little before their own
   * week did, in a nearby time zone: the next week starts on their Sunday.
   */
  function ensureMembership(user, now) {
    if (!user.leagues_opt_in) return null
    if (user.role === 'judge' || user.sandbox_owner) return activeMembership(user.id, now)
    const active = activeMembership(user.id, now)
    if (active) return active
    const week = weekWindow(user.timezone, now, WEEK_OPTS)
    if (db.get('SELECT 1 FROM cohort_members WHERE user_id = ? AND week_id = ?', user.id, week.weekId)) return null

    const running = roundOfWeek(week.weekId)
    if (running) {
      const entry = db.get('SELECT * FROM tournament_entries WHERE tournament_id = ? AND user_id = ?', running.edition.id, user.id)
      if (entry?.status === 'qualified' && entry.round === running.round) {
        return joinCohort(user, week, now, { kind: 'tournament', tournamentId: running.edition.id, round: running.round })
      }
      /* Qualified for a round and never played it: out, and back to Diamond. */
      if (entry?.status === 'qualified' && entry.round < running.round) {
        db.run("UPDATE tournament_entries SET status = 'eliminated' WHERE tournament_id = ? AND user_id = ?", running.edition.id, user.id)
      }
    }
    return joinCohort(user, week, now, { kind: 'league' })
  }

  /**
   * Add league XP the server has just recorded (activity.js). Returns where
   * the learner now stands, or null when the XP counts on no board.
   */
  function creditXp(userId, amount, now) {
    finalizeDue(now)
    const user = db.get('SELECT * FROM users WHERE id = ?', userId)
    if (!user || amount <= 0) return null
    const m = ensureMembership(user, now)
    if (!m) return null
    const before = boardOf(m.cohort_id).find((x) => x.userId === userId)?.rank ?? null
    db.run('UPDATE cohort_members SET xp = xp + ?, xp_at = ? WHERE cohort_id = ? AND user_id = ?', amount, now, m.cohort_id, userId)
    const board = boardOf(m.cohort_id)
    const me = board.find((x) => x.userId === userId)
    return { cohortId: m.cohort_id, kind: m.c_kind, tier: m.c_tier, xp: me?.xp ?? 0, rank: me?.rank ?? null, previousRank: before, size: board.length }
  }

  /* ── The end of a week ── */

  function finalizeCohort(cohortId, now) {
    const c = db.get('SELECT * FROM cohorts WHERE id = ?', cohortId)
    if (!c || c.finalized_at != null) return
    const ranked = boardOf(c.id)
    const n = ranked.length
    const league = leagueOf(c.tier)
    const label = c.sandbox_owner ? 'this sandbox week' : `the week of ${weekLabel(c.week_id)}`

    if (c.kind === 'league') {
      const edition = c.tier === DIAMOND && !c.sandbox_owner ? schedule.find((e) => e.qualifyWeek === c.week_id) : null
      for (const r of ranked) {
        const user = db.get('SELECT tier, best_tier FROM users WHERE id = ?', r.userId)
        const outcome = outcomeFor(c.tier, r.rank, n, r.xp)
        const newTier = outcome === 'promoted' ? c.tier + 1 : outcome === 'demoted' ? c.tier - 1 : c.tier
        db.run('UPDATE cohort_members SET final_rank = ?, outcome = ? WHERE cohort_id = ? AND user_id = ?', r.rank, outcome, c.id, r.userId)
        db.run('UPDATE users SET tier = ?, best_tier = MAX(best_tier, ?) WHERE id = ?', newTier, newTier, r.userId)

        if (outcome === 'promoted') {
          grantAward(db, r.userId, {
            kind: 'league-promoted', ref: c.id, tier: newTier, gems: promotionGems(newTier),
            title: `Promoted to the ${leagueOf(newTier).name} League`,
            reason: `Finished #${r.rank} of ${n} in the ${league.name} League ${label}, with ${r.xp} XP.`,
          }, now)
        }
        if (newTier > (user?.best_tier ?? 0)) {
          grantAward(db, r.userId, {
            kind: 'league-reached', ref: `tier-${newTier}`, tier: newTier, gems: 0,
            title: `Reached the ${leagueOf(newTier).name} League`,
            reason: `First promoted into ${leagueOf(newTier).name} ${label}.`,
          }, now)
        }
        if (r.rank <= 3 && n >= LEAGUE.PODIUM_MIN_SIZE && r.xp > 0) {
          grantAward(db, r.userId, {
            kind: 'league-podium', ref: c.id, tier: c.tier, rank: r.rank, gems: podiumGems(c.tier, r.rank),
            title: `${ordinal(r.rank)} place · ${league.name} League`,
            reason: `Finished ${ordinal(r.rank)} of ${n} with ${r.xp} XP ${label}.`,
          }, now)
        }
        if (edition && r.rank <= TOURNAMENT.QUALIFY_TOP && r.xp > 0) {
          const entered = db.run(
            "INSERT OR IGNORE INTO tournament_entries (tournament_id, user_id, status, round, qualified_at) VALUES (?, ?, 'qualified', 0, ?)",
            edition.id, r.userId, now,
          )
          if (entered.changes) {
            grantAward(db, r.userId, {
              kind: 'tournament-qualified', ref: edition.id, tier: DIAMOND, gems: 0,
              title: `Qualified for the ${edition.name}`,
              reason: `Finished #${r.rank} of ${n} in the Diamond League ${label} — the top ${TOURNAMENT.QUALIFY_TOP} qualify.`,
            }, now)
          }
        }
        notify(db, r.userId, 'league-result', { cohortId: c.id, kind: 'league', weekId: c.week_id, tier: c.tier, newTier, rank: r.rank, size: n, outcome, xp: r.xp, sandbox: Boolean(c.sandbox_owner) }, now)
      }
    } else {
      const edition = schedule.find((e) => e.id === c.tournament_id) ?? { id: c.tournament_id, name: 'Diamond Tournament' }
      const lastRound = c.round === TOURNAMENT.ROUNDS.length - 1
      const advance = tournamentAdvance(c.round, n)
      const roundName = TOURNAMENT.ROUNDS[c.round]?.name ?? 'round'
      for (const r of ranked) {
        let outcome
        if (lastRound) {
          outcome = 'finished'
          db.run("UPDATE tournament_entries SET status = 'finished', round = ? WHERE tournament_id = ? AND user_id = ?", c.round, c.tournament_id, r.userId)
          if (r.rank === 1 && r.xp > 0) {
            grantAward(db, r.userId, {
              kind: 'tournament-champion', ref: c.tournament_id, tier: DIAMOND, rank: 1, gems: TOURNAMENT.REWARDS.champion,
              title: `Champion · ${edition.name}`, reason: `Won the final with ${r.xp} XP.`,
            }, now)
          } else if (r.rank <= 3 && r.xp > 0) {
            grantAward(db, r.userId, {
              kind: 'tournament-podium', ref: c.tournament_id, tier: DIAMOND, rank: r.rank,
              gems: r.rank === 2 ? TOURNAMENT.REWARDS.second : TOURNAMENT.REWARDS.third,
              title: `${ordinal(r.rank)} place · ${edition.name}`, reason: `Finished ${ordinal(r.rank)} of ${n} in the final with ${r.xp} XP.`,
            }, now)
          }
        } else if (r.rank <= advance && r.xp > 0) {
          outcome = 'advanced'
          const next = TOURNAMENT.ROUNDS[c.round + 1]
          db.run('UPDATE tournament_entries SET round = ? WHERE tournament_id = ? AND user_id = ?', c.round + 1, c.tournament_id, r.userId)
          grantAward(db, r.userId, {
            kind: `tournament-${next.id}`, ref: c.tournament_id, tier: DIAMOND, rank: r.rank,
            gems: TOURNAMENT.REWARDS[next.id] ?? 0,
            title: `Reached the ${next.name} · ${edition.name}`,
            reason: `Finished #${r.rank} of ${n} in the ${roundName}; the top ${advance} went through.`,
          }, now)
        } else {
          outcome = 'eliminated'
          db.run("UPDATE tournament_entries SET status = 'eliminated' WHERE tournament_id = ? AND user_id = ?", c.tournament_id, r.userId)
        }
        db.run('UPDATE cohort_members SET final_rank = ?, outcome = ? WHERE cohort_id = ? AND user_id = ?', r.rank, outcome, c.id, r.userId)
        notify(db, r.userId, 'league-result', { cohortId: c.id, kind: 'tournament', round: c.round, roundName, tournament: edition.name, rank: r.rank, size: n, outcome, xp: r.xp }, now)
      }
    }
    db.run('UPDATE cohorts SET finalized_at = ? WHERE id = ? AND finalized_at IS NULL', now, c.id)
  }

  /** Finalize every board whose week has ended. Each in its own transaction. */
  function finalizeDue(now) {
    const due = db.all('SELECT id FROM cohorts WHERE finalized_at IS NULL AND end_at <= ? ORDER BY end_at', now)
    for (const { id } of due) db.tx(() => finalizeCohort(id, now))
    return due.length
  }

  /* ── The view the app draws ── */

  function memberView(x, viewerId) {
    return {
      rank: x.rank,
      userId: x.userId,
      username: x.row.username,
      avatar: x.row.avatar,
      tier: x.row.tier,
      xp: x.xp,
      isYou: x.userId === viewerId,
      isTest: Boolean(x.row.is_seed),
    }
  }

  function tournamentStatus(userId, weekId) {
    const running = roundOfWeek(weekId)
    const entry = (id) => {
      const e = db.get('SELECT status, round FROM tournament_entries WHERE tournament_id = ? AND user_id = ?', id, userId)
      return e ? { status: e.status, round: e.round } : null
    }
    if (running) return { status: 'running', edition: editionSummary(running.edition), round: running.round, entry: entry(running.edition.id) }
    const upcoming = schedule.filter((e) => e.qualifyWeek >= weekId).sort((a, b) => (a.qualifyWeek < b.qualifyWeek ? -1 : 1))[0]
    if (upcoming) return { status: upcoming.qualifyWeek === weekId ? 'qualifying' : 'upcoming', edition: editionSummary(upcoming), entry: entry(upcoming.id) }
    return { status: 'none' }
  }

  function resultOf(row, viewerId) {
    /* The rewards this board's ending granted: made at its finalize instant,
       and keyed to the board, its tournament, or the league it reached. */
    const awards = db.all(
      `SELECT a.id, a.kind, a.tier, a.rank, a.gems, a.title, a.reason, a.claimed_at
         FROM awards a JOIN cohorts c ON c.id = ?
        WHERE a.user_id = ? AND a.created_at = c.finalized_at
          AND (a.ref = c.id OR a.ref = c.tournament_id OR a.kind = 'league-reached' OR a.kind = 'tournament-qualified')`,
      row.cohort_id, viewerId,
    )
    return {
      cohortId: row.cohort_id,
      kind: row.kind,
      weekId: row.week_id,
      tier: row.tier,
      round: row.round,
      rank: row.final_rank,
      size: Number(row.size),
      xp: row.xp,
      outcome: row.outcome,
      endedAt: row.end_at,
      sandbox: Boolean(row.sandbox_owner),
      awards: awards.map((a) => ({ id: a.id, kind: a.kind, tier: a.tier, rank: a.rank, gems: a.gems, title: a.title, reason: a.reason, claimed: a.claimed_at != null })),
    }
  }

  function history(userId, limit = 10) {
    const rows = db.all(
      `SELECT m.*, c.tier, c.round, c.end_at, c.sandbox_owner,
              (SELECT COUNT(*) FROM cohort_members x WHERE x.cohort_id = c.id) AS size
         FROM cohort_members m JOIN cohorts c ON c.id = m.cohort_id
        WHERE m.user_id = ? AND c.finalized_at IS NOT NULL
        ORDER BY c.end_at DESC LIMIT ?`,
      userId, limit,
    )
    return rows.map((r) => resultOf(r, userId))
  }

  /** Everything the Leagues tab shows, for one learner, now. */
  function view(userId, now) {
    finalizeDue(now)
    const user = db.get('SELECT * FROM users WHERE id = ?', userId)
    const week = weekWindow(user.timezone, now, WEEK_OPTS)
    const m = activeMembership(user.id, now)
    let cohort = null
    if (m) {
      const c = db.get('SELECT * FROM cohorts WHERE id = ?', m.cohort_id)
      const board = boardOf(c.id)
      const isLeague = c.kind === 'league'
      const zones = isLeague ? zonesFor(c.tier, board.length) : { promote: tournamentAdvance(c.round, board.length), demote: 0 }
      const standing = isLeague
        ? standingOf(c.tier, board, user.id)
        : (() => {
            const me = board.find((x) => x.userId === user.id)
            return { rank: me?.rank ?? null, size: board.length, promote: zones.promote, demote: 0, zone: me && me.rank <= zones.promote ? 'promotion' : 'safe', placesToPromote: me ? Math.max(0, me.rank - zones.promote) : null, xpToPromote: null, placesToSafety: 0 }
          })()
      cohort = {
        id: c.id,
        kind: c.kind,
        tier: c.tier,
        weekId: c.week_id,
        startAt: c.start_at,
        endAt: c.end_at,
        timezone: c.timezone,
        round: c.round,
        tournament: c.tournament_id ? editionSummary(schedule.find((e) => e.id === c.tournament_id) ?? { id: c.tournament_id, name: 'Diamond Tournament', qualifyWeek: c.week_id }) : null,
        sandbox: Boolean(c.sandbox_owner),
        zones,
        standing,
        members: board.map((x) => memberView(x, user.id)),
      }
    }
    const last = history(user.id, 1)[0] ?? null
    return {
      optedIn: Boolean(user.leagues_opt_in),
      tier: user.tier,
      bestTier: user.best_tier,
      week: { weekId: week.weekId, startAt: week.start, endAt: week.end, timezone: user.timezone },
      joined: Boolean(m),
      cohort,
      previous: last,
      tournament: user.role === 'judge' ? { status: 'none' } : tournamentStatus(user.id, week.weekId),
      sandbox: user.role === 'judge',
    }
  }

  return {
    roundOfWeek, editionSummary, activeMembership, boardOf, ensureMembership, joinCohort,
    creditXp, finalizeCohort, finalizeDue, history, view, tournamentStatus,
  }
}

export default { createLeagues, weekLabel }
