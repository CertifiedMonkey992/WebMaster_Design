# Anti-AI Rulebook

This file exists to stop the interface drifting back into generic
AI-generated aesthetics in future sessions. Every rule is stated as
**BAD / BETTER** so it can be checked against a diff.

A generated interface is rarely ugly. It is **uniform** — equal radii, equal
shadows, equal lifts, equal spacing, equal importance. Uniformity is the
thing to hunt.

---

## 1. Generic SaaS dashboard shell

**BAD** — left icon rail, centre feed, right widget rail, three white card
columns, a stat row of four figures across the top.

**BETTER** — a left nav and a single content column with a reading measure.
A secondary column only if its contents are *needed while reading the main
column* (progress and today's quests qualify; a signup card for an account
system that does not exist does not). Rank what is in it; drop the rest.

## 2. Excessive cards

**BAD** — every group of content wrapped in `background: white; border:
1px solid; border-radius: 16px`. Thirteen card edges on one screen.

**BETTER** — one container per *idea*, with rows inside it separated by
`--line-faint`. A module is one card containing five rows, not one card
followed by five cards. **Count the card edges on any screen; more than four
means the layout is wrong, not under-styled.**

## 3. Excessive pill UI

**BAD** — `border-radius: 999px` on buttons, tags, badges, nav items, filter
chips and section labels.

**BETTER** — pills are for progress tracks and status dots. Badges and tags
take `--r-xs` (2px) and read as printed labels. Buttons take `--r-sm` (4px).
Status pills holding a live number are the one exception, because a lozenge
around a changing figure is what a pill is for.

## 4. Identical corner radii everywhere

**BAD** — 16px on the card, 16px on the panel, 16px on the modal, 12px on
the button, chosen per-component with no rule.

**BETTER** — the five-step scale in `VISUAL_SYSTEM.md` with written roles:
`2 / 4 / 8 / 12 / pill`. Radius encodes what a thing *is*. A component picks
its radius from its role, not from how soft it wants to look.

## 5. Generic gradients

**BAD** — `linear-gradient(135deg, colorA, colorB)` on a logo tile, a
progress fill, an icon square, a badge, a level chip.

**BETTER** — flat fills. A gradient is permitted only where it depicts
physical depth on a surface that is *meant* to feel physical, and it must be
a two-stop gradient of one hue. The logomark is solid `--evergreen`. The
progress fill is solid `--moss`.

## 6. Purple / blue AI gradients

**BAD** — `#4F46E5 → #06B6D4`, `#6366F1`, `#818CF8`, `#0EA5E9`, indigo,
violet, cyan, sky, "electric" anything.

**BETTER** — the cool half of the colour wheel does not exist in this
product. Bone, warm ink, evergreen, terracotta, ochre, berry. If a new colour
is needed, it is warm, or it is not needed. **Any hex whose blue channel is
its largest channel is a bug.**

## 7. Glassmorphism

**BAD** — `backdrop-filter: blur(18px)` with a translucent white ground on a
navbar or modal overlay, "because it looks premium".

**BETTER** — opaque `--paper` on the navbar with a hairline that appears on
scroll. A modal overlay is flat warm ink at 45% alpha. Blur is expensive on
every scroll frame and it makes text behind it unreadable in a way that is
not a design choice.

## 8. Excessive shadows

**BAD** — `box-shadow` on the sidebar, the widget, the row, the card, the
badge, and the nav, at six token values, none of which correspond to actual
elevation.

**BETTER** — nothing at rest has a shadow. Shadow means "in front of the
page": popover, toast, modal, dropdown, pressed state. See the table in
`VISUAL_SYSTEM.md` §5. Warm-tinted only; a neutral black shadow on a bone
ground turns it grey.

## 9. Identical repeated components

**BAD** — five module cards that differ only in their title string, four
sidebar widgets with identical headers, three feature cards with an icon in a
tinted square.

**BETTER** — the active module looks structurally different from a locked
one because it *is* different: expanded, with a current lesson carrying the
only 1.5px clay border on the page. Difference comes from state and content,
never from decorating the third item to break up the rhythm.

## 10. Decorative blobs, orbs and washes

**BAD** — `radial-gradient(760px 480px at 8% -8%, …)` behind the page. A
glowing sphere with orbiting rings beside a heading. A soft blob bottom-right
"for depth".

**BETTER** — nothing. The warm ground with its faint grain is the only
background treatment, and it is flat. If an area looks bare, the answer is
composition or subtraction, not a gradient.

## 11. Random illustrations

**BAD** — an illustration per section, sourced or generated separately, in
different styles, at different levels of detail.

**BETTER** — one drawing language: flat, 2px stroke, two or three palette
colours, matching the icon set. An illustration must depict something
specific in the product. If it depicts "learning" in the abstract, it is
decoration.

## 12. Generic icon grids

**BAD** — a three-column feature section, each with a Lucide icon in a
tinted rounded square, a two-word title and a sentence of copy.

**BETTER** — show the actual product. The landing page already mounts real
components inside a frame; that is the correct instinct and it should be the
only way features are shown. If a feature cannot be shown, describe it in a
sentence with no icon at all.

## 13. Generic AI-style copy

**BAD** — "Understand AI. Think critically. Use it well." / "Unlock your
potential" / "Seamlessly integrate" / "Powerful yet simple" / "Everything you
need to…".

**BETTER** — a sentence that is only true of this product, with a number in
it wherever a number is available. "22 lessons on how AI actually works. No
account, and it remembers where you stopped." If the sentence would fit a
competitor's page, rewrite it.

## 14. Huge meaningless headings

**BAD** — a 76px heading over a section that contains a list of four items.
Every section opening with an eyebrow, a display heading and a lead
paragraph regardless of what follows.

**BETTER** — one `--fs-page` headline per page, at the top, and nothing else
above `--fs-section`. A section whose content is a list gets a `--fs-title`
heading, or a label, or nothing.

## 15. Excessive whitespace

**BAD** — `padding: 6rem 5%` on every section, a centred 40rem column with
3.5rem between every element, a page that requires four scrolls to pass three
facts.

**BETTER** — space is proportional to the break in meaning. `--sp-6` between
cards in a group, `--sp-16` between sections, `--sp-24` only where the
subject genuinely changes. Dense is allowed; the reference wall of
testimonials is dense and reads beautifully because the density is
*differentiated*.

## 16. Excessive glow

**BAD** — `box-shadow: 0 0 24px rgba(accent, .35)`, a lit bead on the
leading edge of a progress bar, a `filter: drop-shadow` in the accent colour
on an active icon.

**BETTER** — no element emits light. Contrast, weight and colour mark
importance. A progress bar ends where it ends.

## 17. Futuristic AI effects

**BAD** — node constellations, wired dot grids, circuit traces, scanlines,
terminal type-on effects, "neural" anything.

**BETTER** — the product is a field guide, not a simulation of the thing it
teaches. Paper, ink, a clear diagram when a diagram explains something.

## 18. Excessive symmetry

**BAD** — copy-left / image-right alternating perfectly for four consecutive
sections. A 1fr 1fr grid whenever there are two things. Three equal columns
whenever there are three.

**BETTER** — give compositions a dominant side. A 7/5 split reads as a
decision; 6/6 reads as a default. Break the alternation at least once, and
let one section be full-width or single-column.

## 19. Excessive visual sameness

**BAD** — every heading the same size, every card the same weight, every
section the same height, every hover the same lift.

**BETTER** — before shipping a screen, identify the loudest element. If it is
not the thing the user should do next, fix the screen. Exactly one element
per screen should be obviously first.

## 20. Random animations

**BAD** — everything fades up 24px on scroll with the same d1/d2/d3 stagger.
Infinite orbit and pulse loops on decorative objects. A permanently nudging
arrow. Motion that is identical on every element, which is what makes it read
as a template.

**BETTER** — every animation is a Response, a Report or an Invitation (see
`MOTION_RULES.md`, revision 2). Motion is *differentiated by meaning*: a
handled index card lifts, a row tints, a number rolls, a reward flies to the
counter it belongs to. Loops exist only as the listed Invitations and living
icons, and each stops when its state ends.

## 21. Components from different templates

**BAD** — a shadcn-shaped dialog, a Material-shaped input, a Tailwind-UI
pricing grid and a bespoke sidebar in one product.

**BETTER** — one button, one input, one card, one row, one panel, defined in
`COMPONENT_RULES.md` and reused. Before writing a new component, search the
codebase for the one that already does 80% of it.

## 22. The tokens-exist-but-nothing-uses-them trap

**BAD** — a beautifully commented `:root` block with a spacing scale, a type
scale and a radius scale, and 3,000 lines of component CSS containing
`margin-bottom: 0.85rem` and `border-radius: 11px`. (This was literally the
state of this codebase: `--sp-*` and `--fs-*` had **zero** call sites.)

**BETTER** — a literal value in a component is a bug. Grep for
`px`/`rem`/`#` in component CSS periodically; anything that is not a token or
a commented optical correction gets converted.

---

## Pre-commit checklist

Run this against any UI diff before committing.

- [ ] No new hex literal. Every colour is a token.
- [ ] No cool hue. No hex whose blue channel is the largest.
- [ ] No new radius value outside the five-step scale.
- [ ] No `box-shadow` on a resting surface.
- [ ] No `transition: all`. Every `infinite` animation is a loop listed in `MOTION_RULES.md`.
- [ ] Lift (`translateY(-Npx)` on hover) only on handled objects — never rows or buttons.
- [ ] Every new animation uses a `--dur-*` token and one of the named verbs.
- [ ] Card edges on the changed screen: ≤ 4.
- [ ] `--clay` appearances on the changed screen: 2–3.
- [ ] The loudest element is the next action.
- [ ] Copy contains no sentence that would fit a competitor's page.
- [ ] Every number shown is real data, not a placeholder.
- [ ] Spacing uses `--sp-*`; type uses `--fs-*` and `--fw-*`.

---

## The audit command

Run this against `src/` after any CSS change. It is the checklist above, made
mechanical.

```bash
CSS=$(find src -name "*.css" ! -name index.css); echo "hex:$(grep -rhoE '#[0-9A-Fa-f]{3,6}\b' $CSS | wc -l) size:$(grep -rhoE 'font-size: [0-9.]+rem' $CSS | wc -l) radius:$(grep -rhoE 'border-radius: [0-9]+px' $CSS | wc -l) weight:$(grep -rhoE 'font-weight: [0-9]+' $CSS | wc -l) loops:$(grep -rho 'infinite' $CSS | wc -l) lifts:$(grep -rhoE 'translateY\(-[0-9]' $CSS | wc -l) all:$(grep -rhoE 'transition: all' $CSS | wc -l)"
```

At the end of the redesign pass the counts were:

| Check | Count | Note |
|---|---|---|
| hex literals | 2 | both `#000` inside a `mask-image`, where the value is a mask channel and not a colour |
| raw font sizes | 0 | |
| raw radii | 0 | |
| raw weights | 0 | |
| infinite animations | 0 | |
| upward transforms | 2 | one keyframe for the streak-rise flash (an event response, not a hover), one `translateY(-50%)` centring the sidebar rail |
| `transition: all` | 0 | |

Anything above those numbers is a regression. The two sanctioned exceptions
are listed so a later pass does not "fix" them into something worse.

> **Revision 2 (interactivity pass).** `loops` and `lifts` are no longer
> expected to be near zero: the living-interface revision of
> `MOTION_RULES.md` sanctions named loops (Invitations, living icons) and Lift
> on handled objects. For those two counts the check is now *every hit is
> named in MOTION_RULES.md*, not *the count is small*. `hex`, `size`,
> `radius`, `weight` and `all` keep their revision-1 targets.
