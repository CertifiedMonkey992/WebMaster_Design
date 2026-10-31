/* ═══════════════════════════════════════════════════════════════════════════
   engine.js — WHAT KEEPS THE OTTER ALIVE
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 13. One controller per drawn otter; one shared
   animation frame for all of them, running only while at least one is on
   screen in a visible tab. Layers, from slowest to fastest:

     mood          the page's temperament (an emotion at half strength)
     emotion       a feeling held for a moment — springs carry the face from
                   one to the next, so curious → surprised → delighted is a
                   continuous change, never a swap
     act           a choreographed gesture (acts.js), added on top
     life          breathing, blinks, saccades, ear flicks, a sniff, small
                   shifts of posture — each on its own jittered timer
     follow-through head lag, ears, scarf and a six-joint tail that are pushed
                   by the motion above them and settle on their own

   Frames: full rate while anything moves more than breathing; half rate
   when only breathing and the tail are moving; none while offscreen, in a
   hidden tab, or under reduced motion (the otter is drawn once, with its
   expression, and redrawn only when that expression changes).
   ═══════════════════════════════════════════════════════════════════════════ */

import { NEUTRAL, EMOTIONS, ARMS, SHOULDER, EYE, NECK, COM, GROUND, EDGE, PEEK_DROP, TAIL, VIEW, blend,
  browPath, upperLid, lowerLid, mouthPath, solveArm, tailPath } from './rig'
import { ACTS, IDLE_ACTS, pickAct } from './acts'
import { prefersReducedMotion, hasFinePointer } from '../../motion/env'
import { idleFor } from '../../motion/idle'

const TAU = Math.PI * 2
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const rand = (a, b) => a + Math.random() * (b - a)
const f = (n) => Math.round(n * 100) / 100

/* ── Springs ───────────────────────────────────────────────────────────────
   [stiffness, damping]. Faces are quick and barely overshoot; the body is
   heavier; ears are light and bouncy, so they keep moving after the head
   stops. */
const FEEL = {
  face:   [230, 27],
  head:   [120, 17],
  body:   [78, 14],
  slow:   [26, 10],
  ear:    [250, 10],
  arm:    [150, 19],
  gaze:   [720, 46],
  follow: [48, 12.5],
  lag:    [300, 19],
  tail:   [70, 6.5],
  scarf:  [90, 7],
}
const GROUP = {
  hx: 'head', hy: 'head', tilt: 'head', turn: 'head', pitch: 'head',
  lean: 'body', sq: 'body', blush: 'slow', breathRate: 'slow', breathAmp: 'slow', tailAmp: 'slow',
  earL: 'ear', earR: 'ear',
}

function spring(x = 0) { return { x, v: 0, t: x } }
function stepSpring(s, [k, c], dt) {
  let left = dt
  while (left > 1e-6) {
    const h = Math.min(1 / 120, left)
    s.v += (-k * (s.x - s.t) - c * s.v) * h
    s.x += s.v * h
    left -= h
  }
  return Math.abs(s.v) > 0.004 || Math.abs(s.x - s.t) > 0.004
}

/* ── Intensity ─────────────────────────────────────────────────────────────
   full   the home page: every idle event, wandering eyes, a nap if left
   calm   the app: the same life, smaller and less often
   quiet  inside a lesson: breathing, blinks and eyes only; reactions to
          the learner's answer still play
   still  a drawing with an expression */
const INTENSITY = {
  full:  { amp: 1,    wander: 1,   posture: true,  nap: 45000, ears: true },
  calm:  { amp: 0.75, wander: 1.5, posture: true,  nap: 70000, ears: true },
  quiet: { amp: 0.6,  wander: 0,   posture: false, nap: 0,     ears: true },
  still: { amp: 0,    wander: 0,   posture: false, nap: 0,     ears: false },
}

/* ── The shared clock ─────────────────────────────────────────────────────── */

const engines = new Set()
let raf = 0
let frameNo = 0
const pointer = { x: 0, y: 0, t: -1e9 }

function onPointer(e) {
  pointer.x = e.clientX
  pointer.y = e.clientY
  pointer.t = performance.now()
  pointer.fine = e.pointerType === 'mouse'
  wake()
}
let bound = false
function bind() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onPointer, { passive: true })
  document.addEventListener('visibilitychange', wake)
  window.addEventListener('scroll', () => engines.forEach((e) => { e.rectAt = 0 }), { passive: true, capture: true })
  window.addEventListener('resize', () => engines.forEach((e) => { e.rectAt = 0 }), { passive: true })
}
function wake() {
  if (!raf && !document.hidden && [...engines].some((e) => e.awake())) raf = requestAnimationFrame(loop)
}
const stats = { frames: 0, ms: 0, worst: 0 }
function loop(ts) {
  /* Held non-zero through the tick, so a wake() from inside it (an act
     starting) cannot schedule a second callback for the same frame. */
  raf = -1
  frameNo++
  const t0 = performance.now()
  let any = false
  for (const e of engines) {
    if (!e.awake()) continue
    any = true
    e.frame(ts, frameNo)
  }
  const cost = performance.now() - t0
  stats.frames++
  stats.ms += cost
  stats.worst = Math.max(stats.worst, cost)
  raf = any && !document.hidden ? requestAnimationFrame(loop) : 0
}
if (typeof window !== 'undefined' && import.meta.env?.DEV) window.__otterStats = stats

/* ── The controller ───────────────────────────────────────────────────────── */

export function createOtter(svg, { pose = 'hold', mood = 'happy', intensity = 'full', moodWeight = 0.55 } = {}) {
  bind()
  const reduced = prefersReducedMotion()
  const parts = {}
  svg.querySelectorAll('[data-o]').forEach((el) => { parts[el.getAttribute('data-o')] = el })
  const written = new Map()
  const put = (el, attr, value) => {
    if (!el) return
    const key = el.getAttribute('data-o') + attr
    if (written.get(key) === value) return
    written.set(key, value)
    el.setAttribute(attr, value)
  }

  const S = {}
  for (const k in NEUTRAL) S[k] = spring(NEUTRAL[k])
  const paw = { lx: spring(), ly: spring(), rx: spring(), ry: spring() }
  const gaze = { x: spring(), y: spring() }
  const follow = { x: spring(), y: spring() }
  const lag = { y: spring(), x: spring() }
  const breathLag = spring()
  const tail = TAIL.rest.map(() => spring())
  const scarf = spring()
  const earKick = { l: spring(), r: spring() }

  const now = () => performance.now()
  const st = {
    pose, mood, moodWeight, intensity: reduced ? 'still' : intensity,
    emotion: null, emotionUntil: 0,
    act: null, fade: null, queue: [],
    hover: false, near: 0,
    breath: Math.random() * TAU, breathPeriod: 4200,
    blinkAt: now() + rand(900, 2600), blink: null,
    earAt: now() + rand(2500, 7000), sniffAt: now() + rand(5000, 11000), sniff: null,
    postureAt: now() + rand(5000, 9000), posture: { lean: 0, tilt: 0, hx: 0 },
    lookAt: now() + rand(1200, 3000), look: [0, 0], microAt: 0, micro: [0, 0],
    nap: 'awake', napSince: 0, nodAt: 0,
    hidden: pose === 'peek',
    visible: false, rect: null,
    tickAt: 0, busyUntil: 0,
    lastAct: null, pebble: 0,
  }
  const self = {
    rectAt: 0,
    awake: () => !reduced && st.intensity !== 'still' && st.visible && !document.hidden,
  }

  /* Paws start where the pose holds them. */
  const restArms = () => (st.pose === 'hold' ? null : st.pose === 'peek' ? ARMS.edge : ARMS.chest)
  {
    const a = restArms() || ARMS.book
    paw.lx.x = paw.lx.t = a.l[0]; paw.ly.x = paw.ly.t = a.l[1]
    paw.rx.x = paw.rx.t = a.r[0]; paw.ry.x = paw.ry.t = a.r[1]
  }

  /* ── What the face is aiming for ── */
  const target = {}
  function aim(t) {
    const feeling = st.emotion && t < st.emotionUntil ? st.emotion : null
    if (!feeling && st.emotion) st.emotion = null
    const napMood = st.nap === 'asleep' ? 'asleep' : st.nap === 'drowsy' ? 'sleepy' : null
    if (napMood) blend(napMood, 1, target)
    else if (feeling) blend(feeling, 1, target)
    else blend(st.mood, st.moodWeight, target)

    /* Pointing at it: it brightens. Coming near: it pays attention. */
    const amp = INTENSITY[st.intensity].amp
    if (st.hover && !napMood) {
      target.smile += 0.3; target.lb += 0.18; target.brL += 3; target.brR += 3
      target.blush += 0.25; target.earL += 7; target.earR += 7; target.pupil += 0.08; target.open += 0.12
    } else if (st.near > 0 && !napMood) {
      target.earL += 5 * st.near; target.earR += 5 * st.near; target.brL += 1.5 * st.near; target.brR += 1.5 * st.near
      target.pupil += 0.05 * st.near
    }
    target.lean += st.posture.lean * amp
    target.tilt += st.posture.tilt * amp
    target.hx += st.posture.hx * amp
    for (const k in NEUTRAL) S[k].t = target[k]

    /* Paws: an emotion may ask for a pose where the paws are free. */
    const free = st.pose === 'cheer' || st.pose === 'perch'
    const want = (feeling || napMood) && EMOTIONS[feeling || napMood].arms
    const arms = free && want ? ARMS[want] : st.pose === 'hold' && feeling === 'thinking' ? { l: null, r: ARMS.chin.r } : null
    return arms
  }

  /* ── Acts ── */
  function play(name, opts = {}) {
    const def = ACTS[name]
    if (!def) return 0
    if (def.poses && !def.poses.includes(st.pose)) return 0
    if (reduced || st.intensity === 'still') {
      feel(def.emote || def.after || 'happy', 1600)
      return 0
    }
    if (st.act) captureFade()
    const vary = { s: rand(0.92, 1.08), a: rand(0.88, 1.12), r: Math.random(), side: Math.random() < 0.5 ? -1 : 1 }
    const dur = def.dur / vary.s
    if (import.meta.env?.DEV) (window.__otterLog = window.__otterLog || []).push([Math.round(now()), st.pose, name])
    st.act = { name, def, start: now(), dur, vary, cue: 0, opts }
    st.lastAct = name
    if (def.emote) feel(def.emote, dur + 200)
    if (def.front) front(def.front, true)
    wake()
    return dur + (def.afterMs || 0)
  }
  function captureFade() {
    if (!st.act) return
    const o = {}
    sample(st.act, now(), o)
    st.fade = { o, start: now(), dur: 240 }
    endAct(true)
  }
  function endAct(cut) {
    const a = st.act
    if (!a) return
    st.act = null
    st.actEnd = now()
    if (a.def.front) front(a.def.front, false)
    if (!cut && a.def.after) feel(a.def.after, a.def.afterMs || 1200)
    if (cut && a.def.emote && st.emotion === a.def.emote) st.emotionUntil = now() + 120
    if (cut) return
    while (st.queue.length) if (play(st.queue.shift())) break
  }
  function sample(a, t, o) {
    const local = (t - a.start) * a.vary.s
    a.def.run(local, o, a.vary, st.pose)
    return local
  }
  function stopAct() { st.queue.length = 0; if (st.act) captureFade() }

  /* A reaction the page asks for: now if the otter can be seen, otherwise
     the moment it first is (a peeking otter climbs up first). */
  function cue(names) {
    const list = (Array.isArray(names) ? names : [names]).filter((n) => ACTS[n])
    if (import.meta.env?.DEV) (window.__otterLog = window.__otterLog || []).push([Math.round(now()), st.pose, 'cue:' + list.join('+'), st.visible ? 'visible' : 'hidden', engines.has(self) ? 'live' : 'dead'])
    if (!list.length) return
    if (reduced || st.intensity === 'still') { const last = ACTS[list[list.length - 1]]; feel(last.after || last.emote || 'happy', 1800); return }
    if (!st.visible || st.hidden) { st.pending = list; st.pendingAt = now(); return }
    if (st.act) st.queue.push(...list)
    else sequence(list)
  }
  function sequence(names) {
    const [first, ...rest] = names.filter((n) => ACTS[n] && (!ACTS[n].poses || ACTS[n].poses.includes(st.pose)))
    if (!first) return 0
    let total = play(first)
    st.queue = rest
    rest.forEach((n) => { total += (ACTS[n].dur || 0) + (ACTS[n].afterMs || 0) })
    return total
  }
  function front(part, on) {
    const el = parts[part]
    const anchor = parts.head
    if (!el || !anchor) return
    if (on) anchor.parentNode.insertBefore(el, anchor.nextSibling)
    else anchor.parentNode.insertBefore(el, anchor)
  }

  function feel(name, ms = 1400) {
    if (!EMOTIONS[name]) return
    st.emotion = name
    st.emotionUntil = now() + ms
    st.busyUntil = now() + 900
    if (reduced || st.intensity === 'still') drawStill()
    wake()
  }

  /* ── Life: the timers ── */
  function life(t, dt) {
    const I = INTENSITY[st.intensity]

    /* Breathing: an inhale a little quicker than the exhale, a rest at the
       bottom, and no two breaths the same length. */
    const rate = S.breathRate.x
    st.breath += (dt * 1000 * TAU) / (st.breathPeriod / Math.max(0.3, rate))
    if (st.breath > TAU) { st.breath -= TAU; st.breathPeriod = rand(3700, 4900) }

    /* Blinks: jittered, sometimes double, sometimes half; slower when sleepy. */
    if (!st.blink && t > st.blinkAt) {
      const sleepy = st.nap !== 'awake' || st.emotion === 'sleepy'
      const r = Math.random()
      st.blink = { start: t, dur: sleepy ? rand(380, 560) : rand(150, 200), depth: r < 0.07 ? 0.6 : 1 }
      const double = r > 0.82
      st.blinkAt = t + (double ? rand(240, 300) : sleepy ? rand(1800, 3800) : Math.exp(rand(Math.log(1800), Math.log(6200))))
    }
    if (st.blink && t - st.blink.start > st.blink.dur) st.blink = null

    if (I.ears && t > st.earAt) {
      const side = Math.random() < 0.5 ? earKick.l : earKick.r
      side.v += rand(-1, 1) < 0 ? -rand(160, 260) : rand(200, 320)
      if (Math.random() < 0.3) window.setTimeout(() => { side.v += rand(160, 240) }, 170)
      st.earAt = t + rand(3500, 10000)
    }
    if (I.wander && t > st.sniffAt) {
      st.sniff = { start: t }
      st.sniffAt = t + rand(7000, 16000)
    }
    if (st.sniff && t - st.sniff.start > 620) st.sniff = null

    if (I.posture && t > st.postureAt && !st.act) {
      st.posture = { lean: rand(-2.2, 2.2), tilt: rand(-4.5, 4.5), hx: rand(-1.6, 1.6) }
      st.postureAt = t + rand(6000, 15000)
    }

    /* Eyes: the pointer if there is one and it is moving; otherwise the
       otter looks about — at the reader more often than anywhere else. */
    const live = t - pointer.t < 2600 && pointer.fine !== false && hasFinePointer()
    let gx = 0
    let gy = 0
    if (live && st.rect) {
      const [vw, vh, top] = VIEW[st.pose]
      const r = st.rect
      const ex = r.left + (120 / vw) * r.width
      const ey = r.top + ((EYE.l.y + (st.pose === 'peek' ? PEEK_DROP : 0) - top) / vh) * r.height
      gx = clamp((pointer.x - ex) / 280, -1, 1)
      gy = clamp((pointer.y - ey) / 240, -1, 1)
      const dist = Math.hypot(pointer.x - ex, pointer.y - (r.top + r.height / 2))
      st.near = clamp(1.6 - dist / Math.max(140, r.width), 0, 1)
    } else {
      st.near = 0
      if (I.wander && t > st.lookAt) {
        const before = st.look
        st.look = Math.random() < 0.45 ? [0, 0] : [rand(-0.9, 0.9), rand(-0.55, 0.45)]
        if (Math.hypot(st.look[0] - before[0], st.look[1] - before[1]) > 0.7 && Math.random() < 0.4 && !st.blink) st.blinkAt = t
        st.lookAt = t + rand(1300, 4200) * I.wander
      }
      ;[gx, gy] = I.wander ? st.look : [0, 0]
    }
    const feeling = st.emotion && t < st.emotionUntil ? EMOTIONS[st.emotion] : null
    const napGaze = st.nap !== 'awake' ? [0, 0.4] : null
    const held = napGaze || (feeling && feeling.gaze)
    if (held) [gx, gy] = held
    if (t > st.microAt) {
      st.micro = [rand(-0.06, 0.06), rand(-0.05, 0.05)]
      st.microAt = t + rand(350, 1400)
    }
    gaze.x.t = gx + st.micro[0]
    gaze.y.t = gy + st.micro[1]
    follow.x.t = gx * 0.34
    follow.y.t = gy * 0.26

    /* Left alone long enough, it dozes; any sign of the reader wakes it. */
    if (I.nap && st.pose !== 'peek') {
      const idle = idleFor()
      if (st.nap === 'awake' && idle > I.nap && !st.act) {
        st.nap = 'drowsy'
        st.napSince = t
        st.nodAt = t + rand(1500, 3000)
      } else if (st.nap === 'drowsy' && t - st.napSince > 11000) {
        st.nap = 'asleep'
      } else if (st.nap !== 'awake' && idle < 500) {
        const was = st.nap
        st.nap = 'awake'
        play(was === 'asleep' ? 'startle' : 'shakeOff')
      }
      if (st.nap === 'drowsy' && !st.act && t > st.nodAt) {
        play('nodOff')
        st.nodAt = t + rand(4000, 6500)
      }
    }
  }

  /* ── One frame ── */
  const o = {}
  function frame(ts, n) {
    const t = now()
    /* Full rate while something visibly moves; breathing and a slow drift
       of the eyes are smooth at half. */
    const calm = t > st.busyUntil && !st.act && !st.fade && !st.blink && !st.sniff && !st.hover && t - pointer.t > 1200
    if (calm && n % 2) return
    const dt = Math.min(0.066, st.tickAt ? (ts - st.tickAt) / 1000 : 1 / 60)
    st.tickAt = ts
    if (!st.rect || t - self.rectAt > 400) { measure(); self.rectAt = t }

    life(t, dt)
    const arms = aim(t)

    for (const k in o) delete o[k]
    if (st.act) {
      const local = sample(st.act, t, o)
      const cues = st.act.def.cues
      while (cues && st.act.cue < cues.length && local >= cues[st.act.cue][0]) {
        const [, kind, arg, ms] = cues[st.act.cue++]
        if (kind === 'feel') feel(arg, ms ?? 1200)
        if (kind === 'kick') tail.forEach((s, i) => { s.v += arg * (0.6 + i * 0.25) })
      }
      if (local >= st.act.def.dur) endAct(false)
    }
    if (st.fade) {
      const u = (t - st.fade.start) / st.fade.dur
      if (u >= 1) st.fade = null
      else {
        const k = 1 - u * u * (3 - 2 * u)
        for (const key in st.fade.o) {
          if (key.endsWith('w')) o[key] = Math.max(o[key] || 0, st.fade.o[key] * k)
          else if (o[key] == null) o[key] = st.fade.o[key] * k
          else if (typeof st.fade.o[key] === 'number' && !/^[LR][xy]$/.test(key) && !/^g[xy]$/.test(key)) o[key] += st.fade.o[key] * k
        }
        for (const key of ['Lx', 'Ly', 'Rx', 'Ry', 'gx', 'gy']) if (o[key] == null && st.fade.o[key] != null) o[key] = st.fade.o[key]
      }
    }

    for (const k in S) stepSpring(S[k], FEEL[GROUP[k] || 'face'], dt)

    /* paws */
    const rest = restArms()
    const base = arms || rest
    if (base) {
      if (base.l) { paw.lx.t = base.l[0]; paw.ly.t = base.l[1] } else if (rest) { paw.lx.t = rest.l[0]; paw.ly.t = rest.l[1] }
      if (base.r) { paw.rx.t = base.r[0]; paw.ry.t = base.r[1] }
    }
    const book = bookPose(o)
    if (st.pose === 'hold') {
      if (!arms || !arms.l) { paw.lx.t = book.l[0]; paw.ly.t = book.l[1] }
      if (!arms || !arms.r) { paw.rx.t = book.r[0]; paw.ry.t = book.r[1] }
    }
    for (const k in paw) stepSpring(paw[k], FEEL.arm, dt)
    stepSpring(gaze.x, FEEL.gaze, dt)
    stepSpring(gaze.y, FEEL.gaze, dt)
    stepSpring(follow.x, FEEL.follow, dt)
    stepSpring(follow.y, FEEL.follow, dt)

    /* Follow-through: the head lags the body, ears and tail are pushed by
       what moves under them. */
    const by = o.by || 0
    const bx = o.bx || 0
    const vyBefore = lag.y.v
    lag.y.t = by
    lag.x.t = bx
    stepSpring(lag.y, FEEL.lag, dt)
    stepSpring(lag.x, FEEL.lag, dt)
    const jolt = (lag.y.v - vyBefore) / Math.max(dt, 1e-3)
    const tiltV = S.tilt.v
    earKick.l.v += (-tiltV * 0.5 + jolt * 0.004) * dt * 60
    earKick.r.v += (tiltV * 0.5 + jolt * 0.004) * dt * 60
    stepSpring(earKick.l, FEEL.ear, dt)
    stepSpring(earKick.r, FEEL.ear, dt)

    const amp = INTENSITY[st.intensity].amp
    const tailAmp = S.tailAmp.x * amp + (o.tail || 0)
    tail.forEach((s, i) => {
      const wave = Math.sin(t / 1000 * TAU * 0.16 - i * 0.65) * (2 + i * 2.2) * tailAmp
      const swish = Math.sin(t / 1000 * TAU * 0.41 - i * 0.9) * i * 0.9 * tailAmp
      s.t = wave + swish + (o.tailCurl || 0) * (i / 5) - (S.lean.x * 0.4)
      s.v += jolt * 0.0016 * (i + 1) * dt * 60
      stepSpring(s, FEEL.tail, dt)
    })
    scarf.t = Math.sin(t / 1000 * TAU * 0.3) * 4 * amp + S.lean.x * 0.8 + (o.scarf || 0)
    scarf.v += (jolt * 0.006 + lag.x.v * 0.05) * dt * 60
    stepSpring(scarf, FEEL.scarf, dt)
    breathLag.t = breathOf(st.breath)
    stepSpring(breathLag, FEEL.follow, dt)

    draw(t, o, book)
  }

  /* Its size on screen: the eyes aim from it, and below 90px the finest
     lines (whiskers, whisker dots) are dropped. */
  function measure() {
    st.rect = svg.getBoundingClientRect()
    const small = st.rect.width > 0 && st.rect.width < 90
    if (small !== st.small) { st.small = small; svg.classList.toggle('ot--small', small) }
  }

  /* where the book is, and where it wants the paws */
  function bookPose(oo) {
    const cx = 120 + (oo.bookX || 0)
    const cy = 214 + (oo.bookY || 0)
    const rot = -5 + (oo.bookR || 0)
    const r = (rot * Math.PI) / 180
    const at = ([lx, ly]) => [cx + lx * Math.cos(r) - ly * Math.sin(r), cy + lx * Math.sin(r) + ly * Math.cos(r)]
    return { cx, cy, rot, s: 1 + (oo.bookS || 0), l: at([-24, -4]), r: at([25, -9]) }
  }

  function breathOf(phase) {
    const u = phase / TAU
    const eio = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1))
    return u < 0.38 ? eio(u / 0.38) : u < 0.86 ? 1 - eio((u - 0.38) / 0.48) : 0
  }

  /* ── Drawing ── */
  function draw(t, oo, book) {
    const P = {}
    for (const k in S) P[k] = S[k].x + (oo[k] || 0)
    const amp = INTENSITY[st.intensity].amp
    const b = breathOf(st.breath) * S.breathAmp.x * amp
    const peek = st.pose === 'peek'

    /* blink and wink */
    let bk = 0
    if (st.blink) {
      const u = (t - st.blink.start) / st.blink.dur
      bk = (u < 0.4 ? (u / 0.4) ** 2 : u < 0.5 ? 1 : 1 - ((u - 0.5) / 0.5) ** 0.7 * 1) * st.blink.depth
      bk = clamp(bk, 0, 1)
    }
    bk = Math.max(bk, oo.blink || 0)
    const ltL = lerp(P.ltL, 1.04, Math.max(bk, oo.winkL || 0))
    const ltR = lerp(P.ltR, 1.04, Math.max(bk, oo.winkR || 0))
    const lb = P.lb + bk * 0.12

    /* gaze, with an act's override */
    const gw = clamp(oo.gw || 0, 0, 1)
    const gx = lerp(gaze.x.x, oo.gx ?? 0, gw)
    const gy = lerp(gaze.y.x, oo.gy ?? 0, gw)
    const turn = P.turn + follow.x.x * (1 - gw * 0.5)
    const pitch = P.pitch + follow.y.x * (1 - gw * 0.5)

    /* root: jump, squash and stretch about the feet, spin about the middle */
    const sq = P.sq
    const flip = Math.cos(TAU * (oo.flip || 0))
    const sx = (1 + sq * 0.7) * flip
    const sy = 1 - sq
    const rootY = (peek ? PEEK_DROP + (st.hidden ? 130 : 0) : 0) + (oo.by || 0)
    const G = st.pose === 'perch' ? EDGE.perch : GROUND
    put(parts.figure, 'transform',
      `translate(${f(oo.bx || 0)} ${f(rootY)}) rotate(${f(oo.spin || 0)} ${COM.x} ${COM.y}) translate(120 ${G}) scale(${f(sx)} ${f(sy)}) translate(-120 -${G})`)
    if (parts.shadow) {
      const h = clamp(-(oo.by || 0) / 90, 0, 0.6)
      put(parts.shadow, 'transform', `translate(${f((oo.bx || 0) * 0.8)} 0) translate(120 ${G}) scale(${f((1 - h) * (1 + sq * 0.5))} 1) translate(-120 -${G})`)
      put(parts.shadow, 'opacity', f(1 - h * 0.9))
    }

    put(parts.lean, 'transform', `rotate(${f(P.lean)} 120 262)`)
    put(parts.torso, 'transform', `translate(120 272) scale(${f(1 + 0.013 * b)} ${f(1 + 0.024 * b)}) translate(-120 -272)`)
    const lift = -2.6 * b + (oo.lift || 0)
    put(parts.upper, 'transform', `translate(0 ${f(lift)})`)

    /* head: placed, tilted about the neck, lagging the body */
    const hlx = (lag.x.x - (oo.bx || 0)) * 0.5
    const hly = (lag.y.x - (oo.by || 0)) * 0.45 - (breathLag.x - breathOf(st.breath)) * 1.2 * amp
    /* The skull is rigid: undo most of the body's squash on the head. */
    const hsx = (1 / (1 + sq * 0.7)) ** 0.7
    const hsy = (1 / Math.max(0.5, 1 - sq)) ** 0.7
    put(parts.head, 'transform', `translate(${f(P.hx + hlx)} ${f(P.hy + hly)}) rotate(${f(P.tilt)} ${NECK.x} ${NECK.y}) translate(${NECK.x} ${NECK.y}) scale(${f(hsx)} ${f(hsy)}) translate(${-NECK.x} ${-NECK.y})`)
    put(parts.face, 'transform', `translate(${f(turn * 6.5)} ${f(pitch * 5)})`)
    const sniff = st.sniff ? Math.max(0, Math.sin(((t - st.sniff.start) / 620) * Math.PI * 3)) : 0
    const noseS = 1 - sniff * 0.07 - (oo.nose || 0)
    put(parts.muzzle, 'transform', `translate(${f(turn * 3.6)} ${f(pitch * 2.6 - sniff * 0.6)})`)
    put(parts.whiskers, 'transform', `translate(${f(turn * 10.1)} ${f(pitch * 7.6 - sniff * 0.6 - Math.max(0, P.smile) * 1.4)})`)
    put(parts.nose, 'transform', `translate(120 109) scale(${f(1 + sniff * 0.04 + b * 0.02)} ${f(noseS)}) translate(-120 -109)`)

    const eL = P.earL + earKick.l.x
    const eR = P.earR + earKick.r.x
    put(parts.earL, 'transform', `translate(${f(turn * 2 - pitch * 0)} ${f(-pitch * 2)}) rotate(${f(eL)} 64 74)`)
    put(parts.earR, 'transform', `translate(${f(turn * 2)} ${f(-pitch * 2)}) rotate(${f(-eR)} 176 74)`)

    /* eyes */
    const far = clamp(turn, -1, 1)
    for (const side of ['l', 'r']) {
      const e = EYE[side]
      const squish = side === 'r' ? 1 - Math.max(0, far) * 0.16 + Math.max(0, -far) * 0.04 : 1 - Math.max(0, -far) * 0.16 + Math.max(0, far) * 0.04
      put(parts['eye' + side], 'transform', `translate(${e.x} ${e.y}) scale(${f(squish)} 1) translate(${-e.x} ${-e.y})`)
      const cross = (P.cross || 0) * (side === 'l' ? 5.2 : -5.2)
      const spin = oo.eyeSpin ? Math.sin(oo.eyeSpin + (side === 'l' ? 0 : Math.PI)) : 0
      const spinY = oo.eyeSpin ? Math.cos(oo.eyeSpin + (side === 'l' ? 0 : Math.PI)) : 0
      const ix = clamp(gx, -1, 1) * 3.4 + cross + spin * 3
      const iy = clamp(gy, -1, 1) * 3 + spinY * 3
      const ps = clamp(P.pupil, 0.6, 1.3)
      put(parts['iris' + side], 'transform', `translate(${f(e.x + ix)} ${f(e.y + 1 + iy)}) scale(${f(ps)})`)
      put(parts['glint' + side], 'transform', `translate(${f(-ix * 0.35 / ps)} ${f(-iy * 0.35 / ps)})`)
      const close = side === 'l' ? ltL : ltR
      const up = upperLid(side, close, P.lsl)
      put(parts['lid' + side], 'd', up.lid)
      put(parts['lash' + side], 'd', up.lash)
      /* a closing eye's lower lid rises to meet the upper one */
      const raise = Math.max(lb, clamp((close - 0.55) / 0.45, 0, 1) * 0.44)
      const low = lowerLid(side, raise)
      put(parts['low' + side], 'd', low.lid)
      put(parts['lowlash' + side], 'd', low.lash)
      put(parts['lowlash' + side], 'opacity', f(clamp((lb - 0.22) * 3.5, 0, 1)))
    }
    put(parts.browl, 'd', browPath('l', P.brL, P.btL, P.arch))
    put(parts.browr, 'd', browPath('r', P.brR, P.btR, P.arch))

    /* mouth */
    const m = mouthPath(clamp(P.smile, -1, 1.1), clamp(P.open, 0, 1.2), clamp(P.mw, 0.45, 1.4), clamp(P.skew, -1.2, 1.2))
    put(parts.lips, 'd', m.lips)
    put(parts.mouth, 'd', m.inside)
    put(parts.mouthClip, 'd', m.inside)
    put(parts.lowerLip, 'd', m.lowerLip)
    put(parts.mouth, 'opacity', f(clamp(P.open * 7, 0, 1)))
    put(parts.lowerLip, 'opacity', f(clamp(P.open * 7, 0, 1)))
    put(parts.tongue, 'transform', `translate(${m.tongue.x} ${f(m.tongue.y + (oo.tongue || 0) * 7)}) scale(${m.tongue.rx} ${f(m.tongue.ry + (oo.tongue || 0) * 3)})`)
    put(parts.tongueOut, 'opacity', f(clamp((oo.tongue || 0) * 3, 0, 1)))

    const whisk = P.whisk - P.smile * 5 + sniff * 6
    put(parts.whiskl, 'transform', `rotate(${f(whisk)} 94 120)`)
    put(parts.whiskr, 'transform', `rotate(${f(-whisk)} 146 120)`)
    put(parts.pads, 'transform', `translate(0 ${f(-Math.max(0, P.smile) * 1.4)})`)
    put(parts.blush, 'opacity', f(clamp(0.12 + P.blush * 0.5, 0, 0.62)))

    /* scarf, tail, feet */
    put(parts.scarfEnds, 'transform', `rotate(${f(scarf.x)} 84 152)`)
    if (parts.tail) {
      const angles = TAIL.rest.map((r, i) => r + tail[i].x)
      put(parts.tail, 'd', tailPath(angles))
    }
    if (parts.footl) {
      const kick = (oo.fL || 0) + Math.sin(t / 1000 * TAU * 0.21) * 2 * amp
      const kickR = (oo.fR || 0) + Math.sin(t / 1000 * TAU * 0.17 + 2) * 2 * amp
      put(parts.footl, 'transform', `rotate(${f(kick)} 101 262)`)
      put(parts.footr, 'transform', `rotate(${f(-kickR)} 139 262)`)
    }

    /* the book, the pebble */
    if (parts.book) {
      put(parts.book, 'transform', `translate(${f(book.cx)} ${f(book.cy)}) rotate(${f(book.rot)}) scale(1 ${f(book.s)})`)
      const page = oo.page || 0
      put(parts.page, 'transform', `scale(${f(Math.cos(page * Math.PI))} 1)`)
      put(parts.page, 'opacity', page > 0.02 && page < 0.98 ? '1' : '0')
    }
    if (parts.pebble) {
      put(parts.pebble, 'transform', `translate(${f(oo.pebX || 120)} ${f(oo.pebY || 190)}) scale(${f(clamp(oo.peb || 0, 0, 1))})`)
    }

    /* arms */
    const pawAt = (side) => {
      const S2 = side === 'l' ? [paw.lx.x, paw.ly.x] : [paw.rx.x, paw.ry.x]
      const w = clamp(oo[side === 'l' ? 'Lw' : 'Rw'] || 0, 0, 1)
      const X = side === 'l' ? 'L' : 'R'
      const tx = lerp(S2[0], oo[X + 'x'] ?? S2[0], w) + (oo[X + 'dx'] || 0)
      const ty = lerp(S2[1], oo[X + 'y'] ?? S2[1], w) + (oo[X + 'dy'] || 0)
      return [tx, ty, oo[X + 'r'] || 0]
    }
    for (const side of ['l', 'r']) {
      const [tx, ty, rot] = pawAt(side)
      if (peek) {
        /* Over the frame edge: a forearm rising from behind it and a paw. */
        const sx2 = side === 'l' ? 56 : 184
        const ang = Math.atan2(ty - (EDGE.peek + 40), tx - sx2) * 180 / Math.PI
        const grab = clamp(oo.pawS ?? 1, 0, 1.3)
        put(parts['fore' + side], 'd', `M${sx2} ${EDGE.peek + 40}L${f(tx)} ${f(ty)}`)
        put(parts['paw' + side], 'transform', `translate(${f(tx)} ${f(ty)}) rotate(${f(ang + 90 + rot)}) scale(${f(grab)})`)
        continue
      }
      const sh = SHOULDER[side]
      const arm = solveArm(sh.x, sh.y, tx, ty, side === 'l' ? 1 : -1)
      put(parts['upper' + side], 'd', arm.upper)
      put(parts['fore' + side], 'd', arm.fore)
      put(parts['paw' + side], 'transform', `translate(${f(arm.wx)} ${f(arm.wy)}) rotate(${f(arm.angle - 90 + rot)})`)
    }
  }

  /* Reduced motion and `still`: the expression, drawn once. `oo` lets the
     dev tools draw one frame of an act. */
  function drawStill(oo = {}) {
    const arms = aim(now())
    for (const k in S) { S[k].x = S[k].t; S[k].v = 0 }
    const feeling = st.emotion ? EMOTIONS[st.emotion] : null
    const [gx, gy] = (feeling && feeling.gaze) || [0, 0]
    gaze.x.x = gx; gaze.y.x = gy
    follow.x.x = gx * 0.34; follow.y.x = gy * 0.26
    const rest = restArms()
    const base = arms || rest
    const book = bookPose(oo)
    if (st.pose === 'hold') {
      paw.lx.x = arms?.l?.[0] ?? book.l[0]; paw.ly.x = arms?.l?.[1] ?? book.l[1]
      paw.rx.x = arms?.r?.[0] ?? book.r[0]; paw.ry.x = arms?.r?.[1] ?? book.r[1]
    } else if (base) {
      paw.lx.x = (base.l || rest.l)[0]; paw.ly.x = (base.l || rest.l)[1]
      paw.rx.x = base.r[0]; paw.ry.x = base.r[1]
    }
    st.breath = 0
    st.blink = null
    draw(now(), oo, book)
    if (st.emotion && st.emotionUntil < 1e12) window.setTimeout(() => { if (now() >= st.emotionUntil && (reduced || st.intensity === 'still')) drawStill() }, Math.max(0, st.emotionUntil - now()) + 30)
  }

  /* ── Visibility ── */
  const io = new IntersectionObserver(([entry]) => {
    st.visible = entry.isIntersecting
    if (st.visible) {
      self.rectAt = 0
      /* a reaction kept waiting offscreen goes stale after a minute and a half */
      const pending = st.pending && now() - st.pendingAt < 90000 ? st.pending : null
      st.pending = null
      if (st.hidden && !reduced) {
        st.hidden = false
        play('rise')
        if (pending) st.queue.push(...pending)
      } else if (pending) sequence(pending)
      wake()
    }
  }, { threshold: 0.3 })
  io.observe(svg)

  Object.assign(self, {
    frame,
    play,
    sequence,
    cue,
    feel,
    stopAct,
    /** Can this pose perform `name`? */
    can: (name) => Boolean(ACTS[name] && (!ACTS[name].poses || ACTS[name].poses.includes(st.pose))),
    setMood(m, w) {
      if (!EMOTIONS[m]) return
      st.mood = m
      st.busyUntil = now() + 1200
      if (w != null) st.moodWeight = w
      if (reduced || st.intensity === 'still') drawStill()
      wake()
    },
    setIntensity(i) {
      if (!INTENSITY[i]) return
      st.intensity = reduced ? 'still' : i
      if (st.intensity === 'still') drawStill()
      wake()
    },
    /** A click that lands while a reaction is still starting: a bounce, not a new act. */
    nudge() {
      S.sq.v += 1.6
      earKick.l.v += 160
      earKick.r.v += 160
      wake()
    },
    hover(on) {
      st.hover = on
      if (on) {
        earKick.l.v += 220; earKick.r.v += 220
        S.sq.v -= 1.2
        if (st.nap !== 'awake') { st.nap = 'awake'; play('startle') }
      }
      if (reduced || st.intensity === 'still') drawStill()
      wake()
    },
    /** Pick an idle act for the Stage, never the one just played. */
    idleAct() { return pickAct(IDLE_ACTS[st.pose] || [], st.lastAct) },
    destroy() {
      io.disconnect()
      engines.delete(self)
    },
  })

  /* Live getters: Object.assign above would have copied their values once. */
  Object.defineProperties(self, {
    pose: { get: () => st.pose },
    acting: { get: () => st.act?.name ?? null },
    /* ms since the last act ended: a gesture is given room to land */
    sinceAct: { get: () => (st.act ? 0 : now() - (st.actEnd || 0)) },
    /* watching the reader's pointer close by: idle acts wait */
    attending: { get: () => st.near > 0.25 && now() - pointer.t < 1500 },
    napping: { get: () => st.nap !== 'awake' },
  })

  engines.add(self)
  measure()
  if (reduced || st.intensity === 'still') { st.hidden = false; drawStill() }
  else {
    st.breath = Math.random() * TAU
    draw(now(), {}, bookPose({}))
  }
  if (import.meta.env?.DEV) {
    /* Dev: freeze one frame of an act, for contact sheets. */
    self.svgEl = svg
    self.__scrub = (name, at) => {
      const def = ACTS[name]
      if (!def) return
      st.intensity = 'still'
      st.act = null
      st.emotion = def.emote || null
      for (const [ct, kind, arg] of def.cues || []) if (ct <= at && kind === 'feel') st.emotion = arg
      st.emotionUntil = 1e13
      st.hidden = false
      const oo = {}
      def.run(at, oo, { s: 1, a: 1, r: 0.3, side: 1 }, st.pose)
      drawStill(oo)
    }
    window.__otters = window.__otters || new Set()
    window.__otters.add(self)
    const destroy = self.destroy
    self.destroy = () => { window.__otters.delete(self); destroy() }
  }
  return self
}
