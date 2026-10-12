/* ═══════════════════════════════════════════════════════════════════════════
   moderation.js — ACTING ON REPORTS
   ---------------------------------------------------------------------------
   A learner's report (friends.js → report) waits here for a MODERATOR: an
   account the people running the server have marked with
     npm run server -- --make-moderator <username>
   A moderator sees open reports in Profile → Moderation and can:

     dismiss      close the report; nothing happens to anyone
     reset name   give the reported learner a plain name (Learner_ + their
                  friend code), and tell them why in a notification
     suspend      for 1, 7 or 30 days, or until lifted: every session ends,
                  the account leaves this week's board and every search, and
                  signing in says until when
     lift         end a suspension early
     delete       remove the account and everything it owns, as the
                  learner's own Delete account would

   Acting on a learner closes every open report about them. Every action is
   written to moderation_log (who, what, to whom, which report, the note)
   and the log is shown beneath the reports, so moderation is never silent.
   Nobody moderates the reviewer's account, another moderator, or themself.
   ═══════════════════════════════════════════════════════════════════════════ */

import { card, removeAccount, isSuspended, suspensionEnd, FOREVER } from './accounts.js'
import { notify } from './notify.js'
import { fail } from './http.js'

export const SUSPEND_DAYS = [1, 7, 30]
const DAY = 86400000

export function createModeration({ db, hub }) {
  const target = (id) => {
    const u = db.get('SELECT * FROM users WHERE id = ?', String(id ?? ''))
    if (!u) fail(404, 'not_found', 'That account no longer exists.')
    return u
  }
  const guard = (mod, u) => {
    if (u.id === mod.id) fail(403, 'self', 'You can’t moderate your own account.')
    if (u.role === 'judge') fail(403, 'protected', 'The reviewer account can’t be moderated.')
    if (u.is_moderator) fail(403, 'protected', 'Another moderator’s account can’t be moderated here.')
  }
  const note = (text) => String(text ?? '').trim().slice(0, 300) || null

  function log(mod, action, u, { reportId = null, note: text = null } = {}, now) {
    db.run(
      'INSERT INTO moderation_log (moderator, moderator_name, action, target, target_name, report_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      mod.id, mod.username, action, u?.id ?? null, u?.username ?? null, reportId, text, now,
    )
  }

  /** Close the open reports about `userId` as acted on. */
  function closeReportsAbout(mod, userId, resolution, now) {
    db.run(
      "UPDATE reports SET status = 'actioned', resolved_at = ?, resolved_by = ?, resolution = ? WHERE reported = ? AND status = 'open'",
      now, mod.id, resolution, userId,
    )
  }

  /* ── Reading ── */

  function reportRow(r, now) {
    const reported = r.reported ? db.get('SELECT * FROM users WHERE id = ?', r.reported) : null
    const reporter = r.reporter ? db.get('SELECT * FROM users WHERE id = ?', r.reporter) : null
    return {
      id: r.id,
      reason: r.reason,
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      resolution: r.resolution,
      reporter: reporter ? card(reporter) : null,
      reported: reported
        ? {
            ...card(reported),
            createdAt: reported.created_at,
            suspendedUntil: isSuspended(reported, now) ? reported.suspended_until : null,
            indefinite: isSuspended(reported, now) && reported.suspended_until >= FOREVER,
            protected: reported.role === 'judge' || Boolean(reported.is_moderator),
            /* How many people have reported this account, ever — one report is
               an opinion, several are a pattern. */
            reports: Number(db.get('SELECT COUNT(DISTINCT reporter) AS n FROM reports WHERE reported = ?', reported.id).n),
          }
        : { username: r.reported_name, deleted: true },
    }
  }

  function listReports(status, now) {
    const open = status !== 'closed'
    const rows = db.all(
      `SELECT * FROM reports WHERE ${open ? "status = 'open'" : "status <> 'open'"}
        ORDER BY ${open ? 'created_at ASC' : 'resolved_at DESC'} LIMIT 100`,
    )
    return {
      reports: rows.map((r) => reportRow(r, now)),
      open: Number(db.get("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'").n),
    }
  }

  function listLog(limit = 50) {
    return db.all('SELECT * FROM moderation_log ORDER BY id DESC LIMIT ?', limit).map((l) => ({
      id: l.id,
      action: l.action,
      moderator: l.moderator_name,
      target: l.target_name,
      reportId: l.report_id,
      note: l.note,
      createdAt: l.created_at,
    }))
  }

  /* ── Acting ── */

  function dismiss(mod, reportId, text, now) {
    const r = db.get('SELECT * FROM reports WHERE id = ?', Number(reportId))
    if (!r) fail(404, 'not_found', 'That report no longer exists.')
    if (r.status !== 'open') fail(409, 'closed', 'That report has already been dealt with.')
    db.tx(() => {
      db.run("UPDATE reports SET status = 'dismissed', resolved_at = ?, resolved_by = ?, resolution = 'dismissed' WHERE id = ?", now, mod.id, r.id)
      log(mod, 'dismiss', r.reported ? db.get('SELECT * FROM users WHERE id = ?', r.reported) : { id: null, username: r.reported_name }, { reportId: r.id, note: note(text) }, now)
    })
    return { status: 'dismissed' }
  }

  function resetName(mod, userId, { reportId, note: text } = {}, now) {
    const u = target(userId)
    guard(mod, u)
    const base = `Learner_${u.friend_code.replace(/-/g, '')}`
    let name = base
    for (let i = 2; db.get('SELECT 1 FROM users WHERE username_key = ? AND id <> ?', name.toLowerCase(), u.id); i++) name = `${base.slice(0, 18)}${i}`
    db.tx(() => {
      db.run('UPDATE users SET username = ?, username_key = ? WHERE id = ?', name, name.toLowerCase(), u.id)
      closeReportsAbout(mod, u.id, 'name-reset', now)
      log(mod, 'reset-name', u, { reportId: reportId ?? null, note: note(text) }, now)
      notify(db, u.id, 'moderation-rename', { username: name }, now)
    })
    return { status: 'renamed', username: name }
  }

  function suspend(mod, userId, { days, reportId, note: text } = {}, now) {
    const u = target(userId)
    guard(mod, u)
    if (days != null && !SUSPEND_DAYS.includes(Number(days))) fail(400, 'invalid', `Suspend for ${SUSPEND_DAYS.join(', ')} days, or until lifted.`, { field: 'days' })
    const until = days == null ? FOREVER : now + Number(days) * DAY
    db.tx(() => {
      db.run('UPDATE users SET suspended_until = ?, suspended_note = ? WHERE id = ?', until, note(text), u.id)
      db.run('DELETE FROM sessions WHERE user_id = ?', u.id)
      /* Off this week's board at once, as leaving the leagues would. */
      db.run('DELETE FROM cohort_members WHERE user_id = ? AND cohort_id IN (SELECT id FROM cohorts WHERE finalized_at IS NULL)', u.id)
      db.run("UPDATE friend_requests SET status = 'cancelled', responded_at = ? WHERE status = 'pending' AND (from_user = ? OR to_user = ?)", now, u.id, u.id)
      closeReportsAbout(mod, u.id, days == null ? 'suspended' : `suspended-${days}d`, now)
      log(mod, days == null ? 'suspend' : `suspend-${days}d`, u, { reportId: reportId ?? null, note: note(text) }, now)
    })
    hub?.close(u.id)
    return { status: 'suspended', until: days == null ? null : until, label: days == null ? 'until lifted' : `until ${suspensionEnd(until)}` }
  }

  function lift(mod, userId, { note: text } = {}, now) {
    const u = target(userId)
    guard(mod, u)
    if (u.suspended_until == null) fail(409, 'not_suspended', 'That account isn’t suspended.')
    db.tx(() => {
      db.run('UPDATE users SET suspended_until = NULL, suspended_note = NULL WHERE id = ?', u.id)
      log(mod, 'lift', u, { note: note(text) }, now)
    })
    return { status: 'lifted' }
  }

  function remove(mod, userId, { reportId, note: text } = {}, now) {
    const u = target(userId)
    guard(mod, u)
    db.tx(() => {
      closeReportsAbout(mod, u.id, 'deleted', now)
      log(mod, 'delete', u, { reportId: reportId ?? null, note: note(text) }, now)
      removeAccount(db, u.id)
    })
    hub?.close(u.id)
    return { status: 'deleted' }
  }

  return { listReports, listLog, dismiss, resetName, suspend, lift, remove }
}

/** The command line's side: mark or unmark a moderator by username. */
export function setModerator(db, username, on) {
  const u = db.get('SELECT * FROM users WHERE username_key = ?', String(username ?? '').trim().toLowerCase())
  if (!u) return null
  if (u.role === 'judge' || u.is_seed) return { refused: true, username: u.username }
  db.run('UPDATE users SET is_moderator = ? WHERE id = ?', on ? 1 : 0, u.id)
  return { username: u.username, moderator: on }
}

export default { createModeration, setModerator, SUSPEND_DAYS }
