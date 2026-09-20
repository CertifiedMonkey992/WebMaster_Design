/* ═══════════════════════════════════════════════════════════════════════════
   accountService.js — LOCAL PROFILES
   ---------------------------------------------------------------------------
   An account here is a NAME ON A SHELF, not a login to a server. There is no
   backend, nothing is transmitted, and nothing is verified by anybody: an
   account is a way to keep two people's progress apart on one browser, and a
   way for a TSA judge to pick up a profile that already has everything
   unlocked.

   Because of that, this file is deliberately honest about what it is:

     · it stores a DIGEST of the passphrase rather than the passphrase, so a
       casual look at localStorage does not read it back — that is
       obfuscation, not security, and the sign-in page says so in as many
       words
     · it never asks for anything it does not need: a display name, a handle
       and a passphrase, no date of birth, no school, no email verification
     · everything it writes stays under two keys in this browser and is
       removed by "Sign out and forget this profile", or by clearing site
       data

   Each account owns a progress key of its own (`progressKey`), which
   storageService reads and writes. Signing out returns to the guest profile,
   which is the key the product used before accounts existed — so a visitor
   who never signs in is completely unaffected by this file.
   ═══════════════════════════════════════════════════════════════════════════ */

import { STORAGE_KEY } from '../config/progressionConfig'
import { JUDGE_LOGIN } from '../config/judgeConfig'

export const ACCOUNTS_KEY = 'lunx_accounts_v1'
/** The stable id of the seeded reviewer profile. */
export const JUDGE_ID = 'judge'

/** Handles nobody may register, because the product already uses them. */
const RESERVED = new Set([JUDGE_LOGIN.handle.toLowerCase(), 'judge', 'guest', 'admin'])

const MAX_NAME = 40
const MAX_HANDLE = 60
const MIN_PASS = 4

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

function emptyBook() {
  return { version: 1, accounts: [], sessionId: null }
}

/**
 * Read the account book, repair anything malformed, and make sure the
 * reviewer's profile exists. A browser that cannot store anything still gets
 * a valid book back — it simply does not persist, and `available` is false.
 */
export function readBook() {
  const store = getStorage()
  if (!store) return { ...emptyBook(), accounts: [judgeAccount()], available: false }

  let parsed = null
  try { parsed = JSON.parse(store.getItem(ACCOUNTS_KEY) ?? 'null') } catch { parsed = null }

  const book = emptyBook()
  if (isObj(parsed)) {
    if (Array.isArray(parsed.accounts)) book.accounts = parsed.accounts.filter(isValidAccount).map(cleanAccount)
    if (typeof parsed.sessionId === 'string') book.sessionId = parsed.sessionId
  }

  /* The reviewer's profile is seeded, not registered: it is put back if it
     was never there, or if someone removed it. Its progress is not touched. */
  if (!book.accounts.some((a) => a.id === JUDGE_ID)) book.accounts.unshift(judgeAccount())

  /* A session pointing at an account that is gone is no session. */
  if (book.sessionId && !book.accounts.some((a) => a.id === book.sessionId)) book.sessionId = null

  book.available = true
  return book
}

function writeBook(book) {
  const store = getStorage()
  if (!store) return false
  try {
    store.setItem(ACCOUNTS_KEY, JSON.stringify({
      version: 1,
      accounts: book.accounts.map(cleanAccount),
      sessionId: book.sessionId ?? null,
    }))
    return true
  } catch {
    return false
  }
}

function isValidAccount(a) {
  return isObj(a) && typeof a.id === 'string' && typeof a.handle === 'string' && a.handle.length > 0
}

function cleanAccount(a) {
  return {
    id: String(a.id),
    name: String(a.name ?? '').slice(0, MAX_NAME) || 'Learner',
    handle: String(a.handle).toLowerCase().slice(0, MAX_HANDLE),
    digest: typeof a.digest === 'string' ? a.digest : '',
    role: a.role === 'judge' ? 'judge' : 'learner',
    createdAt: Number.isFinite(a.createdAt) ? a.createdAt : Date.now(),
    lastSeenAt: Number.isFinite(a.lastSeenAt) ? a.lastSeenAt : 0,
  }
}

function judgeAccount() {
  return {
    id: JUDGE_ID,
    name: JUDGE_LOGIN.name,
    handle: JUDGE_LOGIN.handle.toLowerCase(),
    digest: digest(JUDGE_LOGIN.password),
    role: 'judge',
    createdAt: 0,
    lastSeenAt: 0,
  }
}

/* ── The digest ──────────────────────────────────────────────────────────────
   Two 32-bit FNV-1a lanes over a prefixed string, printed in base 36. It
   exists so a passphrase is not sitting in localStorage in plain sight; it
   is NOT a password hash — it is fast, it is not salted per profile, and it
   would not survive anyone who cared. Nothing in LunX is protected by it:
   every profile's data is already on this machine and reachable with the
   browser's own tools. The sign-in page says this out loud.
   ─────────────────────────────────────────────────────────────────────────── */
export function digest(text) {
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

/* ── Progress keys ───────────────────────────────────────────────────────── */

/**
 * The storage key holding a profile's progress. The guest profile keeps the
 * original key, so a visitor who never signs in loses nothing and notices
 * nothing.
 */
export function progressKey(accountId) {
  return accountId ? `${STORAGE_KEY}__${accountId}` : STORAGE_KEY
}

/* ── Queries ─────────────────────────────────────────────────────────────── */

/** The signed-in account, or null for the guest profile. */
export function currentAccount() {
  const book = readBook()
  return book.accounts.find((a) => a.id === book.sessionId) ?? null
}

export function listAccounts() {
  return readBook().accounts
}

export function findByHandle(handle) {
  const key = String(handle ?? '').trim().toLowerCase()
  return readBook().accounts.find((a) => a.handle === key) ?? null
}

/* ── Commands ────────────────────────────────────────────────────────────────
   Each returns { ok, account } or { ok: false, error, field }. The error
   strings are written to be shown to a reader as they are.
   ─────────────────────────────────────────────────────────────────────────── */

/** Check a handle and passphrase against the book and open a session. */
export function signIn({ handle, password }) {
  const key = String(handle ?? '').trim().toLowerCase()
  if (!key) return { ok: false, field: 'handle', error: 'Enter the name or email you signed up with.' }
  if (!password) return { ok: false, field: 'password', error: 'Enter your passphrase.' }

  const book = readBook()
  const account = book.accounts.find((a) => a.handle === key || a.name.toLowerCase() === key)
  if (!account) {
    return { ok: false, field: 'handle', error: 'No profile on this browser uses that name. Create one below.' }
  }
  if (account.digest !== digest(password)) {
    return { ok: false, field: 'password', error: 'That passphrase does not match this profile.' }
  }

  account.lastSeenAt = Date.now()
  book.sessionId = account.id
  writeBook(book)
  return { ok: true, account }
}

/**
 * Register a profile on this browser and sign into it.
 * `adopt` copies whatever the guest profile has done so far into the new
 * account, because it is the same person on the same machine and losing a
 * streak to a sign-up would be a bad trade.
 */
export function createAccount({ name, handle, password, adopt = true }) {
  const displayName = String(name ?? '').trim().slice(0, MAX_NAME)
  const key = String(handle ?? '').trim().toLowerCase().slice(0, MAX_HANDLE)

  if (displayName.length < 2) return { ok: false, field: 'name', error: 'Give the profile a name of at least two characters.' }
  if (!key) return { ok: false, field: 'handle', error: 'Choose an email or username for this profile.' }
  if (/\s/.test(key)) return { ok: false, field: 'handle', error: 'A username cannot contain spaces.' }
  if (RESERVED.has(key)) return { ok: false, field: 'handle', error: 'That one is reserved for the reviewer profile.' }
  if (String(password ?? '').length < MIN_PASS) {
    return { ok: false, field: 'password', error: `Use at least ${MIN_PASS} characters.` }
  }

  const book = readBook()
  if (book.accounts.some((a) => a.handle === key)) {
    return { ok: false, field: 'handle', error: 'This browser already has a profile with that name. Sign in instead.' }
  }

  const account = cleanAccount({
    id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: displayName,
    handle: key,
    digest: digest(password),
    role: 'learner',
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
  })

  if (adopt) adoptGuestProgress(account.id)

  book.accounts.push(account)
  book.sessionId = account.id
  writeBook(book)
  return { ok: true, account }
}

/** Close the session and return to the guest profile. */
export function signOut() {
  const book = readBook()
  book.sessionId = null
  writeBook(book)
  return { ok: true, account: null }
}

/**
 * Remove a profile and the progress stored under it. The reviewer's profile
 * can be emptied but not removed — it is seeded, so it would come straight
 * back and the button would look broken.
 */
export function forgetAccount(accountId) {
  if (!accountId || accountId === JUDGE_ID) return { ok: false, error: 'The reviewer profile cannot be removed.' }
  const book = readBook()
  book.accounts = book.accounts.filter((a) => a.id !== accountId)
  if (book.sessionId === accountId) book.sessionId = null
  const store = getStorage()
  try { store?.removeItem(progressKey(accountId)) } catch { /* ignore */ }
  writeBook(book)
  return { ok: true, account: null }
}

/** Copy the guest profile's saved progress under a new account's key. */
function adoptGuestProgress(accountId) {
  const store = getStorage()
  if (!store) return false
  try {
    const guest = store.getItem(progressKey(null))
    if (!guest) return false
    /* Never overwrite progress the account already has. */
    if (store.getItem(progressKey(accountId))) return false
    store.setItem(progressKey(accountId), guest)
    return true
  } catch {
    return false
  }
}

export default {
  ACCOUNTS_KEY, JUDGE_ID,
  readBook, listAccounts, currentAccount, findByHandle,
  signIn, createAccount, signOut, forgetAccount,
  progressKey, digest,
}
