/* ═══════════════════════════════════════════════════════════════════════════
   activityOutbox.js — WHAT THE SERVER IS TOLD, AND WHEN
   ---------------------------------------------------------------------------
   On a connected build, league XP and challenge scores are decided by the
   LunX server from answers it grades itself (CLAUDE.md → The server decides
   what counts). The app therefore never sends an XP figure: it sends what
   the learner DID —

     answer             a question key and the answer given (Check or Practice)
     complete           an item finished, with the lesson session it came from
     practice-complete  a Practice session closed

   — and the server works out what that is worth.

   Events wait in a per-account queue in localStorage, so an answer given on
   a train with no signal is still counted when the signal comes back. Each
   carries a one-shot id the server remembers, so sending one twice (a retry,
   a flaky network, two tabs) can never count it twice. Order is kept: a
   lesson's answers always reach the server before its completion.

   On a local build every call here is a no-op.
   ═══════════════════════════════════════════════════════════════════════════ */

import { CONNECTED } from '../config/serverConfig'
import { secureId } from '../utils/random'

const KEY_PREFIX = 'lunx_outbox_v1__'
const BATCH = 25
const MAX_QUEUE = 500
const RETRY_MS = [2000, 5000, 15000, 30000, 60000]

let account = null
/** @type {null | ((events: object[]) => Promise<{ results: object[] }>)} */
let sender = null
let queue = []
let flushing = false
let retry = 0
let timer = 0
const listeners = new Set()

function storage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

function persist() {
  if (!account) return
  try { storage()?.setItem(KEY_PREFIX + account, JSON.stringify(queue.slice(-MAX_QUEUE))) } catch { /* full or blocked: the queue still works in memory */ }
}

function restore() {
  queue = []
  if (!account) return
  try {
    const parsed = JSON.parse(storage()?.getItem(KEY_PREFIX + account) ?? '[]')
    if (Array.isArray(parsed)) queue = parsed.filter((e) => e && typeof e.id === 'string' && typeof e.type === 'string')
  } catch { queue = [] }
}

/** Point the queue at an account (or at nobody, on sign-out). */
export function setOutboxAccount(id) {
  if (id === account) return
  account = id ?? null
  retry = 0
  restore()
  schedule(0)
}

/** The function that actually sends a batch (the API layer installs it). */
export function setOutboxSender(fn) {
  sender = typeof fn === 'function' ? fn : null
  schedule(0)
}

/** Hear what the server made of each event (XP, league movement …). */
export function onOutboxResult(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Queue something the learner did. Returns the event id, or null on a local
 * build or with nobody signed in.
 * @param {'answer' | 'complete' | 'practice-complete'} type
 * @param {object} payload
 */
export function report(type, payload) {
  if (!CONNECTED || !account) return null
  const event = { id: secureId('ev'), type, payload, at: Date.now() }
  queue.push(event)
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE)
  persist()
  schedule(250)
  return event.id
}

/** Events still waiting to reach the server. */
export const pendingCount = () => queue.length

/** Send everything now (signing out waits for this). True when the queue
 *  is empty afterwards. */
export async function settleOutbox() {
  for (let i = 0; i < 3 && queue.length; i++) {
    if (flushing) await new Promise((resolve) => setTimeout(resolve, 200))
    else await flush()
  }
  return queue.length === 0
}

/** Remove an account's queue from this browser — only when it is empty, so
 *  an answer that has not reached the server is never thrown away. */
export function forgetOutbox(id, { force = false } = {}) {
  if (!id) return
  try {
    const store = storage()
    const left = JSON.parse(store?.getItem(KEY_PREFIX + id) ?? '[]')
    if (force || !Array.isArray(left) || left.length === 0) store?.removeItem(KEY_PREFIX + id)
  } catch { /* nothing to remove */ }
}

function schedule(ms) {
  if (typeof window === 'undefined') return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { flush() }, ms)
}

/** Send what is waiting, in order, in batches. Safe to call any time. */
export async function flush() {
  if (!CONNECTED || !account || !sender || flushing || !queue.length) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  flushing = true
  const owner = account
  try {
    while (queue.length && account === owner) {
      const batch = queue.slice(0, BATCH)
      const { results = [] } = await sender(batch)
      if (account !== owner) break
      const done = new Set(results.filter((r) => r && r.id && r.status !== 'retry').map((r) => r.id))
      /* Anything the server answered — accepted, a duplicate, or refused as
         invalid — leaves the queue; only "try again" stays. */
      queue = queue.filter((e) => !done.has(e.id))
      persist()
      for (const r of results) for (const l of listeners) { try { l(r) } catch { /* a listener's bug is its own */ } }
      if (done.size === 0) throw new Error('nothing acknowledged')
    }
    retry = 0
  } catch {
    schedule(RETRY_MS[Math.min(retry, RETRY_MS.length - 1)])
    retry += 1
  } finally {
    flushing = false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => schedule(0))
  window.addEventListener('focus', () => schedule(500))
}

export default { report, flush, setOutboxAccount, setOutboxSender, onOutboxResult, pendingCount }
