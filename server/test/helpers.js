/* Shared set-up for the server suite: a real HTTP server on an ephemeral
   port, an in-memory database, and a clock the test moves by hand — so a
   week, a day or a deadline passes in one line, and every boundary is the
   server's own decision. */

import http from 'node:http'
import { openDatabase } from '../db.js'
import { createApp } from '../app.js'
import { loadConfig } from '../config.js'
import accounts, { ensureJudge } from '../accounts.js'
import { answerFor } from '../review.js'
import { QUESTIONS, GRADED } from '../content.js'

export const HOUR = 3600000
export const DAY = 24 * HOUR
/** Wednesday 14 October 2026, 12:00 UTC. */
export const WEDNESDAY = Date.UTC(2026, 9, 14, 12, 0, 0)

let seq = 0
export const uid = (p = 'ev') => `${p}${Date.now().toString(36)}${(seq++).toString(36).padStart(4, '0')}`

export async function startServer({ now = WEDNESDAY, env = 'development', schedule, judge = true, mail = false } = {}) {
  const clock = { t: now }
  const db = openDatabase(':memory:')
  const config = { ...loadConfig({}), env, origins: ['http://localhost:5176'], siteUrl: 'http://localhost:5176/WebMaster_Design/', judge: { ...loadConfig({}).judge, enabled: judge } }
  /* With `mail`, every email the server sends lands in `outbox` instead. */
  const outbox = []
  const mailer = mail ? { enabled: true, mode: 'test', send: async (m) => { outbox.push(m) } } : undefined
  const app = createApp({ db, config, now: () => clock.t, ...(schedule ? { schedule } : {}), ...(mailer ? { mailer } : {}) })
  if (judge) await ensureJudge(db, config, clock.t)
  const server = http.createServer((req, res) => { app.handle(req, res) })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`

  async function api(method, path, { token, body, headers = {} } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
  }

  /** A learner, created straight in the database (sign-up itself is tested over HTTP). */
  async function learner(username, { timezone = 'UTC', settings = {}, email } = {}) {
    const { user } = await accounts.signup(db, {
      email: email ?? `${username.toLowerCase()}@example.org`,
      username,
      password: 'correct horse battery',
      timezone,
    }, clock.t)
    if (Object.keys(settings).length) accounts.updateAccount(db, user, { settings }, clock.t)
    const token = accounts.createSession(db, user.id, clock.t)
    return { id: user.id, token, username, user: () => db.get('SELECT * FROM users WHERE id = ?', user.id) }
  }

  /** Answer a whole item's Check (right or wrong per question) and complete it, over the API. */
  async function finishItem(who, itemId, { right = true, complete = true } = {}) {
    const sessionId = uid('ls')
    const keys = GRADED.get(itemId) ?? []
    const events = keys.map((key, i) => ({
      id: uid(),
      type: 'answer',
      payload: { key, context: 'check', sessionId, answer: answerFor(QUESTIONS.get(key).step, typeof right === 'function' ? right(i) : right) },
    }))
    if (complete) events.push({ id: uid(), type: 'complete', payload: { lessonId: itemId, sessionId } })
    const res = await api('POST', '/api/activity', { token: who.token, body: { events } })
    return { ...res, sessionId, events }
  }

  /** A Practice session over the API: `answers` is a list of [key, right]. */
  async function practise(who, answers, { mode = 'quick', topic = null } = {}) {
    const sessionId = uid('ps')
    const events = answers.map(([key, right]) => ({
      id: uid(), type: 'answer', payload: { key, context: 'practice', sessionId, answer: answerFor(QUESTIONS.get(key).step, right) },
    }))
    events.push({ id: uid(), type: 'practice-complete', payload: { sessionId, mode, topic } })
    const res = await api('POST', '/api/activity', { token: who.token, body: { events } })
    return { ...res, sessionId }
  }

  const xpOf = (who) => Number(db.get('SELECT COALESCE(SUM(amount), 0) AS n FROM xp_ledger WHERE user_id = ?', who.id).n)

  async function close() {
    app.hub.closeAll()
    await new Promise((resolve) => server.close(resolve))
    db.close()
  }

  return { app, db, clock, config, api, learner, finishItem, practise, xpOf, close, base, outbox }
}

/** Run `fn` against a fresh server, and always close it — a failing test
 *  must not leave a listening socket holding the run open. */
export async function withServer(opts, fn) {
  const s = await startServer(opts)
  try {
    return await fn(s)
  } finally {
    await s.close()
  }
}

export { QUESTIONS, GRADED, answerFor }
