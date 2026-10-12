/* ═══════════════════════════════════════════════════════════════════════════
   dev-connected.mjs — THE CONNECTED BUILD, ON ONE MACHINE
   ---------------------------------------------------------------------------
   Starts the LunX server and a Vite dev server pointed at it, so Friends,
   Leagues and server-kept accounts can be worked on locally:

     npm run dev:connected              server on :8787, site on :5177
     npm run dev:connected -- --seed    also add labelled test accounts with
                                        some real activity (development only)
     … --dev-clock --dev-tournament     a server clock POST /api/dev/clock moves
                                        forward, and a Diamond Tournament that
                                        qualifies this week — to play its rounds

   Email: reset links are written to server/data/mail/ as .eml files
   (LUNX_MAIL=outbox) unless LUNX_SMTP_HOST names a real mail provider.

   LUNX_SERVER_PORT and WEB_PORT override the two ports. PORT is ignored:
   tools that start dev servers set it for the site, not for the API. The
   plain `npm run dev` build is untouched: it has no server, and no Friends
   or Leagues.
   ═══════════════════════════════════════════════════════════════════════════ */

import { spawn } from 'node:child_process'

const SERVER_PORT = process.env.LUNX_SERVER_PORT || '8787'
const WEB_PORT = process.env.WEB_PORT || '5177'
const seed = process.argv.includes('--seed')
const devClock = process.argv.includes('--dev-clock')
const devTournament = process.argv.includes('--dev-tournament')

const server = spawn(
  process.execPath,
  ['--disable-warning=ExperimentalWarning', '--import', './server/resolve.mjs', 'server/main.js', ...(seed ? ['--seed'] : [])],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: SERVER_PORT,
      /* The site's origin must be one the server accepts. */
      LUNX_ALLOWED_ORIGINS: process.env.LUNX_ALLOWED_ORIGINS || `http://localhost:${WEB_PORT},http://127.0.0.1:${WEB_PORT}`,
      /* Reset links point at this site, and with no mail provider set they
         are written to server/data/mail/ rather than sent. */
      LUNX_SITE_URL: process.env.LUNX_SITE_URL || `http://localhost:${WEB_PORT}/WebMaster_Design/`,
      LUNX_MAIL: process.env.LUNX_MAIL || (process.env.LUNX_SMTP_HOST ? '' : 'outbox'),
      ...(devClock ? { LUNX_DEV_CLOCK: '1' } : {}),
      ...(devTournament ? { LUNX_DEV_TOURNAMENT: '1' } : {}),
    },
  },
)

const web = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--port', WEB_PORT, '--strictPort'],
  /* 127.0.0.1, not localhost: the server binds IPv4, and a browser that tries
     ::1 first would wait before falling back. */
  { stdio: 'inherit', env: { ...process.env, VITE_LUNX_SERVER: `http://127.0.0.1:${SERVER_PORT}` } },
)

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  server.kill('SIGTERM')
  web.kill('SIGTERM')
  setTimeout(() => process.exit(code), 500).unref()
}

server.on('exit', (code) => stop(code ?? 0))
web.on('exit', (code) => stop(code ?? 0))
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
