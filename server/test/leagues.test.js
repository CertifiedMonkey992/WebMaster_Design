import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { withServer, uid, HOUR, DAY, WEDNESDAY, QUESTIONS, answerFor } from './helpers.js'
import { LEAGUE, LEAGUES, TOURNAMENT, DIAMOND } from '../../src/config/leagueConfig.js'
import { zonesFor, promotionGems } from '../../src/utils/leagueRules.js'

/** Sunday 18 October 2026, 00:00 UTC — the end of the test week in UTC. */
const NEXT_SUNDAY = Date.UTC(2026, 9, 18, 0, 0, 0)

/** Give a learner league XP by practising `n` distinct fresh questions right. */
async function earn(s, who, n) {
  const keys = ['m01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3', 'm01-l01:check:c4', 'm01-l01:check:c5', 'm01-l01:learn:a-proxy', 'm01-l01:learn:a-sort']
  return s.practise(who, keys.slice(0, n).map((k) => [k, true]))
}

describe('leagues', () => {
  test('a learner joins a board with their first league XP of the week — not before', async () => {
    await withServer({}, async (s) => {
    const a = await s.learner('Joiner_A')
    let view = await s.api('GET', '/api/leagues', { token: a.token })
    assert.equal(view.body.joined, false)
    assert.equal(view.body.cohort, null)
    assert.equal(view.body.week.weekId, '2026-10-11', 'the week runs Sunday to Sunday')
    const wrongOnly = await s.practise(a, [['m01-l01:check:c1', false], ['m01-l01:check:c2', false]])
    assert.equal(wrongOnly.body.results.at(-1).xp, 0)
    view = await s.api('GET', '/api/leagues', { token: a.token })
    assert.equal(view.body.joined, false, 'no XP, no board')
    await s.finishItem(a, 'm01-l01')
    view = await s.api('GET', '/api/leagues', { token: a.token })
    assert.equal(view.body.joined, true)
    assert.equal(view.body.cohort.tier, 0)
    assert.equal(view.body.cohort.members[0].isYou, true)
    assert.equal(view.body.cohort.members[0].xp, s.xpOf(a), 'weekly XP is exactly the league XP earned since joining')
    assert.equal(view.body.cohort.endAt, NEXT_SUNDAY)
    })
  })

  test('matchmaking keeps a board within a few time zones, and its week ends on its own Sunday', async () => {
    await withServer({}, async (s) => {
    const ny = await s.learner('Zone_NY', { timezone: 'America/New_York' })
    const chi = await s.learner('Zone_CHI', { timezone: 'America/Chicago' })
    const tokyo = await s.learner('Zone_TYO', { timezone: 'Asia/Tokyo' })
    for (const who of [ny, chi, tokyo]) await s.finishItem(who, 'm01-l01')
    const board = (who) => s.db.get('SELECT cohort_id FROM cohort_members WHERE user_id = ?', who.id).cohort_id
    assert.equal(board(ny), board(chi), 'one hour apart: the same board')
    assert.notEqual(board(ny), board(tokyo), 'thirteen hours apart: different boards')
    const nyBoard = s.db.get('SELECT * FROM cohorts WHERE id = ?', board(ny))
    assert.equal(nyBoard.end_at, Date.UTC(2026, 9, 18, 4, 0, 0), 'midnight Sunday in New York (EDT)')
    const tyoBoard = s.db.get('SELECT * FROM cohorts WHERE id = ?', board(tokyo))
    assert.equal(tyoBoard.end_at, Date.UTC(2026, 9, 17, 15, 0, 0), 'midnight Sunday in Tokyo')
    })
  })

  test('a board holds at most COHORT_SIZE learners', async () => {
    await withServer({}, async (s) => {
    const people = []
    for (let i = 0; i < LEAGUE.COHORT_SIZE + 2; i++) people.push(await s.learner(`Crowd_${i}`))
    for (const p of people) await earn(s, p, 1)
    const sizes = s.db.all('SELECT COUNT(*) AS n FROM cohort_members GROUP BY cohort_id').map((r) => Number(r.n))
    assert.deepEqual(sizes.sort((a, b) => b - a), [LEAGUE.COHORT_SIZE, 2])
    })
  })

  test('the week ends on the server’s clock: ranks, promotion, demotion and rewards — once', async () => {
    await withServer({}, async (s) => {
    const people = []
    for (let i = 0; i < 10; i++) people.push(await s.learner(`Silver_${i}`))
    for (const p of people) s.db.run('UPDATE users SET tier = 1, best_tier = 1 WHERE id = ?', p.id)
    /* Distinct XP: Silver_0 most … Silver_9 least. */
    for (let i = 0; i < people.length; i++) {
      await earn(s, people[i], 7 - Math.min(6, i))
      if (i < 4) await s.finishItem(people[i], 'm01-l01')
    }
    const view = await s.api('GET', '/api/leagues', { token: people[0].token })
    const size = view.body.cohort.members.length
    assert.equal(size, 10)
    const zones = zonesFor(1, size)
    assert.deepEqual(view.body.cohort.zones, zones)
    assert.equal(view.body.cohort.standing.rank, 1)

    s.clock.t = NEXT_SUNDAY - 1
    assert.equal(s.app.runJobs().weeks, 0, 'a millisecond before Sunday, the week is still running')
    s.clock.t = NEXT_SUNDAY + 1000
    assert.equal(s.app.runJobs().weeks, 1)
    assert.equal(s.app.runJobs().weeks, 0, 'a finished week is finished once')

    const ranked = s.db.all('SELECT user_id, final_rank, outcome FROM cohort_members ORDER BY final_rank')
    for (const r of ranked) {
      const tier = s.db.get('SELECT tier FROM users WHERE id = ?', r.user_id).tier
      if (r.final_rank <= zones.promote) { assert.equal(r.outcome, 'promoted'); assert.equal(tier, 2) }
      else if (r.final_rank > size - zones.demote) { assert.equal(r.outcome, 'demoted'); assert.equal(tier, 0) }
      else { assert.equal(r.outcome, 'stayed'); assert.equal(tier, 1) }
    }
    const top = people[0]
    const awards = s.db.all('SELECT kind, gems FROM awards WHERE user_id = ? ORDER BY kind', top.id)
    assert.deepEqual(awards.map((a) => a.kind), ['league-podium', 'league-promoted', 'league-reached'])
    assert.equal(awards.find((a) => a.kind === 'league-promoted').gems, promotionGems(2))
    s.app.leagues.finalizeDue(s.clock.t + 1)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM awards WHERE user_id = ?', top.id).n, 3, 'no award twice')

    const after = await s.api('GET', '/api/leagues', { token: top.token })
    assert.equal(after.body.previous.outcome, 'promoted')
    assert.equal(after.body.previous.rank, 1)
    assert.ok(after.body.previous.awards.length >= 2)
    assert.equal(after.body.joined, false, 'a new week starts empty')
    await earn(s, top, 1)
    const next = await s.api('GET', '/api/leagues', { token: top.token })
    assert.equal(next.body.cohort.tier, 2, 'next week is played in the league just reached')
    assert.equal(next.body.cohort.weekId, '2026-10-18')
    })
  })

  test('promotion needs the minimum XP, and a podium needs a real field', async () => {
    await withServer({}, async (s) => {
    const a = await s.learner('Lonely_A')
    await s.practise(a, [['m01-l01:check:c1', true]])
    s.clock.t = NEXT_SUNDAY + 1
    s.app.runJobs()
    const row = s.db.get('SELECT outcome, final_rank FROM cohort_members WHERE user_id = ?', a.id)
    assert.equal(row.final_rank, 1)
    assert.equal(row.outcome, 'stayed', `${LEAGUE.MIN_XP_TO_PROMOTE} XP is needed to move up`)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM awards WHERE user_id = ?', a.id).n, 0, 'first of one is not a podium')
    })
  })

  test('the reward is claimed once, and never adds league XP', async () => {
    await withServer({}, async (s) => {
    const people = []
    for (let i = 0; i < 6; i++) people.push(await s.learner(`Claim_${i}`))
    for (let i = 0; i < people.length; i++) await earn(s, people[i], 7 - i)
    await s.finishItem(people[0], 'm01-l01')
    s.clock.t = NEXT_SUNDAY + 1
    const summary = await s.api('GET', '/api/summary', { token: people[0].token })
    const award = summary.body.unclaimed.find((a) => a.kind === 'league-promoted')
    assert.ok(award && award.gems > 0)
    const xpBefore = s.xpOf(people[0])
    const claim = await s.api('POST', `/api/awards/${award.id}/claim`, { token: people[0].token })
    assert.equal(claim.body.award.claimed, true)
    const twice = await s.api('POST', `/api/awards/${award.id}/claim`, { token: people[0].token })
    assert.equal(twice.body.award.claimed, true)
    assert.equal(s.xpOf(people[0]), xpBefore, 'rewards are gems, never XP')
    const stolen = await s.api('POST', `/api/awards/${award.id}/claim`, { token: people[1].token })
    assert.equal(stolen.status, 404, 'another learner cannot claim it')
    const later = await s.api('GET', '/api/summary', { token: people[0].token })
    assert.ok(!later.body.unclaimed.some((a) => a.id === award.id))
    })
  })

  test('leaving the leagues takes a learner off the board at once, and keeps them off', async () => {
    await withServer({}, async (s) => {
    const a = await s.learner('Private_A')
    const b = await s.learner('Private_B')
    await earn(s, a, 3)
    await earn(s, b, 2)
    await s.api('PATCH', '/api/me', { token: a.token, body: { settings: { leaguesOptIn: false } } })
    const seen = await s.api('GET', '/api/leagues', { token: b.token })
    assert.ok(!seen.body.cohort.members.some((m) => m.userId === a.id))
    s.clock.t += 2 * HOUR
    await s.finishItem(a, 'm01-l01')
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM cohort_members WHERE user_id = ?', a.id).n, 0)
    const mine = await s.api('GET', '/api/leagues', { token: a.token })
    assert.equal(mine.body.optedIn, false)
    })
  })

  test('learners who blocked each other are never matched onto the same board', async () => {
    await withServer({}, async (s) => {
    const a = await s.learner('Blocker_A')
    const b = await s.learner('Blocker_B')
    await s.api('POST', '/api/blocks', { token: a.token, body: { userId: b.id } })
    await earn(s, a, 2)
    await earn(s, b, 2)
    const boards = s.db.all('SELECT DISTINCT cohort_id FROM cohort_members').length
    assert.equal(boards, 2)
    })
  })

  test('the client’s clock means nothing: XP lands in the week the server is in', async () => {
    await withServer({}, async (s) => {
    const a = await s.learner('Clock_A')
    const event = { id: uid(), type: 'answer', at: Date.UTC(2020, 0, 1), payload: { key: 'm01-l01:check:c1', context: 'check', sessionId: uid('ls'), at: Date.UTC(2030, 0, 1), answer: answerFor(QUESTIONS.get('m01-l01:check:c1').step, true) } }
    await s.api('POST', '/api/activity', { token: a.token, body: { events: [event] } })
    const row = s.db.get('SELECT m.week_id, l.created_at FROM cohort_members m, xp_ledger l WHERE m.user_id = ? AND l.user_id = ?', a.id, a.id)
    assert.equal(row.week_id, '2026-10-11')
    assert.equal(row.created_at, WEDNESDAY)
    })
  })

  test('a late-Saturday learner joins a board that ends at their own midnight', async () => {
    const lateSat = Date.UTC(2026, 9, 18, 6, 0, 0) // Saturday 23:00 in Los Angeles (PDT)
    await withServer({ now: lateSat }, async (s) => {
    const a = await s.learner('Late_LA', { timezone: 'America/Los_Angeles' })
    await earn(s, a, 2)
    const board = s.db.get('SELECT c.* FROM cohorts c JOIN cohort_members m ON m.cohort_id = c.id WHERE m.user_id = ?', a.id)
    assert.equal(board.week_id, '2026-10-11')
    assert.equal(board.end_at, Date.UTC(2026, 9, 18, 7, 0, 0), 'one hour later: midnight in Los Angeles')
    s.clock.t = board.end_at + 1
    await s.finishItem(a, 'm01-l01')
    const next = s.db.get('SELECT c.week_id FROM cohorts c JOIN cohort_members m ON m.cohort_id = c.id WHERE m.user_id = ? AND c.finalized_at IS NULL', a.id)
    assert.equal(next.week_id, '2026-10-18')
    })
  })
})

describe('the Diamond Tournament', () => {
  const schedule = [{ id: 'T-test', name: 'Test Diamond Tournament', qualifyWeek: '2026-10-11' }]

  test('only the top of Diamond in the qualifying week enters, and it runs three rounds to a champion', async () => {
    await withServer({ schedule }, async (s) => {
    const people = []
    for (let i = 0; i < 12; i++) people.push(await s.learner(`Diamond_${String(i).padStart(2, '0')}`))
    for (const p of people) s.db.run('UPDATE users SET tier = ?, best_tier = ? WHERE id = ?', DIAMOND, DIAMOND, p.id)
    for (let i = 0; i < people.length; i++) {
      await earn(s, people[i], Math.max(1, 7 - Math.floor(i / 2)))
      if (i < 3) await s.finishItem(people[i], 'm01-l01')
    }
    const status = await s.api('GET', '/api/leagues', { token: people[0].token })
    assert.equal(status.body.tournament.status, 'qualifying')

    s.clock.t = NEXT_SUNDAY + 1
    s.app.runJobs()
    const entries = s.db.all("SELECT user_id FROM tournament_entries WHERE tournament_id = 'T-test'").map((r) => r.user_id)
    assert.equal(entries.length, TOURNAMENT.QUALIFY_TOP)
    const outsider = people.find((p) => !entries.includes(p.id))
    assert.ok(outsider, 'with twelve on the board, two do not qualify')
    assert.equal(s.db.get('SELECT tier FROM users WHERE id = ?', people[0].id).tier, DIAMOND, 'Diamond never promotes')

    /* Quarterfinals: qualifiers play a bracket; everyone else plays Diamond. */
    for (const p of people) await earn(s, p, 1 + (people.indexOf(p) % 3))
    const kindOf = (p) => s.db.get('SELECT c.kind FROM cohorts c JOIN cohort_members m ON m.cohort_id = c.id WHERE m.user_id = ? AND c.finalized_at IS NULL', p.id).kind
    assert.equal(kindOf(people[0]), 'tournament')
    assert.equal(kindOf(outsider), 'league', 'an unqualified learner cannot enter the bracket')
    const qf = await s.api('GET', '/api/leagues', { token: people[0].token })
    assert.equal(qf.body.cohort.kind, 'tournament')
    assert.equal(qf.body.tournament.status, 'running')
    assert.equal(qf.body.tournament.round, 0)

    s.clock.t = NEXT_SUNDAY + 7 * DAY + 1
    s.app.runJobs()
    const semi = s.db.all("SELECT user_id FROM tournament_entries WHERE tournament_id = 'T-test' AND round = 1 AND status = 'qualified'").map((r) => r.user_id)
    assert.ok(semi.length >= 1 && semi.length < entries.length, `${semi.length} go through`)
    assert.equal(s.db.get("SELECT COUNT(*) AS n FROM awards WHERE kind = 'tournament-semifinal'").n, semi.length)
    const eliminated = entries.find((id) => !semi.includes(id))
    const elim = people.find((p) => p.id === eliminated)

    for (const p of people) await earn(s, p, 2)
    assert.equal(kindOf(people.find((p) => p.id === semi[0])), 'tournament')
    assert.equal(kindOf(elim), 'league', 'eliminated learners go back to Diamond')

    s.clock.t = NEXT_SUNDAY + 14 * DAY + 1
    s.app.runJobs()
    const finalists = s.db.all("SELECT user_id FROM tournament_entries WHERE tournament_id = 'T-test' AND round = 2 AND status = 'qualified'").map((r) => r.user_id)
    assert.ok(finalists.length >= 1)
    for (const id of finalists) await earn(s, people.find((p) => p.id === id), 3)

    s.clock.t = NEXT_SUNDAY + 21 * DAY + 1
    s.app.runJobs()
    assert.equal(s.db.get("SELECT COUNT(*) AS n FROM awards WHERE kind = 'tournament-champion'").n, 1)
    const after = await s.api('GET', '/api/leagues', { token: people[0].token })
    assert.equal(after.body.tournament.status, 'none', 'no tournament is pretended when none is scheduled')
    })
  })

  test('outside the scheduled weeks there is no tournament, only Diamond', async () => {
    await withServer({ schedule: [{ id: 'T-later', name: 'Later', qualifyWeek: '2026-12-06' }] }, async (s) => {
    const a = await s.learner('Diamond_Solo')
    s.db.run('UPDATE users SET tier = ? WHERE id = ?', DIAMOND, a.id)
    await earn(s, a, 3)
    const view = await s.api('GET', '/api/leagues', { token: a.token })
    assert.equal(view.body.tournament.status, 'upcoming')
    assert.equal(view.body.tournament.edition.qualifyWeek, '2026-12-06')
    assert.equal(view.body.cohort.kind, 'league')
    assert.equal(LEAGUES[view.body.cohort.tier].id, 'diamond')
    })
  })
})
