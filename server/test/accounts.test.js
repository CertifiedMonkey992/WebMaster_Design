import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, DAY } from './helpers.js'
import { isFriendCode } from '../../src/utils/accountRules.js'

describe('accounts', () => {
  let s
  before(async () => { s = await startServer() })
  after(async () => { await s.close() })

  test('sign-up validates every field and needs a username', async () => {
    const bad = await s.api('POST', '/api/auth/signup', { body: { email: 'nope', username: 'Ok_Name', password: 'long enough' } })
    assert.equal(bad.status, 400)
    assert.equal(bad.body.error.field, 'email')
    const noName = await s.api('POST', '/api/auth/signup', { body: { email: 'a@example.org', password: 'long enough' } })
    assert.equal(noName.status, 400)
    assert.equal(noName.body.error.field, 'username')
    const short = await s.api('POST', '/api/auth/signup', { body: { email: 'a@example.org', username: 'Ok_Name', password: 'short' } })
    assert.equal(short.body.error.field, 'password')
    const testName = await s.api('POST', '/api/auth/signup', { body: { email: 'a@example.org', username: 'Test_Imposter', password: 'long enough' } })
    assert.equal(testName.status, 400, 'Test_ names are kept for test accounts')
  })

  test('sign-up returns a session, a friend code and a recovery code — and never a hash', async () => {
    const res = await s.api('POST', '/api/auth/signup', { body: { email: 'Maya@Example.org', username: 'Maya_R', password: 'correct horse', timezone: 'America/Chicago' } })
    assert.equal(res.status, 201)
    assert.ok(res.body.token.length >= 40)
    assert.equal(res.body.account.email, 'maya@example.org')
    assert.equal(res.body.account.timezone, 'America/Chicago')
    assert.ok(isFriendCode(res.body.account.friendCode), res.body.account.friendCode)
    assert.match(res.body.recoveryCode, /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    const text = JSON.stringify(res.body)
    assert.ok(!/scrypt|password_hash|recovery_hash/.test(text))
    const stored = s.db.get('SELECT password_hash, recovery_hash FROM users WHERE email = ?', 'maya@example.org')
    assert.match(stored.password_hash, /^scrypt\$/)
    assert.ok(!stored.password_hash.includes('correct horse'))
    const session = s.db.get('SELECT token_hash FROM sessions LIMIT 1')
    assert.notEqual(session.token_hash, res.body.token, 'only a hash of the token is stored')
  })

  test('emails and usernames are unique, whatever their case', async () => {
    const dupEmail = await s.api('POST', '/api/auth/signup', { body: { email: 'MAYA@example.org', username: 'Other_One', password: 'long enough' } })
    assert.equal(dupEmail.status, 409)
    assert.equal(dupEmail.body.error.field, 'email')
    const dupName = await s.api('POST', '/api/auth/signup', { body: { email: 'other@example.org', username: 'maya_r', password: 'long enough' } })
    assert.equal(dupName.status, 409)
    assert.equal(dupName.body.error.field, 'username')
  })

  test('every account has a different friend code', async () => {
    for (let i = 0; i < 6; i++) await s.learner(`Coder_${i}`)
    const codes = s.db.all('SELECT friend_code FROM users').map((r) => r.friend_code)
    assert.equal(new Set(codes).size, codes.length)
    assert.ok(codes.every(isFriendCode))
  })

  test('sign-in: email or username; one message for a wrong email or password; a lock after five', async () => {
    s.app.limiter.reset()
    const byName = await s.api('POST', '/api/auth/signin', { body: { identifier: 'MAYA_R', password: 'correct horse' } })
    assert.equal(byName.status, 200)
    const noSuch = await s.api('POST', '/api/auth/signin', { body: { identifier: 'ghost@example.org', password: 'whatever1' } })
    const wrong = await s.api('POST', '/api/auth/signin', { body: { identifier: 'maya@example.org', password: 'wrong pass' } })
    assert.equal(noSuch.status, 401)
    assert.equal(wrong.status, 401)
    assert.equal(noSuch.body.error.message, wrong.body.error.message)
    for (let i = 0; i < 3; i++) await s.api('POST', '/api/auth/signin', { body: { identifier: 'maya@example.org', password: 'wrong pass' } })
    const locked = await s.api('POST', '/api/auth/signin', { body: { identifier: 'maya@example.org', password: 'wrong pass' } })
    assert.equal(locked.status, 429)
    const evenRight = await s.api('POST', '/api/auth/signin', { body: { identifier: 'maya@example.org', password: 'correct horse' } })
    assert.equal(evenRight.status, 429, 'locked accounts refuse the right password too')
    s.clock.t += 31000
    s.app.limiter.reset()
    const after = await s.api('POST', '/api/auth/signin', { body: { identifier: 'maya@example.org', password: 'correct horse' } })
    assert.equal(after.status, 200)
  })

  test('sign-in is rate-limited per address', async () => {
    s.app.limiter.reset()
    let last
    for (let i = 0; i < 16; i++) last = await s.api('POST', '/api/auth/signin', { body: { identifier: `x${i}@example.org`, password: 'whatever1' } })
    assert.equal(last.status, 429)
    assert.ok(Number(last.headers.get('retry-after')) > 0)
    s.app.limiter.reset()
  })

  test('a session ends on sign-out and after thirty idle days', async () => {
    const a = await s.learner('Session_A')
    assert.equal((await s.api('GET', '/api/me', { token: a.token })).status, 200)
    await s.api('POST', '/api/auth/signout', { token: a.token })
    assert.equal((await s.api('GET', '/api/me', { token: a.token })).status, 401)
    const b = await s.learner('Session_B')
    s.clock.t += 31 * DAY
    assert.equal((await s.api('GET', '/api/me', { token: b.token })).status, 401)
    assert.equal((await s.api('GET', '/api/me')).status, 401, 'no token, no account')
  })

  test('forgot password: the recovery code resets it, is replaced, and ends other sessions', async () => {
    s.app.limiter.reset()
    const made = await s.api('POST', '/api/auth/signup', { body: { email: 'reset@example.org', username: 'Reset_Me', password: 'first password' } })
    const oldToken = made.body.token
    const wrong = await s.api('POST', '/api/auth/reset', { body: { email: 'reset@example.org', code: 'AAAA-AAAA-AAAA-AAAA', password: 'second password' } })
    assert.equal(wrong.status, 400)
    const ok = await s.api('POST', '/api/auth/reset', { body: { email: 'reset@example.org', code: made.body.recoveryCode.toLowerCase(), password: 'second password' } })
    assert.equal(ok.status, 200)
    assert.notEqual(ok.body.recoveryCode, made.body.recoveryCode)
    assert.equal((await s.api('GET', '/api/me', { token: oldToken })).status, 401)
    const again = await s.api('POST', '/api/auth/reset', { body: { email: 'reset@example.org', code: made.body.recoveryCode, password: 'third password' } })
    assert.equal(again.status, 400, 'a recovery code works once')
    const signin = await s.api('POST', '/api/auth/signin', { body: { identifier: 'reset@example.org', password: 'second password' } })
    assert.equal(signin.status, 200)
  })

  test('settings change, with checks; the time zone at most once a week', async () => {
    const a = await s.learner('Settings_A')
    const res = await s.api('PATCH', '/api/me', { token: a.token, body: { avatar: 'moss', settings: { profileVisibility: 'everyone', findByEmail: true } } })
    assert.equal(res.status, 200)
    assert.equal(res.body.account.avatar, 'moss')
    assert.equal(res.body.account.settings.profileVisibility, 'everyone')
    assert.equal(res.body.account.settings.findByEmail, true)
    const badAvatar = await s.api('PATCH', '/api/me', { token: a.token, body: { avatar: 'neon-cyan' } })
    assert.equal(badAvatar.status, 400)
    const tz = await s.api('PATCH', '/api/me', { token: a.token, body: { timezone: 'Asia/Tokyo' } })
    assert.equal(tz.status, 200)
    const tooSoon = await s.api('PATCH', '/api/me', { token: a.token, body: { timezone: 'Europe/London' } })
    assert.equal(tooSoon.status, 429)
    const badTz = await s.api('PATCH', '/api/me', { token: a.token, body: { timezone: 'Mars/Base' } })
    assert.equal(badTz.status, 400)
  })

  test('deleting an account needs its password, and removes everything it owned', async () => {
    const a = await s.learner('Delete_Me')
    const b = await s.learner('Delete_Friend')
    await s.api('POST', '/api/friends/requests', { token: a.token, body: { userId: b.id } })
    const wrong = await s.api('DELETE', '/api/me', { token: a.token, body: { password: 'nope nope' } })
    assert.equal(wrong.status, 400)
    const ok = await s.api('DELETE', '/api/me', { token: a.token, body: { password: 'correct horse battery' } })
    assert.equal(ok.status, 200)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM users WHERE id = ?', a.id).n, 0)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM friend_requests WHERE from_user = ?', a.id).n, 0)
    assert.equal(s.db.get('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?', a.id).n, 0)
  })

  test('the reviewer account is seeded, signs in with the published password, and cannot be removed', async () => {
    s.app.limiter.reset()
    const res = await s.api('POST', '/api/auth/signin', { body: { identifier: 'judge@lunx.app', password: 'tsa2027' } })
    assert.equal(res.status, 200)
    assert.equal(res.body.account.role, 'judge')
    assert.equal(res.body.account.username, 'TSA_Judge')
    const del = await s.api('DELETE', '/api/me', { token: res.body.token, body: { password: 'tsa2027' } })
    assert.equal(del.status, 403)
  })

  test('CORS answers only the site’s own origins, and every response carries the security headers', async () => {
    const ok = await s.api('GET', '/api/health', { headers: { Origin: 'http://localhost:5176' } })
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5176')
    const evil = await s.api('GET', '/api/health', { headers: { Origin: 'https://evil.example' } })
    assert.equal(evil.headers.get('access-control-allow-origin'), null)
    assert.equal(ok.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(ok.headers.get('cache-control'), 'no-store')
    const pre = await fetch(`${s.base}/api/me`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5176', 'Access-Control-Request-Method': 'GET' } })
    assert.equal(pre.status, 204)
  })

  test('bodies are size-limited and must be JSON objects', async () => {
    const a = await s.learner('Body_A')
    const big = await s.api('PATCH', '/api/me', { token: a.token, body: { username: 'x'.repeat(70000) } })
    assert.equal(big.status, 413)
    const res = await fetch(`${s.base}/api/me`, { method: 'PATCH', headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' }, body: '[1,2]' })
    assert.equal(res.status, 400)
  })
})
