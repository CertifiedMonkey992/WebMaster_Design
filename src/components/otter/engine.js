/* ═══════════════════════════════════════════════════════════════════════════
   engine.js — WHAT MAKES THE OTTER MOVE
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 14 → The otter. One engine per drawing. It
   plays acts (acts.js) as Web Animations on the drawing's parts, swaps the
   face, carries the book between "none", "closed" and "open", runs a run
   cycle while a lane moves it, and keeps two sanctioned ambient motions: a
   breath and a blink, both only while the otter is on screen.

   Nothing here decides when to perform: the Stage (an idle turn), a lane
   (OtterLane.jsx), a click or a real event does.

   Under reduced motion it never moves: an act sets the face it would end
   on and the book it would end with, and nothing else.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion } from '../../motion/env'
import { ACTS, ALIASES, CLICK_ACTS, IDLE, MOODS, PEEK_ACTS, pickAct } from './acts'

const T = (x = 0, y = 0, r = 0, sx = 1, sy = sx) =>
  `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`
const REST = T()
const SEG = 'cubic-bezier(0.45, 0, 0.4, 1)'

/* Where a part rests, given what is in the otter's paws. */
function restOf(part, book) {
  const held = book !== 'none'
  if (part === 'armL') return held ? T(0, 0, -30) : REST
  if (part === 'armR') return held ? T(0, 0, 30) : REST
  if (part === 'book') return held ? REST : T(10, 10, -30, 0, 0)
  return REST
}

const toFrames = (track, from, to) => {
  const frames = track.map(([o, x, y, r, sx, sy]) => ({ offset: o, transform: T(x, y, r, sx, sy), easing: SEG }))
  if (frames[0]?.offset !== 0) frames.unshift({ offset: 0, transform: from, easing: SEG })
  if (frames[frames.length - 1]?.offset !== 1) frames.push({ offset: 1, transform: to })
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

export function createOtter(svg, { pose = 'stand', mood = 'happy', intensity = 'full' } = {}) {
  const parts = {}
  svg.querySelectorAll('[data-p]').forEach((el) => { parts[el.dataset.p] = el })
  const still = prefersReducedMotion()

  let book = pose === 'hold' ? 'closed' : 'none'
  let current = MOODS[mood] ? mood : 'happy'
  let level = intensity
  let acting = null
  let lastEnd = performance.now()
  let lastIdle = null
  let anims = []
  let actTimers = []
  let chainTimers = []
  let feelTimer = 0
  let feeling = null
  let blinkTimer = 0
  let breath = null
  let runAnims = null
  let hovering = false
  let onScreen = true
  let face = { eyes: 'open', mouth: 'smile' }

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
    book = state
    svg.dataset.book = state === 'open' ? 'open' : 'closed'
    for (const p of ['armL', 'armR', 'book']) if (parts[p]) parts[p].style.transform = restOf(p, state)
  }

  svg.dataset.mood = current
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
      if (onScreen && ['open', 'wide', 'smug'].includes(face.eyes)) {
        const was = face.eyes
        svg.dataset.eyes = 'shut'
        window.setTimeout(() => { if (svg.dataset.eyes === 'shut') svg.dataset.eyes = face.eyes === 'shut' ? was : face.eyes }, 120)
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
    const n = resolve(name)
    return Boolean(ACTS[n]) && (pose !== 'peek' || PEEK_ACTS.has(n))
  }

  /* Plays one act; the caller decides whether to clear a chain first. */
  const start = (name) => {
    const n = resolve(name)
    const act = ACTS[n]
    if (!act || !can(n)) return 0
    if (act.needsBook && book === 'none' && pose !== 'peek') return chain(['grab', n])

    clear(actTimers)
    anims.forEach((a) => a.cancel())
    anims = []
    if (runAnims) run(false)

    const finalBook = act.book?.length ? act.book[act.book.length - 1][1] : book
    const endBook = finalBook === 'open' ? 'closed' : finalBook

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
    const tracks = { ...act, ...(pose === 'peek' ? act.peek : null) }
    if (act.bookTrack) tracks.book = act.bookTrack
    else if (act.freeHands && fromBook !== 'none') tracks.book = [[0.12, 8, 10, -24, 0, 0], [0.9, 8, 10, -24, 0, 0]]
    else delete tracks.book

    for (const [part, track] of Object.entries(tracks)) {
      const el = parts[part]
      if (!el || !Array.isArray(track) || !Array.isArray(track[0])) continue
      const frames = toFrames(track, restOf(part, fromBook), restOf(part, endBook))
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

  const chain = (names) => {
    const list = names.filter(can)
    let at = 0
    list.forEach((name, i) => {
      if (i === 0) { at = start(name); return }
      const t = window.setTimeout(() => start(name), at + 120)
      chainTimers.push(t)
      const a = ACTS[resolve(name)]
      at += 120 + (a?.dur ?? 0) + (a?.needsBook && book === 'none' ? ACTS.grab.dur : 0)
    })
    return at
  }

  /* ── The run cycle (a lane moves the otter; this moves its legs) ──── */
  function run(on) {
    if (on) {
      if (runAnims || still) return
      clear(actTimers)
      clear(chainTimers)
      anims.forEach((a) => a.cancel())
      anims = []
      acting = null
      runAnims = Object.entries(RUN).flatMap(([part, track]) => (parts[part]
        ? [parts[part].animate(toFrames(track), { duration: STRIDE, iterations: Infinity, easing: 'linear' })]
        : []))
      if (book !== 'none' && parts.book) {
        runAnims.push(parts.book.animate([{ transform: REST }, { transform: T(8, 10, -24, 0, 0) }], { duration: 140, fill: 'forwards' }))
      }
      setFace('open', 'grin')
    } else {
      if (!runAnims) return
      runAnims.forEach((a) => a.cancel())
      runAnims = null
      if (book !== 'none' && parts.book && !still) {
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
      const list = pose === 'peek' ? IDLE.peek : book !== 'none' ? IDLE.hold : IDLE.stand
      lastIdle = pickAct(list, lastIdle)
      return lastIdle
    },
    clickAct(last) {
      const list = pose === 'peek' ? CLICK_ACTS.peek : book !== 'none' ? CLICK_ACTS.hold : CLICK_ACTS.stand
      return pickAct(list, last)
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
