# LunX

An interactive field guide to how AI works, built for high-school learners
as a TSA Webmaster entry. Twenty-two lessons across five modules, with XP,
levels, streaks, hearts, gems, daily and weekly quests, a daily bonus track,
a small shop and achievements. There is no server: all progress lives in the
browser's local storage, and the course needs no profile at all.

Live site: https://certifiedmonkey992.github.io/WebMaster_Design/

## For TSA judges

Open **Sign in** at the top right and press the credentials panel to fill
them in:

| | |
|---|---|
| Username | `judge@lunx.app` |
| Passphrase | `tsa2027` |

That profile has every module unlocked, unlimited gems and 100 hearts, a
small clay control in the margin of each feature (finish a lesson, fill a
quest, break a streak, lose a heart), and a **Reviewer console** behind the
tab in the bottom-right corner — resources, levels, streaks, the whole
course, quests, badges, the daily bonus, and a button that runs the
progression engine's own test suite in the browser.

None of it fakes a result: every control calls the same reducer a learner
drives, so a skipped lesson pays the same XP, unlocks the same module and
plays the same animation as one answered question by question. Each power
can be switched off in the console to see the plain course, and judges are
equally welcome to create an ordinary profile and walk it as a student
would.

Profiles are local: they are created in this browser, nothing is transmitted
or registered, and the stored passphrase separates two learners rather than
protecting anything. See `PRIVACY` on the site for every key it writes.

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
npm run dev        # http://localhost:5176
npm test           # progression engine self-checks, run under Node
npm run lint       # eslint
npm run typecheck  # tsc (also covers the .tsx components)
npm run build      # writes the published site to docs/
```

The self-check suite (`src/dev/progressionTests.js`) drives the real reducer
with an injected clock, so calendar rollovers, streak gaps and heart recovery
are tested deterministically. It can also be run from the app: open the
course with `?dev=1` and press "Run self-tests" in the developer panel.

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

### Where the build output goes

Vite writes to `docs/` (`build.outDir` in `vite.config.js`) — a name left
over from branch-based publishing, kept so the build behaves exactly as it
did before. The deploy job uploads whatever that folder contains, so the
name is now an implementation detail rather than a requirement.

Alongside the bundle, the build writes a static HTML file per address
(`docs/about/index.html`, `docs/privacy/index.html`, …) carrying that
page's head, plus `404.html`, `sitemap.xml`, `robots.txt` and `.nojekyll`.

## Progress data

Progress is saved under one local-storage key (`lunx_user_progress_v1`).
The Profile page can export it as a JSON file and import that file again on
another browser. Corrupt or partial data is repaired to a valid state on
load rather than crashing the app. See the privacy page for everything the
site stores.

## Before changing the UI

Read `CLAUDE.md` and the relevant file in `design-system/` first. Every
colour, radius, shadow, duration and easing is a token; the pre-commit
checklist at the end of `design-system/ANTI_AI_RULES.md` says what a UI diff
must not introduce.
