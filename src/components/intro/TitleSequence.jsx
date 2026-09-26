/* ═══════════════════════════════════════════════════════════════════════════
   TitleSequence.jsx — THE FIRST FIFTEEN SECONDS
   ---------------------------------------------------------------------------
   On a browser's first arrival at the landing page, the field guide
   introduces the course before the page does, then becomes the page
   (MOTION_RULES.md → The title sequence; COMPONENT_RULES.md → Title
   sequence). This file decides WHEN it plays and keeps the reader in
   charge; IntroScenes.jsx is what is printed, score.js is the clock,
   camera.js is where it must land.

   It holds the page like a dialog: aria-modal (so the Stage waits behind
   it), the page under it inert, Skip focused. Any key, a click, a wheel or
   a swipe ends it at once — the hand always wins — and the page is handed
   back the moment it does, not when the overlay has finished fading.

   ReplayTab is the page-edge tab that plays it again.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '../../motion/env'
import { DUR, EASE } from '../../motion/timing'
import { pageFromLocation } from '../../site'
import { closeUp, measureHero } from './camera'
import { IntroBook, IntroTitle } from './IntroScenes'
import { createScore } from './score'
import './titleSequence.css'

/* Written the moment it starts, so a reload mid-way does not replay it.
   Listed on the privacy page. */
export const INTRO_KEY = 'lunx_intro_seen_v1'

/* Sent on window as a sequence starts, so the hero's book can come to rest
   under it (Hero.jsx). */
export const INTRO_EVENT = 'lunx:intro'

const canPlay = () =>
  typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function' && !prefersReducedMotion()

/* Decided once, when the app boots: a first arrival is the landing page
   being the page this browser opened, with no section named in the
   address. A visitor who came in through another page and then went home
   is already inside, and is not greeted again. `?intro` plays it regardless. */
const ARRIVAL = (() => {
  if (typeof window === 'undefined' || !canPlay()) return false
  try {
    if (pageFromLocation(window.location, import.meta.env.BASE_URL) !== 'landing') return false
    if (new URLSearchParams(window.location.search).has('intro')) return true
    if (window.location.hash.length > 1) return false
    return window.localStorage.getItem(INTRO_KEY) === null
  } catch {
    return false
  }
})()
let greeted = false

/* The replay controls reach the mounted sequence through this, and focus
   goes back to whichever control asked once it is over. */
let request = null
let asker = null
export function playIntro() {
  const active = document.activeElement
  asker = active instanceof HTMLElement && active !== document.body ? active : null
  request?.()
}

/** Whether the intro can play here at all, kept current if the reader
    changes their motion preference while the page is open. A control for a
    sequence that cannot play is not offered. */
export function useIntroAvailable() {
  const [ok, setOk] = useState(canPlay)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const on = () => setOk(canPlay())
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return ok
}

/* The faces the sequence sets. The fonts' stylesheet arrives without
   holding up the first paint (index.html), so wait for it — briefly — or
   the headline would be measured in the fallback serif and set in Fraunces. */
const FACES = ['600 32px Fraunces', '700 32px Fraunces', 'italic 400 32px Fraunces', '400 32px Fraunces', '700 16px Manrope', '800 16px Manrope']
async function fontsReady(limit = 1600) {
  const fonts = document.fonts
  if (!fonts) return
  const until = performance.now() + limit
  const listed = () => [...fonts].some((f) => /Fraunces/.test(f.family))
  while (!listed() && performance.now() < until) {
    await new Promise((r) => setTimeout(r, 40))
  }
  await Promise.race([
    Promise.all(FACES.map((f) => fonts.load(f).catch(() => null))),
    new Promise((r) => setTimeout(r, Math.max(0, until - performance.now()))),
  ])
}

/** The design grid's place on a page: 1600 × 900 units (900 × 1600 on a
    tall screen), centred on the screen, in page pixels. */
function frameFor(g, M) {
  const tall = g.vh > g.vw
  const W = tall ? 900 : 1600
  const H = tall ? 1600 : 900
  const u = Math.min(g.vw / W, g.vh / H)
  return { tall, u: u / M, left: (g.vw - W * u) / 2 / M, top: (g.vh - H * u) / 2 / M, width: (W * u) / M, height: (H * u) / M }
}

/* The real book's resting loops, restarted at the top of their cycles the
   instant before the overlay lifts, so the book underneath is in exactly the
   pose the intro's book came to rest in (fieldGuide.css: fg-breathe and
   fg-shadow-breathe begin at rest, fg-drift at its first frame). The
   compass needle's own small wander is carried across the other way. */
function lineUpHeroBook(root) {
  const hero = document.querySelector('.hero .fg-desk')
  if (!hero) return
  hero.querySelectorAll('.fg-arrive, .fg-shadow').forEach((el) => {
    el.getAnimations().forEach((a) => {
      if (!/fg-(breathe|drift|shadow-breathe)/.test(a.animationName ?? '')) return
      const { delay = 0, duration = 0 } = a.effect.getTiming()
      a.currentTime = delay + 2 * Number(duration) * Math.ceil(((a.currentTime ?? 0) - delay) / (2 * Number(duration)))
    })
  })
  const needle = parseFloat(hero.querySelector('.fg-cover')?.style.getPropertyValue('--needle') || '0')
  const wander = ((needle % 360) + 540) % 360 - 180
  root.querySelector('.ts-desk .fg-compass-needle')?.animate([{ rotate: '0deg' }, { rotate: `${wander}deg` }], { duration: DUR.move, easing: EASE.snap, fill: 'forwards' })
}

/* Once the camera is at rest and the book has landed, the world no longer
   needs its close-up resolution (camera.js). Drawn at 1:1 with no camera,
   which is the same geometry exactly, it is the hero's book pixel for pixel
   rather than a larger drawing of it shrunk — so the hand-off has no seam
   even in the anti-aliasing. Done while nothing it redraws is moving. */
function drawAtRest(root) {
  const world = root.querySelector('.ts-world')
  if (!world) return
  world.style.zoom = '1'
  root.querySelector('.ts-cam')?.animate([{ transform: 'none' }, { transform: 'none' }], { duration: 1, fill: 'forwards' })
}

/* The seal, the ribbon and the cloth's glare loop for ever on the hero's
   book; the intro's copies start in step with them. */
function inStepWithHero(root) {
  const pairs = [['.fg-compass-seal', '.fg-compass-seal'], ['.fg-ribbon', '.fg-ribbon'], ['.fg-glare', '.fg-glare']]
  pairs.forEach(([real, mine]) => {
    const from = document.querySelector(`.hero ${real}`)?.getAnimations({ subtree: true }) ?? []
    const to = root.querySelector(`.ts-desk ${mine}`)?.getAnimations({ subtree: true }) ?? []
    to.forEach((a, i) => { if (from[i]?.currentTime != null) a.currentTime = from[i].currentTime })
  })
}

function Sequence({ onDone }) {
  const rootRef = useRef(null)
  const scoreRef = useRef(null)
  const [g, setG] = useState(null)
  const leaving = useRef(false)
  const released = useRef(false)

  /* The page back in the reader's hands: interactive, read by assistive
     technology again, focus where it was asked from. The overlay may still
     be fading; it no longer catches anything. */
  const release = useCallback(() => {
    if (released.current) return
    released.current = true
    document.getElementById('root')?.removeAttribute('inert')
    const root = rootRef.current
    if (root) {
      root.style.pointerEvents = 'none'
      root.removeAttribute('aria-modal')
      root.setAttribute('aria-hidden', 'true')
    }
    const back = asker
    asker = null
    if (back?.isConnected) back.focus({ preventScroll: true })
    else if (root?.contains(document.activeElement)) document.activeElement.blur()
  }, [])

  /* Ending early is never a jump cut: the overlay lifts off the page. */
  const end = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    release()
    scoreRef.current?.pause()
    const root = rootRef.current
    if (!root) { onDone(); return }
    root.animate([{ opacity: getComputedStyle(root).opacity }, { opacity: 0 }], { duration: DUR.open, easing: EASE.out, fill: 'forwards' })
      .finished.then(onDone, onDone)
  }, [onDone, release])

  /* Arrival: remember it, take the page, bring the hero's book to rest,
     listen for the hand, wait for the type, measure. */
  useEffect(() => {
    greeted = true
    try { window.localStorage.setItem(INTRO_KEY, new Date().toISOString().slice(0, 10)) } catch { /* private mode */ }
    const page = document.getElementById('root')
    page?.setAttribute('inert', '')
    window.dispatchEvent(new Event(INTRO_EVENT))

    /* Tab stays on Skip; any other key ends the intro and still does what
       it does (a reload, a scroll). */
    const onKey = (e) => {
      if (released.current) return
      if (e.key === 'Tab') { e.preventDefault(); return }
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
      end()
    }
    /* A new shape of screen, not a toolbar sliding away: the camera was
       measured for this one. */
    const size = { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight }
    const onResize = () => {
      const { clientWidth: w, clientHeight: h } = document.documentElement
      if (Math.abs(w - size.w) > 1 || Math.abs(h - size.h) > size.h * 0.15) end()
    }
    const onVisibility = () => {
      const score = scoreRef.current
      if (!score || leaving.current) return
      if (document.hidden) score.pause()
      else score.play()
    }
    /* Asked for less motion, mid-way: it ends. */
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onMotion = () => { if (prefersReducedMotion()) end() }
    const root = rootRef.current
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('wheel', end, { passive: true })
    window.addEventListener('touchmove', end, { passive: true })
    window.addEventListener('resize', onResize)
    root?.addEventListener('pointerdown', end)
    document.addEventListener('visibilitychange', onVisibility)
    motion?.addEventListener('change', onMotion)

    let live = true
    fontsReady().then(() => requestAnimationFrame(() => {
      if (!live || leaving.current) return
      const measured = measureHero()
      if (measured) setG(measured)
      else end()
    }))

    return () => {
      live = false
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('wheel', end)
      window.removeEventListener('touchmove', end)
      window.removeEventListener('resize', onResize)
      root?.removeEventListener('pointerdown', end)
      document.removeEventListener('visibilitychange', onVisibility)
      motion?.removeEventListener('change', onMotion)
      page?.removeAttribute('inert')
    }
  }, [end])

  /* Play. */
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!g || !root) return undefined
    const score = createScore(root, g)
    scoreRef.current = score
    inStepWithHero(root)
    root.querySelector('.ts-skip')?.focus({ preventScroll: true })

    /* Held on its first frame until the pages have been painted — three
       steady frames in a row, or 600ms at most — so the first second of
       motion is not spent rasterising them. */
    score.pause()
    let warm = 0
    {
      const began = performance.now()
      let last = began
      let steady = 0
      const wait = (now) => {
        steady = now - last < 20 ? steady + 1 : 0
        last = now
        if (steady >= 3 || now - began > 600) {
          if (!leaving.current && !document.hidden) score.play()
          return
        }
        warm = requestAnimationFrame(wait)
      }
      warm = requestAnimationFrame(wait)
    }

    score.still.finished.then(() => drawAtRest(root), () => {})
    score.sync.finished.then(() => lineUpHeroBook(root), () => {})
    score.lift.finished.then(release, () => {})
    score.clock.finished.then(() => { if (!leaving.current) onDone() }, () => {})

    return () => {
      cancelAnimationFrame(warm)
      scoreRef.current = null
      score.cancel()
    }
  }, [g, onDone, release])

  const M = g ? closeUp(g).M : 1
  const frame = g ? frameFor(g, M) : null

  return (
    <div
      ref={rootRef}
      className="ts"
      data-shape={frame?.tall ? 'tall' : 'wide'}
      role="dialog"
      aria-modal="true"
      aria-label="LunX introduction, 15 seconds"
      aria-describedby="ts-desc"
    >
      <p className="pg-sr-only" id="ts-desc">
        A short animated introduction: how AI guesses the next word, why a
        likely answer is not always a true one, and deciding where to draw
        the line. Press Skip intro or Escape to go straight to the page.
      </p>
      {g && (
        <>
          <div className="ts-view" aria-hidden="true">
            <div className="ts-cam">
              <IntroBook g={g} frame={frame} M={M} />
            </div>
          </div>
          <div className="ts-light" aria-hidden="true" />
          <div aria-hidden="true"><IntroTitle g={g} /></div>
          <span className="ts-sync" aria-hidden="true" />
        </>
      )}
      <div className="ts-chrome">
        <span className="ts-rule" aria-hidden="true"><span className="ts-progress" /></span>
        <button type="button" className="btn btn-outline btn-sm ts-skip" onClick={end}>Skip intro</button>
      </div>
    </div>
  )
}

/* An introduction that fails must never take the page with it: it simply
   is not there. */
class Contained extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error('[intro]', error)
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Mounted on the landing page. Plays on a first arrival, and again when a
 * replay control asks — from the top of the page, since it lands on the
 * hero.
 */
export default function TitleSequence() {
  const [on, setOn] = useState(() => ARRIVAL && !greeted)

  useEffect(() => {
    request = () => {
      if (!canPlay()) return
      window.scrollTo({ top: 0, behavior: 'instant' })
      setOn(true)
    }
    return () => { request = null }
  }, [])

  const done = useCallback(() => setOn(false), [])
  if (!on) return null
  return createPortal(<Contained onFail={done}><Sequence onDone={done} /></Contained>, document.body)
}

/**
 * The replay tab: a thumb tab on the landing page's right edge, like the
 * field guide's own index tabs (COMPONENT_RULES.md → Title sequence).
 * Offered only where the intro can play.
 */
export function ReplayTab() {
  const available = useIntroAvailable()
  if (!available) return null
  return (
    <button type="button" className="intro-tab" onClick={playIntro} aria-label="Replay intro, 15 seconds">
      <svg className="intro-tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12a8 8 0 1 0 2.4-5.7" />
        <path d="M4 4v4.5h4.5" />
      </svg>
      <span className="intro-tab-label">Replay intro</span>
    </button>
  )
}
