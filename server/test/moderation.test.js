import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, DAY } from './helpers.js'
import { setModerator } from '../moderation.js'

describe('moderation', () => {
  let s, mod, ana, ben, cal
  before(async () => {
    s = await startServer()
    mod = await s.learner('Mod_Mia')
    ana = await s.learner('Ana_Q')
    ben = await s.learner('Ben_Rude')
    cal = await s.learner('Cal_W')
    assert.deepEqual(setModerator(s.db, 'mod_mia', true), { username: 'Mod_Mia', moderator: true })
  })
  after(async () => { await s.close() })

  const report = (who, about, reason = 'inappropriate-name') => s.api('POST', '/api/reports', { token: who.token, body: { userId: about.id, reason, note: 'Not OK' } })

  test('only a moderator can read reports, and the account says who is one', async () => {
    await report(ana, ben)
    assert.equal((await s.api('GET', '/api/mod/reports', { token: ana.token })).status, 403)
    assert.equal((await s.api('GET', '/api/me', { token: ana.token })).body.account.moderator, false)
    assert.equal((await s.api('GET', '/api/me', { token: mod.token })).body.account.moderator, true)
    const list = await s.api('GET', '/api/mod/reports', { token: mod.token })
    assert.equal(list.status, 200)
    assert.equal(list.body.open, 1)
    const [r] = list.body.reports
    assert.equal(r.reported.username, 'Ben_Rude')
    assert.equal(r.reporter.username, 'Ana_Q')
    assert.equal(r.reported.reports, 1)
    assert.ok(!JSON.stringify(list.body).includes('@example.org'), 'no email address leaves the server')
  })

  test('the reviewer and test accounts can never be made moderators', () => {
    assert.equal(setModerator(s.db, s.config.judge.username, true).refused, true)
    assert.equal(setModerator(s.db, 'no_such_name', true), null)
  })

  test('dismissing closes one report and is logged', async () => {
    await report(cal, ana, 'spam')
    const open = (await s.api('GET', '/api/mod/reports', { token: mod.token })).body.reports
    const aboutAna = open.find((r) => r.reported.username === 'Ana_Q')
    const res = await s.api('POST', `/api/mod/reports/${aboutAna.id}/dismiss`, { token: mod.token, body: { note: 'Not spam' } })
    assert.equal(res.body.status, 'dismissed')
    const twice = await s.api('POST', `/api/mod/reports/${aboutAna.id}/dismiss`, { token: mod.token, body: {} })
    assert.equal(twice.status, 409)
    const log = (await s.api('GET', '/api/mod/log', { token: mod.token })).body.log
    assert.equal(log[0].action, 'dismiss')
    assert.equal(log[0].target, 'Ana_Q')
    assert.equal(log[0].moderator, 'Mod_Mia')
  })

  test('resetting a name gives a plain one, closes the reports about them, and tells them', async () => {
    await report(cal, ben)
    const res = await s.api('POST', `/api/mod/users/${ben.id}/reset-name`, { token: mod.token, body: {} })
    assert.match(res.body.username, /^Learner_[0-9A-Z]{8}$/)
    assert.equal(Number(s.db.get("SELECT COUNT(*) AS n FROM reports WHERE reported = ? AND status = 'open'", ben.id).n), 0)
    const notes = (await s.api('GET', '/api/notifications', { token: ben.token })).body.notifications
    assert.equal(notes[0].kind, 'moderation-rename')
    assert.equal(notes[0].payload.username, res.body.username)
    const closed = (await s.api('GET', '/api/mod/reports?status=closed', { token: mod.token })).body.reports
    assert.ok(closed.some((r) => r.reported.id === ben.id && r.resolution === 'name-reset'))
  })

  test('a suspension ends sessions, hides the account and refuses sign-in until it ends', async () => {
    await report(ana, cal, 'harassment')
    const res = await s.api('POST', `/api/mod/users/${cal.id}/suspend`, { token: mod.token, body: { days: 7 } })
    assert.equal(res.body.status, 'suspended')
    assert.equal((await s.api('GET', '/api/me', { token: cal.token })).status, 401)
    const signin = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Cal_W', password: 'correct horse battery' } })
    assert.equal(signin.status, 403)
    assert.match(signin.body.error.message, /suspended until/)
    const wrong = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Cal_W', password: 'not the password' } })
    assert.equal(wrong.status, 401, 'a wrong password does not learn about the suspension')
    const found = await s.api('GET', '/api/users/search?username=cal', { token: ana.token })
    assert.equal(found.body.results.length, 0)
    assert.equal((await s.api('POST', `/api/mod/users/${cal.id}/suspend`, { token: mod.token, body: { days: 2 } })).status, 400, 'only 1, 7 or 30 days')

    s.clock.t += 8 * DAY
    s.app.limiter.reset()
    const back = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Cal_W', password: 'correct horse battery' } })
    assert.equal(back.status, 200, 'a finished suspension lifts itself')
    cal.token = back.body.token
  })

  test('an indefinite suspension lasts until a moderator lifts it', async () => {
    await s.api('POST', `/api/mod/users/${cal.id}/suspend`, { token: mod.token, body: {} })
    s.clock.t += 400 * DAY
    s.app.limiter.reset()
    /* The moderator's own session has long expired too. */
    mod.token = (await s.api('POST', '/api/auth/signin', { body: { identifier: 'Mod_Mia', password: 'correct horse battery' } })).body.token
    const still = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Cal_W', password: 'correct horse battery' } })
    assert.match(still.body.error.message, /suspended by a moderator/)
    await s.api('POST', `/api/mod/users/${cal.id}/lift`, { token: mod.token, body: {} })
    const back = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Cal_W', password: 'correct horse battery' } })
    assert.equal(back.status, 200)
  })

  test('nobody moderates themself, another moderator or the reviewer', async () => {
    const judge = s.db.get("SELECT id FROM users WHERE role = 'judge'")
    assert.equal((await s.api('POST', `/api/mod/users/${mod.id}/suspend`, { token: mod.token, body: {} })).status, 403)
    assert.equal((await s.api('POST', `/api/mod/users/${judge.id}/delete`, { token: mod.token, body: {} })).status, 403)
    const other = await s.learner('Mod_Max')
    setModerator(s.db, 'Mod_Max', true)
    assert.equal((await s.api('POST', `/api/mod/users/${other.id}/reset-name`, { token: mod.token, body: {} })).status, 403)
  })

  test('deleting an account removes it and everything it owns; its reports still read', async () => {
    const dee = await s.learner('Dee_Gone')
    const eve = await s.learner('Eve_R')
    await report(eve, dee, 'spam')
    const res = await s.api('POST', `/api/mod/users/${dee.id}/delete`, { token: mod.token, body: { note: 'Spam account' } })
    assert.equal(res.body.status, 'deleted')
    assert.equal(s.db.get('SELECT 1 FROM users WHERE id = ?', dee.id), undefined)
    assert.equal(s.db.get('SELECT 1 FROM sessions WHERE user_id = ?', dee.id), undefined)
    const closed = (await s.api('GET', '/api/mod/reports?status=closed', { token: mod.token })).body.reports
    const gone = closed.find((r) => r.resolution === 'deleted')
    assert.equal(gone.reported.username, 'Dee_Gone')
    assert.equal(gone.reported.deleted, true)
    const log = (await s.api('GET', '/api/mod/log', { token: mod.token })).body.log
    assert.equal(log[0].action, 'delete')
    assert.equal(log[0].target, 'Dee_Gone')
  })
})
