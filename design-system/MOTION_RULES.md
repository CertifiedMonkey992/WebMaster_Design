# Motion Rules

> **Revision 3 — timing is the design (2026-09).** Revision 2 made the
> interface answer the pointer everywhere. It worked, and it felt clunky:
> ~600 hand-typed durations had drifted between 360 and 900ms, an overshoot
> spring was the default easing for everything (181 uses), and the parts of a
> single gesture ran on different clocks, so they arrived out of order.
> Nothing moved when nobody was touching the page.
>
> Revision 3 keeps every verb from revision 2 and changes three things:
> **when** motion finishes (tiers, not taste), **how** it eases (springs are
> for Reports, not Responses), and **whether** anything moves unprompted (a
> fourth category, Ambient, with hard limits). The palette, type, geometry and
> "no glow, no cool hues" rules are unchanged.
>
> Revision 1 → *motion is a cost*. Revision 2 → *the page answers you*.
> Revision 3 → *the page is alive, and answers you immediately*.

## The test

Before writing an animation, answer: **what is this motion telling the
learner?** Every animation belongs to one of four categories. If it fits none,
it does not ship.

| Category | It says | Examples |
|---|---|---|
| **Response** | "I felt that." | hover, press, magnet, tilt, a tab leaning toward the pointer |
| **Report** | "Something changed, and here is what." | a number rolling, a heart cracking, a reward flying to its counter, a cover swinging open |
| **Invitation** | "This is waiting for you." | the current lesson's ping, a claimable reward's shine |
| **Ambient** | "This is a real object in a real place." | the field guide breathing on the desk, its ribbon swaying, the lesson ticker drifting |

Arrival choreography is a **Report** and runs **once**, never on re-render.

---

## Where revision 2 went wrong — the seven failures this file now forbids

1. **Duration drift.** A literal `460ms` in a component is a bug. Every
   duration is a tier token below.
2. **Spring by default.** Overshoot on a 3px label nudge reads as mush; on a
   40px travelling indicator it reads as a wobble. Responses do not overshoot.
3. **One gesture, many clocks.** The module stack's hover ran position at
   620ms, tilt at 700ms, contents at 520ms and the flip at 820ms. The eye reads
   four objects arriving separately. A gesture has **one** duration and easing;
   its parts are sequenced with *lags*, never with different durations.
4. **Hover that moves the target.** A hovered card that grows moves the edge
   under the pointer, which un-hovers it, which shrinks it. Hover never changes
   the hit area of the thing being hovered.
5. **Long tails on arrival.** A button that appears 1.45s after its screen is a
   button the learner waits for. Arrival sequences finish their *actionable*
   element by 600ms.
6. **Stillness when idle.** A living interface keeps breathing when nobody is
   touching it — quietly, and only in the places listed under **Ambient**.
7. **rAF-only reveals.** A background tab renders no frames. Every reveal races
   a timer (unchanged from revision 2, and still violated by the old stack).

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
--dur-turn:      760ms   the field guide's cover or a leaf turning
--dur-celebrate: 800ms   a reward landing, a stamp, a burst

--ease-out:    cubic-bezier(0.33, 1, 0.68, 1)     colour and opacity
--ease-snap:   cubic-bezier(0.16, 1, 0.3, 1)      travel in response to input: moves at once, lands softly, never overshoots
--ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1)     arriving at a value
--ease-lift:   cubic-bezier(0.3, 1.3, 0.5, 1)     a handled object arriving in the hand — ~3% overshoot
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  REPORTS ONLY: stamp, pop-in, number kick, icon twitch
--ease-press:  cubic-bezier(0.4, 0, 0.6, 1)       short, symmetric
--ease-in:     cubic-bezier(0.5, 0, 0.75, 0)      something leaving
--ease-swing:  cubic-bezier(0.65, 0, 0.35, 1)     a weighted thing under its own momentum; ambient drift

--stagger:     40ms      siblings arriving
--lag-follow:  40ms      the secondary part of one gesture
--lag-finish:  90ms      the supporting part of one gesture
```

JS reads the same numbers from `src/motion/timing.js`. The two files change
together.

### Which easing

| Motion | Easing | Why |
|---|---|---|
| Hover travel, magnet release, travelling indicator | `--ease-snap` | 70% of the distance is covered in the first third: the learner sees the answer before they finish moving |
| Handled object lifted (tile, chip, tab pulled out) | `--ease-lift` | a tiny overshoot is the object's weight arriving in the hand |
| Stamp, pop-in, digit kick, icon twitch | `--ease-spring` | a Report is an event; a little theatre is the point |
| Bars and numbers | `--ease-settle` | a value arriving |
| Cover, leaf, ambient drift | `--ease-swing` or keyframes | momentum both ways |
| Leaving | `--ease-in`, and ~60% of the arrival duration | leaving is never the interesting part |

---

## Choreography

### One gesture, one clock

When several elements answer one event, they share **one duration and one
easing** and are ordered with lags:

```
PRIMARY     0ms              the thing the pointer is on
SECONDARY   + --lag-follow   what the primary moved (its label, its neighbour)
SUPPORTING  + --lag-finish   what explains it (a caption, a count, a hint)
```

Total ≤ the primary's duration + `--lag-finish`. Never three different
durations for one hover.

### Depth by amplitude, not by delay

A group arriving together (a section's copy, a panel's rows) shares the reveal
duration. Layers further *back* travel **less**: the container 24px, its
heading 14px, its body 8px. The eye reads depth, not a queue. Use a delay only
when the order carries meaning (a list being dealt, a reward sequence).

### Arrival budgets

| Screen | Everything actionable by | Everything by |
|---|---|---|
| Landing hero on load | 700ms | 1300ms |
| A section scrolled into view | 400ms after it enters | 900ms |
| Popover / modal | 240ms / 320ms | +200ms |
| Lesson complete | the Continue button by 900ms | 1400ms |

### Neighbours respond

The thing under the pointer moves most; its immediate neighbours move a
fraction (≈ 15%) in the same direction; nothing further moves. (Roots &
Routes: the hovered card rises 88px, its neighbours 14px.) This is the single
most effective way to make a group of objects feel physical.

---

## The vocabulary

Twelve verbs, unchanged in meaning from revision 2, now with fixed timing.

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
| **Roll** | "this value changed" | `--dur-settle` `--ease-settle`, columns 30ms apart |
| **Settle** | "this bar changed" | `--dur-settle` `--ease-settle` |
| **Fly** | "this went there" | ≤ 1.2s total |
| **Stamp** | "this is done" | `--dur-reveal` keyframes, rotate-overshoot |

Plus the living icons (flame, low heart), unchanged.

### Hover, by object

- **Rows**: tint + the icon twitches (`--dur-move` `--ease-spring`) + the title
  nudges 3px (`--dur-move` `--ease-snap`). Symmetric in and out.
- **Clickable cards**: firm.
- **Handled objects**: lift.
- **Buttons**: fill change + magnet + pointer highlight; trailing arrow slides.
- **Nav**: one highlight slides between items (`--dur-open` `--ease-snap`).
- **Icons**: one move depicting their meaning, `--dur-move`.

### Press

Down in `--dur-micro`, released on `--ease-lift`. `translateY(1px)` plus
`--shadow-press`. The same everywhere.

### Focus

Focus never animates. Anything that animates on hover takes its *end state* on
`:focus-visible`.

---

## Ambient

The fourth category. It is what separates *"an element has an animation"*
from *"the interface is alive"* — and it is the category most likely to turn a
page into a screensaver, so it has hard limits.

### Limits

| | Limit |
|---|---|
| Drift | translate ≤ 6px, rotate ≤ 2°, scale ≤ 1.5% |
| Continuous rotation | round objects only, ≥ 60s per revolution, `linear` |
| Period | ≥ 5s; periods on one screen are mutually unrelated (e.g. 7.7s, 5.3s, 11.9s) so nothing visibly syncs |
| Easing | `--ease-swing` or sinusoidal keyframes; never a spring |
| Count | one ambient *object* per region of attention, plus the ticker |
| Interaction | an ambient loop **yields** the moment the object is handled (the float pauses while the book is under the pointer) |
| Offscreen | paused (`data-ambient` + the shared observer in `src/motion/ambient.js`) |
| Reduced motion | off |

### The sanctioned ambient list (exhaustive)

- **The field guide** (landing hero): the book breathes on the desk — rises
  4px and turns 0.5° over 7.7s — and its contact shadow tightens as it rises.
  Its ribbon sways ±2.5° on 5.3s. Its compass needle wanders ±5° when the
  pointer is away. The seal ring of type around the compass turns once every
  90s. All four stop while the book is being handled.
- **The lesson ticker** (landing, between hero and the course): every lesson
  title in the guide drifts in two rows in opposite directions, ~60s per
  cycle. It slows to a stop under the pointer, and scroll velocity pushes it
  along — faster, and in the direction you scroll.
- **The running clock** in the closing heading: after its one sweep, the hand
  keeps time, one revolution a minute.

### Invitations and running Reports (from revision 2, unchanged)

- the current lesson's ping; a claimable reward's shine and its gem's bob;
  a primary "start" action's shine (closing CTA, lesson start, practice start,
  purchase confirm)
- today's daily-bonus art bob, the gift's shake, the indicator's ping
- the next milestone stone's beckon; today's streak square ping
- a blank's pulse while a chip is dragged
- the flame flicker and the low-heart beat
- *live* dots beside genuinely live things; a running countdown's clock hand;
  a working button's loading arc

Every loop has a long rest inside its cycle, stops when its state ends, and
stops under `prefers-reduced-motion`.

---

## Pointer

Pointer response is used **strategically**: on objects you handle and on
controls you are about to press, never as a page-wide gimmick.

| Effect | Where | Rule |
|---|---|---|
| **Magnet** | solid/outline buttons, `[data-magnetic]` | ≤ 5px (≤ 8px on the page's one primary CTA) |
| **Tilt + sheen** | product frames, the field guide, reward heroes | ≤ 6°; the sheen is reflected warm light, never emitted |
| **Proximity** | the field guide's chapter tabs | a tab leans out by how close the pointer is, like fingers finding a thumb index; neighbours follow at 15% |
| **Heading** | the field guide's compass needle | points toward the pointer on an under-damped spring — a real needle overshoots and settles |
| **Inertia** | the field guide's pose | a spring (weighty: stiffness 140, damping 20), so the book lags the hand slightly and settles |

- One document listener (`FxLayer`) powers magnet, tilt and tooltips. Objects
  with their own physics (the book) run one rAF loop **only while unsettled**.
- **Touch**: no magnet, no tilt, no proximity. Tabs are simply out; the needle
  idles; every hover-revealed hint is shown; tap does what click does.
- No custom cursors. Nothing hides the system cursor.

---

## Scroll

Scroll-linked motion goes through `src/motion/scroll.js`: one passive
listener, one rAF, progress written as a CSS variable onto registered elements
that are near the viewport. CSS turns the variable into transforms.

Each landing section has its own identity inside the same system:

| Section | As it enters | While in view | As it leaves |
|---|---|---|---|
| Hero | assembles on load | the book breathes; tabs and needle follow the pointer | the book drifts up slower than the page and turns a few degrees |
| Lesson ticker | — | drifts; scroll velocity pushes it | — |
| Course | eyebrow rule draws, words rise, frame stands up | the frame scrolls the real course with you (scrub) and floats on a parallax | — |
| Streaks | frame slides in from its own side | the real components' own entrance plays **when seen**, not at page load | — |
| Daily bonus | days are dealt when the frame is seen | today's tile bobs | — |
| Quests & shop | quest bars fill when seen | — | — |
| Closing | the tally counts, the clock sweeps and then runs | — | — |

Product frames hold their inner components' entrance animations **paused
until the frame is seen** (`.pf:not(.is-seen)`), so the choreography the app
already has is performed for the reader instead of offscreen at page load.

The navbar never hides: the course link lives there. It compresses after the
first 24px of scroll and draws a clay reading-progress rule.

---

## The field guide (the hero's showcase object)

The course is presented as what the product says it is: **a field guide** — a
real book on the desk, built from `SECTIONS`, so it cannot describe a
curriculum the product does not have.

### Anatomy

```
.fg-stage          perspective, pointer, contact shadow
  .fg-float        the ambient breath (yields while handled)
    .fg-book       pose: lying on the desk, tilted by the pointer spring
      back board · page block (stacked sheets = real thickness)
      right page   (contents, or the current chapter's lessons)
      leaf         (a sheet turning, two faces)
      cover block  (the front board + the sheets before the open chapter,
                    hinged at the spine; its verso is the left page)
      chapter tabs (thumb index on the fore-edge; they travel with their pages)
      ribbon
```

### Physics

- **Hinge**: every rotating sheet turns about the spine (`transform-origin:
  left`), never about its centre.
- **Opening by a tab** lifts the cover *and every sheet before that chapter*
  as one block — which is what really happens when you open a book at a thumb
  index. The tabs of earlier chapters travel to the left page edge with it.
- **Light**: a rotating face darkens as it turns away from the light (peak at
  90°) and the page beneath takes a moving cast shadow from it. Both are keyed
  to the same timeline as the rotation, so shadows never pop.
- **Order of layers**: a turning sheet sits above both pages for its whole
  travel; content under it is swapped only when it is hidden.
- **Weight**: the pose follows the pointer on a spring; pressing dips the book
  1px; closing lands with a 3° rebound and a shadow that tightens on impact.

### Timing

| Event | Motion | Duration |
|---|---|---|
| hover the book | pose leans to the pointer on a spring; the cover lifts 14° | spring (~250ms, no visible bounce) |
| pointer near a tab | tab leans out ≤ 10px, neighbours 15% | `--dur-move` `--ease-lift` |
| hover a tab / a chapter in the hero list | that chapter's block — the cover and every sheet before it — lifts 18°; a different block already up is let down first | spring |
| press | book dips | `--dur-micro` |
| open | block swings to the left under gravity and lands with a 3° rebound; book slides to centre the spread; shadow widens — all from one angle | lands ~510ms, still ~630ms |
| turn one chapter | one leaf | `--dur-turn` × 0.85 |
| jump several chapters | up to 3 leaves riffle, 80ms apart | ≤ `--dur-turn` + 160ms |
| close | the same fall in reverse | lands ~500ms, still ~620ms |

Keyboard: the book is one focusable object. Enter/Space opens or closes;
← / → turn chapters; Escape closes. Reduced motion: every state is reached
instantly, and nothing breathes.

---

## Prohibited outright

Unchanged from revision 2:

- Glow of any kind. Sheens are warm reflected light from the pointer.
- Cool hues anywhere, including particles.
- Skeleton shimmer.
- `transition: all`.
- A literal duration in component CSS. (Keyframe *offsets* and stagger
  multipliers are fine; the base duration is a token.)
- `--ease-spring` on a Response.
- Transitions longer than `--dur-celebrate` except scroll-linked, ambient, or
  stagger-accumulated sequences.
- Animating layout properties (`top`, `left`, `height`, `margin`). Use
  `transform`, `opacity`, `clip-path`, `grid-template-rows` for expanders, and
  `width` only on progress tracks.
- A hover that changes the hovered element's size or position enough to move
  its edge out from under the pointer.
- A loop that is not listed under **Ambient** or its Invitations.
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
| `timing.js` | the token values for JS (WAAPI durations and easings) |
| `FxLayer.jsx` | one document listener: Magnet, Tilt + sheen, tooltips |
| `ambient.js` | `useAmbient()` — pauses an ambient loop while offscreen |
| `scroll.js` | `useScrollProgress()` — one listener, per-element progress, scroll velocity |
| `spring.js` | a tiny spring integrator that sleeps when settled (book pose, needle) |
| `Marquee.jsx` | the ticker: WAAPI drift, pointer brake, scroll push |
| `SplitText.jsx` | Reveal by word |
| `Reveal.jsx` / `useInView.js` | once-per-element entrance, with stagger |
| `RollingNumber.jsx` | Roll |
| `CountUp.jsx` | a figure tallied the first time it is seen |
| `flight.js` | Fly |
| `burst.js` | paper-shard bursts |
| `motion.css` | the verbs as classes and keyframes |

A component never hand-rolls one of these. If it needs something they cannot
do, extend the module.

---

## Reduced motion

`prefers-reduced-motion: reduce` leaves the interface **fully legible and
fully expressive**, not merely still.

- All durations collapse to 0.01ms (global rule in `index.css`).
- JS motion checks `prefersReducedMotion()`: flights resolve instantly, bursts
  do not spawn, tilt, magnet, springs and proximity do not attach, split text
  renders assembled, the book changes state without travelling.
- Every loop and every ambient motion stops. The ticker becomes a still,
  horizontally scrollable row.
- Colour and border feedback survives.
