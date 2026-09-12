# Visual System

The authoritative token reference. Everything here is declared in
`src/index.css` under `:root`. If a value you need is not in this document,
it does not exist yet — add it here and in `index.css` together, or use the
nearest one that does.

---

## 1. Typography

### Families

```css
--font-display: 'Fraunces', 'Iowan Old Style', Georgia, 'Times New Roman', serif;
--font-ui:      'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

**Fraunces** is the product's voice. A variable "soft serif" with optical
sizing, a genuine italic, and enough eccentricity in the terminals to read as
chosen rather than defaulted. It carries the wordmark, every heading, every
lesson and module name, and any number that represents an *achievement*
(streak length, level, lessons completed).

**Manrope** is the interface's voice. Geometric-humanist, excellent tabular
figures, tight enough at 11–13px to hold a label without going blurry. It
carries labels, metadata, body copy, buttons, and any number that is a
*measurement* (XP remaining, minutes, percentages, counts in a progress row).

**JetBrains Mono** carries code inside lessons, and nothing else. It is not
a "technical accent" face — do not put a timestamp or an ID in it because it
looks engineered.

> `--font-heading` and `--font-body` are kept as aliases of `--font-display`
> and `--font-ui` so existing call sites keep working. New code uses the new
> names.

### The scale

Eight sizes. There is no ninth.

| Token | rem | px | Role | Face |
|---|---|---|---|---|
| `--fs-micro` | 0.6875 | 11 | Uppercase tracked labels, eyebrows | UI |
| `--fs-caption` | 0.75 | 12 | Metadata, counts, timers | UI |
| `--fs-small` | 0.8125 | 13 | Secondary body, descriptions, nav labels | UI |
| `--fs-body` | 0.9375 | 15 | Body copy, buttons, list titles | UI |
| `--fs-lead` | 1.125 | 18 | Lead paragraphs, card titles | either |
| `--fs-title` | 1.375 | 22 | Card and panel headings | Display |
| `--fs-section` | 2 | 32 | Section headings | Display |
| `--fs-page` | `clamp(2.5rem, 5vw, 4rem)` | 40–64 | Page headline. One per page. | Display |

### Weights

```css
--fw-regular:  400   /* Fraunces body, long-form serif */
--fw-medium:   500   /* Manrope body copy — 400 is too light on bone */
--fw-semi:     600   /* Manrope labels, buttons, nav; Fraunces headings */
--fw-bold:     700   /* Manrope emphasis, statistics; Fraunces page headline */
--fw-black:    800   /* Manrope only, and only for a number that is the point */
```

Fraunces stops at 700 in this product. Above that it loses the optical-size
subtlety that makes it worth using.

### Line height

```css
--lh-tight:   1.1    /* --fs-section and above */
--lh-snug:    1.3    /* --fs-lead, --fs-title */
--lh-normal:  1.55   /* --fs-body, --fs-small */
--lh-relaxed: 1.7    /* long-form lesson prose only */
```

### Letter spacing

```css
--ls-display: -0.02em   /* Fraunces at --fs-section and above */
--ls-title:   -0.01em   /* Fraunces at --fs-title / --fs-lead */
--ls-normal:   0
--ls-label:    0.08em   /* uppercase micro labels — the only positive value */
```

Fraunces is already generously spaced; it needs less negative tracking than a
grotesque. Do not go below `-0.03em` at any size.

### The signature

One phrase per screen, inside the largest heading, set in **Fraunces italic,
`--clay`**. Class: `.em`.

```html
<h1 class="page-title">Learn how AI works, <em class="em">from the inside</em>.</h1>
```

Use it once. Twice on a page halves its value; three times and it is a
pattern rather than an emphasis.

---

## 2. Colour

No grey exists in this system. Every neutral is warm.

### Ground and surface

```css
--paper:        #F2EBDF   /* the page. every page. */
--paper-deep:   #E8DFCE   /* recessed: progress tracks, inset wells */
--surface:      #FBF7F0   /* cards, rows, panels */
--surface-raised: #FFFDF8 /* modals, popovers, toasts — the floating layer */
--surface-sunk: #EDE5D6   /* a surface deliberately behind the ground */
```

### Ink

| Token | Value | Contrast on paper | Use |
|---|---|---|---|
| `--ink` | `#2B2119` | 13.3:1 | Headings, primary text, numbers |
| `--ink-muted` | `#736251` | 4.9:1 | Body secondary, descriptions |
| `--ink-faint` | `#7E6E5A` | 4.2:1 | Micro labels, metadata, disabled |

`--ink-faint` is fine for tracked uppercase labels and metadata. It is not
for paragraphs. If a sentence matters, it gets `--ink-muted` or darker.

### Lines

```css
--line:        rgba(43, 33, 25, 0.13)   /* default hairline */
--line-strong: rgba(43, 33, 25, 0.24)   /* hover, focused field, divider that must be seen */
--line-faint:  rgba(43, 33, 25, 0.07)   /* inside a card, between rows */
```

### Brand

```css
--evergreen:       #2E4736   /* PRIMARY — nav, primary button, completed */
--evergreen-deep:  #1F3325   /* pressed */
--evergreen-tint:  rgba(46, 71, 54, 0.09)
--evergreen-rgb:   46, 71, 54

--clay:      #B5502C   /* ACCENT — rationed. white text on it passes AA (5.1:1) */
--clay-deep: #96401F   /* pressed */
--clay-ink:  #9A4021   /* clay as small text on paper — 5.7:1 */
--clay-tint: rgba(181, 80, 44, 0.10)
--clay-rgb:  181, 80, 44

--tan:       #D8C3A0   /* structural warm fill: tracks, chips, tile grounds */
--tan-deep:  #C2A87F
```

**The rule for `--clay`:** two or three appearances per screen. Count them.

**The rule for `--evergreen`:** it is not rationed, because it is structure,
not emphasis. Nav, primary buttons, completed states, the wordmark.

### Semantic

Each of these owns exactly one meaning, and appears wherever that meaning
does.

```css
--moss:      #3F6B45   /* success, progress fill, completed. 5.2:1 */
--moss-tint: rgba(63, 107, 69, 0.10)

--ochre:     #C08A1E   /* gems, XP, rewards — "value earned" */
--ochre-ink: #7F5C11   /* the same idea as small text. 5.3:1 */
--ochre-tint: rgba(192, 138, 30, 0.13)

--berry:     #A02B37   /* hearts, errors, cost. */
--berry-ink: #8A2230   /* 6.6:1 */
--berry-tint: rgba(160, 43, 55, 0.10)

--ember:     #B5502C   /* streak. deliberately === --clay: a streak IS the
                          thing you should look at. */
```

There is no separate "warning". A warning in this product is either a cost
(`--berry`) or a thing to attend to (`--clay`). Adding a fourth semantic hue
would break the four-hue discipline for no gain.

### Educational / gamification states

These are compositions of the above, not new colours:

| State | Treatment |
|---|---|
| Locked | `--ink-faint` text, `--line-faint` border, `opacity: .65`, no hover |
| Available | `--ink` text, `--line` border, hover raises border to `--line-strong` |
| Current ("do this next") | `--clay` border at 1.5px, clay eyebrow, clay-filled icon tile, solid clay button |
| Completed | `--moss` check on `--moss-tint`, `--moss` hairline, text stays `--ink` |
| Earned / claimable | `--ochre` fill, ink text, a press that actually presses |
| Spent / empty | `--berry-ink` on `--berry-tint` |

---

## 3. Spacing

An 8pt grid, with 4px available for the inside of small controls.

```css
--sp-1:  0.25rem   /*  4px — icon-to-label inside a control */
--sp-2:  0.5rem    /*  8px — tight internal padding */
--sp-3:  0.75rem   /* 12px — list row padding, gap between chips */
--sp-4:  1rem      /* 16px — card padding, gap between rows */
--sp-5:  1.25rem   /* 20px — card padding (roomy) */
--sp-6:  1.5rem    /* 24px — gap between cards */
--sp-8:  2rem      /* 32px — gap between groups */
--sp-10: 2.5rem    /* 40px — section padding inside the app */
--sp-12: 3rem      /* 48px */
--sp-16: 4rem      /* 64px — landing section rhythm */
--sp-20: 5rem      /* 80px */
--sp-24: 6rem      /* 96px — landing section rhythm (major) */
```

Use the tokens. A literal `margin-bottom: 0.85rem` in a component is a bug,
not a refinement — the difference between 0.85rem and 0.75rem is invisible,
and the inconsistency it creates across forty components is not.

The only legitimate non-token values are optical corrections that are
commented as such (for example, pulling a heading up by 2px to sit on the
baseline of the icon beside it).

---

## 4. Geometry

```css
--r-xs:   2px    /* tags, badges, swatches, the tiniest chrome */
--r-sm:   4px    /* buttons, inputs, icon tiles, segmented controls */
--r-md:   8px    /* cards, list rows, panels — the default surface */
--r-lg:   12px   /* a container holding other cards; modals; the frame */
--r-pill: 999px  /* progress tracks, status dots, and nothing else */
```

### Assignments

| Component | Radius | Why |
|---|---|---|
| Button (all sizes) | `--r-sm` | A control, not a surface |
| Input, select, textarea | `--r-sm` | Matches the button it sits beside |
| Icon tile (40–48px) | `--r-sm` | A control-sized object |
| Lesson row, quest row, shop row | `--r-md` | A surface you act on |
| Card, panel, sidebar widget | `--r-md` | The default surface |
| Module container, modal, product frame | `--r-lg` | Holds other surfaces |
| Status pill, badge, tag | `--r-xs` | Printed label, not a lozenge |
| Progress track and fill | `--r-pill` | A track genuinely is a rounded bar |
| Avatar, status dot | `50%` | Round objects |

Two radii inside one component is a mistake. A card at `--r-md` containing
buttons at `--r-sm` is the intended nesting.

**Do not** give a pill radius to something that is not a track or a dot. The
soft-pill button is the most reliable single tell of a generated interface.

---

## 5. Shadow

Shadow means **"this is in front of the page."** Nothing at rest is in front
of the page.

```css
--shadow-raised: 0 2px 4px rgba(43,33,25,.05), 0 1px 2px rgba(43,33,25,.04);
--shadow-float:  0 8px 20px rgba(43,33,25,.09), 0 2px 5px rgba(43,33,25,.05);
--shadow-modal:  0 24px 56px rgba(43,33,25,.17), 0 4px 12px rgba(43,33,25,.08);
--shadow-press:  inset 0 1px 2px rgba(43,33,25,.14);
```

### When shadow is allowed

| Layer | Shadow |
|---|---|
| Any resting surface (card, row, widget, nav) | **none** |
| A surface the pointer is currently on | `--shadow-raised` |
| Popover, dropdown, tooltip, toast | `--shadow-float` |
| Modal, lesson overlay | `--shadow-modal` |
| The landing page's fanned card stack | `--shadow-float`, because it depicts stacked paper |
| A pressed button | `--shadow-press` |

Every shadow in the system is tinted with warm ink (`43, 33, 25`). A neutral
black shadow on a bone ground turns it grey, which is precisely the look this
system exists to avoid.

---

## 6. Borders

```css
--bw-hair: 1px      /* everything */
--bw-mark: 1.5px    /* the one "current" object on a screen */
```

- A surface separates from the ground with **one hairline** in `--line`.
- On hover, the hairline goes to `--line-strong`. That is often the whole
  hover treatment, and it is enough.
- The **current** lesson takes `1.5px solid var(--clay)`. It is the only
  element on the page allowed a thicker border, which is what makes it
  findable.
- Inside a card, rows separate with `--line-faint`, never a full `--line`.
- **No coloured left-edge rails.** A 3px accent strip down the side of a card
  is a template signature. Use the eyebrow, the tile, or the border.
- Focus is `2px solid var(--evergreen)` with `2px` offset. Never removed,
  never replaced with a shadow ring.

---

## 7. Iconography

One family, already drawn and already coherent (`LearnSidebar.jsx`,
`Icons.jsx`, `LessonIcons.jsx`). The spec it was drawn to stands:

- 24×24 viewBox, rendered at 20 or 22px in the nav, 16px inline with text.
- `currentColor` strokes at **2px**, round caps and joins.
- Large simple forms. No detail that dies below 2px.
- Fill used only for a small solid accent inside an outlined shape (a pupil,
  a flame core) — never to fill a whole shape, or that icon reads as "the
  different one".

### Sizes

| Context | px |
|---|---|
| Inline with body text | 16 |
| Inside a button | 16 |
| Sidebar nav | 22 |
| Status pill | 20 |
| Icon tile (inside a 40–44px tile) | 22 |
| Empty state | 32 |

### When to use an icon

- When it marks a **repeating** object type (lesson, quest, gem, heart).
- When it is the only content of a control that has an accessible label.
- When it distinguishes a state a colour alone cannot (locked, completed).

### When not to

- Beside every heading. A heading is already a heading.
- As decoration inside a tinted rounded square, in a grid of three. That
  construction is the "features section" of every generated page.
- To represent an abstract noun. There is no good icon for "understanding".
- Mixed with emoji. Emoji and line icons must never sit in the same row.
  (The current `PLACEHOLDER_VIEWS` uses 🏆 and ⚙️ — replaced.)

---

## 8. Illustration

The product has almost no illustration, and that is close to correct. What
exists must obey one language:

**Flat. Two to three colours from the palette. Drawn with the same 2px stroke
as the icon set. No gradient meshes, no glow, no 3D, no isometric.**

| Kind | Rule |
|---|---|
| **Mascot** | There is none, and none is being invented. A mascot the product does not have is a decoration with a face. If one is ever added, it is drawn in the icon language and appears only in empty and completion states. |
| **Course / module art** | A flat emblem per module, in that module's tint, stroked like the icons. No orbiting rings, no glowing spheres. |
| **Rewards** | The existing `ShopArt` and `DailyBonusArt` sets stay: small, flat, legible at 40px. Repalette to warm tokens. |
| **Empty states** | Text first. An illustration only if it explains something a sentence cannot. |
| **Completion** | A stamp, not a firework. A rubber-stamp mark in `--moss` reads as earned; particles read as a slot machine. |
| **Decorative** | None. There is no category for "art added because the area looked bare". |

### Texture

One texture exists: a near-invisible horizontal grain on `--paper`, drawn as
a repeating linear gradient at ~2% alpha. No image, no SVG filter, no cost.
It is what makes the warmth read as material. It is applied once, on the page
ground, and never on a card.

---

## 9. Motion tokens

Full rules in `MOTION_RULES.md`. The values:

```css
--dur-press:  120ms   /* button depress / release */
--dur-hover:  180ms   /* hover in and out */
--dur-enter:  240ms   /* popover, toast, panel arriving */
--dur-modal:  320ms   /* a modal taking the screen */
--dur-settle: 600ms   /* a number or bar moving to a new value */

--ease-out:    cubic-bezier(0.33, 1, 0.68, 1);     /* responding to input */
--ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1);     /* arriving at a value */
--ease-press:  cubic-bezier(0.4, 0, 0.6, 1);       /* short, symmetric */
```

---

## 10. Z-index

```css
--z-base:    1
--z-raised:  10    /* sticky nav, sticky sidebar */
--z-popover: 60
--z-modal:   200
--z-toast:   300
```

Nothing is allowed a literal z-index above 10 outside these tokens. The
codebase currently contains `z-index: 9999` on a lesson popup; that is a
symptom of stacking-context confusion, not a requirement.
