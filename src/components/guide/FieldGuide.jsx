/* ═══════════════════════════════════════════════════════════════════════════
   FieldGuide.jsx — THE HERO'S SHOWCASE OBJECT
   ---------------------------------------------------------------------------
   The course as what the product says it is: a field guide lying on the
   desk. Built from SECTIONS (guideData.js), so every page is real.

   Replaces the fanned index-card stack, which read as clunky for four
   reasons this component is built to avoid (MOTION_RULES.md → The field
   guide): a hovered card grew and un-hovered itself; five nested parts ran on
   five clocks; cards flipped about their centre instead of a hinge; and it
   dealt itself with rAF only.

   How it moves, and why each is physics rather than a transition:

     cover / chapter block   one angle, 0–180°, on a spring WITH GRAVITY and a
                             hard stop at the desk. A push opens it; it slows
                             toward vertical, falls, slaps down and rebounds 3°.
                             Every dependent value — the book sliding to centre
                             the spread, the face darkening as it turns from the
                             light, the shadow it casts on the page, the contact
                             shadow widening — is derived in CSS from that ONE
                             variable, so they cannot drift out of step.
     leaves                  Web Animations about the spine, riffling 80ms apart
                             when several chapters are turned at once; the
                             shading on each face and the cast shadow beneath
                             run on the same timing.
     pose                    follows the pointer on a weighty spring.
     compass needle          points at the pointer on an under-damped spring,
                             and wanders when left alone.
     thumb tabs              lean out by proximity to the pointer.

   Ambient: the book floats and its ribbon sways, and a band of window light
   crosses the cloth now and then (CSS) — paused offscreen, held still while
   the book is in the hand.

   Idle life (revision 4, MOTION_RULES.md → The field guide → Idle life): left
   alone, the book performs small gestures at jittered intervals — the cover
   lifts on a breath of air and taps back down, a chapter's pages lift and its
   tab leans out, the thumb tabs riffle, the needle swings and finds north —
   and, rarely, it opens itself, turns a chapter or two, and closes. The hand
   always wins: any touch cancels the gesture in progress and leaves the book
   as it is, and idle life waits 8s after the last touch.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState,
} from 'react'
import { CHAPTERS, CHAPTER_INK, PAGE_UNITS, SPREADS, leftUnits, tabDepth, spreadLabel } from './guideData'
import { Cover, LeftPage, RightPage, TabFaces } from './GuidePages'
import { createSpring } from '../../motion/spring'
import { hasFinePointer, prefersReducedMotion } from '../../motion/env'
import useAmbient, { isOnScreen, onVisibility } from '../../motion/ambient'
import { pick } from '../../motion/idle'
import { usePerformer, yieldTo, stageMode } from '../../motion/stage'
import { useScrollProgress } from '../../motion/scroll'
import { DUR } from '../../motion/timing'
import './fieldGuide.css'

/* ── Feel ───────────────────────────────────────────────────────────────────
   Tuned by simulation (stiffness, damping in 1/s², gravity in °/s²):
     HEFT  open 0→180 lands at ~510ms, rebounds 3°, still by ~630ms; closing
           is the same fall in reverse.
     LIFT  a hand raising the cover a few degrees: ~250ms, no visible bounce. */
const GRAVITY = 1500
const HEFT = { stiffness: 30, damping: 6, force: (a) => -GRAVITY * Math.cos((a * Math.PI) / 180) }
const LIFT = { stiffness: 260, damping: 26, force: null }
/* Amplitude carries importance: a peek at a chapter must be seen from across
   the page, so the block lifts far enough to show the page beneath. */
const HOVER_ANGLE = 14
const PEEK_ANGLE = 18

/* Idle feels. AIR: a breath lifting the cover — slower than a hand, with a
   few percent of float at the top. DROP: the cover let go from a small
   angle — a softened gravity pulls it down and the desk's stop (restitution
   0.3) gives the tap. */
const AIR = { stiffness: 60, damping: 11, force: null }
/* The cover drifting open far enough to see beneath it: slower still. */
const AIR_SLOW = { stiffness: 28, damping: 7.5, force: null }
const DROP = { stiffness: 40, damping: 7, force: (a) => -700 * Math.cos((a * Math.PI) / 180) }
const NEEDLE = { stiffness: 55, damping: 6.5 }
const NEEDLE_LOOSE = { stiffness: 26, damping: 3.2 }
/* After a touch, the book waits this long before it performs again. */
const HANDS_OFF_MS = 8000
const rand = (a, b) => a + Math.random() * (b - a)

const LEAF_MS = Math.round(DUR.turn * 0.85)
const LEAF_STAGGER = 80
/* A page turned by a finger: it resists for a moment as it lifts, travels
   quickly through vertical, and lays itself down softly. */
const LEAF_EASE = 'cubic-bezier(0.42, 0.02, 0.2, 1)'

/* Paper bends (revision 5). A leaf is two panels hinged at FOLD of its width.
   The outer panel's angle RELATIVE to the inner one, over the turn: it leads
   while the leaf lifts (the page is lifted by its edge), trails as it falls
   (air under the free edge), and flops a little past flat as it lands. Signs
   are for a forward turn; a backward turn mirrors them. */
const FOLD = 0.58
const BEND = [
  { offset: 0, b: 0 },
  { offset: 0.18, b: -24 },
  { offset: 0.4, b: -9 },
  { offset: 0.58, b: 8 },
  { offset: 0.8, b: 12 },
  { offset: 0.93, b: -3 },
  { offset: 1, b: 0 },
]
/* The hesitation: a page lifted by its corner and let fall back. */
const FLUTTER_MS = 1050
const FLUTTER = [
  { offset: 0, a: 0, b: 0 },
  { offset: 0.38, a: -30, b: -18 },
  { offset: 0.62, a: -12, b: 7 },
  { offset: 0.84, a: -1.5, b: 3 },
  { offset: 1, a: 0, b: 0 },
]

/* The paper units on the left animate between stacks, so the property must
   be typed — and given its transition, which does nothing until it is. Both
   are set up here rather than in fieldGuide.css only because the W3C CSS
   validator parses neither @property nor a transition on a custom property. */
if (typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function') {
  try {
    CSS.registerProperty({ name: '--fg-n', syntax: '<number>', inherits: true, initialValue: '0' })
  } catch { /* already registered (hot reload) */ }
  try {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync('.fg-desk { transition: --fg-n var(--fg-n-dur, var(--dur-move)) var(--ease-swing) var(--fg-n-delay, 0ms); }')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  } catch { /* no constructable stylesheets: the stacks change without easing */ }
}

/* Turning pages is not selecting text. Refused where a selection starts,
   which every browser honours (Safari ignores an unprefixed user-select). */
const refuseSelection = (e) => e.preventDefault()

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const ink =(j) => `var(${CHAPTER_INK[j % CHAPTER_INK.length]})`
const inertProps = (hidden) => (hidden ? { inert: '', 'aria-hidden': 'true' } : {})

function useStableSprings(make) {
  const ref = useRef(null)
  if (!ref.current) ref.current = make()
  return ref.current
}

/* One panel of a turning leaf: its two faces each show the part of their
   page that lies on this panel (see .fg-leaf-part in fieldGuide.css). */
function LeafPart({ part, recto, verso, children }) {
  return (
    <div className={`fg-leaf-part fg-leaf-part--${part}`}>
      <div className="fg-leaf-face fg-leaf-recto">
        <div className="fg-leaf-sheet"><RightPage spread={recto} /></div>
        <span className="fg-fold" />
        <span className="fg-shade" />
      </div>
      <div className="fg-leaf-face fg-leaf-verso">
        <div className="fg-leaf-sheet"><LeftPage spread={verso} /></div>
        <span className="fg-fold" />
        <span className="fg-shade" />
      </div>
      {children}
    </div>
  )
}

const FieldGuide = forwardRef(function FieldGuide({ onOpenChange, onShow }, apiRef) {
  const stageRef = useRef(null)
  const deskRef = useRef(null)
  const floatRef = useRef(null)
  const coverRef = useRef(null)
  const rightCastRef = useRef(null)
  const leftCastRef = useRef(null)
  const leavesRef = useRef(null)
  const ambientRef = useAmbient(stageRef)

  const [open, setOpen] = useState(false)
  const [spread, setSpread] = useState(0)
  const [turn, setTurn] = useState(null)

  /* Mirrors of state for the event handlers and spring callbacks, which are
     created once and must not close over stale values. */
  const live = useRef({
    open: false, spread: 0, turn: null, pendingPeek: undefined, queued: null,
    /* Idle life: when the hand last touched the book (or the hero's chapter
       list), whether the book is performing, and what it did last. */
    lastTouch: -Infinity, performing: null, gTimers: [], lastGesture: null,
    lastMajor: null, smallSinceMajor: 1, autoOpened: false,
    fallSpeed: 0, thumpTimer: 0,
  })
  live.current.open = open
  live.current.spread = spread
  live.current.turn = turn

  const reduced = useRef(prefersReducedMotion())

  /* ── Springs ──────────────────────────────────────────────────────────── */
  const springs = useStableSprings(() => ({
    hinge: createSpring({
      value: 0, min: 0, max: 180, restitution: 0.3, precision: 0.05, restSpeed: 8, ...LIFT,
      onUpdate: (a, v) => {
        const desk = deskRef.current
        if (!desk) return
        desk.style.setProperty('--fg-angle', a.toFixed(2))
        /* Weight (revision 5): a cover that hits the desk at speed presses
           the book into it for a moment. */
        const fell = live.current.fallSpeed
        live.current.fallSpeed = v
        if (a < 0.5 && fell < -140 && v >= 0) {
          const stage = stageRef.current
          stage?.style.setProperty('--fg-thump', Math.min(1, -fell / 700).toFixed(2))
          stage?.classList.add('is-landing')
          window.clearTimeout(live.current.thumpTimer)
          live.current.thumpTimer = window.setTimeout(() => stage?.classList.remove('is-landing'), DUR.move)
        }
        /* A different chapter was asked for while the block was lifted: let
           it fall first, change what is under it once it is down, lift again.
           Pages never swap while you can see between them. */
        const want = live.current.pendingPeek
        if (want !== undefined && a < 1.5 && !live.current.open) {
          live.current.pendingPeek = undefined
          if (want == null) return
          const s = want === 'cover' ? 0 : want + 1
          live.current.spread = s
          setSpread(s)
          springs.hinge.set(want === 'cover' ? HOVER_ANGLE : PEEK_ANGLE, LIFT)
        }
      },
      onRest: (a) => {
        if (a === 0 && !live.current.open && live.current.pendingPeek === undefined && !stageRef.current?.matches(':hover')) {
          if (live.current.spread !== 0) setSpread(0)
        }
      },
    }),
    tx: createSpring({ stiffness: 140, damping: 20, onUpdate: (v) => floatRef.current?.style.setProperty('--tx', v.toFixed(3)) }),
    ty: createSpring({ stiffness: 140, damping: 20, onUpdate: (v) => floatRef.current?.style.setProperty('--ty', v.toFixed(3)) }),
    needle: createSpring({ ...NEEDLE, precision: 0.05, onUpdate: (v) => coverRef.current?.style.setProperty('--needle', `${v.toFixed(2)}deg`) }),
  }))

  useEffect(() => () => Object.values(springs).forEach((s) => s.stop()), [springs])

  const moveHinge = useCallback((angle, feel) => {
    if (reduced.current) springs.hinge.jump(angle)
    else springs.hinge.set(angle, feel)
  }, [springs])

  /* ── State changes ────────────────────────────────────────────────────── */

  const openAt = useCallback((target) => {
    live.current.pendingPeek = undefined
    live.current.open = true
    live.current.spread = target
    setSpread(target)
    setOpen(true)
    moveHinge(180, HEFT)
    onOpenChange?.(true)
  }, [moveHinge, onOpenChange])

  const close = useCallback(() => {
    /* Asked to close mid-turn: finish laying the leaves down first. */
    if (live.current.turn) { live.current.queued = 'close'; return }
    live.current.open = false
    setOpen(false)
    moveHinge(0, HEFT)
    onOpenChange?.(false)
  }, [moveHinge, onOpenChange])

  const turnTo = useCallback((target) => {
    const t = clamp(target, 0, SPREADS - 1)
    const { open: isOpen, spread: at, turn: busy } = live.current
    if (!isOpen) { openAt(t); return }
    if (busy) { live.current.queued = t; return }
    if (t === at) return
    if (reduced.current) { live.current.spread = t; setSpread(t); return }
    const next = { id: Date.now(), from: at, to: t }
    live.current.turn = next
    setTurn(next)
  }, [openAt])

  /* Lift a block off the closed book: a chapter (j), the cover alone
     ('cover'), or nothing (null). If a different block is already up, it is
     let down first and the new one lifted once it lands. */
  const peek = useCallback((j) => {
    const { open: isOpen } = live.current
    if (isOpen) {
      stageRef.current?.querySelectorAll('.fg-tab').forEach((tab) => {
        tab.classList.toggle('is-called', typeof j === 'number' && Number(tab.dataset.tab) === j)
      })
      return
    }
    if (j == null) {
      live.current.pendingPeek = undefined
      moveHinge(0, LIFT)
      return
    }
    const target = j === 'cover' ? 0 : j + 1
    const angle = j === 'cover' ? HOVER_ANGLE : PEEK_ANGLE
    if (live.current.spread === target) {
      live.current.pendingPeek = undefined
      moveHinge(angle, LIFT)
    } else if (springs.hinge.value < 1.5 || reduced.current) {
      live.current.pendingPeek = undefined
      live.current.spread = target
      setSpread(target)
      moveHinge(angle, LIFT)
    } else {
      live.current.pendingPeek = j
      moveHinge(0, LIFT)
    }
  }, [moveHinge, springs])

  /* ── The hand takes over ─────────────────────────────────────────────────
     Any touch — on the book, its controls, or the hero's chapter list —
     stops whatever the book is performing, and leaves it exactly as it is:
     a book the tour opened stays open for the learner to read. */

  const stopPerforming = useCallback(() => {
    const L = live.current
    L.gTimers.forEach(clearTimeout)
    L.gTimers = []
    L.performing = null
    const stage = stageRef.current
    stage?.classList.remove('is-riffling')
    stage?.querySelectorAll('.fg-tab.is-idle-called').forEach((t) => t.classList.remove('is-called', 'is-idle-called'))
    /* A needle left mid-swing on its loose spring gets its own feel back. */
    springs.needle.set(springs.needle.target, NEEDLE)
    onShow?.(null)
  }, [springs, onShow])

  const takeOver = useCallback(() => {
    const L = live.current
    L.lastTouch = performance.now()
    /* The Stage stops the performance too (it is watching the same hand);
       this covers the hero's chapter list, which lives outside the stage. */
    yieldTo(stageRef.current)
    if (L.performing) {
      stopPerforming()
      L.autoOpened = false
    }
  }, [stopPerforming])

  useImperativeHandle(apiRef, () => ({
    peek: (j) => { takeOver(); peek(j) },
    go: (j) => { takeOver(); turnTo(j + 1) },
  }), [peek, turnTo, takeOver])

  /* ── Repertoire (MOTION_RULES.md → The field guide → Repertoire) ─────────
     The book no longer keeps its own clock: its gestures are Stage
     performers, so they take their turn with everything else on the page
     and never land on top of another performance. Each run returns how long
     the gesture takes to settle. */

  /* A page hesitating: lifted by its corner, let fall back. */
  const flutter = useCallback(() => {
    const L = live.current
    if (!L.open || L.turn || L.spread >= SPREADS - 1 || reduced.current) return
    const next = { id: Date.now(), from: L.spread, to: L.spread + 1, flutter: true }
    L.turn = next
    setTurn(next)
  }, [])

  const handled = useCallback(() => {
    const L = live.current
    const stage = stageRef.current
    if (!stage) return true
    if (performance.now() - L.lastTouch < HANDS_OFF_MS) return true
    /* Open, turning, moving, or a block held up by the hand (a chapter in the
       hero list hovered for a long time): not the book's turn. */
    if (L.open || L.turn || springs.hinge.moving) return true
    if (springs.hinge.target !== 0 || L.pendingPeek !== undefined) return true
    /* Held under the pointer, or in keyboard focus. (A mouse click also
       focuses the stage; that alone is not "being handled".) */
    const focus = document.activeElement
    return stage.classList.contains('is-held') || (stage.contains(focus) && focus.matches(':focus-visible'))
  }, [springs])

  /* Nobody can see it — scrolled away, or the tab went to the background,
     where timers keep running but frames do not: stop performing. A book a
     showcase opened closes at once rather than closing for nobody. */
  const abandon = useCallback(() => {
    const L = live.current
    if (!L.performing) return
    const wasShowcase = L.autoOpened
    stopPerforming()
    L.autoOpened = false
    if (!wasShowcase) {
      /* A small gesture: put the block down and, if a peek swapped the page
         under the cover, put the contents back (a jump skips the spring's
         onRest, which would otherwise do it). */
      L.pendingPeek = undefined
      springs.hinge.jump(0)
      if (L.spread !== 0) { L.spread = 0; setSpread(0) }
      return
    }
    if (L.turn) { L.queued = 'close'; return }
    if (L.open) {
      L.open = false
      setOpen(false)
      onOpenChange?.(false)
      springs.hinge.jump(0)
      L.spread = 0
      setSpread(0)
    }
  }, [springs, stopPerforming, onOpenChange])

  const gestures = useMemo(() => {
    const L = live.current
    const after = (ms, fn) => { L.gTimers.push(window.setTimeout(fn, ms)) }
    const settle = (ms) => { after(ms, () => { L.performing = null }); return ms }
    const stage = () => stageRef.current
    const callTab = (j, on) => {
      const s = stage()
      if (!s) return
      if (on) s.querySelector(`.fg-tabs--right .fg-tab[data-tab="${j}"]`)?.classList.add('is-called', 'is-idle-called')
      else s.querySelectorAll('.fg-tab.is-idle-called').forEach((t) => t.classList.remove('is-called', 'is-idle-called'))
    }

    return {
      /* ── Accents ── */

      /* A breath of air lifts the cover; it taps back down. */
      lift() {
        moveHinge(rand(9, 14), AIR)
        after(rand(520, 760), () => moveHinge(0, DROP))
        return settle(1300)
      },
      /* A thumb runs down the fore-edge: the tabs lean out in turn while the
         cover gives a little. */
      riffle() {
        stage()?.classList.add('is-riffling')
        moveHinge(4, AIR)
        after(620, () => moveHinge(0, DROP))
        after(CHAPTERS.length * 90 + DUR.reveal + 80, () => stage()?.classList.remove('is-riffling'))
        return settle(1300)
      },
      /* The needle swings wide on a loose spring and finds north again. */
      north() {
        const away = springs.needle.target + (Math.random() < 0.5 ? -1 : 1) * rand(120, 220)
        springs.needle.set(away, NEEDLE_LOOSE)
        after(rand(620, 820), () => springs.needle.set(Math.round(away / 360) * 360 + rand(-5, 5), NEEDLE))
        return settle(1700)
      },

      /* ── Minors ── */

      /* A chapter's pages lift and its thumb tab leans out; the hero's
         chapter list is the same instrument, so its row answers. */
      peek() {
        const j = Math.floor(Math.random() * CHAPTERS.length)
        peek(j)
        onShow?.(j)
        after(DUR.move, () => callTab(j, true))
        after(rand(1100, 1400), () => {
          callTab(j, false)
          L.pendingPeek = undefined
          moveHinge(0, DROP)
          onShow?.(null)
        })
        return settle(2100)
      },
      /* The cover swings open far enough to show the contents beneath it,
         hangs there on a breath, and falls shut with a slap. */
      ajar() {
        moveHinge(rand(48, 62), AIR_SLOW)
        after(rand(1150, 1350), () => moveHinge(0, HEFT))
        return settle(2400)
      },

      /* ── Majors: showcases ── */

      /* Opens at the contents; the right page hesitates; one chapter turns;
         holds; the chapter block closes, heavily. */
      oneTurn() {
        L.autoOpened = true
        openAt(0)
        let t = 1350
        after(t, flutter)
        t += FLUTTER_MS + 250
        const k = Math.random() < 0.5 ? 1 : 2
        after(t, () => { turnTo(k); onShow?.(k - 1) })
        t += 2100
        after(t, () => { L.autoOpened = false; close(); onShow?.(null) })
        return settle(t + 900)
      },
      /* Opens; turns a chapter; turns another; riffles back to the contents;
         closes. */
      twoTurns() {
        L.autoOpened = true
        openAt(0)
        let t = 1250
        after(t, () => { turnTo(1); onShow?.(0) })
        t += 1850
        after(t, () => { turnTo(2); onShow?.(1) })
        t += 1850
        after(t, () => { turnTo(0); onShow?.(null) })
        t += LEAF_MS + LEAF_STAGGER + 450
        after(t, () => { L.autoOpened = false; close() })
        return settle(t + 900)
      },
      /* Opens; three leaves riffle forward to a later chapter; holds on it;
         riffles back to the front; closes. */
      skim() {
        L.autoOpened = true
        openAt(0)
        let t = 1250
        after(t, () => { turnTo(3); onShow?.(2) })
        t += 2300
        after(t, () => { turnTo(0); onShow?.(null) })
        t += LEAF_MS + 2 * LEAF_STAGGER + 450
        after(t, () => { L.autoOpened = false; close() })
        return settle(t + 900)
      },
      /* A chapter's block lifts and the book opens straight at it, as if by
         its thumb tab; it turns one more; closes. */
      atChapter() {
        L.autoOpened = true
        const j = 1 + Math.floor(Math.random() * 3)
        peek(j)
        onShow?.(j)
        after(DUR.move, () => callTab(j, true))
        let t = 850
        after(t, () => { callTab(j, false); openAt(j + 1) })
        t += 1900
        after(t, () => { turnTo(Math.min(SPREADS - 1, j + 2)); onShow?.(Math.min(CHAPTERS.length - 1, j + 1)) })
        t += 2000
        after(t, () => { L.autoOpened = false; close(); onShow?.(null) })
        return settle(t + 900)
      },

      /* THE BOOK READS ITSELF (revision 6). The loudest thing the loudest
         object on the page can do: it opens at the contents and riffles its
         way to the last chapter in two cascades — every leaf in the block
         turning 80ms after the one above it — holds on the end long enough
         to see where it got to, then riffles the whole block back to the
         front in one sweep and shuts.

         The cascade is the gesture: turnTo() renders one leaf per spread
         crossed, so a jump of five spreads IS five pages flipping. */
      flipThrough() {
        L.autoOpened = true
        const leafRun = (n) => LEAF_MS + Math.max(0, n - 1) * LEAF_STAGGER
        const mid = Math.min(3, SPREADS - 1)
        const end = SPREADS - 1

        openAt(0)
        let t = 820
        /* Forward, in two breaths, so it reads as reading rather than as one
           mechanical sweep. */
        after(t, () => { turnTo(mid); onShow?.(mid - 1) })
        t += leafRun(mid) + 620
        after(t, () => { turnTo(end); onShow?.(CHAPTERS.length - 1) })
        t += leafRun(end - mid) + 1150
        /* …and all the way home in one. */
        after(t, () => { turnTo(0); onShow?.(null) })
        t += leafRun(end) + 420
        after(t, () => { L.autoOpened = false; close() })
        return settle(t + 900)
      },
    }
  }, [springs, moveHinge, peek, openAt, turnTo, close, flutter, onShow])

  const shareInView = () => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r?.height) return 0
    return (Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) / r.height
  }

  /* Run one gesture as a performance: the hand stops it where it is; leaving
     the screen puts the book back. */
  const performGesture = (ctx, options) => {
    const L = live.current
    const choice = pick(options, L.lastGesture)
    if (!choice) return 0
    L.lastGesture = choice.id
    L.performing = choice.id
    ctx.onStop((reason) => {
      if (reason === 'hand') { stopPerforming(); L.autoOpened = false } else abandon()
    })
    return gestures[choice.id]()
  }

  usePerformer(stageRef, {
    id: 'book:accent',
    region: 'hero:book',
    tier: 'accent',
    share: 0.5,
    get weight() { return showy() ? 1.7 : 1 },
    busy: handled,
    run: (ctx) => {
      live.current.smallSinceMajor += 1
      return performGesture(ctx, [{ id: 'lift', weight: 3 }, { id: 'riffle', weight: 2 }, { id: 'north', weight: 2 }])
    },
  })

  usePerformer(stageRef, {
    id: 'book:minor',
    region: 'hero:book',
    tier: 'minor',
    share: 0.5,
    get weight() { return showy() ? 2.2 : 1 },
    busy: handled,
    run: (ctx) => {
      live.current.smallSinceMajor += 1
      return performGesture(ctx, [{ id: 'peek', weight: 3 }, { id: 'ajar', weight: 2 }])
    },
  })

  /* In the shop window the book is the exhibit, so it shows its whole self
     often: one small gesture between showcases instead of two, a shorter
     cooldown, and flip-through weighted above every other showcase.
     (MOTION_RULES.md revision 6 → The field guide reads itself.) */
  const showy = () => stageMode() === 'continuous'

  usePerformer(stageRef, {
    id: 'book:showcase',
    region: 'hero:book',
    tier: 'major',
    get cooldown() { return showy() ? 5200 : 16000 },
    share: 0.7,
    get weight() { return showy() ? 2.6 : 1.6 },
    busy: handled,
    when: () => live.current.smallSinceMajor >= (showy() ? 1 : 2) && shareInView() > 0.7,
    run: (ctx) => {
      const L = live.current
      L.smallSinceMajor = 0
      const weightOf = (id) => (id === 'flipThrough' ? (showy() ? 5 : 1.2) : 1)
      const options = ['flipThrough', 'oneTurn', 'twoTurns', 'skim', 'atChapter']
        .filter((id) => id !== L.lastMajor)
        .map((id) => ({ id, weight: weightOf(id) }))
      const choice = pick(options, null)
      L.lastMajor = choice?.id ?? null
      return performGesture(ctx, choice ? [choice] : options)
    },
  })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced.current) return undefined
    const offVisibility = onVisibility(stage, (on) => { if (!on) abandon() })
    const onHidden = () => { if (document.hidden) abandon() }
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      offVisibility()
      document.removeEventListener('visibilitychange', onHidden)
      stopPerforming()
    }
  }, [abandon, stopPerforming])

  /* ── Leaves ───────────────────────────────────────────────────────────── */

  useLayoutEffect(() => {
    if (!turn) return undefined
    const { from, to, flutter: hesitating } = turn
    const forward = to > from
    const count = Math.abs(to - from)
    const nodes = [...(leavesRef.current?.querySelectorAll('.fg-leaf') || [])]
    const duration = hesitating ? FLUTTER_MS : LEAF_MS
    const total = duration + (count - 1) * LEAF_STAGGER
    const desk = deskRef.current
    if (!hesitating) {
      desk?.style.setProperty('--fg-n-delay', `${(count - 1) * LEAF_STAGGER}ms`)
      desk?.style.setProperty('--fg-n-dur', `${LEAF_MS}ms`)
    }

    const rightTop = (s) => 2 + PAGE_UNITS - leftUnits(s)
    const leftTop = (s) => 2 + leftUnits(s)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      /* The stacks' re-balancing timing belongs to this turn only. */
      desk?.style.removeProperty('--fg-n-delay')
      desk?.style.removeProperty('--fg-n-dur')
      const landed = hesitating ? from : to
      live.current.spread = landed
      live.current.turn = null
      setSpread(landed)
      setTurn(null)
    }

    const sign = forward ? 1 : -1
    const anims = nodes.map((node, i) => {
      const outer = node.querySelector('.fg-leaf-part--outer')
      const folds = node.querySelectorAll('.fg-fold')
      const timing = { duration, delay: i * LEAF_STAGGER, easing: hesitating ? 'cubic-bezier(0.37, 0, 0.3, 1)' : LEAF_EASE, fill: 'both' }

      if (hesitating) {
        const z = rightTop(from) + 0.6
        const main = node.animate(
          FLUTTER.map((k) => ({ offset: k.offset, transform: `translateZ(${z + Math.abs(k.a) * 0.08}px) rotateY(${k.a}deg)` })),
          timing,
        )
        outer?.animate(FLUTTER.map((k) => ({ offset: k.offset, transform: `rotateY(${k.b}deg)` })), timing)
        folds.forEach((f) => f.animate(FLUTTER.map((k) => ({ offset: k.offset, opacity: Math.min(1, Math.abs(k.b) / 18) })), timing))
        return main
      }

      const z0 = (forward ? rightTop(from) : leftTop(from)) + 0.6 + (count - 1 - i) * 0.5
      const z1 = (forward ? leftTop(to) : rightTop(to)) + 0.6 + i * 0.5
      const a0 = forward ? 0 : -180
      const a1 = forward ? -180 : 0
      const main = node.animate(
        [
          { transform: `translateZ(${z0}px) rotateY(${a0}deg)` },
          /* Lifted clear of both stacks at the top of its arc. */
          { transform: `translateZ(${Math.max(z0, z1) + 3}px) rotateY(-90deg)`, offset: 0.5 },
          { transform: `translateZ(${z1}px) rotateY(${a1}deg)` },
        ],
        timing,
      )
      /* The paper bends: the outer panel leads, trails, and flops flat. */
      outer?.animate(BEND.map((k) => ({ offset: k.offset, transform: `rotateY(${k.b * sign}deg)` })), timing)
      folds.forEach((f) => f.animate(BEND.map((k) => ({ offset: k.offset, opacity: Math.min(1, Math.abs(k.b) / 20) })), timing))

      /* Light: a face darkens as it turns away from the light and brightens
         as it lands face-up. Keyed to the same progress as the rotation. */
      node.querySelectorAll(forward ? '.fg-leaf-recto .fg-shade' : '.fg-leaf-verso .fg-shade')
        .forEach((s) => s.animate([{ opacity: 0 }, { opacity: 0.34, offset: 0.5 }, { opacity: 0.34 }], timing))
      node.querySelectorAll(forward ? '.fg-leaf-verso .fg-shade' : '.fg-leaf-recto .fg-shade')
        .forEach((s) => s.animate([{ opacity: 0.3 }, { opacity: 0.3, offset: 0.5 }, { opacity: 0 }], timing))
      return main
    })

    /* The page being uncovered takes a cast shadow as the leaves lift off
       it; the page being covered takes one as they come down. A hesitating
       page only shades what it lifts from. */
    const under = forward ? rightCastRef.current : leftCastRef.current
    const over = forward ? leftCastRef.current : rightCastRef.current
    if (hesitating) {
      under?.animate([{ opacity: 0 }, { opacity: 0.2, offset: 0.38 }, { opacity: 0 }], { duration: total, easing: 'ease-in-out' })
    } else {
      under?.animate([{ opacity: 0 }, { opacity: 0.26, offset: 0.3 }, { opacity: 0.18, offset: 0.7 }, { opacity: 0 }], { duration: total, easing: 'linear' })
      over?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.22, offset: 0.8 }, { opacity: 0 }], { duration: total, easing: 'linear' })
    }

    const last = anims[anims.length - 1]
    if (last) last.onfinish = finish
    /* A hidden tab renders no frames: the turn must still complete. */
    const fallback = window.setTimeout(finish, total + 250)
    return () => { clearTimeout(fallback) }
  }, [turn])

  /* Run a turn that was asked for while another was in the air. */
  useEffect(() => {
    if (turn) return
    const q = live.current.queued
    if (q == null) return
    live.current.queued = null
    if (q === 'close') close()
    else turnTo(q)
  }, [turn, turnTo, close])

  /* ── Pointer: pose, needle, tabs, sheen ───────────────────────────────── */

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced.current) return undefined
    const hero = stage.closest('.hero')
    let raf = 0
    let px = 0
    let py = 0
    let inStage = false

    const frame = () => {
      raf = 0
      if (!isOnScreen(stage)) return
      const sr = stage.getBoundingClientRect()
      inStage = px >= sr.left && px <= sr.right && py >= sr.top && py <= sr.bottom

      /* Pose: ±1 across the stage, weighted by a spring. Anywhere else in
         the hero the book turns about a third of the way toward the pointer
         — it noticed you before you reached it. */
      const hr = hero?.getBoundingClientRect()
      if (inStage) {
        springs.tx.set(clamp(((px - sr.left) / sr.width) * 2 - 1, -1, 1))
        springs.ty.set(clamp(((py - sr.top) / sr.height) * 2 - 1, -1, 1))
      } else if (hr && px >= hr.left && px <= hr.right && py >= hr.top && py <= hr.bottom) {
        springs.tx.set(clamp((px - (sr.left + sr.width / 2)) / (hr.width / 2), -1, 1) * 0.32)
        springs.ty.set(clamp((py - (sr.top + sr.height / 2)) / (hr.height / 2), -1, 1) * 0.32)
      } else {
        springs.tx.set(0)
        springs.ty.set(0)
      }

      /* Needle: toward the pointer, the short way round. */
      if (!live.current.open) {
        const c = coverRef.current?.querySelector('.fg-compass')?.getBoundingClientRect()
        if (c && c.width) {
          const dx = px - (c.left + c.width / 2)
          const dy = py - (c.top + c.height / 2)
          if (Math.hypot(dx, dy) > 24) {
            const want = (Math.atan2(dx, -dy) * 180) / Math.PI
            const cur = springs.needle.target
            const delta = ((((want - cur) % 360) + 540) % 360) - 180
            springs.needle.set(cur + delta)
          }
        }
        /* Sheen: where the light from the hand lands on the cloth. */
        const cr = coverRef.current?.getBoundingClientRect()
        if (cr && cr.width) {
          coverRef.current.style.setProperty('--mx', `${(((px - cr.left) / cr.width) * 100).toFixed(1)}%`)
          coverRef.current.style.setProperty('--my', `${(((py - cr.top) / cr.height) * 100).toFixed(1)}%`)
        }
      }

      /* Thumb tabs lean out by how close the pointer is — neighbours follow
         because they are simply a little further away. */
      stage.querySelectorAll('.fg-tabs--right .fg-tab').forEach((tab) => {
        const r = tab.getBoundingClientRect()
        const near = inStage && px > r.left - 200 && px < r.right + 60
        const d = Math.abs(py - (r.top + r.height / 2))
        const lean = near ? clamp(1 - d / 90, 0, 1).toFixed(2) : '0'
        if (tab.dataset.lean !== lean) {
          tab.dataset.lean = lean
          tab.style.setProperty('--lean', lean)
        }
      })
    }

    const fine = hasFinePointer()
    let lastMove = 0
    const onMove = (e) => {
      if (e.pointerType !== 'mouse' || !fine) return
      px = e.clientX
      py = e.clientY
      lastMove = Date.now()
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const onLeave = () => {
      px = -9999
      py = -9999
      if (!raf) raf = requestAnimationFrame(frame)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    /* Idle: a needle left alone does not sit dead still. It drifts to a new
       bearing at irregular intervals — never a loop you could learn. */
    let wander = 0
    const drift = () => {
      wander = window.setTimeout(drift, 2600 + Math.random() * 2400)
      if (Date.now() - lastMove < 2500 || live.current.open || !isOnScreen(stage)) return
      springs.needle.set(Math.round(springs.needle.target / 360) * 360 + (Math.random() * 14 - 7))
    }
    wander = window.setTimeout(drift, 2600)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      clearTimeout(wander)
    }
  }, [springs])

  /* ── Scroll: the book drifts up slower than the page as the hero leaves ── */
  const scrollRef = useScrollProgress({
    cssVar: null,
    onProgress: (p, r) => {
      const leave = clamp((96 - r.top) / (r.height * 1.2), 0, 1)
      stageRef.current?.style.setProperty('--leave', leave.toFixed(3))
    },
  })
  const setStage = useCallback((node) => {
    ambientRef(node)
    scrollRef(node)
    node?.addEventListener('selectstart', refuseSelection)
  }, [ambientRef, scrollRef])

  /* ── Handling the object ──────────────────────────────────────────────── */

  const onBookEnter = () => {
    takeOver()
    stageRef.current?.classList.add('is-held')
    /* Unless a chapter is already lifted (from the hero list), the hand on
       the book lifts the cover. */
    if (!live.current.open && springs.hinge.target < PEEK_ANGLE && live.current.pendingPeek === undefined) peek('cover')
  }
  const onBookLeave = () => {
    stageRef.current?.classList.remove('is-held', 'is-pressed')
    if (live.current.open) return
    live.current.pendingPeek = undefined
    moveHinge(0, LIFT)
  }

  const swipe = useRef(null)
  const onPointerDown = (e) => {
    takeOver()
    stageRef.current?.classList.add('is-pressed')
    swipe.current = { x: e.clientX, y: e.clientY, type: e.pointerType, used: false }
  }
  const onPointerUp = (e) => {
    stageRef.current?.classList.remove('is-pressed')
    const s = swipe.current
    if (!s || s.type === 'mouse') return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      s.used = true
      if (!live.current.open) { if (dx < 0) openAt(0); return }
      if (dx < 0) turnTo(live.current.spread + 1)
      else if (live.current.spread === 0) close()
      else turnTo(live.current.spread - 1)
    }
  }
  const swallowSwipe = () => {
    if (swipe.current?.used) { swipe.current = null; return true }
    return false
  }

  const onCoverClick = () => {
    if (swallowSwipe()) return
    if (!live.current.open) openAt(live.current.spread)
  }
  const onRightPageClick = () => {
    if (swallowSwipe() || !live.current.open) return
    turnTo(live.current.spread + 1)
  }
  const onLeftPageClick = () => {
    if (swallowSwipe() || !live.current.open) return
    if (live.current.spread === 0) close()
    else turnTo(live.current.spread - 1)
  }

  const onKeyDown = (e) => {
    takeOver()
    const { open: isOpen, spread: at } = live.current
    if (e.target !== e.currentTarget && (e.key === 'Enter' || e.key === ' ')) return
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen) close()
        else openAt(0)
        break
      case 'ArrowRight':
        e.preventDefault()
        turnTo(isOpen ? at + 1 : 0)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (!isOpen) break
        if (at === 0) close()
        else turnTo(at - 1)
        break
      case 'Home':
        if (isOpen) { e.preventDefault(); turnTo(0) }
        break
      case 'Escape':
        if (isOpen) { e.preventDefault(); close() }
        break
      default:
    }
  }

  /* ── What is where ────────────────────────────────────────────────────── */

  const forward = turn ? turn.to > turn.from : false
  const rightSpread = turn ? (forward ? turn.to : turn.from) : spread
  const leftSpread = turn ? (forward ? turn.from : turn.to) : spread
  /* A hesitating page moves no paper from one stack to the other. */
  const n = leftUnits(turn && !turn.flutter ? turn.to : spread)

  const leaves = []
  if (turn) {
    const count = Math.abs(turn.to - turn.from)
    for (let i = 0; i < count; i++) {
      leaves.push(forward
        ? { i, recto: turn.from + i, verso: turn.from + i + 1, tab: turn.from + i - 1 }
        : { i, verso: turn.from - i, recto: turn.from - i - 1, tab: turn.from - i - 2 })
    }
  }
  const carried = new Set(leaves.map((l) => l.tab).filter((j) => j >= 0))
  const rightTabs = CHAPTERS.map((_, j) => j).filter((j) => j >= rightSpread - 1 && !carried.has(j))
  const hingeTabs = CHAPTERS.map((_, j) => j).filter((j) => j < leftSpread - 1 && !carried.has(j))

  const tab = (j, where) => (
    <button
      type="button"
      key={`${where}-${j}`}
      className="fg-tab"
      data-tab={j}
      style={{
        '--chapter': ink(j),
        '--j': j,
        '--tab-z': where === 'right' ? `${2 + PAGE_UNITS - tabDepth(j)}px` : where === 'hinge' ? `${4 - tabDepth(j) + 1}px` : '0px',
      }}
      tabIndex={open && where === 'right' ? 0 : -1}
      aria-label={`Chapter ${j + 1}: ${CHAPTERS[j].title}`}
      onClick={(e) => { e.stopPropagation(); turnTo(j + 1) }}
      onPointerEnter={() => { if (!live.current.open && where === 'right') peek(j) }}
      onPointerLeave={() => { if (!live.current.open && where === 'right') peek('cover') }}
    >
      <TabFaces j={j} />
    </button>
  )

  return (
    <div
      ref={setStage}
      className={`fg-stage${open ? ' is-open' : ''}${turn ? ' is-turning' : ''}`}
      data-last={open && spread >= SPREADS - 1 ? '' : undefined}
      role="group"
      aria-roledescription="book"
      aria-label="The LunX field guide. Enter opens it; left and right arrows turn chapters; Escape closes it."
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <span className="pg-sr-only" aria-live="polite">{open ? spreadLabel(spread) : 'The field guide is closed.'}</span>

      <div className="fg-lean">
        <div
          ref={deskRef}
          className="fg-desk"
          style={{ '--fg-n': n }}
        >
          <div className="fg-shadow" aria-hidden="true" />

          <div className="fg-arrive">
            <div
              ref={floatRef}
              className="fg-float"
              onPointerEnter={onBookEnter}
              onPointerLeave={onBookLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => stageRef.current?.classList.remove('is-pressed')}
            >
              <div className="fg-book">
                {/* Back board and the pages lying on the right. */}
                <div className="fg-board fg-board--back" aria-hidden="true" />
                <div className="fg-stack">
                  <span className="fg-edge fg-edge--bottom" aria-hidden="true" />
                  <span className="fg-edge fg-edge--fore" aria-hidden="true" />
                  <div className="fg-page fg-page--right" onClick={onRightPageClick} {...inertProps(!open)}>
                    <RightPage spread={rightSpread} onGo={turnTo} />
                    <span ref={rightCastRef} className="fg-cast fg-cast--right" aria-hidden="true" />
                    <span className="fg-curl" aria-hidden="true" />
                  </div>
                  <span className="fg-ribbon" aria-hidden="true" />
                </div>

                <div className="fg-tabs fg-tabs--right" aria-hidden={!open}>
                  {rightTabs.map((j) => tab(j, 'right'))}
                </div>

                {/* The hinge: the cover and every sheet before the open
                    chapter, turning about the spine as one block. */}
                <div className="fg-hinge">
                  <div ref={coverRef} className="fg-cover" onClick={onCoverClick} {...inertProps(open)}>
                    <Cover />
                    <span className="fg-glare" aria-hidden="true" />
                    <span className="fg-sheen" aria-hidden="true" />
                    <span className="fg-shade fg-shade--cover" aria-hidden="true" />
                  </div>
                  <span className="fg-edge fg-edge--hinge" aria-hidden="true" />
                  <div className="fg-board fg-board--inside" aria-hidden="true" />
                  <div className="fg-page fg-page--left" onClick={onLeftPageClick} {...inertProps(!open)}>
                    <LeftPage spread={leftSpread} />
                    <span ref={leftCastRef} className="fg-cast fg-cast--left" aria-hidden="true" />
                    <span className="fg-shade fg-shade--left" aria-hidden="true" />
                  </div>
                  <div className="fg-tabs fg-tabs--hinge" aria-hidden="true">
                    {hingeTabs.map((j) => tab(j, 'hinge'))}
                  </div>
                </div>

                <div ref={leavesRef} className="fg-leaves" {...inertProps(true)}>
                  {leaves.map((l) => (
                    <div className="fg-leaf" key={`${turn.id}-${l.i}`}>
                      {/* Two panels, so the paper can bend as it turns. */}
                      <LeafPart part="inner" recto={l.recto} verso={l.verso} />
                      <LeafPart part="outer" recto={l.recto} verso={l.verso}>
                        {l.tab >= 0 && (
                          <span className="fg-tab fg-tab--carried" style={{ '--chapter': ink(l.tab), '--j': l.tab }}>
                            <TabFaces j={l.tab} />
                          </span>
                        )}
                      </LeafPart>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fg-controls" onPointerDown={takeOver}>
        {open ? (
          <>
            <button type="button" className="fg-ctl" onClick={() => (spread === 0 ? close() : turnTo(spread - 1))} aria-label={spread === 0 ? 'Close the book' : 'Previous chapter'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button type="button" className="fg-ctl fg-ctl--text" onClick={close}>Close book</button>
            <button type="button" className="fg-ctl" onClick={() => turnTo(spread + 1)} disabled={spread >= SPREADS - 1} aria-label="Next chapter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </>
        ) : (
          <p className="fg-hint">
            <span className="fg-hint--pointer">
              Click the cover to open <span className="fg-hint-sep" aria-hidden="true">·</span> <kbd>←</kbd><kbd>→</kbd> turn chapters
            </span>
            <span className="fg-hint--touch">Tap the cover to open · swipe to turn</span>
          </p>
        )}
      </div>
    </div>
  )
})

/* Memoised: the hero re-renders on every curriculum hover, and the book has
   nothing to learn from that — hovers reach it through the imperative API. */
export default memo(FieldGuide)
