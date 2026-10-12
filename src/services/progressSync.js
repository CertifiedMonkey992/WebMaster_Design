/* ═══════════════════════════════════════════════════════════════════════════
   progressSync.js — PROGRESS THAT FOLLOWS THE ACCOUNT (connected builds)
   ---------------------------------------------------------------------------
   On a connected build the learner's progression state — XP, gems, hearts,
   streak, quests, the Practice history — is kept on the LunX server as well
   as in this browser, so signing in on another device carries on where the
   learner stopped.

     pull      once, when the course opens: a newer copy on the server is
               adopted; an empty or older one is replaced by this one.
               Nothing is pushed until the pull has answered, so a device
               opening an account for the first time never offers its empty
               state as the newer one
     push      a moment after every change, with the revision this device
               last saw (optimistic concurrency, server/app.js → PUT
               /api/progress)
     conflict  another device saved first: the server refuses the write and
               hands back its newer copy, which is adopted — the same rule
               two tabs in one browser already follow (ProgressionContext)

   The server stores this record for the learner and shows it to nobody
   else. It is the learner's own economy: league XP, rewards and challenge
   scores are never read from it (server/activity.js decides those).
   ═══════════════════════════════════════════════════════════════════════════ */

import { api, onBeforeSignOut } from './api'
import { getProfileKey } from './storageService'

const PUSH_DELAY_MS = 1500
const RETRY_MS = 15000

function revKey() { return `${getProfileKey()}__rev` }

function readRev() {
  try { return Math.max(0, Number(window.localStorage.getItem(revKey())) || 0) } catch { return 0 }
}

function writeRev(rev) {
  try { window.localStorage.setItem(revKey(), String(rev)) } catch { /* the revision lives in memory */ }
}

/**
 * @param {{ getState: () => object, adopt: (state: object, why: 'pulled' | 'conflict') => void }} hooks
 */
export function createProgressSync({ getState, adopt }) {
  let rev = readRev()
  let dirty = false
  let timer = 0
  let pushing = false
  let again = false
  let stopped = false
  let pulled = false

  /* Signing out waits for the last change to reach the server (AuthContext
     → signOut), so this browser's copy can then be removed. */
  async function settle() {
    for (let i = 0; i < 20 && !stopped && (dirty || pushing); i++) {
      if (pushing || !pulled) { await new Promise((resolve) => setTimeout(resolve, 150)); continue }
      clearTimeout(timer)
      await push()
    }
    return !dirty
  }
  const offSignOut = onBeforeSignOut(settle)

  function schedule(ms) {
    if (stopped) return
    clearTimeout(timer)
    timer = setTimeout(push, ms)
  }

  async function push() {
    if (stopped) return
    if (pushing) { again = true; return }
    pushing = true
    const r = await api.put('/api/progress', { baseRev: rev, state: getState() })
    pushing = false
    if (stopped) return
    if (r.ok) {
      rev = r.data.rev
      writeRev(rev)
      dirty = false
    } else if (r.status === 409 && r.data) {
      rev = r.data.rev
      writeRev(rev)
      dirty = false
      if (r.data.state) adopt(r.data.state, 'conflict')
    } else if (r.status === 0 || r.status === 429 || r.status >= 500) {
      schedule(RETRY_MS)
    }
    if (again) { again = false; schedule(300) }
  }

  return {
    /** Fetch the server's copy. Resolves to whether one was adopted. */
    async pull() {
      const r = await api.get('/api/progress')
      if (stopped) return { ok: false, adopted: false }
      pulled = true
      if (!r.ok) {
        /* Unreachable for now: an unsent change goes later, carrying the
           revision this device knows, so the server can still refuse it. */
        if (dirty) schedule(RETRY_MS)
        return { ok: false, adopted: false }
      }
      const { rev: serverRev, state } = r.data
      if (state && serverRev > rev) {
        rev = serverRev
        writeRev(rev)
        dirty = false
        adopt(state, 'pulled')
        return { ok: true, adopted: true }
      }
      if (!state || serverRev < rev || dirty) schedule(0)
      return { ok: true, adopted: false }
    },
    /** The state changed here; send it soon. */
    markDirty() {
      dirty = true
      if (pulled) schedule(PUSH_DELAY_MS)
    },
    /** The page is going away: one last try, if anything is unsent. */
    flush() {
      if (!dirty || stopped || !pulled) return
      api.put('/api/progress', { baseRev: rev, state: getState() }, { keepalive: true })
    },
    stop() {
      stopped = true
      clearTimeout(timer)
      offSignOut()
    },
  }
}

export default { createProgressSync }
