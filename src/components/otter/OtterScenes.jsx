/* ═══════════════════════════════════════════════════════════════════════════
   OtterScenes.jsx — THE OTTER, LIVING IN THE PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 15 → The otter's scenes. Instead of standing
   at the edge of the screen, the otter lives on the page's own things — its
   words, its cards, its edges — and moves between them:

     WordHopper     the hero: stands on the button, then jumps up onto the
                    headline and hops from word to word; a word dips when it
                    lands. Click a word and it jumps there.
     CardHopper     the Parts band: jumps in from the band's edge onto the
                    first card's top edge, then across to the next, and
                    sits there. Point at another card and it may hop
                    across.
     Climber        the start card: jumps from beside the card onto the
                    left of its top edge and points at the way in; it gets
                    excited when you point at the button. (The footer's
                    otter sits on the right, so the two never stack.)
     Napper         the footer: asleep on its top edge; wake it and it is
                    not pleased.

   Every scene is an Actor: an otter positioned by an anchor point of the
   drawing (its feet, its seat, its grip, its waterline) on a point of the
   page, carried along a line or thrown along an arc. Scenes begin when they
   are first seen; their own turns go through the Stage, and between turns
   each otter hops (useHopping) — a jump every second or so while its scene
   is on screen. The hero's otter picks perches clear of the page's words
   and lands on a word only now and then. Under reduced motion each otter
   is simply placed where its scene ends.
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
const rand = (a, b) => a + Math.random() * (b - a)

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
    /* A jump where it stands, or a short way along. */
    jump(dx = 0, height = 32) {
      const { x, y, pose: p } = st.current
      return api.leap(x + dx, y, { to: p, height, dur: 340 + height * 5 })
    },
    /* The part of the page it would cover standing at (x, y): the drawing's
       box less its empty margins. */
    box(x, y, p = st.current.pose) {
      const w = el.current?.offsetWidth || 64
      const h = w * 1.25
      const [cx, cy] = corner(x, y, p)
      return { left: cx + w * 0.14, right: cx + w * 0.86, top: cy + h * 0.06, bottom: cy + h * 0.97 }
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

/* Text a reader can see: not the otters', not a screen-reader copy, not a
   word waiting its turn at opacity 0. */
const shown = (node, root) => {
  for (let e = node.parentElement; e && e !== root; e = e.parentElement) {
    if (e.classList.contains('oa')) return false
    const cs = getComputedStyle(e)
    if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') return false
    if (cs.overflow !== 'visible' && (e.offsetWidth <= 2 || e.offsetHeight <= 2)) return false
  }
  return true
}

/* Every line of visible text inside `scope`, in its coordinates. */
function textRects(scope) {
  const root = scope.current
  if (!root) return []
  const s = root.getBoundingClientRect()
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && shown(n, root) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  })
  const range = document.createRange()
  const out = []
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) {
      if (r.width > 2 && r.height > 2) out.push({ left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top })
    }
  }
  return out
}

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const clearOf = (box, rects) => !rects.some((r) => overlaps(box, r))

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

/* Between the Stage's turns the otter never stands still for long: while
   its scene is on screen and it is not busy or acting, `hop` runs every
   `every` ms or so (MOTION_RULES.md → the otter hops). */
function useHopping(actor, scope, hop, every = [900, 1500]) {
  const fn = useRef(hop)
  fn.current = hop
  const [lo, hi] = every
  useEffect(() => {
    if (still()) return undefined
    let alive = true
    let seen = typeof IntersectionObserver === 'undefined'
    let t = 0
    const io = seen ? null : new IntersectionObserver(([e]) => { seen = e.isIntersecting }, { threshold: 0.05 })
    if (io && scope.current) io.observe(scope.current)
    const tick = async () => {
      const a = actor.current
      if (alive && seen && !document.hidden && a?.state.placed && !a.state.busy && !a.otter?.acting) {
        a.state.busy = true
        try { await fn.current(a) } finally { a.state.busy = false }
      }
      if (alive) t = window.setTimeout(tick, rand(lo, hi))
    }
    t = window.setTimeout(tick, rand(lo, hi))
    return () => { alive = false; window.clearTimeout(t); io?.disconnect() }
  }, [actor, scope, lo, hi])
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

/* ── The hero: on the words ────────────────────────────────────────────── */

const WORDS = '.hx-heading .tx--stomp .tx-u, .hx-verb, .hx-heading .tx--tumble .tx-w'

export function WordHopper({ scope }) {
  const actor = useRef(null)
  const on = useRef(null)

  const words = useCallback(() => [...(scope.current?.querySelectorAll(WORDS) || [])], [scope])

  /* Its perches: the top of each word, and the line beside each word —
     each marked `clear` when the otter standing there would cover no text. */
  const perches = useCallback(() => {
    const a = actor.current
    const root = scope.current
    if (!a || !root) return []
    const text = textRects(scope)
    const width = root.offsetWidth
    const step = (a.el?.offsetWidth || 64) * 0.8
    const out = []
    words().forEach((w, i) => {
      const r = rectIn(w, root)
      out.push({ key: `w${i}`, word: w, x: r.cx, y: r.top + r.height * 0.2 })
      const ground = r.bottom - r.height * 0.14
      for (let k = 1, x = r.right + step * 0.9; k <= 4 && x < width - step * 0.4; k++, x += step) out.push({ key: `g${i}.${k}`, x, y: ground })
    })
    const seen = new Set()
    return out.filter((p) => {
      const id = `${Math.round(p.x / 12)}:${Math.round(p.y / 12)}`
      if (seen.has(id)) return false
      seen.add(id)
      p.clear = clearOf(a.box(p.x, p.y, 'stand'), text)
      return true
    })
  }, [scope, words])

  const dip = (w) => w?.animate?.(
    [{ transform: 'none' }, { transform: 'translateY(0.1em) scaleY(0.9)', offset: 0.3 }, { transform: 'translateY(-0.03em)', offset: 0.65 }, { transform: 'none' }],
    { duration: 460, easing: 'ease-out' },
  )

  const landOn = useCallback(async (p, height) => {
    const a = actor.current
    if (!a || !p) return
    await a.leap(p.x, p.y, { to: 'stand', height: height ?? Math.max(34, Math.abs(p.y - a.state.y) * 0.6 + 30), dur: 560 })
    on.current = p.key
    if (p.word) dip(p.word)
  }, [])

  /* Mostly a clear perch near by; now and then a word, text or no text. */
  const wander = useCallback(async (a) => {
    const all = perches()
    const far = all.filter((p) => Math.hypot(p.x - a.state.x, p.y - a.state.y) > 10)
    if (!far.length || Math.random() < 0.3) { await a.jump(0, rand(28, 50)); return }
    const clear = far.filter((p) => p.clear)
    const pool = clear.length && Math.random() > 0.12 ? clear : far.filter((p) => p.word)
    pool.sort((p, q) => Math.hypot(p.x - a.state.x, p.y - a.state.y) - Math.hypot(q.x - a.state.x, q.y - a.state.y))
    await landOn(pick(pool.slice(0, 3)))
  }, [landOn, perches])

  const home = useCallback(() => {
    const all = perches()
    return all.find((p) => p.clear && p.word) || all.find((p) => p.clear) || all[0]
  }, [perches])

  /* Begins on the button, then jumps up to a perch by the headline. */
  useEffect(() => {
    const t = window.setTimeout(async () => {
      const a = actor.current
      const btn = scope.current?.querySelector('.hx-actions .btn')
      const first = home()
      if (!a || !first) return
      if (still()) { a.place(first.x, first.y, 'stand'); on.current = first.key; return }
      if (btn) {
        const r = rectIn(btn, scope.current)
        a.place(r.right - 24, r.top, 'stand')
      } else a.place(first.x, first.y, 'stand')
      a.state.busy = true
      await a.act('notice')
      await landOn(first, 90)
      await a.act('excited')
      a.state.busy = false
    }, 2300)
    return () => clearTimeout(t)
  }, [home, landOn, scope])

  /* Keep it on its perch when the page reflows. */
  useEffect(() => {
    const onResize = () => {
      const a = actor.current
      if (!a?.state.placed || a.state.busy) return
      const all = perches()
      const p = all.find((q) => q.key === on.current && q.clear) || home()
      if (p) { a.place(p.x, p.y, 'stand'); on.current = p.key }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [home, perches])

  /* Click a word and it jumps there. */
  useEffect(() => {
    const h = scope.current?.querySelector('.hx-heading')
    if (!h) return undefined
    const onClick = (e) => {
      const p = perches().find((q) => q.word?.contains(e.target))
      const a = actor.current
      if (!p || !a || a.state.busy || p.key === on.current) return
      a.state.busy = true
      landOn(p).then(() => { a.state.busy = false })
    }
    h.addEventListener('click', onClick)
    return () => h.removeEventListener('click', onClick)
  }, [landOn, perches, scope])

  useHopping(actor, scope, wander)

  useTurns(actor, 'hero:otter', async (a, ctx) => {
    await ctx.wait(a.play(pick(['unimpressed', 'dance', 'shy', 'silly', 'lookAround', 'confused', 'proud'])))
  }, 3000)

  return <Actor ref={actor} pose="stand" mood="mischievous" region="hero:otter" className="oa--hero" />
}

/* ── The Parts band: jump onto a card's edge ──────────────────────────── */

export function CardHopper({ scope }) {
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

  /* In from the band's left edge: onto the first card, then across —
     once the cards have been dealt, so their edges are where they stay. */
  useFirstSight(scope, async () => {
    const a = actor.current
    if (!a) return
    if (!still()) await wait(1300)
    const first = ledge(0)
    const target = ledge(card.current)
    if (!first || !target) return
    if (still()) { a.place(target.x, target.y, 'sit'); return }
    a.state.busy = true
    a.place(-70, first.y + 40, 'stand')
    a.face(1)
    await a.leap(first.x, first.y, { to: 'sit', height: 90, dur: 760 })
    a.play('hop')
    if (card.current !== 0) await a.leap(target.x, target.y, { to: 'sit', height: 60, dur: 660 })
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

  /* Hops on its card, and now and then a card over. */
  useHopping(actor, scope, async (a) => {
    if (a.state.pose === 'hang') { await climbUp(a); return }
    if (a.state.pose !== 'sit') return
    if (Math.random() < 0.25) {
      const n = cards().length
      card.current = (card.current + (Math.random() < 0.5 ? 1 : n - 1)) % n
      const l = ledge(card.current)
      if (l) await a.leap(l.x, l.y, { to: 'sit', height: 50, dur: 640 })
      return
    }
    const l = ledge(card.current)
    if (l) await a.leap(l.x + rand(-16, 16), l.y, { to: 'sit', height: rand(24, 44), dur: 480 })
  })

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
      await ctx.wait(a.play(pick(['kick', 'read', 'sleepy', 'silly', 'shy', 'unimpressed'])))
    }
  }, 4200)

  return <Actor ref={actor} pose="sit" mood="happy" region="parts:otter" className="oa--card" />
}

/* ── The start card: a jump onto the left of its top edge ──────────────── */

export function Climber({ scope }) {
  const actor = useRef(null)
  /* How far in from the card's left edge it sits. */
  const seat = useRef(90)
  const box = () => {
    const c = scope.current?.querySelector('.hs-start-card')
    return c ? rectIn(c, scope.current) : null
  }

  useFirstSight(scope, async () => {
    const a = actor.current
    if (!a) return
    /* After the card's curtain, so its edge is where it stays. */
    if (!still()) await wait(1100)
    const r = box()
    if (!r) return
    const to = [r.left + seat.current, r.top]
    if (still()) { a.place(to[0], to[1], 'sit'); return }
    a.state.busy = true
    a.place(r.left - 60, r.bottom, 'stand')
    a.face(1)
    await a.act('notice')
    await a.leap(to[0], to[1], { to: 'sit', height: 80, dur: 720 })
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
        a.play(i === 0 ? pick(['excited', 'proud']) : 'surprised')
      }
      b.addEventListener('pointerenter', enter)
      return () => b.removeEventListener('pointerenter', enter)
    })
    const onResize = () => {
      const a = actor.current
      const r = box()
      if (a?.state.placed && !a.state.busy && r) a.place(r.left + seat.current, r.top, 'sit')
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { offs.forEach((off) => off()); window.removeEventListener('resize', onResize) }
  })

  /* Hops along the card's top edge. */
  useHopping(actor, scope, async (a) => {
    const r = box()
    if (!r) return
    seat.current = Math.min(Math.max(seat.current + rand(-60, 60), 60), Math.min(240, r.width - 60))
    await a.leap(r.left + seat.current, r.top, { to: 'sit', height: rand(24, 44), dur: 480 })
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

  /* Even asleep it hops. */
  useHopping(actor, scope, (a) => a.jump(0, rand(16, 30)), [1600, 2600])

  useTurns(actor, 'footer:otter', async (a, ctx) => {
    await ctx.wait(a.play(Math.random() < 0.75 ? 'sleepy' : 'kick'))
  }, 2600)

  return <Actor ref={actor} pose="sit" mood="sleepy" region="footer:otter" className="oa--nap" />
}
