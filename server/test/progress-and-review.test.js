import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './helpers.js'

describe('progress follows the account between devices', () => {
  test('save, load on another device, and refuse a stale write with the newer copy', () => withServer({}, async (s) => {
    const a = await s.learner('Sync_A')
    const empty = await s.api('GET', '/api/progress', { token: a.token })
    assert.deepEqual(empty.body, { rev: 0, state: null, updatedAt: 0 })

    const laptop = await s.api('PUT', '/api/progress', { token: a.token, body: { baseRev: 0, state: { version: 3, xp: 40, practice: { items: { k: 1 } } } } })
    assert.equal(laptop.body.rev, 1)

    /* A phone signs in: a second session for the same account. */
    s.app.limiter.reset()
    const phone = await s.api('POST', '/api/auth/signin', { body: { identifier: 'sync_a@example.org', password: 'correct horse battery' } })
    const loaded = await s.api('GET', '/api/progress', { token: phone.body.token })
    assert.equal(loaded.body.rev, 1)
    assert.equal(loaded.body.state.xp, 40)
    assert.deepEqual(loaded.body.state.practice, { items: { k: 1 } }, 'practice history comes along')

    const phoneSave = await s.api('PUT', '/api/progress', { token: phone.body.token, body: { baseRev: 1, state: { version: 3, xp: 55 } } })
    assert.equal(phoneSave.body.rev, 2)
    const stale = await s.api('PUT', '/api/progress', { token: a.token, body: { baseRev: 1, state: { version: 3, xp: 41 } } })
    assert.equal(stale.status, 409, 'the laptop’s old copy cannot roll the phone’s work back')
    assert.equal(stale.body.rev, 2)
    assert.equal(stale.body.state.xp, 55, 'and it is handed the newer copy to adopt')
  }))

  test('progress is private to its account and size-limited', () => withServer({}, async (s) => {
    const a = await s.learner('Own_A')
    const b = await s.learner('Own_B')
    await s.api('PUT', '/api/progress', { token: a.token, body: { baseRev: 0, state: { secret: 'mine' } } })
    const other = await s.api('GET', '/api/progress', { token: b.token })
    assert.equal(other.body.state, null)
    const huge = await s.api('PUT', '/api/progress', { token: a.token, body: { baseRev: 1, state: { blob: 'x'.repeat(950000) } } })
    assert.equal(huge.status, 413)
    const notObject = await s.api('PUT', '/api/progress', { token: a.token, body: { baseRev: 1, state: [1, 2] } })
    assert.equal(notObject.status, 400)
  }))
})

describe('the reviewer’s sandbox', () => {
  async function judge(s) {
    s.app.limiter.reset()
    const res = await s.api('POST', '/api/auth/signin', { body: { identifier: 'judge@lunx.app', password: 'tsa2027' } })
    return { token: res.body.token, id: res.body.account.id }
  }

  test('opens a labelled board of test accounts that only the reviewer is on', () => withServer({ env: 'production' }, async (s) => {
    const j = await judge(s)
    const view = await s.api('GET', '/api/leagues', { token: j.token })
    assert.equal(view.body.sandbox, true)
    assert.equal(view.body.cohort.sandbox, true)
    assert.equal(view.body.cohort.members.length, 12)
    const others = view.body.cohort.members.filter((m) => !m.isYou)
    assert.ok(others.every((m) => m.isTest && m.username.startsWith('Test_')), 'every other name is a labelled test account')
    const real = await s.learner('Real_Person')
    await s.finishItem(real, 'm01-l01')
    const realBoard = s.db.get('SELECT c.* FROM cohorts c JOIN cohort_members m ON m.cohort_id = c.id WHERE m.user_id = ?', real.id)
    assert.equal(realBoard.sandbox_owner, null)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM cohort_members WHERE cohort_id = ?', realBoard.id).n, 1, 'no test account joins a real board in production')
    const forbidden = await s.api('POST', '/api/review/study', { token: real.token })
    assert.equal(forbidden.status, 403, 'nobody else has the reviewer’s controls')
  }))

  test('study runs the test accounts through real lessons; ending the week runs the real finalization', () => withServer({}, async (s) => {
    const j = await judge(s)
    await s.api('POST', '/api/review/sandbox', { token: j.token })
    const studied = await s.api('POST', '/api/review/study', { token: j.token })
    assert.equal(studied.body.testers, 11)
    assert.ok(studied.body.xp > 0)
    const graded = s.db.get("SELECT COUNT(*) AS n FROM attempts a JOIN users u ON u.id = a.user_id WHERE u.sandbox_owner = ? AND a.context = 'check'", j.id).n
    assert.ok(graded >= 11 * 5, 'every Check question was answered and graded')
    const wrong = s.db.get("SELECT COUNT(*) AS n FROM attempts a JOIN users u ON u.id = a.user_id WHERE u.sandbox_owner = ? AND a.correct = 0", j.id).n
    assert.ok(wrong > 0, 'test accounts get some wrong — they are not a script of perfect scores')
    await s.finishItem({ token: j.token, id: j.id }, 'm01-l01')
    const view = await s.api('GET', '/api/leagues', { token: j.token })
    assert.ok(view.body.cohort.members.find((m) => m.isYou).xp > 0, 'the reviewer’s own lessons count on the sandbox board')
    const ended = await s.api('POST', '/api/review/end-week', { token: j.token })
    assert.equal(ended.status, 200)
    const results = s.db.all('SELECT outcome FROM cohort_members WHERE cohort_id = ?', ended.body.cohortId)
    assert.ok(results.every((r) => r.outcome), 'every place got an outcome')
    assert.ok(results.some((r) => r.outcome === 'promoted'))
    const after = await s.api('GET', '/api/leagues', { token: j.token })
    assert.equal(after.body.previous.cohortId, ended.body.cohortId)
    assert.notEqual(after.body.cohort.id, ended.body.cohortId, 'a fresh sandbox week opens')
  }))

  test('a test account sends a real friend request, then a real challenge', () => withServer({}, async (s) => {
    const j = await judge(s)
    const noFriend = await s.api('POST', '/api/review/challenge', { token: j.token })
    assert.equal(noFriend.status, 409, 'challenges are between friends')
    const req = await s.api('POST', '/api/review/friend-request', { token: j.token })
    assert.ok(req.body.from.startsWith('Test_'))
    const inbox = await s.api('GET', '/api/friends/requests', { token: j.token })
    assert.equal(inbox.body.incoming.length, 1)
    assert.equal(inbox.body.incoming[0].user.isTest, true)
    await s.api('POST', `/api/friends/requests/${inbox.body.incoming[0].id}/accept`, { token: j.token })
    const ch = await s.api('POST', '/api/review/challenge', { token: j.token })
    assert.equal(ch.status, 200)
    const mine = await s.api('GET', '/api/challenges', { token: j.token })
    assert.equal(mine.body.challenges[0].myStatus, 'invited')
    const reset = await s.api('POST', '/api/review/reset', { token: j.token })
    assert.equal(reset.body.status, 'reset')
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM users WHERE sandbox_owner = ?', j.id).n, 0)
  }))
})
