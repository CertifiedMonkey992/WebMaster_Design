/* ═══════════════════════════════════════════════════════════════════════════
   config.js — HOW THIS SERVER IS RUN
   ---------------------------------------------------------------------------
   Everything comes from the environment, so the same code runs on a laptop
   and on a host. See server/README.md for what to set where.

     PORT                    port to listen on (default 8787)
     HOST                    address to bind (default 127.0.0.1 in development,
                             0.0.0.0 in production)
     LUNX_ENV                'production' on a public server. Anything else is
                             development: test accounts may share boards with
                             real ones, and --seed and /api/dev/* are allowed.
     LUNX_DB                 the SQLite file (default server/data/lunx.db)
     LUNX_ALLOWED_ORIGINS    comma-separated origins the site is served from
     LUNX_TRUST_PROXY        '1' behind a proxy that sets X-Forwarded-For
     LUNX_JUDGE              'off' to run without the TSA reviewer account
     LUNX_JUDGE_PASSWORD     the reviewer's password (default: the one the
                             README and sign-in page publish for judges)
     LUNX_SEED_PASSWORD      development seeds' password (default seedpass1)
     LUNX_SITE_URL           where the site is served, with its path — reset
                             links point here (default: the published site in
                             production, the first allowed origin otherwise)
     LUNX_SMTP_HOST          a mail provider, to email reset links. Unset, the
                             server sends no email at all.
     LUNX_SMTP_PORT          default 587 (STARTTLS); 465 is implicit TLS
     LUNX_SMTP_SECURE        '1' for implicit TLS on another port
     LUNX_SMTP_USER / _PASS  the provider's credentials
     LUNX_MAIL_FROM          the From line, e.g. "LunX <no-reply@example.org>"
     LUNX_MAIL               'outbox' (development only): write each email to
                             server/data/mail/ instead of sending it
     LUNX_DEV_CLOCK          '1' (development only): POST /api/dev/clock moves
                             the server's clock forward
     LUNX_DEV_TOURNAMENT     '1' (development only): a Diamond Tournament that
                             qualifies this week
   ═══════════════════════════════════════════════════════════════════════════ */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JUDGE_LOGIN } from '../src/config/judgeConfig.js'
import { SITE } from '../src/site.js'

const here = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_ORIGINS = [
  'http://localhost:5176',
  'http://127.0.0.1:5176',
  'http://localhost:5177',
  'http://localhost:5190',
  'https://certifiedmonkey992.github.io',
]

/** How (and whether) this server sends its one email. */
function mailConfig(env, production) {
  if (env.LUNX_SMTP_HOST) {
    const port = Number(env.LUNX_SMTP_PORT || 587)
    return {
      mode: 'smtp',
      from: env.LUNX_MAIL_FROM || '',
      smtp: {
        host: env.LUNX_SMTP_HOST.trim(),
        port,
        secure: env.LUNX_SMTP_SECURE === '1' || port === 465,
        user: env.LUNX_SMTP_USER || '',
        pass: env.LUNX_SMTP_PASS || '',
      },
    }
  }
  /* The outbox writes addresses to disk; a public server never does that. */
  if (env.LUNX_MAIL === 'outbox' && !production) {
    return { mode: 'outbox', from: env.LUNX_MAIL_FROM || 'LunX <no-reply@lunx.local>', outboxDir: path.join(here, 'data', 'mail') }
  }
  return { mode: 'off' }
}

export function loadConfig(env = process.env) {
  const production = env.LUNX_ENV === 'production'
  const origins = (env.LUNX_ALLOWED_ORIGINS ? env.LUNX_ALLOWED_ORIGINS.split(',') : DEFAULT_ORIGINS).map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
  return {
    env: production ? 'production' : 'development',
    port: Number(env.PORT || 8787),
    host: env.HOST || (production ? '0.0.0.0' : '127.0.0.1'),
    dbFile: env.LUNX_DB || path.join(here, 'data', 'lunx.db'),
    origins,
    /* Ends in a slash: a reset link is siteUrl + 'signin/#reset=…'. */
    siteUrl: (env.LUNX_SITE_URL || (production ? SITE.url : (origins[0] ?? 'http://localhost:5176') + SITE.base)).replace(/\/*$/, '/'),
    mail: mailConfig(env, production),
    /* Development only, for clicking through what takes weeks: a server
       clock that POST /api/dev/clock moves forward, and a Diamond Tournament
       whose qualifying week is this one. A production server ignores both. */
    devClock: env.LUNX_DEV_CLOCK === '1' && !production,
    devTournament: env.LUNX_DEV_TOURNAMENT === '1' && !production,
    trustProxy: env.LUNX_TRUST_PROXY === '1',
    judge: {
      enabled: env.LUNX_JUDGE !== 'off',
      email: JUDGE_LOGIN.email,
      username: JUDGE_LOGIN.username,
      password: env.LUNX_JUDGE_PASSWORD || JUDGE_LOGIN.password,
    },
    seedPassword: env.LUNX_SEED_PASSWORD || 'seedpass1',
  }
}

export default { loadConfig }
