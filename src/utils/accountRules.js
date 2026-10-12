/* ═══════════════════════════════════════════════════════════════════════════
   accountRules.js — WHAT AN ACCOUNT MAY BE
   ---------------------------------------------------------------------------
   The validation every account obeys, wherever it lives: in the browser
   (services/accountService.js, a local build) or on the LunX server
   (server/accounts.js, a connected build). One set of rules, one set of
   messages, so the sign-in page says the same thing either way.

   Pure: no storage, no network, no DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const EMAIL_MAX = 254

/** Usernames nobody may take, because the product already uses them. */
export const RESERVED = new Set(['judge', 'tsa_judge', 'admin', 'administrator', 'guest', 'lunx', 'moderator', 'support', 'root', 'system', 'learner', 'test_account'])

/* A short list of words a school product should not show as someone's name.
   Matched anywhere in the username, case-insensitively. */
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigg', 'fag', 'slut', 'whore', 'rape', 'nazi', 'hitler', 'porn', 'sex']

/** @param {unknown} v */
export const normEmail = (v) => String(v ?? '').trim().toLowerCase()
/** @param {unknown} v */
export const normName = (v) => String(v ?? '').trim()

/** An error message for an email address, or null when it is usable.
 *  @param {unknown} value */
export function emailProblem(value) {
  const email = normEmail(value)
  if (!email) return 'Enter your email address.'
  if (email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address, like name@school.edu.'
  return null
}

/** An error message for a new password, or null when it is acceptable.
 *  @param {unknown} value */
export function passwordProblem(value) {
  const password = String(value ?? '')
  if (!password) return 'Enter a password.'
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`
  return null
}

/**
 * An error message for a username's FORM (not whether it is free), or null.
 * @param {unknown} value
 * @param {{ required?: boolean }} [opts]  a connected build requires one
 */
export function usernameProblem(value, { required = false } = {}) {
  const name = normName(value)
  if (!name) return required ? 'Choose a username — it is how friends and leagues show you.' : null
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) return `Use ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  if (!/^[A-Za-z0-9_]+$/.test(name)) return 'Use only letters, numbers and underscores.'
  const key = name.toLowerCase()
  if (RESERVED.has(key)) return 'That username is reserved. Try another.'
  /* Test accounts (development seeds, the reviewer's sandbox) are named
     Test_…, so a real learner can never be mistaken for one. */
  if (key.startsWith('test_')) return 'Usernames starting with “Test_” are kept for test accounts.'
  if (BLOCKED.some((w) => key.includes(w))) return 'Please choose a different username.'
  return null
}

/* ── Codes ───────────────────────────────────────────────────────────────────
   Crockford's base-32 alphabet: no I, L, O or U, so nothing reads as
   something else when it is typed from a screen or read aloud. Recovery
   codes are 16 characters (4 × 4, 80 bits); friend codes are 8 (4 × 4).
   ─────────────────────────────────────────────────────────────────────────── */
export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Uppercase, drop separators, and read the look-alikes as what they mean.
 *  @param {unknown} text */
export function normalizeCode(text) {
  return String(text ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V')
}

/** Group a normalized code in fours: ABCD-EFGH.
 *  @param {string} code */
export function formatCode(code) {
  return (code.match(/.{1,4}/g) ?? []).join('-')
}

/** A code from random bytes (each byte picks one character).
 *  @param {ArrayLike<number>} bytes */
export function codeFromBytes(bytes) {
  return formatCode(Array.from(bytes, (b) => CODE_ALPHABET[b % 32]).join(''))
}

/** Is this a well-formed friend code (8 characters of the alphabet)?
 *  @param {unknown} text */
export function isFriendCode(text) {
  const code = normalizeCode(text)
  return code.length === 8 && [...code].every((ch) => CODE_ALPHABET.includes(ch))
}

export default {
  PASSWORD_MIN, PASSWORD_MAX, USERNAME_MIN, USERNAME_MAX, EMAIL_MAX, RESERVED,
  normEmail, normName, emailProblem, passwordProblem, usernameProblem,
  CODE_ALPHABET, normalizeCode, formatCode, codeFromBytes, isFriendCode,
}
