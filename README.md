# LunX

An interactive field guide to how AI works, built for high-school learners
as a TSA Webmaster entry. Twenty-one short lessons across seven modules, with
XP, levels, streaks, hearts, gems, daily and weekly quests, a daily spin, a
small shop, achievements, and an adaptive Practice tab built from each
learner's own answers. The course asks you to sign in or create a free
account first.

LunX comes in two builds from the same code:

- **Local** (the default, and the live site unless a server is configured):
  no server at all. Accounts and progress live in the browser's local
  storage and nothing is transmitted.
- **Connected**: built with `VITE_LUNX_SERVER` pointing at the LunX server in
  [`server/`](server/README.md). Accounts and progress are kept on that
  server, and it adds weekly **Leagues** (ten tiers and a Diamond
  Tournament), **Friends** (friend codes, search, requests, blocking and
  reporting) and **friend challenges**. The server grades answers and
  decides all league XP, rewards and week boundaries itself.

Live site: https://certifiedmonkey992.github.io/WebMaster_Design/

## For TSA judges

Open **Sign in** at the top right and press **Use the reviewer account**
under the form to fill these in:

| | |
|---|---|
| Email | `judge@lunx.app` |
| Password | `tsa2027` |

That account has every module unlocked, unlimited gems and 100 hearts, a
small clay control in the margin of each feature (finish a lesson, fill a
quest, break a streak, lose a heart), and a **Reviewer console** behind the
tab in the bottom-right corner — resources, levels, streaks, the whole
course, quests, badges, the daily spin, and a button that runs the
progression engine's own test suite in the browser.

None of it fakes a result: every control calls the same reducer a learner
drives, so a skipped lesson pays the same XP, unlocks the same module and
plays the same animation as one answered question by question. Each power
can be switched off in the console to see the plain course, and judges are
equally welcome to create an ordinary account and walk it as a student
would.

On a local build, accounts are created in this browser and nothing is
transmitted. Passwords and recovery codes are stored only as salted PBKDF2
hashes, but anyone with access to the browser can read the progress stored
beside them. See `PRIVACY` on the site for every key it writes.

On a connected build the same account is seeded on the server, and its
**Leagues** tab opens a reviewer's sandbox: a closed board of labelled test
accounts, with controls that make them study, end the week now (real ranks,
promotion and rewards) or send the reviewer a real friend request or
challenge. No real learner is ever on the reviewer's board.

## Stack

- React 18 and Vite 5. No router: `src/App.jsx` turns between pages and
  `src/site.js` is the one table of addresses, titles and descriptions.
- Plain CSS with a token layer in `src/index.css`. The design system in
  `design-system/` is authoritative over any individual implementation.
- All progression rules are pure functions in `src/services/`, composed
  into a view model by `src/state/ProgressionContext.jsx`. Components read
  the view model; they never compute progression themselves.
- `src/data/` holds course content, `src/config/` holds every tunable
  economy value, `src/motion/` holds the shared animation library.

## Working on it

```bash
npm install
npm run dev            # http://localhost:5176 — a local build
npm run dev:connected  # the LunX server on :8787 and the site on :5177, pointed at it
npm test               # engine, Practice and league self-checks, then the server suite
npm run lint           # eslint
npm run typecheck      # tsc
npm run build          # writes the published site to docs/
```

The self-check suites (`src/dev/progressionTests.js`, `practiceTests.js`,
`leagueTests.js`) drive the real code with an injected clock, so calendar
rollovers, streak gaps, heart recovery, spaced-review intervals and league
week boundaries are tested deterministically, in two time zones and on a
pinned date as well as today. The server suite (`server/test/`) runs a real
HTTP server on an in-memory database with a clock the tests move by hand.
The engine suite can also be run from the app: open the course with
`?dev=1` and press "Run self-tests" in the developer panel.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, the tests and the
build on every push and pull request, and publishes the site when those
pass on `main`.

## Publishing

GitHub Pages serves whatever CI last built from `main`. The build output
is **not** committed — `docs/` is in `.gitignore` — so the live site
cannot drift from the source.

To publish, push to `main`. The `deploy` job in
`.github/workflows/ci.yml` waits on the `check` job, so a push that fails
lint, the typecheck, either timezone's test run or the build never reaches
the live site. Nothing is built or committed by hand.

Progress is on the repository's Actions tab; the deployed URL is recorded
on the `github-pages` environment.

### The repository setting this depends on

**Settings → Pages → Build and deployment → Source** must be **GitHub
Actions**. It was previously *Deploy from a branch → `main` → /docs*,
which is why `docs/` used to be committed. A workflow cannot change that
setting for itself, so it is a one-time choice by someone with admin
access to the repository.

### Publishing a connected build

Set the repository variable **`LUNX_SERVER_URL`** (Settings → Secrets and
variables → Actions → Variables) to the deployed server's origin, and CI
builds a connected site on the next push to `main`. Without it the build is
local. Deploying the server itself is described in
[`server/README.md`](server/README.md).

### Where the build output goes

Vite writes to `docs/` (`build.outDir` in `vite.config.js`) — a name left
over from branch-based publishing, kept so the build behaves exactly as it
did before. The deploy job uploads whatever that folder contains, so the
name is now an implementation detail rather than a requirement.

Alongside the bundle, the build writes a static HTML file per address
(`docs/about/index.html`, `docs/privacy/index.html`, …) carrying that
page's head, plus `404.html`, `sitemap.xml`, `robots.txt` and `.nojekyll`.

## Progress data

Each account's progress is saved under its own local-storage key
(`lunx_user_progress_v1__<account>`); on a connected build a copy is kept on
the server too, so it follows the account between devices, and signing out
removes the browser's copy once the server has every change. The Profile
page can export progress as a JSON file and import it again. Corrupt or
partial data is repaired to a valid state on load rather than crashing the
app. The privacy page lists everything each build stores.

## Before changing the UI

Read `CLAUDE.md` and the relevant file in `design-system/` first. Every
colour, radius, shadow, duration and easing is a token; the pre-commit
checklist at the end of `design-system/ANTI_AI_RULES.md` says what a UI diff
must not introduce.
