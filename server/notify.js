/* ═══════════════════════════════════════════════════════════════════════════
   notify.js — NOTIFICATIONS AND REWARDS
   ---------------------------------------------------------------------------
   Two small records every other module writes to:

     notifications   "Sam sent you a friend request", "You were promoted to
                     Gold" — read in the app's nav badges and toasts
     awards          a reward the server has decided (a promotion, a podium
                     place, a tournament round, a won challenge): its title,
                     the sentence saying WHY, its gems. UNIQUE (user, kind,
                     ref), so a week, a round or a challenge pays once.

   An award's gems are claimed into the learner's own economy by the app
   (progressionService → CLAIM_SERVER_AWARD); `claimed_at` records it here.
   ═══════════════════════════════════════════════════════════════════════════ */

import { newId } from './accounts.js'

export const NOTIFICATION_KINDS = new Set([
  'friend-request', 'friend-accepted', 'challenge-invite', 'challenge-accepted',
  'challenge-result', 'challenge-cancelled', 'league-result', 'award', 'tournament-qualified',
  'moderation-rename',
])

export function notify(db, userId, kind, payload, now) {
  db.run('INSERT INTO notifications (user_id, kind, payload, created_at) VALUES (?, ?, ?, ?)', userId, kind, JSON.stringify(payload ?? {}), now)
  /* Bounded: a learner keeps their latest 100. */
  db.run(`DELETE FROM notifications WHERE user_id = ? AND id NOT IN (SELECT id FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100)`, userId, userId)
  poke(db, userId, kind)
}

/** Tell the learner's open pages that something of theirs changed
 *  (live.js; app.js sets db.onPoke). Nothing happens without a listener. */
export function poke(db, userId, kind) {
  db.onPoke?.(userId, kind)
}

export function listNotifications(db, userId, limit = 30) {
  const rows = db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?', userId, Math.min(100, limit))
  return rows.map((r) => ({ id: r.id, kind: r.kind, payload: JSON.parse(r.payload), createdAt: r.created_at, read: r.read_at != null }))
}

export function unreadCount(db, userId) {
  return Number(db.get('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL', userId).n)
}

export function markRead(db, userId, ids, now) {
  if (Array.isArray(ids) && ids.length) {
    const clean = ids.map(Number).filter(Number.isInteger).slice(0, 100)
    for (const id of clean) db.run('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL', now, id, userId)
  } else {
    db.run('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', now, userId)
  }
}

/**
 * Record a reward. Returns the award, or null when this user already has
 * one of this kind for this ref — which is how a replay pays nothing.
 */
export function grantAward(db, userId, { kind, ref, tier = null, rank = null, gems = 0, title, reason }, now) {
  const id = newId('aw')
  const r = db.run(
    `INSERT OR IGNORE INTO awards (id, user_id, kind, ref, tier, rank, gems, title, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, kind, String(ref), tier, rank, Math.max(0, Math.floor(gems)), title, reason, now,
  )
  if (!r.changes) return null
  const award = publicAward(db.get('SELECT * FROM awards WHERE id = ?', id))
  notify(db, userId, 'award', { awardId: id, kind, title, gems: award.gems }, now)
  return award
}

export function publicAward(row) {
  return {
    id: row.id,
    kind: row.kind,
    ref: row.ref,
    tier: row.tier,
    rank: row.rank,
    gems: row.gems,
    title: row.title,
    reason: row.reason,
    createdAt: row.created_at,
    claimed: row.claimed_at != null,
  }
}

export function listAwards(db, userId, limit = 100) {
  return db.all('SELECT * FROM awards WHERE user_id = ? ORDER BY created_at DESC, id LIMIT ?', userId, limit).map(publicAward)
}

/** Mark an award's gems as claimed. Idempotent: the second claim changes nothing. */
export function claimAward(db, userId, awardId, now) {
  const row = db.get('SELECT * FROM awards WHERE id = ? AND user_id = ?', awardId, userId)
  if (!row) return null
  if (row.claimed_at == null) db.run('UPDATE awards SET claimed_at = ? WHERE id = ? AND claimed_at IS NULL', now, awardId)
  return publicAward(db.get('SELECT * FROM awards WHERE id = ?', awardId))
}

export default { notify, poke, listNotifications, unreadCount, markRead, grantAward, publicAward, listAwards, claimAward }
