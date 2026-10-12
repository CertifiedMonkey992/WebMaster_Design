/* ═══════════════════════════════════════════════════════════════════════════
   main.js — START THE LUNX SERVER
   ---------------------------------------------------------------------------
     npm run server                  listen (config.js says where and how)
     npm run server -- --seed        development only: add test accounts with
                                     some real activity, then listen
     npm run server -- --reports     print the open reports and exit
     npm run server -- --make-moderator <username>
                                     let that account act on reports in the
                                     app (Profile → Moderation), and exit
     npm run server -- --remove-moderator <username>
   ═══════════════════════════════════════════════════════════════════════════ */

import http from 'node:http'
import { loadConfig } from './config.js'
import { openDatabase } from './db.js'
import { createApp } from './app.js'
import { ensureJudge } from './accounts.js'
import { setModerator } from './moderation.js'
import { weekWindow } from '../src/utils/leagueTime.js'
import { TOURNAMENT } from '../src/config/leagueConfig.js'

const config = loadConfig()
const db = openDatabase(config.dbFile)
/* Development only (config.js): a clock that can be moved forward, and a
   tournament that qualifies this week, so its rounds can be played now. */
let offset = 0
const now = () => Date.now() + offset
const thisWeek = weekWindow('UTC', Date.now()).weekId
const app = createApp({
  db,
  config,
  now,
  ...(config.devTournament ? { schedule: [{ id: `dev-${thisWeek}`, name: 'Development Diamond Tournament', qualifyWeek: thisWeek }, ...TOURNAMENT.SCHEDULE] } : {}),
  devClock: config.devClock ? { advance: (ms) => { offset += ms; return now() } } : null,
})
const argv = process.argv.slice(2)
const args = new Set(argv)

for (const flag of ['--make-moderator', '--remove-moderator']) {
  if (!args.has(flag)) continue
  const name = argv[argv.indexOf(flag) + 1]
  const done = name && !name.startsWith('--') ? setModerator(db, name, flag === '--make-moderator') : undefined
  if (done === undefined) console.error(`Usage: npm run server -- ${flag} <username>`)
  else if (!done) console.error(`No account is called "${name}".`)
  else if (done.refused) console.error(`${done.username} is the reviewer or a test account, and can't be a moderator.`)
  else console.log(done.moderator ? `${done.username} is now a moderator. They see Profile → Moderation next time the page loads.` : `${done.username} is no longer a moderator.`)
  process.exit(done && !done.refused ? 0 : 1)
}

if (config.mail.mode === 'smtp' && !/@/.test(config.mail.from)) {
  console.error('LUNX_SMTP_HOST is set but LUNX_MAIL_FROM is not: set the From address reset links are sent from, e.g. "LunX <no-reply@example.org>".')
  process.exit(1)
}

if (args.has('--reports')) {
  const rows = db.all(
    `SELECT r.id, r.reason, r.note, r.status, r.created_at, COALESCE(u.username, r.reported_name) AS reported, c.username AS reporter
       FROM reports r LEFT JOIN users u ON u.id = r.reported LEFT JOIN users c ON c.id = r.reporter
      WHERE r.status = 'open' ORDER BY r.created_at`,
  )
  if (!rows.length) console.log('No open reports.')
  for (const r of rows) {
    console.log(`#${r.id}  ${new Date(r.created_at).toISOString()}  ${r.reporter ?? '(deleted)'} reported ${r.reported ?? '(deleted)'} — ${r.reason}${r.note ? `: ${r.note}` : ''}`)
  }
  process.exit(0)
}

await ensureJudge(db, config, Date.now())

if (args.has('--seed')) {
  const made = await app.review.seedDevelopment(Date.now())
  console.log(made.length ? `Created ${made.length} test accounts (password "${config.seedPassword}"): ${made.join(', ')}` : 'Test accounts already exist.')
}

const server = http.createServer((req, res) => { app.handle(req, res) })
server.listen(config.port, config.host, () => {
  console.log(`LunX server (${config.env}) listening on http://${config.host}:${config.port} — database ${config.dbFile}`)
  console.log(`Accepting requests from: ${config.origins.join(', ')}`)
  console.log(config.mail.mode === 'smtp'
    ? `Email: reset links through ${config.mail.smtp.host}, pointing at ${config.siteUrl}`
    : config.mail.mode === 'outbox'
      ? `Email: development outbox (server/data/mail/), links point at ${config.siteUrl}`
      : 'Email: off — forgotten passwords are reset with the recovery code')
})

/* Weeks and challenges end on the server's clock even when nobody asks. */
const timer = setInterval(() => {
  try { app.runJobs() } catch (error) { console.error('[jobs]', error) }
}, 60000)

function shutdown() {
  clearInterval(timer)
  /* Open live streams would otherwise hold the close open. */
  app.hub.closeAll()
  server.close(() => { db.close(); process.exit(0) })
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
