/* ═══════════════════════════════════════════════════════════════════════════
   friends.js — FRIENDS, REQUESTS, BLOCKS, REPORTS AND PROFILES
   ---------------------------------------------------------------------------
   Finding someone never befriends them: every lookup returns profile cards,
   and a friendship needs a request sent on purpose and accepted on purpose.

     by code      the other learner's friend code. Always works (unless one
                  has blocked the other) — nobody has to publish anything to
                  be found by a friend they gave their code to
     by username  a prefix search, over learners who allow it (on by default)
     by email     an EXACT address, over learners who allow it (OFF by
                  default). Signed-in only and tightly rate-limited, and its
                  answer is the same shape whether the address is unknown,
                  private or blocked — an empty list — so it cannot be used
                  to test whether an address has an account. No address is
                  ever returned.

   The lifecycle: send → accept / decline / cancel; remove; block (ends the
   friendship and every pending request, both ways, and hides each from the
   other's searches); report (stored for the people who run the server).
   Contradictions are impossible by construction: one pending request per
   pair (a partial UNIQUE index), one friendship per pair (a < b), and a
   request crossing one already waiting the other way simply accepts it.

   Test accounts are visible only in development and the reviewer's sandbox.
   ═══════════════════════════════════════════════════════════════════════════ */

import { normalizeCode, isFriendCode, formatCode, normEmail, emailProblem } from '../src/utils/accountRules.js'
import { dayKeyIn } from '../src/utils/leagueTime.js'
import { card, newId } from './accounts.js'
import { notify, poke } from './notify.js'
import { fail } from './http.js'
import { isLesson } from './content.js'

export const REPORT_REASONS = ['inappropriate-name', 'harassment', 'cheating', 'spam', 'other']
export const MAX_FRIENDS = 300
export const MAX_PENDING_OUT = 50

const pair = (a, b) => (a < b ? [a, b] : [b, a])

export function createFriends({ db, leagues, mixing = false }) {
  /* ── Relationships ── */

  const isBlocked = (a, b) => Boolean(db.get(
    'SELECT 1 FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)', a, b, b, a,
  ))
  const areFriends = (a, b) => {
    const [x, y] = pair(a, b)
    return Boolean(db.get('SELECT 1 FROM friendships WHERE user_a = ? AND user_b = ?', x, y))
  }
  const pendingBetween = (a, b) => db.get(
    "SELECT * FROM friend_requests WHERE status = 'pending' AND ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?))",
    a, b, b, a,
  ) ?? null

  /** May `viewer` see `other` at all? Blocks hide both ways. Outside
   *  development, the reviewer's account and its sandbox of test accounts
   *  are a closed room: nobody outside can find them, and they can find
   *  nobody outside — so a judge never lands in a real learner's requests. */
  function visible(viewer, other) {
    if (!other || other.id === viewer.id) return false
    /* Suspended: out of every search, profile and request until it is lifted. */
    if (other.suspended_until != null) return false
    if (isBlocked(viewer.id, other.id)) return false
    if (mixing) return true
    const room = (u) => (u.role === 'judge' ? u.id : u.sandbox_owner ?? null)
    if (room(viewer) || room(other)) return room(viewer) === room(other)
    return !other.is_seed
  }

  function relation(viewerId, otherId) {
    if (viewerId === otherId) return 'self'
    if (areFriends(viewerId, otherId)) return 'friend'
    const p = pendingBetween(viewerId, otherId)
    if (p) return p.from_user === viewerId ? 'requested' : 'incoming'
    return 'none'
  }

  /** A profile card for a search result: never an email. */
  const result = (viewer, u) => ({ ...card(u), relation: relation(viewer.id, u.id) })

  /* ── Finding people ── */

  function byCode(viewer, code) {
    if (!isFriendCode(code)) fail(400, 'invalid', 'Friend codes are 8 letters and numbers, like ABCD-2345.', { field: 'code' })
    const normalized = formatCode(normalizeCode(code))
    if (normalized === viewer.friend_code) fail(400, 'self', 'That’s your own code — share it with a friend instead.', { field: 'code' })
    const u = db.get('SELECT * FROM users WHERE friend_code = ?', normalized)
    return visible(viewer, u) ? [result(viewer, u)] : []
  }

  function byUsername(viewer, query) {
    const q = String(query ?? '').trim().toLowerCase()
    if (q.length < 2) fail(400, 'invalid', 'Type at least 2 characters of a username.', { field: 'username' })
    if (!/^[a-z0-9_]+$/.test(q)) return []
    const rows = db.all(
      `SELECT * FROM users WHERE username_key LIKE ? ESCAPE '\\' AND find_by_username = 1 AND id <> ? AND role <> 'judge'
        ORDER BY (username_key = ?) DESC, length(username_key), username_key LIMIT 25`,
      `${q.replace(/_/g, '\\_')}%`, viewer.id, q,
    )
    return rows.filter((u) => visible(viewer, u)).slice(0, 10).map((u) => result(viewer, u))
  }

  function byEmail(viewer, email) {
    const address = normEmail(email)
    if (emailProblem(address)) fail(400, 'invalid', emailProblem(address), { field: 'email' })
    if (address === viewer.email) fail(400, 'self', 'That’s your own email address.', { field: 'email' })
    const u = db.get('SELECT * FROM users WHERE email = ? AND find_by_email = 1', address)
    /* Unknown, private and blocked all answer the same: nothing. */
    return u && visible(viewer, u) ? [result(viewer, u)] : []
  }

  /* ── Requests ── */

  function accept(request, now) {
    const [a, b] = pair(request.from_user, request.to_user)
    db.run("UPDATE friend_requests SET status = 'accepted', responded_at = ? WHERE id = ?", now, request.id)
    db.run('INSERT OR IGNORE INTO friendships (user_a, user_b, created_at) VALUES (?, ?, ?)', a, b, now)
    const to = db.get('SELECT username FROM users WHERE id = ?', request.to_user)
    notify(db, request.from_user, 'friend-accepted', { userId: request.to_user, username: to?.username }, now)
  }

  function sendRequest(viewer, targetId, via, now) {
    const target = db.get('SELECT * FROM users WHERE id = ?', String(targetId ?? ''))
    if (!target || target.id === viewer.id || !visible(viewer, target)) fail(404, 'not_found', 'That learner can’t be found.')
    if (areFriends(viewer.id, target.id)) fail(409, 'already_friends', `You and ${target.username} are already friends.`)
    const count = Number(db.get('SELECT COUNT(*) AS n FROM friendships WHERE user_a = ? OR user_b = ?', viewer.id, viewer.id).n)
    if (count >= MAX_FRIENDS) fail(409, 'too_many', `You can have up to ${MAX_FRIENDS} friends.`)

    return db.tx(() => {
      const waiting = pendingBetween(viewer.id, target.id)
      if (waiting?.from_user === viewer.id) fail(409, 'already_requested', `Your request to ${target.username} is waiting for an answer.`)
      if (waiting) {
        /* They asked first — two requests the same way round are one friendship. */
        accept(waiting, now)
        return { status: 'accepted', request: { id: waiting.id } }
      }
      const out = Number(db.get("SELECT COUNT(*) AS n FROM friend_requests WHERE from_user = ? AND status = 'pending'", viewer.id).n)
      if (out >= MAX_PENDING_OUT) fail(409, 'too_many', 'You have too many requests waiting. Cancel some first.')
      const id = newId('fr')
      db.run(
        "INSERT INTO friend_requests (id, from_user, to_user, status, via, created_at) VALUES (?, ?, ?, 'pending', ?, ?)",
        id, viewer.id, target.id, ['code', 'username', 'email', 'profile', 'league'].includes(via) ? via : null, now,
      )
      notify(db, target.id, 'friend-request', { requestId: id, userId: viewer.id, username: viewer.username }, now)
      return { status: 'sent', request: { id } }
    })
  }

  function respond(viewer, requestId, action, now) {
    const request = db.get('SELECT * FROM friend_requests WHERE id = ?', String(requestId ?? ''))
    if (!request) fail(404, 'not_found', 'That request no longer exists.')
    if (action === 'cancel') {
      if (request.from_user !== viewer.id) fail(403, 'not_yours', 'Only the sender can cancel a request.')
    } else if (request.to_user !== viewer.id) {
      fail(403, 'not_yours', 'That request was not sent to you.')
    }
    if (request.status !== 'pending') fail(409, 'answered', 'That request has already been answered.')
    db.tx(() => {
      if (action === 'accept') {
        if (isBlocked(request.from_user, request.to_user)) fail(409, 'blocked', 'That request can’t be accepted.')
        accept(request, now)
      } else {
        db.run('UPDATE friend_requests SET status = ?, responded_at = ? WHERE id = ?', action === 'cancel' ? 'cancelled' : 'declined', now, request.id)
      }
    })
    /* The other side's badge counts this request; a cancelled one goes now. */
    if (action === 'cancel') poke(db, request.to_user, 'friend-request-cancelled')
    return { status: action === 'accept' ? 'accepted' : action === 'cancel' ? 'cancelled' : 'declined' }
  }

  function removeFriend(viewer, otherId) {
    const [a, b] = pair(viewer.id, String(otherId ?? ''))
    const r = db.run('DELETE FROM friendships WHERE user_a = ? AND user_b = ?', a, b)
    if (!r.changes) fail(404, 'not_found', 'You are not friends with that learner.')
    return { status: 'removed' }
  }

  function block(viewer, otherId, now) {
    const other = db.get('SELECT id FROM users WHERE id = ?', String(otherId ?? ''))
    if (!other || other.id === viewer.id) fail(404, 'not_found', 'That learner can’t be found.')
    db.tx(() => {
      db.run('INSERT OR IGNORE INTO blocks (blocker, blocked, created_at) VALUES (?, ?, ?)', viewer.id, other.id, now)
      const [a, b] = pair(viewer.id, other.id)
      db.run('DELETE FROM friendships WHERE user_a = ? AND user_b = ?', a, b)
      db.run(
        "UPDATE friend_requests SET status = 'cancelled', responded_at = ? WHERE status = 'pending' AND ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?))",
        now, viewer.id, other.id, other.id, viewer.id,
      )
      /* Pending challenge invitations between them are withdrawn too. */
      db.run(
        `UPDATE challenge_participants SET status = 'declined', responded_at = ?
          WHERE status = 'invited' AND (
            (user_id = ? AND challenge_id IN (SELECT id FROM challenges WHERE creator = ? AND status = 'active')) OR
            (user_id = ? AND challenge_id IN (SELECT id FROM challenges WHERE creator = ? AND status = 'active')))`,
        now, viewer.id, other.id, other.id, viewer.id,
      )
    })
    return { status: 'blocked' }
  }

  function unblock(viewer, otherId) {
    db.run('DELETE FROM blocks WHERE blocker = ? AND blocked = ?', viewer.id, String(otherId ?? ''))
    return { status: 'unblocked' }
  }

  function listBlocks(viewer) {
    return db.all('SELECT u.* FROM blocks b JOIN users u ON u.id = b.blocked WHERE b.blocker = ? ORDER BY b.created_at DESC', viewer.id)
      .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar }))
  }

  function report(viewer, otherId, reason, note, now) {
    const other = db.get('SELECT id, username FROM users WHERE id = ?', String(otherId ?? ''))
    if (!other || other.id === viewer.id) fail(404, 'not_found', 'That learner can’t be found.')
    if (!REPORT_REASONS.includes(reason)) fail(400, 'invalid', 'Choose a reason for the report.', { field: 'reason' })
    db.run(
      'INSERT INTO reports (reporter, reported, reported_name, reason, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      viewer.id, other.id, other.username, reason, String(note ?? '').trim().slice(0, 500) || null, now,
    )
    return { status: 'reported' }
  }

  /* ── Lists ── */

  /** League XP this week (the learner's current board), total league XP. */
  function figures(userId, now) {
    const week = leagues.activeMembership(userId, now)
    const total = Number(db.get('SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_ledger WHERE user_id = ?', userId).xp)
    return { weeklyXp: week?.xp ?? 0, totalXp: total }
  }

  function listFriends(viewer, now) {
    const rows = db.all(
      `SELECT u.*, f.created_at AS since FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END
        WHERE f.user_a = ? OR f.user_b = ?
        ORDER BY u.username_key`,
      viewer.id, viewer.id, viewer.id,
    )
    return rows.map((u) => ({ ...card(u), since: u.since, ...figures(u.id, now) }))
  }

  function listRequests(viewer) {
    /* The request's own columns are aliased: `u.*` brings a user `id` and
       `created_at` that would otherwise overwrite them. */
    const rows = (sql) => db.all(sql, viewer.id).map((r) => ({
      id: r.request_id,
      createdAt: r.requested_at,
      via: r.request_via,
      user: card(r),
    }))
    return {
      incoming: rows(`SELECT u.*, r.id AS request_id, r.created_at AS requested_at, r.via AS request_via
                        FROM friend_requests r JOIN users u ON u.id = r.from_user
                       WHERE r.to_user = ? AND r.status = 'pending' ORDER BY r.created_at DESC`),
      outgoing: rows(`SELECT u.*, r.id AS request_id, r.created_at AS requested_at, r.via AS request_via
                        FROM friend_requests r JOIN users u ON u.id = r.to_user
                       WHERE r.from_user = ? AND r.status = 'pending' ORDER BY r.created_at DESC`),
    }
  }

  /* ── Profiles ── */

  /** Consecutive days with league activity, in the learner's own time zone. */
  function streakOf(user, now) {
    const since = now - 400 * 86400000
    const days = new Set(db.all('SELECT created_at FROM xp_ledger WHERE user_id = ? AND created_at >= ?', user.id, since).map((r) => dayKeyIn(user.timezone, r.created_at)))
    let streak = 0
    let t = now
    if (!days.has(dayKeyIn(user.timezone, t))) t -= 86400000
    while (days.has(dayKeyIn(user.timezone, t))) { streak += 1; t -= 86400000 }
    return streak
  }

  function profile(viewer, targetId, now) {
    const u = db.get('SELECT * FROM users WHERE id = ?', String(targetId ?? ''))
    if (!u) fail(404, 'not_found', 'That profile isn’t available.')
    const self = u.id === viewer.id
    if (!self && !visible(viewer, u)) fail(404, 'not_found', 'That profile isn’t available.')
    const rel = relation(viewer.id, u.id)
    const full = self || u.profile_visibility === 'everyone' || (u.profile_visibility === 'friends' && rel === 'friend')
    const base = { ...card(u), relation: rel, visibility: u.profile_visibility, private: !full }
    if (!full) return base

    const lessons = db.all('SELECT DISTINCT item_id FROM completions WHERE user_id = ?', u.id).filter((r) => isLesson(r.item_id)).length
    const trophies = db.all('SELECT id, kind, tier, rank, title, reason, created_at FROM awards WHERE user_id = ? ORDER BY created_at DESC LIMIT 24', u.id)
      .map((a) => ({ id: a.id, kind: a.kind, tier: a.tier, rank: a.rank, title: a.title, reason: a.reason, createdAt: a.created_at }))
    const shared = self ? [] : db.all(
      `SELECT c.id, c.format, c.status, c.ends_at FROM challenges c
         JOIN challenge_participants a ON a.challenge_id = c.id AND a.user_id = ? AND a.status IN ('accepted', 'invited')
         JOIN challenge_participants b ON b.challenge_id = c.id AND b.user_id = ? AND b.status IN ('accepted', 'invited')
        ORDER BY c.created_at DESC LIMIT 5`,
      viewer.id, u.id,
    ).map((c) => ({ id: c.id, format: c.format, status: c.status, endsAt: c.ends_at }))

    return {
      ...base,
      bestTier: u.best_tier,
      joinedAt: u.created_at,
      lessons,
      streak: streakOf(u, now),
      ...figures(u.id, now),
      trophies,
      sharedChallenges: shared,
    }
  }

  return {
    isBlocked, areFriends, visible, relation, byCode, byUsername, byEmail, sendRequest, respond,
    removeFriend, block, unblock, listBlocks, report, listFriends, listRequests, profile, streakOf,
  }
}

export default { createFriends, REPORT_REASONS }
