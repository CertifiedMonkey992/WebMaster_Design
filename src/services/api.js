/* ═══════════════════════════════════════════════════════════════════════════
   api.js — TALKING TO THE LUNX SERVER (connected builds only)
   ---------------------------------------------------------------------------
   One door to the server (config/serverConfig.js → SERVER_URL):

     · every call resolves — never throws — to { ok: true, data } or
       { ok: false, status, code, message, field }, with a message written to
       be shown to a learner as it is
     · a call gives up after a timeout, and "offline" is told apart from an
       error the server returned
     · the session is a bearer token kept beside the account it belongs to
       (localStorage, `lunx_session_v1`). The token is sent only to the LunX
       server, in a header, never in a URL. A 401 ends the session here too,
       so the app returns to the sign-in page instead of failing quietly.

   Why a header token and not a cookie: the site (GitHub Pages) and the
   server live on different hosts, and browsers increasingly refuse
   third-party cookies. The site loads no third-party scripts, which is the
   protection a header token relies on.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SERVER_URL, CONNECTED } from '../config/serverConfig'

export const SESSION_KEY = 'lunx_session_v1'
const TIMEOUT_MS = 15000

function storage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

function readSession() {
  try {
    const parsed = JSON.parse(storage()?.getItem(SESSION_KEY) ?? 'null')
    return parsed && typeof parsed.token === 'string' && parsed.account && typeof parsed.account.id === 'string' ? parsed : null
  } catch {
    return null
  }
}

let session = CONNECTED ? readSession() : null
const listeners = new Set()

/** The signed-in session ({ token, account }), or null. */
export const getSession = () => session

/** Replace the session (null signs out) and tell whoever listens. */
export function setSession(next) {
  session = next && next.token && next.account ? { token: next.token, account: next.account } : null
  try {
    if (session) storage()?.setItem(SESSION_KEY, JSON.stringify(session))
    else storage()?.removeItem(SESSION_KEY)
  } catch { /* storage blocked: the session lasts for this page */ }
  for (const l of listeners) { try { l(session) } catch { /* a listener's bug is its own */ } }
}

/** Update the account kept beside the token (after a profile change). */
export function setSessionAccount(account) {
  if (session && account) setSession({ ...session, account })
}

/** Re-read the session after another tab changed it. */
export function reloadSession() {
  session = readSession()
  return session
}

const beforeSignOut = new Set()

/** Register work that must finish while the session is still valid —
 *  unsent progress, queued answers. It resolves true when nothing is left. */
export function onBeforeSignOut(fn) {
  beforeSignOut.add(fn)
  return () => beforeSignOut.delete(fn)
}

/** Run that work, for at most `timeoutMs`. True only if all of it finished
 *  and nothing is left unsent. */
export async function settleBeforeSignOut(timeoutMs = 4000) {
  if (!beforeSignOut.size) return true
  const all = Promise.allSettled([...beforeSignOut].map((fn) => Promise.resolve().then(fn)))
  const done = await Promise.race([all, new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))])
  return Array.isArray(done) && done.every((r) => r.status === 'fulfilled' && r.value === true)
}

export function onSessionChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} path  e.g. '/api/me'
 * @param {{ body?: unknown, auth?: boolean, timeoutMs?: number, keepalive?: boolean }} [opts]
 */
export async function request(method, path, { body, auth = true, timeoutMs = TIMEOUT_MS, keepalive = false } = {}) {
  if (!CONNECTED) return { ok: false, status: 0, code: 'local', message: 'This copy of LunX is not connected to a server.' }
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : 0
  const token = auth ? session?.token : null
  try {
    const res = await fetch(SERVER_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller?.signal,
      credentials: 'omit',
      cache: 'no-store',
      keepalive,
    })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = null }
    if (res.status === 401 && token && session?.token === token) setSession(null)
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: data?.error?.code ?? 'error',
        message: data?.error?.message ?? 'Something went wrong on the server. Try again in a moment.',
        field: data?.error?.field ?? null,
        retryAfter: Number(res.headers.get('retry-after')) || null,
        data,
      }
    }
    return { ok: true, status: res.status, data }
  } catch (error) {
    const timedOut = error?.name === 'AbortError'
    return {
      ok: false,
      status: 0,
      code: timedOut ? 'timeout' : 'offline',
      message: timedOut ? 'The LunX server took too long to answer. Try again.' : 'Can’t reach the LunX server. Check your connection and try again.',
      field: null,
    }
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, body, opts) => request('DELETE', path, { ...opts, body: body ?? {} }),
}

export default api
