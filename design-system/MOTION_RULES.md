# Motion Rules

> **Revision 2 — the living interface (2026-09).** The first revision of this
> file treated motion as a cost to be minimised: five verbs, nothing loops,
> nothing lifts. It produced a correct, calm interface that read as *static* —
> a printed page that happened to keep score. This revision was requested
> deliberately: LunX should feel like an object you handle. The palette, type,
> geometry and "no glow, no cool hues" rules are unchanged. What changed is
> how much the page is allowed to answer you, and how.

## The test

Before writing an animation, answer: **what is this motion telling the
learner?**

Every animation in the product belongs to one of three categories. If it fits
none of them, it does not ship.

| Category | It says | Examples |
|---|---|---|
| **Response** | "I felt that." | hover, press, magnetic pull, tilt, a chip that lifts when dragged |
| **Report** | "Something changed, and here is what." | a number rolling, a heart cracking, a reward flying to its counter, a bar settling |
| **Invitation** | "This is waiting for you." | the current lesson's ping, a claimable reward's shine, today's bonus bobbing |

Arrival choreography (a heading assembling word by word, a stack of cards
being dealt) is a **Report** — it reports that the thing has arrived — and it
runs **once**, never on re-render.

---

## Tokens

```css
--dur-micro:     90ms    icon twitch, tooltip in
--dur-press:     120ms   press / release
--dur-hover:     180ms   hover in and out
--dur-enter:     240ms   popover, toast, panel arriving
--dur-modal:     320ms   a modal taking the screen
--dur-settle:    600ms   a number or bar moving to a new value
--dur-celebrate: 800ms   a reward landing, a stamp, a burst

--ease-out:    cubic-bezier(0.33, 1, 0.68, 1)     responding to input
--ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1)     arriving at a value
--ease-press:  cubic-bezier(0.4, 0, 0.6, 1)       short, symmetric
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  a physical object overshooting
--ease-in:     cubic-bezier(0.5, 0, 0.75, 0)      something leaving

--stagger: 45ms   the gap between siblings arriving
```

Seven durations. The two added in this revision exist because *micro*
(an icon twitch) and *celebrate* (a reward landing) were being forced into
the nearest neighbour and felt wrong in both.

---

## The vocabulary

Twelve verbs, each with a fixed meaning. A component combines verbs; it does
not invent a thirteenth.

| Verb | Means | Where |
|---|---|---|
| **Tint** | "this is interactive" | rows, nav items, list items |
| **Firm** | "this whole surface is a target" | clickable cards: border to `--line-strong` |
| **Press** | "you pressed it" | every button: `translateY(1px)` + `--shadow-press`, spring release |
| **Magnet** | "I'm reaching for you" | solid and outline buttons drift ≤ 5px toward the pointer |
| **Lift** | "you picked this up" | objects that are handled — index cards, reward tiles, shop art, dragged chips. Rise + `--shadow-lift`. **Not** list rows, **not** buttons. |
| **Tilt** | "this has depth" | product frames, the module fan, reward heroes — ≤ 6° toward the pointer, with a warm sheen at the pointer position |
| **Rise** | "this arrived in front of the page" | popovers, toasts, modals: fade + translate, scale-from-origin for anchored panels |
| **Reveal** | "this arrived on the page" | headings assemble by word, paragraphs fade up, lists stagger at `--stagger` — once per element, on first view |
| **Roll** | "this value changed" | every live number is an odometer: digits roll up or down |
| **Settle** | "this bar changed" | progress fills travel over `--dur-settle`, with one shine sweep on change |
| **Fly** | "this went there" | a reward's particles travel from where it was earned to the counter it lands in; the counter catches it |
| **Stamp** | "this is done" | completion checks, claimed days: rotate-overshoot, never scale-bounce |

Plus two **living icons**, which are the only sanctioned idle animation:

| Icon | Idle | Why it may move |
|---|---|---|
| Streak flame | three layers flicker on offset periods, only while the streak is alive | a live flame that stands still reads as a sticker; the flicker *is* the state "burning" |
| Heart (≤ 1 left) | a lub-dub beat every ~2.4s | it is the one warning the product gives before a lesson is blocked |

---

## Loops

Loops are allowed **only** in these named cases, and each must switch off the
moment its state ends. This list is exhaustive — the audit command's `loops`
count must be explainable line by line from it.

**Invitations** — something is waiting for the learner:

- the current lesson's ping → stops when there is no current lesson
- a claimable reward's shine, and its gem's bob → stop when claimed
- a primary "start" action's shine (hero, closing CTA, lesson start, practice
  start, purchase confirm) → the button is the page's next action
- today's daily-bonus art bob, the gift's shake, the indicator dot's ping →
  stop when claimed
- the next milestone stone's beckon on the streak path
- today's day square ping in the streak week → stops once today counts
- a blank's pulse while a chip is being dragged → stops on drop

**Living icons** — the loop *is* the state:

- the flame flicker → stops at streak 0; a gentler sway while at risk
- the low-heart beat → stops above one heart

**Reports of something running:**

- *live* dots (moss, with a ping) beside things that are genuinely live —
  "22 lessons live", a product frame's "Live" label, the resume strip, an
  in-progress module's badge
- the hand of a clock icon beside a running countdown, stepping once a
  second-equivalent over a minute
- the loading arc on a button that is working

Every loop has a long rest inside its cycle (a ping is visible for ~30% of its
period). Nothing loops at full intensity. Nothing loops under
`prefers-reduced-motion`.

### What counts as a handled object (Lift)

Index cards in the module stack, daily-bonus day tiles, word chips, answer
options, lesson-complete reward tiles, heart slots and streak-week squares,
shop art (lifting out of its tile), achievement medals. **Not**: buttons,
rows, facts, balance cards, or anything that is not itself the thing being
picked up.

---

## By interaction

### Hover

- **Rows**: tint + the row's icon twitches (scale 1.1, −6°) + the title slides
  2–3px. Symmetric in and out.
- **Clickable cards**: firm + `--shadow-raised`.
- **Handled objects** (fan cards, reward tiles, shop art): lift.
- **Buttons**: darken/fill as before, *plus* magnet and a pointer-following
  highlight on solid buttons. The trailing arrow still slides.
- **Nav**: a single highlight slides between hovered items rather than each
  item tinting separately; the active rail slides to the new item on change.
- **Icons**: each nav icon has one move that depicts its meaning — the roof
  lifts, the book opens, the bars grow, the star turns.

### Press

`translateY(1px)` + `--shadow-press`, 120ms `--ease-press` down, and a
`--ease-spring` release. Consistent everywhere.

### Focus

Focus never animates. `2px solid var(--evergreen)`, `2px` offset, instant.
Anything that animates on hover also takes its *end state* on
`:focus-visible`, so a keyboard user sees the lifted card, not the resting one.

---

## By event

### A value changes

- Numbers **roll**: each digit is a column that travels to its new value,
  columns staggered 30ms right-to-left.
- A number that is receiving a flight **holds its old value until the flight
  lands**, then rolls. The counter must never update before the reward
  visibly arrives — that is the whole point of the flight.
- Bars settle over `--dur-settle` and fire one shine sweep.
- Values do not roll on first render.

### A reward is earned

1. Particles (the reward's own icon, 3–8 of them) leave the source on a curved
   path, staggered 55ms.
2. The target counter catches each one: a 1.18 scale bump.
3. When the last lands, the number rolls.
4. A burst of 10–14 paper shards in the reward's colour at the landing point.

Total ≤ 1.2s. If no counter is on screen, the counter updates immediately and
nothing flies.

### A heart is lost

The heart **cracks**: the two halves part by 1.5px and rotate ±8°, a fragment
drops, the fill level drains, the halves close, and the counter shakes 3px
once. ~700ms.

### A heart is gained

Double beat (lub-dub), the fill rises, three berry sparks.

### A streak advances

The flame **flares** — outer layer stretches to 1.35, core brightens — sparks
burst upward, the number rolls. At a milestone the burst doubles and a ring
expands from the flame.

### A lesson is completed

Stamp slams in with a ripple ring, paper shards burst, the reward tiles rise
in sequence with their numbers counting up, the perfect badge flips in.

### A daily bonus is claimed

Press → the art charges (a 260ms shake) → pops to 1.25 with a burst → reward
particles fly to their counter → the day card flips over to its claimed face →
the pips fill → the receipt slides in.

---

## Scroll

- Section headings **reveal by word** (each word rises out of a mask), once.
- Body copy fades up; `<strong>` terms get a highlighter swipe when they enter.
- Product frames rise out of a 12° backward tilt as they enter.
- The course frame on the landing page **scrubs** its content with scroll, so
  the page shows more of the course the further you read.
- The hero's module fan spreads as the hero scrolls away.
- A 2px clay scroll-progress rule runs along the bottom of the navbar.

---

## Prohibited outright

These survive from revision 1 unchanged:

- Glow of any kind: no coloured `box-shadow` halo, no `drop-shadow` in an
  accent colour. Sheens are warm-white and follow a light source (the
  pointer); they are not light *emitted* by the element.
- Cool hues, anywhere, including in particles.
- Skeleton shimmer.
- `transition: all`.
- Transitions longer than `--dur-celebrate` except deliberately scroll-linked
  or stagger-accumulated sequences.
- Animating layout properties (`top`, `height`, `margin`). Use `transform`,
  `opacity`, `clip-path`, `grid-template-rows` for expanders, and `width` only
  on progress tracks.
- A loop that is not listed under **Loops** above.
- A `position: fixed` dialog inside an element with a *filled* transform
  animation. Entrance animations use `animation-fill-mode: backwards`; a
  `both` fill leaves the wrapper as the containing block and pins the dialog
  to it.
- Motion that depends only on `requestAnimationFrame` to reveal content.
  A background tab renders no frames; every reveal races a timer.
- Custom cursors, and anything that hides or replaces the system cursor.

---

## Implementation

All shared motion lives in `src/motion/`:

| Module | Job |
|---|---|
| `FxLayer.jsx` | one document-level listener that powers **Magnet**, **Tilt** and sheen for any `.btn`, `[data-magnetic]` or `[data-tilt]` element, plus the tooltip for any `[data-tip]` element |
| `SplitText.jsx` | **Reveal** by word |
| `Reveal.jsx` / `useInView.js` | once-per-element entrance, with stagger |
| `RollingNumber.jsx` | **Roll** |
| `CountUp.jsx` | a figure counting up the first time it is seen |
| `flight.js` | **Fly** — `fly()`, `useFlightTarget()`, `useLandedValue()` |
| `burst.js` | paper-shard bursts |
| `motion.css` | the verbs as classes and keyframes |

A component never hand-rolls one of these. If it needs something they cannot
do, extend the module.

---

## Reduced motion

`prefers-reduced-motion: reduce` must leave the interface **fully legible and
fully expressive**, not merely still.

- All transforms and durations collapse to 0.01ms (global rule in `index.css`).
- JS motion checks `prefersReducedMotion()`: flights resolve instantly,
  bursts do not spawn, tilt and magnet do not attach, split text renders
  assembled.
- Every loop stops.
- Colour and border feedback survives: tint on hover, the berry row on a wrong
  answer, the moss stamp colour, the filled bar.
