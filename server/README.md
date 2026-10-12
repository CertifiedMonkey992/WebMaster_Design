# The LunX server

The optional back end for a **connected** build of LunX. Without it the site
is a *local* build: accounts and progress stay in the browser and there are
no Friends or Leagues. With it, a build compiled with `VITE_LUNX_SERVER`
keeps accounts and progress here and adds weekly Leagues, the Diamond
Tournament, Friends and friend challenges.

It is one Node process with no dependencies: `node:http`, `node:sqlite`
(the built-in SQLite), `node:crypto`, and `node:net`/`node:tls` for the one
email it can send. It imports the app's own pure
modules — course content, the step grader, `leagueConfig.js` — through
`server/resolve.mjs`, so a rule changes in one place for both sides.

## Requirements

- **Node.js 22.13 or newer** (24 is fine). `node:sqlite` is built in from
  22.13; Node prints an "experimental" note for it, which the npm scripts
  silence.
- A **persistent disk** for the SQLite file. A host that wipes the
  filesystem on every deploy will wipe every account with it.
- **HTTPS** in front of it in production (the host's TLS, or a reverse
  proxy). Passwords are sent to the server once, at sign-in.

## Running it on your machine

```bash
npm run dev:connected              # server on :8787 + the site on :5177, pointed at it
npm run dev:connected -- --seed    # …and 18 labelled test accounts with real activity
npm run dev:connected -- --seed --dev-clock --dev-tournament
                                   # …plus a movable clock and a tournament this week
npm run server                     # the server alone
npm run test:server                # its test suite (also part of `npm test`)
```

The development database is `server/data/lunx.db` (git-ignored). Delete
the file to start again. `dev:connected` writes reset emails to
`server/data/mail/` as `.eml` files instead of sending them.

Two development-only switches make what takes weeks testable in minutes
(both refused when `LUNX_ENV=production`): `--dev-clock` lets
`POST /api/dev/clock {"days": 7}` move the server's clock forward (and runs
the jobs then due), and `--dev-tournament` schedules a Diamond Tournament
that qualifies the current week. With `POST /api/dev/end-week` they play a
whole tournament: qualify, then a week on and end each round.

## Configuration

Everything comes from environment variables (`server/config.js`).

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `8787` | Port to listen on. |
| `HOST` | `127.0.0.1` (dev), `0.0.0.0` (production) | Address to bind. |
| `LUNX_ENV` | development | Set to **`production`** on a public server: test accounts can never share a board with real learners, and `--seed` and `/api/dev/*` are refused. |
| `LUNX_DB` | `server/data/lunx.db` | The SQLite file. Put it on the persistent disk. |
| `LUNX_ALLOWED_ORIGINS` | the dev ports and `https://certifiedmonkey992.github.io` | Comma-separated origins the site is served from (scheme + host, no path). Requests from anywhere else get no CORS headers. |
| `LUNX_TRUST_PROXY` | off | `1` behind a proxy that sets `X-Forwarded-For`, so rate limits apply per visitor rather than per proxy. Leave off otherwise — the header is trivially forged. |
| `LUNX_JUDGE` | on | `off` runs without the TSA reviewer account. |
| `LUNX_JUDGE_PASSWORD` | the published one | The reviewer's password. The sign-in page prints the published one for judges, so change it only if you also stop publishing it. |
| `LUNX_SEED_PASSWORD` | `seedpass1` | Password of development test accounts. |
| `LUNX_SITE_URL` | the published site (production), else the first allowed origin + `/WebMaster_Design/` | Where the site is served, with its path. Reset links point at `<this>signin/#reset=…`. |
| `LUNX_SMTP_HOST` | unset | A mail provider. **Unset, the server sends no email**, and "Forgot password?" uses the recovery code only. |
| `LUNX_SMTP_PORT` | `587` | `587` uses STARTTLS; `465` is implicit TLS. |
| `LUNX_SMTP_SECURE` | off | `1` for implicit TLS on a port other than 465. |
| `LUNX_SMTP_USER`, `LUNX_SMTP_PASS` | unset | The provider's credentials (AUTH PLAIN, only ever over TLS). |
| `LUNX_MAIL_FROM` | — | Required with `LUNX_SMTP_HOST`: the From line, e.g. `LunX <no-reply@example.org>`. |
| `LUNX_MAIL` | unset | `outbox` (development only): write each email to `server/data/mail/`. |
| `LUNX_DEV_CLOCK`, `LUNX_DEV_TOURNAMENT` | off | `1` (development only): the movable clock and this week's tournament above. |

The only secret is the mail provider's password, if you use one: sessions
are random tokens stored only as hashes, and passwords are hashed with
scrypt and a per-account salt.

### Email (optional)

Set `LUNX_SMTP_HOST`, `LUNX_SMTP_USER`, `LUNX_SMTP_PASS` and
`LUNX_MAIL_FROM` for any SMTP provider (a school's mail server, Amazon SES,
Postmark, Mailgun, SendGrid, Gmail with an app password). The server then
sends exactly one kind of email: a reset link, when someone asks for one on
the sign-in page. The sign-in page and the privacy policy read
`/api/health` (`"mail": true`) and describe what this server does; the site
is built the same either way.

- The link works once, for 30 minutes; asking again replaces it. Only a
  SHA-256 of its token is stored, and the token travels in the link's
  fragment (`#reset=…`), so it never reaches a server log.
- Asking answers the same whether or not the address has an account, and
  the email goes out after the answer, so neither says which. Three asks
  per address per hour, eight per network address.
- Using a link signs every other device out. The reviewer's account and
  test accounts never get one.
- The server refuses to send without TLS to any host but this machine.

## Deploying

1. **Host the server** on anything that runs a long-lived Node process with
   a persistent disk — a small VPS, Fly.io or Render with a volume, Railway,
   a school server. Start command:
   ```bash
   node --disable-warning=ExperimentalWarning --import ./server/resolve.mjs server/main.js
   ```
   (`npm run server` does the same.) The server needs the repository's
   `src/` folder beside `server/`, because it imports the course content.
2. **Set the environment**: `LUNX_ENV=production`,
   `LUNX_DB=/path/on/the/volume/lunx.db`,
   `LUNX_ALLOWED_ORIGINS=https://certifiedmonkey992.github.io`, and
   `LUNX_TRUST_PROXY=1` if the host puts a proxy in front (most do).
3. **Check it**: `https://<your-server>/api/health` answers
   `{"ok":true,…}`.
4. **Point the site at it.** In the GitHub repository, add a variable —
   *Settings → Secrets and variables → Actions → Variables* — named
   **`LUNX_SERVER_URL`** with the server's origin, e.g.
   `https://lunx-api.example.org`. CI passes it to the build as
   `VITE_LUNX_SERVER`; the next push to `main` publishes a connected build.
   Delete the variable and the next build is local again.

If the server goes down, a learner who is already signed in keeps learning:
the course works from the browser's copy, answers queue up and are sent
when the server is back, and Friends and Leagues say they cannot be
reached. Signing in and creating an account need the server.

## What the server decides

The browser is never trusted with anything that counts.

- **XP for leagues and challenges** is computed here from answers the
  server grades itself against the course content. The client never sends
  an XP figure; the XP it shows the learner is their personal economy and
  is not read for anything competitive.
- **Every award has a unique key** (`xp_ledger (user, source)`, `awards
  (user, kind, ref)`, events by id), so a replayed or duplicated request
  cannot pay twice. Rewards are claimed once.
- **Weeks end on the server's clock**, in each board's own time zone. A
  learner's time zone can change once a week and cannot move a week already
  running. A client clock set back or forward changes nothing.
- **Practice XP** follows the same rule as the app (`utils/practiceXp.js`):
  a session bonus, fresh correct answers only, less after the fourth session
  of a day, and a daily cap.
- **Privacy**: an email address is never sent to anyone but its owner.
  Finding someone by email is a POST (the address is never in a URL or a
  log), only matches people who turned it on, and answers the same way
  whether or not an account exists. Profiles honour everyone / friends /
  only me. Blocking ends the friendship and stops requests, challenges and
  shared boards in both directions.
- **Validation and limits**: one shared set of rules for usernames, emails
  and passwords (`src/utils/accountRules.js`); request bodies capped at
  64 KB (progress at 900 KB); rate limits per address for sign-in, sign-up
  and recovery, and per account for searches, requests, reports and writes;
  sign-in locks for 30 seconds after five wrong passwords.
- **Transactions** wrap every multi-row change (finishing a week, accepting
  a request, deleting an account).
- **Headers**: JSON only, `no-store`, `nosniff`, `DENY` framing, no
  referrer, a `default-src 'none'` CSP, and CORS only for the allowed
  origins.

## Running it

- **Moderators.** `npm run server -- --make-moderator <username>` (and
  `--remove-moderator`) lets a trusted account act on reports in the app.
  Profile → Moderation lists open and closed reports, and can dismiss one,
  reset a username (to `Learner_` + the friend code; the learner is told
  why), suspend for 1, 7 or 30 days or until lifted (signed out everywhere,
  off this week's board and every search, and sign-in says until when), or
  delete the account. Acting on a learner closes every open report about
  them. Every action goes to `moderation_log` with the moderator's name and
  is shown beneath the reports. Nobody moderates the reviewer, another
  moderator or themself.
- **Reports from the command line.** `npm run server -- --reports` prints
  open reports (who, about whom, the reason and note) and exits.
- **Jobs.** Once a minute the server finishes any week, tournament round or
  challenge that has ended, even if nobody is online.
- **Backups.** The whole state is one SQLite file. Copy it while the server
  is stopped, or use `sqlite3 lunx.db ".backup backup.db"` while it runs.
- **Logs.** Errors are written to stderr. Nothing logs request bodies,
  passwords, tokens or email addresses.
- **Live updates.** `GET /api/stream` is a Server-Sent Events stream that
  each open page holds, opened with `fetch` and the bearer header (never a
  token in a URL). It carries only a nudge (`event: changed`) and the page
  re-reads its summary at once, so a friend request or a finished challenge
  appears within a second. A beat every 25 s keeps proxies from closing it
  and re-checks the session; an account holds at most four. **Behind a
  proxy, turn off response buffering for `/api/stream`** (nginx:
  `proxy_buffering off;` — the server also sends `X-Accel-Buffering: no`).
  If the stream cannot be held, pages poll once a minute instead.

## Data

Tables (`server/db.js`): users, sessions, progress, events, attempts,
completions, practice sessions and credits, the XP ledger, friend requests,
friendships, blocks, reports, cohorts (a week's board) and their members,
tournament entries, awards, challenges and participants, notifications
(the newest 100 per learner), password-reset tokens (hashed, deleted a day
after they expire) and the moderation log. Deleting an account deletes every row that
belongs to it; a report keeps the reported username so it can still be
reviewed. The privacy policy on a connected build lists all of this in
plain words.

## Test accounts and the reviewer

- **Development only:** `--seed` makes 18 accounts named `Test_Seed01…18`,
  flagged `is_seed`, which study a little through the real pipeline so a
  board and a friends list have something in them. Refused when
  `LUNX_ENV=production`. Usernames starting `test_` are reserved, so no real
  account can look like one.
- **The reviewer's sandbox:** the TSA reviewer account (`judge@lunx.app`)
  never joins a real board. Its Leagues tab opens a closed board of eleven
  labelled test accounts, with controls that run the real engine — make the
  test accounts study, end the week now (real ranks, promotion and
  rewards), send the reviewer a real friend request or challenge, reset.
  On a production server the reviewer and its test accounts are a closed
  room: nobody outside can find them, befriend them or share a board with
  them, and they can reach nobody outside. (In development everyone can
  see everyone, so the seeds are easy to test against.)

## What it does not do

- It runs as **one process** on one SQLite file. That is plenty for a
  school or a competition; it is not built to scale across machines.
- It sends **one kind of email, and only when given a provider**: reset
  links. No verification emails, digests or newsletters.
- Moderation is **people, not automation**: rate limits, blocking, and
  moderators acting on reports. Nothing scans what learners write.
- Updates reach a page **while it is open** (the live stream). There are no
  push notifications to a closed browser or a phone.
