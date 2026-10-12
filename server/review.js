/* ═══════════════════════════════════════════════════════════════════════════
   review.js — THE REVIEWER'S SANDBOX, AND DEVELOPMENT TEST DATA
   ---------------------------------------------------------------------------
   A TSA judge has minutes, and a league needs other people in it. The
   reviewer's account therefore never joins a real board — it gets a SANDBOX:
   a private room of test accounts that only it can see (friends.js → the
   closed room; leagues.js → sandbox boards never take real learners).

   Nothing here draws a result (CLAUDE.md → The reviewer's controls never
   fake a result). Every control drives the real engine:

     open        the sandbox board for this week, with eleven test accounts
     study       each test account finishes its next lesson the way a learner
                 would — every Check question answered and GRADED by
                 activity.js, the completion accepted by the same checks,
                 the XP paid by the same ledger and credited to the board
     end week    the sandbox board's week ends now and is finalized by
                 leagues.finalizeCohort: ranks, promotion, demotion, rewards
     request     a test account sends the reviewer a real friend request
     challenge   a test friend invites the reviewer to a real challenge
     reset       the test accounts and sandbox boards are deleted

   Test accounts are flagged `is_seed`, named Test_…, and labelled "Test
   account" everywhere the app shows them.

   seedDevelopment() is the development-only equivalent (`npm run server --
   --seed`), refused when LUNX_ENV=production.
   ═══════════════════════════════════════════════════════════════════════════ */

import { randomBytes } from 'node:crypto'
import { weekWindow } from '../src/utils/leagueTime.js'
import { LEAGUE } from '../src/config/leagueConfig.js'
import { ALL_LESSONS } from '../src/data/learnData.js'
import { signup, newId } from './accounts.js'
import { QUESTIONS, GRADED } from './content.js'
import { fail } from './http.js'

const NAMES = ['Ada', 'Bram', 'Cleo', 'Dev', 'Esme', 'Femi', 'Gus', 'Hana', 'Ines', 'Jun', 'Kit']
const SKILL = [0.95, 0.9, 0.85, 0.8, 0.78, 0.72, 0.68, 0.62, 0.58, 0.52, 0.45]

/** The answer a learner of a given skill gives to a step: right or wrong. */
export function answerFor(step, right) {
  switch (step.type) {
    case 'mcq': {
      const correct = step.options.find((o) => o.correct)
      const wrong = step.options.find((o) => !o.correct)
      return { selected: (right ? correct : wrong ?? correct).id }
    }
    case 'binary':
      return { selected: right ? step.correct : step.options.find((o) => o.value !== step.correct)?.value }
    case 'sort': {
      const bins = step.bins.map((b) => b.id)
      const assign = {}
      for (const it of step.items) assign[it.id] = right ? it.bin : bins[(bins.indexOf(it.bin) + 1) % bins.length]
      return { assign }
    }
    case 'number':
      return { value: String(right ? step.answer : step.answer + (step.tolerance ?? 0) + 7) }
    case 'fill-blank':
      return { filled: right ? [...step.answers] : step.answers.map(() => '—') }
    default:
      return {}
  }
}

export function createReview({ db, config, leagues, activity, friends, challenges }) {
  const rand = () => randomBytes(4).readUInt32LE(0) / 4294967296

  function testers(judgeId) {
    return db.all('SELECT * FROM users WHERE sandbox_owner = ? ORDER BY username_key', judgeId)
  }

  async function ensureTesters(judge, now) {
    const existing = testers(judge.id)
    if (existing.length >= NAMES.length) return existing
    const have = new Set(existing.map((u) => u.username))
    for (const name of NAMES) {
      const username = `Test_${name}`
      if (have.has(username)) continue
      const { user } = await signup(db, {
        email: `test-${name.toLowerCase()}-${judge.id.slice(2, 8).toLowerCase()}@sandbox.lunx.invalid`,
        username: `t${randomBytes(5).toString('hex')}`,
        password: randomBytes(18).toString('base64url'),
        timezone: judge.timezone,
      }, now, { seed: true, sandboxOwner: judge.id })
      /* "Test_" names are reserved for test accounts, so they are written
         directly, past the sign-up rules that keep learners off them. */
      db.run(
        "UPDATE users SET username = ?, username_key = ?, profile_visibility = 'everyone' WHERE id = ?",
        username, `${username.toLowerCase()}_${judge.id.slice(2, 6).toLowerCase()}`, user.id,
      )
    }
    return testers(judge.id)
  }

  function activeSandbox(judgeId, now) {
    return db.get(
      'SELECT * FROM cohorts WHERE sandbox_owner = ? AND finalized_at IS NULL AND end_at > ? ORDER BY created_at DESC LIMIT 1',
      judgeId, now,
    ) ?? null
  }

  /** The sandbox board for this week — opened, with its test accounts, if there is none. */
  async function open(judge, now) {
    if (judge.role !== 'judge') fail(403, 'not_reviewer', 'Only the reviewer account has a sandbox.')
    leagues.finalizeDue(now)
    const found = activeSandbox(judge.id, now)
    if (found) return found
    const people = await ensureTesters(judge, now)
    const fresh = db.get('SELECT * FROM users WHERE id = ?', judge.id)
    const week = weekWindow(fresh.timezone, now, { startDay: LEAGUE.WEEK_START_DAY, startHour: LEAGUE.WEEK_START_HOUR })
    const id = newId('c')
    /* Unique even when a sandbox week is reopened in the instant the last one ended. */
    const weekId = `sbx-${now.toString(36)}-${randomBytes(3).toString('hex')}`
    db.tx(() => {
      db.run(
        `INSERT INTO cohorts (id, kind, sandbox_owner, is_test, week_id, tier, timezone, offset_min, band, start_at, end_at, created_at)
         VALUES (?, 'league', ?, 1, ?, ?, ?, 0, 0, ?, ?, ?)`,
        id, judge.id, weekId, fresh.tier, fresh.timezone, now, week.end, now,
      )
      for (const u of [fresh, ...people]) {
        db.run('UPDATE users SET tier = ? WHERE id = ? AND sandbox_owner IS NOT NULL', fresh.tier, u.id)
        db.run(
          'INSERT INTO cohort_members (cohort_id, user_id, week_id, kind, xp, xp_at, joined_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
          id, u.id, weekId, 'league', now, now,
        )
      }
    })
    return activeSandbox(judge.id, now)
  }

  /** Each test account finishes its next lesson, answered at its own skill. */
  async function study(judge, now) {
    await open(judge, now)
    const people = testers(judge.id)
    let paid = 0
    people.forEach((u, i) => {
      const done = activity.completedItems(u.id)
      const next = ALL_LESSONS.find((l) => !done.has(l.id) && activity.canOpen(u, l.id))
      if (!next) return
      const sessionId = `sb${randomBytes(6).toString('hex')}`
      const events = (GRADED.get(next.id) ?? []).map((key) => ({
        id: `ev${randomBytes(8).toString('hex')}`,
        type: 'answer',
        payload: { key, context: 'check', sessionId, answer: answerFor(QUESTIONS.get(key).step, rand() < SKILL[i % SKILL.length]) },
      }))
      events.push({ id: `ev${randomBytes(8).toString('hex')}`, type: 'complete', payload: { lessonId: next.id, sessionId } })
      const { results } = activity.processBatch(u, events, now)
      paid += results.reduce((sum, r) => sum + (r.xp || 0), 0)
    })
    return { testers: people.length, xp: paid }
  }

  /** The sandbox week ends now, and is finalized by the real code. */
  function endWeek(judge, now) {
    const board = activeSandbox(judge.id, now)
    if (!board) fail(409, 'no_sandbox', 'Open the sandbox league first.')
    db.run('UPDATE cohorts SET end_at = ? WHERE id = ?', now, board.id)
    db.tx(() => leagues.finalizeCohort(board.id, now))
    return { cohortId: board.id }
  }

  async function friendRequest(judge, now) {
    const people = await ensureTesters(judge, now)
    const candidate = people.find((u) => !friends.areFriends(u.id, judge.id)
      && !db.get("SELECT 1 FROM friend_requests WHERE status = 'pending' AND ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?))", u.id, judge.id, judge.id, u.id)
      && !friends.isBlocked(u.id, judge.id))
    if (!candidate) fail(409, 'none_left', 'Every test account is already your friend or waiting on you.')
    friends.sendRequest(candidate, judge.id, 'profile', now)
    return { from: candidate.username }
  }

  function challenge(judge, now) {
    const friend = testers(judge.id).find((u) => friends.areFriends(u.id, judge.id))
    if (!friend) fail(409, 'no_friend', 'Accept a test account’s friend request first — challenges are between friends.')
    const view = challenges.create(friend, { format: 'xp', durationDays: 3, friendIds: [judge.id] }, now)
    return { from: friend.username, challengeId: view.id }
  }

  function reset(judge) {
    db.tx(() => {
      db.run('DELETE FROM cohorts WHERE sandbox_owner = ?', judge.id)
      db.run('DELETE FROM users WHERE sandbox_owner = ?', judge.id)
      db.run('DELETE FROM awards WHERE user_id = ?', judge.id)
      db.run('UPDATE users SET tier = 0, best_tier = 0 WHERE id = ?', judge.id)
    })
    return { status: 'reset' }
  }

  /* ── Development data (refused in production) ── */

  async function seedDevelopment(now, { count = 18 } = {}) {
    if (config.env === 'production') throw new Error('Refusing to create test accounts: LUNX_ENV is production.')
    const zones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']
    const made = []
    for (let i = 1; i <= count; i++) {
      const n = String(i).padStart(2, '0')
      if (db.get('SELECT 1 FROM users WHERE email = ?', `seed${n}@dev.lunx.invalid`)) continue
      const { user } = await signup(db, {
        email: `seed${n}@dev.lunx.invalid`,
        username: `seed${n}${randomBytes(2).toString('hex')}`,
        password: config.seedPassword,
        timezone: zones[i % zones.length],
      }, now, { seed: true })
      db.run("UPDATE users SET username = ?, username_key = ?, profile_visibility = 'everyone', tier = ? WHERE id = ?",
        `Test_Seed${n}`, `test_seed${n}`, i % 3 === 0 ? 1 : 0, user.id)
      made.push(db.get('SELECT * FROM users WHERE id = ?', user.id))
    }
    /* Each seed studies a little, through the real pipeline, at its own pace. */
    made.forEach((u, i) => {
      const lessons = 1 + (i % 4)
      for (let k = 0; k < lessons; k++) {
        const fresh = db.get('SELECT * FROM users WHERE id = ?', u.id)
        const done = activity.completedItems(u.id)
        const next = ALL_LESSONS.find((l) => !done.has(l.id) && activity.canOpen(fresh, l.id))
        if (!next) break
        const sessionId = `sd${randomBytes(6).toString('hex')}`
        const at = now - (lessons - k) * 3600000
        const events = (GRADED.get(next.id) ?? []).map((key) => ({
          id: `ev${randomBytes(8).toString('hex')}`, type: 'answer',
          payload: { key, context: 'check', sessionId, answer: answerFor(QUESTIONS.get(key).step, rand() < 0.8) },
        }))
        events.push({ id: `ev${randomBytes(8).toString('hex')}`, type: 'complete', payload: { lessonId: next.id, sessionId } })
        activity.processBatch(fresh, events, at)
      }
    })
    /* A few friendships among the seeds, so the Friends tab has something in it. */
    for (let i = 0; i + 1 < made.length; i += 3) {
      const [a, b] = made[i].id < made[i + 1].id ? [made[i], made[i + 1]] : [made[i + 1], made[i]]
      db.run('INSERT OR IGNORE INTO friendships (user_a, user_b, created_at) VALUES (?, ?, ?)', a.id, b.id, now)
    }
    return made.map((u) => u.username)
  }

  return { open, study, endWeek, friendRequest, challenge, reset, testers, activeSandbox, seedDevelopment }
}

export default { createReview, answerFor }
