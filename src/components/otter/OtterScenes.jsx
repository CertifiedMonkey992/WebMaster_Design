/* ═══════════════════════════════════════════════════════════════════════════
   OtterScenes.jsx — THE OTTER, LIVING IN THE PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 15 → The otter's scenes. Instead of standing
   at the edge of the screen, the otter lives on the page's own things — its
   words, its cards, its edges — and moves between them:

     WordHopper     the hero: stands on the button, then jumps up onto the
                    headline and hops from word to word; a word dips when it
                    lands. Click a word and it jumps there.
     CardSwimmer    the Parts band: swims in along the band's wave, leaps
                    out, catches the top edge of a card and hangs on for
                    dear life, then climbs up and sits on it. Point at
                    another card and it may hop across.
     Floater        the lessons: floats on its back on the section's bottom
                    edge, the field guide shut on its chest, drifting.
     Climber        the start card: climbs the card's side, sits on its
                    top edge and points at the way in; it gets excited
                    when you point at the button.
     Napper         the footer: asleep on its top edge; wake it and it is
                    not pleased.

   Every scene is an Actor: an otter positioned by an anchor point of the
   drawing (its feet, its seat, its grip, its waterline) on a point of the
   page, carried along a line or thrown along an arc. Scenes begin when they
   are first seen; their own turns go through the Stage. Under reduced
   motion each otter is simply placed where its scene ends.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import Otter from './Otter'
import { usePerformer } from '../../motion/stage'
import { prefersReducedMotion } from '../../motion/env'

/* The point of the drawing (120 × 150 units) that sits on the page point. */
const ANCHOR = {
  stand: [60, 146], hold: [60, 146], sit: [60, 130], hang: [60, 6],
  swim: [60, 148], peek: [60, 148], float: [60, 146], climb: [34, 104],
}

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms))
const still = () => prefersReducedMotion()

/* ── The Actor ─────────────────────────────────────────────────────────── */

const Actor = forwardRef(function Actor({ pose = 'stand', mood = 'happy', region, className = '' }, ref) {
  const el = useRef(null)
  const facing = useRef(null)
  const otter = useRef(null)
  const st = useRef({ x: 0, y: 0, pose, busy: false, placed: false })

  const scale = () => (el.current?.offsetWidth || 64) / 120
  const corner = (x, y, p) => {
    const [ax, ay] = ANCHOR[p] || ANCHOR.stand
    return [x - ax * scale(), y - ay * scale()]
  }
  const write = (x, y, p) => {
    const [cx, cy] = corner(x, y, p)
    if (el.current) el.current.style.transform = `translate(${cx}px, ${cy}px)`
  }

  const api = {
    get state() { return st.current },
    get otter() { return otter.current },
    get el() { return el.current },
    place(x, y, p = st.current.pose) {
      el.current?.getAnimations().forEach((a) => a.cancel())
      if (p !== st.current.pose) otter.current?.pose(p)
      Object.assign(st.current, { x, y, pose: p, placed: true })
      write(x, y, p)
      el.current?.classList.add('is-placed')
    },
    face(dir) { facing.current?.classList.toggle('is-left', dir < 0) },
    pose(p) {
      if (p === st.current.pose) return
      otter.current?.pose(p)
      st.current.pose = p
      write(st.current.x, st.current.y, p)
    },
    /* Carried along a line in the current pose: a run, a swim, a climb. */
    travel(x, y, speed = 0.2) {
      return new Promise((resolve) => {
        const { x: x0, y: y0, pose: p } = st.current
        const dist = Math.hypot(x - x0, y - y0)
        if (dist < 2 || still()) { api.place(x, y, p); resolve(); return }
        if (Math.abs(x - x0) > 2) api.face(x - x0)
        const [ax, ay] = corner(x0, y0, p)
        const [bx, by] = corner(x, y, p)
        otter.current?.run(true)
        const a = el.current.animate(
          [{ transform: `translate(${ax}px, ${ay}px)` }, { transform: `translate(${bx}px, ${by}px)` }],
          { duration: Math.max(300, dist / speed), easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
        )
        Object.assign(st.current, { x, y })
        write(x, y, p)
        const done = () => { otter.current?.run(false); resolve() }
        a.onfinish = done
        a.oncancel = done
      })
    },
    /* Thrown along an arc, changing pose in mid-air. */
    leap(x, y, { to = st.current.pose, height = 60, dur = 620 } = {}) {
      return new Promise((resolve) => {
        const { x: x0, y: y0, pose: p } = st.current
        if (still()) { api.place(x, y, to); resolve(); return }
        if (Math.abs(x - x0) > 2) api.face(x - x0)
        const [ax, ay] = corner(x0, y0, p)
        const [bx, by] = corner(x, y, to)
        const frames = []
        for (let i = 0; i <= 12; i++) {
          const t = i / 12
          const lift = height * 4 * t * (1 - t)
          const sx = t < 0.08 ? 1.08 : t > 0.92 ? 1.06 : 0.96
          const sy = t < 0.08 ? 0.92 : t > 0.92 ? 0.94 : 1.05
          frames.push({ transform: `translate(${ax + (bx - ax) * t}px, ${ay + (by - ay) * t - lift}px) scale(${sx}, ${sy})` })
        }
        frames[frames.length - 1].transform = `translate(${bx}px, ${by}px)`
        otter.current?.face('open', 'grin')
        const a = el.current.animate(frames, { duration: dur, easing: 'linear' })
        window.setTimeout(() => api.pose(to), dur * 0.45)
        Object.assign(st.current, { x, y })
        write(x, y, to)
        a.onfinish = () => { api.pose(to); write(x, y, to); otter.current?.engine?.hover(false); resolve() }
        a.oncancel = () => { api.pose(to); write(x, y, to); resolve() }
      })
    },
    play(name) { return otter.current?.play(name) ?? 0 },
    async act(name) { const ms = api.play(name); if (ms) await wait(ms) },
  }

  useImperativeHandle(ref, () => api)

  return (
    <div ref={el} className={`oa ${className}`.trim()} aria-hidden="true">
      <div ref={facing} className="oa-facing">
        <Otter ref={otter} pose={pose} mood={mood} idle={false} region={region} />
      </div>
    </div>
  )
})

/* Measures `target` inside `scope`. */
const rectIn = (target, scope) => {
  const r = target.getBoundingClientRect()
  const s = scope.getBoundingClientRect()
  return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top, width: r.width, height: r.height, cx: r.left - s.left + r.width / 2 }
}

/* Runs `start` once, when `scope` is first well into view. */
function useFirstSight(scope, start, threshold = 0.35) {
  const fn = useRef(start)
  fn.current = start
  useEffect(() => {
    const el = scope.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') { fn.current(); return undefined }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      fn.current()
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [scope, threshold])
}

/* The scene's own turns, through the Stage. */
function useTurns(actor, region, run, cooldown = 3600) {
  const el = useRef(null)
  useEffect(() => { el.current = actor.current?.el })
  usePerformer(el, {
    id: `scene:${region}`,
    region,
    tier: 'accent',
    weight: 1.1,
    cooldown,
    share: 0.2,
    when: () => Boolean(actor.current?.state.placed && !actor.current.state.busy && !actor.current.otter?.acting),
    run: async (ctx) => {
      const a = actor.current
      a.state.busy = true
      ctx.onStop(() => a.otter?.stop())
      try { await run(a, ctx) } finally { a.state.busy = false }
    },
  })
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

/* ── The hero: on the words ────────────────────────────────────────────── */

const WORDS = '.hx-heading .tx--stomp .tx-u, .hx-verb, .hx-heading .tx--tumble .tx-w'

export function WordHopper({ scope }) {
  const actor = useRef(null)
  const on = useRef(-1)

  const words = useCallback(() => [...(scope.current?.querySelectorAll(WORDS) || [])], [scope])
  const spot = useCallback((w) => {
    const r = rectIn(w, scope.current)
    return [r.cx, r.top + r.height * 0.2]
  }, [scope])
  const dip = (w) => w?.animate?.(
    [{ transform: 'none' }, { transform: 'translateY(0.1em) scaleY(0.9)', offset: 0.3 }, { transform: 'translateY(-0.03em)', offset: 0.65 }, { transform: 'none' }],
    { duration: 460, easing: 'ease-out' },
  )

  const hopTo = useCallback(async (i, height) => {
    const a = actor.current
    const list = words()
    const w = list[i]
    if (!a || !w) return
    const [x, y] = spot(w)
    const from = a.state
    await a.leap(x, y, { to: 'stand', height: height ?? Math.max(30, Math.abs(y - from.y) * 0.6 + 26), dur: 560 })
    on.current = i
    dip(w)
    a.play('hop')
  }, [spot, words])

  /* Begins on the button, then jumps up onto the headline. */
  useEffect(() => {
    const t = window.setTimeout(async () => {
      const a = actor.current
      const btn = scope.current?.querySelector('.hx-actions .btn')
      const list = words()
      if (!a || !list.length) return
      if (btn) {
        const r = rectIn(btn, scope.current)
        a.place(r.right - 24, r.top, 'stand')
      } else a.place(spot(list[0])[0], spot(list[0])[1], 'stand')
      if (still()) { const [x, y] = spot(list[2] || list[0]); a.place(x, y, 'stand'); on.current = 2; return }
      a.state.busy = true
      await a.act('notice')
      await hopTo(Math.min(2, list.length - 1), 90)
      await a.act('excited')
      a.state.busy = false
    }, 2300)
    return () => clearTimeout(t)
  }, [hopTo, scope, spot, words])

  /* Keep it on its word when the page reflows. */
  useEffect(() => {
    const onResize = () => {
      const w = words()[on.current]
      if (w && actor.current && !actor.current.state.busy) { const [x, y] = spot(w); actor.current.place(x, y, 'stand') }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [spot, words])

  /* Click a word and it jumps there. */
  useEffect(() => {
    const h = scope.current?.querySelector('.hx-heading')
    if (!h) return undefined
    const onClick = (e) => {
      const list = words()
      const i = list.findIndex((w) => w.contains(e.target))
      const a = actor.current
      if (i < 0 || !a || a.state.busy || i === on.current) return
      a.state.busy = true
      hopTo(i).then(() => { a.state.busy = false })
    }
    h.addEventListener('click', onClick)
    return () => h.removeEventListener('click', onClick)
  }, [hopTo, scope, words])

  useTurns(actor, 'hero:otter', async (a, ctx) => {
    const list = words()
    if (Math.random() < 0.55 && list.length > 1) {
      let i = on.current + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))
      if (i < 0 || i >= list.length) i = on.current > 0 ? on.current - 1 : 1
      await hopTo(i)
      await ctx.wait(400)
    } else {
      await ctx.wait(a.play(pick(['unimpressed', 'dance', 'shy', 'silly', 'lookAround', 'love', 'confused', 'proud'])))
    }
  }, 3000)

  return <Actor ref={actor} pose="stand" mood="mischievous" region="hero:otter" className="oa--hero" />
}

/* ── The Parts band: swim in, hang on, climb up ────────────────────────── */

export function CardSwimmer({ scope }) {
  const actor = useRef(null)
  const card = useRef(1)

  const cards = useCallback(() => [...(scope.current?.querySelectorAll('.hs-cards > li') || [])], [scope])
  const ledge = useCallback((i) => {
    const c = cards()[i]
    if (!c) return null
    const r = rectIn(c, scope.current)
    return { x: r.left + r.width * 0.68, y: r.top + 4 }
  }, [cards, scope])

  const climbUp = async (a) => {
    const l = ledge(card.current)
    if (!l) return
    await a.leap(l.x, l.y, { to: 'sit', height: 26, dur: 480 })
    a.play('hop')
  }

  useFirstSight(scope, async () => {
    const a = actor.current
    if (!a) return
    const water = -12
    const target = ledge(card.current)
    if (!target) return
    if (still()) { a.place(target.x, target.y, 'sit'); return }
    a.state.busy = true
    a.place(-70, water, 'swim')
    a.face(1)
    await a.travel(target.x - 40, water, 0.16)
    await a.act('surprised')
    await a.leap(target.x, target.y, { to: 'hang', height: 70, dur: 720 })
    await a.act('dearLife')
    await a.act('kick')
    await climbUp(a)
    await a.act('excited')
    a.state.busy = false
  }, 0.3)

  /* Point at another card and it may hop over to it. */
  useEffect(() => {
    const list = cards()
    const offs = list.map((c, i) => {
      const enter = () => {
        const a = actor.current
        if (!a || a.state.busy || a.state.pose !== 'sit' || i === card.current || Math.random() < 0.35) return
        a.state.busy = true
        const l = ledge(i)
        card.current = i
        a.leap(l.x, l.y, { to: 'sit', height: 50, dur: 640 }).then(() => { a.play(pick(['excited', 'proud', 'kick'])); a.state.busy = false })
      }
      c.addEventListener('pointerenter', enter)
      return () => c.removeEventListener('pointerenter', enter)
    })
    const onResize = () => {
      const a = actor.current
      const l = ledge(card.current)
      if (a?.state.placed && !a.state.busy && l) a.place(l.x, l.y, a.state.pose === 'hang' ? 'hang' : 'sit')
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { offs.forEach((off) => off()); window.removeEventListener('resize', onResize) }
  }, [cards, ledge])

  useTurns(actor, 'parts:otter', async (a, ctx) => {
    const roll = Math.random()
    if (roll < 0.22) {
      /* It slips off the edge and hangs on, then climbs back. */
      const l = ledge(card.current)
      a.place(l.x, l.y, 'hang')
      await ctx.wait(a.play('dearLife'))
      await climbUp(a)
    } else if (roll < 0.42) {
      const n = cards().length
      card.current = (card.current + (Math.random() < 0.5 ? 1 : n - 1)) % n
      const l = ledge(card.current)
      await a.leap(l.x, l.y, { to: 'sit', height: 50, dur: 640 })
      await ctx.wait(a.play('hop'))
    } else {
      await ctx.wait(a.play(pick(['kick', 'read', 'sleepy', 'silly', 'shy', 'unimpressed', 'love'])))
    }
  }, 4200)

  return <Actor ref={actor} pose="swim" mood="happy" region="parts:otter" className="oa--card" />
}

/* ── The lessons: floating on its back ─────────────────────────────────── */

export function Floater({ scope }) {
  const actor = useRef(null)
  const water = () => (scope.current?.offsetHeight || 0) - 4

  useFirstSight(scope, async () => {
    const a = actor.current
    if (!a) return
    const w = scope.current.offsetWidth
    if (still()) { a.place(w * 0.3, water(), 'float'); return }
    a.state.busy = true
    a.place(-90, water(), 'float')
    a.face(1)
    await a.travel(w * 0.3, water(), 0.07)
    await a.act('love')
    a.state.busy = false
  }, 0.2)

  useEffect(() => {
    const onResize = () => {
      const a = actor.current
      if (a?.state.placed && !a.state.busy) a.place(Math.min(a.state.x, scope.current.offsetWidth - 60), water(), 'float')
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  })

  useTurns(actor, 'lessons:otter', async (a, ctx) => {
    if (Math.random() < 0.4) {
      const w = scope.current.offsetWidth
      /* The left half: the start card's otter sits on the right. */
      const x = 80 + Math.random() * (w * 0.55 - 80)
      await a.travel(x, water(), 0.06)
      await ctx.wait(300)
    } else {
      await ctx.wait(a.play(pick(['bob', 'sleepy', 'love', 'splash'])))
    }
  }, 4600)

  return <Actor ref={actor} pose="float" mood="relaxed" region="lessons:otter" className="oa--float" />
}

/* ── The start card: up the side and onto the top ─────────────────────── */

export function Climber({ scope }) {
  const actor = useRef(null)
  const box = () => {
    const c = scope.current?.querySelector('.hs-start-card')
    return c ? rectIn(c, scope.current) : null
  }

  useFirstSight(scope, async () => {
    const a = actor.current
    const r = box()
    if (!a || !r) return
    const seat = [r.right - 70, r.top]
    if (still()) { a.place(seat[0], seat[1], 'sit'); return }
    a.state.busy = true
    a.place(r.right + 2, r.bottom + 30, 'climb')
    a.face(-1)
    await a.travel(r.right + 2, r.top + 52, 0.07)
    await a.leap(seat[0], seat[1], { to: 'sit', height: 40, dur: 560 })
    await a.act('point')
    await a.act('excited')
    a.state.busy = false
  }, 0.45)

  /* It notices the button. */
  useEffect(() => {
    const btns = [...(scope.current?.querySelectorAll('.hs-start-btn') || [])]
    const offs = btns.map((b, i) => {
      const enter = () => {
        const a = actor.current
        if (!a?.state.placed || a.state.busy) return
        a.otter?.stop()
        a.play(i === 0 ? pick(['excited', 'love']) : 'surprised')
      }
      b.addEventListener('pointerenter', enter)
      return () => b.removeEventListener('pointerenter', enter)
    })
    const onResize = () => {
      const a = actor.current
      const r = box()
      if (a?.state.placed && !a.state.busy && r) a.place(r.right - 70, r.top, 'sit')
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { offs.forEach((off) => off()); window.removeEventListener('resize', onResize) }
  })

  useTurns(actor, 'start:otter', async (a, ctx) => {
    await ctx.wait(a.play(pick(['kick', 'point', 'read', 'sleepy', 'shy', 'unimpressed'])))
  }, 4200)

  return <Actor ref={actor} pose="sit" mood="happy" region="start:otter" className="oa--start" />
}

/* ── The footer: asleep on the edge ────────────────────────────────────── */

export function Napper({ scope }) {
  const actor = useRef(null)
  const woke = useRef(0)

  useFirstSight(scope, () => {
    const a = actor.current
    if (!a) return
    a.place(scope.current.offsetWidth * 0.86, 0, 'sit')
    a.play('sleepy')
  }, 0.1)

  useEffect(() => {
    const el = actor.current?.el
    if (!el) return undefined
    const wake = () => {
      const a = actor.current
      const t = performance.now()
      if (!a?.state.placed || t - woke.current < 4000) return
      woke.current = t
      a.otter?.stop()
      a.otter?.cue(['surprised', 'angry'])
    }
    el.addEventListener('pointerenter', wake)
    const onResize = () => {
      const a = actor.current
      if (a?.state.placed) a.place(scope.current.offsetWidth * 0.86, 0, 'sit')
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { el.removeEventListener('pointerenter', wake); window.removeEventListener('resize', onResize) }
  })

  useTurns(actor, 'footer:otter', async (a, ctx) => {
    await ctx.wait(a.play(Math.random() < 0.75 ? 'sleepy' : 'kick'))
  }, 2600)

  return <Actor ref={actor} pose="sit" mood="sleepy" region="footer:otter" className="oa--nap" />
}
