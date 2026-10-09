/* ═══════════════════════════════════════════════════════════════════════════
   accountService.js — ACCOUNTS
   ---------------------------------------------------------------------------
   Signing in is required to use the course. An account is an email address,
   a password and an optional username, and it keeps one learner's progress
   apart from everyone else's on the same browser.

   LunX has no server, so accounts live in this browser (localStorage) and
   nothing is transmitted. Within that, this file does what a real sign-in
   does:

     · passwords are never stored. Each is run through PBKDF2-SHA256 with
       600,000 iterations and a random per-account salt (Web Crypto), and
       only the result is kept
     · a sign-in is checked against that hash, and five wrong passwords in
       a row lock the account for 30 seconds
     · "Forgot password?" works with a one-time RECOVERY CODE shown when the
       account is created (there is no email server to send a link), stored
       hashed the same way
     · the email is private: it is used to sign in and shown only on the
       account's own settings. The username is the public-facing name

   What it cannot do without a server, and the sign-in page says so: protect
   progress from someone with access to this browser's storage, or carry an
   account to another device (the Profile page's backup file does that).

   Each account owns a progress key of its own (`progressKey`), which
   storageService reads and writes. The original, unsuffixed key held the
   progress of anyone who used LunX before accounts were required; the first
   account created on a browser adopts it, so nobody loses a streak.
   ═══════════════════════════════════════════════════════════════════════════ */

import { STORAGE_KEY } from '../config/progressionConfig'
import { JUDGE_LOGIN } from '../config/judgeConfig'

export const ACCOUNTS_KEY = 'lunx_accounts_v1'
/** The stable id of the seeded reviewer account. */
export const JUDGE_ID = 'judge'

const BOOK_VERSION = 2

export const PASSWORD_MIN = 8
const PASSWORD_MAX = 128
export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
const EMAIL_MAX = 254

/** PBKDF2 work factor (OWASP's 2023 figure for PBKDF2-HMAC-SHA256). */
const ITERATIONS = 600000
/** Wrong passwords allowed in a row before a short lock. */
const MAX_FAILURES = 5
const LOCK_MS = 30 * 1000

/** Usernames nobody may take, because the product already uses them. */
const RESERVED = new Set(['judge', 'tsa_judge', 'admin', 'administrator', 'guest', 'lunx', 'moderator', 'support', 'root', 'system'])
/* A short list of words a school product should not show as someone's name.
   Matched anywhere in the username, case-insensitively. */
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigg', 'fag', 'slut', 'whore', 'rape', 'nazi', 'hitler', 'porn', 'sex']

/* ── Validation ──────────────────────────────────────────────────────────── */

const normEmail = (v) => String(v ?? '').trim().toLowerCase()
const normName = (v) => String(v ?? '').trim()

/** An error message for an email address, or null when it is usable. */
export function validateEmail(value) {
  const email = normEmail(value)
  if (!email) return 'Enter your email address.'
  if (email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address, like name@school.edu.'
  return null
}

/** An error message for a new password, or null when it is acceptable. */
export function validatePassword(value) {
  const password = String(value ?? '')
  if (!password) return 'Enter a password.'
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`
  return null
}

/**
 * An error message for a username, or null when it is acceptable and free.
 * An empty username is allowed — it is optional.
 * @param {string} value
 * @param {{ exceptId?: string|null, book?: any }} [opts]
 */
export function validateUsername(value, { exceptId = null, book = null } = {}) {
  const name = normName(value)
  if (!name) return null
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) return `Use ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  if (!/^[A-Za-z0-9_]+$/.test(name)) return 'Use only letters, numbers and underscores.'
  const key = name.toLowerCase()
  if (RESERVED.has(key)) return 'That username is reserved. Try another.'
  if (BLOCKED.some((w) => key.includes(w))) return 'Please choose a different username.'
  const taken = (book ?? readBook()).accounts.some((a) => a.id !== exceptId && a.username && a.username.toLowerCase() === key)
  if (taken) return 'That username is already taken. Try another.'
  return null
}

/* ── Hashing (Web Crypto) ────────────────────────────────────────────────── */

const subtle = () => globalThis.crypto?.subtle ?? null

function toBase64(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromBase64(text) {
  const s = atob(text)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

function randomBytes(n) {
  const out = new Uint8Array(n)
  globalThis.crypto.getRandomValues(out)
  return out
}

/** PBKDF2-SHA256 → { iterations, salt, hash } (salt and hash in base64). */
export async function hashSecret(secret, { salt = null, iterations = ITERATIONS } = {}) {
  const api = subtle()
  if (!api) throw new Error('This browser cannot hash passwords (Web Crypto is unavailable).')
  const saltBytes = salt ? fromBase64(salt) : randomBytes(16)
  const key = await api.importKey('raw', new TextEncoder().encode(String(secret)), 'PBKDF2', false, ['deriveBits'])
  const bits = await api.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256)
  return { iterations, salt: toBase64(saltBytes), hash: toBase64(new Uint8Array(bits)) }
}

/** Compare two strings without stopping at the first difference. */
function sameText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifySecret(secret, record) {
  if (!record?.salt || !record?.hash) return false
  const { hash } = await hashSecret(secret, { salt: record.salt, iterations: record.iterations })
  return sameText(hash, record.hash)
}

/* The digest profiles used before accounts had real passwords (book v1). It
   is read only to let such a profile sign in once, after which its password
   is re-hashed with PBKDF2 and the digest is dropped. */
function legacyDigest(text) {
  const input = `lunx.v1:${String(text ?? '')}`
  let a = 0x811c9dc5
  let b = 0x01000193
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    a = Math.imul(a ^ c, 0x01000193)
    b = Math.imul(b ^ (c + i), 0x85ebca6b)
  }
  return ((a >>> 0).toString(36) + (b >>> 0).toString(36)).padStart(8, '0')
}

/* ── Recovery codes ──────────────────────────────────────────────────────────
   16 characters from Crockford's base-32 alphabet (no I, L, O or U, so
   nothing reads as something else), shown as four groups of four: 80 bits.
   ─────────────────────────────────────────────────────────────────────────── */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function newRecoveryCode() {
  const bytes = randomBytes(16)
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % 32])
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join('')).join('-')
}

/** Uppercase, drop separators, and read the look-alikes as what they mean. */
export function normalizeRecoveryCode(text) {
  return String(text ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
}

/* ── Storage ─────────────────────────────────────────────────────────────── */

function getStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const probe = '__lunx_accounts_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isSecret = (r) => isObj(r) && typeof r.salt === 'string' && typeof r.hash === 'string' && Number.isFinite(r.iterations)

function emptyBook() {
  return { version: BOOK_VERSION, accounts: [], sessionId: null }
}

/**
 * Read the account book, repair anything malformed, upgrade profiles from
 * book v1, and make sure the reviewer's account exists. A browser that
 * cannot store anything still gets a valid book back — it simply does not
 * persist, and `available` is false.
 */
export function readBook() {
  const store = getStorage()
  if (!store) return { ...emptyBook(), accounts: [judgeAccount()], available: false }

  let parsed = null
  try { parsed = JSON.parse(store.getItem(ACCOUNTS_KEY) ?? 'null') } catch { parsed = null }

  const book = emptyBook()
  if (isObj(parsed)) {
    if (Array.isArray(parsed.accounts)) {
      book.accounts = parsed.accounts.filter((a) => isObj(a) && typeof a.id === 'string').map(cleanAccount).filter(Boolean)
    }
    if (typeof parsed.sessionId === 'string') book.sessionId = parsed.sessionId
  }

  /* The reviewer's account is seeded, not registered: it is put back if it
     was never there or was removed, and its sign-in details are re-asserted
     so nobody on a shared computer can lock judges out. Its progress is not
     touched. */
  const judge = judgeAccount()
  const at = book.accounts.findIndex((a) => a.id === JUDGE_ID)
  if (at < 0) book.accounts.unshift(judge)
  else book.accounts[at] = { ...book.accounts[at], ...judge, createdAt: book.accounts[at].createdAt, lastSeenAt: book.accounts[at].lastSeenAt }

  if (book.sessionId && !book.accounts.some((a) => a.id === book.sessionId)) book.sessionId = null

  book.available = true
  return book
}

function writeBook(book) {
  const store = getStorage()
  if (!store) return false
  try {
    store.setItem(ACCOUNTS_KEY, JSON.stringify({
      version: BOOK_VERSION,
      accounts: book.accounts.map(cleanAccount).filter(Boolean),
      sessionId: book.sessionId ?? null,
    }))
    return true
  } catch {
    return false
  }
}

/**
 * One account record, whatever came in. Book v1 profiles ({ name, handle,
 * digest }) are carried over: a handle that is an email becomes the email,
 * one that is a valid username becomes the username, and the old digest is
 * kept only until the first successful sign-in replaces it.
 */
function cleanAccount(a) {
  const legacy = typeof a.handle === 'string' && !('password' in a)
  let email = typeof a.email === 'string' ? normEmail(a.email) : null
  let username = typeof a.username === 'string' ? normName(a.username) : null
  if (legacy) {
    const handle = normName(a.handle)
    if (handle.includes('@')) email = normEmail(handle)
    else if (/^[A-Za-z0-9_]{3,20}$/.test(handle)) username = handle
  }
  if (!email && !username) return null
  return {
    id: String(a.id),
    role: a.role === 'judge' ? 'judge' : 'learner',
    email: email || null,
    username: username || null,
    password: isSecret(a.password) ? { iterations: a.password.iterations, salt: a.password.salt, hash: a.password.hash } : null,
    recovery: isSecret(a.recovery) ? { iterations: a.recovery.iterations, salt: a.recovery.salt, hash: a.recovery.hash } : null,
    legacyDigest: typeof a.legacyDigest === 'string' ? a.legacyDigest : (legacy && typeof a.digest === 'string' ? a.digest : null),
    failures: Math.max(0, Math.floor(Number(a.failures) || 0)),
    lockedUntil: Number.isFinite(a.lockedUntil) ? a.lockedUntil : 0,
    createdAt: Number.isFinite(a.createdAt) ? a.createdAt : Date.now(),
    lastSeenAt: Number.isFinite(a.lastSeenAt) ? a.lastSeenAt : 0,
  }
}

function judgeAccount() {
  return {
    id: JUDGE_ID,
    role: 'judge',
    email: JUDGE_LOGIN.email,
    username: JUDGE_LOGIN.username,
    password: { ...JUDGE_LOGIN.hash },
    recovery: null,
    legacyDigest: null,
    failures: 0,
    lockedUntil: 0,
    createdAt: 0,
    lastSeenAt: 0,
  }
}

/** What the rest of the app is given: never a hash, salt or digest. */
export function publicAccount(a) {
  if (!a) return null
  return {
    id: a.id,
    role: a.role,
    email: a.email,
    username: a.username,
    createdAt: a.createdAt,
    hasRecovery: Boolean(a.recovery),
  }
}

/** The name to show for an account: its username, never its email. */
export function displayName(account) {
  return account?.username || 'Learner'
}

/* ── Progress keys ───────────────────────────────────────────────────────── */

/**
 * The storage key holding an account's progress. `null` is the original,
 * unsuffixed key, used before accounts were required.
 */
export function progressKey(accountId) {
  return accountId ? `${STORAGE_KEY}__${accountId}` : STORAGE_KEY
}

/* ── Queries ─────────────────────────────────────────────────────────────── */

/** The signed-in account (public fields only), or null. */
export function currentAccount() {
  const book = readBook()
  return publicAccount(book.accounts.find((a) => a.id === book.sessionId) ?? null)
}

/** Find an account by email or username. */
function findAccount(book, identifier) {
  const id = String(identifier ?? '').trim().toLowerCase()
  if (!id) return null
  return book.accounts.find((a) => a.email === id || (a.username && a.username.toLowerCase() === id)) ?? null
}

/* ── Commands ────────────────────────────────────────────────────────────────
   Each returns { ok, account } or { ok: false, error, field }. The error
   strings are written to be shown to a reader as they are. The ones that
   hash are async; the rest are not.
   ─────────────────────────────────────────────────────────────────────────── */

const WRONG = 'Incorrect email or password.'

/** Check an email (or username) and password, and open a session. */
export async function signIn({ identifier, password }, now = Date.now()) {
  if (!String(identifier ?? '').trim()) return { ok: false, field: 'identifier', error: 'Enter your email or username.' }
  if (!password) return { ok: false, field: 'password', error: 'Enter your password.' }

  const before = readBook()
  const found = findAccount(before, identifier)
  if (!found) {
    /* Spend the same time as a real check, so a wrong address and a wrong
       password are indistinguishable from the outside. */
    await hashSecret(password).catch(() => {})
    return { ok: false, field: 'password', error: WRONG }
  }
  if (found.lockedUntil > now) {
    const seconds = Math.ceil((found.lockedUntil - now) / 1000)
    return { ok: false, field: 'password', error: `Too many attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.` }
  }

  let ok = false
  let upgrade = null
  if (found.password) {
    ok = await verifySecret(password, found.password)
  } else if (found.legacyDigest) {
    ok = sameText(legacyDigest(password), found.legacyDigest)
    if (ok) upgrade = await hashSecret(password)
  }

  /* Re-read after the await: another tab may have written meanwhile. */
  const book = readBook()
  const account = book.accounts.find((a) => a.id === found.id)
  if (!account) return { ok: false, field: 'password', error: WRONG }

  if (!ok) {
    account.failures += 1
    if (account.failures >= MAX_FAILURES) {
      account.failures = 0
      account.lockedUntil = now + LOCK_MS
      writeBook(book)
      return { ok: false, field: 'password', error: `Too many attempts. Try again in ${LOCK_MS / 1000} seconds.` }
    }
    writeBook(book)
    return { ok: false, field: 'password', error: WRONG }
  }

  if (upgrade) { account.password = upgrade; account.legacyDigest = null }
  account.failures = 0
  account.lockedUntil = 0
  account.lastSeenAt = now
  book.sessionId = account.id
  writeBook(book)
  return { ok: true, account: publicAccount(account) }
}

/**
 * Register an account on this browser and sign into it. Returns the
 * recovery code ONCE — it is stored only as a hash.
 */
export async function createAccount({ email, password, username = '' }, now = Date.now()) {
  const emailError = validateEmail(email)
  if (emailError) return { ok: false, field: 'email', error: emailError }
  const nameError = validateUsername(username)
  if (nameError) return { ok: false, field: 'username', error: nameError }
  const passError = validatePassword(password)
  if (passError) return { ok: false, field: 'password', error: passError }

  const address = normEmail(email)
  if (readBook().accounts.some((a) => a.email === address)) {
    return { ok: false, field: 'email', error: 'An account with this email already exists on this device. Sign in instead.' }
  }

  const code = newRecoveryCode()
  const [passwordHash, recoveryHash] = await Promise.all([
    hashSecret(password),
    hashSecret(normalizeRecoveryCode(code)),
  ])

  /* Re-check against a fresh read: another tab may have registered the same
     email or username while the hashes were being computed. */
  const book = readBook()
  if (book.accounts.some((a) => a.email === address)) {
    return { ok: false, field: 'email', error: 'An account with this email already exists on this device. Sign in instead.' }
  }
  const lateNameError = validateUsername(username, { book })
  if (lateNameError) return { ok: false, field: 'username', error: lateNameError }

  const account = cleanAccount({
    id: `u${now.toString(36)}${toBase64(randomBytes(6)).replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 6)}`,
    role: 'learner',
    email: address,
    username: normName(username) || null,
    password: passwordHash,
    recovery: recoveryHash,
    createdAt: now,
    lastSeenAt: now,
  })

  /* The first account on a browser inherits whatever was done there before
     sign-in was required — same person, same machine. */
  if (!book.accounts.some((a) => a.role === 'learner')) adoptEarlierProgress(account.id)

  book.accounts.push(account)
  book.sessionId = account.id
  writeBook(book)
  return { ok: true, account: publicAccount(account), recoveryCode: code }
}

/**
 * "Forgot password?": an email, the account's recovery code and a new
 * password. On success the old code is spent and a new one is returned.
 */
export async function resetPassword({ email, code, password }, now = Date.now()) {
  const emailError = validateEmail(email)
  if (emailError) return { ok: false, field: 'email', error: emailError }
  if (!normalizeRecoveryCode(code)) return { ok: false, field: 'code', error: 'Enter your recovery code.' }
  const passError = validatePassword(password)
  if (passError) return { ok: false, field: 'password', error: passError }

  const found = readBook().accounts.find((a) => a.email === normEmail(email))
  const BAD = 'That email and recovery code don’t match.'
  if (!found || found.role === 'judge' || !found.recovery) {
    await hashSecret(normalizeRecoveryCode(code)).catch(() => {})
    return { ok: false, field: 'code', error: BAD }
  }
  if (found.lockedUntil > now) {
    const seconds = Math.ceil((found.lockedUntil - now) / 1000)
    return { ok: false, field: 'code', error: `Too many attempts. Try again in ${seconds} seconds.` }
  }

  const ok = await verifySecret(normalizeRecoveryCode(code), found.recovery)
  const book = readBook()
  const account = book.accounts.find((a) => a.id === found.id)
  if (!account) return { ok: false, field: 'code', error: BAD }
  if (!ok) {
    account.failures += 1
    if (account.failures >= MAX_FAILURES) { account.failures = 0; account.lockedUntil = now + LOCK_MS }
    writeBook(book)
    return { ok: false, field: 'code', error: BAD }
  }

  const next = newRecoveryCode()
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(password), hashSecret(normalizeRecoveryCode(next))])
  const fresh = readBook()
  const target = fresh.accounts.find((a) => a.id === found.id)
  if (!target) return { ok: false, field: 'code', error: BAD }
  target.password = passwordHash
  target.recovery = recoveryHash
  target.legacyDigest = null
  target.failures = 0
  target.lockedUntil = 0
  target.lastSeenAt = now
  fresh.sessionId = target.id
  writeBook(fresh)
  return { ok: true, account: publicAccount(target), recoveryCode: next }
}

/** Change the signed-in account's password, given the current one. */
export async function changePassword(accountId, { current, next }) {
  const found = readBook().accounts.find((a) => a.id === accountId)
  if (!found) return { ok: false, field: 'current', error: 'You are not signed in.' }
  if (found.role === 'judge') return { ok: false, field: 'next', error: 'The reviewer account’s password is fixed so every judge can sign in.' }
  const passError = validatePassword(next)
  if (passError) return { ok: false, field: 'next', error: passError }
  const ok = found.password ? await verifySecret(current, found.password) : sameText(legacyDigest(current), found.legacyDigest ?? '')
  if (!ok) return { ok: false, field: 'current', error: 'Your current password is incorrect.' }
  const hash = await hashSecret(next)
  const book = readBook()
  const account = book.accounts.find((a) => a.id === accountId)
  if (!account) return { ok: false, field: 'current', error: 'You are not signed in.' }
  account.password = hash
  account.legacyDigest = null
  writeBook(book)
  return { ok: true, account: publicAccount(account) }
}

/** Set or clear the username (the public-facing name). */
export function updateUsername(accountId, username) {
  const book = readBook()
  const account = book.accounts.find((a) => a.id === accountId)
  if (!account) return { ok: false, field: 'username', error: 'You are not signed in.' }
  if (account.role === 'judge') return { ok: false, field: 'username', error: 'The reviewer account’s name is fixed.' }
  const error = validateUsername(username, { exceptId: accountId, book })
  if (error) return { ok: false, field: 'username', error }
  if (!normName(username) && !account.email) return { ok: false, field: 'username', error: 'This account signs in with its username, so it needs one.' }
  account.username = normName(username) || null
  writeBook(book)
  return { ok: true, account: publicAccount(account) }
}

/** Close the session. */
export function signOut() {
  const book = readBook()
  book.sessionId = null
  writeBook(book)
  return { ok: true, account: null }
}

/**
 * Delete an account and the progress stored under it. The reviewer's
 * account can be emptied but not removed — it is seeded, so it would come
 * straight back and the button would look broken.
 */
export function forgetAccount(accountId) {
  if (!accountId || accountId === JUDGE_ID) return { ok: false, error: 'The reviewer account cannot be removed.' }
  const book = readBook()
  book.accounts = book.accounts.filter((a) => a.id !== accountId)
  if (book.sessionId === accountId) book.sessionId = null
  const store = getStorage()
  try { store?.removeItem(progressKey(accountId)) } catch { /* ignore */ }
  writeBook(book)
  return { ok: true, account: null }
}

/** Copy the progress saved before accounts were required under a new key. */
function adoptEarlierProgress(accountId) {
  const store = getStorage()
  if (!store) return false
  try {
    const earlier = store.getItem(progressKey(null))
    if (!earlier) return false
    /* Never overwrite progress the account already has. */
    if (store.getItem(progressKey(accountId))) return false
    store.setItem(progressKey(accountId), earlier)
    return true
  } catch {
    return false
  }
}

export default {
  ACCOUNTS_KEY, JUDGE_ID,
  readBook, currentAccount, publicAccount, displayName,
  signIn, createAccount, resetPassword, changePassword, updateUsername, signOut, forgetAccount,
  validateEmail, validatePassword, validateUsername, normalizeRecoveryCode,
  progressKey, hashSecret,
}
