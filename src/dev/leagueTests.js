/* ═══════════════════════════════════════════════════════════════════════════
   leagueTests.js — SELF-CHECKS FOR THE SHARED LEAGUE RULES
   ---------------------------------------------------------------------------
   The pure half of the leagues: week boundaries in a time zone
   (utils/leagueTime.js) and ranks, zones and outcomes (utils/leagueRules.js).
   The server's own suite (server/test/) drives the stateful half — joining,
   finalizing, rewards — against a real database.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as T from '../utils/leagueTime'
import * as R from '../utils/leagueRules'
import { LEAGUES, LEAGUE, TOURNAMENT, LEAGUE_REWARDS, DIAMOND } from '../config/leagueConfig'

export async function runLeagueTests() {
  const results = []
  const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail ?? '' })
  const HOUR = 3600000
  const DAY = 24 * HOUR

  /* ── L1: a week in UTC ── */
  {
    const wed = Date.UTC(2026, 9, 14, 15, 30) // Wed 14 Oct 2026, 15:30Z
    const w = T.weekWindow('UTC', wed)
    ok('L1 the week starts on the Sunday before', w.weekId === '2026-10-11', w.weekId)
    ok('L1 at midnight', w.start === Date.UTC(2026, 9, 11, 0, 0))
    ok('L1 and lasts seven days', w.end - w.start === 7 * DAY)
    const sundayMidnight = Date.UTC(2026, 9, 18, 0, 0)
    ok('L1 Sunday midnight starts the next week', T.weekWindow('UTC', sundayMidnight).weekId === '2026-10-18')
    ok('L1 a millisecond before is still this week', T.weekWindow('UTC', sundayMidnight - 1).weekId === '2026-10-11')
  }

  /* ── L2: the same instant, in different zones ── */
  {
    const t = Date.UTC(2026, 9, 18, 3, 0) // Sun 18 Oct 03:00Z
    const la = T.weekWindow('America/Los_Angeles', t)
    const tokyo = T.weekWindow('Asia/Tokyo', t)
    ok('L2 still Saturday in Los Angeles — last week', la.weekId === '2026-10-11', la.weekId)
    ok('L2 already Sunday in Tokyo — the new week', tokyo.weekId === '2026-10-18', tokyo.weekId)
    ok('L2 Los Angeles weeks end at local midnight', T.localParts('America/Los_Angeles', la.end).hh === 0 && T.localParts('America/Los_Angeles', la.end).dow === 0)
    ok('L2 Tokyo weeks start at local midnight', T.localParts('Asia/Tokyo', tokyo.start).hh === 0)
    ok('L2 offsets are measured correctly', T.offsetMinutes('Asia/Tokyo', t) === 540 && T.offsetMinutes('America/Los_Angeles', t) === -420)
    const kolkata = T.weekWindow('Asia/Kolkata', t)
    ok('L2 half-hour zones work', T.localParts('Asia/Kolkata', kolkata.start).hh === 0 && T.localParts('Asia/Kolkata', kolkata.start).mm === 0)
  }

  /* ── L3: daylight saving ── */
  {
    const fallWeek = T.windowOfWeek('America/New_York', '2026-11-01')
    ok('L3 the week clocks fall back is 7 days and an hour', fallWeek.end - fallWeek.start === 7 * DAY + HOUR, (fallWeek.end - fallWeek.start) / HOUR)
    const springWeek = T.windowOfWeek('America/New_York', '2026-03-08')
    ok('L3 the week clocks spring forward is 7 days less an hour', springWeek.end - springWeek.start === 7 * DAY - HOUR)
    ok('L3 consecutive weeks share their boundary', T.windowOfWeek('America/New_York', '2026-11-08').start === fallWeek.end)
    const inside = fallWeek.start + 3 * DAY
    ok('L3 an instant finds its own week', T.weekWindow('America/New_York', inside).weekId === '2026-11-01')
  }

  /* ── L4: zones ── */
  {
    const full = LEAGUE.COHORT_SIZE
    const silver = R.zonesFor(1, full)
    ok('L4 a full Silver board uses the configured counts', silver.promote === LEAGUES[1].promote && silver.demote === LEAGUES[1].demote)
    ok('L4 Bronze never demotes', R.zonesFor(0, full).demote === 0 && R.zonesFor(0, full).promote === LEAGUES[0].promote)
    ok('L4 Diamond never promotes', R.zonesFor(DIAMOND, full).promote === 0 && R.zonesFor(DIAMOND, full).demote > 0)
    const small = R.zonesFor(1, 10)
    ok('L4 a smaller board scales its zones', small.promote === Math.round(7 * 10 / full) && small.demote === Math.round(5 * 10 / full))
    ok('L4 a board of one still lets its learner move up', R.zonesFor(1, 1).promote === 1 && R.zonesFor(1, 1).demote === 0)
    const three = R.zonesFor(4, 3)
    ok('L4 with three or more, somebody is safe', three.promote + three.demote <= 2)
    let overlap = false
    for (let tier = 0; tier < LEAGUES.length; tier++) {
      for (let size = 1; size <= 40; size++) {
        const z = R.zonesFor(tier, size)
        if (z.promote + z.demote > size || z.promote < 0 || z.demote < 0) overlap = true
      }
    }
    ok('L4 zones never overlap, at any size, in any league', !overlap)
  }

  /* ── L5: outcomes ── */
  {
    const size = 12
    ok('L5 first with enough XP is promoted', R.outcomeFor(2, 1, size, 300) === 'promoted')
    ok('L5 the promotion zone needs the minimum XP', R.outcomeFor(2, 1, size, LEAGUE.MIN_XP_TO_PROMOTE - 1) === 'stayed')
    ok('L5 Diamond never promotes', R.outcomeFor(DIAMOND, 1, size, 5000) === 'stayed')
    ok('L5 the last places drop', R.outcomeFor(3, size, size, 50) === 'demoted')
    ok('L5 Bronze never drops', R.outcomeFor(0, size, size, 1) === 'stayed')
    ok('L5 the middle stays', R.outcomeFor(3, 6, size, 80) === 'stayed')
  }

  /* ── L6: ranks ── */
  {
    const ranked = R.rankStandings([
      { userId: 'c', xp: 50, xpAt: 300, joinedAt: 1 },
      { userId: 'a', xp: 80, xpAt: 500, joinedAt: 3 },
      { userId: 'b', xp: 50, xpAt: 200, joinedAt: 2 },
      { userId: 'd', xp: 50, xpAt: 200, joinedAt: 1 },
    ])
    ok('L6 more XP ranks higher', ranked[0].userId === 'a' && ranked[0].rank === 1)
    ok('L6 equal XP: whoever reached it first', ranked[1].userId === 'd' && ranked[2].userId === 'b' && ranked[3].userId === 'c')
    ok('L6 ranks are positions, never shared', ranked.map((m) => m.rank).join() === '1,2,3,4')
  }

  /* ── L7: where a learner stands ── */
  {
    const board = R.rankStandings(Array.from({ length: 10 }, (_, i) => ({ userId: `u${i}`, xp: 200 - i * 15, xpAt: i })))
    const s = R.standingOf(1, board, 'u5')
    ok('L7 places to move up', s.rank === 6 && s.placesToPromote === 6 - s.promote, JSON.stringify(s))
    ok('L7 XP to pass the last promoting place', s.xpToPromote === board[s.promote - 1].xp - board[5].xp + 1)
    const last = R.standingOf(1, board, 'u9')
    ok('L7 the demotion zone says how far to safety', last.zone === 'demotion' && last.placesToSafety === last.demote, JSON.stringify(last))
    const top = R.standingOf(1, board, 'u0')
    ok('L7 in the zone, nothing more to climb', top.zone === 'promotion' && top.placesToPromote === 0 && top.xpToPromote === null)
    ok('L7 someone not on the board has no rank', R.standingOf(1, board, 'nobody').rank === null)
  }

  /* ── L8: rewards and the tournament ── */
  {
    ok('L8 promotion pays by the new league', R.promotionGems(3) === LEAGUE_REWARDS.PROMOTION_GEMS[3] && R.promotionGems(0) === 0)
    ok('L8 the podium pays more in higher leagues', R.podiumGems(5, 1) === LEAGUE_REWARDS.PODIUM_GEMS[0] + 5 * LEAGUE_REWARDS.PODIUM_TIER_STEP)
    ok('L8 fourth place is not the podium', R.podiumGems(5, 4) === 0)
    ok('L8 a full quarterfinal advances the configured number', R.tournamentAdvance(0, TOURNAMENT.BRACKET_SIZE) === TOURNAMENT.ROUNDS[0].advanceTop)
    ok('L8 a small bracket still advances someone', R.tournamentAdvance(0, 4) >= 1)
    ok('L8 the final advances nobody', R.tournamentAdvance(2, 30) === 0)
    ok('L8 study habits fall into bands', R.activityBand(0) === 0 && R.activityBand(LEAGUE.ACTIVITY_BANDS[2]) === 2 && R.activityBand(99999) === LEAGUE.ACTIVITY_BANDS.length - 1)
    ok('L8 the schedule is in week order and on Sundays', TOURNAMENT.SCHEDULE.every((e) => {
      const d = T.parseYmd(e.qualifyWeek)
      return d && new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay() === LEAGUE.WEEK_START_DAY
    }))
  }

  /* ── L9: time zone names ── */
  {
    ok('L9 real zones are accepted', T.isValidTimeZone('Europe/London') && T.isValidTimeZone('UTC'))
    ok('L9 junk is refused', !T.isValidTimeZone('Mars/Olympus') && !T.isValidTimeZone('') && !T.isValidTimeZone(42))
    ok('L9 week ids shift by whole weeks', T.shiftWeek('2026-10-11', 1) === '2026-10-18' && T.shiftWeek('2026-12-27', 1) === '2027-01-03')
    ok('L9 a local day key', T.dayKeyIn('Pacific/Auckland', Date.UTC(2026, 9, 14, 12, 0)) === '2026-10-15')
  }

  const passed = results.filter((r) => r.pass).length
  const failures = results.filter((r) => !r.pass)
  return { summary: `${passed}/${results.length} passed`, passed, total: results.length, failures, results }
}

export default runLeagueTests
