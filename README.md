# LunX

An interactive field guide to how AI works, built for high-school learners
as a TSA Webmaster entry. Twenty-two lessons across five modules, with XP,
levels, streaks, hearts, gems, daily and weekly quests, a daily bonus track,
a small shop and achievements. There are no accounts and no server: all
progress lives in the browser's local storage.

Live site: https://certifiedmonkey992.github.io/WebMaster_Design/

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
build on every push and pull request.

## Publishing

GitHub Pages serves the `main` branch from `docs/`, so the built site is
committed. After a change that should go live:

```bash
npm run build
git add docs
git commit -m "Rebuild docs/ so the published site carries this work"
```

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
