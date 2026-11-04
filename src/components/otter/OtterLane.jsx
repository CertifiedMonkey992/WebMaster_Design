/* ═══════════════════════════════════════════════════════════════════════════
   OtterLane.jsx — WHERE THE OTTER LIVES
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → The otter's lanes. A lane is a strip the
   otter roams like a game character at the side of the screen. Its bottom
   edge is the ground it runs along and the edge it hides behind.

     page   the bottom edge of the screen, on the landing page. It runs in
            when the page opens; as each section reaches the middle of the
            screen it runs to that section's side and does that section's
            thing (data-otter="right:read" on the section); scroll hard and
            it ducks out of sight, then peeks back up; bring the pointer
            close and it notices, and sometimes hides.
     card   the top edge of the Your Progress card, in the app. It wanders
            the edge, hides behind the card, and answers real events
            through the ref (OtterCompanion).

   Its own idle turns — a trip to the other side, a dash off one edge and
   back from the other, a game of hide-and-seek, or one of the otter's acts
   — go through the Stage like every other performer.

   Under reduced motion it stands still at its spot and only its face
   answers.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import Otter from './Otter'
import { usePerformer } from '../../motion/stage'
import { hasFinePointer, prefersReducedMotion } from '../../motion/env'
import { onScrollVelocity } from '../../motion/scroll'

const SPEED = { page: 0.62, card: 0.2 }    // px per ms at a run
const MARGIN = { page: 22, card: 4 }
const FAST_SCROLL = 2400                   // px/s that sends it into hiding

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms))

const OtterLane = forwardRef(function OtterLane(
  { variant = 'page', pose = 'hold', mood = 'happy', intensity = 'full', region = 'lane', start = 'right', intro = variant === 'page', stops = variant === 'page', cooldown },
  ref,
) {
  const laneRef = useRef(null)
  const moverRef = useRef(null)
  const liftRef = useRef(null)
  const facingRef = useRef(null)
  const otter = useRef(null)
  const s = useRef({ x: 0, busy: false, hidden: false, move: null, alive: true, last: null, near: false, nearAt: 0, pokedAt: 0 })
  const still = useRef(prefersReducedMotion()).current

  /* ── Geometry ─────────────────────────────────────────────────────── */
  const size = () => moverRef.current?.offsetWidth || 80
  const width = () => laneRef.current?.clientWidth || 0
  const sideX = (side) => (side === 'left' ? size() / 2 + MARGIN[variant] : width() - size() / 2 - MARGIN[variant])
  const place = (x) => {
    s.current.x = x
    if (moverRef.current) moverRef.current.style.transform = `translateX(${x - size() / 2}px)`
  }
  const face = (dir) => facingRef.current?.classList.toggle('is-left', dir < 0)
  const currentX = () => {
    const el = moverRef.current
    if (!el) return s.current.x
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    return m.m41 + size() / 2
  }

  /* ── Moves ────────────────────────────────────────────────────────── */
  const runTo = (x) => new Promise((resolve) => {
    const el = moverRef.current
    if (!el) return resolve(false)
    const from = currentX()
    s.current.move?.cancel()
    place(from)
    const dist = x - from
    if (Math.abs(dist) < 6) return resolve(true)
    if (still) { place(x); return resolve(true) }
    face(dist)
    otter.current?.run(true)
    const dur = Math.min(3200, Math.max(280, Math.abs(dist) / SPEED[variant]))
    const anim = el.animate(
      [{ transform: `translateX(${from - size() / 2}px)` }, { transform: `translateX(${x - size() / 2}px)` }],
      { duration: dur, easing: 'cubic-bezier(0.35, 0, 0.55, 1)' },
    )
    s.current.move = anim
    place(x)
    anim.onfinish = () => { s.current.move = null; otter.current?.run(false); resolve(true) }
    anim.oncancel = () => { otter.current?.run(false); resolve(false) }
  })

  const hide = () => {
    const el = liftRef.current
    if (!el || s.current.hidden || still) return
    s.current.hidden = true
    otter.current?.stop()
    otter.current?.face('shut', 'flat')
    el.animate(
      [{ transform: 'none' }, { transform: 'translateY(4%) scale(1.1, 0.9)', offset: 0.25 }, { transform: 'translateY(115%)' }],
      { duration: 320, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' },
    )
  }

  const show = async ({ peek = true } = {}) => {
    const el = liftRef.current
    if (!el || !s.current.hidden) return
    s.current.hidden = false
    el.getAnimations().forEach((a) => a.cancel())
    const frames = peek
      ? [{ transform: 'translateY(115%)' }, { transform: 'translateY(48%)', offset: 0.3 }, { transform: 'translateY(48%)', offset: 0.72 }, { transform: 'translateY(-6%) scale(0.95, 1.06)', offset: 0.9 }, { transform: 'none' }]
      : [{ transform: 'translateY(115%)' }, { transform: 'translateY(-6%) scale(0.95, 1.06)', offset: 0.75 }, { transform: 'none' }]
    otter.current?.face('open', peek ? 'flat' : 'grin')
    const a = el.animate(frames, { duration: peek ? 1500 : 520, easing: 'cubic-bezier(0.3, 0, 0.4, 1)' })
    if (peek) {
      window.setTimeout(() => otter.current?.engine?.face('smug', 'smirk'), 700)
    }
    await a.finished.catch(() => {})
    otter.current?.engine?.hover(false)
  }

  const busy = async (fn) => {
    if (s.current.busy) return
    s.current.busy = true
    try { await fn() } finally { s.current.busy = false }
  }

  /* ── Placement and the entrance ───────────────────────────────────── */
  useEffect(() => {
    const st = s.current
    st.alive = true
    const home = sideX(start)
    if (intro && !still) {
      place(start === 'right' ? -size() : width() + size())
      const t = window.setTimeout(() => busy(async () => {
        await runTo(home)
        otter.current?.cue(['wave'])
        await wait(1500)
      }), 900)
      return () => { st.alive = false; clearTimeout(t) }
    }
    place(variant === 'card' ? width() * 0.66 : home)
    face(-1)
    return () => { st.alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Keep it inside the lane when the lane changes width. */
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !laneRef.current) return undefined
    const ro = new ResizeObserver(() => {
      if (s.current.move) return
      const min = size() / 2 + MARGIN[variant]
      const max = width() - min
      if (max > min) place(Math.min(max, Math.max(min, s.current.x)))
    })
    ro.observe(laneRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── The page lane follows the reader through the sections ────────── */
  useEffect(() => {
    if (!stops || still || typeof IntersectionObserver === 'undefined') return undefined
    let pending = 0
    const io = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting)
      if (!hit) return
      clearTimeout(pending)
      pending = window.setTimeout(() => {
        const [side = 'right', act] = (hit.target.dataset.otter || '').split(':')
        if (s.current.last === hit.target) return
        s.current.last = hit.target
        busy(async () => {
          if (s.current.hidden) await wait(500)
          if (!s.current.alive) return
          if (s.current.hidden) { place(sideX(side)); await show({ peek: false }) } else await runTo(sideX(side))
          face(side === 'right' ? -1 : 1)
          if (act && otter.current?.can(act)) await wait(otter.current.cue([act]) || 0)
        })
      }, 380)
    }, { rootMargin: '-45% 0px -45% 0px' })
    document.querySelectorAll('[data-otter]').forEach((el) => io.observe(el))
    return () => { io.disconnect(); clearTimeout(pending) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  /* Scroll hard and it ducks; once the page settles it comes back up. */
  useEffect(() => {
    if (variant !== 'page' || still) return undefined
    let back = 0
    return onScrollVelocity((v) => {
      if (Math.abs(v) > FAST_SCROLL && !s.current.busy) {
        s.current.move?.cancel()
        hide()
      }
      if (s.current.hidden && Math.abs(v) < 40) {
        clearTimeout(back)
        back = window.setTimeout(() => {
          if (!s.current.hidden || s.current.busy) return
          busy(async () => {
            if (Math.random() < 0.5) {
              const other = s.current.x > width() / 2 ? 'left' : 'right'
              place(sideX(other))
              face(other === 'right' ? -1 : 1)
            }
            await show()
          })
        }, 650)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant])

  /* The pointer: it notices you coming, and sometimes hides from you. */
  useEffect(() => {
    if (variant !== 'page' || still || !hasFinePointer()) return undefined
    let raf = 0
    let shyTimer = 0
    const onMove = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = moverRef.current
        if (!el || s.current.busy || s.current.hidden) return
        const r = el.getBoundingClientRect()
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height * 0.45))
        const near = d < r.width * 1.6
        if (near && !s.current.near && !otter.current?.acting) {
          face(e.clientX < r.left + r.width / 2 ? -1 : 1)
          otter.current?.play('notice')
        }
        s.current.near = near
        const close = d < r.width * 0.75
        clearTimeout(shyTimer)
        if (close && performance.now() - s.current.pokedAt > 5000) {
          shyTimer = window.setTimeout(() => {
            s.current.pokedAt = performance.now()
            if (Math.random() < 0.45) {
              busy(async () => { hide(); await wait(1700); await show() })
            }
          }, 900)
        }
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); clearTimeout(shyTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant])

  /* ── Its own turns, through the Stage ─────────────────────────────── */
  usePerformer(moverRef, {
    id: `lane:${region}`,
    region,
    tier: 'accent',
    weight: 1,
    cooldown: cooldown ?? (variant === 'page' ? 3200 : 14000),
    share: 0.5,
    disabled: intensity === 'quiet' || intensity === 'still',
    when: () => !s.current.busy && !s.current.hidden && !otter.current?.acting && (otter.current?.engine?.sinceAct ?? 0) > 1200,
    run: async (ctx) => {
      const o = otter.current
      if (!o) return
      const roll = Math.random()
      const w = width()
      s.current.busy = true
      ctx.onStop(() => o.stop())
      try {
        if (variant === 'page' && roll < 0.14) {
          /* A dash: off one edge, back in from the other. */
          const goRight = s.current.x < w / 2
          await runTo(goRight ? w + size() : -size())
          if (ctx.stopped) return
          place(goRight ? -size() : w + size())
          await ctx.wait(500)
          await runTo(sideX(goRight ? 'left' : 'right'))
          face(goRight ? 1 : -1)
        } else if (roll < 0.3) {
          /* Across, to somewhere else on the edge. */
          const target = variant === 'page'
            ? sideX(s.current.x < w / 2 ? 'right' : 'left')
            : size() / 2 + MARGIN.card + Math.random() * (w - size() - MARGIN.card * 2)
          await runTo(target)
          face(target > w / 2 ? -1 : 1)
          o.play(Math.random() < 0.5 ? 'lookAround' : 'hop')
          await ctx.wait(1400)
        } else if (roll < 0.42) {
          /* Hide-and-seek. */
          hide()
          await ctx.wait(1400 + Math.random() * 1200)
          if (variant === 'card') place(size() / 2 + Math.random() * (w - size()))
          await show()
        } else {
          const name = o.engine?.idleAct()
          const ms = name ? o.play(name) : 0
          await ctx.wait(ms)
        }
      } finally {
        s.current.busy = false
      }
    },
  })

  useImperativeHandle(ref, () => ({
    play: (name) => {
      if (s.current.hidden) show({ peek: false })
      return otter.current?.play(name) ?? 0
    },
    cue: (names) => {
      if (s.current.hidden) show({ peek: false })
      return otter.current?.cue(names)
    },
    stop: () => otter.current?.stop(),
    can: (name) => otter.current?.can(name) ?? false,
    feel: (name, ms) => otter.current?.feel(name, ms),
    get acting() { return otter.current?.acting ?? null },
  }), [])

  return (
    <div ref={laneRef} className={`olane olane--${variant}`} aria-hidden="true">
      <div ref={moverRef} className="olane-mover">
        <div ref={liftRef} className="olane-lift">
          <div ref={facingRef} className="olane-facing">
            <Otter ref={otter} pose={pose} mood={mood} intensity={intensity} idle={false} region={region} className={variant === 'card' ? 'ot--small' : ''} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default OtterLane
