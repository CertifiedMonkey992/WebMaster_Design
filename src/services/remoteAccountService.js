/* ═══════════════════════════════════════════════════════════════════════════
   remoteAccountService.js — ACCOUNTS ON THE LUNX SERVER (connected builds)
   ---------------------------------------------------------------------------
   The same commands, with the same answers, as services/accountService.js —
   { ok, account } or { ok: false, field, error } — so AuthContext and the
   sign-in page work the same whichever build they are in. Here the account
   lives on the LunX server (server/accounts.js): the password is sent once,
   over HTTPS, and hashed there; a session token is kept in its place.

   The rules a field must meet are checked here first (utils/accountRules.js,
   the same rules the server enforces), so a typo is reported before a
   request is made.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api, getSession, setSession, setSessionAccount } from './api'
import { emailProblem, passwordProblem, usernameProblem, PASSWORD_MIN, USERNAME_MIN, USERNAME_MAX } from '../utils/accountRules'
import { STORAGE_KEY } from '../config/progressionConfig'

export { PASSWORD_MIN, USERNAME_MIN, USERNAME_MAX }

const failed = (r) => ({ ok: false, field: r.field ?? 'form', error: r.message, code: r.code })

/** The learner's own time zone, for the weeks their leagues are counted in. */
export function browserTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** The signed-in account (from the session kept beside its token), or null. */
export const currentAccount = () => getSession()?.account ?? null

/** The name to show: the username, never the email. */
export const displayName = (account) => account?.username || 'Learner'

/** Where this account's progress is cached in the browser. A different
 *  prefix from local accounts', so the two kinds never share a key. */
export const progressKey = (accountId) => (accountId ? `${STORAGE_KEY}__srv_${accountId}` : STORAGE_KEY)

export const validateEmail = emailProblem
export const validatePassword = passwordProblem
export const validateUsername = (value) => usernameProblem(value, { required: true })

export async function signIn({ identifier, password }) {
  const r = await api.post('/api/auth/signin', { identifier, password }, { auth: false })
  if (!r.ok) return failed(r)
  setSession({ token: r.data.token, account: r.data.account })
  return { ok: true, account: r.data.account }
}

export async function createAccount({ email, username, password }) {
  const r = await api.post('/api/auth/signup', { email, username, password, timezone: browserTimeZone() }, { auth: false })
  if (!r.ok) return failed(r)
  setSession({ token: r.data.token, account: r.data.account })
  return { ok: true, account: r.data.account, recoveryCode: r.data.recoveryCode }
}

export async function resetPassword({ email, code, password }) {
  const r = await api.post('/api/auth/reset', { email, code, password }, { auth: false })
  if (!r.ok) return failed(r)
  setSession({ token: r.data.token, account: r.data.account })
  return { ok: true, account: r.data.account, recoveryCode: r.data.recoveryCode }
}

/** Ask the server to email a reset link (only when it sends email —
 *  services/serverFeatures.js). The answer never says whether the address
 *  has an account. */
export async function requestResetLink(email) {
  const r = await api.post('/api/auth/forgot', { email }, { auth: false })
  return r.ok ? { ok: true } : failed(r)
}

/** Choose a new password with the token from a reset link. Signs in. */
export async function resetWithLink({ token, password }) {
  const r = await api.post('/api/auth/reset-link', { token, password }, { auth: false })
  if (!r.ok) return failed(r)
  setSession({ token: r.data.token, account: r.data.account })
  return { ok: true, account: r.data.account }
}

export async function changePassword(_accountId, { current, next }) {
  const r = await api.post('/api/me/password', { current, next })
  return r.ok ? { ok: true } : failed(r)
}

/** Change the username, avatar, time zone or privacy settings. */
export async function updateAccount(patch) {
  const r = await api.patch('/api/me', patch)
  if (!r.ok) return failed(r)
  setSessionAccount(r.data.account)
  return { ok: true, account: r.data.account }
}

export const updateUsername = (_accountId, username) => updateAccount({ username })

/** Re-read the account from the server (a profile change on another device). */
export async function refresh() {
  if (!getSession()) return { ok: false, account: null }
  const r = await api.get('/api/me')
  if (!r.ok) return { ok: false, account: r.status === 401 ? null : currentAccount(), offline: r.status === 0 }
  setSessionAccount(r.data.account)
  return { ok: true, account: r.data.account }
}

export async function signOut() {
  /* The server forgets the session too; if it cannot be reached, the token
     simply expires there. */
  await api.post('/api/auth/signout', {}).catch(() => {})
  setSession(null)
  return { ok: true, account: null }
}

/** Delete the account and everything the server holds for it. */
export async function forgetAccount(_accountId, password) {
  const r = await api.del('/api/me', { password })
  if (!r.ok) return failed(r)
  setSession(null)
  return { ok: true, account: null }
}

export default {
  currentAccount, displayName, progressKey, signIn, createAccount, resetPassword, requestResetLink, resetWithLink,
  changePassword, updateAccount, updateUsername, refresh, signOut, forgetAccount,
  validateEmail, validatePassword, validateUsername, browserTimeZone,
}
