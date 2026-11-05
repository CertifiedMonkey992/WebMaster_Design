/* ═══════════════════════════════════════════════════════════════════════════
   engine.js — WHAT MAKES THE OTTER MOVE
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 16 → The otter. One engine per drawing. It
   plays acts (acts.js) as Web Animations on the drawing's parts — moving
   them, and fading the emotes in and out — swaps the face, carries the book
   between "none", "closed" and "open", changes pose at run time (the pose
   layers are CSS, so a change of pose is itself a short move), and runs a
   carrying cycle while something moves it.

   How it moves like an animal rather than a puppet:
     · Every track is a smooth curve through its keys (monotone cubic), so
       a part speeds up and slows down through a move instead of stopping
       at each key, and a held pose holds without drifting.
     · Overlapping action: the parts that hang off another part swing after
       it — the tail behind the body, the ears and whiskers behind the head,
       the paws behind the arms, the feet behind the legs and the body.
       Each is a damped spring pushed by its driver's acceleration, worked
       out when the act starts and played with it (FOLLOW).
     · Ambient life, only while the otter is on screen: a breath that lifts
       the chest, shoulders and head; a blink (a lid, not a swap); a slow
       sway of the tail; and, now and then, an ear flick or a whisker
       twitch with a sniff.

   Nothing here decides when to perform: the Stage (an idle turn), a scene
   or lane, a click or a real event does.

   Under reduced motion it never moves: an act sets the face it would end
   on and the book it would end with, and nothing else.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion } from '../../motion/env'
import { ACTS, ALIASES, BOOK_POSES, CLICK_ACTS, EDGE_POSES, IDLE, MOODS, pickAct } from './acts'

/* A track's x and y are in otter units: a 150th of the drawing's height,
   four of its pixels. The eyes, which have no whites to move in, travel
   less. */
const UNIT = 4
const UNITS = { pupils: 1.5 }
const STEP = 25                       // ms between samples of a smoothed track
const DT = 1 / 240                    // s, the springs' time step
const SETTLE = 420                    // ms a follower may swing on after its act

const isEmote = (part) => part.startsWith('e_')
/* An act's keys that are not tracks. */
const META = new Set(['dur', 'face', 'book', 'only', 'needsBook', 'freeHands', 'body', 'then', 'bookTrack', 'stand', 'hold', 'sit', 'hang', 'climb', 'swim', 'peek', 'float'])
const V = (x = 0, y = 0, r = 0, sx = 1, sy = sx) => ({ x, y, r, sx, sy })
const REST = V()
const css = (v, u = UNIT) => `translate(${v.x * u}px, ${v.y * u}px) rotate(${v.r}deg) scale(${v.sx}, ${v.sy})`
const ADD = typeof KeyframeEffect !== 'undefined' && 'composite' in KeyframeEffect.prototype

/* Where a part rests, given what is in the otter's paws. */
function restOf(part, book) {
  if (isEmote(part)) return { ...REST, op: 0 }
  const held = book !== 'none'
  if (part === 'armL' && held) return V(0, 0, -6)
  if (part === 'armR' && held) return V(0, 0, 6)
  if (part === 'book') return held ? REST : V(10, 10, -30, 0, 0)
  return REST
}

/* ── Smooth curves ─────────────────────────────────────────────────────── */

/* Monotone cubic interpolation (Fritsch–Carlson): smooth through every key,
   never past one, so a hold holds. An act's ends ease in and out of rest;
   a loop's ends meet with the same speed. */
function spline(ts, vs, loop) {
  const n = ts.length
  const d = []
  const m = new Array(n).fill(0)
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]))
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] > 0 ? (d[i - 1] + d[i]) / 2 : 0
  if (loop && n > 2 && d[0] * d[n - 2] > 0) m[0] = m[n - 1] = (d[0] + d[n - 2]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i] }
  }
  return (t) => {
    if (t <= ts[0]) return vs[0]
    if (t >= ts[n - 1]) return vs[n - 1]
    let i = 0
    while (i < n - 2 && t > ts[i + 1]) i++
    const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h, s2 = s * s, s3 = s2 * s
    return (2 * s3 - 3 * s2 + 1) * vs[i] + (s3 - 2 * s2 + s) * h * m[i] + (3 * s2 - 2 * s3) * vs[i + 1] + (s3 - s2) * h * m[i + 1]
  }
}

const CH = ['x', 'y', 'r', 'sx', 'sy']

/* A track row is [offset, x, y, rotate, scaleX, scaleY, opacity]. Where a
   track leaves out offset 0 or 1, the part's rest fills in. */
function curve(track, from, to, { emote = false, loop = false } = {}) {
  const keys = track.map(([o, x = 0, y = 0, r = 0, sx = 1, sy = sx, op]) => ({ o, x, y, r, sx, sy, op: op ?? (emote ? 1 : undefined) }))
  if (keys[0].o !== 0) keys.unshift({ o: 0, ...from })
  if (keys[keys.length - 1].o !== 1) keys.push({ o: 1, ...to })
  for (let i = 1; i < keys.length; i++) if (keys[i].o <= keys[i - 1].o) keys[i].o = keys[i - 1].o + 1e-4
  const ts = keys.map((k) => k.o)
  const fn = {}
  for (const c of CH) fn[c] = spline(ts, keys.map((k) => k[c]), loop)
  if (emote) fn.op = spline(ts, keys.map((k) => k.op ?? 1), loop)
  return (t) => {
    const v = {}
    for (const c in fn) v[c] = fn[c](t)
    return v
  }
}

/* ── Overlapping action ───────────────────────────────────────────────────
   [part, channel, stiffness, damping, limit, [[driver, channel, gain]…]]:
   the part swings by `gain` for each unit (or degree) per second squared
   of its drivers' acceleration, on a spring. */
const FOLLOW = [
  ['tail', 'r', 70, 5.5, 28, [['fig', 'y', 0.009], ['fig', 'x', -0.008], ['fig', 'r', -0.022], ['spin', 'r', -0.003]]],
  ['earL', 'r', 300, 9, 22, [['head', 'r', -0.004], ['fig', 'y', 0.003], ['fig', 'r', -0.004]]],
  ['earR', 'r', 300, 9, 22, [['head', 'r', -0.004], ['fig', 'y', -0.003], ['fig', 'r', -0.004]]],
  ['whiskers', 'r', 380, 10, 6, [['head', 'r', -0.0022], ['fig', 'y', 0.0008]]],
  ['pawL', 'r', 190, 10, 30, [['armL', 'r', -0.0016], ['fig', 'y', 0.003]]],
  ['pawR', 'r', 190, 10, 30, [['armR', 'r', -0.0016], ['fig', 'y', -0.003]]],
  ['footL', 'r', 230, 13, 34, [['fig', 'y', 0.0075], ['legL', 'r', -0.0018]]],
  ['footR', 'r', 230, 13, 34, [['fig', 'y', -0.0075], ['legR', 'r', -0.0018]]],
  ['head', 'y', 260, 17, 1.6, [['fig', 'y', -0.00045]]],
]

/* Swings for every follower whose drivers move. `drive(part, channel, t)`
   gives a driver's value at t seconds, or null when the act leaves that
   part alone. A loop is run three times and its last pass kept, so it
   meets itself. Returns { part: { ch, at(t) } }. */
function follow(drive, seconds, { loop = false } = {}) {
  const out = {}
  const n = Math.max(2, Math.ceil(seconds / DT))
  const total = loop ? n * 3 : n + Math.ceil(SETTLE / 1000 / DT)
  const cache = {}
  const series = (p, ch) => {
    if (cache[p + ch]) return cache[p + ch]
    const a = new Float32Array(total + 3)
    for (let i = -1; i <= total + 1; i++) {
      const j = loop ? ((i % n) + n) % n : Math.min(Math.max(i, 0), n)
      a[i + 1] = drive(p, ch, j * DT)
    }
    return (cache[p + ch] = a)
  }
  for (const [part, ch, k, c, limit, drivers] of FOLLOW) {
    const live = drivers.filter(([p]) => drive(p, 'x') !== null).map(([p, dc, g]) => [series(p, dc), g])
    if (!live.length) continue
    let x = 0, v = 0, peak = 0
    const xs = new Float32Array(total + 1)
    for (let i = 0; i <= total; i++) {
      let target = 0
      for (const [s, g] of live) target += (g * (s[i + 2] - 2 * s[i + 1] + s[i])) / (DT * DT)
      v += (k * (target - x) - c * v) * DT
      x += v * DT
      xs[i] = limit * Math.tanh(x / limit)
      if (!loop || i >= n * 2) peak = Math.max(peak, Math.abs(xs[i]))
    }
    if (peak < (ch === 'y' ? 0.04 : 0.35)) continue
    const base = loop ? n * 2 : 0
    out[part] = { ch, at: (t) => xs[Math.min(total, base + Math.max(0, Math.round(t / DT)))] }
  }
  return out
}

/* ── Keyframes ─────────────────────────────────────────────────────────── */

/* Samples `fn` (of t in 0…1) into keyframes every STEP ms, plus every key. */
function frames(fn, dur, part, keyOffsets = []) {
  const n = Math.max(2, Math.round(dur / STEP))
  const at = new Set(keyOffsets.filter((o) => o > 0 && o < 1))
  for (let i = 0; i <= n; i++) at.add(i / n)
  const u = UNITS[part] ?? UNIT
  return [...at].sort((a, b) => a - b).map((t) => {
    const v = fn(t)
    const f = { offset: t, transform: css(v, u) }
    if (v.op != null) f.opacity = Math.max(0, Math.min(1, v.op))
    return f
  })
}

/* An act's (or a cycle's) animations: its tracks, smoothed, with the
   followers' swings laid over them. */
function build(tracks, dur, { from, to, loop = false }) {
  const curves = {}
  for (const [part, track] of Object.entries(tracks)) {
    if (!Array.isArray(track) || !Array.isArray(track[0])) continue
    curves[part] = curve(track, from(part), to(part), { emote: isEmote(part), loop })
  }
  const seconds = dur / 1000
  const drive = (part, ch, t) => {
    if (!curves[part]) return null
    if (t === undefined) return 0
    return curves[part](Math.min(1, Math.max(0, t / seconds)))[ch]
  }
  const swings = follow(drive, seconds, { loop })
  /* A paw's shadow on the belly fades as its arm lifts the paw away. */
  for (const [arm, cast] of [['armL', 'castL'], ['armR', 'castR']]) {
    if (!curves[arm] || curves[cast]) continue
    const rest = from(arm).r
    curves[cast] = (t) => ({ ...REST, op: Math.max(0, Math.min(1, 1 - (Math.abs(curves[arm](t).r - rest) - 8) / 18)) })
  }
  const out = []
  for (const part of new Set([...Object.keys(curves), ...Object.keys(swings)])) {
    const base = curves[part] || (() => ({ ...from(part) }))
    const sw = swings[part]
    const long = !loop && sw ? dur + SETTLE : dur
    const fn = (t) => {
      const ms = t * long
      const v = ms <= dur ? base(ms / dur) : { ...to(part) }
      if (sw) v[sw.ch] += sw.at(ms / 1000)
      return v
    }
    const keys = (tracks[part] || []).map((r) => (r[0] * dur) / long)
    out.push({ part, frames: frames(fn, long, part, keys), duration: long })
  }
  return out
}

/* ── The cycles for being carried ─────────────────────────────────────── */

/* A run is a bounding hop: two little bounces a stride, the arms pumping
   on the chest, the legs swinging under it. The followers add the rest. */
const STRIDE = 400
const RUN = {
  fig: [[0, 0, 0.6, 0, 1.04, 0.96], [0.25, 0, -8, 0, 0.97, 1.04], [0.5, 0, 0.6, 0, 1.04, 0.96], [0.75, 0, -8, 0, 0.97, 1.04], [1, 0, 0.6, 0, 1.04, 0.96]],
  legL: [[0, 0, 0, 12], [0.5, 0, -2, -12], [1, 0, 0, 12]],
  legR: [[0, 0, -2, 12], [0.5, 0, 0, -12], [1, 0, -2, 12]],
  armL: [[0, 0, 0, -14], [0.5, 0, 0, 12], [1, 0, 0, -14]],
  armR: [[0, 0, 0, -12], [0.5, 0, 0, 14], [1, 0, 0, -12]],
  head: [[0, 0, 0.5, -2], [0.5, 0, 0.5, 2], [1, 0, 0.5, -2]],
  shadow: [[0, 0, 0, 0, 1, 1], [0.25, 0, 0, 0, 0.82, 1], [0.5, 0, 0, 0, 1, 1], [0.75, 0, 0, 0, 0.82, 1], [1, 0, 0, 0, 1, 1]],
}
const CARRY = {
  swim: {
    stride: 620,
    tracks: {
      pawEL: [[0, 0, 0], [0.25, -5, -7, -20], [0.5, 0, 0], [1, 0, 0]],
      pawER: [[0, 0, 0], [0.5, 0, 0], [0.75, 5, -7, 20], [1, 0, 0]],
      head: [[0, 0, 0, -3], [0.5, 0, 1.5, 3], [1, 0, 0, -3]],
      ripple: [[0, 0, 0, 0, 1, 1], [0.5, -3, 0, 0, 1.1, 1], [1, 0, 0, 0, 1, 1]],
    },
  },
  climb: {
    stride: 680,
    tracks: {
      armL: [[0, 0, 0, 0], [0.5, 0, 4, -40], [1, 0, 0, 0]],
      armR: [[0, 0, 0, 0], [0.5, 0, -4, -150], [1, 0, 0, 0]],
      legL: [[0, 0, 0, 0], [0.5, 0, 6, 20], [1, 0, 0, 0]],
      legR: [[0, 0, -6, -18], [0.5, 0, 0, 0], [1, 0, -6, -18]],
      fig: [[0, 0, 0, -3], [0.5, 0, -2, 3], [1, 0, 0, -3]],
    },
  },
  float: {
    stride: 1800,
    tracks: {
      fig: [[0, 0, 0, -2], [0.5, 0, -3, 2], [1, 0, 0, -2]],
      legL: [[0, 0, 0, 0], [0.5, 0, 0, 12], [1, 0, 0, 0]],
      legR: [[0, 0, 0, 0], [0.5, 0, 0, -12], [1, 0, 0, 0]],
      ripple: [[0, 0, 0, 0, 1, 1], [0.5, 0, 0, 0, 1.15, 1], [1, 0, 0, 0, 1, 1]],
    },
  },
}

export function createOtter(svg, { pose: startPose = 'stand', mood = 'happy', intensity = 'full' } = {}) {
  /* A name can be on more than one element (the face's paint and its
     features turn together); a track moves all of them. */
  const parts = {}
  svg.querySelectorAll('[data-p]').forEach((el) => { (parts[el.dataset.p] ||= []).push(el) })
  const still = prefersReducedMotion()

  let pose = startPose
  let book = startPose === 'hold' || startPose === 'float' ? 'closed' : 'none'
  let current = MOODS[mood] ? mood : 'happy'
  let level = intensity
  let acting = null
  let lastEnd = performance.now()
  let lastIdle = null
  let anims = []
  const actTimers = []
  const chainTimers = []
  let feelTimer = 0
  let feeling = null
  let runAnims = null
  let hovering = false
  let onScreen = true
  const face = { eyes: 'open', mouth: 'smile' }

  const each = (part, fn) => parts[part]?.forEach(fn)
  const animate = (part, keyframes, options) => (parts[part] || []).map((el) => el.animate(keyframes, options))

  const setFace = (eyes, mouth) => {
    if (eyes) { face.eyes = eyes; svg.dataset.eyes = eyes }
    if (mouth) { face.mouth = mouth; svg.dataset.mouth = mouth }
  }
  const restFace = () => {
    const m = MOODS[feeling || current] || MOODS.happy
    if (hovering && !feeling) setFace('happy', 'grin')
    else setFace(m.eyes, m.mouth)
  }

  const setBook = (state) => {
    book = BOOK_POSES.has(pose) ? state : 'none'
    svg.dataset.book = book === 'open' ? 'open' : 'closed'
    for (const p of ['armL', 'armR', 'book']) each(p, (el) => { el.style.transform = css(restOf(p, book)) })
  }

  svg.dataset.mood = current
  svg.dataset.pose = pose
  setBook(book)
  restFace()

  /* ── Ambient life ──────────────────────────────────────────────────── */
  const ambient = []
  const ambientTimers = {}
  const alive = () => !still && level !== 'still'
  const loopOn = (part, keyframes, duration, extra = {}) => {
    const list = animate(part, keyframes, { duration, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', composite: ADD ? 'add' : 'replace', ...extra })
    ambient.push(...list)
  }
  const startAmbient = () => {
    if (!alive() || ambient.length) return
    /* The breath lifts the chest, and the shoulders and head with it. */
    loopOn('body', [{ transform: css(REST) }, { transform: css(V(0, 0, 0, 1.004, 1.012)) }], 3400)
    if (ADD) {
      loopOn('head', [{ transform: css(REST) }, { transform: css(V(0, -0.9)) }], 3400)
      loopOn('armL', [{ transform: css(REST) }, { transform: css(V(0, -0.55, -0.8)) }], 3400)
      loopOn('armR', [{ transform: css(REST) }, { transform: css(V(0, -0.55, 0.8)) }], 3400)
      /* The tail sways on its own slower time. */
      loopOn('tail', [{ transform: css(V(0, 0, -2.5)) }, { transform: css(V(0, 0, 3)) }], 4700)
    }
  }
  const stopAmbient = () => { ambient.forEach((a) => a.cancel()); ambient.length = 0 }

  /* Now-and-then events: a blink, an ear flick, a twitch and a sniff. */
  const OPEN_EYES = ['open', 'wide', 'half', 'angry', 'sad', 'squint']
  const blinkOnce = () => animate('lids', [
    { transform: 'translate(0px, 0px)' },
    { transform: 'translate(0px, 38px)', offset: 0.42 },
    { transform: 'translate(0px, 38px)', offset: 0.56 },
    { transform: 'translate(0px, 0px)' },
  ], { duration: 190, easing: 'ease-in-out' })
  const EVENTS = {
    blink: [2400, 5200, () => {
      if (!OPEN_EYES.includes(face.eyes)) return
      blinkOnce()
      if (Math.random() < 0.22) window.setTimeout(blinkOnce, 260)
    }],
    ear: [3800, 9000, () => {
      if (!ADD) return
      const side = Math.random() < 0.5 ? 'L' : 'R'
      const s = side === 'L' ? -1 : 1
      const both = Math.random() < 0.25
      for (const e of both ? ['L', 'R'] : [side]) {
        const k = e === 'L' ? -1 : 1
        animate(`ear${e}`, [
          { transform: css(REST) }, { transform: css(V(0, 0, 15 * k)), offset: 0.2 },
          { transform: css(V(0, 0, -5 * k)), offset: 0.48 }, { transform: css(V(0, 0, 2 * k)), offset: 0.72 }, { transform: css(REST) },
        ], { duration: 560, easing: 'ease-out', composite: 'add' })
      }
      return s
    }],
    twitch: [6000, 13000, () => {
      if (!ADD) return
      animate('nose', [
        { transform: css(REST) }, { transform: css(V(0, -0.3, 0, 1.07, 1.05)), offset: 0.2 }, { transform: css(REST), offset: 0.4 },
        { transform: css(V(0, -0.3, 0, 1.07, 1.05)), offset: 0.6 }, { transform: css(REST), offset: 0.8 }, { transform: css(REST) },
      ], { duration: 720, easing: 'ease-in-out', composite: 'add' })
      animate('whiskers', [
        { transform: css(REST) }, { transform: css(V(0, -0.4, -2.5)), offset: 0.2 }, { transform: css(V(0, 0, 1)), offset: 0.4 },
        { transform: css(V(0, -0.4, -2.5)), offset: 0.6 }, { transform: css(V(0, 0, 1)), offset: 0.8 }, { transform: css(REST) },
      ], { duration: 720, easing: 'ease-in-out', composite: 'add' })
    }],
  }
  const schedule = (name) => {
    clearTimeout(ambientTimers[name])
    if (!alive()) return
    const [min, max, fn] = EVENTS[name]
    ambientTimers[name] = window.setTimeout(() => {
      if (onScreen && !document.hidden) fn()
      schedule(name)
    }, min + Math.random() * (max - min))
  }
  const startEvents = () => Object.keys(EVENTS).forEach(schedule)
  const stopEvents = () => Object.values(ambientTimers).forEach(clearTimeout)

  startAmbient()
  startEvents()

  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting
        ambient.forEach((a) => (onScreen ? a.play() : a.pause()))
      })
    : null
  io?.observe(svg)

  /* ── Acts ──────────────────────────────────────────────────────────── */
  const clear = (list) => { list.forEach(clearTimeout); list.length = 0 }

  const stopAct = () => {
    clear(actTimers)
    clear(chainTimers)
    anims.forEach((a) => a.cancel())
    anims = []
    if (acting) {
      acting = null
      lastEnd = performance.now()
      setBook(book === 'open' ? 'closed' : book)
      restFace()
    }
  }

  const resolve = (name) => ALIASES[name] || name
  const can = (name) => {
    const act = ACTS[resolve(name)]
    if (!act) return false
    if (act.only) return act.only.includes(pose)
    if (act.needsBook && !BOOK_POSES.has(pose)) return false
    if (act.body && (EDGE_POSES.has(pose) || pose === 'hang' || pose === 'float')) return false
    return true
  }

  /* Plays one act; the caller decides whether to clear a chain first. */
  const start = (name) => {
    const n = resolve(name)
    const act = ACTS[n]
    if (!act || !can(n)) return 0
    if (act.needsBook && book === 'none') return chain(['grab', n])

    clear(actTimers)
    anims.forEach((a) => a.cancel())
    anims = []
    if (runAnims) run(false)

    const finalBook = act.book?.length ? act.book[act.book.length - 1][1] : book
    const endBook = BOOK_POSES.has(pose) ? (finalBook === 'open' ? 'closed' : finalBook) : 'none'

    const faceline = act[pose]?.face || act.face || []
    if (still) {
      const last = faceline[faceline.length - 1]
      setBook(endBook)
      if (last) setFace(last[1], last[2])
      actTimers.push(window.setTimeout(restFace, 900))
      return 0
    }

    acting = n
    const dur = act.dur
    const fromBook = book
    const tracks = {}
    for (const [key, track] of Object.entries({ ...act, ...act[pose] })) if (!META.has(key)) tracks[key] = track
    if (act.bookTrack) tracks.book = act.bookTrack
    else if (act.freeHands && fromBook !== 'none') tracks.book = [[0.12, 8, 10, -24, 0, 0], [0.9, 8, 10, -24, 0, 0]]

    for (const { part, frames: f, duration } of build(tracks, dur, { from: (p) => restOf(p, fromBook), to: (p) => restOf(p, endBook) })) {
      anims.push(...animate(part, f, { duration, easing: 'linear' }))
    }
    /* The rest the act lands on is in place underneath it already. */
    setBook(endBook)
    svg.dataset.book = fromBook === 'open' ? 'open' : 'closed'
    for (const [ms, state] of act.book || []) {
      const set = () => { svg.dataset.book = state === 'open' ? 'open' : 'closed' }
      if (ms <= 0) set(); else actTimers.push(window.setTimeout(set, ms))
    }
    for (const [ms, eyes, mouth] of faceline) {
      if (ms <= 0) setFace(eyes, mouth)
      else actTimers.push(window.setTimeout(() => setFace(eyes, mouth), ms))
    }
    actTimers.push(window.setTimeout(() => {
      acting = null
      lastEnd = performance.now()
      svg.dataset.book = book === 'open' ? 'open' : 'closed'
      restFace()
      if (act.then && can(act.then)) start(act.then)
    }, dur))
    return dur + (act.then ? ACTS[act.then].dur : 0)
  }

  function chain(names) {
    const list = names.filter(can)
    let at = 0
    list.forEach((name, i) => {
      if (i === 0) { at = start(name); return }
      chainTimers.push(window.setTimeout(() => start(name), at + 120))
      const a = ACTS[resolve(name)]
      at += 120 + (a?.dur ?? 0)
    })
    return at
  }

  /* ── Being carried: a run, a swim, a climb, a drift ────────────────── */
  function run(on) {
    if (on) {
      if (runAnims || still) return
      clear(actTimers)
      clear(chainTimers)
      anims.forEach((a) => a.cancel())
      anims = []
      acting = null
      const cycle = CARRY[pose] || { stride: STRIDE, tracks: RUN }
      runAnims = build(cycle.tracks, cycle.stride, { from: (p) => restOf(p, book), to: (p) => restOf(p, book), loop: true })
        .flatMap(({ part, frames: f }) => animate(part, f, { duration: cycle.stride, iterations: Infinity, easing: 'linear' }))
      if (book !== 'none' && !CARRY[pose]) {
        runAnims.push(...animate('book', [{ transform: css(REST) }, { transform: css(V(8, 10, -24, 0, 0)) }], { duration: 140, fill: 'forwards' }))
      }
      if (pose === 'climb') setFace('open', 'flat')
      else if (pose === 'float') setFace('happy', 'smile')
      else setFace('open', 'grin')
    } else {
      if (!runAnims) return
      runAnims.forEach((a) => a.cancel())
      runAnims = null
      if (book !== 'none' && !still && !CARRY[pose]) {
        animate('book', [{ transform: css(V(8, 10, -24, 0, 0)) }, { transform: css(V(0, -4, 6, 1.12, 1.12)), offset: 0.6 }, { transform: css(REST) }], { duration: 320, easing: 'ease-out' })
      }
      lastEnd = performance.now()
      restFace()
    }
  }

  return {
    play(name) { clear(chainTimers); return start(name) },
    cue(names) {
      const list = Array.isArray(names) ? names : [names]
      clear(chainTimers)
      return chain(list)
    },
    run,
    stopAct,
    can,
    face: setFace,
    setBook,
    setPose(next) {
      if (!next || next === pose) return
      if (runAnims) run(false)
      stopAct()
      pose = next
      svg.dataset.pose = next
      if (next === 'hold') setBook(book === 'none' ? 'closed' : book)
      else setBook(BOOK_POSES.has(next) ? book : 'none')
      restFace()
    },
    get pose() { return pose },
    get book() { return book },
    hover(on) {
      hovering = on
      if (!acting && !runAnims) restFace()
    },
    feel(name, ms = 2600) {
      if (!MOODS[name]) return
      feeling = name
      clearTimeout(feelTimer)
      if (!acting) restFace()
      feelTimer = window.setTimeout(() => { feeling = null; if (!acting) restFace() }, ms)
    },
    setMood(next) {
      if (!MOODS[next]) return
      current = next
      svg.dataset.mood = next
      if (!acting) restFace()
    },
    setIntensity(next) {
      level = next
      if (next === 'still') { stopAmbient(); stopEvents() } else { startAmbient(); startEvents() }
    },
    idleAct() {
      const key = pose === 'stand' && book !== 'none' ? 'hold' : pose
      const list = (IDLE[key] || IDLE.stand).filter(can)
      lastIdle = pickAct(list, lastIdle)
      return lastIdle
    },
    clickAct(last) {
      const key = pose === 'stand' && book !== 'none' ? 'hold' : pose
      return pickAct((CLICK_ACTS[key] || CLICK_ACTS.stand).filter(can), last)
    },
    get acting() { return acting },
    get running() { return Boolean(runAnims) },
    get sinceAct() { return acting || runAnims ? 0 : performance.now() - lastEnd },
    destroy() {
      clear(actTimers)
      clear(chainTimers)
      clearTimeout(feelTimer)
      stopEvents()
      anims.forEach((a) => a.cancel())
      runAnims?.forEach((a) => a.cancel())
      stopAmbient()
      io?.disconnect()
    },
  }
}
