/* ═══════════════════════════════════════════════════════════════════════════
   app.js — THE LUNX SERVER'S API
   ---------------------------------------------------------------------------
   createApp({ db, config, now }) wires the modules to routes. The clock is
   injected, so the test suite can move a week on in one line; in production
   it is Date.now — the SERVER's clock, which is the only clock any league
   boundary, reward or challenge deadline is measured by.

   Every route but health, sign-up, sign-in and the two resets needs a
   bearer token. /api/stream holds a response open (live.js); /api/mod/*
   answers moderators only (moderation.js).
   Every write is rate-limited per account, sign-in per address and per
   identifier, and the email lookup hardest of all.
   ═══════════════════════════════════════════════════════════════════════════ */

import { send, corsHeaders, createRouter, createLimiter, readJson, HttpError, fail } from './http.js'
import accounts, { ownAccount, card } from './accounts.js'
import { emailProblem } from '../src/utils/accountRules.js'
import { createLeagues } from './leagues.js'
import { createActivity } from './activity.js'
import { createFriends } from './friends.js'
import { createChallenges } from './challenges.js'
import { createReview } from './review.js'
import { createModeration } from './moderation.js'
import { createHub } from './live.js'
import { createMailer } from './mail.js'
import { listNotifications, unreadCount, markRead, listAwards, claimAward } from './notify.js'
import { TOURNAMENT } from '../src/config/leagueConfig.js'

const MINUTE = 60000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** [limit, window] per bucket. */
const LIMITS = {
  global:   [900, MINUTE],
  signin:   [15, 10 * MINUTE],
  signinId: [10, 10 * MINUTE],
  signup:   [8, HOUR],
  reset:    [8, HOUR],
  forgotId: [3, HOUR],
  stream:   [30, MINUTE],
  moderate: [120, MINUTE],
  search:   [60, 10 * MINUTE],
  email:    [10, HOUR],
  request:  [40, DAY],
  report:   [10, DAY],
  activity: [180, MINUTE],
  progress: [90, MINUTE],
  write:    [150, MINUTE],
  review:   [60, MINUTE],
}

export function createApp({ db, config, now = () => Date.now(), schedule = TOURNAMENT.SCHEDULE, mailer = createMailer(config.mail), devClock = null }) {
  const mixing = config.env !== 'production'
  const limiter = createLimiter(now)
  const hub = createHub()
  /* Every notification (notify.js) nudges the learner's open pages. */
  db.onPoke = (userId, kind) => hub.poke(userId, kind)
  const moderation = createModeration({ db, hub })
  const leagues = createLeagues({ db, schedule, mixing })
  const friends = createFriends({ db, leagues, mixing })
  const challenges = createChallenges({ db, friends })
  const activity = createActivity({ db, leagues, onRecorded: (_, t) => challenges.finalizeDue(t) })
  const review = createReview({ db, config, leagues, activity, friends, challenges })
  const router = createRouter()

  const limit = (bucket, key) => limiter.hit(bucket, key, ...LIMITS[bucket])
  const route = (method, pattern, handler, opts = {}) => router.add(method, pattern, handler, opts)
  const reviewerOnly = (user) => { if (user.role !== 'judge') fail(403, 'not_reviewer', 'Only the reviewer account has these controls.') }
  const devOnly = () => { if (config.env === 'production') fail(404, 'not_found', 'Not found.') }
  const moderatorOnly = (user) => {
    if (!user.is_moderator) fail(403, 'not_moderator', 'Only moderators can do that.')
    limit('moderate', user.id)
  }

  /* ── Health ── */
  /* `mail` tells the sign-in page whether "Forgot password?" can email a link. */
  route('GET', '/api/health', () => ({ ok: true, env: config.env, time: now(), version: 2, mail: mailer.enabled }), { public: true })

  /* ── Accounts ── */
  route('POST', '/api/auth/signup', async ({ body, ip, t }) => {
    limit('signup', ip)
    const { user, recoveryCode } = await accounts.signup(db, body, t)
    return { status: 201, body: { token: accounts.createSession(db, user.id, t), account: ownAccount(user), recoveryCode } }
  }, { public: true })

  route('POST', '/api/auth/signin', async ({ body, ip, t }) => {
    limit('signin', ip)
    limit('signinId', String(body.identifier ?? '').trim().toLowerCase().slice(0, 254) || '-')
    const user = await accounts.signin(db, body, t)
    return { token: accounts.createSession(db, user.id, t), account: ownAccount(user) }
  }, { public: true })

  route('POST', '/api/auth/reset', async ({ body, ip, t }) => {
    limit('reset', ip)
    const { user, recoveryCode } = await accounts.resetPassword(db, body, t)
    return { token: accounts.createSession(db, user.id, t), account: ownAccount(user), recoveryCode }
  }, { public: true })

  /* Ask for a reset link. The answer is the same whether or not the address
     has an account, and the email goes out after the answer, so neither the
     words nor the timing say which. */
  route('POST', '/api/auth/forgot', ({ body, ip, t }) => {
    if (!mailer.enabled) fail(404, 'no_mail', 'This server doesn’t send email. Use your recovery code instead.')
    limit('reset', ip)
    const email = String(body.email ?? '').trim().toLowerCase()
    const problem = emailProblem(email)
    if (problem) fail(400, 'invalid', problem, { field: 'email' })
    limit('forgotId', email)
    const made = accounts.createResetToken(db, email, t)
    if (made) {
      const link = `${config.siteUrl}signin/#reset=${made.token}`
      setImmediate(() => {
        mailer.send({
          to: made.user.email,
          subject: 'Reset your LunX password',
          text: [
            `Hi ${made.user.username},`,
            '',
            'Someone — hopefully you — asked to reset the password for your LunX account.',
            `Open this link within ${made.minutes} minutes to choose a new one:`,
            '',
            link,
            '',
            'The link works once. If you didn’t ask for it, ignore this email: your password stays the same.',
            '',
            '— LunX',
          ].join('\n'),
        }).catch((error) => console.error('[mail] a reset link could not be sent:', error?.message ?? error))
      })
    }
    return { ok: true }
  }, { public: true })

  route('POST', '/api/auth/reset-link', async ({ body, ip, t }) => {
    limit('reset', ip)
    const user = await accounts.resetWithToken(db, body, t)
    hub.close(user.id)
    return { token: accounts.createSession(db, user.id, t), account: ownAccount(user) }
  }, { public: true })

  route('POST', '/api/auth/signout', ({ token }) => {
    accounts.deleteSession(db, token)
    return { ok: true }
  })

  route('GET', '/api/me', ({ user }) => ({ account: ownAccount(user) }))

  route('PATCH', '/api/me', ({ user, body, t }) => {
    limit('write', user.id)
    accounts.updateAccount(db, user, body, t)
    return { account: ownAccount(db.get('SELECT * FROM users WHERE id = ?', user.id)) }
  })

  route('POST', '/api/me/password', async ({ user, body, token }) => {
    limit('write', user.id)
    await accounts.changePassword(db, user, body, token)
    return { ok: true }
  })

  route('DELETE', '/api/me', async ({ user, body }) => {
    limit('write', user.id)
    await accounts.deleteAccount(db, user, body)
    hub.close(user.id)
    return { ok: true }
  })

  /* ── Progress (the learner's own record; nothing in it is trusted for a league) ── */
  route('GET', '/api/progress', ({ user }) => {
    const row = db.get('SELECT rev, state, updated_at FROM progress WHERE user_id = ?', user.id)
    return row ? { rev: row.rev, state: JSON.parse(row.state), updatedAt: row.updated_at } : { rev: 0, state: null, updatedAt: 0 }
  })

  route('PUT', '/api/progress', ({ user, body, t }) => {
    limit('progress', user.id)
    if (!body.state || typeof body.state !== 'object' || Array.isArray(body.state)) fail(400, 'invalid', 'Send the progress as an object.')
    const text = JSON.stringify(body.state)
    if (text.length > 900000) fail(413, 'too_large', 'That progress record is too large.')
    const base = Math.floor(Number(body.baseRev) || 0)
    return db.tx(() => {
      const row = db.get('SELECT rev, state, updated_at FROM progress WHERE user_id = ?', user.id)
      const current = row?.rev ?? 0
      /* Optimistic concurrency: a device writing over a newer save from
         another device is refused and handed the newer one to adopt. */
      if (base !== current) {
        return { status: 409, body: { error: { code: 'stale', message: 'Your progress was updated on another device.' }, rev: current, state: row ? JSON.parse(row.state) : null, updatedAt: row?.updated_at ?? 0 } }
      }
      const rev = current + 1
      db.run(
        `INSERT INTO progress (user_id, rev, state, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET rev = excluded.rev, state = excluded.state, updated_at = excluded.updated_at`,
        user.id, rev, text, t,
      )
      return { rev, updatedAt: t }
    })
  }, { bodyLimit: 1024 * 1024 })

  /* ── Activity: what the learner did; the server decides what it is worth ── */
  route('POST', '/api/activity', ({ user, body, t }) => {
    limit('activity', user.id)
    if (!Array.isArray(body.events)) fail(400, 'invalid', 'Send a list of events.')
    return activity.processBatch(user, body.events, t)
  }, { bodyLimit: 256 * 1024 })

  /* ── Leagues ── */
  route('GET', '/api/leagues', async ({ user, t }) => {
    if (user.role === 'judge') await review.open(user, t)
    return leagues.view(user.id, t)
  })

  route('GET', '/api/leagues/history', ({ user, t }) => {
    leagues.finalizeDue(t)
    return { results: leagues.history(user.id, 12) }
  })

  /* ── Awards ── */
  route('GET', '/api/awards', ({ user, t }) => {
    leagues.finalizeDue(t)
    challenges.finalizeDue(t)
    return { awards: listAwards(db, user.id) }
  })

  route('POST', '/api/awards/:id/claim', ({ user, params, t }) => {
    limit('write', user.id)
    const award = claimAward(db, user.id, params.id, t)
    if (!award) fail(404, 'not_found', 'That reward isn’t yours, or no longer exists.')
    return { award }
  })

  /* ── Friends ── */
  route('GET', '/api/friends', ({ user, t }) => ({ friends: friends.listFriends(user, t), code: user.friend_code }))
  route('GET', '/api/friends/requests', ({ user }) => friends.listRequests(user))

  route('POST', '/api/friends/requests', ({ user, body, t }) => {
    limit('request', user.id)
    return friends.sendRequest(user, body.userId, body.via, t)
  })

  for (const action of ['accept', 'decline', 'cancel']) {
    route('POST', `/api/friends/requests/:id/${action}`, ({ user, params, t }) => {
      limit('write', user.id)
      return friends.respond(user, params.id, action, t)
    })
  }

  route('DELETE', '/api/friends/:userId', ({ user, params }) => {
    limit('write', user.id)
    return friends.removeFriend(user, params.userId)
  })

  route('GET', '/api/blocks', ({ user }) => ({ blocked: friends.listBlocks(user) }))
  route('POST', '/api/blocks', ({ user, body, t }) => {
    limit('write', user.id)
    return friends.block(user, body.userId, t)
  })
  route('DELETE', '/api/blocks/:userId', ({ user, params }) => {
    limit('write', user.id)
    return friends.unblock(user, params.userId)
  })

  route('POST', '/api/reports', ({ user, body, t }) => {
    limit('report', user.id)
    return friends.report(user, body.userId, body.reason, body.note, t)
  })

  route('GET', '/api/users/search', ({ user, query }) => {
    limit('search', user.id)
    return { results: friends.byUsername(user, query.get('username')) }
  })

  route('GET', '/api/users/code/:code', ({ user, params }) => {
    limit('search', user.id)
    return { results: friends.byCode(user, params.code) }
  })

  /* POST, so the address never sits in a URL, a log line or a history. */
  route('POST', '/api/users/find-by-email', ({ user, body }) => {
    limit('email', user.id)
    return { results: friends.byEmail(user, body.email) }
  })

  route('GET', '/api/users/:id', ({ user, params, t }) => ({ profile: friends.profile(user, params.id, t) }))

  /* ── Challenges ── */
  route('GET', '/api/challenges', ({ user, t }) => ({ challenges: challenges.list(user, t) }))
  route('POST', '/api/challenges', ({ user, body, t }) => {
    limit('write', user.id)
    return { challenge: challenges.create(user, body, t) }
  })
  for (const action of ['accept', 'decline', 'leave', 'cancel']) {
    route('POST', `/api/challenges/:id/${action}`, ({ user, params, t }) => {
      limit('write', user.id)
      return { challenge: challenges.respond(user, params.id, action, t) }
    })
  }

  /* ── Live updates (live.js): a nudge whenever something of this learner's changes ── */
  route('GET', '/api/stream', ({ req, res, user, token, cors }) => {
    limit('stream', user.id)
    const ok = hub.attach(user.id, req, res, cors, () => Boolean(accounts.userFromToken(db, token, now())))
    if (!ok) fail(503, 'busy', 'Live updates are busy. The page will keep checking on its own.')
  }, { stream: true })

  /* ── Notifications and the nav's badges ── */
  route('GET', '/api/notifications', ({ user }) => ({ notifications: listNotifications(db, user.id), unread: unreadCount(db, user.id) }))
  route('POST', '/api/notifications/read', ({ user, body, t }) => {
    markRead(db, user.id, body.ids, t)
    return { unread: unreadCount(db, user.id) }
  })

  route('GET', '/api/summary', ({ user, t }) => {
    leagues.finalizeDue(t)
    challenges.finalizeDue(t)
    const m = leagues.activeMembership(user.id, t)
    const board = m ? leagues.boardOf(m.cohort_id) : []
    const me = board.find((x) => x.userId === user.id)
    return {
      unread: unreadCount(db, user.id),
      requests: Number(db.get("SELECT COUNT(*) AS n FROM friend_requests WHERE to_user = ? AND status = 'pending'", user.id).n),
      invites: Number(db.get("SELECT COUNT(*) AS n FROM challenge_participants p JOIN challenges c ON c.id = p.challenge_id WHERE p.user_id = ? AND p.status = 'invited' AND c.status = 'active'", user.id).n),
      unclaimed: db.all('SELECT id, kind, gems, title, tier, rank, ref FROM awards WHERE user_id = ? AND claimed_at IS NULL AND gems > 0 ORDER BY created_at', user.id),
      league: { joined: Boolean(m), tier: m?.c_tier ?? db.get('SELECT tier FROM users WHERE id = ?', user.id).tier, rank: me?.rank ?? null, size: board.length, xp: me?.xp ?? 0, kind: m?.c_kind ?? null },
    }
  })

  /* ── Moderation (moderation.js): moderators only ── */
  route('GET', '/api/mod/reports', ({ user, query, t }) => { moderatorOnly(user); return moderation.listReports(query.get('status'), t) })
  route('GET', '/api/mod/log', ({ user }) => { moderatorOnly(user); return { log: moderation.listLog() } })
  route('POST', '/api/mod/reports/:id/dismiss', ({ user, params, body, t }) => { moderatorOnly(user); return moderation.dismiss(user, params.id, body.note, t) })
  route('POST', '/api/mod/users/:id/reset-name', ({ user, params, body, t }) => { moderatorOnly(user); return moderation.resetName(user, params.id, body, t) })
  route('POST', '/api/mod/users/:id/suspend', ({ user, params, body, t }) => { moderatorOnly(user); return moderation.suspend(user, params.id, body, t) })
  route('POST', '/api/mod/users/:id/lift', ({ user, params, body, t }) => { moderatorOnly(user); return moderation.lift(user, params.id, body, t) })
  route('POST', '/api/mod/users/:id/delete', ({ user, params, body, t }) => { moderatorOnly(user); return moderation.remove(user, params.id, body, t) })

  /* ── The reviewer's sandbox (review.js) ── */
  route('POST', '/api/review/sandbox', async ({ user, t }) => { reviewerOnly(user); limit('review', user.id); await review.open(user, t); return leagues.view(user.id, t) })
  route('POST', '/api/review/study', async ({ user, t }) => { reviewerOnly(user); limit('review', user.id); return review.study(user, t) })
  route('POST', '/api/review/end-week', ({ user, t }) => { reviewerOnly(user); limit('review', user.id); return review.endWeek(user, t) })
  route('POST', '/api/review/friend-request', async ({ user, t }) => { reviewerOnly(user); limit('review', user.id); return review.friendRequest(user, t) })
  route('POST', '/api/review/challenge', ({ user, t }) => { reviewerOnly(user); limit('review', user.id); return review.challenge(user, t) })
  route('POST', '/api/review/reset', ({ user }) => { reviewerOnly(user); limit('review', user.id); return review.reset(user) })

  /* ── Development only (LUNX_DEV_CLOCK): move the server's clock forward ── */
  route('POST', '/api/dev/clock', ({ body }) => {
    devOnly()
    if (!devClock) fail(404, 'not_found', 'Not found.')
    const days = Number(body.days)
    if (!(days > 0 && days <= 14)) fail(400, 'invalid', 'Move the clock 1 to 14 days at a time (sign-ins last 30 days).', { field: 'days' })
    const time = devClock.advance(days * DAY)
    runJobs(time)
    return { time }
  })

  /* ── Development only: end your own board's week now ── */
  route('POST', '/api/dev/end-week', ({ user, t }) => {
    devOnly()
    const m = leagues.activeMembership(user.id, t)
    if (!m) fail(409, 'no_board', 'You are not on a board this week yet — earn some league XP first.')
    db.run('UPDATE cohorts SET end_at = ? WHERE id = ?', t, m.cohort_id)
    db.tx(() => leagues.finalizeCohort(m.cohort_id, t))
    return leagues.view(user.id, t)
  })

  /* ── The request loop ── */

  async function handle(req, res) {
    const origin = req.headers.origin
    const cors = corsHeaders(origin, config.origins)
    const t = now()
    try {
      if (req.method === 'OPTIONS') { send(res, 204, null, cors); return }
      const url = new URL(req.url, 'http://lunx.local')
      const ip = (config.trustProxy && String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown'
      limit('global', ip)
      const found = router.match(req.method, url.pathname)
      if (!found) fail(404, 'not_found', 'Not found.')
      if (found.notAllowed) fail(405, 'method_not_allowed', 'Method not allowed.')
      const { route: r, params } = found
      const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readJson(req, r.opts.bodyLimit ?? 64 * 1024) : {}
      const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
      let user = null
      if (!r.opts.public) {
        user = accounts.userFromToken(db, token, t)
        if (!user) fail(401, 'signed_out', 'Your session has ended. Sign in again.')
      }
      if (r.opts.stream) {
        /* The handler answers (and holds) the response itself. */
        await r.handler({ req, res, cors, params, query: url.searchParams, user, token, ip, t })
        return
      }
      const out = await r.handler({ req, body, params, query: url.searchParams, user, token, ip, t })
      if (out && typeof out === 'object' && 'status' in out && 'body' in out && Object.keys(out).length === 2) send(res, out.status, out.body, cors)
      else send(res, 200, out ?? {}, cors)
    } catch (error) {
      if (error instanceof HttpError) {
        const headers = error.extra?.retryAfter ? { ...cors, 'Retry-After': String(error.extra.retryAfter) } : cors
        send(res, error.status, { error: { code: error.code, message: error.message, ...(error.extra?.field ? { field: error.extra.field } : {}) } }, headers)
        return
      }
      console.error('[lunx]', error)
      send(res, 500, { error: { code: 'server_error', message: 'Something went wrong on the server. Try again in a moment.' } }, cors)
    }
  }

  /** Housekeeping: finish weeks and challenges that have ended, and forget
   *  what no longer needs keeping. */
  function runJobs(t = now()) {
    const weeks = leagues.finalizeDue(t)
    const done = challenges.finalizeDue(t)
    db.run('DELETE FROM sessions WHERE expires_at <= ?', t)
    db.run('DELETE FROM events WHERE created_at < ?', t - 90 * DAY)
    db.run('DELETE FROM password_resets WHERE expires_at <= ?', t - DAY)
    limiter.sweep()
    return { weeks, challenges: done }
  }

  return { handle, runJobs, leagues, friends, challenges, activity, review, moderation, hub, mailer, limiter, db, card }
}

export default { createApp }
