import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import net from 'node:net'
import { startServer, withServer } from './helpers.js'
import { smtpSend, formatMessage, createMailer } from '../mail.js'

/** A tiny SMTP server on this machine that records what it is told. */
async function fakeSmtp({ starttls = false, auth = true } = {}) {
  const sessions = []
  const server = net.createServer((socket) => {
    const lines = []
    sessions.push(lines)
    let data = false
    let buffer = ''
    socket.write('220 fake ESMTP\r\n')
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      let i
      while ((i = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, i)
        buffer = buffer.slice(i + 2)
        lines.push(line)
        if (data) {
          if (line === '.') { data = false; socket.write('250 queued\r\n') }
          continue
        }
        if (/^EHLO/.test(line)) socket.write(`250-fake\r\n${starttls ? '250-STARTTLS\r\n' : ''}${auth ? '250-AUTH PLAIN\r\n' : ''}250 OK\r\n`)
        else if (/^AUTH PLAIN/.test(line)) socket.write('235 ok\r\n')
        else if (/^(MAIL|RCPT)/.test(line)) socket.write('250 ok\r\n')
        else if (line === 'DATA') { data = true; socket.write('354 go on\r\n') }
        else if (line === 'QUIT') { socket.write('221 bye\r\n'); socket.end() }
        else socket.write('500 what\r\n')
      }
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { port: server.address().port, sessions, close: () => new Promise((resolve) => server.close(resolve)) }
}

describe('mail', () => {
  test('a message is plain UTF-8 text, and a header cannot be injected', () => {
    const raw = formatMessage({ from: 'LunX <no-reply@lunx.test>', to: 'a@example.org', subject: 'Réinitialiser', text: 'Hello\nworld' })
    assert.match(raw, /^Subject: =\?UTF-8\?B\?/m)
    assert.match(raw, /Content-Type: text\/plain; charset=utf-8/)
    assert.equal(Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8'), 'Hello\r\nworld')
    assert.throws(() => formatMessage({ from: 'x@y.z', to: 'a@example.org\r\nBcc: everyone@example.org', subject: 's', text: 't' }), /line break/)
  })

  test('the SMTP client signs in and delivers one message', async () => {
    const smtp = await fakeSmtp()
    try {
      const raw = formatMessage({ from: 'LunX <no-reply@lunx.test>', to: 'maya@example.org', subject: 'Hi', text: '.starts with a dot' })
      await smtpSend({ host: '127.0.0.1', port: smtp.port, user: 'me', pass: 'secret' }, { from: 'LunX <no-reply@lunx.test>', to: 'maya@example.org', raw })
      const said = smtp.sessions[0]
      assert.ok(said.includes(`AUTH PLAIN ${Buffer.from('\0me\0secret').toString('base64')}`))
      assert.ok(said.includes('MAIL FROM:<no-reply@lunx.test>'))
      assert.ok(said.includes('RCPT TO:<maya@example.org>'))
      assert.ok(said.includes('.'), 'the message ends with a lone dot')
      assert.equal(said.at(-1), 'QUIT')
    } finally {
      await smtp.close()
    }
  })

  test('a mail server elsewhere that offers no encryption is refused', async () => {
    const smtp = await fakeSmtp()
    /* As if it were elsewhere: plain text is not allowed. */
    const remote = { host: '127.0.0.1', port: smtp.port, allowPlain: false }
    try {
      await assert.rejects(smtpSend(remote, { from: 'a@b.c', to: 'd@e.f', raw: 'x' }), /no encryption/)
    } finally {
      await smtp.close()
    }
  })

  test('with no provider the mailer is off, and the server says so', async () => {
    assert.equal(createMailer({ mode: 'off' }).enabled, false)
    await withServer({}, async (s) => {
      const health = await s.api('GET', '/api/health')
      assert.equal(health.body.mail, false)
      const forgot = await s.api('POST', '/api/auth/forgot', { body: { email: 'a@example.org' } })
      assert.equal(forgot.status, 404)
      assert.equal(forgot.body.error.code, 'no_mail')
    })
  })
})

describe('reset links', () => {
  let s
  before(async () => { s = await startServer({ mail: true }) })
  after(async () => { await s.close() })
  const settle = () => new Promise((resolve) => setImmediate(resolve))

  test('asking answers the same for a known and an unknown address; only the known one gets mail', async () => {
    await s.learner('Rosa_K')
    assert.equal((await s.api('GET', '/api/health')).body.mail, true)
    const known = await s.api('POST', '/api/auth/forgot', { body: { email: 'ROSA_K@example.org' } })
    const unknown = await s.api('POST', '/api/auth/forgot', { body: { email: 'nobody@example.org' } })
    await settle()
    assert.equal(known.status, 200)
    assert.deepEqual(known.body, unknown.body)
    assert.equal(s.outbox.length, 1)
    assert.equal(s.outbox[0].to, 'rosa_k@example.org')
    assert.match(s.outbox[0].text, /http:\/\/localhost:5176\/WebMaster_Design\/signin\/#reset=[\w-]{40,}/)
  })

  test('a link sets a new password once, ends every session, and the old password stops working', async () => {
    s.app.limiter.reset()
    const rosa = await s.learner('Rosa_L')
    s.outbox.length = 0
    await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_l@example.org' } })
    await settle()
    const token = /#reset=([\w-]+)/.exec(s.outbox[0].text)[1]
    assert.ok(!s.db.get('SELECT 1 FROM password_resets WHERE token_hash = ?', token), 'only a hash of the token is stored')

    const short = await s.api('POST', '/api/auth/reset-link', { body: { token, password: 'short' } })
    assert.equal(short.body.error.field, 'password')
    const done = await s.api('POST', '/api/auth/reset-link', { body: { token, password: 'a brand new password' } })
    assert.equal(done.status, 200)
    assert.ok(done.body.token)
    assert.equal(done.body.account.username, 'Rosa_L')
    assert.equal((await s.api('GET', '/api/me', { token: rosa.token })).status, 401, 'the old session has ended')

    const again = await s.api('POST', '/api/auth/reset-link', { body: { token, password: 'yet another password' } })
    assert.equal(again.body.error.code, 'link_expired')
    const old = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Rosa_L', password: 'correct horse battery' } })
    assert.equal(old.status, 401)
    const fresh = await s.api('POST', '/api/auth/signin', { body: { identifier: 'Rosa_L', password: 'a brand new password' } })
    assert.equal(fresh.status, 200)
  })

  test('a link expires after 30 minutes, and a newer link replaces an older one', async () => {
    s.app.limiter.reset()
    await s.learner('Rosa_M')
    s.outbox.length = 0
    await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_m@example.org' } })
    await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_m@example.org' } })
    await settle()
    const [first, second] = s.outbox.map((m) => /#reset=([\w-]+)/.exec(m.text)[1])
    const replaced = await s.api('POST', '/api/auth/reset-link', { body: { token: first, password: 'a brand new password' } })
    assert.equal(replaced.body.error.code, 'link_expired')
    s.clock.t += 31 * 60000
    const late = await s.api('POST', '/api/auth/reset-link', { body: { token: second, password: 'a brand new password' } })
    assert.equal(late.body.error.code, 'link_expired')
  })

  test('the reviewer gets no link, and one address can ask only three times an hour', async () => {
    s.app.limiter.reset()
    s.outbox.length = 0
    await s.api('POST', '/api/auth/forgot', { body: { email: s.config.judge.email } })
    await settle()
    assert.equal(s.outbox.length, 0)
    await s.learner('Rosa_N')
    for (let i = 0; i < 2; i++) await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_n@example.org' } })
    const third = await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_n@example.org' } })
    const fourth = await s.api('POST', '/api/auth/forgot', { body: { email: 'rosa_n@example.org' } })
    assert.equal(third.status, 200)
    assert.equal(fourth.status, 429)
  })
})
