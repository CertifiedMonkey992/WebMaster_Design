import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { withServer, HOUR, DAY } from './helpers.js'
import { CHALLENGES } from '../../src/config/leagueConfig.js'

/** Make two learners friends, over the API. */
async function befriend(s, a, b) {
  const r = await s.api('POST', '/api/friends/requests', { token: a.token, body: { userId: b.id } })
  await s.api('POST', `/api/friends/requests/${r.body.request.id}/accept`, { token: b.token })
}

const KEYS = ['m01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3', 'm01-l01:check:c4', 'm01-l01:check:c5']

describe('friend challenges', () => {
  test('only friends can be challenged, and the invitation can be accepted or declined', () => withServer({}, async (s) => {
    const a = await s.learner('Chal_A')
    const b = await s.learner('Chal_B')
    const stranger = await s.learner('Chal_Stranger')
    await befriend(s, a, b)
    const refused = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [stranger.id] } })
    assert.equal(refused.status, 400)
    const noTopic = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'topic', durationDays: 3, friendIds: [b.id] } })
    assert.equal(noTopic.status, 400, 'a topic challenge names its module')
    const badDays = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 30, friendIds: [b.id] } })
    assert.equal(badDays.status, 400)
    const made = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [b.id] } })
    assert.equal(made.status, 200)
    assert.equal(made.body.challenge.status, 'active')
    assert.equal(made.body.challenge.invited.length, 1)
    const invite = await s.api('GET', '/api/notifications', { token: b.token })
    assert.ok(invite.body.notifications.some((n) => n.kind === 'challenge-invite'))
    const summary = await s.api('GET', '/api/summary', { token: b.token })
    assert.equal(summary.body.invites, 1)
    const accepted = await s.api('POST', `/api/challenges/${made.body.challenge.id}/accept`, { token: b.token })
    assert.equal(accepted.body.challenge.standings.length, 2)
    const again = await s.api('POST', `/api/challenges/${made.body.challenge.id}/accept`, { token: b.token })
    assert.equal(again.status, 409)
    const outsider = await s.api('POST', `/api/challenges/${made.body.challenge.id}/accept`, { token: stranger.token })
    assert.equal(outsider.status, 403)
  }))

  test('an XP race is scored from the league ledger inside its window, and pays its winner once', () => withServer({}, async (s) => {
    const a = await s.learner('Race_A')
    const b = await s.learner('Race_B')
    await befriend(s, a, b)
    await s.finishItem(a, 'm01-l01') // before the race: does not count
    const made = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 1, friendIds: [b.id] } })
    const id = made.body.challenge.id
    await s.api('POST', `/api/challenges/${id}/accept`, { token: b.token })
    s.clock.t += HOUR
    await s.finishItem(b, 'm01-l01')
    await s.practise(a, KEYS.slice(0, 2).map((k) => [k, true]))
    const live = await s.api('GET', '/api/challenges', { token: a.token })
    const view = live.body.challenges.find((c) => c.id === id)
    const scoreOf = (who) => view.standings.find((x) => x.id === who.id).score
    assert.ok(scoreOf(b) > scoreOf(a), 'XP earned before the race starts does not count')
    const cohortXp = (who) => s.db.get('SELECT xp FROM cohort_members WHERE user_id = ?', who.id).xp
    const leagueBefore = cohortXp(b)

    s.clock.t += DAY
    s.app.runJobs()
    const done = (await s.api('GET', '/api/challenges', { token: b.token })).body.challenges.find((c) => c.id === id)
    assert.equal(done.status, 'completed')
    assert.deepEqual(done.winners, [b.id])
    const awards = s.db.all("SELECT * FROM awards WHERE kind = 'challenge-win'")
    assert.equal(awards.length, 1)
    assert.equal(awards[0].user_id, b.id)
    assert.equal(awards[0].gems, CHALLENGES.WIN_GEMS)
    s.app.challenges.finalizeDue(s.clock.t + 1)
    assert.equal(s.db.all("SELECT * FROM awards WHERE kind = 'challenge-win'").length, 1, 'a challenge pays once')
    assert.equal(cohortXp(b), leagueBefore, 'winning a challenge never adds league XP')
    const result = await s.api('GET', '/api/notifications', { token: a.token })
    assert.ok(result.body.notifications.some((n) => n.kind === 'challenge-result' && n.payload.won === false))
  }))

  test('a target ends a challenge early', () => withServer({}, async (s) => {
    const a = await s.learner('Target_A')
    const b = await s.learner('Target_B')
    await befriend(s, a, b)
    const made = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'lessons', durationDays: 7, target: 3, friendIds: [b.id] } })
    await s.api('POST', `/api/challenges/${made.body.challenge.id}/accept`, { token: b.token })
    s.clock.t += 60000
    for (const id of ['m01-l01', 'm01-l02', 'm01-l03']) await s.finishItem(a, id)
    const c = s.db.get('SELECT * FROM challenges WHERE id = ?', made.body.challenge.id)
    assert.equal(c.status, 'completed', 'three lessons reached the target — the race is over')
    assert.equal(s.db.get("SELECT user_id FROM awards WHERE kind = 'challenge-win'").user_id, a.id)
  }))

  test('topic practice counts each right answer in its module once a day; a quiz counts its best score', () => withServer({}, async (s) => {
    const a = await s.learner('Topic_A')
    const b = await s.learner('Topic_B')
    await befriend(s, a, b)
    const topic = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'topic', topic: 'how-machines-learn', durationDays: 3, friendIds: [b.id] } })
    await s.api('POST', `/api/challenges/${topic.body.challenge.id}/accept`, { token: b.token })
    s.clock.t += 60000
    await s.practise(a, KEYS.map((k) => [k, true]))
    await s.practise(a, KEYS.map((k) => [k, true]))
    const score = s.app.challenges.score(s.db.get('SELECT * FROM challenges WHERE id = ?', topic.body.challenge.id), a.id, s.clock.t)
    assert.equal(score, KEYS.length, 'the same questions twice in a day count once')

    const quiz = await s.api('POST', '/api/challenges', { token: b.token, body: { format: 'quiz', durationDays: 1, friendIds: [a.id] } })
    await s.api('POST', `/api/challenges/${quiz.body.challenge.id}/accept`, { token: a.token })
    s.clock.t += 60000
    const ten = [...KEYS, 'm01-l01:learn:a-proxy', 'm01-l01:learn:a-sort', 'm01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3']
    await s.practise(b, ten.map((k, i) => [k, i < 8]))
    await s.practise(b, KEYS.map((k) => [k, true])) // too short to count
    const q = s.app.challenges.score(s.db.get('SELECT * FROM challenges WHERE id = ?', quiz.body.challenge.id), b.id, s.clock.t)
    assert.equal(q, 80, `a ${CHALLENGES.QUIZ_MIN_QUESTIONS}-question session counts; a 5-question one does not`)
  }))

  test('a challenge nobody joins is called off; leaving below two players calls it off', () => withServer({}, async (s) => {
    const a = await s.learner('Lonely_A')
    const b = await s.learner('Lonely_B')
    const c = await s.learner('Lonely_C')
    await befriend(s, a, b)
    await befriend(s, a, c)
    const ignored = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 7, friendIds: [b.id] } })
    s.clock.t += (CHALLENGES.ACCEPT_HOURS + 1) * HOUR
    s.app.runJobs()
    assert.equal(s.db.get('SELECT status, cancel_reason FROM challenges WHERE id = ?', ignored.body.challenge.id).cancel_reason, 'nobody-joined')

    const made = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 7, friendIds: [c.id] } })
    await s.api('POST', `/api/challenges/${made.body.challenge.id}/accept`, { token: c.token })
    const left = await s.api('POST', `/api/challenges/${made.body.challenge.id}/leave`, { token: c.token })
    assert.equal(left.body.challenge.status, 'cancelled')
    assert.equal(left.body.challenge.cancelReason, 'not-enough')
  }))

  test('the creator can call off a challenge nobody has joined yet, not one that started', () => withServer({}, async (s) => {
    const a = await s.learner('Cancel_A')
    const b = await s.learner('Cancel_B')
    await befriend(s, a, b)
    const made = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [b.id] } })
    const notCreator = await s.api('POST', `/api/challenges/${made.body.challenge.id}/cancel`, { token: b.token })
    assert.equal(notCreator.status, 403)
    const ok = await s.api('POST', `/api/challenges/${made.body.challenge.id}/cancel`, { token: a.token })
    assert.equal(ok.body.challenge.status, 'cancelled')
    const second = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [b.id] } })
    await s.api('POST', `/api/challenges/${second.body.challenge.id}/accept`, { token: b.token })
    const late = await s.api('POST', `/api/challenges/${second.body.challenge.id}/cancel`, { token: a.token })
    assert.equal(late.status, 409)
  }))

  test('there is a limit on open challenges', () => withServer({}, async (s) => {
    const a = await s.learner('Busy_A')
    const b = await s.learner('Busy_B')
    await befriend(s, a, b)
    for (let i = 0; i < CHALLENGES.MAX_OPEN; i++) {
      const r = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [b.id] } })
      assert.equal(r.status, 200)
    }
    const over = await s.api('POST', '/api/challenges', { token: a.token, body: { format: 'xp', durationDays: 3, friendIds: [b.id] } })
    assert.equal(over.status, 409)
  }))
})
