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

   Ambient: the book breathes and its ribbon sways (CSS), paused offscreen,
   and paused while the book is in the hand.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState,
} from 'react'
import { CHAPTERS, CHAPTER_INK, PAGE_UNITS, SPREADS, leftUnits, tabDepth, spreadLabel } from './guideData'
import { Cover, LeftPage, RightPage, TabFaces } from './GuidePages'
import { createSpring } from '../../motion/spring'
import { hasFinePointer, prefersReducedMotion } from '../../motion/env'
import useAmbient, { isOnScreen } from '../../motion/ambient'
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

const LEAF_MS = Math.round(DUR.turn * 0.85)
const LEAF_STAGGER = 80
/* A page turned by a finger: it resists for a moment as it lifts, travels
   quickly through vertical, and lays itself down softly. */
const LEAF_EASE = 'cubic-bezier(0.42, 0.02, 0.2, 1)'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const ink = (j) => `var(${CHAPTER_INK[j % CHAPTER_INK.length]})`
const inertProps = (hidden) => (hidden ? { inert: '', 'aria-hidden': 'true' } : {})

function useStableSprings(make) {
  const ref = useRef(null)
  if (!ref.current) ref.current = make()
  return ref.current
}

const FieldGuide = forwardRef(function FieldGuide({ onOpenChange }, apiRef) {
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
  const live = useRef({ open: false, spread: 0, turn: null, pendingPeek: undefined, queued: null })
  live.current.open = open
  live.current.spread = spread
  live.current.turn = turn

  const reduced = useRef(prefersReducedMotion())

  /* ── Springs ──────────────────────────────────────────────────────────── */
  const springs = useStableSprings(() => ({
    hinge: createSpring({
      value: 0, min: 0, max: 180, restitution: 0.3, precision: 0.05, restSpeed: 8, ...LIFT,
      onUpdate: (a) => {
        const desk = deskRef.current
        if (!desk) return
        desk.style.setProperty('--fg-angle', a.toFixed(2))
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
    needle: createSpring({ stiffness: 55, damping: 6.5, precision: 0.05, onUpdate: (v) => coverRef.current?.style.setProperty('--needle', `${v.toFixed(2)}deg`) }),
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

  useImperativeHandle(apiRef, () => ({
    peek,
    go: (j) => turnTo(j + 1),
  }), [peek, turnTo])

  /* ── Leaves ───────────────────────────────────────────────────────────── */

  useLayoutEffect(() => {
    if (!turn) return undefined
    const { from, to } = turn
    const forward = to > from
    const count = Math.abs(to - from)
    const nodes = [...(leavesRef.current?.querySelectorAll('.fg-leaf') || [])]
    const total = LEAF_MS + (count - 1) * LEAF_STAGGER
    const desk = deskRef.current
    desk?.style.setProperty('--fg-n-delay', `${(count - 1) * LEAF_STAGGER}ms`)
    desk?.style.setProperty('--fg-n-dur', `${LEAF_MS}ms`)

    const rightTop = (s) => 2 + PAGE_UNITS - leftUnits(s)
    const leftTop = (s) => 2 + leftUnits(s)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      /* The stacks' re-balancing timing belongs to this turn only. */
      desk?.style.removeProperty('--fg-n-delay')
      desk?.style.removeProperty('--fg-n-dur')
      live.current.spread = to
      live.current.turn = null
      setSpread(to)
      setTurn(null)
    }

    const anims = nodes.map((node, i) => {
      const z0 = (forward ? rightTop(from) : leftTop(from)) + 0.6 + (count - 1 - i) * 0.5
      const z1 = (forward ? leftTop(to) : rightTop(to)) + 0.6 + i * 0.5
      const a0 = forward ? 0 : -180
      const a1 = forward ? -180 : 0
      const timing = { duration: LEAF_MS, delay: i * LEAF_STAGGER, easing: LEAF_EASE, fill: 'both' }
      const main = node.animate(
        [
          { transform: `translateZ(${z0}px) rotateY(${a0}deg)` },
          { transform: `translateZ(${z1}px) rotateY(${a1}deg)` },
        ],
        timing,
      )
      /* Light: a face darkens as it turns away from the light and brightens
         as it lands face-up. Keyed to the same progress as the rotation. */
      const leaving = node.querySelector(forward ? '.fg-leaf-recto .fg-shade' : '.fg-leaf-verso .fg-shade')
      const arriving = node.querySelector(forward ? '.fg-leaf-verso .fg-shade' : '.fg-leaf-recto .fg-shade')
      leaving?.animate([{ opacity: 0 }, { opacity: 0.34, offset: 0.5 }, { opacity: 0.34 }], timing)
      arriving?.animate([{ opacity: 0.3 }, { opacity: 0.3, offset: 0.5 }, { opacity: 0 }], timing)
      return main
    })

    /* The page being uncovered takes a cast shadow as the leaves lift off
       it; the page being covered takes one as they come down. */
    const under = forward ? rightCastRef.current : leftCastRef.current
    const over = forward ? leftCastRef.current : rightCastRef.current
    under?.animate([{ opacity: 0 }, { opacity: 0.26, offset: 0.3 }, { opacity: 0.18, offset: 0.7 }, { opacity: 0 }], { duration: total, easing: 'linear' })
    over?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.22, offset: 0.8 }, { opacity: 0 }], { duration: total, easing: 'linear' })

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
    let raf = 0
    let px = 0
    let py = 0
    let inStage = false

    const frame = () => {
      raf = 0
      if (!isOnScreen(stage)) return
      const sr = stage.getBoundingClientRect()
      inStage = px >= sr.left && px <= sr.right && py >= sr.top && py <= sr.bottom

      /* Pose: ±1 across the stage, weighted by a spring. */
      if (inStage) {
        springs.tx.set(clamp(((px - sr.left) / sr.width) * 2 - 1, -1, 1))
        springs.ty.set(clamp(((py - sr.top) / sr.height) * 2 - 1, -1, 1))
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
  const setStage = useCallback((node) => { ambientRef(node); scrollRef(node) }, [ambientRef, scrollRef])

  /* ── Handling the object ──────────────────────────────────────────────── */

  const onBookEnter = () => {
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
  const n = leftUnits(turn ? turn.to : spread)

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
                      <div className="fg-leaf-face fg-leaf-recto">
                        <RightPage spread={l.recto} />
                        <span className="fg-shade" />
                      </div>
                      <div className="fg-leaf-face fg-leaf-verso">
                        <LeftPage spread={l.verso} />
                        <span className="fg-shade" />
                      </div>
                      {l.tab >= 0 && (
                        <span className="fg-tab fg-tab--carried" style={{ '--chapter': ink(l.tab) }}>
                          <TabFaces j={l.tab} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fg-controls">
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
              Open the guide <span className="fg-hint-sep" aria-hidden="true">·</span> <kbd>←</kbd><kbd>→</kbd> turn chapters
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
