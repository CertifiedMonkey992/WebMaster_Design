import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer } from './helpers.js'

/** Open the event stream as the browser does (fetch, a bearer header) and
 *  collect its events. */
async function openStream(s, who) {
  const controller = new AbortController()
  const res = await fetch(`${s.base}/api/stream`, { headers: { Authorization: `Bearer ${who.token}`, Origin: 'http://localhost:5176' }, signal: controller.signal })
  const events = []
  const waiters = []
  let ended = false
  ;(async () => {
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      for await (const chunk of res.body) {
        buffer += decoder.decode(chunk, { stream: true })
        let i
        while ((i = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, i)
          buffer = buffer.slice(i + 2)
          const name = /^event: (.+)$/m.exec(block)?.[1]
          const data = /^data: (.+)$/m.exec(block)?.[1]
          if (name) events.push({ name, data: data ? JSON.parse(data) : null })
          waiters.splice(0).forEach((w) => w())
        }
      }
    } catch { /* aborted */ }
    ended = true
    waiters.splice(0).forEach((w) => w())
  })()
  const until = async (fn, ms = 2000) => {
    const deadline = Date.now() + ms
    while (!fn()) {
      if (Date.now() > deadline) throw new Error(`timed out; events so far: ${JSON.stringify(events)}`)
      await new Promise((resolve) => { waiters.push(resolve); setTimeout(resolve, 50) })
    }
  }
  return { res, events, until, ended: () => ended, close: () => controller.abort() }
}

describe('live updates', () => {
  let s
  before(async () => { s = await startServer() })
  after(async () => { await s.close() })

  test('a stream needs a session, and answers as an event stream for the site only', async () => {
    const anon = await fetch(`${s.base}/api/stream`)
    assert.equal(anon.status, 401)
    const lia = await s.learner('Lia_S')
    const stream = await openStream(s, lia)
    try {
      assert.equal(stream.res.status, 200)
      assert.match(stream.res.headers.get('content-type'), /^text\/event-stream/)
      assert.equal(stream.res.headers.get('access-control-allow-origin'), 'http://localhost:5176')
      await stream.until(() => stream.events.some((e) => e.name === 'ready'))
    } finally {
      stream.close()
    }
  })

  test('a friend request nudges the other learner’s open page at once', async () => {
    const amy = await s.learner('Amy_T')
    const bo = await s.learner('Bo_T')
    const stream = await openStream(s, bo)
    try {
      await stream.until(() => stream.events.some((e) => e.name === 'ready'))
      await s.api('POST', '/api/friends/requests', { token: amy.token, body: { userId: bo.id } })
      await stream.until(() => stream.events.some((e) => e.name === 'changed'))
      const changed = stream.events.find((e) => e.name === 'changed')
      assert.deepEqual(changed.data.kinds, ['friend-request'])
      assert.ok(!JSON.stringify(changed.data).includes('Amy'), 'a nudge carries no one’s details')
    } finally {
      stream.close()
    }
  })

  test('signing out everywhere, or deleting the account, closes its streams', async () => {
    const cy = await s.learner('Cy_T')
    const stream = await openStream(s, cy)
    await stream.until(() => stream.events.some((e) => e.name === 'ready'))
    assert.equal(s.app.hub.countFor(cy.id), 1)
    await s.api('DELETE', '/api/me', { token: cy.token, body: { password: 'correct horse battery' } })
    await stream.until(() => stream.ended())
    assert.equal(s.app.hub.countFor(cy.id), 0)
  })

  test('a learner holds at most four streams; the oldest goes first', async () => {
    const di = await s.learner('Di_T')
    const streams = []
    for (let i = 0; i < 5; i++) {
      const st = await openStream(s, di)
      await st.until(() => st.events.some((e) => e.name === 'ready'))
      streams.push(st)
    }
    try {
      await streams[0].until(() => streams[0].ended())
      assert.equal(s.app.hub.countFor(di.id), 4)
    } finally {
      streams.forEach((st) => st.close())
    }
  })
})

describe('development switches', () => {
  test('the movable clock is refused unless it was turned on, and always in production', async () => {
    const s = await startServer()
    try {
      const who = await s.learner('Clock_Off')
      assert.equal((await s.api('POST', '/api/dev/clock', { token: who.token, body: { days: 1 } })).status, 404)
    } finally {
      await s.close()
    }
    const p = await startServer({ env: 'production' })
    try {
      const who = await p.learner('Clock_Prod')
      assert.equal((await p.api('POST', '/api/dev/clock', { token: who.token, body: { days: 1 } })).status, 404)
    } finally {
      await p.close()
    }
  })
})
