/* ═══════════════════════════════════════════════════════════════════════════
   engine.js — WHAT MAKES THE OTTER MOVE
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 15 → The otter. One engine per drawing. It
   plays acts (acts.js) as Web Animations on the drawing's parts — moving
   them, and fading the emotes in and out — swaps the face, carries the book
   between "none", "closed" and "open", changes pose at run time (the pose
   layers are CSS, so a change of pose is itself a short move), runs a
   carrying cycle while something moves it, and keeps two sanctioned ambient
   motions: a breath and a blink, both only while the otter is on screen.

   Nothing here decides when to perform: the Stage (an idle turn), a scene
   or lane, a click or a real event does.

   Under reduced motion it never moves: an act sets the face it would end
   on and the book it would end with, and nothing else.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion } from '../../motion/env'
import { ACTS, ALIASES, BOOK_POSES, CLICK_ACTS, EDGE_POSES, IDLE, MOODS, pickAct } from './acts'

const T = (x = 0, y = 0, r = 0, sx = 1, sy = sx) =>
  `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`
const REST = T()
const SEG = 'cubic-bezier(0.45, 0, 0.4, 1)'

const isEmote = (part) => part.startsWith('e_')

/* Where a part rests, given what is in the otter's paws. */
function restOf(part, book) {
  if (isEmote(part)) return { transform: REST, opacity: 0 }
  const held = book !== 'none'
  if (part === 'armL') return { transform: held ? T(0, 0, -30) : REST }
  if (part === 'armR') return { transform: held ? T(0, 0, 30) : REST }
  if (part === 'book') return { transform: held ? REST : T(10, 10, -30, 0, 0) }
  return { transform: REST }
}

/* A track row is [offset, x, y, rotate, scaleX, scaleY, opacity]. */
const toFrames = (track, from, to, emote = false) => {
  const frames = track.map(([o, x, y, r, sx, sy, op]) => {
    const f = { offset: o, transform: T(x, y, r, sx, sy), easing: SEG }
    if (op != null) f.opacity = op
    else if (emote) f.opacity = 1
    return f
  })
  if (frames[0]?.offset !== 0) frames.unshift({ offset: 0, ...from, easing: SEG })
  if (frames[frames.length - 1]?.offset !== 1) frames.push({ offset: 1, ...to })
  return frames
}

/* The run cycle, one stride. */
const STRIDE = 360
const RUN = {
  legL: [[0, 0, 0, 34], [0.5, 0, -3, -34], [1, 0, 0, 34]],
  legR: [[0, 0, -3, -34], [0.5, 0, 0, 34], [1, 0, -3, -34]],
  armL: [[0, 0, 0, -40], [0.5, 0, 0, 40], [1, 0, 0, -40]],
  armR: [[0, 0, 0, 40], [0.5, 0, 0, -40], [1, 0, 0, 40]],
  fig:  [[0, 0, 0, 8], [0.25, 0, -6, 8, 0.97, 1.03], [0.5, 0, 0, 8, 1.03, 0.97], [0.75, 0, -6, 8, 0.97, 1.03], [1, 0, 0, 8]],
  head: [[0, 0, 0, -4], [0.5, 0, 1.5, -2], [1, 0, 0, -4]],
  tail: [[0, 0, 0, -12], [0.5, 0, 0, 12], [1, 0, 0, -12]],
  shadow: [[0, 0, 0, 0, 1, 1], [0.25, 0, 0, 0, 0.8, 1], [0.5, 0, 0, 0, 1, 1], [0.75, 0, 0, 0, 0.8, 1], [1, 0, 0, 0, 1, 1]],
}
/* …and the cycles for being carried in the other poses. */
const CARRY = {
  swim: {
    stride: 560,
    tracks: {
      pawEL: [[0, 0, 0], [0.25, -5, -7, -20], [0.5, 0, 0], [1, 0, 0]],
      pawER: [[0, 0, 0], [0.5, 0, 0], [0.75, 5, -7, 20], [1, 0, 0]],
      head: [[0, 0, 0, -3], [0.5, 0, 2, 3], [1, 0, 0, -3]],
      ripple: [[0, 0, 0, 0, 1, 1], [0.5, -3, 0, 0, 1.1, 1], [1, 0, 0, 0, 1, 1]],
    },
  },
  climb: {
    stride: 620,
    tracks: {
      armL: [[0, 0, 0, 0], [0.5, 0, 0, -40], [1, 0, 0, 0]],
      armR: [[0, 0, 0, 0], [0.5, 0, 0, -150], [1, 0, 0, 0]],
      legL: [[0, 0, 0, 0], [0.5, 0, 6, 26], [1, 0, 0, 0]],
      legR: [[0, 0, -6, -24], [0.5, 0, 0, 0], [1, 0, -6, -24]],
      fig: [[0, 0, 0, -3], [0.5, 0, -2, 3], [1, 0, 0, -3]],
    },
  },
  float: {
    stride: 1600,
    tracks: {
      fig: [[0, 0, 0, -2], [0.5, 0, -3, 2], [1, 0, 0, -2]],
      legL: [[0, 0, 0, 0], [0.5, 0, 0, 14], [1, 0, 0, 0]],
      legR: [[0, 0, 0, 0], [0.5, 0, 0, -14], [1, 0, 0, 0]],
      ripple: [[0, 0, 0, 0, 1, 1], [0.5, 0, 0, 0, 1.15, 1], [1, 0, 0, 0, 1, 1]],
    },
  },
}

export function createOtter(svg, { pose: startPose = 'stand', mood = 'happy', intensity = 'full' } = {}) {
  const parts = {}
  svg.querySelectorAll('[data-p]').forEach((el) => { parts[el.dataset.p] = el })
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
  let blinkTimer = 0
  let breath = null
  let runAnims = null
  let hovering = false
  let onScreen = true
  const face = { eyes: 'open', mouth: 'smile' }

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
    for (const p of ['armL', 'armR', 'book']) if (parts[p]) parts[p].style.transform = restOf(p, book).transform
  }

  svg.dataset.mood = current
  svg.dataset.pose = pose
  setBook(book)
  restFace()

  /* ── Ambient: breath and blink ─────────────────────────────────────── */
  const breathe = () => {
    if (still || level === 'still' || !parts.body || breath) return
    breath = parts.body.animate(
      [{ transform: REST }, { transform: T(0, -0.4, 0, 1.012, 1.03) }],
      { duration: 1500, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
    )
  }
  const blink = () => {
    clearTimeout(blinkTimer)
    if (still || level === 'still') return
    blinkTimer = window.setTimeout(() => {
      if (onScreen && ['open', 'wide', 'half', 'angry', 'sad'].includes(face.eyes)) {
        svg.dataset.eyes = 'shut'
        window.setTimeout(() => { if (svg.dataset.eyes === 'shut') svg.dataset.eyes = face.eyes }, 120)
      }
      blink()
    }, 2200 + Math.random() * 3400)
  }
  breathe()
  blink()

  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting
        if (!breath) return
        if (onScreen) breath.play()
        else breath.pause()
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

    if (still) {
      const last = act.face?.[act.face.length - 1]
      setBook(endBook)
      if (last) setFace(last[1], last[2])
      actTimers.push(window.setTimeout(restFace, 900))
      return 0
    }

    acting = n
    const dur = act.dur
    const fromBook = book
    const tracks = { ...act, ...act[pose] }
    if (act.bookTrack) tracks.book = act.bookTrack
    else if (act.freeHands && fromBook !== 'none') tracks.book = [[0.12, 8, 10, -24, 0, 0], [0.9, 8, 10, -24, 0, 0]]
    else delete tracks.book

    for (const [part, track] of Object.entries(tracks)) {
      const el = parts[part]
      if (!el || !Array.isArray(track) || !Array.isArray(track[0])) continue
      const frames = toFrames(track, restOf(part, fromBook), restOf(part, endBook), isEmote(part))
      anims.push(el.animate(frames, { duration: dur, easing: 'linear' }))
    }
    /* The rest the act lands on is in place underneath it already. */
    setBook(endBook)
    svg.dataset.book = fromBook === 'open' ? 'open' : 'closed'
    for (const [ms, state] of act.book || []) {
      const set = () => { svg.dataset.book = state === 'open' ? 'open' : 'closed' }
      if (ms <= 0) set(); else actTimers.push(window.setTimeout(set, ms))
    }
    for (const [ms, eyes, mouth] of act.face || []) {
      if (ms <= 0) setFace(eyes, mouth)
      else actTimers.push(window.setTimeout(() => setFace(eyes, mouth), ms))
    }
    actTimers.push(window.setTimeout(() => {
      anims = []
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
      runAnims = Object.entries(cycle.tracks).flatMap(([part, track]) => (parts[part]
        ? [parts[part].animate(toFrames(track), { duration: cycle.stride, iterations: Infinity, easing: 'linear' })]
        : []))
      if (book !== 'none' && parts.book && !CARRY[pose]) {
        runAnims.push(parts.book.animate([{ transform: REST }, { transform: T(8, 10, -24, 0, 0) }], { duration: 140, fill: 'forwards' }))
      }
      if (pose === 'climb') setFace('open', 'flat')
      else if (pose === 'float') setFace('happy', 'smile')
      else setFace('open', 'grin')
    } else {
      if (!runAnims) return
      runAnims.forEach((a) => a.cancel())
      runAnims = null
      if (book !== 'none' && parts.book && !still && !CARRY[pose]) {
        parts.book.animate(
          [{ transform: T(8, 10, -24, 0, 0) }, { transform: T(0, -4, 6, 1.12, 1.12), offset: 0.6 }, { transform: REST }],
          { duration: 320, easing: 'ease-out' },
        )
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
      if (next === 'still') { breath?.cancel(); breath = null; clearTimeout(blinkTimer) } else { breathe(); blink() }
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
      clearTimeout(blinkTimer)
      anims.forEach((a) => a.cancel())
      runAnims?.forEach((a) => a.cancel())
      breath?.cancel()
      io?.disconnect()
    },
  }
}
