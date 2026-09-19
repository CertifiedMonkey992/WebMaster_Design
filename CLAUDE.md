# LunX

An interactive course on how AI works. 22 lessons across 5 modules, with
streaks, hearts, gems, daily quests, a daily bonus track and a three-item
shop. No accounts — progress persists in `localStorage`.

## Stack

- React 18 + Vite 5. No router: `App.jsx` switches between the landing page
  and `LearnPage` with a `currentPage` state value.
- No CSS framework. Plain CSS with a token layer in `src/index.css`.
- All progression logic lives in `src/services/` and is composed into a view
  model by `src/state/ProgressionContext.jsx`. Components read `vm`; they
  never compute progression themselves.
- `src/data/` holds course content. `src/config/` holds tunable economy
  values.

```bash
npm run dev        # vite dev server on port 5176 (vite.config.js → server.port)
npm run build      # writes the published site to docs/
npm test           # the progression engine's self-check suite, under Node
npm run lint       # eslint
npm run typecheck  # tsc
```

---

# Design system — authoritative

**Before making significant frontend changes, consult the relevant files in
`design-system/`.** These documents are authoritative over any individual
implementation:

- `design-system/DESIGN_PHILOSOPHY.md` — what the product is and the nine
  principles that govern new work
- `design-system/VISUAL_SYSTEM.md` — tokens: type, colour, spacing, radius,
  shadow, border, icon, illustration, motion, z-index
- `design-system/COMPONENT_RULES.md` — how each component in this product
  looks and behaves, in every state
- `design-system/MOTION_RULES.md` — timing tiers, the motion verbs, the
  sanctioned loops and ambient motion, the Stage and its sanctioned
  performances, the field guide, and the shared motion library in
  `src/motion/`
- `design-system/ANTI_AI_RULES.md` — prohibited patterns, BAD/BETTER, plus a
  pre-commit checklist
- `design-system/REFERENCE_ANALYSIS.md` — why the references work and why
  this product previously did not

## The product must not look like a generic AI-generated website.

LunX is a **field guide to artificial intelligence**: warm paper ground,
warm ink, an evergreen structural colour, a rationed terracotta accent, an
editorial serif (Fraunces) for the product's voice and a quiet sans
(Manrope) for the interface's. It is deliberately the opposite of the dark,
glowing, indigo-to-cyan aesthetic every other product in the category uses.

## Before modifying UI

1. **Inspect the existing implementation.** Read the component and its CSS
   before changing either.
2. **Read the relevant design-system documentation.**
3. **Identify the existing component.** Six bespoke buttons existed here once.
4. **Reuse existing components** when appropriate. Search before creating.
5. **Identify design-system violations** in what you are touching.
6. **Make the smallest appropriate change.**
7. **Test the result** — run the dev server and look at the rendered page.
8. **Compare the result against the design system**, including the
   pre-commit checklist at the end of `ANTI_AI_RULES.md`.

## Do not introduce arbitrary

- **Colours** — every colour is a token in `index.css`. No hex literals in
  component CSS. No cool hues at all.
- **Radii** — five values: `--r-xs` 2, `--r-sm` 4, `--r-md` 8, `--r-lg` 12,
  `--r-pill`. Each has an assigned role.
- **Shadows** — four tokens. Nothing at rest has a shadow.
- **Typography** — eight sizes, five weights, two families. Fraunces for the
  product's voice, Manrope for the interface's, and they never swap jobs.
- **Gradients** — effectively none. Flat fills.
- **Animations** — sixteen verbs, tiered duration tokens and named easings
  (`MOTION_RULES.md`, revision 5). Every animation is a Response, a Report,
  an Invitation, a listed Ambient motion, a listed Idle event or a listed
  Demonstration, and goes through `src/motion/`. Anything that performs on
  its own registers with the Stage (`src/motion/stage.js` → `usePerformer`);
  it never keeps its own clock. No literal durations in component CSS; no
  spring on a Response. Light (glint, sparkle, bloom) only on the economy
  icons.
- **Demo data** — landing-page frames run on `ProgressionDemo` learners
  (real reducer, in memory, never saved). Previews in the app never change
  the learner's real numbers.
- **Components** — reuse `.btn`, the card pattern, the row pattern.

## Rules of engagement

- **Do not redesign the whole application when asked to modify one
  component.** Scope the change to what was asked.
- **Do not modify the design documentation to justify a poor
  implementation.** If an implementation conflicts with the design system,
  fix the implementation. The documents change only when the *design* is
  being deliberately revised, and then they change first.
- **Preserve functionality.** Progression, persistence, streaks, hearts,
  gems, quests, the daily bonus, the shop, lesson flow and the dev panel all
  work. A visual change that breaks one of them is not a visual change.
- **Use real data.** The landing page mounts real components against a real
  demo state via `ProgressionShowcase`. Do not replace working UI with
  mockups or invent figures for a stat row.
- **Features that do not exist are not implied.** There are no accounts and
  no leaderboard. The UI says so plainly rather than showing a disabled
  facsimile.

## Quick reference

| Need | Token |
|---|---|
| Page background | `--paper` |
| Card / row background | `--surface` |
| Floating surface | `--surface-raised` |
| Primary text | `--ink` |
| Secondary text | `--ink-muted` |
| Labels, metadata | `--ink-faint` |
| Hairline | `--line` (hover: `--line-strong`, inside a card: `--line-faint`) |
| Structure, primary button, nav | `--evergreen` |
| "Do this next", streak, the one emphasis | `--clay` (2–3 per screen) |
| Success, progress fill | `--moss` |
| Gems, XP, rewards | `--ochre` |
| Hearts, errors, cost | `--berry` |
