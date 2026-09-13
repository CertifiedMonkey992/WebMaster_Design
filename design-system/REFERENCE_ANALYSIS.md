# Reference Analysis

> Written before any code changed. This file records what the references do,
> what LunX was doing instead, and why the gap read as "AI-generated".

## 0. What the references actually were

Four screenshots were supplied in the brief. A `design-system/references/`
folder did not exist in the repo; it was created by this pass and is empty —
drop the source images in there if they should be version-controlled.

1. **Roots & Routes** — community resource directory. Cream paper ground,
   forest-green ink, terracotta italic serif accent, a fanned stack of
   photographic cards.
2. **Roots & Routes testimonial wall** — two marquee rows of warm cream
   quote cards drifting in opposite directions, faces at small size.
3. **Maitso (sage nav)** — a flat sage-green bar, serif wordmark at ~28px,
   eight plain text links, no shadow, no pill, no button.
4. **Maitso (photo nav)** — the identical bar over a dark photograph. Same
   type, same spacing, white ink.

The fifth reference is the product itself: the LunX landing page and
`/learn` dashboard as they rendered at the start of this pass.

---

## 1. What makes the references succeed

Not "modern". These are the specific decisions doing the work.

### The ground is never white, and never grey

Roots & Routes sits on a warm bone (~`#F5F0E6`) with a faint horizontal
wave texture. Cards sit on it in a *slightly lighter* warm tint, not white.
The result: surfaces separate by warmth rather than by shadow. There is
almost no elevation in the whole page and it still reads as layered.

Grey-blue off-whites (`#F6F6FB`, `#FAFBFD`) are the single most common tell
of a generated interface, because they are what every component library
ships as `slate-50`. A warm ground costs nothing and instantly reads as
chosen.

### Two type voices with genuinely different jobs

The display face is an editorial serif at real size (the Roots headline runs
~76px) and the second line switches to **italic in a different colour** —
"community roots." in rust. That single move does three things at once:
marks the emphasis, introduces the accent colour, and proves a human made a
call about which half of the sentence matters.

The UI face underneath is a quiet humanist sans at 15–16px. It never tries
to compete. Hierarchy comes from *contrast between voices*, not from
stacking six weights of one family.

Maitso's nav is the same principle at minimum scale: serif wordmark at 28px,
sans links at 14px. Two facts, clearly ranked, nothing else in the bar.

### The accent is rationed

Roots & Routes uses terracotta in exactly three places on the first screen:
the italic word, the hand-drawn underline, and the resource tag. Green
carries everything structural. When an accent appears twice on a screen it
means something; when it appears fifteen times it is wallpaper.

### Geometry is small and varied

The photographic cards have a ~14px radius because they are photographs and
want to read as objects. The search field is ~10px. The location chip is a
true pill because it is a chip. The testimonial cards are ~10px. Nothing in
either reference uses the 16–20px "everything is a soft card" radius that a
generated layout defaults to.

### Shadows are almost absent

Both Maitso navs: zero shadow. The testimonial cards: zero shadow, a
hairline at most. Only the fanned photo stack has real shadow, because it is
simulating physical cards overlapping. Shadow is used as *depiction*, not as
decoration.

### Asymmetry is structural, not stylistic

The Roots hero is copy-left / image-right, but the image block is bigger,
bleeds past the container, and is rotated. It is not a 50/50 grid with a
picture in one half. The composition has a dominant side.

### Motion is horizontal and continuous, not vertical and staggered

The testimonial wall scrolls two rows in opposite directions, forever, at a
speed slow enough to read. It communicates "there are more of these than fit
on screen". Compare with the generated default — everything fades up 24px on
scroll, which communicates nothing except that an IntersectionObserver was
installed.

### Real content at real density

Every testimonial has a name, a role, and a face. The nav has eight links
because the product has eight destinations. Nothing is padded out to fill a
grid. The Roots hero states what the product does in one sentence with no
adjectives.

---

## 2. Why LunX read as AI-generated

Audited against the rendered pages, not the source.

### 2.1 Two products wearing different clothes

The landing page is near-black (`#0f0f13`) with white text and an indigo
`BETA` pill. The app behind it is a light cool-grey dashboard with a cyan
accent. They share a logo and nothing else. A user clicking "Start learning"
crosses into what looks like a different company's product.

### 2.2 The dark hero with a glowing node constellation

The most recognisable AI-product cliché in existence: a black page, a
heading in white-to-grey gradient text, and a symmetrical grid of glowing
dots wired together to imply "a neural network". `TriangleGlow.jsx` is 429
lines devoted to it.

### 2.3 Cool palette with an indigo/cyan split

`--accent: #4F46E5` (indigo) on the landing page, `--lx-accent: #06B6D4`
(cyan) in the app, plus `#0EA5E9` sky-blue on a quest badge and `#6366F1` in
the dark-mode block. Four cool accents, no stated hierarchy between them.
Indigo-to-cyan *is* the AI gradient.

### 2.4 Every surface is a white rounded card with a hairline

Counted on the `/learn` first screen: Continue card, module hero card, five
lesson rows, progress card, quest widget, team mission card, signup card.
Thirteen white rounded rectangles with near-identical borders, stacked in
three columns. Radii in use: 9, 10, 11, 12, 14, 16, 18, 20px — eight values
with no rule separating them, which reads as *no* geometry system rather
than a rich one.

### 2.5 Shadow on everything that isn't moving

`--lx-shadow-1/2/3/pop/accent/accent-lift` are applied to resting cards that
never rise. When the sidebar widget, the lesson row and the modal all have
shadow, shadow has stopped encoding elevation.

### 2.6 The three-column dashboard

Left nav rail, centre feed, right widget rail. The default shape of every
generated "app screen", and why the page reads as a template before a single
pixel is examined. The right rail in particular is four unrelated widgets
stacked because there was a column to fill.

### 2.7 Decorative gradient orbs

`CourseHeroVisual` renders a glowing green sphere with orbiting rings and
pulsing nodes. `.learn-app::before` paints two radial washes behind the whole
page. `.lt-brand-mark` and `.ls-logo-mark` are gradient-filled squares. None
of these depict anything; they are there to look finished.

### 2.8 Fredoka

A rounded display face is the safest possible "friendly educational product"
choice, which is exactly why it does not distinguish this product from any
other. It is friendly in the way a template is friendly.

### 2.9 Progress is communicated four ways at once

The active section has: a tinted background, an accent border, a badge, a
progress bar with a glowing leading bead, a percentage, and a count of
lessons. Six signals for one fact. The code comments show previous passes
already removed accent rails for this reason — the instinct was right and
did not go far enough.

### 2.10 Marketing copy that describes a shape, not a product

"Understand AI. Think critically. Use it well." is three imperatives with no
object. It could sit on any AI course. The rest of the page is better — the
showcase sections mount the *real* components and the stats are read from
real data, which is genuinely good and worth keeping.

---

## 3. What to adopt

| From | Adopt as |
|---|---|
| Warm bone ground + faint texture | The app's only ground colour |
| Warm off-white surfaces | Cards, never `#FFFFFF` |
| Editorial serif display + italic accent | Headings, wordmark, the one emphasised phrase |
| Quiet humanist sans for UI | Everything that is not a heading |
| Deep natural green as structure | Primary — nav, buttons, completion |
| Terracotta rationed to 2–3 appearances | "Do this next", streak, the italic phrase |
| Hairline separation, shadow only when floating | Default card treatment |
| Small, varied radii | 2 / 4 / 8 / 12px scale with assigned roles |
| Dominant-side asymmetry | Hero and module compositions |
| Content-shaped density | Right rail earns its contents or loses them |

## 4. What to avoid

- Any dark hero. The product is a paper-warm light product on every screen.
- Node constellations, orbiting rings, glowing spheres, radial page washes.
- Indigo, cyan, sky blue, violet — the entire cool half of the wheel.
- Multi-stop gradients on fills. A gradient is allowed only where it depicts
  depth on a physical-feeling object.
- Shadow on a resting surface.
- More than one radius value per component.
- A fourth right-rail widget added because the column looked short.
- Blanket `translateY(-4px)` on every card. If everything lifts, nothing is
  raised.

## 5. Typography observations

The references prove hierarchy can be carried by **voice change** instead of
**size escalation**. LunX currently escalates: 0.58rem, 0.6, 0.62, 0.63,
0.65, 0.66, 0.68, 0.7, 0.72, 0.78, 0.8, 0.82, 0.84, 0.85, 0.88, 0.9, 1.0,
1.1, 1.2, 1.55rem — twenty sizes, most within 0.02rem of a neighbour. Those
distinctions are invisible and therefore not hierarchy. Collapse to a scale
of eight, and let the serif/sans split do the work the extra sizes were
failing to do.

Numerals matter here more than in most products: gems, hearts, streak, XP,
percentages and countdowns all change in place. Every one needs
`tabular-nums` or the layout twitches on each tick. The codebase already
does this in about half the places it should.

## 6. Layout observations

- The centre column is capped at 700px, which is right, but it sits inside a
  three-column grid that makes it feel like a feed rather than a page.
- The right rail has no ranking: a progress card, quests, a team mission
  labelled "Local preview", and a signup card for an account system that does
  not exist. At least one of those should not be on screen.
- The landing page alternates copy-left / copy-right four times in a row.
  Perfect alternation is as monotonous as no alternation.
- Vertical rhythm is built from `margin-bottom` values between 0.15rem and
  2.25rem chosen per-component. There are 8pt tokens defined in `index.css`
  and the component CSS almost never uses them.

## 7. Colour observations

The current palette holds indigo, cyan, bright cyan, soft cyan, cyan wash,
sky blue, navy, gold, amber, orange, two greens, rose and coral. Fourteen
hues across two temperature families. The `--lx-*` block is well organised
and carefully commented; the problem is not the tokens, it is that the hues
were chosen to be safe rather than chosen to be *this product's*.

Contrast discipline is genuinely good — the `-ink` shades exist precisely
because cyan cannot carry white text. That discipline must survive the
palette change, and the new palette must be checked the same way.

## 8. Component observations

- `ProductFrame` is the best idea on the landing page: real components,
  cropped behind a fade, with a caption. Keep the concept, restyle the
  chrome — a macOS traffic-light bar is itself a template signal.
- `LearnSidebar`'s icon set is genuinely coherent: one 24px box, one stroke
  weight, fills only for small solid accents. It is the strongest existing
  asset. Keep the drawing, restyle only colour and the active state.
- `SectionCard` has a hero variant *and* a normal variant *and* completed,
  locked and in-progress states — five appearances of one component. The
  hero variant is where the gradient orb lives.
- `PlayerStatusBar` pills are the right pattern: a pill carrying a number
  that opens a panel is what a pill is for.
- Buttons: `.cl-btn`, `.ln-start-btn`, `.ln-popup-btn`, `.signup-card-btn`,
  `.modal-submit` and `.btn-primary` are six implementations of one button
  with six radii and four shadow values.

## 9. Interaction observations

Hover is nearly uniform: `translateY(-1px | -2px | -3px | -4px)` plus a
deeper shadow, applied to cards, rows, buttons and section headers alike.
The comments show an author aware of this ("a section header takes a smaller
2px lift than the cards that actually go somewhere") — the intent is right,
the vocabulary is too small to express it. Lift is the only verb available.

Missing: any distinct feel for *pressing* something, and any acknowledgement
that the sidebar nav, a lesson row and a submit button are three different
kinds of object.

## 10. Animation observations

Two permanent loops run on the dashboard at all times: `chv-spin` (34s and
24s orbits) and `chv-pulse` / `chv-float` / `chv-shadow-breathe`. A comment
elsewhere in the same file argues, correctly, that a permanent animation
"stops meaning anything after about ten seconds" — and then the orbit
animations were left in.

`revealUp` fades every landing section up 24px with d1/d2/d3 delays. That is
the generated default. The references' marquee is the alternative: motion
that says something specific about the content.

## 11. Information-density observations

The `/learn` first screen shows, above the fold: streak, gems, hearts, daily
bonus button, level, XP progress, daily goal, day streak again, lessons done,
three daily quests, one weekly quest, a team mission with three member rows,
the continue card, the module hero, and four lesson rows. Roughly 25 discrete
data points competing at similar visual weight.

The references are much lighter but never *emptier* — Roots & Routes puts one
sentence, one search field and one filter row on the first screen. Density is
not the problem; **undifferentiated** density is.

---

## 11b. Motion addendum (revision 3) — why the references feel alive

Studied from the live sites and their shipped bundles, not screenshots.

**Roots & Routes** (Vite + React, GSAP for one object, Framer Motion for the
rest)

- *The card file.* Seven photo cards stand in individual `perspective:1000px`
  wells, each `rotateY(16deg) skewY(-1deg)` and stepped 10px down / 0.5px back.
  Hovering one tweens it **up 88px** and its two neighbours **up 14px**, in
  **420ms `power3.out`**; leaving returns them in **320ms `power2.out`**, with
  `overwrite:"auto"` so an interrupted hover never fights itself. No spring,
  no scale, no stagger, no delay. It feels good because it is *fast, large,
  and physical*: importance is amplitude, not duration, and the neighbours
  prove the cards share a drawer.
- *The testimonial wall.* Two rows driven by `useAnimationFrame`, opposite
  directions, a slow constant speed you can read at, **paused on hover**, with
  a masked fade at both ends. This is where "alive when idle" comes from.
- *The headline rule.* A hand-drawn SVG underline that *re-draws to a new
  shape* on hover (`d` tweened, `easeInOut`) — the heading answers the pointer
  without moving a single letter.
- Everything else is 150–300ms, `cubic-bezier(.4,0,.2,1)`.

**Maitso** (Next.js, DaisyUI, Framer Motion, react-fast-marquee)

- *The rotating plate.* A round food photograph in an `animate={{rotate:360}}`
  wrapper, `duration: 60, ease: "linear", repeat: Infinity`. One revolution a
  minute on a naturally round object never reads as a spinner.
- *Layered entrances.* A block enters with `x: 50`, its heading `x: 25`, its
  paragraph `x: 12`, all at **0.5s**. Same clock, decreasing amplitude — the
  group arrives with depth instead of as a queue.
- *Carousels with context.* Neighbour slides sit at 20–30% opacity: the eye
  gets the current item and proof there are more.
- *Press.* `whileTap: { scale: .95 }`, `whileHover: { scale: 1.1 }` on round
  controls — tactile in one frame.
- *Nav.* Sticky; its ground changes over 700ms once the hero is passed; link
  underlines grow from the centre in 300ms.

**What LunX revision 2 was doing instead**

| | References | LunX rev 2 |
|---|---|---|
| Hover travel | 200–420ms, strong ease-out | 360–560ms overshoot spring |
| Showcase hover | one object rises 88px; neighbours 14px | the hovered card lifts, scales 1.06, **grows 140px taller** (moving its own edge out from under the pointer), and five nested parts arrive at five different durations |
| Idle | marquees drift; a plate turns | nothing, except pings |
| Groups arriving | same clock, layered amplitude | long delay queues (a Done button at 1.45s) |
| Easing vocabulary | 2–3 curves | a spring on 181 declarations |

The references are not technically elaborate. They are *disciplined*: few
curves, short clocks, big amplitudes on the one thing that matters, and one
thing that is always quietly moving. Revision 3 of `MOTION_RULES.md` encodes
exactly that.

## 12. The ten highest-impact improvements

1. **One palette across both pages.** Retire the dark landing page. Warm bone
   ground, warm ink, deep green structure, terracotta accent, everywhere.
2. **Replace the display face.** An editorial serif with a real italic
   (Fraunces) instead of Fredoka, paired with a quiet sans (Manrope). The
   italic-in-terracotta emphasis becomes the product's signature.
3. **Delete the node constellation and the gradient orbs.** Replace the hero
   visual with something that depicts the actual course.
4. **Impose a radius hierarchy.** 2 / 4 / 8 / 12 / pill, each with a written
   role. No component picks its own number.
5. **Remove shadow from every resting surface.** Hairline plus warm ground
   does the separating. Shadow is reserved for genuinely floating layers.
6. **Collapse the type scale** from twenty sizes to eight, and let the
   serif/sans contrast carry the hierarchy the extra sizes were faking.
7. **One button component**, three variants, one radius, one press feel.
8. **Rank the right rail.** Progress and today's quests stay. The team
   mission preview and the signup card for a non-existent account system go.
9. **Give the active lesson one loud signal instead of six**, and drop the
   remaining permanent animations.
10. **Add one earned texture** — a faint paper grain on the ground, drawn in
    CSS at no asset cost — so the warmth reads as material rather than as a
    hex value.
