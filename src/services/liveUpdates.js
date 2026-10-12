/* ═══════════════════════════════════════════════════════════════════════════
   liveUpdates.js — THE SERVER'S NUDGES (connected builds only)
   ---------------------------------------------------------------------------
   Holds GET /api/stream open (server/live.js) while the page is open. The
   server sends `changed` whenever something of this learner's changes — a
   friend request, a challenge, a league result — and the caller re-reads
   what it shows. The stream carries no data of its own.

   fetch(), not EventSource: EventSource cannot send the bearer token in a
   header, and the token never goes in a URL. If the stream cannot be held
   (offline, a proxy that buffers, the server restarting) it is retried with
   a growing wait, and the caller keeps polling meanwhile — `onState(false)`.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SERVER_URL, CONNECTED } from '../config/serverConfig'
import { getSession } from './api'

const MIN_WAIT = 2000
const MAX_WAIT = 60000
/* The server beats every 25 s; this much silence means the line is dead. */
const SILENCE_MS = 70000

/**
 * @param {{ onChanged: (kinds: string[]) => void, onState?: (live: boolean) => void }} handlers
 * @returns {() => void} stop
 */
export function openLiveUpdates({ onChanged, onState = () => {} }) {
  if (!CONNECTED || typeof fetch === 'undefined' || typeof TextDecoder === 'undefined') return () => {}
  let stopped = false
  let controller = null
  let retry = 0
  let wait = MIN_WAIT
  let silence = 0

  const restartSilence = () => {
    clearTimeout(silence)
    silence = setTimeout(() => controller?.abort(), SILENCE_MS)
  }

  async function connect() {
    const token = getSession()?.token
    if (stopped || !token) return
    controller = new AbortController()
    let opened = false
    try {
      const res = await fetch(`${SERVER_URL}/api/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      })
      /* Signed out, or not allowed: no point retrying with this token. */
      if (res.status === 401 || res.status === 403) return
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      restartSilence()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        restartSilence()
        buffer += decoder.decode(value, { stream: true })
        let i
        while ((i = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, i)
          buffer = buffer.slice(i + 2)
          const event = /^event: ?(.*)$/m.exec(block)?.[1]
          if (event === 'ready') {
            opened = true
            wait = MIN_WAIT
            onState(true)
          } else if (event === 'changed') {
            let kinds = []
            try { kinds = JSON.parse(/^data: ?(.*)$/m.exec(block)?.[1] ?? '{}').kinds ?? [] } catch { /* a nudge is a nudge */ }
            onChanged(kinds)
          }
        }
      }
    } catch {
      /* Offline, aborted or refused: retried below. */
    } finally {
      clearTimeout(silence)
    }
    if (stopped) return
    onState(false)
    /* A stream that opened and then dropped is retried soon; one that never
       opened waits longer each time. */
    if (!opened) wait = Math.min(MAX_WAIT, wait * 2)
    retry = setTimeout(connect, opened ? MIN_WAIT : wait)
  }

  connect()
  return () => {
    stopped = true
    clearTimeout(retry)
    clearTimeout(silence)
    controller?.abort()
  }
}

export default openLiveUpdates
