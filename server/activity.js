/* ═══════════════════════════════════════════════════════════════════════════
   activity.js — WHAT A LEARNER DID, AND WHAT IT IS WORTH
   ---------------------------------------------------------------------------
   The app never tells the server how much XP to give. It sends what the
   learner did (services/activityOutbox.js) and this file decides:

     answer             graded here, with the course's own grading function.
                        A Check question answered right for the FIRST time
                        pays XP.CORRECT_ANSWER, once ever (ledger source
                        "answer:<key>"). Practice answers are recorded and
                        paid when their session closes.
     complete           accepted only for an item the learner may open (the
                        app's own unlock rule, from the completions recorded
                        HERE) and, for an item with a Check, only if every
                        Check question was answered in that sitting. A first
                        completion pays the item's XP; a clean Check its
                        bonus; the last item of a module the module bonus.
     practice-complete  pays by the shared practice rule (utils/practiceXp.js)
                        from the answers this server recorded: fresh correct
                        answers only, a reduced bonus after a few sessions,
                        a daily cap.

   Every event carries a one-shot id; the first answer is stored, and a
   repeat gets that answer back without anything happening twice. League XP
   is credited in the same transaction as the payment that earned it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { XP } from '../src/config/progressionConfig.js'
import { practiceSessionXp, isFresh, PRACTICE_XP } from '../src/utils/practiceXp.js'
import { QUESTIONS, GRADED, grade, cleanAnswer, playableItems, getLessonById, getSectionById } from './content.js'

const HOUR = 3600000
const TYPES = new Set(['answer', 'complete', 'practice-complete'])
const ID = /^[A-Za-z0-9_-]{4,64}$/
const MODES = new Set(['mistakes', 'due', 'weak', 'older', 'mixed', 'quick', 'topic', 'concept'])

const invalid = (code) => ({ status: 'invalid', code, xp: 0 })

export function createActivity({ db, leagues, onRecorded = () => {} }) {
  function completedItems(userId) {
    return new Set(db.all('SELECT DISTINCT item_id FROM completions WHERE user_id = ?', userId).map((r) => r.item_id))
  }

  function canOpen(user, itemId) {
    return playableItems(completedItems(user.id), user.role === 'judge').has(itemId)
  }

  /** Pay league XP from a unique source. Returns what was actually paid. */
  function pay(user, source, amount, reason, now) {
    if (amount <= 0) return 0
    const r = db.run(
      'INSERT OR IGNORE INTO xp_ledger (user_id, source, amount, reason, created_at) VALUES (?, ?, ?, ?, ?)',
      user.id, source, amount, reason, now,
    )
    return r.changes ? amount : 0
  }

  function answer(user, p, now) {
    const q = QUESTIONS.get(p.key)
    if (!q) return invalid('unknown-question')
    const context = p.context === 'check' || p.context === 'practice' ? p.context : null
    if (!context) return invalid('bad-context')
    if (context === 'check' && !q.graded) return invalid('not-graded')
    if (!ID.test(String(p.sessionId ?? ''))) return invalid('bad-session')
    if (!canOpen(user, q.itemId)) return invalid('locked')
    const clean = cleanAnswer(p.answer)
    const correct = grade(p.key, clean)
    db.run(
      `INSERT INTO attempts (user_id, question_key, concept, item_id, module_id, context, session_id, correct, answer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user.id, p.key, q.concept, q.itemId, q.moduleId, context, p.sessionId, correct ? 1 : 0, JSON.stringify(clean), now,
    )
    const xp = context === 'check' && correct ? pay(user, `answer:${p.key}`, XP.CORRECT_ANSWER, 'correct-answer', now) : 0
    return { status: 'ok', correct, xp }
  }

  function complete(user, p, now) {
    const item = getLessonById(p.lessonId)
    if (!item) return invalid('unknown-item')
    if (!ID.test(String(p.sessionId ?? ''))) return invalid('bad-session')
    if (!canOpen(user, item.id)) return invalid('locked')

    const graded = GRADED.get(item.id) ?? []
    let perfect = true
    if (graded.length) {
      const rows = db.all(
        "SELECT question_key, correct FROM attempts WHERE user_id = ? AND session_id = ? AND context = 'check'",
        user.id, p.sessionId,
      )
      const byKey = new Map()
      for (const r of rows) byKey.set(r.question_key, [...(byKey.get(r.question_key) ?? []), r.correct === 1])
      const missing = graded.filter((k) => !byKey.has(k))
      /* The reviewer's margin controls finish items without answering them
         (judgeService); on any other account a completion needs its Check. */
      if (missing.length && user.role !== 'judge') return invalid('incomplete')
      perfect = !missing.length && graded.every((k) => byKey.get(k).every(Boolean))
    }

    const first = !db.get('SELECT 1 FROM completions WHERE user_id = ? AND item_id = ?', user.id, item.id)
    const inserted = db.run(
      'INSERT OR IGNORE INTO completions (user_id, item_id, session_id, first, perfect, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      user.id, item.id, p.sessionId, first ? 1 : 0, perfect ? 1 : 0, now,
    )
    if (!inserted.changes) return { status: 'duplicate', code: 'session-already-completed', xp: 0 }

    let xp = 0
    if (first) {
      xp += pay(user, `complete:${item.id}`, XP.ITEM?.[item.kind ?? 'lesson'] ?? XP.LESSON, 'lesson-complete', now)
      if (perfect && graded.length) xp += pay(user, `perfect:${item.id}`, XP.PERFECT_BONUS, 'perfect-lesson', now)
      const section = getSectionById(item.sectionId)
      const done = completedItems(user.id)
      if (section && section.lessons.every((l) => done.has(l.id))) {
        xp += pay(user, `section:${section.id}`, XP.SECTION_COMPLETE, 'section-complete', now)
      }
    }
    return { status: 'ok', first, perfect, xp }
  }

  function practiceComplete(user, p, now) {
    if (!ID.test(String(p.sessionId ?? ''))) return invalid('bad-session')
    if (db.get('SELECT 1 FROM practice_sessions WHERE user_id = ? AND session_id = ?', user.id, p.sessionId)) {
      return { status: 'duplicate', code: 'session-already-closed', xp: 0 }
    }
    const rows = db.all(
      "SELECT question_key, correct FROM attempts WHERE user_id = ? AND session_id = ? AND context = 'practice' ORDER BY id",
      user.id, p.sessionId,
    )
    if (!rows.length) return invalid('empty')
    const correctKeys = [...new Set(rows.filter((r) => r.correct === 1).map((r) => r.question_key))]
    const paidAt = new Map(db.all('SELECT question_key, paid_at FROM practice_credits WHERE user_id = ?', user.id).map((r) => [r.question_key, r.paid_at]))
    const fresh = correctKeys.filter((k) => isFresh(paidAt.get(k), now))
    const recent = db.get(
      'SELECT COUNT(*) AS n, COALESCE(SUM(xp), 0) AS xp FROM practice_sessions WHERE user_id = ? AND created_at >= ?',
      user.id, now - PRACTICE_XP.WINDOW_HOURS * HOUR,
    )
    const rule = practiceSessionXp({
      answered: rows.length,
      freshCorrect: fresh.length,
      sessionsInWindow: Number(recent.n),
      xpInWindow: Number(recent.xp),
    })
    for (const k of fresh) {
      db.run(
        `INSERT INTO practice_credits (user_id, question_key, paid_at) VALUES (?, ?, ?)
         ON CONFLICT (user_id, question_key) DO UPDATE SET paid_at = excluded.paid_at`,
        user.id, k, now,
      )
    }
    db.run(
      'INSERT INTO practice_sessions (user_id, session_id, mode, topic, answered, correct, xp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      user.id, p.sessionId, MODES.has(p.mode) ? p.mode : null, typeof p.topic === 'string' ? p.topic.slice(0, 40) : null,
      rows.length, rows.filter((r) => r.correct === 1).length, rule.xp, now,
    )
    const xp = pay(user, `practice:${p.sessionId}`, rule.xp, 'practice-complete', now)
    return {
      status: 'ok', xp, answered: rows.length, correct: rows.filter((r) => r.correct === 1).length,
      bonus: rule.bonus, perAnswer: rule.perAnswer, reduced: rule.reduced, capped: rule.capped,
    }
  }

  const HANDLERS = { answer, complete, 'practice-complete': practiceComplete }

  /**
   * Process a batch, in order. Each event is its own transaction, so one
   * bad event never undoes the good ones before it.
   * @returns {{ results: object[], league: object|null }}
   */
  function processBatch(user, events, now) {
    const results = []
    let league = null
    for (const e of (Array.isArray(events) ? events : []).slice(0, 50)) {
      if (!e || typeof e !== 'object' || !ID.test(String(e.id ?? '')) || !TYPES.has(e.type)) {
        results.push({ id: typeof e?.id === 'string' ? e.id.slice(0, 64) : null, status: 'invalid', code: 'bad-event', xp: 0 })
        continue
      }
      const seen = db.get('SELECT result FROM events WHERE user_id = ? AND event_id = ?', user.id, e.id)
      if (seen) {
        const prior = JSON.parse(seen.result ?? '{}')
        results.push({ ...prior, id: e.id, status: 'duplicate', xp: 0, firstStatus: prior.status })
        continue
      }
      const payload = e.payload && typeof e.payload === 'object' ? e.payload : {}
      try {
        const outcome = db.tx(() => {
          const r = HANDLERS[e.type](user, payload, now)
          if (r.xp > 0) r.league = leagues.creditXp(user.id, r.xp, now)
          db.run(
            'INSERT INTO events (user_id, event_id, kind, status, result, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            user.id, e.id, e.type, r.status, JSON.stringify({ ...r, league: undefined }), now,
          )
          return r
        })
        if (outcome.league) league = outcome.league
        results.push({ id: e.id, ...outcome })
      } catch (error) {
        console.error('[activity]', error)
        results.push({ id: e.id, status: 'retry', xp: 0 })
      }
    }
    if (results.some((r) => r.status === 'ok')) onRecorded(user.id, now)
    return { results, league }
  }

  return { processBatch, completedItems, canOpen }
}

export default { createActivity }
