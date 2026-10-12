/* ═══════════════════════════════════════════════════════════════════════════
   challenges.js — FRIEND CHALLENGES
   ---------------------------------------------------------------------------
   A private competition between friends, separate from the weekly leagues:
   any friends, in any leagues. Formats and limits: leagueConfig.js →
   CHALLENGES.

     xp       most league XP earned in the window (the same ledger the league
              counts — read, never added to)
     lessons  most lessons finished in the window, first time or as a review,
              one per lesson per day
     topic    most correct Practice answers in one module, each question
              counted once a day
     quiz     best score in one Practice session of QUIZ_MIN_QUESTIONS or
              more (in the chosen module, if one is set)

   Scores are READ from what the learner did — the xp ledger, completions,
   practice attempts and sessions this server recorded — inside the
   challenge's window. A challenge never writes XP, so it can never inflate
   a league; its reward is gems and a trophy, recorded once
   (awards UNIQUE (user, 'challenge-win', challenge id)).

   The lifecycle: created (the creator is in; friends are invited) → invited
   friends accept or decline → it runs to its deadline (or until someone
   reaches its target) → it is finalized and everyone in it is told the
   result. Nobody accepted within ACCEPT_HOURS: called off. A participant may
   leave; with fewer than two left and nobody still invited, it is called off.
   ═══════════════════════════════════════════════════════════════════════════ */

import { CHALLENGES, challengeFormat } from '../src/config/leagueConfig.js'
import { getSectionById, isLesson } from './content.js'
import { card, newId } from './accounts.js'
import { grantAward, notify } from './notify.js'
import { fail } from './http.js'

const HOUR = 3600000
const DAY = 24 * HOUR

export function createChallenges({ db, friends }) {
  /* ── Scores ── */

  /** A participant's score: what they did AFTER the challenge was made, up to
   *  and including now (or its end). XP from the instant it was created
   *  belongs to before it. */
  function score(c, userId, now) {
    const from = c.starts_at
    const to = Math.min(c.ends_at, now)
    switch (c.format) {
      case 'xp':
        return Number(db.get('SELECT COALESCE(SUM(amount), 0) AS n FROM xp_ledger WHERE user_id = ? AND created_at > ? AND created_at <= ?', userId, from, to).n)
      case 'lessons': {
        const rows = db.all('SELECT item_id, created_at FROM completions WHERE user_id = ? AND created_at > ? AND created_at <= ?', userId, from, to)
        return new Set(rows.filter((r) => isLesson(r.item_id)).map((r) => `${r.item_id}:${Math.floor(r.created_at / DAY)}`)).size
      }
      case 'topic': {
        const rows = db.all(
          "SELECT question_key, created_at FROM attempts WHERE user_id = ? AND context = 'practice' AND correct = 1 AND module_id = ? AND created_at > ? AND created_at <= ?",
          userId, c.topic, from, to,
        )
        return new Set(rows.map((r) => `${r.question_key}:${Math.floor(r.created_at / DAY)}`)).size
      }
      case 'quiz': {
        const rows = db.all(
          `SELECT answered, correct, topic FROM practice_sessions WHERE user_id = ? AND answered >= ? AND created_at > ? AND created_at <= ?`,
          userId, CHALLENGES.QUIZ_MIN_QUESTIONS, from, to,
        ).filter((r) => !c.topic || r.topic === c.topic)
        return rows.reduce((best, r) => Math.max(best, Math.round((100 * r.correct) / r.answered)), 0)
      }
      default:
        return 0
    }
  }

  /** Rank by score; equal scores share a rank (a tie for first is a shared win). */
  function rankScores(list) {
    const sorted = [...list].sort((a, b) => b.score - a.score)
    let rank = 0
    let last = null
    return sorted.map((x, i) => {
      if (x.score !== last) { rank = i + 1; last = x.score }
      return { ...x, rank }
    })
  }

  /* ── Reading ── */

  function participants(challengeId) {
    return db.all(
      `SELECT p.*, u.username, u.avatar, u.tier, u.is_seed, u.id AS uid FROM challenge_participants p
         JOIN users u ON u.id = p.user_id WHERE p.challenge_id = ?`,
      challengeId,
    )
  }

  function viewOf(c, viewerId, now) {
    const people = participants(c.id)
    const live = c.status === 'active'
    const accepted = people.filter((p) => p.status === 'accepted')
    const scored = rankScores(accepted.map((p) => ({
      userId: p.user_id,
      score: live ? score(c, p.user_id, now) : p.final_score ?? 0,
      finalRank: p.final_rank,
    })))
    const format = challengeFormat(c.format)
    const me = people.find((p) => p.user_id === viewerId)
    const winners = c.status === 'completed' ? scored.filter((x) => x.rank === 1 && x.score > 0).map((x) => x.userId) : []
    return {
      id: c.id,
      format: c.format,
      formatName: format?.name ?? c.format,
      unit: format?.unit ?? '',
      topic: c.topic,
      topicTitle: c.topic ? getSectionById(c.topic)?.title ?? c.topic : null,
      target: c.target,
      status: c.status,
      cancelReason: c.cancel_reason,
      createdAt: c.created_at,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      creatorId: c.creator,
      myStatus: me?.status ?? null,
      winners,
      standings: scored.map((x) => {
        const p = accepted.find((q) => q.user_id === x.userId)
        return { ...card({ id: p.uid, username: p.username, avatar: p.avatar, tier: p.tier, is_seed: p.is_seed }), score: x.score, rank: x.rank, isYou: x.userId === viewerId }
      }),
      invited: people.filter((p) => p.status === 'invited').map((p) => card({ id: p.uid, username: p.username, avatar: p.avatar, tier: p.tier, is_seed: p.is_seed })),
      declined: people.filter((p) => p.status === 'declined' || p.status === 'left').map((p) => ({ ...card({ id: p.uid, username: p.username, avatar: p.avatar, tier: p.tier, is_seed: p.is_seed }), status: p.status })),
      reward: c.status === 'completed' && winners.includes(viewerId)
        ? db.get("SELECT id, gems, claimed_at FROM awards WHERE user_id = ? AND kind = 'challenge-win' AND ref = ?", viewerId, c.id) ?? null
        : null,
    }
  }

  function list(viewer, now) {
    finalizeDue(now)
    const rows = db.all(
      `SELECT c.* FROM challenges c JOIN challenge_participants p ON p.challenge_id = c.id
        WHERE p.user_id = ? AND p.status <> 'declined'
        ORDER BY CASE c.status WHEN 'active' THEN 0 ELSE 1 END, c.ends_at DESC LIMIT 40`,
      viewer.id,
    )
    return rows.map((c) => viewOf(c, viewer.id, now))
  }

  function openCount(userId) {
    return Number(db.get(
      `SELECT COUNT(*) AS n FROM challenges c JOIN challenge_participants p ON p.challenge_id = c.id
        WHERE p.user_id = ? AND c.status = 'active' AND p.status IN ('accepted', 'invited')`,
      userId,
    ).n)
  }

  /* ── Commands ── */

  function create(viewer, body, now) {
    const format = challengeFormat(body.format)
    if (!format) fail(400, 'invalid', 'Choose a challenge format.', { field: 'format' })
    let topic = null
    if (format.topic !== 'none' && body.topic) {
      if (!getSectionById(body.topic)) fail(400, 'invalid', 'Choose one of the course modules.', { field: 'topic' })
      topic = body.topic
    }
    if (format.topic === 'required' && !topic) fail(400, 'invalid', 'Choose the module this challenge is about.', { field: 'topic' })
    const days = Number(body.durationDays)
    if (!CHALLENGES.DURATIONS_DAYS.includes(days)) fail(400, 'invalid', `Choose ${CHALLENGES.DURATIONS_DAYS.join(', ')} days.`, { field: 'durationDays' })
    let target = null
    if (body.target != null && body.target !== '') {
      target = Number(body.target)
      if (!format.targets.includes(target)) fail(400, 'invalid', 'Choose one of the targets offered.', { field: 'target' })
    }
    const ids = [...new Set(Array.isArray(body.friendIds) ? body.friendIds.map(String) : [])]
    if (!ids.length) fail(400, 'invalid', 'Invite at least one friend.', { field: 'friendIds' })
    if (ids.length > CHALLENGES.MAX_INVITES) fail(400, 'invalid', `Invite up to ${CHALLENGES.MAX_INVITES} friends.`, { field: 'friendIds' })
    for (const id of ids) {
      if (id === viewer.id || !friends.areFriends(viewer.id, id) || friends.isBlocked(viewer.id, id)) {
        fail(400, 'not_friend', 'You can only challenge your friends.', { field: 'friendIds' })
      }
    }
    if (openCount(viewer.id) >= CHALLENGES.MAX_OPEN) fail(409, 'too_many', `You can be in ${CHALLENGES.MAX_OPEN} challenges at once. Finish or leave one first.`)

    const id = newId('ch')
    db.tx(() => {
      db.run(
        "INSERT INTO challenges (id, creator, format, topic, target, status, created_at, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)",
        id, viewer.id, format.id, topic, target, now, now, now + days * DAY,
      )
      db.run("INSERT INTO challenge_participants (challenge_id, user_id, status, responded_at) VALUES (?, ?, 'accepted', ?)", id, viewer.id, now)
      for (const friendId of ids) {
        db.run("INSERT INTO challenge_participants (challenge_id, user_id, status) VALUES (?, ?, 'invited')", id, friendId)
        notify(db, friendId, 'challenge-invite', { challengeId: id, from: viewer.username, format: format.name, days }, now)
      }
    })
    return viewOf(db.get('SELECT * FROM challenges WHERE id = ?', id), viewer.id, now)
  }

  function load(challengeId) {
    const c = db.get('SELECT * FROM challenges WHERE id = ?', String(challengeId ?? ''))
    if (!c) fail(404, 'not_found', 'That challenge no longer exists.')
    return c
  }

  function respond(viewer, challengeId, action, now) {
    finalizeDue(now)
    const c = load(challengeId)
    const me = db.get('SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?', c.id, viewer.id)
    if (!me) fail(403, 'not_yours', 'You are not in that challenge.')
    if (c.status !== 'active') fail(409, 'over', 'That challenge is over.')

    db.tx(() => {
      if (action === 'accept' || action === 'decline') {
        if (me.status !== 'invited') fail(409, 'answered', 'You have already answered that invitation.')
        if (action === 'accept' && openCount(viewer.id) > CHALLENGES.MAX_OPEN) fail(409, 'too_many', `You can be in ${CHALLENGES.MAX_OPEN} challenges at once.`)
        db.run('UPDATE challenge_participants SET status = ?, responded_at = ? WHERE challenge_id = ? AND user_id = ?', action === 'accept' ? 'accepted' : 'declined', now, c.id, viewer.id)
        if (action === 'accept' && c.creator) notify(db, c.creator, 'challenge-accepted', { challengeId: c.id, username: viewer.username }, now)
      } else if (action === 'leave') {
        if (me.status !== 'accepted') fail(409, 'not_in', 'You are not taking part in that challenge.')
        db.run("UPDATE challenge_participants SET status = 'left', responded_at = ? WHERE challenge_id = ? AND user_id = ?", now, c.id, viewer.id)
      } else if (action === 'cancel') {
        if (c.creator !== viewer.id) fail(403, 'not_yours', 'Only the person who made a challenge can call it off.')
        const others = Number(db.get("SELECT COUNT(*) AS n FROM challenge_participants WHERE challenge_id = ? AND user_id <> ? AND status = 'accepted'", c.id, viewer.id).n)
        if (others) fail(409, 'started', 'Someone has already joined — leave the challenge instead.')
        cancel(c, 'cancelled-by-creator', now)
        return
      }
      /* Fewer than two still in, and nobody left to answer: called off. */
      const counts = db.get(
        "SELECT SUM(status = 'accepted') AS inn, SUM(status = 'invited') AS waiting FROM challenge_participants WHERE challenge_id = ?", c.id,
      )
      if (Number(counts.inn) < 2 && Number(counts.waiting) === 0) cancel(c, 'not-enough', now)
    })
    return viewOf(db.get('SELECT * FROM challenges WHERE id = ?', c.id), viewer.id, now)
  }

  function cancel(c, reason, now) {
    db.run("UPDATE challenges SET status = 'cancelled', cancel_reason = ?, finalized_at = ? WHERE id = ? AND status = 'active'", reason, now, c.id)
    for (const p of participants(c.id).filter((x) => x.status === 'accepted' || x.status === 'invited')) {
      notify(db, p.user_id, 'challenge-cancelled', { challengeId: c.id, reason }, now)
    }
  }

  function finalize(c, now) {
    const fresh = db.get('SELECT * FROM challenges WHERE id = ?', c.id)
    if (!fresh || fresh.status !== 'active') return
    const accepted = participants(c.id).filter((p) => p.status === 'accepted')
    if (accepted.length < 2) { cancel(fresh, 'not-enough', now); return }
    const endAt = Math.min(fresh.ends_at, now)
    const ranked = rankScores(accepted.map((p) => ({ userId: p.user_id, username: p.username, score: score({ ...fresh, ends_at: endAt }, p.user_id, now) })))
    const winners = ranked.filter((x) => x.rank === 1 && x.score > 0)
    const format = challengeFormat(fresh.format)
    for (const x of ranked) {
      db.run('UPDATE challenge_participants SET final_score = ?, final_rank = ? WHERE challenge_id = ? AND user_id = ?', x.score, x.rank, c.id, x.userId)
    }
    db.run("UPDATE challenges SET status = 'completed', finalized_at = ?, ends_at = ? WHERE id = ?", now, endAt, c.id)
    const share = winners.length ? Math.max(5, Math.floor(CHALLENGES.WIN_GEMS / winners.length)) : 0
    for (const w of winners) {
      grantAward(db, w.userId, {
        kind: 'challenge-win', ref: c.id, gems: share,
        title: winners.length > 1 ? `Shared win · ${format?.name ?? 'Challenge'}` : `Won · ${format?.name ?? 'Challenge'}`,
        reason: `${winners.length > 1 ? 'Tied for first' : 'Finished first'} of ${ranked.length} with ${w.score} ${format?.unit ?? ''}`.trim() + '.',
      }, now)
    }
    for (const x of ranked) {
      notify(db, x.userId, 'challenge-result', { challengeId: c.id, format: format?.name, rank: x.rank, size: ranked.length, score: x.score, won: winners.some((w) => w.userId === x.userId) }, now)
    }
  }

  /** Finish challenges whose deadline passed or whose target was reached,
   *  and call off those nobody joined. */
  function finalizeDue(now) {
    const ended = db.all("SELECT * FROM challenges WHERE status = 'active' AND ends_at <= ?", now)
    for (const c of ended) db.tx(() => finalize(c, now))

    const withTarget = db.all("SELECT * FROM challenges WHERE status = 'active' AND target IS NOT NULL AND ends_at > ?", now)
    for (const c of withTarget) {
      const accepted = db.all("SELECT user_id FROM challenge_participants WHERE challenge_id = ? AND status = 'accepted'", c.id)
      if (accepted.length >= 2 && accepted.some((p) => score(c, p.user_id, now) >= c.target)) db.tx(() => finalize(c, now))
    }

    const stale = db.all(
      `SELECT c.* FROM challenges c WHERE c.status = 'active' AND c.created_at <= ?
         AND NOT EXISTS (SELECT 1 FROM challenge_participants p WHERE p.challenge_id = c.id AND p.user_id <> c.creator AND p.status = 'accepted')`,
      now - CHALLENGES.ACCEPT_HOURS * HOUR,
    )
    for (const c of stale) db.tx(() => cancel(c, 'nobody-joined', now))
    return ended.length + stale.length
  }

  return { score, rankScores, list, create, respond, finalizeDue, viewOf, openCount }
}

export default { createChallenges }
