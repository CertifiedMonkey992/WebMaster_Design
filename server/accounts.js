/* ═══════════════════════════════════════════════════════════════════════════
   accounts.js — ACCOUNTS ON THE LUNX SERVER
   ---------------------------------------------------------------------------
   The same account a local build keeps in the browser — an email, a
   password, a public username, a recovery code for "Forgot password?" — kept
   here instead, so it works on any device and other learners can find it.

     · passwords and recovery codes are stored only as scrypt hashes with a
       random salt each; checks run in constant time
     · a session is a random 256-bit token; the database holds only its
       SHA-256, so a copied database opens no accounts
     · five wrong passwords in a row lock the account for 30 seconds, and
       sign-in is rate-limited per address (app.js)
     · a wrong email and a wrong password get the same answer
     · every account gets a FRIEND CODE when it is created: 8 characters,
       unique (the schema enforces it), never changed
     · the email is private: it signs in, it can be searched for only if
       its owner allows it, and it is never sent to anyone else
   ═══════════════════════════════════════════════════════════════════════════ */

import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import {
  emailProblem, passwordProblem, usernameProblem, normEmail, normName,
  codeFromBytes, normalizeCode,
} from '../src/utils/accountRules.js'
import { isValidTimeZone } from '../src/utils/leagueTime.js'
import { LEAGUE } from '../src/config/leagueConfig.js'
import { fail } from './http.js'

const scrypt = promisify(scryptCb)
const KDF = { N: 16384, r: 8, p: 1, keylen: 32 }
const DAY = 86400000

export const SESSION_DAYS = 30
const MAX_FAILURES = 5
const LOCK_MS = 30 * 1000

/** The seven warm grounds an avatar can sit on (VISUAL_SYSTEM.md → Avatars). */
export const AVATARS = ['evergreen', 'clay', 'moss', 'ochre', 'berry', 'ink', 'tan']
export const VISIBILITY = ['everyone', 'friends', 'nobody']

export const newId = (prefix) => `${prefix}_${randomBytes(9).toString('base64url')}`
const sha256 = (text) => createHash('sha256').update(text).digest('hex')

/* ── Secrets ─────────────────────────────────────────────────────────────── */

export async function hashSecret(secret) {
  const salt = randomBytes(16)
  const key = await scrypt(String(secret), salt, KDF.keylen, { N: KDF.N, r: KDF.r, p: KDF.p, maxmem: 64 * 1024 * 1024 })
  return `scrypt$${KDF.N}$${KDF.r}$${KDF.p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifySecret(secret, stored) {
  const parts = String(stored ?? '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, salt, hash] = parts
  const expected = Buffer.from(hash, 'base64')
  const key = await scrypt(String(secret), Buffer.from(salt, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  })
  return expected.length === key.length && timingSafeEqual(expected, key)
}

/* A hash to compare against when the account does not exist, so a missing
   account takes as long to refuse as a wrong password. */
let decoy = null
async function spendTime(secret) {
  decoy = decoy ?? await hashSecret('lunx-decoy')
  await verifySecret(secret, decoy)
}

/* ── Sessions ────────────────────────────────────────────────────────────── */

export function createSession(db, userId, now) {
  const token = randomBytes(32).toString('base64url')
  db.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
    sha256(token), userId, now, now + SESSION_DAYS * DAY, now)
  return token
}

/** The user a bearer token belongs to, or null. Sliding: a session in use
 *  stays alive for SESSION_DAYS after its last day of use. */
export function userFromToken(db, token, now) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null
  const row = db.get('SELECT * FROM sessions WHERE token_hash = ?', sha256(token))
  if (!row) return null
  if (row.expires_at <= now) {
    db.run('DELETE FROM sessions WHERE token_hash = ?', row.token_hash)
    return null
  }
  if (now - row.last_used_at > DAY) {
    db.run('UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE token_hash = ?', now, now + SESSION_DAYS * DAY, row.token_hash)
    db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', now, row.user_id)
  }
  const user = db.get('SELECT * FROM users WHERE id = ?', row.user_id) ?? null
  /* A suspension ends every session when it starts; this is the backstop. */
  return user && isSuspended(user, now) ? null : user
}

export function deleteSession(db, token) {
  if (typeof token === 'string') db.run('DELETE FROM sessions WHERE token_hash = ?', sha256(token))
}

/* ── What leaves the server ──────────────────────────────────────────────── */

const settingsOf = (u) => ({
  profileVisibility: u.profile_visibility,
  leaguesOptIn: Boolean(u.leagues_opt_in),
  findByUsername: Boolean(u.find_by_username),
  findByEmail: Boolean(u.find_by_email),
})

/** The account, for its owner only — the one place the email appears. */
export function ownAccount(u) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    friendCode: u.friend_code,
    avatar: u.avatar,
    timezone: u.timezone,
    tier: u.tier,
    bestTier: u.best_tier,
    settings: settingsOf(u),
    createdAt: u.created_at,
    hasRecovery: Boolean(u.recovery_hash),
    isTest: Boolean(u.is_seed),
    moderator: Boolean(u.is_moderator),
  }
}

/** What anyone else may see of a learner: never the email. */
export function card(u) {
  return {
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    tier: u.tier,
    isTest: Boolean(u.is_seed),
  }
}

/* ── Validation ──────────────────────────────────────────────────────────── */

function usernameTaken(db, name, exceptId = null) {
  const row = db.get('SELECT id FROM users WHERE username_key = ?', normName(name).toLowerCase())
  return Boolean(row && row.id !== exceptId)
}

const isUnique = (error) => /UNIQUE constraint failed/.test(String(error?.message))

function newFriendCode(db) {
  for (let i = 0; i < 20; i++) {
    const code = codeFromBytes(randomBytes(8))
    if (!db.get('SELECT 1 FROM users WHERE friend_code = ?', code)) return code
  }
  fail(503, 'busy', 'Could not create a friend code. Try again.')
}

const newRecoveryCode = () => codeFromBytes(randomBytes(16))

/* ── Suspensions (moderation.js sets them) ───────────────────────────────── */

/** An indefinite suspension is stored as this far-future time. */
export const FOREVER = 8.64e15

export const isSuspended = (u, now) => u?.suspended_until != null && u.suspended_until > now

/** Refuse a suspended account, in words that say until when. A suspension
 *  that has run out is lifted here, the first time its owner comes back. */
function refuseIfSuspended(db, user, now) {
  if (user.suspended_until == null) return
  if (user.suspended_until <= now) {
    db.run('UPDATE users SET suspended_until = NULL, suspended_note = NULL WHERE id = ?', user.id)
    return
  }
  const until = user.suspended_until >= FOREVER
    ? 'This account has been suspended by a moderator.'
    : `This account is suspended until ${suspensionEnd(user.suspended_until)}.`
  fail(403, 'suspended', `${until} If you think this is a mistake, contact the team through the contact page.`, { field: 'form' })
}

/** "Tue, 20 Oct 2026 14:00 UTC" — the server's clock, said plainly. */
export const suspensionEnd = (t) => new Date(t).toUTCString().replace(/:\d\d GMT$/, ' UTC')

/* ── Reset links (by email; app.js sends them only if mail is set up) ────── */

const RESET_MINUTES = 30

/**
 * A one-time reset link's token for the account with this email, or null
 * when there is no such account (or one a link must not open: the
 * reviewer's, a test account, a suspended one). The caller answers the same
 * way either way. Earlier unused links for the account stop working.
 */
export function createResetToken(db, email, now) {
  const user = db.get('SELECT * FROM users WHERE email = ?', normEmail(email))
  if (!user || user.role === 'judge' || user.is_seed || isSuspended(user, now)) return null
  const token = randomBytes(32).toString('base64url')
  db.tx(() => {
    db.run('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?', user.id, now)
    db.run('INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
      sha256(token), user.id, now, now + RESET_MINUTES * 60000)
  })
  return { user, token, minutes: RESET_MINUTES }
}

/** Set a new password with a reset link's token. Every session ends. */
export async function resetWithToken(db, body, now) {
  const token = String(body.token ?? '')
  if (passwordProblem(body.password)) fail(400, 'invalid', passwordProblem(body.password), { field: 'password' })
  const row = token.length >= 20 && token.length <= 100
    ? db.get('SELECT * FROM password_resets WHERE token_hash = ?', sha256(token))
    : null
  if (!row || row.used_at != null || row.expires_at <= now) {
    fail(400, 'link_expired', 'This reset link has expired or has already been used. Ask for a new one.', { field: 'form' })
  }
  const user = db.get('SELECT * FROM users WHERE id = ?', row.user_id)
  refuseIfSuspended(db, user, now)
  const hash = await hashSecret(body.password)
  db.tx(() => {
    /* Spent before anything else, so two clicks of one link cannot both pass. */
    const spent = db.run('UPDATE password_resets SET used_at = ? WHERE token_hash = ? AND used_at IS NULL', now, row.token_hash)
    if (!spent.changes) fail(400, 'link_expired', 'This reset link has already been used. Ask for a new one.', { field: 'form' })
    db.run('UPDATE users SET password_hash = ?, failures = 0, locked_until = 0, last_seen_at = ? WHERE id = ?', hash, now, user.id)
    db.run('DELETE FROM password_resets WHERE user_id = ? AND token_hash <> ?', user.id, row.token_hash)
    db.run('DELETE FROM sessions WHERE user_id = ?', user.id)
  })
  return db.get('SELECT * FROM users WHERE id = ?', user.id)
}

/* ── Commands ────────────────────────────────────────────────────────────── */

export async function signup(db, body, now, { seed = false, sandboxOwner = null, role = 'learner' } = {}) {
  const email = normEmail(body.email)
  const username = normName(body.username)
  const problems = {
    email: emailProblem(email),
    username: usernameProblem(username, { required: true }),
    password: passwordProblem(body.password),
  }
  for (const [field, message] of Object.entries(problems)) if (message) fail(400, 'invalid', message, { field })
  if (db.get('SELECT 1 FROM users WHERE email = ?', email)) fail(409, 'email_taken', 'An account with this email already exists. Sign in instead.', { field: 'email' })
  if (usernameTaken(db, username)) fail(409, 'username_taken', 'That username is already taken. Try another.', { field: 'username' })

  const recoveryCode = newRecoveryCode()
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(body.password), hashSecret(normalizeCode(recoveryCode))])
  const timezone = isValidTimeZone(body.timezone) ? body.timezone : 'UTC'
  const avatar = AVATARS.includes(body.avatar) ? body.avatar : AVATARS[randomBytes(1)[0] % AVATARS.length]

  const id = newId('u')
  try {
    db.tx(() => {
      db.run(
        `INSERT INTO users (id, email, username, username_key, friend_code, role, is_seed, sandbox_owner, password_hash, recovery_hash, timezone, avatar, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, email, username, username.toLowerCase(), newFriendCode(db), role, seed ? 1 : 0, sandboxOwner,
        passwordHash, recoveryHash, timezone, avatar, now, now,
      )
    })
  } catch (error) {
    /* Two sign-ups racing for the same name or address: the schema decides. */
    if (isUnique(error) && /email/.test(error.message)) fail(409, 'email_taken', 'An account with this email already exists. Sign in instead.', { field: 'email' })
    if (isUnique(error) && /username/.test(error.message)) fail(409, 'username_taken', 'That username is already taken. Try another.', { field: 'username' })
    throw error
  }
  const user = db.get('SELECT * FROM users WHERE id = ?', id)
  return { user, recoveryCode }
}

const WRONG = 'Incorrect email or password.'

export async function signin(db, body, now) {
  const identifier = String(body.identifier ?? '').trim().toLowerCase()
  if (!identifier) fail(400, 'invalid', 'Enter your email or username.', { field: 'identifier' })
  if (!body.password) fail(400, 'invalid', 'Enter your password.', { field: 'password' })
  const user = db.get('SELECT * FROM users WHERE email = ? OR username_key = ?', identifier, identifier)
  if (!user || (user.is_seed && user.sandbox_owner)) {
    await spendTime(body.password)
    fail(401, 'wrong', WRONG, { field: 'password' })
  }
  if (user.locked_until > now) {
    const seconds = Math.ceil((user.locked_until - now) / 1000)
    fail(429, 'locked', `Too many attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`, { field: 'password', retryAfter: seconds })
  }
  const ok = await verifySecret(body.password, user.password_hash)
  if (!ok) {
    const failures = user.failures + 1
    if (failures >= MAX_FAILURES) {
      db.run('UPDATE users SET failures = 0, locked_until = ? WHERE id = ?', now + LOCK_MS, user.id)
      fail(429, 'locked', `Too many attempts. Try again in ${LOCK_MS / 1000} seconds.`, { field: 'password', retryAfter: LOCK_MS / 1000 })
    }
    db.run('UPDATE users SET failures = ? WHERE id = ?', failures, user.id)
    fail(401, 'wrong', WRONG, { field: 'password' })
  }
  db.run('UPDATE users SET failures = 0, locked_until = 0, last_seen_at = ? WHERE id = ?', now, user.id)
  /* Only after the password is right: a suspension is nobody else's business. */
  refuseIfSuspended(db, user, now)
  return db.get('SELECT * FROM users WHERE id = ?', user.id)
}

export async function resetPassword(db, body, now) {
  const email = normEmail(body.email)
  const BAD = 'That email and recovery code don’t match.'
  if (emailProblem(email)) fail(400, 'invalid', emailProblem(email), { field: 'email' })
  if (!normalizeCode(body.code)) fail(400, 'invalid', 'Enter your recovery code.', { field: 'code' })
  if (passwordProblem(body.password)) fail(400, 'invalid', passwordProblem(body.password), { field: 'password' })
  const user = db.get('SELECT * FROM users WHERE email = ?', email)
  if (!user || user.role === 'judge' || !user.recovery_hash) {
    await spendTime(normalizeCode(body.code))
    fail(400, 'mismatch', BAD, { field: 'code' })
  }
  if (user.locked_until > now) {
    const seconds = Math.ceil((user.locked_until - now) / 1000)
    fail(429, 'locked', `Too many attempts. Try again in ${seconds} seconds.`, { field: 'code', retryAfter: seconds })
  }
  if (!(await verifySecret(normalizeCode(body.code), user.recovery_hash))) {
    const failures = user.failures + 1
    if (failures >= MAX_FAILURES) db.run('UPDATE users SET failures = 0, locked_until = ? WHERE id = ?', now + LOCK_MS, user.id)
    else db.run('UPDATE users SET failures = ? WHERE id = ?', failures, user.id)
    fail(400, 'mismatch', BAD, { field: 'code' })
  }
  refuseIfSuspended(db, user, now)
  const recoveryCode = newRecoveryCode()
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(body.password), hashSecret(normalizeCode(recoveryCode))])
  db.tx(() => {
    db.run('UPDATE users SET password_hash = ?, recovery_hash = ?, failures = 0, locked_until = 0, last_seen_at = ? WHERE id = ?', passwordHash, recoveryHash, now, user.id)
    /* A reset ends every other session: whoever had the old password is out. */
    db.run('DELETE FROM sessions WHERE user_id = ?', user.id)
  })
  return { user: db.get('SELECT * FROM users WHERE id = ?', user.id), recoveryCode }
}

export async function changePassword(db, user, body, keepToken) {
  if (user.role === 'judge') fail(403, 'fixed', 'The reviewer account’s password is fixed so every judge can sign in.', { field: 'next' })
  if (passwordProblem(body.next)) fail(400, 'invalid', passwordProblem(body.next), { field: 'next' })
  if (!(await verifySecret(body.current, user.password_hash))) fail(400, 'wrong', 'Your current password is incorrect.', { field: 'current' })
  const hash = await hashSecret(body.next)
  db.tx(() => {
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', hash, user.id)
    db.run('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', user.id, sha256(String(keepToken ?? '')))
  })
}

/**
 * Change the username, avatar, time zone or privacy settings.
 * @returns {{ leftLeague: boolean }}
 */
export function updateAccount(db, user, body, now) {
  const sets = []
  const values = []
  let leftLeague = false

  if (body.username !== undefined) {
    if (user.role === 'judge') fail(403, 'fixed', 'The reviewer account’s name is fixed.', { field: 'username' })
    const name = normName(body.username)
    const problem = usernameProblem(name, { required: true })
    if (problem) fail(400, 'invalid', problem, { field: 'username' })
    if (usernameTaken(db, name, user.id)) fail(409, 'username_taken', 'That username is already taken. Try another.', { field: 'username' })
    sets.push('username = ?', 'username_key = ?')
    values.push(name, name.toLowerCase())
  }

  if (body.avatar !== undefined) {
    if (!AVATARS.includes(body.avatar)) fail(400, 'invalid', 'Choose one of the avatar colours.', { field: 'avatar' })
    sets.push('avatar = ?')
    values.push(body.avatar)
  }

  if (body.timezone !== undefined && body.timezone !== user.timezone) {
    if (!isValidTimeZone(body.timezone)) fail(400, 'invalid', 'That is not a time zone this server knows.', { field: 'timezone' })
    if (user.tz_changed_at && now - user.tz_changed_at < LEAGUE.TZ_CHANGE_DAYS * DAY) {
      fail(429, 'too_soon', `Your time zone can change once every ${LEAGUE.TZ_CHANGE_DAYS} days. A week already running keeps its time.`, { field: 'timezone' })
    }
    sets.push('timezone = ?', 'tz_changed_at = ?')
    values.push(body.timezone, now)
  }

  const s = body.settings
  if (s && typeof s === 'object') {
    if (s.profileVisibility !== undefined) {
      if (!VISIBILITY.includes(s.profileVisibility)) fail(400, 'invalid', 'Choose who can see your profile.', { field: 'profileVisibility' })
      sets.push('profile_visibility = ?')
      values.push(s.profileVisibility)
    }
    for (const [key, column] of [['leaguesOptIn', 'leagues_opt_in'], ['findByUsername', 'find_by_username'], ['findByEmail', 'find_by_email']]) {
      if (s[key] === undefined) continue
      if (typeof s[key] !== 'boolean') fail(400, 'invalid', 'Settings are on or off.', { field: key })
      sets.push(`${column} = ?`)
      values.push(s[key] ? 1 : 0)
    }
    leftLeague = s.leaguesOptIn === false && Boolean(user.leagues_opt_in)
  }

  if (!sets.length) return { leftLeague: false }
  db.tx(() => {
    db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...values, user.id)
    /* Leaving the leagues takes the learner off this week's board at once
       (Duolingo's "make my profile private" does the same). */
    if (leftLeague) {
      db.run(`DELETE FROM cohort_members WHERE user_id = ? AND cohort_id IN (SELECT id FROM cohorts WHERE finalized_at IS NULL)`, user.id)
    }
  })
  return { leftLeague }
}

export async function deleteAccount(db, user, body) {
  if (user.role === 'judge') fail(403, 'fixed', 'The reviewer account cannot be removed.')
  if (!(await verifySecret(body.password, user.password_hash))) fail(400, 'wrong', 'That password is incorrect.', { field: 'password' })
  removeAccount(db, user.id)
}

/** Delete an account and every row that belongs to it (the schema cascades).
 *  Reports and the moderation log keep the username, so they still read. */
export function removeAccount(db, userId) {
  db.tx(() => {
    db.run('UPDATE reports SET reported_name = (SELECT username FROM users WHERE id = ?) WHERE reported = ?', userId, userId)
    db.run('UPDATE moderation_log SET target_name = COALESCE(target_name, (SELECT username FROM users WHERE id = ?)) WHERE target = ?', userId, userId)
    db.run('DELETE FROM users WHERE id = ?', userId)
  })
}

/**
 * The reviewer's account (config.judge), created on start-up if it is not
 * there, with the published credentials re-asserted so nobody on a shared
 * server can lock judges out. Its progress is never touched.
 */
export async function ensureJudge(db, config, now) {
  if (!config.judge?.enabled) return null
  const email = normEmail(config.judge.email)
  let user = db.get('SELECT * FROM users WHERE email = ?', email)
  if (!user) {
    /* Seeded, not registered: its username is reserved for everyone else and
       its password is the short one printed for judges, so it is written
       directly rather than through the sign-up rules. */
    const id = newId('u')
    db.run(
      `INSERT INTO users (id, email, username, username_key, friend_code, role, password_hash, timezone, avatar, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, 'judge', ?, ?, 'clay', ?, ?)`,
      id, email, config.judge.username, config.judge.username.toLowerCase(), newFriendCode(db),
      await hashSecret(config.judge.password), isValidTimeZone(config.judge.timezone) ? config.judge.timezone : 'UTC', now, now,
    )
    return db.get('SELECT * FROM users WHERE id = ?', id)
  }
  if (!(await verifySecret(config.judge.password, user.password_hash))) {
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', await hashSecret(config.judge.password), user.id)
  }
  db.run("UPDATE users SET role = 'judge', failures = 0, locked_until = 0 WHERE id = ?", user.id)
  return db.get('SELECT * FROM users WHERE id = ?', user.id)
}

export default {
  AVATARS, VISIBILITY, newId, hashSecret, verifySecret, createSession, userFromToken, deleteSession,
  ownAccount, card, signup, signin, resetPassword, changePassword, updateAccount, deleteAccount, ensureJudge,
  removeAccount, createResetToken, resetWithToken, isSuspended, suspensionEnd, FOREVER,
}
