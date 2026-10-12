/* ═══════════════════════════════════════════════════════════════════════════
   serverFeatures.js — WHAT THIS BUILD'S SERVER CAN DO
   ---------------------------------------------------------------------------
   One thing a connected build cannot know when it is compiled: whether the
   people running its server gave it a mail provider. /api/health says
   (server/app.js → mail), once per page load, and the pages that mention
   email — the sign-in page's "Forgot password?" and the privacy policy —
   describe what is true of the server in front of them.

   Until the answer arrives, and if it never does, the answer is "no email":
   the recovery code always works, so it is the safe thing to offer.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { api } from './api'
import { CONNECTED } from '../config/serverConfig'

const NONE = { mail: false, known: false }
let cached = null

/** @returns {Promise<{ mail: boolean, known: boolean }>} */
export function loadServerFeatures() {
  if (!CONNECTED) return Promise.resolve(NONE)
  if (!cached) {
    cached = api.get('/api/health', { auth: false, timeoutMs: 8000 }).then((r) => {
      if (!r.ok) { cached = null; return NONE }
      return { mail: Boolean(r.data?.mail), known: true }
    })
  }
  return cached
}

export function useServerFeatures() {
  const [features, setFeatures] = useState(NONE)
  useEffect(() => {
    let alive = true
    loadServerFeatures().then((f) => { if (alive) setFeatures(f) })
    return () => { alive = false }
  }, [])
  return features
}

export default useServerFeatures
