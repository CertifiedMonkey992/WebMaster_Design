# Motion Rules

> **Revision 4 — the page performs between gestures (2026-09).** Revision 3
> fixed *timing* and it held: responses are immediate, gestures run on one
> clock, nothing wobbles. But a learner who stopped moving the mouse saw a
> printed page. The book "breathed" 7px over eight seconds, which nobody can
> see; the economy icons sat still until a number changed; the course frame
> only moved if you scrolled; every product frame on the landing page was a
> still photograph of a live component.
>
> Revision 4 keeps every token, verb and prohibition from revision 3 and
> adds four things:
>
> 1. **Idle events** — living objects *do something* now and then on their
>    own: the field guide lifts its cover, peeks at a chapter, and
>    occasionally opens itself and turns a page; a gem catches the light; a
>    heart beats; an ember leaves the flame. Jittered, never synchronised,
>    never while handled.
> 2. **Light, earned** — warm specular light on the economy objects (glints,
>    four-point sparkles) and a brief **bloom** behind an icon whose value
>    just rose. Light is a Report, never a resting state.
> 3. **The economy icons are flagship objects** with a full spec per state:
>    idle, hover, press, gain, loss, zero.
> 4. **Motion that runs itself where scrolling used to drive it** — the course
>    frame tours the real course on its own; the landing page and the app
>    turn like pages of one book.
>
> Revision 1 → *motion is a cost*. Revision 2 → *the page answers you*.
> Revision 3 → *the page is alive, and answers you immediately*.
> Revision 4 → *the page performs, quietly, even when you stop*.

## The test

Before writing an animation, answer: **what is this motion telling the
learner?** Every animation belongs to one of five categories. If it fits none,
it does not ship.

| Category | It says | Examples |
|---|---|---|
| **Response** | "I felt that." | hover, press, magnet, tilt, a tab leaning toward the pointer |
| **Report** | "Something changed, and here is what." | a number rolling, a heart cracking, a reward flying to its counter, a bloom behind a gem that just rose |
| **Invitation** | "This is waiting for you." | the current lesson's ping, a claimable reward's shine, a spark walking toward the next milestone |
| **Ambient** | "This is a real object in a real place." | the field guide floating on the desk, its ribbon swaying, the lesson ticker drifting |
| **Idle event** | "This object has a life of its own." | the book lifting its cover, a gem glinting, a heart's slow beat, an ember rising |

Arrival choreography is a **Report** and runs **once**, never on re-render.

---

## Hierarchy — four levels of movement

Every animation also has a **level**, and the level decides how far it may
travel, how long it may take, and how often it may happen. Importance is
shown by *amplitude*, never by duration.

| Level | What | Travel | Duration tier | Frequency |
|---|---|---|---|---|
| **1 · Micro** | icon twitch, press, a label nudge, a digit kick, a glint | ≤ 4px, ≤ 12° | `micro`–`move` | on every event |
| **2 · Component** | a card lifting, a panel opening, a bar settling, a tab leaning, a bloom | ≤ 24px | `lift`–`settle` | on events |
| **3 · Major** | the book opening or turning, a page turn between views, a reward sequence | anything | `turn`–`celebrate`, sequenced | rare, and always one at a time |
| **4 · Ambient / idle** | float, sway, drift, idle events | ≤ 10px (the book), ≤ 3px (icons) | long periods | continuous or jittered |

Two Level-3 motions never run at once. A Level-3 motion suspends every
Level-4 motion on the same object while it plays.

---

## Where revision 2 went wrong — the seven failures this file still forbids

1. **Duration drift.** A literal `460ms` in a component is a bug. Every
   duration is a tier token below.
2. **Spring by default.** Overshoot on a 3px label nudge reads as mush; on a
   40px travelling indicator it reads as a wobble. Responses do not overshoot.
3. **One gesture, many clocks.** A gesture has **one** duration and easing;
   its parts are sequenced with *lags*, never with different durations.
4. **Hover that moves the target.** Hover never changes the hit area of the
   thing being hovered.
5. **Long tails on arrival.** Arrival sequences finish their *actionable*
   element by 600ms.
6. **Stillness when idle.** A living interface keeps breathing when nobody is
   touching it — in the places listed under **Ambient** and **Idle events**.
7. **rAF-only reveals.** A background tab renders no frames. Every reveal races
   a timer.

And the one revision 3 did not catch:

8. **Imperceptible life.** An ambient motion nobody can see is a cost with no
   benefit. If a loop moves less than 2px *and* less than 1°, it is either
   made visible or deleted.

---

## Tokens

```css
/* MICRO — must feel instantaneous */
--dur-micro:     90ms    press down, icon twitch, tooltip in
--dur-press:     120ms   release
--dur-hover:     160ms   colour, border, background, opacity on hover

/* SMALL — a response that travels */
--dur-move:      240ms   nudge, slide, icon turn, underline, tab lean
--dur-lift:      320ms   a handled object picked up or put down

/* MEDIUM — something arrives or opens */
--dur-enter:     240ms   popover, toast
--dur-modal:     320ms   a modal taking the screen
--dur-open:      420ms   an expander, a view change, a travelling indicator
--dur-reveal:    560ms   something arriving on the page as it scrolls in

/* LARGE — a value, or a physical object with weight */
--dur-settle:    600ms   a number or bar moving to a new value
--dur-turn:      760ms   the field guide's cover or a leaf turning; a page turn between views
--dur-celebrate: 800ms   a reward landing, a stamp, a burst, a bloom

--ease-out:    cubic-bezier(0.33, 1, 0.68, 1)     colour and opacity
--ease-snap:   cubic-bezier(0.16, 1, 0.3, 1)      travel in response to input: moves at once, lands softly, never overshoots
--ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1)     arriving at a value
--ease-lift:   cubic-bezier(0.3, 1.3, 0.5, 1)     a handled object arriving in the hand — ~3% overshoot
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  REPORTS ONLY: stamp, pop-in, number kick, icon twitch
--ease-press:  cubic-bezier(0.4, 0, 0.6, 1)       short, symmetric
--ease-in:     cubic-bezier(0.5, 0, 0.75, 0)      something leaving
--ease-swing:  cubic-bezier(0.65, 0, 0.35, 1)     a weighted thing under its own momentum; ambient drift; an auto-tour glide

--stagger:     40ms      siblings arriving
--lag-follow:  40ms      the secondary part of one gesture
--lag-finish:  90ms      the supporting part of one gesture

/* Revision 4 — idle periods. Mutually unrelated so nothing on one screen syncs. */
--idle-glint:  6.7s      a gem catching the light
--idle-beat:   5.3s      a healthy heart's slow beat
--idle-zap:    7.9s      the XP bolt's flicker
--idle-float:  5.9s      reward art floating in its tile
--idle-sweep:  9.7s      light crossing a large surface (the book's cloth, day 7's foil, a medal); a rule drawn again
--idle-run:    7.3s      a wave running along a row (the streak week, the course ticks)
--idle-wave:   6.1s      things in a list stirring in turn (locked bonus days, quest icons)
```

JS reads the same numbers from `src/motion/timing.js`. The two files change
together.

### Which easing

| Motion | Easing | Why |
|---|---|---|
| Hover travel, magnet release, travelling indicator, page turn | `--ease-snap` | 70% of the distance is covered in the first third |
| Handled object lifted | `--ease-lift` | a tiny overshoot is the object's weight arriving in the hand |
| Stamp, pop-in, digit kick, icon twitch, bloom scale | `--ease-spring` | a Report is an event; a little theatre is the point |
| Bars and numbers | `--ease-settle` | a value arriving |
| Cover, leaf, ambient drift, auto-tour glide | `--ease-swing` or keyframes | momentum both ways |
| Leaving | `--ease-in`, ~60% of the arrival duration | leaving is never the interesting part |

---

## Choreography

### One gesture, one clock — and the room reacts

When several elements answer one event, they share **one duration and one
easing** and are ordered with lags:

```
PRIMARY      0ms              the thing the pointer is on / the value that changed
SECONDARY    + --lag-follow   what the primary moved (its label, its number)
SUPPORTING   + --lag-finish   what explains it (a caption, a count, a hint)
ENVIRONMENT  + --lag-finish   what noticed it (a bloom, sparkles, a neighbour leaning)
```

Environment motion is Level 1 or 2, always smaller than the primary, and it
finishes last. A gem landing: the pill bumps (0), the number rolls and kicks
(+40), the tooltip text updates (+90), the bloom and sparkles open behind the
icon (+90) and fade after everything else has stopped.

### Depth by amplitude, not by delay

A group arriving together shares the reveal duration. Layers further *back*
travel **less**. Use a delay only when the order carries meaning.

### Arrival budgets

| Screen | Everything actionable by | Everything by |
|---|---|---|
| Landing hero on load | 700ms | 1300ms |
| A section scrolled into view | 400ms after it enters | 900ms |
| Popover / modal | 240ms / 320ms | +200ms |
| Page turn landing ↔ app | the new page is readable by 560ms | `--dur-turn` |
| Lesson complete | the Continue button by 900ms | 1400ms |

### Neighbours respond

The thing under the pointer moves most; its immediate neighbours move ≈ 15%
in the same direction; nothing further moves.

---

## The vocabulary

Twelve verbs from revision 3, plus two for light.

| Verb | Means | Timing |
|---|---|---|
| **Tint** | "this is interactive" | `--dur-hover` `--ease-out` |
| **Firm** | "this whole surface is a target" | `--dur-hover`; shadow `--dur-lift` |
| **Press** | "you pressed it" | down `--dur-micro` `--ease-press`, release `--dur-lift` `--ease-lift` |
| **Magnet** | "I'm reaching for you" | follow `--dur-move` `--ease-snap`, release `--dur-open` `--ease-snap` |
| **Lift** | "you picked this up" | `--dur-lift` `--ease-lift` |
| **Tilt** | "this has depth" | follow 120ms `--ease-out`, release `--dur-reveal` `--ease-snap` |
| **Rise** | "this arrived in front of the page" | `--dur-enter` / `--dur-modal` `--ease-snap` |
| **Reveal** | "this arrived on the page" | `--dur-reveal` `--ease-snap`, `--stagger` |
| **Roll** | "this value changed" | `--dur-settle` `--ease-settle`, columns 30ms apart, the digits flash the currency's colour |
| **Settle** | "this bar changed" | `--dur-settle` `--ease-settle` |
| **Fly** | "this went there" | ≤ 1.2s total |
| **Stamp** | "this is done" | `--dur-reveal` keyframes, rotate-overshoot |
| **Glint** *(rev 4)* | "this is valuable" | a band of warm light crosses a gem's facets in ~15% of `--idle-glint`; a four-point sparkle twinkles once |
| **Bloom** *(rev 4)* | "this just grew" | a warm radial light opens behind the icon and fades: `--dur-celebrate`, scale on `--ease-spring`, opacity on `--ease-out` |

### Hover, by object

- **Rows**: tint + the icon twitches (`--dur-move` `--ease-spring`) + the title
  nudges 3px (`--dur-move` `--ease-snap`).
- **Clickable cards**: firm.
- **Handled objects**: lift.
- **Buttons**: fill change + magnet + pointer highlight; trailing arrow slides.
- **Nav**: one highlight slides between items (`--dur-open` `--ease-snap`).
- **Icons**: one move depicting their meaning, `--dur-move`. Economy icons:
  see below.

### Press

Down in `--dur-micro`, released on `--ease-lift`. `translateY(1px)` plus
`--shadow-press`. The same everywhere.

### Focus

Focus never animates. Anything that animates on hover takes its *end state* on
`:focus-visible`.

---

## Light (revision 4)

Revisions 1–3 said *no element emits light*. That kept the product from
looking like every glowing AI dashboard, and it also made the economy — the
part of the product that is supposed to feel like treasure — look like ink on
paper. Revision 4 allows light in exactly three forms, all warm, all on the
economy objects, none on chrome:

| Form | Where | Rule |
|---|---|---|
| **Specular** | gem crown and table facets, heart and shield shine marks, the flame's core | drawn into the icon, `--gem-light` / `--sheen-rgb`; always present, never animated in brightness at rest |
| **Glint** | gems (idle), day 7's foil, the book's cloth | one band crossing, then a long rest; a four-point sparkle at a facet corner |
| **Bloom** | behind a gem, heart, flame or bolt whose value just **rose** | a Report: `--dur-celebrate`, peak alpha ≤ .55, radius ≤ 2.4× the icon; gone when the Report ends |

Still prohibited: glow at rest; glow on text, buttons, progress bars, borders
or nav; any `box-shadow: 0 0 …` in an accent; any cool hue; a lit bead on the
leading edge of a bar.

---

## The economy icons — flagship objects

Gems, hearts and the streak are the product's reward loop. They are drawn as
small physical objects (`Icons.jsx`) and animated by `LiveIcons.jsx`. An icon
is *live* when it sits in a place that reports a real, changing value (the top
bar, the lesson overlay, the progress card, the streak and gem panel heroes);
elsewhere it is a still picture. Every live icon has the whole table:

| State | Gem | Heart | Flame (streak) |
|---|---|---|---|
| **Idle** | a glint crosses the facets and a sparkle twinkles, once per `--idle-glint` with a seeded offset | a slow lub-dub (scale 1.07 / 1.03) once per `--idle-beat` | three layers flicker on unrelated periods; an ember rises every few seconds |
| **Idle, urgent** | — | one heart left: a strong beat every 2.4s | at risk (today not done): shorter, paler, swaying; no embers |
| **Hover** | tips toward the light: rotate −8°, scale 1.14, glint + sparkle at once | beats once | the fire leans up (scale 1.1 / 1.25) |
| **Press** | pill presses (`translateY(1px) scale(.95)`) | same | same |
| **Gain** | turns over like a coin, flashes, bloom in `--ochre-bright`, 4–6 sparkles; the figure rolls and flashes ochre | double beat, bloom in `--berry-bright`, shards; figure flashes berry | flares, sparks thrown upward, bloom in `--clay-bright`; at a milestone a ring and a confetti burst |
| **Loss** | sinks and dulls; figure rolls down and flashes berry | cracks: halves part, the crack flashes, a heart drops away; pill shakes once | douses (sinks) |
| **Zero** | stays ochre; the figure stays ink | ash-coloured outline, ground tint on the pill, no beat | ash, still |

Idle offsets are **seeded per instance**, so three gems in a quest list glint
at different moments and never as a chorus.

**Inside a lesson the icons keep their Reports and lose their idle life.** A
lesson is where the learner concentrates; the counters in its header crack,
bloom and roll when something changes, but they do not gleam, beat slowly or
throw embers while a question is being read. (The one-heart-left beat stays:
it is a warning, not life.)

---

## Ambient

What separates *"an element has an animation"* from *"the interface is
alive"* — and the category most likely to turn a page into a screensaver, so
it has hard limits.

### Limits

| | Limit |
|---|---|
| Drift | the book: translate ≤ 10px, rotate ≤ 1.5°; everything else: translate ≤ 4px, rotate ≤ 3° |
| Visibility | at least 2px or 1° — see failure 8 |
| Continuous rotation | round objects only, ≥ 60s per revolution, `linear` — or a clock hand ticking `steps(60)` |
| Period | ≥ 5s for drift; periods on one screen mutually unrelated |
| Easing | `--ease-swing` or sinusoidal keyframes; never a spring |
| Count | one ambient *object* per region of attention, plus the ticker; idle events are per object and do not count against it |
| Interaction | a loop **yields** the moment the object is handled |
| Offscreen | paused (`useAmbient()` in `src/motion/ambient.js`) |
| Reduced motion | off |

### The sanctioned ambient list (exhaustive)

- **The field guide** (landing hero): the book floats on the desk — rises 9px
  and turns 0.8° over 7.7s, and drifts a further 0.6° on an unrelated 11.3s
  period — and its contact shadow tightens as it rises. Its ribbon sways
  ±3.5° on 5.3s. A band of window light crosses the cloth once per
  `--idle-sweep`. The seal ring turns once every 90s. All of it holds still
  while the book is handled or open.
- **The lesson ticker**: two rows drifting in opposite directions, ~60s per
  cycle; slows under the pointer; scroll velocity pushes it.
- **The course frame's tour** (landing, section 1): see *Auto-tour*.
- **Reward art floating in its tile**: today's daily-bonus art, the shop
  items in the landing's shop list — ≤ 4px on `--idle-float`, each item on a
  different multiple.
- **Clocks**: the closing heading's clock and every countdown clock tick once
  a second (`steps(60)` over 60s) — a clock that visibly keeps time.

### Idle events (revision 4)

An idle event is a self-contained gesture a living object performs *now and
then* — not a loop you can learn. Rules:

- Scheduled with jitter by `src/motion/idle.js` (JS) or by a long keyframe
  cycle whose visible part is ≤ 25% of the period with a **seeded** negative
  delay (CSS). No two consecutive intervals are the same.
- Only while the object is on screen, the tab is visible, and nobody is
  handling it. A handled object waits ≥ 8s after the hand leaves.
- Never the same gesture twice in a row.
- Reduced motion: none.

The sanctioned idle events:

| Object | Events |
|---|---|
| **Field guide** | cover lifts 9–14° and falls back with a tap · a chapter block lifts and its tab leans out · the thumb tabs riffle top to bottom · the needle swings wide and finds north again · **the tour**: at most once per 30s, only after 5s without input, the book opens at the contents, turns one or two chapters, and closes itself |
| **Gem** (live and in price tags) | glint + sparkle |
| **Heart** (live) | slow beat |
| **Flame** (live, lit) | embers rising from the tip |
| **XP bolt** (level badge) | a double flicker |
| **Streak Shield** | a glint crossing the face |
| **Streak week** | a warm sheen runs across the ticked days, left to right |
| **Milestone path** | a spark walks from today's streak to the next stone (Invitation) |
| **Locked bonus days** | a ripple runs down the row: each waiting reward lifts a little in turn |
| **Quest icons** | each quest's icon ticks once, one row after another |
| **Course ticks** | a wave runs along the lessons already done and lands on the next one |
| **Closing tally** | the rules under the three figures are drawn again, one after another |
| **Earned medals** | an unlocked achievement catches the light |
| **Quest bars in progress** | one band of light along the fill |
| **Day 7 foil** | the foil sheen crosses the tile |

### Invitations and running Reports (from revision 2, unchanged)

- the current lesson's ping; a claimable reward's shine and its gem's bob;
  a primary "start" action's shine
- today's daily-bonus art bob, the gift's shake, the indicator's ping
- the next milestone stone's beckon; today's streak square ping
- a blank's pulse while a chip is dragged
- the flame flicker and the low-heart beat
- *live* dots beside genuinely live things; a working button's loading arc

Every loop has a long rest inside its cycle, stops when its state ends, and
stops under `prefers-reduced-motion`.

---

## Pointer

Pointer response is used **strategically**: on objects you handle and on
controls you are about to press, never as a page-wide gimmick.

| Effect | Where | Rule |
|---|---|---|
| **Magnet** | solid/outline buttons, `[data-magnetic]` | ≤ 5px (≤ 8px on the page's one primary CTA) |
| **Tilt + sheen** | product frames, the field guide, reward heroes | ≤ 6°; the sheen is reflected warm light |
| **Proximity** | the field guide's chapter tabs | a tab leans out by how close the pointer is; neighbours follow at 15% |
| **Heading** | the field guide's compass needle | points toward the pointer on an under-damped spring |
| **Inertia** | the field guide's pose | a weighty spring; inside the stage it follows fully; **anywhere else in the hero it turns ~30% toward the pointer** — it noticed you (rev 4) |

- One document listener (`FxLayer`) powers magnet, tilt and tooltips. Objects
  with their own physics run one rAF loop **only while unsettled**.
- **Touch**: no magnet, no tilt, no proximity. Tabs are simply out; the needle
  idles; every hover-revealed hint is shown; tap does what click does; idle
  events still play.
- No custom cursors.

---

## Scroll

Scroll-linked motion goes through `src/motion/scroll.js`: one passive
listener, one rAF, progress written as a CSS variable onto registered elements
near the viewport.

| Section | As it enters | While in view | As it leaves |
|---|---|---|---|
| Hero | assembles on load | the book floats and performs idle events; tabs, needle and pose follow the pointer | the book drifts up slower than the page and turns a few degrees |
| Lesson ticker | — | drifts; scroll velocity pushes it | — |
| Course | eyebrow rule draws, words rise, frame stands up | **the frame tours the real course by itself** and floats on a parallax | — |
| Streaks | frame slides in from its own side | embers rise from the flame, a sheen runs the week, a spark walks to the next milestone | — |
| Daily bonus | days are dealt when the frame is seen | today's art floats and twinkles, the locked days ripple, day 7's foil sweeps | — |
| Quests & shop | quest bars fill when seen | bars glint in turn, shop items float, price gems glint | — |
| Closing | the tally counts, the clock sweeps | the clock ticks each second; the rules under the tally are drawn again in turn; the tally column floats on a slower parallax than the copy | — |

Product frames hold their inner components' entrance animations **paused
until the frame is seen** (`.pf:not(.is-seen)`), and every frame is an
ambient host, so its loops stop offscreen.

The navbar never hides: after 24px it compresses and draws a clay
reading-progress rule.

### Auto-tour (revision 4)

The course frame used to scrub its content with the page scroll, which meant
it only moved while the reader was scrolling *past* it — exactly when nobody
is looking at it. It now **tours itself** (`src/motion/tour.js`):

```
hold at the top            1.6s
glide to the current lesson   distance-based, 1.2–2.6s, --ease-swing
hold on it                 2.8s   (the loudest object in the product)
glide to the bottom        distance-based
hold                       1.8s
glide back to the top      1.2s
```

- Web Animations on `transform`, so a glide costs no main-thread frames; holds
  are timers. A slim scroll thumb on the frame's edge travels on the same
  timing.
- **Yields to the hand**: the pointer on the frame pauses the tour mid-glide;
  it resumes 700ms after the pointer leaves.
- Paused offscreen and in a hidden tab.
- Reduced motion: no tour; the frame becomes an ordinary scrollable panel.

---

## Page turns (revision 4)

The landing page and the app are two parts of one field guide, so moving
between them is a page turn (`src/motion/pageTurn.js`, View Transitions):

- **Into the app**: the new page slides in from the right edge over
  `--dur-turn × 0.85` on `--ease-snap` (it answers a click, so it is visibly
  moving on its first frame), carrying a warm shadow on its leading edge; the
  old page moves a third of the way left and dims to 92%.
- **Back home**: the same, mirrored.
- No View Transitions support, or reduced motion: the swap is instant.
- Inside the app, destinations keep `.view-enter` (a rise from the direction
  the nav moved).

---

## The field guide (the hero's showcase object)

The course is presented as what the product says it is: **a field guide** — a
real book on the desk, built from `SECTIONS`.

### Anatomy

```
.fg-stage          perspective, pointer, contact shadow
  .fg-float        the ambient float (yields while handled)
    .fg-book       pose: lying on the desk, tilted by the pointer spring
      back board · page block (stacked sheets = real thickness)
      right page   (contents, or the current chapter's lessons)
      leaf         (a sheet turning, two faces)
      cover block  (the front board + the sheets before the open chapter,
                    hinged at the spine; its verso is the left page)
        glare      a band of window light crossing the cloth (ambient)
      chapter tabs (thumb index on the fore-edge)
      ribbon
```

### Physics

- **Hinge**: every rotating sheet turns about the spine, never its centre.
- **Opening by a tab** lifts the cover *and every sheet before that chapter*
  as one block.
- **Light**: a rotating face darkens as it turns away from the light and the
  page beneath takes a moving cast shadow — both keyed to the same timeline.
- **Order of layers**: a turning sheet sits above both pages for its whole
  travel; content under it is swapped only when it is hidden.
- **Weight**: the pose follows the pointer on a spring; pressing dips the book;
  closing lands with a 3° rebound; an idle cover lift falls back with a tap.

### Idle life (revision 4)

The book is the page's most interesting object and it behaves like one:
mostly still, then it does something, then it settles.

| Gesture | Weight | What happens | Length |
|---|---|---|---|
| **lift** | 3 | the cover rises 9–14° on a soft spring and falls back with a tap | ~1.1s |
| **peek** | 3 | a random chapter's block lifts 16–20°, its tab leans out, it falls back | ~1.5s |
| **riffle** | 2 | the five thumb tabs lean out one after another, top to bottom | ~0.9s |
| **north** | 2 | the needle swings 120–220° away and finds north again | ~1.4s |
| **tour** | rare | opens at the contents; turns one chapter (sometimes two); closes | ~7s |

- First gesture ~2.5s after the book lands; then a rest of 4–9s between
  gestures, jittered, never the same rest twice.
- The tour needs ≥ 5s without input anywhere, ≥ 30s since the last tour and
  ≥ 2 small gestures since.
- **The hand always wins**: pointer on the stage, a key, a hover on the hero's
  chapter list, or focus cancels the running gesture at once. If the tour had
  opened the book, it stays open for the learner to use. Idle events resume
  8s after the last interaction.
- Leaving the screen mid-tour closes the book instantly (no frames spent on
  something nobody can see).

### Timing

| Event | Motion | Duration |
|---|---|---|
| hover the book | pose leans to the pointer; the cover lifts 14° | spring (~250ms) |
| pointer near a tab | tab leans out ≤ 10px, neighbours 15% | `--dur-move` `--ease-lift` |
| hover a chapter in the hero list | that chapter's block lifts 18° | spring |
| press | book dips | `--dur-micro` |
| open | block swings under gravity, lands with a 3° rebound; book slides to centre the spread | lands ~510ms, still ~630ms |
| turn one chapter | one leaf | `--dur-turn` × 0.85 |
| jump several chapters | up to 3 leaves riffle, 80ms apart | ≤ `--dur-turn` + 160ms |
| close | the same fall in reverse | lands ~500ms, still ~620ms |

Keyboard: one focusable object. Enter/Space opens or closes; ← / → turn
chapters; Escape closes. Reduced motion: every state is reached instantly, and
nothing floats or performs.

---

## Performance

More life, no more cost:

- Loops animate `transform` (including the individual `translate`, `rotate`
  and `scale` properties) and `opacity` only. On an HTML box — a pseudo-element
  sheen, an ember, a tile, the root `<svg>` of an icon — the compositor runs
  them and they cost the main thread nothing.
- Loops on SVG *children* (a flame's layers, a gem's glint band) repaint
  their icon every frame. They are allowed inside a ≤ 48px icon, and budgeted:
  **≤ 12 SVG-child loops in any one region of attention.** Prefer moving an
  HTML box when either would do (the streak week hops its squares, not the
  checks inside them).
- Every ambient host is registered with `useAmbient()`; loops inside it pause
  offscreen. Every product frame is an ambient host.
- No per-frame JS while nothing changes: idle events are timers, tours are
  Web Animations, springs sleep when settled.
- Particles (bursts, sparkles) remove themselves; a burst is ≤ 24 nodes.

---

## Prohibited outright

- Glow at rest, or anywhere outside the three forms under **Light**.
- Cool hues anywhere, including particles.
- Skeleton shimmer.
- `transition: all`.
- A literal duration in component CSS. (Keyframe *offsets*, stagger
  multipliers and the idle period tokens are fine.)
- `--ease-spring` on a Response.
- Transitions longer than `--dur-celebrate` except scroll-linked, ambient,
  idle, tour or stagger-accumulated sequences.
- Animating layout properties (`top`, `left`, `height`, `margin`). Use
  `transform`, `opacity`, `clip-path`, `grid-template-rows` for expanders, and
  `width` only on progress tracks.
- A hover that moves the hovered element's edge out from under the pointer.
- A loop or idle event that is not listed above.
- Two idle events on one screen with the same period and no seeded offset.
- An idle event that runs while its object is handled.
- A `position: fixed` dialog inside an element with a *filled* transform
  animation (`backwards`, never `both`).
- Motion that depends only on `requestAnimationFrame` to reveal content.
- A per-frame JS loop that runs while nothing is changing.
- Custom cursors.

---

## Implementation

All shared motion lives in `src/motion/`:

| Module | Job |
|---|---|
| `timing.js` | the token values for JS |
| `FxLayer.jsx` | one document listener: Magnet, Tilt + sheen, tooltips |
| `ambient.js` | `useAmbient()` — pauses loops while offscreen; `isOnScreen`, `onVisibility` |
| `idle.js` *(rev 4)* | the page's activity clock (`idleFor()`), `every()` jittered scheduling, `pick()` without repeats, `seedOf()` for per-instance offsets |
| `tour.js` *(rev 4)* | `createTour()` — the self-running course frame |
| `pageTurn.js` *(rev 4)* | `turnPage(update, dir)` — View Transitions between landing and app |
| `scroll.js` | `useScrollProgress()` — one listener, per-element progress, scroll velocity |
| `spring.js` | a tiny spring integrator that sleeps when settled |
| `Marquee.jsx` | the ticker |
| `SplitText.jsx` | Reveal by word |
| `Reveal.jsx` / `useInView.js` | once-per-element entrance, with stagger |
| `RollingNumber.jsx` | Roll, with the currency flash |
| `CountUp.jsx` | a figure tallied the first time it is seen |
| `flight.js` | Fly |
| `burst.js` | paper-shard bursts, rings, **sparkles** and **bloom** |
| `motion.css` | the verbs as classes and keyframes |

A component never hand-rolls one of these. If it needs something they cannot
do, extend the module.

---

## Reduced motion

`prefers-reduced-motion: reduce` leaves the interface **fully legible and
fully expressive**, not merely still.

- All durations collapse to 0.01ms (global rule in `index.css`).
- JS motion checks `prefersReducedMotion()`: flights resolve instantly, bursts,
  sparkles and blooms do not spawn, tilt, magnet, springs and proximity do not
  attach, split text renders assembled, the book changes state without
  travelling, idle events never schedule, the tour does not run (the frame
  scrolls by hand), page turns are instant.
- Every loop and every ambient motion stops. The ticker becomes a still,
  horizontally scrollable row.
- Colour and border feedback survives, including the number flash's final
  colour.
