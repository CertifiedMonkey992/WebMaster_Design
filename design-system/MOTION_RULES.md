# Motion Rules

## The test

Before writing an animation, answer: **what event is this a response to?**

If the answer is "the page loaded", "the element scrolled into view for the
first time", or "it looked static", the animation does not ship. If the
answer names a user action or a real state change, continue.

Second test: **would removing it cost the user information?** If not, it is
decoration, and decoration in motion is the most expensive kind.

---

## Tokens

```css
--dur-press:  120ms   --ease-press:  cubic-bezier(0.4, 0, 0.6, 1)
--dur-hover:  180ms   --ease-out:    cubic-bezier(0.33, 1, 0.68, 1)
--dur-enter:  240ms   --ease-out
--dur-modal:  320ms   --ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1)
--dur-settle: 600ms   --ease-settle
```

Five durations. If a new animation needs a sixth, it is probably the wrong
animation.

---

## The vocabulary

The old system had exactly one verb — `translateY(-Npx)` with a bigger
shadow — applied to cards, rows, buttons and headers alike, at four different
amplitudes. Four amplitudes of one verb is not a vocabulary; it is a volume
knob. These are the five verbs, each with a fixed meaning.

| Verb | Means | Where |
|---|---|---|
| **Tint** | "this is interactive" | Nav items, lesson rows, quest rows, list rows |
| **Firm** (border to `--line-strong`) | "this whole surface is a target" | Cards that are clickable |
| **Press** (`translateY(1px)` + `--shadow-press`) | "you clicked it" | Every button and every pressable control |
| **Rise** (8px fade-up, 240ms) | "this arrived in front of the page" | Popovers, toasts, dropdowns, modals |
| **Settle** (width/number over 600ms) | "this value changed" | Progress bars, counters, XP |

No component is allowed a sixth behaviour without adding it here first.

**Lift is retired.** Nothing translates upward on hover. It was applied to
thirteen surfaces on one screen, which made it mean nothing, and it is the
single most common generated-UI hover. Tint and firm carry the same
information at a fraction of the noise.

---

## By interaction

### Hover

- **Rows and nav items**: background to the relevant tint. 180ms. Nothing
  moves.
- **Clickable cards**: border `--line` → `--line-strong`. 180ms.
- **Buttons**: solid darkens one step; outline fills with its tint. 180ms.
  No transform.
- **Icons**: do not animate on hover, with one exception — a trailing arrow
  inside a button may translate 2px, because it is depicting direction.
- Hover transitions are symmetric: the same duration in and out. An
  instant-on / slow-off hover feels like a bug.

### Press

Every pressable thing in the product does the same thing:

```css
:active { transform: translateY(1px); box-shadow: var(--shadow-press); }
```

120ms, `--ease-press`. It is short, symmetric, and consistent across the
whole app, which is what makes the interface feel like one object rather than
a set of components.

### Focus

Focus never animates. A ring that fades in is a ring that is not there when
the keyboard user needs it. `2px solid var(--evergreen)`, `2px` offset,
applied instantly.

---

## By event

### A value changes

Progress bars, XP, gem counts, streak days.

- Bars: `width` over `--dur-settle` with `--ease-settle`. The bar arrives at
  the new value; it does not spring past it.
- Numbers: the old value wipes up and out while the new wipes up and in,
  240ms, staggered by 60ms. Only for a value the user just caused to change.
  A number that changes because a timer ticked does not animate.
- Never animate a value on first render. The bar is already at 40% when the
  page loads; it did not just get there.

### Something arrives

Popover, toast, dropdown, the daily-bonus panel.

- 8px translate plus opacity, `--dur-enter`, `--ease-out`.
- Modals: 12px plus `scale(0.98)`, `--dur-modal`.
- Everything leaves by **fading only**, at 2/3 the entrance duration.
  Reversing the entrance on exit makes dismissal feel slow.

### A lesson is completed

The one moment in the product that earns a celebration, and it still gets a
budget:

1. The lesson row's check stamps in — `scale(0.85) → 1`, 240ms,
   `--ease-settle`, with a 4° rotation that resolves to 0. It reads as a
   rubber stamp because it overshoots in rotation, not in scale.
2. The module's progress bar settles to its new width, starting 120ms later
   so the two read as cause and effect.
3. One toast per reward earned, staggered 80ms.

Total: under 1 second. No particles, no full-screen overlay, no confetti.

### A streak advances

- The flame icon scales to 1.15 and back over 240ms, once.
- The day square fills `--ember` over 180ms.
- If a milestone is crossed, one extra toast. That is the whole difference
  between day 6 and day 7.

### A heart is lost

- The heart drains from filled to outline over 240ms.
- The counter shakes 3px horizontally, **once**, over 120ms.
- Nothing else on the screen reacts. A wrong answer is already unpleasant;
  the interface should not pile on.

### A reward is claimed

- The tile presses, then its art scales to 1.06 and returns, 240ms.
- The currency pill it landed in does its increase animation.
- One toast.

---

## Scroll

The landing page's scroll reveal is **retained but re-scoped**. It fires once
per section, on the section as a whole — not on each card inside it with
staggered d1/d2/d3 delays, which is the generated-page signature.

- 16px rise plus opacity, 400ms, `--ease-out`.
- Threshold 0.15, `once: true`.
- Sections above the fold at load do not animate. Content the user has not
  scrolled to is the only content that can be revealed by scrolling.

The testimonial-style marquee from the references is a legitimate continuous
motion, because it depicts overflow — there are more of these than fit. It is
the only exception to "nothing loops", and it must pause on hover and honour
`prefers-reduced-motion`.

---

## Prohibited outright

- Any `animation-iteration-count: infinite` except the marquee above.
- Floating, breathing, pulsing, bobbing, orbiting, shimmering.
- Skeleton shimmer. Use a static `--paper-deep` block.
- Parallax.
- Staggered entrance for lists over three items.
- Anything that animates while the user is reading.
- Transitions longer than 600ms.
- `transition: all`. Name the properties — it is the difference between an
  animation and an accident.
- Animating anything but `transform`, `opacity`, `background-color`,
  `border-color`, `color`, `box-shadow`, and `width` on a progress track.

Two infinite loops were running on the dashboard at all times before this
pass (`chv-spin` at 34s and 24s, `chv-pulse`, `chv-float`,
`chv-shadow-breathe`). They are removed.

---

## Reduced motion

`prefers-reduced-motion: reduce` must leave the interface **fully legible and
fully expressive**, not merely still.

- All transforms and durations collapse to 0.01ms.
- Colour and border feedback survives. A reduced-motion user still sees the
  tint on hover, the tinted row on a correct answer, the filled bar.
- Progress bars jump to their value rather than animating.
- The marquee stops and the row becomes horizontally scrollable.

The existing `@media (prefers-reduced-motion: reduce)` block in `index.css`
already does most of this correctly and its reasoning comment is right —
keep both.
