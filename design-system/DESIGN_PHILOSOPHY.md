# Design Philosophy

## The one-line brief

**LunX is a field guide to artificial intelligence, and it should look like
one: warm paper, clear ink, a steady hand.**

Not a dashboard about AI. Not a neural network rendered in cyan. A printed
thing you work through, that happens to keep score.

## Why this, and not something else

The product teaches people to think clearly about AI. Every competitor in
that space signals its subject with the same visual vocabulary — black
grounds, glowing nodes, indigo-to-cyan gradients, glass panels. That
vocabulary says *this was made by the technology*, which is the opposite of
what a course in critical thinking should say.

A warm, printed, paper-grounded interface makes an argument: the value here
is human judgement, sustained attention, and work you do yourself. It is
also, practically, the most distinctive position available — it is the only
direction in the category that nobody else is standing in.

This is where the personality comes from. Not from decoration.

## The personality, in concrete terms

| Trait | How it shows up in pixels |
|---|---|
| **Human** | Warm ink (`#2B2119`) instead of blue-black. A ground with grain. Numbers that sit on a baseline rather than float in a chip. |
| **Playful** | Fraunces italic in terracotta for the one phrase that matters. A rubber-stamp completion mark. Copy with a voice. |
| **Friendly** | Nothing shouts. No modal you did not ask for. Locked things say *why* they are locked. |
| **Intelligent** | Real data, always. Density where density helps. No round numbers invented for a stat row. |
| **Energetic** | Motion that answers you in under 200ms. Press states that actually press. |
| **Approachable** | Body text at 15px/1.6, never below 12px. Generous line length. Plain words. |
| **Confident** | One accent, used three times a screen. Whitespace that is a decision, not padding. |
| **Educational** | Progress you can read at a glance. The next action is always the most prominent thing on the page. |
| **Memorable** | Bone paper + evergreen + terracotta + Fraunces. Four facts. Recognisable with the logo cropped off. |
| **Tactile** | Surfaces you can feel the edge of. Buttons that depress. Nothing floats without reason. |
| **Purposeful** | Every element names the question it answers. If it names none, it is deleted. |

## What it must never feel like

- **A generic AI startup** — no dark hero, no node graph, no glow, no
  "Powered by" strip, no gradient text.
- **A SaaS template** — no three-column dashboard with a widget rail, no
  card grid of features with a Lucide icon in a tinted square.
- **A corporate dashboard** — no data that exists to look like data.
- **A futuristic product** — nothing is chrome, glass, neon or backlit.
- **A pile of rounded cards** — if a screen has more than four card edges
  visible at once, the layout is wrong, not under-styled.
- **A React template** — no component should be recognisable as shadcn,
  MUI, or a Tailwind UI block.
- **One prompt's output** — the surest sign of that is *uniformity*: equal
  radii, equal shadows, equal lifts, equal spacing, equal importance.

---

## The nine principles

These are written so a developer can build a page that has never existed and
still arrive somewhere this system recognises.

### 1. Warmth is structural, not decorative

Every neutral in the product is warm. The ground is bone, surfaces are a
lighter bone, ink is brown-black, borders are ink at low alpha — which makes
them warm too. There is no grey in the system. If a value looks grey on
screen, it is wrong.

> Use `--paper`, `--surface`, `--ink`, `--line`. Never `#fff`, never
> `#F6F6FB`, never `rgba(0,0,0,…)`.

### 2. Two voices, and they never swap jobs

**Fraunces** (serif) is the product speaking: page titles, section titles,
lesson names, the wordmark, numbers that are an achievement. **Manrope**
(sans) is the interface speaking: labels, metadata, buttons, body copy,
numbers that are a measurement.

A heading never uses Manrope. A button never uses Fraunces. When you want
emphasis inside a heading, switch to *Fraunces italic in terracotta* — that
is the product's signature move and it should appear roughly once per screen.

### 3. Geometry carries hierarchy

Corner radius encodes what a thing *is*, not how soft you want it to look.

```
2px   a tag, a chip, a swatch — small, printed
4px   a control: button, input, icon tile
8px   a card, a row, a panel — the default for surfaces
12px  a container that holds other cards; a modal
pill  only a progress track or a status dot
```

Two different radii inside one component is a mistake. A card at 8px
containing buttons at 4px is correct; a card at 8px containing a card at
8px means one of them should not be a card.

### 4. Elevation is a claim, and most things should not make it

Default surface: `1px solid var(--line)`, no shadow. Full stop.

Shadow means "this is in front of the page": modals, popovers, toasts,
dropdowns, and the single fanned-card composition on the landing page that
is *depicting* physical cards. A resting card in a list does not get one. A
sidebar widget does not get one.

Warmth separates surfaces here. That is the whole point of a warm ground.

### 5. The accent is spent, not applied

Terracotta appears **two or three times per screen**, on the things a person
should look at first:

- the phrase in the heading that carries the meaning
- the one action that is "do this next"
- the streak, because a streak is a live, burning thing

Evergreen is not an accent — it is structure. It carries the nav, the
primary button, and completion. Ochre is money (gems, XP). Clay is cost
(hearts, errors). Those three are allowed wherever their meaning applies,
because they *are* meaning. Terracotta is the only rationed colour.

### 6. One page, one loudest thing

Before shipping a screen, find the loudest element. If it is not the thing
the user should do next, the screen is wrong. Everything else steps down:
one primary, a few secondary, the rest quiet. Equal weight across a page is
the single most reliable symptom of generated design.

### 7. Motion answers at once, and the objects are alive

Every animation responds to something a person did, reports something that
changed, invites the next step, or — for the few real *objects* on a page —
lets them sit in the world (the field guide breathes on its desk). If you
cannot name which of those four an animation is, delete it.

Responses start within a frame and finish inside 300ms. Importance is shown
by how *far* something moves, never by how *long* it takes. Ambient motion is
rationed like the accent: one living object per region of attention, slow,
small, and it yields the moment a hand touches it.

Durations and easings are tokens (`MOTION_RULES.md`, revision 5). A literal
duration in a component is a bug.

Revision 4 adds the fifth kind of motion: an *idle event*. A living object —
the field guide, a gem, a heart, the streak's flame — does something small on
its own now and then, the way a real object in a room catches the light or
settles. It happens rarely, never in step with anything else, and never while
a hand is on it. The economy is also allowed to look like treasure: warm
glints and a brief bloom when a value rises — light as a *report*, never as
decoration.

Revision 5 adds the sixth: a *demonstration*. The page shows what the
product does instead of describing it — a demo learner in a product frame
completes a quest and the gems land in the counter; the field guide opens
itself and turns a page — and inside the app, previews show the learner what
finishing something would look like without touching their numbers. All of
it takes turns on one clock, the Stage: one thing moves, the page settles,
something else moves somewhere else. Constant does not mean simultaneous.

> Revision 1 of this principle said "Nothing loops. Nothing floats. Nothing
> breathes." The product that produced read as a printed page that happened
> to keep score. Revisions 2 and 3 of the motion rules were requested
> deliberately; the calm is now carried by *timing discipline* instead of by
> stillness.

### 8. Real content, at the density it actually has

Never pad a layout with invented figures, placeholder testimonials, or a
fourth feature that does not exist. If a section looks thin, it is either
telling you the feature is thin, or telling you the section should not be
there. Both are useful information.

Corollary: if a feature does not exist (a leaderboard, a class dashboard, a
sync service), the UI does not pretend. Say what it is.

The same rule cuts the other way, and the local profiles are the case in
point. They exist, so the UI says so — but it says exactly what they are: a
name on a shelf that keeps two people's progress apart on one browser, with
no server, no registration and a passphrase that protects nothing. A sign-in
page that borrowed the shape of a real one and implied a real one would be
inventing a feature just as surely as a fake testimonial would. The page
therefore carries the guest path as its own sentence, and the privacy policy
lists the profile store beside every other key.

### 9. Subtraction first

When a screen is not working, the first three moves are: remove an element,
remove a colour, remove a border. Adding is the fourth move. This system is
designed to look better with less in it, and a screen that has been
subtracted from reads as designed in a way an added-to screen never does.

---

## Applying this to a page that does not exist yet

A worked example, so the principles are not abstract.

**Task: build a "Certificates" page.**

1. **Ground and frame.** `--paper` background, the standard page shell, the
   centre column capped at the reading measure. No new layout.
2. **Title.** Fraunces, `--fs-title`, warm ink. One italic terracotta phrase
   if the title has a natural emphasis; otherwise none — do not manufacture
   one.
3. **The list.** Rows at `--r-md`, hairline, no shadow, `--sp-3` internal
   padding. Not cards in a grid.
4. **The loudest thing.** The certificate the user can claim right now:
   terracotta text on the action, everything else evergreen or ink.
5. **Empty state.** A sentence in warm muted ink explaining what earns the
   first certificate, and a link to the next lesson. No illustration of an
   empty box, no "Nothing here yet!" with a shrug emoji.
6. **Motion.** Rows do not animate in. The claim button presses. That is all.
7. **Check.** Count the card edges. Count the terracotta appearances. Find
   the loudest element. If any of those three answers is wrong, fix the page
   before styling anything further.
