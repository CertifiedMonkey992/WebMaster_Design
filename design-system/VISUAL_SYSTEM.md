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
--font-ui:      'Manrope', 'Segoe UI', system-ui, sans-serif;
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
| `--ink-muted` | `#675746` | 5.9:1 | Body secondary, descriptions |
| `--ink-faint` | `#74644F` | 4.8:1 | Micro labels, metadata, captions |

Every ink passes WCAG 2.2 AA (4.5:1) for normal-size text on every ground in
the system — paper, surface, surface-raised and surface-sunk (4.56:1, the
lowest). The site-quality pass (2026-09) darkened `--ink-muted` from
`#736251` and `--ink-faint` from `#7E6E5A` (4.2:1, which failed on paper)
while keeping the three steps of hierarchy apart.

`--ink-faint` is for tracked uppercase labels, metadata and captions. It is
not for paragraphs. If a sentence matters, it gets `--ink-muted` or darker.
Decorative numerals (a module's number) use `--ink-faint` at rest, never a
tan: text that can be read must pass contrast.

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

### The nav icons (revision 9)

The left sidebar's icons are full-colour illustrations drawn to a reference
the product owner supplied (2026-10): a birdhouse (Learn), a dumbbell
(Practice), a treasure chest (Quests), a shopfront (Shop), an avatar
(Profile), and, in the same manner, a globe (Home) and an "i" in a disc
(About). Their colours are a deliberate, **scoped** departure from the warm
palette — a named exception, like a second ink used for one plate:

```css
--ni-red:    #FF4B4B   /* birdhouse roof, chest dot */
--ni-yellow: #FFC800   /* birdhouse wall, chest gold; #FBE56D its shine */
--ni-blue:   #1CB0F6   /* dumbbell, globe; #61C8F9 its shine */
--ni-purple: #CE82FF   /* the About disc */
--ni-brown:  #A56644   /* shopfront; #AA572A the chest's wood */
/* …and the rest of the --ni-* set in index.css */
```

Rules: every `--ni-` token is read **only** by `.ni` icons
(`components/learn/NavIcons.jsx`), through `nf-*` / `ns-*` classes — never
by text, borders, surfaces or any other icon. Flat fills, no outlines, no
gradients; one lighter shine per object. The sidebar around them keeps the
paper palette, the evergreen rail and the ink labels exactly.

Revision 10 (2026-10) adds two destinations to the same family, drawn the
same way from the same tokens: **Friends** (two learners side by side) and
**Leagues** (a gold trophy shield). Both appear only on a build connected to
a LunX server (`COMPONENT_RULES.md` → Friends, Leagues).

### The league palette (revision 10)

The ten leagues are named for metals and stones — Bronze, Silver, Gold,
Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond — and a league
badge has to *be* the stone it is named for. Sapphire is blue and amethyst
is purple; drawing them in warm stand-ins would make the badges lie. So the
badges get a second **scoped** palette, the same kind of named exception as
the nav icons:

```css
/* three steps per league: face, shade, shine */
--lg-bronze:   #C27A3E   --lg-bronze-deep:   #8E5527   --lg-bronze-light:   #E2A671
--lg-silver:   #AEB6BD   --lg-silver-deep:   #7E8890   --lg-silver-light:   #DCE1E5
--lg-gold:     #EDB22C   --lg-gold-deep:     #B98410   --lg-gold-light:     #FFDD7A
--lg-sapphire: #2F6AD0   --lg-sapphire-deep: #1C4795   --lg-sapphire-light: #7DA6EE
--lg-ruby:     #D2334A   --lg-ruby-deep:     #971D32   --lg-ruby-light:     #F07D8D
--lg-emerald:  #1F9C58   --lg-emerald-deep:  #12703E   --lg-emerald-light:  #6CD29A
--lg-amethyst: #9459D0   --lg-amethyst-deep: #6534A0   --lg-amethyst-light: #C59BEF
--lg-pearl:    #E9DCD2   --lg-pearl-deep:    #B9A496   --lg-pearl-light:    #FFF8F1
--lg-obsidian: #3B3147   --lg-obsidian-deep: #221B2B   --lg-obsidian-light: #76658A
--lg-diamond:  #86D4EE   --lg-diamond-deep:  #3E9EC4   --lg-diamond-light:  #E1F7FF
```

Rules: every `--lg-` token is read **only** by `.lg` artwork —
`components/leagues/LeagueArt.jsx` (the ten badges, the medals and the
trophies) — through `lf-*` fill classes. Never by text, borders, surfaces,
bars or any other icon. The leaderboard, the ladder and every label around a
badge keep the paper palette; a league's *name* is ink, never its stone.

**How prestige reads**, so the family stays one family: every badge is a
crest on the same 48-unit grid with the same back plate, shade facet and one
shine. What grows is the crest, not the colour count — Bronze to Gold are a
plain shield with a rim, then a star; Sapphire, Ruby and Emerald set a cut
stone in the shield; Amethyst and Pearl add laurel; Obsidian adds a gold
trim; Diamond is a brilliant-cut stone under a crown with laurel. A lower
league is a smaller badge in the same language, never a broken one.

**States**: *earned* — full colour; *current* — full colour inside a 1.5px
ink ring (the streak week marks today the same way); *locked* — the crest's
silhouette in `--paper-deep` with a `--line` edge and a small lock, which is
the "locked" composition every other locked object here already uses.

### Avatars (revision 10)

A learner on a leaderboard or in a friends list is shown by a round avatar:
their initials (Manrope `--fw-bold`) in white on one of seven warm grounds
they choose — `--evergreen`, `--clay`, `--moss`, `--ochre-ink`, `--berry`,
`--ink-muted`, `--tan-deep` (with ink initials). There are no uploaded
photos: the course is for 14–18-year-olds and a server that accepted images
would need moderation it does not have. Sizes: 28px in a row, 40px in a
profile header, 56px in a profile card.

### Light on the economy (revision 4)

The economy icons are small physical objects, and physical treasure catches
the light. These four tokens exist **only** for the specular parts of the
economy icons, the sparkles and embers around them, and a Report's bloom
behind them (`MOTION_RULES.md` → *Light*). They are never a resting text,
border, button or surface colour — a figure may flash through one for the
length of a Roll, and that is all.

```css
--gem-light:    #F6DE9A   /* a gem's lit crown and table; sparkles */
--ochre-bright: #E2A631   /* gem / XP bloom; a gem's upper face */
--berry-bright: #CC4450   /* heart bloom; a heart's upper face */
--clay-bright:  #DE6C3A   /* flame bloom; the flame's hot layer; embers */
```

All four are warm (red is the largest channel). Alpha channel versions
(`--gem-light-rgb`, `--ochre-bright-rgb`, `--berry-bright-rgb`,
`--clay-bright-rgb`) exist for blooms.

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
| The landing page's field guide | a contact shadow in warm ink under the book, and cast shadows on its pages while a sheet turns — it depicts a physical object, and its shadows move with it |
| A pressed button | `--shadow-press` |
| A handled object that has been picked up (a lifted index card, a dragged chip, popped shop art) | `--shadow-lift` |

```css
--shadow-lift: 0 16px 34px rgba(43,33,25,.14), 0 5px 12px rgba(43,33,25,.07);
```

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

### The set, by meaning (revision 10)

One glyph per meaning, everywhere it appears. A screen that needs "friend
request" uses `user-plus`, whether it is the Friends tab, a profile card or
a toast.

| Meaning | Icon | Where |
|---|---|---|
| Practice (the destination) | dumbbell (`.ni`) | sidebar; the Practice header |
| Practice, in a line of text or a quest | `review` | hearts panel, practice quests |
| Review mistakes | `review` — a looped arrow with a cross | Practice |
| Due for review | `due` — a calendar with a tick | Practice |
| Weak areas | `trending-up` | Practice |
| Quests, goals, accuracy | `target` | Quests, gems panel, Field Kit, profile |
| Older material | `hourglass` | Practice |
| Mixed practice | `shuffle` | Practice |
| Quick practice | `timer` | Practice |
| By topic | `book` | Practice |
| Friends | `users` | Friends tab, profile |
| Add a friend / a request | `user-plus` | Add friends, requests |
| Accepted | `user-check` | requests, toasts |
| Remove a friend | `user-minus` | friend menu |
| Friend code | `hash` | Add friends |
| Search by username | `search` | Add friends |
| Email | `mail` | Add friends |
| Block | `ban` | friend menu, profile |
| Report | `flag` | friend menu, profile |
| Friend challenge | `swords` | Friends → Challenges |
| League | the league's badge (`.lg`) | Leagues, profiles, rows |
| Weekly rank / podium | `medal` (line) or the drawn medals (`.lg`) | leaderboard |
| Tournament | `crown` | Leagues |
| Notifications | `bell` | nav badges, toasts |
| Privacy | `eye` / `eye-off` | Profile → Privacy |

The line icons (`Icons.jsx → LINE_ICONS`) keep the spec above: 24-unit box,
2px round strokes, `currentColor`. The full-colour pictures — nav icons,
league badges, medals, trophies — are the illustration layer and never sit
in the same row as a line icon of the same meaning.

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
| **The field guide** | The landing hero's one depicted object: a clothbound book in `--evergreen` with `--surface` pages, chapter tabs in the seven chapter inks (`guideData.js → CHAPTER_INK`; every one passes AA as text), a `--clay` ribbon, and a compass drawn in the 2px icon language. Its only "illustration" is the compass, and it is there because the product is a guide. Pages carry real course data. The page and cover shading are two-stop, one-hue gradients depicting depth on a physical surface — the one sanctioned use. |
| **Rewards** | The existing `ShopArt` set stays: small, flat, legible at 40px, in warm tokens. The daily spin uses the economy icons themselves on its slots. |
| **Economy icons** | Gem, heart, flame, bolt and shield are drawn as small objects: a back plate, a face, a shade facet, a warm shine mark. Revision 4 lets their faces take a two-stop, one-hue gradient toward the `-bright` token and gives the gem a lit crown in `--gem-light` — the one place in the product where things look like treasure. |
| **League badges, medals, trophies** *(rev 10)* | Flat crests in the scoped `--lg-*` palette (§2 → The league palette): a back plate, a face, one shade facet, one shine — the economy icons' construction without their gradient. Medals (1st, 2nd, 3rd) are discs on a ribbon in gold, silver and bronze; trophies are cups for a promotion, a podium finish, a tournament round and a friend challenge. Each is earned by a recorded result and is shown with the sentence saying why. |
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
--dur-micro:     90ms    /* press down, icon twitch, tooltip in */
--dur-press:     120ms   /* release */
--dur-hover:     160ms   /* colour, border, background on hover */
--dur-move:      240ms   /* a hover response that travels */
--dur-lift:      320ms   /* a handled object picked up / put down */
--dur-enter:     240ms   /* popover, toast */
--dur-modal:     320ms   /* a modal taking the screen */
--dur-open:      420ms   /* expander, view change, travelling indicator */
--dur-reveal:    560ms   /* arriving on the page as it scrolls in */
--dur-settle:    600ms   /* a number or bar moving to a new value */
--dur-turn:      760ms   /* the field guide's cover, a leaf turning */
--dur-celebrate: 800ms   /* a reward landing, a stamp, a burst */

--ease-out:    cubic-bezier(0.33, 1, 0.68, 1);     /* colour and opacity */
--ease-snap:   cubic-bezier(0.16, 1, 0.3, 1);      /* travel in response to input */
--ease-settle: cubic-bezier(0.2, 0.8, 0.3, 1);     /* arriving at a value */
--ease-lift:   cubic-bezier(0.3, 1.3, 0.5, 1);     /* a handled object, ~3% overshoot */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Reports only */
--ease-press:  cubic-bezier(0.4, 0, 0.6, 1);       /* short, symmetric */
--ease-in:     cubic-bezier(0.5, 0, 0.75, 0);      /* something leaving */
--ease-swing:  cubic-bezier(0.65, 0, 0.35, 1);     /* momentum; ambient drift */
--stagger:     40ms                                /* siblings arriving */
--lag-follow:  40ms                                /* secondary part of a gesture */
--lag-finish:  90ms                                /* supporting part of a gesture */

--idle-glint:  6.7s    /* a gem catching the light */
--idle-beat:   5.3s    /* a healthy heart's slow beat */
--idle-zap:    7.9s    /* the XP bolt's flicker */
--idle-float:  5.9s    /* reward art floating in its tile */
--idle-sweep:  9.7s    /* light crossing a large surface; a rule drawn again */
--idle-run:    7.3s    /* a wave running along a row */
--idle-wave:   6.1s    /* things in a list stirring in turn */
```

Revision 3 of `MOTION_RULES.md` added the `move`, `lift`, `open`, `reveal`
and `turn` tiers, the `snap`, `lift` and `swing` easings and the two lags, and
restricted `--ease-spring` to Reports. Revision 4 added the seven idle periods,
chosen to be mutually unrelated so no two idle events on one screen fall into
step. JS reads the same values from `src/motion/timing.js`.

---

## 10. Z-index

```css
--z-base:    1
--z-raised:  10    /* sticky nav, sticky sidebar */
--z-popover: 60
--z-modal:   200
--z-toast:   300
--z-fx:      400   /* reward flights, bursts, tooltips — above everything, never interactive */
```

Nothing is allowed a literal z-index above 10 outside these tokens. The
codebase currently contains `z-index: 9999` on a lesson popup; that is a
symptom of stacking-context confusion, not a requirement.
