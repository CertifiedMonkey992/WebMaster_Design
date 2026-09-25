# Component Rules

How the components of *this* product look and behave. Every rule assumes the
tokens in `VISUAL_SYSTEM.md`.

A single sentence governs the whole file: **these are members of one product,
not a collection of individually beautiful components.** If a component looks
good on its own but does not look related to the two beside it, it is wrong.

---

## Global: the button

There is one button. `.btn` in `App.css`, three variants, one geometry, one
press.

| | Solid | Outline | Quiet |
|---|---|---|---|
| Purpose | The one action on the screen | An alternative action | A tertiary action, a text link that needs a hit area |
| Ground | `--evergreen` (or `--clay` when the action is "do this next") | transparent | transparent |
| Text | `#FFF` | `--ink` | `--ink-muted` |
| Border | none | `1px --line-strong` | none |
| Radius | `--r-sm` | `--r-sm` | `--r-sm` |
| Type | Manrope `--fw-semi` `--fs-body` | same | same |
| Padding | `--sp-2` `--sp-5` | same | `--sp-2` `--sp-3` |

- **Hover**: solid darkens one step (`--evergreen-deep` / `--clay-deep`);
  outline fills with `--evergreen-tint` and its border goes `--evergreen`;
  quiet takes `--ink` text. **No lift on any button** — a button is attached
  to the surface it sits on — but solid and outline buttons take the
  **Magnet** verb (≤ 5px toward the pointer) and solid buttons carry a warm
  pointer-following highlight. Both come from `FxLayer`, not the button CSS.
- **Active**: `translateY(1px)` plus `--shadow-press`. This is the product's
  press, and it is the same on every button in the app.
- **Disabled**: `opacity: .45`, `cursor: not-allowed`, no hover response.
- **Loading**: the label is replaced by a 2px-stroke arc spinning at 700ms,
  the width is held, the button stays disabled.
- **Sizes**: `.btn-sm` (`--fs-small`, `--sp-1`/`--sp-3`), default,
  `.btn-lg` (`--fs-lead`, `--sp-3`/`--sp-6`). Radius does not change with
  size.
- Icons inside a button are 16px, `--sp-1` from the label. A trailing arrow
  may translate 2px on hover. Nothing else inside a button moves.

Six bespoke button implementations existed before this pass (`.cl-btn`,
`.ln-start-btn`, `.ln-popup-btn`, `.signup-card-btn`, `.modal-submit`,
`.pd-confirm`). New code adds none.

## Global: the input

- Ground `--surface`, `1px --line`, `--r-sm`, `--sp-2 --sp-3`. Implemented as
  `.form-label` / `.form-input` in `App.css` — the contact form is the only form
  in the product, so there is deliberately no second `.field-*` set.
- Label above, `--fs-small`, `--fw-semi`, `--ink-muted`, `--sp-1` gap.
- Focus: border `--evergreen`, plus the standard focus ring. No glow.
- Error: border `--berry`, message below in `--fs-caption` `--berry-ink`.
- Placeholder `--ink-faint`. Never a full example sentence that reads as
  content.

## Global: the card

- Ground `--surface`, `1px --line`, `--r-md`, `--sp-4`/`--sp-5` padding.
- **No shadow at rest.**
- Hover, *only if the whole card is a target*: border to `--line-strong`.
  If the card is not clickable it does not respond to the pointer at all.
- A card holds one idea. Two unrelated ideas is two cards, or one list.

---

## Navigation

### Left sidebar (`LearnSidebar`)

**Purpose** — get to the six places the product has, and show which one you
are in.

- Ground `--surface`, right border `--line`, full height, sticky.
- Wordmark at top: **Fraunces**, `--fs-title`, `--evergreen`, with the
  square logomark in solid `--evergreen` (not a gradient).
- Group labels: `--fs-micro`, `--ls-label`, uppercase, `--ink-faint`.
- Item: `--sp-2 --sp-3` padding, `--r-sm`, Manrope `--fs-small`
  `--fw-semi`, `--ink-muted`, icon 22px in `--ink-faint`.
- **Hover**: ground `--evergreen-tint`, text and icon `--ink`. No transform.
- **Active**: ground `--evergreen-tint`, text and icon `--evergreen`,
  `--fw-bold`, and a 3px `--evergreen` bar on the **left inside edge** of the
  item. This is the one place a coloured rail is allowed, because it marks
  position in a vertical list, which is what a rail is for.
- **Press**: `translateY(1px)`.
- The trailing accent dot is removed — the rail and the tint already carry it.
- **Responsive** (≤900px): becomes a horizontal scrolling strip under the top
  bar, icon over label, `--fs-micro`. The rail becomes a 2px **bottom** bar,
  because the axis changed.

### Landing navbar

- Flat `--paper`, no blur, no backdrop-filter, bottom hairline `--line` that
  appears on scroll.
- Wordmark Fraunces `--fs-title` `--evergreen`; links Manrope `--fs-small`
  `--ink-muted`.
- Link hover: `--ink` plus ONE `--clay` underline that slides between links
  (`--dur-open` `--ease-snap`) and rests on the section being read.
- One solid button at the right. Never two. **It is one of the page's only
  two ways into the course** (the other is the closing CTA), so the bar
  **never hides**: after 24px of scroll it compresses (the strip's ground
  scales to 56px, the wordmark to 92%) instead of tucking away.
- **The profile control** sits beside it, quiet. Signed out it is the word
  "Sign in" in the ghost style; signed in it is a chip — initials in an
  evergreen `--r-xs` tile, then the name, inside one hairline. The reviewer's
  chip is clay, so a judge can see at a glance which profile the app is in.
  It is never solid: a profile is optional, and the course is the page's
  action. Below 720px the chip keeps its mark and drops its name.
- Arrival: wordmark, links and button settle in on load, 40ms apart.

### Links into the course (landing page)

Three, each with a job, and never two on screen at once in the same place:

- **The hero's button** — the page's primary action (`btn-next btn-lg`,
  "Start lesson one"), above the fold at every width, with one line of
  facts beside it (free · no account · about five minutes). It is the
  loudest element on the first screen, as principle 6 asks.
- **The navbar's button** — always on screen, quieter (`btn-primary`).
- **The closing CTA** — the bottom of the page.
- **On phones (≤ 720px)** a sticky bar at the bottom edge takes over once the
  hero's button has scrolled away, and tucks away while the closing CTA or
  the privacy banner is on screen (`StickyCta`). A thumb cannot reach the
  navbar's corner.

The section copy and the footer do not repeat it. In-page section anchors
(the navbar's section links) are navigation, not course links. Every link
to a page is a real `<a href>` (`PageLink`), never a button.

### Sign in (`SignInPage`)

A profile in LunX is a **name on a shelf**, not a login to a server: it keeps
two people's progress apart on one browser, and it gives a TSA judge a
profile that already has everything open. Nothing is transmitted, registered
or verified. The page is built on that fact rather than around it.

- **A spread, not a split-screen hero.** Two leaves of one page on the same
  `--paper` ground, divided by the gutter and nothing else — no coloured
  panel, no photograph, no tinted half.
- **The left leaf is a PLATE** (`SignInPlate`), not an illustration of a
  person at a laptop: an ink drawing of the thing the course is about,
  inside a hairline frame, with keyed labels and a numbered Fraunces-italic
  caption under a rule. Its labels are sized in **SVG user units**, not type
  tokens — they are part of the drawing and scale with it.
- **The right leaf is the form**, in the product's one input style
  (`.form-field` / `.form-input`) and the product's one button.
- **"Sign in" and "Create a profile" are two names on one rule**, with ONE
  clay underline sliding between them — the navbar's gesture, for the same
  reason. The rule is **measured** from the chosen name, never guessed at in
  rem.
- **It asks for as little as it can**: a display name, a handle and a
  passphrase. No email validation, because there is nothing to send to.
- **It says what the passphrase is and is not.** The page states plainly that
  nothing reaches a server, that the passphrase separates two learners rather
  than protecting anything, and that the reader should not reuse one. A page
  that implied security it does not have would be worse than no page.
- **Signing in is never a wall.** "Start the course as a guest" is its own
  sentence at the foot of the page, and the whole course works without ever
  opening this page.
- **The reviewer's panel** is one card (the card rule — `--surface`, one
  hairline, `--r-md`, no shadow) holding the credentials in `--font-mono`.
  Pressing it fills the form. It is not louder than the form: it is a note to
  one reader.
- **Signed in**, the page becomes a receipt — who you are, what the profile
  can do, and the way out — never a second form.
- **Mobile**: one column; below 560px the plate is dropped rather than
  shrunk, because a plate a thumb scrolls past is decoration.

### Reviewer controls (`components/judge/`)

Present **only** on the profile marked `judge` (`config/judgeConfig.js`).
There is no flag, no query string and no key combination that summons them
anywhere else, and every operation is refused by `judgeService` on a profile
without the powers.

Two weights, deliberately different:

- **The chips** (`JudgeChip`) are **marginalia** — a reviewer's pencil in the
  margin of a proof. Clay hairline, clay ink, paper ground, Manrope
  `--fs-micro` uppercase tracked, `--r-sm`, the product's press. They sit in
  the margin of the thing they act on and are never the loudest object on the
  row: the row is what is being judged. An undo-ish chip ("Empty it", "Lock
  them") is ink, not clay — clay means "do this next", and taking something
  away never does.
- **The desk** (`JudgeConsole`) is a floating surface at
  `--surface-raised` / `--shadow-float` / `--r-lg`, behind a clay tab in the
  bottom-right corner. It is the one place in the product with a dense grid
  of controls, and they are still the product's geometry and press.

Three rules govern both:

- **Nothing draws a result.** Every control calls the same engine a learner
  drives, so a lesson skipped from a chip pays the same XP, unlocks the same
  module and plays the same animation as one answered question by question.
  A control that faked a state would be showing a judge a thing the product
  cannot do.
- **Filling is not claiming.** A quest chip pushes a quest to its target; the
  claim stays the reader's press, so the invitation, the flight and the stamp
  all still happen.
- **They can be switched off.** "Controls in the margin" in the console
  removes every chip, which is how a judge sees the plain course. So can
  the unlimited purse and the unlocked modules.

Clay is rationed to two or three per screen. That ration is spent here on
purpose, and only on one profile — on every other profile none of this
renders, so the ration is untouched.

### Site pages (contact, thank you, privacy, terms, not found)

- Built on `SitePage`: the navbar without section links, a centre column at
  the reading measure (46rem), a Fraunces title with at most one italic clay
  phrase, a lead, then rows on hairlines. No cards; the form's inputs and its
  error summary are the only edged surfaces.
- **Forms** never scold before the reader has tried to send. On submit every
  problem is listed in a berry summary that takes focus and links to its
  field; each field turns berry (`aria-invalid`), says what is wrong
  beneath it (`aria-describedby`), and re-checks itself as it changes. A
  submit button shows a working state (`aria-busy`, a small turning arc).
- **The privacy banner** is a region, not a dialog: bottom-left, `--r-lg`,
  `--shadow-float`, never takes focus. It asks only when there is something
  to consent to; otherwise it states what is stored, once.
- **The page loader** shows only if a lazily loaded page takes longer than
  `--dur-reveal` to arrive.

### The field guide (landing hero)

- The seven modules as a clothbound book (`MOTION_RULES.md` → *The field
  guide* for anatomy and physics). Closed: evergreen cover, wordmark, title,
  compass, `21 lessons · 7 chapters`. Open: a contents page, or a chapter
  spread — opener on the left, lessons with dotted leaders on the right.
- Pages are `--surface` ruled paper at `--r-xs` corners (paper has almost no
  radius); the cover board is `--r-sm` at the fore-edge and square at the
  spine.
- The hero's curriculum list drives it: hovering a module lifts that
  chapter's block, clicking opens the book at it.
- It is one focusable object with a visible focus ring and an `aria-live`
  line naming the open spread.
- It has a **repertoire** (revisions 4 and 5): left alone it lifts its cover,
  peeks at a chapter, riffles its tabs, lets the needle find north, stands
  ajar, and — as the hero's Major performance — opens itself and shows its
  pages (one turn with a hesitating page, two turns, a skim and back to the
  front, or straight open at a chapter) before closing. Its gestures take
  their turn on the Stage with the hero's copy. Any hand on it — or on the
  hero's chapter list — cancels what it is doing, and it leaves an opened
  book open for the learner.
- Its leaves bend as they turn (two panels hinged at 58%), and a cover that
  lands hard presses the book into the desk.
- ≤ 1100px it sits under the copy, centred; ≤ 560px the open book shows its
  right-hand page with the left page cropped at the stage edge.

### Product frame (landing)

- A thin window around a real component: `--r-lg`, hairline, `--shadow-float`
  (it depicts a screen standing in front of the page), a chrome strip naming
  the path and a moss *Live* tag, and a one-line caption.
- It is an ambient host: whatever lives inside stops offscreen.
- The course frame **tours itself** (revision 4, `MOTION_RULES.md` →
  *Auto-tour*) with a slim scroll thumb on its right edge; the pointer on it
  holds the tour still. Its caption says so.
- **Revision 5 — every frame has its own demo learner and a scene**
  (`ProgressionDemo`, `showcase/scenes/`). The chrome carries a **cue**
  between the path and the *Live* tag: ≤ 5 words of Manrope caption in
  `--ink-muted`, sentence case, naming what the demo learner is doing
  before it happens; the *Live* dot beats faster while a scene plays. The
  frame is a flight scope — rewards earned inside land on counters inside.
  Its controls work on the demo learner, and its caption says both: that it
  plays itself, and that the visitor can take over.
- Frames whose scene pays rewards carry the app's real top bar
  (`PlayerStatusBar`, and `DailyBonusIndicator` for the bonus frame) as the
  place those rewards land.

### Lesson ticker (landing)

- Every lesson title in the guide, in two rows drifting in opposite
  directions (`LessonTicker` → `motion/Marquee`). It sits between the hero
  and the course section and carries the eye from one to the other.
- Chips are printed labels: `--surface`, hairline, `--r-xs`; chapter number
  in the chapter's ink, a 22px icon tile, the title in Fraunces
  `--fs-small`, the duration in `--ink-faint`. Quiet on purpose — it is read
  as motion and colour, not as twenty-one headlines. Lessons only: the Case
  Files, Part projects and capstone are work, not chapter contents.
- Not buttons and not course links. Hovering a row brakes it; each chip names
  its chapter in a tooltip; scrolling pushes the rows along.
- Reduced motion: one still row per line, horizontally scrollable.

### Site footer (`Footer`)

The last chapter of the page, not a bin for the links that had nowhere else
to go. It states plainly what LunX is, what it costs (nothing), and what it
does with the reader's data — and then gets out of the way.

**Three bands on one `--paper` ground, separated by hairlines. No cards, no
shadows, no filled buttons** — the closing CTA directly above is the page's
last action and the footer never competes with it.

1. **Colophon** — the dominant column (~5/3/3; never three equal columns).
   The wordmark in Fraunces `--fs-title`, one sentence saying what the
   product is, and the course's real figures (`TOTAL_LESSONS`,
   `TOTAL_SECTIONS`) as a printed line — never invented numbers. Under it a
   clay rule the width of the wordmark: the footer's single `--clay`.
2. **Two link columns** — *The course* and *The project*. Each has a
   `--fs-micro` `--ls-label` uppercase heading in `--ink-faint` and real
   `<a href>` links (`PageLink`) at `--fs-small`, one per line. **Links are
   text, not `btn-ghost` buttons**: a footer full of lozenges reads as a
   toolbar. An external link (the source repository) carries a 45° arrow and
   says where it goes; nothing else leaves the site.
3. **The last line** — the privacy fact in `--ink-faint`, the policy date,
   `Privacy choices` (a real control, so it stays a `<button>`), and the
   back-to-top control at the right edge.

- **Hover**, per the row vocabulary: the label nudges 3px on `--dur-move`
  `--ease-snap` and a hairline underline draws from the left on the same
  clock. No lift, no background fill, no colour-only hover.
- **External link**: its arrow travels up-right 2px on the same clock.
- The wordmark is a button back to the top and keeps the shared
  `.wm-letter` ripple.
- Anything that does not exist is not implied: there is no newsletter, no app
  store and no social presence, and the footer shows none. Contact is the
  contact page plus the repository, because that is all there is
  (`SITE.contact`). The profile link is worded as what it is — "Profiles on
  this browser" — not as an invitation to sign up for anything.
- **Mobile**: the columns stack in reading order; the last line wraps above
  the back-to-top control.

### Top bar (`learn-topbar`)

- A `--paper` strip with a bottom hairline, not a gradient fade.
- Holds only: the daily-bonus control and the three status pills.
- On mobile it also holds the wordmark.

---

## The learning experience

### Module container (`SectionCard`)

**Purpose** — one module, its progress, and the lessons inside it.

- The container is `--r-lg`, `1px --line`, ground `--surface`. It holds the
  header and the lesson rows as **one object**; lesson rows inside it are
  separated by `--line-faint` and have no borders of their own. This is the
  biggest structural change from the old design, where a module was a card
  followed by five free-floating cards.
- **Header**: module number in Fraunces `--fs-section` `--ink-faint` to the
  left, title in Fraunces `--fs-title`, description `--fs-small`
  `--ink-muted`, then the progress row.
- **Status badge**: `--r-xs`, `--fs-micro`, uppercase, tracked.
  Completed → `--moss` on `--moss-tint`. In progress → `--evergreen` on
  `--evergreen-tint`. Locked → `--ink-faint` on transparent with a hairline.
  (The in-progress badge was clay in the first draft of this file. On the
  built page it sat directly above the current lesson, which already carries
  the clay border — two clay objects saying one thing. Evergreen is correct
  here: "this module is active" is structure, not emphasis.)
- **Active module**: no gradient, no illustration, no tinted ground. It is
  identified by being the only one whose lessons are expanded and whose
  current lesson carries the clay border.
- **Locked module**: `opacity: .65`, collapsed, one sentence saying what
  unlocks it. Not interactive, so it gives no pointer feedback.
- **Completed module**: a `--moss` stamp mark beside the title, collapsed by
  default.
- **Responsive**: the header stacks under 640px; the progress row keeps its
  bar and percentage on one line down to 320px.

### Lesson row (`LessonNode`)

**Purpose** — one lesson, its state, and a way in.

- A row inside the module container: `--sp-3 --sp-4`, `--line-faint` above,
  no radius of its own (the container's `--r-lg` clips the first and last).
- Left: 40px icon tile at `--r-sm`. Centre: `LESSON n · 5 min` in
  `--fs-micro` `--ink-faint`, then the title in **Fraunces** `--fs-body`.
  Right: the state mark.
- **Available**: tile `--paper-deep` / `--ink-muted`. Hover tints the row
  `--evergreen-tint` and the tile picks up `--evergreen`. No lift, no shadow.
- **Current**: this is the loudest object on the page.
  `1.5px solid --clay` around the row, ground `--surface`, a clay eyebrow, a
  solid `--clay` icon tile with white glyph, the description visible, and a
  solid clay button. One object, one border, one colour.
- **Completed**: a `--moss` check in a `--moss-tint` circle. The title stays
  full-strength `--ink` — a finished lesson is not less important, it is
  done. No tinted row background.
- **Locked**: `opacity: .6`, a small lock in `--ink-faint`, `cursor: default`,
  no hover at all.
- **The path** (revision 2): a dashed rail runs through the lesson tiles and
  fills `--moss` up to the current lesson, so a module reads as a route with a
  position on it rather than as a list. The current tile pings. The rail is a
  track carrying the same figure as the progress bar, not a decoration.
- Modules **collapse**: in-progress open, completed and locked closed. The
  header toggles it; a locked header shakes and says what unlocks it.
- Locked rows are focusable, carry a tooltip naming the lesson that unlocks
  them, and shake their lock when activated.

### Progress indicators

Three forms, and each has a fixed job.

1. **Bar** — module progress, level XP, daily goal. Track `--paper-deep`,
   fill `--moss` (or `--ochre` for XP, `--clay` for a goal not yet met),
   `--r-pill`, 6px tall. Width transitions over `--dur-settle` with
   `--ease-settle`. **No glowing leading bead.** No gradient in the fill.
2. **Fraction** — `4/22`, Manrope `--fw-bold` `tabular-nums`. Used where the
   exact count matters more than the proportion.
3. **Ring** — reserved for the daily goal in the top bar only. 3px stroke,
   `--paper-deep` track, `--ochre` fill.

Never show a bar and a percentage and a fraction for the same value. Pick
the one the reader needs.

### Lesson modal

- `--surface-raised`, `--r-lg`, `--shadow-modal`, max-width 44rem.
- A progress bar pinned to the top edge of the modal, full-bleed, 4px, no
  radius — it is a chrome element, not a track sitting on a surface.
- Hearts top-right, `--berry`. Close top-left, so it is never confused with
  losing a heart.
- Question in Fraunces `--fs-title`, options as full-width rows at `--r-sm`.
- **Correct**: the row's border and text go `--moss`, ground `--moss-tint`,
  a check appears. 180ms, no bounce.
- **Wrong**: the row goes `--berry` / `--berry-tint`, and the heart counter
  takes a single 120ms shake of 3px. One shake.
- The footer holds one solid button, full width on mobile.

### Lesson parts and steps (curriculum redesign, 2026-09)

- **A lesson is three parts** (the modal's tabs): *Predict & explore*,
  *Explain & apply*, *Check*. Each tab carries its number; the Check carries
  a small heart, because it is **the only part that spends hearts**.
  Finishing a part saves a resume point; the welcome screen says where the
  lesson picks up.
- **The heart rule, in colour.** Graded answers speak moss and berry. An
  ungraded miss — a prediction, a recall, an applied question — is shown in
  **ink** (`st-reveal`), with a paper verdict bar, because it cost nothing.
  A confident miss says so: it is the moment the lesson is built around.
- **Every verdict explains why** (`lm-fb-why`), and a prediction's reveal
  names the evidence behind it.
- **Step kinds** (`StepRenderer.jsx`): read cards at the reading measure
  (46rem when they carry a table); predictions with a *Sure / Think so /
  Guessing* row; sorts as hairline rows with segmented bins; number fields;
  transcripts as speech rows; reflections and compose fields in the one
  input style. None adds a card edge beyond the simulation's own frame.
- **Provenance labels.** Anything AI-shaped on the page carries a printed
  `--r-xs` label saying what it is: *Real model · runs in your browser*,
  *Real calculation*, *Illustrative · written for this lesson*, *Scripted
  scene*, *Practice sources*. Nothing recorded, scripted or written for the
  lesson is ever mistaken for a real system's output.

### Simulations (`components/learn/sims/`)

- A simulation is a **figure**: one hairline box (`--r-md`, no shadow), a
  Manrope title and its provenance label on one line, controls on the next,
  the working drawing below. Controls are the product's segmented control,
  a range slider on a `--paper-deep` track, and `.btn-sm` buttons.
- Drawings are ink on paper: two classes are evergreen circles and ochre
  squares (shape and colour, never colour alone), heatmaps are the two tints
  at low alpha, a loss curve is one berry line. No gradients, no glow.
- Every one works at 375px wide without a sideways scroll.

---

## Gamification

These must read as **one economy**, not four widgets. The unifying rule:
every currency is *an icon, a number in Manrope tabular-nums, and its own
semantic colour* — always in that order, always the same sizes.

### Status pills (`PlayerStatusBar`)

- **Borderless.** No surface, no border, no shadow. This file's first draft
  specified three bordered pills; the existing implementation was better and
  it won. Three bordered lozenges in the top-right corner read as three
  separate controls, and this is meant to be one strip of figures. Identity
  comes from the icon colour, and the only chrome is a tint that appears on
  hover to prove the number is clickable.
- `--sp-1 --sp-3`, icon 20px, value `--fs-body` `--fw-bold` `tabular-nums`,
  `--r-sm` on the hover tint.
- Streak `--ember`, gems `--ochre`, hearts `--berry`. The icon carries the
  colour; the number stays `--ink` so the three read as one row of figures.
- At zero: icon drops to `--ink-faint`, number stays `--ink`. Do not hide it.
- Hover: border `--line-strong`. Press: `translateY(1px)`.
- Numbers **roll** (`RollingNumber`) and hold their old value until an
  incoming reward flight lands (`useLandedValue`).
- Each pill is a flight target and carries a `data-tip` tooltip.
- The icons are **living** (`MOTION_RULES.md` → *The economy icons*): each
  has an idle life (the gem glints, the heart beats slowly, embers leave the
  flame), a hover move, and a Report for gain and loss — a bloom behind the
  icon and a flash of the currency's colour through the rolling digits when
  the value rises; a crack, a drop and a berry flash when a heart is lost.
- The three pills are one strip: on hover the icon moves and the number
  nudges toward it by 1px (one gesture, one clock). They never grow a border.

### Hearts

- Five discrete hearts, never a bar. Filled `--berry`, spent `--berry` at
  25% with a hairline outline. Losing one: the heart it was drains to the
  outline state over 240ms.
- Past **ten**, a row of glyphs stops being a row and becomes wallpaper, so
  the panel counts instead: one heart filled to the fraction held, with the
  figure beside it. Only the reviewer's profile (a hundred hearts) reaches
  this.
- At zero, the panel explains the refill timer and offers the shop. The empty
  state is informative, not punitive.

### Gems

- `--ochre` throughout: icon, the value in the shop, the price on a quest.
- Earning gems is the only place `--ochre` fill is used on a large surface
  (the daily-bonus claim tile).

### Streak

- `--ember`, which is `--clay`. A streak is the thing worth looking at.
- The week strip is seven `--r-sm` squares, not circles: filled `--ember`
  for a day met, `--paper-deep` for a day missed, hairline for a day not yet
  reached. Today is marked by a 1.5px `--ink` border, not by a colour.
- Milestone row: the target, the reward, and the distance. One line.

### Daily quests

- A list inside one card, rows separated by `--line-faint`.
- Each row: 16px icon, title `--fs-small` `--fw-semi`, a 4px progress bar,
  and the reward at the right in `--ochre-ink`.
- Complete: the row's bar fills `--moss`, the reward turns into a **Claim**
  button in solid `--ochre`.
- Claimed: the row goes to `--ink-faint` with a `--moss` check. It stays
  visible for the rest of the day. Disappearing rows lose the sense of
  having done something.

### Daily bonus

- Seven day-tiles in a row, `--r-sm`, showing the reward art.
- Past: `--surface-sunk`, art at 45%, a `--moss` check.
- Today, unclaimed: `--clay` 1.5px border, art full strength, and the only
  solid `--clay` button on the screen.
- Future: `--surface`, hairline, art at 45%, no lock icon (the position in
  the row already says it is later).
- Claiming: the tile presses, the art scales 1.06 and back over 240ms, the
  toast fires. No confetti.

### Shop

- Three real items. A list of three rows, not a grid of three cards — a grid
  of three is the generated "pricing section" and there is no third dimension
  here to justify it.
- Row: art 48px, name Fraunces `--fs-body`, one line of what it does in
  `--fs-small --ink-muted`, price right-aligned with the gem icon in
  `--ochre-ink`, and a `--btn-sm` outline Buy.
- Cannot afford: the price goes `--berry-ink` and the button disables. No
  modal explaining why.
- Purchase confirm: a small dialog, one sentence, two buttons.

---

## Feedback surfaces

### Toast (`RewardToaster`)

- `--surface-raised`, `--r-md`, `--shadow-float`, bottom-centre on mobile,
  bottom-right on desktop.
- Icon in the reward's semantic colour, one line of text, no title, no close
  button under 5s.
- Enters by sliding 8px and fading over `--dur-enter`. Leaves by fading only.
- Stacks to a maximum of three; a fourth replaces the oldest.

### Popover (`Popover`)

- `--surface-raised`, `--r-md`, `--shadow-float`, 1px `--line`.
- No arrow. An arrow on a popover anchored to a pill in a fixed bar is
  decoration; position already implies the anchor.
- Enters at 240ms, fade plus 4px rise. Closes on outside click and Escape.

### Tooltip

- `--ink` ground, `--paper` text, `--r-xs`, `--fs-caption`, `--sp-1 --sp-2`.
- Only for icon-only controls and truncated text. Never for anything a label
  could say.

### Empty state

- Left-aligned inside its container, not centred in a 60vh void.
- Fraunces `--fs-lead` line saying what would be here, one `--fs-small`
  `--ink-muted` sentence saying how to get it, and a link or button if there
  is a real next step.
- No illustration unless it explains something the sentence cannot.
- **Coming-soon views must say what they are honestly**: a sentence, a
  `--r-xs` badge, no emoji, no centred 3.5rem glyph.

### Completion state

- A `--moss` stamp mark, the thing that was completed named in Fraunces, and
  what was earned in the currency's own colour.
- One 320ms entrance. No particles, no sustained animation, no sound
  language implied by the visuals.

---

## Mascot

There isn't one, and this pass does not invent one. A mascot added to satisfy
a checklist is a decoration with a face, and it would be the least
believable thing in the interface. The product's personality is carried by
its type, its ground and its voice.

If one is ever introduced: drawn in the 2px icon language, two palette
colours, appearing **only** in empty states and completion states, never
floating beside a heading.
