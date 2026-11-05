/* ═══════════════════════════════════════════════════════════════════════════
   serverConfig.js — IS THIS BUILD CONNECTED TO A LUNX SERVER?
   ---------------------------------------------------------------------------
   A build compiled with VITE_LUNX_SERVER (for example
   VITE_LUNX_SERVER=https://lunx.example.org) is CONNECTED: accounts and
   progress live on that server, and Friends, Leagues and challenges exist.
   Without it the build is LOCAL — the course as it always was, entirely in
   the browser — and nothing in it mentions the social features at all
   (CLAUDE.md → Features that do not exist are not implied).
   ═══════════════════════════════════════════════════════════════════════════ */

/// <reference types="vite/client" />

/* Written exactly as `import.meta.env`: Vite finds that text and replaces it
   (a cast around `import.meta` hides it, and every build becomes local).
   Under Node — the test suites — it is undefined, hence the fallback. */
const env = import.meta.env ?? {}

/** What a VITE_LUNX_SERVER value means. The build reads the variable too
 *  (vite.config.js), to write each page's head for the build it is in.
 *  @param {unknown} value */
export function serverFrom(value) {
  const url = String(value ?? '').trim().replace(/\/+$/, '')
  let host = ''
  if (url) {
    try { host = new URL(url).host } catch { host = url }
  }
  return { url, connected: url.length > 0, host }
}

const server = serverFrom(env.VITE_LUNX_SERVER)

/** The server's origin, without a trailing slash, or '' on a local build. */
export const SERVER_URL = server.url

/** True on a connected build. */
export const CONNECTED = server.connected

/** The server's host, for the sentences that name it ("kept on lunx.example.org"). */
export const SERVER_HOST = server.host

/** How often a connected build asks for new notifications, rewards and
 *  standings while its live stream (services/liveUpdates.js) is down… */
export const POLL_MS = 60000

/** …and while it is up, when the server's nudges do the work. */
export const LIVE_POLL_MS = 5 * 60000

export default { SERVER_URL, CONNECTED, SERVER_HOST, POLL_MS, LIVE_POLL_MS }
