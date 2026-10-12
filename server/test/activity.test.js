import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, uid, HOUR, QUESTIONS, GRADED, answerFor } from './helpers.js'
import { XP } from '../../src/config/progressionConfig.js'
import { PRACTICE_XP, practiceSessionXp } from '../../src/utils/practiceXp.js'

const CHECK = (n) => `m01-l01:check:c${n}`

describe('activity: the server decides what counts', () => {
  let s
  before(async () => { s = await startServer() })
  after(async () => { await s.close() })

  test('answers are graded on the server: a wrong answer pays nothing, a right one pays once', async () => {
    const a = await s.learner('Grader_A')
    const session = uid('ls')
    const wrong = { id: uid(), type: 'answer', payload: { key: CHECK(1), context: 'check', sessionId: session, answer: answerFor(QUESTIONS.get(CHECK(1)).step, false) } }
    const right = { id: uid(), type: 'answer', payload: { key: CHECK(1), context: 'check', sessionId: session, answer: answerFor(QUESTIONS.get(CHECK(1)).step, true) } }
    const res = await s.api('POST', '/api/activity', { token: a.token, body: { events: [wrong, right] } })
    assert.equal(res.status, 200)
    assert.equal(res.body.results[0].correct, false)
    assert.equal(res.body.results[0].xp, 0)
    assert.equal(res.body.results[1].correct, true)
    assert.equal(res.body.results[1].xp, XP.CORRECT_ANSWER)
    const again = { id: uid(), type: 'answer', payload: { ...right.payload, sessionId: uid('ls') } }
    const second = await s.api('POST', '/api/activity', { token: a.token, body: { events: [again] } })
    assert.equal(second.body.results[0].xp, 0, 'a question pays once, ever')
    assert.equal(s.xpOf(a), XP.CORRECT_ANSWER)
  })

  test('a replayed event is recognised and changes nothing', async () => {
    const a = await s.learner('Replay_A')
    const event = { id: uid(), type: 'answer', payload: { key: CHECK(2), context: 'check', sessionId: uid('ls'), answer: answerFor(QUESTIONS.get(CHECK(2)).step, true) } }
    const first = await s.api('POST', '/api/activity', { token: a.token, body: { events: [event] } })
    const replay = await s.api('POST', '/api/activity', { token: a.token, body: { events: [event, event] } })
    assert.equal(first.body.results[0].status, 'ok')
    assert.deepEqual(replay.body.results.map((r) => r.status), ['duplicate', 'duplicate'])
    assert.equal(s.xpOf(a), XP.CORRECT_ANSWER)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM attempts WHERE user_id = ?', a.id).n, 1)
  })

  test('the client cannot name an amount, or answer for an item it cannot open', async () => {
    const a = await s.learner('Forger_A')
    const forged = { id: uid(), type: 'answer', xp: 9999, payload: { key: CHECK(3), context: 'check', sessionId: uid('ls'), xp: 9999, amount: 9999, answer: answerFor(QUESTIONS.get(CHECK(3)).step, true) } }
    const res = await s.api('POST', '/api/activity', { token: a.token, body: { events: [forged] } })
    assert.equal(res.body.results[0].xp, XP.CORRECT_ANSWER, 'any amount in the payload is ignored')
    const locked = await s.finishItem(a, 'm03-l01')
    assert.ok(locked.body.results.every((r) => r.status === 'invalid' && r.code === 'locked'), 'Module 3 is locked until Modules 1 and 2 are done')
    const unknown = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: uid(), type: 'answer', payload: { key: 'm01-l01:check:nope', context: 'check', sessionId: uid('ls'), answer: {} } }] } })
    assert.equal(unknown.body.results[0].code, 'unknown-question')
    const notGraded = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: uid(), type: 'answer', payload: { key: 'm01-l01:learn:a-proxy', context: 'check', sessionId: uid('ls'), answer: {} } }] } })
    assert.equal(notGraded.body.results[0].code, 'not-graded', 'a Learn question cannot be passed off as a Check')
    const junk = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: 'x', type: 'hack' }] } })
    assert.equal(junk.body.results[0].status, 'invalid')
  })

  test('a completion needs every Check answer from that sitting', async () => {
    const a = await s.learner('Complete_A')
    const skipped = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: uid(), type: 'complete', payload: { lessonId: 'm01-l01', sessionId: uid('ls') } }] } })
    assert.equal(skipped.body.results[0].code, 'incomplete')
    const half = await s.finishItem(a, 'm01-l01', { complete: false })
    const keys = GRADED.get('m01-l01')
    const partial = await s.api('POST', '/api/activity', {
      token: a.token,
      body: { events: [{ id: uid(), type: 'complete', payload: { lessonId: 'm01-l01', sessionId: uid('ls') } }] },
    })
    assert.equal(partial.body.results[0].code, 'incomplete', 'answers from another sitting do not count')
    assert.ok(half.body.results.length === keys.length)
    assert.equal(s.xpOf(a), keys.length * XP.CORRECT_ANSWER)
  })

  test('a first completion pays its item and the clean-Check bonus; a replay pays nothing', async () => {
    const a = await s.learner('Lesson_A')
    const keys = GRADED.get('m01-l01')
    const done = await s.finishItem(a, 'm01-l01')
    const completion = done.body.results.at(-1)
    assert.equal(completion.status, 'ok')
    assert.equal(completion.first, true)
    assert.equal(completion.perfect, true)
    assert.equal(completion.xp, XP.ITEM.lesson + XP.PERFECT_BONUS)
    assert.equal(s.xpOf(a), keys.length * XP.CORRECT_ANSWER + XP.ITEM.lesson + XP.PERFECT_BONUS)
    const before = s.xpOf(a)
    const replay = await s.finishItem(a, 'm01-l01')
    assert.equal(replay.body.results.at(-1).first, false)
    assert.equal(s.xpOf(a), before, 'reviewing a finished lesson pays no XP')
    const imperfect = await s.learner('Lesson_B')
    const r = await s.finishItem(imperfect, 'm01-l01', { right: (i) => i !== 0 })
    assert.equal(r.body.results.at(-1).perfect, false)
    assert.equal(r.body.results.at(-1).xp, XP.ITEM.lesson)
  })

  test('the module bonus is paid once, when its last item is finished', async () => {
    const a = await s.learner('Module_A')
    let bonus = 0
    for (const id of ['m01-l01', 'm01-l02', 'm01-l03', 'm01-case']) {
      const r = await s.finishItem(a, id)
      bonus = r.body.results.at(-1).xp
    }
    assert.equal(bonus, XP.ITEM.casefile + XP.PERFECT_BONUS + XP.SECTION_COMPLETE)
    assert.equal(s.db.get("SELECT COUNT(*) AS n FROM xp_ledger WHERE user_id = ? AND source LIKE 'section:%'", a.id).n, 1)
    const opened = await s.finishItem(a, 'm02-l01')
    assert.equal(opened.body.results.at(-1).status, 'ok', 'finishing Module 1 opens Module 2')
  })

  test('practice pays by the shared rule, from answers the server graded', async () => {
    const a = await s.learner('Practice_A')
    const keys = ['m01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3', 'm01-l01:check:c4', 'm01-l01:check:c5', 'm01-l01:learn:a-proxy']
    const r = await s.practise(a, keys.map((k, i) => [k, i !== 5]))
    const close = r.body.results.at(-1)
    const expected = practiceSessionXp({ answered: 6, freshCorrect: 5, sessionsInWindow: 0, xpInWindow: 0 })
    assert.equal(close.status, 'ok')
    assert.equal(close.xp, expected.xp)
    assert.equal(close.answered, 6)
    assert.equal(close.correct, 5)
    const again = await s.practise(a, keys.map((k) => [k, true]))
    assert.equal(again.body.results.at(-1).perAnswer, 1, 'only the one question not yet paid is fresh')
    s.clock.t += PRACTICE_XP.FRESH_HOURS * HOUR
    const later = await s.practise(a, keys.map((k) => [k, true]))
    assert.equal(later.body.results.at(-1).perAnswer, 6, 'fresh again after FRESH_HOURS')
    const dup = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: uid(), type: 'practice-complete', payload: { sessionId: r.sessionId } }] } })
    assert.equal(dup.body.results[0].status, 'duplicate', 'a session closes once')
    const empty = await s.api('POST', '/api/activity', { token: a.token, body: { events: [{ id: uid(), type: 'practice-complete', payload: { sessionId: uid('ps') } }] } })
    assert.equal(empty.body.results[0].code, 'empty', 'a session with no answers pays nothing')
  })

  test('a day of farming practice stops at the daily cap', async () => {
    const a = await s.learner('Farmer_A')
    const keys = ['m01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3', 'm01-l01:check:c4', 'm01-l01:check:c5']
    let total = 0
    for (let i = 0; i < 15; i++) {
      const r = await s.practise(a, keys.map((k) => [k, true]))
      total += r.body.results.at(-1).xp
      s.clock.t += 60000
    }
    assert.ok(total <= PRACTICE_XP.DAILY_CAP, `paid ${total}`)
    s.clock.t += 25 * HOUR
    const tomorrow = await s.practise(a, keys.map((k) => [k, true]))
    assert.ok(tomorrow.body.results.at(-1).xp > 0, 'the cap is a rolling day, not forever')
  })

  test('the reviewer’s margin controls may complete without answering, nobody else may', async () => {
    s.app.limiter.reset()
    const judge = await s.api('POST', '/api/auth/signin', { body: { identifier: 'judge@lunx.app', password: 'tsa2027' } })
    const r = await s.api('POST', '/api/activity', { token: judge.body.token, body: { events: [{ id: uid(), type: 'complete', payload: { lessonId: 'm04-l01', sessionId: uid('ls') } }] } })
    assert.equal(r.body.results[0].status, 'ok', 'the reviewer has every module open and its chips skip the Check')
  })
})
