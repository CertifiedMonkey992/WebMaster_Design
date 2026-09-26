/* ═══════════════════════════════════════════════════════════════════════════
   score.js — THE TITLE SEQUENCE ON ONE CLOCK
   ---------------------------------------------------------------------------
   Every part of the sequence is a Web Animation created here, up front, with
   its moment as its delay (MOTION_RULES.md → The title sequence → rule 3).
   Nothing is scheduled by a timer, so nothing can drift: the whole piece
   can be paused, resumed and sought to any frame like a film.

   The beats sit on a 500ms grid (120 BPM) — the table in MOTION_RULES.md is
   the cue sheet a sound designer would score from. Inside a beat, every
   gesture is a verb from that file at its tier's duration and easing.

   Layering. The first animation of a property on an element fills
   backwards, so the element shows its opening state from the first frame;
   later ones only fill forwards, so they never mask an earlier one before
   their own moment comes.
   ═══════════════════════════════════════════════════════════════════════════ */

import { DUR, EASE, STAGGER, LAG } from '../../motion/timing'
import { sample } from '../../motion/spring'
import { BEND, HEFT, LEAF_EASE, NEEDLE } from '../guide/FieldGuide'
import {
  HINGE_Z, LEAF_H, PERSPECTIVE, blendCamera, cameraStates, cameraTransform, closeUp, deskPose,
} from './camera'
import { SLIP } from './IntroScenes'

export const LENGTH = 15000

/* The cue sheet, in ms from the first frame. */
export const AT = {
  settle: 1000,                    // the camera has risen and squared up to the page
  lead: 150,                       // "The AI you already use"
  roll: [500, 1000, 1500, 2000],   // … picks · unlocks · answers · finishes
  turnA: 2600,
  capI: 3120,                      // Part I: "It guesses the next word." — while the leaf clears
  given: 3300,
  guess: [4000, 5520, 6120],       // each candidate word dealt …
  land: [5500, 6000, 6250],        // … and set in the line, faster each time
  cue: 6450,                       // Part II: "Likely isn't the same as true."
  ring: 6800,
  stamp: 7400,
  turnB: 8400,
  capIII: 8950,                    // Part III — while the leaf clears
  line: 9550,
  pull: 10700,                     // the camera pulls back …
  rest: 12000,                     // … to the hero's own view
  shut: 12000,
  title: 12700,
  ink: 13600,
  still: 13300,                    // the book has come to rest: redraw it at 1:1
  preroll: 13550,                  // the page under the overlay is let through, a hair
  sync: 13950,
  handoff: 14200,
  lift: 14250,
}

/* ── Curves ─────────────────────────────────────────────────────────────── */

/** A CSS cubic-bezier as a function of progress, for curves that are
    sampled into keyframes (the camera, the cover's pose). */
function curve(css) {
  const [x1, y1, x2, y2] = css.match(/-?[\d.]+/g).map(Number)
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const x = (t) => ((ax * t + bx) * t + cx) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (p) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let t = p
    for (let i = 0; i < 8; i++) {
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= (x(t) - p) / d
    }
    t = Math.min(1, Math.max(0, t))
    return ((ay * t + by) * t + cy) * t
  }
}

const snap = curve(EASE.snap)
const swing = curve(EASE.swing)
const clamp01 = (v) => Math.min(1, Math.max(0, v))
/** 0 → 1 → 0 over [t0, t0 + d], smooth at both ends. */
const bump = (t, t0, d) => (t <= t0 || t >= t0 + d ? 0 : Math.sin(Math.PI * swing((t - t0) / d)))

/* ── The score ──────────────────────────────────────────────────────────── */

/**
 * Lay the sequence out on `root` (the rendered overlay) for the measured
 * hero `g`. Returns the clock (it ends when the sequence does), the moments
 * the host acts on — the book at rest (`still`), the hero's book lined up
 * with it (`sync`), the overlay starting to lift (`lift`) — and the
 * controls.
 */
export function createScore(root, g) {
  const anims = []
  const touched = new WeakMap()

  /** Animate every element in `targets` from `t` ms. `fill: 'forwards'`
      leaves the element in its stylesheet state until its moment (for a
      first gesture that does not begin from how the element should wait). */
  function at(targets, t, keyframes, { dur, ease = EASE.snap, stagger = 0, fill } = {}) {
    const list = !targets ? [] : targets instanceof Element ? [targets] : [...targets]
    const props = new Set(keyframes.flatMap((k) => Object.keys(k)).filter((p) => p !== 'offset' && p !== 'easing' && p !== 'composite'))
    list.forEach((el, i) => {
      const seen = touched.get(el) ?? new Set()
      const first = [...props].every((p) => !seen.has(p))
      props.forEach((p) => seen.add(p))
      touched.set(el, seen)
      anims.push(el.animate(keyframes, { duration: dur, delay: t + i * stagger, easing: ease, fill: fill ?? (first ? 'both' : 'forwards') }))
    })
  }

  const $ = (sel) => root.querySelector(sel)
  const $$ = (sel) => [...root.querySelectorAll(sel)]
  /** A sheet's content is printed twice (a leaf is two panels); run a
      gesture on each copy, so both halves of the page move as one. */
  const copies = (sel, fn) => $$(sel).forEach((copy) => fn(copy))

  /** Words rising out of their masks (the hero heading's Reveal). */
  function rise(words, t, stagger = STAGGER, dur = DUR.reveal) {
    at(words, t, [{ transform: 'translateY(112%) rotate(7deg)' }, { transform: 'none' }], { dur, stagger })
    at(words, t, [{ opacity: 0 }, { opacity: 1 }], { dur: DUR.open, ease: EASE.out, stagger })
  }
  /** Words leaving up (the Cue verb's exit). */
  function leave(words, t, stagger = STAGGER / 2) {
    at(words, t, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-112%)', opacity: 0 }], { dur: DUR.move, ease: EASE.in, stagger })
  }
  /** A pencil stroke drawn along its length. */
  function draw(path, t, dur, ease) {
    at(path, t, [{ strokeDashoffset: 1, visibility: 'hidden' }, { strokeDashoffset: 0.999, visibility: 'visible', offset: 0.001 }, { strokeDashoffset: 0, visibility: 'visible' }], { dur, ease })
  }

  const { pageW } = closeUp(g)
  const cam = cameraStates(g)

  /* ── The clock: the progress rule under Skip runs the length ─────────── */
  at($('.ts-progress'), 0, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { dur: LENGTH, ease: 'linear' })
  const clock = anims[anims.length - 1]

  /* ── Camera ────────────────────────────────────────────────────────────
     Rises off the desk and squares up to the page (0–1s, answering nothing,
     so it moves from its very first frame: snap); breathes in 3% over the
     close-up; gives a turning leaf room; takes the stamp's blow; pulls back
     to the hero's view on a weighted swing, turning to the desk's angle a
     little ahead of the retreat. */
  const shakeAt = AT.stamp + DUR.reveal * 0.5
  const turns = [AT.turnA, AT.turnB]
  const camAt = (t) => {
    if (t <= AT.settle) {
      const p = t / AT.settle
      return blendCamera(cam.opening, cam.near, { zoom: snap(p), turn: snap(clamp01(p * 1.1)), move: snap(p) })
    }
    const breathe = 1 + 0.03 * swing(clamp01((t - AT.settle) / (AT.pull - AT.settle)))
    const give = 1 - 0.04 * turns.reduce((s, t0) => s + bump(t, t0 - LAG.follow, DUR.turn + DUR.hover), 0)
    const held = { ...cam.near, k: cam.near.k * breathe * give }
    const jolt = t > shakeAt && t < shakeAt + DUR.move ? Math.sin(((t - shakeAt) / DUR.move) * Math.PI * 3) * (1 - (t - shakeAt) / DUR.move) : 0
    held.X = [held.X[0] + jolt * g.vw * 0.004, held.X[1] + jolt * g.vh * 0.006, 0]
    if (t <= AT.pull) return held
    const p = clamp01((t - AT.pull) / (AT.rest - AT.pull))
    return blendCamera(camAt(AT.pull), cam.rest, { zoom: swing(p), turn: swing(clamp01(p * 1.15)), move: swing(p) })
  }
  const camTimes = new Set()
  for (let t = 0; t <= AT.settle; t += 1000 / 40) camTimes.add(Math.round(t))
  for (let t = AT.settle; t <= AT.pull; t += 250) camTimes.add(Math.round(t))
  turns.forEach((t0) => { for (let t = t0 - LAG.follow; t <= t0 + DUR.turn + DUR.hover; t += 40) camTimes.add(Math.round(t)) })
  for (let t = shakeAt; t <= shakeAt + DUR.move; t += 16) camTimes.add(Math.round(t))
  for (let t = AT.pull; t <= AT.rest; t += 1000 / 40) camTimes.add(Math.round(t))
  camTimes.add(AT.rest)
  const camKeys = [...camTimes].sort((a, b) => a - b).map((t) => ({ offset: t / AT.rest, transform: cameraTransform(camAt(t)) }))
  at($('.ts-cam'), 0, camKeys, { dur: AT.rest, ease: 'linear' })

  /* The lens: close-up with a long perspective centred on the screen (so a
     turning leaf rises toward the viewer without ballooning), ending on the
     hero's own — .fg-lean's 1700px, from its origin. */
  const view = $('.ts-view')
  at(view, 0, [
    { offset: 0, perspective: `${pageW * 1.3}px`, perspectiveOrigin: `${g.vw / 2}px ${g.vh / 2}px` },
    { offset: AT.settle / AT.rest, perspective: `${pageW * 2.6}px`, perspectiveOrigin: `${g.vw / 2}px ${g.vh / 2}px` },
    { offset: AT.pull / AT.rest, perspective: `${pageW * 2.6}px`, perspectiveOrigin: `${g.vw / 2}px ${g.vh / 2}px`, easing: EASE.swing },
    { offset: 1, perspective: `${PERSPECTIVE}px`, perspectiveOrigin: `${g.ox}px ${g.oy}px` },
  ], { dur: AT.rest, ease: 'linear' })

  /* One band of window light drifts across the page in close-up, and is
     gone before the camera reaches the hero (rule 5). */
  const light = $('.ts-light')
  at(light, 0, [{ transform: 'translateX(-18%)' }, { transform: 'translateX(22%)' }], { dur: AT.pull, ease: EASE.swing })
  /* From a hair above nothing, so it is painted while the first frame is
     held (TitleSequence.jsx) rather than on the first frame of motion. */
  at(light, 0, [{ opacity: 0.01 }, { opacity: 1 }], { dur: DUR.celebrate, ease: EASE.out })
  at(light, AT.pull, [{ opacity: 1 }, { opacity: 0 }], { dur: DUR.celebrate, ease: EASE.out })

  /* ── Introduction: the AI you already use … ────────────────────────── */
  copies('[data-leaf="a"] .fg-leaf-recto', (page) => {
    rise(page.querySelectorAll('.ts-a-lead .st-i'), AT.lead)
    const phrases = [...page.querySelectorAll('.ts-a-phrase')]
    /* A Roll: the outgoing phrase and the incoming one travel together on
       one clock, a line apart, like the columns of a counter. */
    phrases.forEach((el, i) => {
      at(el, AT.roll[i], [{ transform: 'translateY(110%) rotate(3deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: DUR.open })
      if (i < phrases.length - 1) {
        at(el, AT.roll[i + 1], [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-110%) rotate(-2deg)', opacity: 0 }], { dur: DUR.open })
      }
    })
  })

  /* ── Page turns: the leaf lifts by its edge, bends, and lays itself down;
     its faces darken as they turn from the light; it shades the page it
     uncovers (FieldGuide.jsx → the same bend, easing and light). ──────── */
  function turn(id, t, under) {
    const leaf = $(`[data-leaf="${id}"]`)
    const h = LEAF_H[id]
    const timing = { dur: DUR.turn, ease: LEAF_EASE }
    at(leaf, t, [
      { transform: `rotateY(180deg) translateZ(${h}px)` },
      { transform: `rotateY(90deg) translateZ(${h + 3}px)`, offset: 0.5 },
      { transform: `rotateY(0deg) translateZ(${h}px)` },
    ], timing)
    at(leaf.querySelectorAll('.fg-leaf-part--outer'), t, BEND.map((k) => ({ offset: k.offset, transform: `rotateY(${k.b}deg)` })), timing)
    at(leaf.querySelectorAll('.fg-fold'), t, BEND.map((k) => ({ offset: k.offset, opacity: Math.min(1, Math.abs(k.b) / 20) })), timing)
    at(leaf.querySelectorAll('.fg-leaf-recto > .fg-shade'), t, [{ opacity: 0 }, { opacity: 0.34, offset: 0.5 }, { opacity: 0.34 }], timing)
    at(leaf.querySelectorAll('.fg-leaf-verso > .fg-shade'), t, [{ opacity: 0.3 }, { opacity: 0.3, offset: 0.5 }, { opacity: 0 }], timing)
    at(under, t, [{ opacity: 0 }, { opacity: 0.26, offset: 0.3 }, { opacity: 0.18, offset: 0.7 }, { opacity: 0 }], { dur: DUR.turn + LAG.finish, ease: 'linear' })
  }
  turn('a', AT.turnA, $$('[data-leaf="b"] .fg-leaf-recto .fg-cast'))

  /* ── Part I: it guesses the next word ──────────────────────────────── */
  copies('[data-leaf="b"] .fg-leaf-recto', (page) => {
    rise(page.querySelectorAll('.ts-cap--1 .st-i'), AT.capI)
    rise(page.querySelectorAll('.ts-b-given .st-i'), AT.given, STAGGER * 1.5)

    const slots = [...page.querySelectorAll('.ts-slot')]
    slots.forEach((slot, s) => {
      const word = slot.querySelector('.ts-slot-word')
      const slips = [...slot.querySelectorAll('.ts-slip')]
      const t0 = AT.guess[s]
      const landAt = AT.land[s]

      if (!slips.length) {
        /* The model is sure of itself by now: the last word simply sets. */
        at(word, t0, [{ opacity: 0, transform: 'translateY(40%) rotate(5deg)' }, { opacity: 1, transform: 'none' }], { dur: DUR.move })
        return
      }

      /* Dealt: the slips arrive like handled cards, a little weight each. */
      const quick = s > 0
      const deal = quick ? DUR.move : DUR.open
      const deck = STAGGER * (quick ? 0.75 : 1.75)
      at(slips, t0, [{ transform: 'translateY(-38%) scale(0.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: deal, ease: EASE.lift, stagger: deck })
      /* Their likelihoods settle. */
      slips.forEach((slip, j) => {
        at(slip.querySelector('.ts-bar-fill'), t0 + LAG.finish + j * deck, [{ transform: 'scaleX(0)' }, { transform: `scaleX(${slip.dataset.p})` }], { dur: quick ? DUR.open : DUR.settle, ease: EASE.settle })
      })
      /* The likeliest is picked up, a lift's length before it flies; the
         others fall back. */
      const [win, ...rest] = slips
      const flyDur = quick ? DUR.move : DUR.open
      const liftAt = landAt - flyDur - (quick ? DUR.micro : DUR.lift)
      at(win, liftAt, [{ transform: 'none' }, { transform: 'translateY(-6%) scale(1.04)' }], { dur: DUR.lift, ease: EASE.lift })
      at(win.querySelector('.ts-slip-card'), liftAt, [{ boxShadow: 'none' }, { boxShadow: 'var(--shadow-lift)' }], { dur: DUR.lift, ease: EASE.out })
      at(rest, liftAt, [{ opacity: 1, transform: 'none' }, { opacity: 0.28, transform: 'translateY(8%)' }], { dur: DUR.lift, ease: EASE.out })
      /* … and its word flies into the line, growing to the line's size. */
      const fly = win.querySelector('.ts-fly')
      const from = { x: SLIP.padX, y: SLIP.top + SLIP.padY }
      at(fly, landAt - flyDur, [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${-from.x}em, ${-from.y}em) scale(2)` },
      ], { dur: flyDur, ease: EASE.snap })
      at(fly, landAt, [{ opacity: 1 }, { opacity: 0 }], { dur: 1 })
      at([win.querySelector('.ts-slip-card'), win.querySelector('.ts-bar')], landAt - flyDur, [{ opacity: 1 }, { opacity: 0.35 }], { dur: DUR.move, ease: EASE.out })
      at(word, landAt, [{ opacity: 1, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { dur: DUR.move, ease: EASE.spring, fill: 'forwards' })
      /* The slips are cleared away once the word is in, each from where it
         was left. */
      at(win, landAt, [{ opacity: 1 }, { opacity: 0 }], { dur: DUR.hover, ease: EASE.in })
      at(rest, landAt, [{ opacity: 0.28 }, { opacity: 0 }], { dur: DUR.hover, ease: EASE.in })
    })

    /* ── Part II: likely isn't the same as true ───────────────────────── */
    leave(page.querySelectorAll('.ts-cue--1'), AT.cue)
    at(page.querySelectorAll('.ts-cue--2'), AT.cue + LAG.follow, [{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { dur: DUR.open })
    leave(page.querySelectorAll('.ts-cap--1 .st-i'), AT.cue)
    rise(page.querySelectorAll('.ts-cap--2 .st-i'), AT.cue + DUR.move * 0.6)

    draw(page.querySelector('.ts-ring path'), AT.ring, DUR.reveal, EASE.swing)
    at(page.querySelector('.ts-ring'), AT.ring, [{ opacity: 0 }, { opacity: 1 }], { dur: DUR.hover, ease: EASE.out })

    /* The stamp (a Report): it lands with a rotate-overshoot, the page
       takes the blow (the camera's jolt), and the claim it lands on takes
       the colour of a mistake. */
    at(page.querySelector('.ts-stamp'), AT.stamp, [
      { opacity: 0, transform: 'rotate(-16deg) scale(1.9)' },
      { opacity: 1, transform: 'rotate(-6deg) scale(0.94)', offset: 0.5 },
      { opacity: 1, transform: 'rotate(-9deg) scale(1.02)', offset: 0.78 },
      { opacity: 1, transform: 'rotate(-8deg) scale(1)' },
    ], { dur: DUR.reveal, ease: EASE.out })
    at(page.querySelectorAll('.ts-slot-word'), shakeAt, [{ color: 'var(--ink)' }, { color: 'var(--berry-ink)' }], { dur: DUR.hover, ease: EASE.out })
  })

  turn('b', AT.turnB, $$('[data-page="c"] > .fg-cast'))

  /* ── Part III: decide where you draw the line ──────────────────────── */
  const c = $('[data-page="c"]')
  rise(c.querySelectorAll('.ts-c-head .st-i'), AT.capIII, STAGGER * 1.5)
  draw(c.querySelector('.ts-c-line path'), AT.line, DUR.celebrate, EASE.swing)

  /* ── The book shuts. The cover and the turned leaves swing over as one
     block under the book's own gravity (FieldGuide.jsx → HEFT, sampled with
     the same integrator), and everything that follows the cover's angle in
     fieldGuide.css — the desk's pose, the cover's shade, the shadow it casts
     on the page, the contact shadow — follows it here, frame for frame. ── */
  const fall = sample({ from: 180, to: 0, ...HEFT, min: 0, max: 180, restitution: 0.3, duration: 0.95, every: 1 / 60 })
  const shutDur = fall[fall.length - 1].t * 1000
  const hit = fall.find((s) => s.x <= 0.01)
  const hitAt = AT.shut + (hit ? hit.t * 1000 : shutDur)
  const off = (s) => s.t / fall[fall.length - 1].t
  const deg = (a) => (a * Math.PI) / 180
  at($('.ts-hinge'), AT.shut, fall.map((s) => ({ offset: off(s), transform: `translateZ(${HINGE_Z}px) rotateY(${-s.x}deg)` })), { dur: shutDur, ease: 'linear' })
  at($('.ts-desk'), AT.shut, fall.map((s) => {
    const p = deskPose(s.x)
    return { offset: off(s), transform: `translateX(${p.x * g.bw}px) rotateX(${p.rx}deg) rotateZ(${p.rz}deg)` }
  }), { dur: shutDur, ease: 'linear' })
  at($('.fg-shade--cover'), AT.shut, fall.map((s) => ({ offset: off(s), opacity: Math.sin(deg(s.x)) * 0.42 })), { dur: shutDur, ease: 'linear' })
  at($('[data-page="c"] > .fg-cast'), AT.shut, fall.map((s) => ({ offset: off(s), opacity: Math.max(0, Math.cos(deg(s.x))) * Math.sin(deg(s.x)) * 0.7 })), { dur: shutDur, ease: 'linear' })
  at($('.ts-shadow-open'), AT.shut, fall.map((s) => {
    const o = Math.min(s.x, 180) / 180
    return { offset: off(s), transform: `scaleX(${o})`, opacity: o }
  }), { dur: shutDur, ease: 'linear' })
  /* It lands with weight: pressed into the desk, the shadow tightening; and
     it settles into the hero book's resting drift (fieldGuide.css →
     fg-drift's first frame), which the hand-off lines the real book up with. */
  const press = $('.ts-press')
  at(press, hitAt, [{ translate: '0 0 0' }, { translate: '0 0 -4px' }], { dur: DUR.micro, ease: EASE.press })
  at(press, hitAt + DUR.micro, [{ translate: '0 0 -4px' }, { translate: '0 0 0' }], { dur: DUR.lift, ease: EASE.lift })
  at(press, AT.shut, [{ rotate: '1 0.3 0 0deg' }, { rotate: '1 0.3 0 -0.6deg' }], { dur: shutDur, ease: EASE.swing })
  at($('.ts-shadow'), hitAt, [{ scale: '1' }, { scale: '0.97' }, { scale: '1' }], { dur: DUR.move + DUR.micro, ease: EASE.lift })

  /* The compass needle, spun by the fall, finds north on the book's own
     under-damped spring. */
  const needle = sample({ from: 230, to: 0, ...NEEDLE, duration: 1.9, every: 1 / 30 })
  const spun = needle[needle.length - 1].t
  at($('.ts-desk .fg-compass-needle'), AT.shut, needle.map((s) => ({ offset: s.t / spun, rotate: `${s.x}deg` })), { dur: spun * 1000, ease: 'linear' })

  /* ── The headline sets where the hero's heading is, with the hero's own
     stagger, and its scribble is inked as the hero's is (App.css). ────── */
  rise(root.querySelectorAll('.ts-title .st-i'), AT.title, 34)
  draw(root.querySelector('.ts-title .hero-scribble path'), AT.ink, DUR.celebrate, EASE.settle)

  /* ── Hand-off: Skip and the rule leave, then the overlay lifts off the
     live hero, which is lying underneath in exactly this pose. ───────── */
  at($('.ts-chrome'), AT.handoff, [{ opacity: 1 }, { opacity: 0 }], { dur: DUR.move, ease: EASE.in })
  /* Where the hero's book is below the fold, this one goes there: down and
     out of view as the overlay lifts, rather than fading over the copy. */
  if (!g.inView) {
    at($('.ts-desk'), AT.handoff - DUR.move, [{ translate: '0 0' }, { translate: `0 ${Math.max(g.drop, g.vh - g.cy + g.bh)}px` }], { dur: DUR.reveal, ease: EASE.in })
  }
  /* The page under an opaque overlay is not painted. Let a hair of it
     through while the title holds still, so it is painted then — not on the
     first frame of the lift. */
  at(root, AT.preroll, [{ opacity: 1 }, { opacity: 0.995 }], { dur: DUR.hover, ease: EASE.out })
  at(root, AT.lift, [{ opacity: 0.995 }, { opacity: 0 }], { dur: DUR.reveal, ease: EASE.out })

  /* Two moments on the clock with no motion of their own: the host lines
     the real book up with this one just before the overlay lifts, and gives
     the page back the moment it starts to lift (rule 6). */
  at($('.ts-sync'), AT.sync, [{ opacity: 0 }, { opacity: 0 }], { dur: 1 })
  const sync = anims[anims.length - 1]
  at($('.ts-sync'), AT.lift, [{ opacity: 0 }, { opacity: 0 }], { dur: 1 })
  const lift = anims[anims.length - 1]
  at($('.ts-sync'), AT.still, [{ opacity: 0 }, { opacity: 0 }], { dur: 1 })
  const still = anims[anims.length - 1]

  return {
    clock,
    sync,
    lift,
    still,
    play: () => anims.forEach((a) => a.play()),
    pause: () => anims.forEach((a) => a.pause()),
    cancel: () => anims.forEach((a) => a.cancel()),
  }
}
