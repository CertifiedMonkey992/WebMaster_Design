/* ═══════════════════════════════════════════════════════════════════════════
   Hero.jsx — THE FIRST SCREEN
   ---------------------------------------------------------------------------
   The course, stated plainly, beside the thing the product says it is: a
   field guide on the desk (guide/FieldGuide.jsx), built from SECTIONS so it
   cannot describe a curriculum the product does not have.

   The curriculum list and the book are one instrument:
     hover a module    that chapter's pages lift off the book (or, if the book
                       is open, its thumb tab leans out)
     click a module    the book opens at that chapter, or turns to it

   Revision 5 (MOTION_RULES.md → The Stage): the hero's copy performs too,
   between the book's gestures — the scribble under the italic phrase is
   inked again to a new shape, and a highlighter is laid under one of the
   four terms, preferring the one that names the chapter the book just
   showed. The eye goes book → words → book.

   Revision 7 (MOTION_RULES.md → Scroll → Scenes → the guide): the hero is a
   scroll scene. A tall track holds a pinned stage; the scroll moves the copy
   aside, brings the book to the middle, opens it and turns every spread,
   while a caption names the open spread, the ground takes its chapter's
   ink, and a rail on the right marks where you are. Every control — the
   rail, the chapter list, the book's own cover, pages, tabs and keys —
   scrolls to a spread rather than changing the book behind the scroll.
   Under reduced motion there is no track: this is the revision 6 hero.

   The hero carries the page's primary action, above the fold on every
   screen: one button into the course, with the three facts that remove the
   last hesitation (free, no account, five minutes). COMPONENT_RULES.md →
   Links into the course.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import FieldGuide from './guide/FieldGuide'
import { CHAPTER_INK, SPREADS, TOTAL_MINUTES, minutesOf, pad } from './guide/guideData'
import { usePerformer } from '../motion/stage'
import { scrollToScene, useSceneEnabled, useScrollScene } from '../motion/scroll'
import { PageLink } from '../nav'
import { DUR } from '../motion/timing'

/* Which hero term names which chapter (by index); Foundations has none. */
const TERM_OF_CHAPTER = { 1: 0, 2: 1, 3: 2, 4: 3 }

/* ── The scene's timeline (MOTION_RULES.md → Scroll → Scenes → the guide) ──
   p 0 → ASIDE      the copy steps aside; the book comes to the middle
   ASIDE → OPEN     the cover opens
   OPEN → PAGES     six spreads hold, five leaves turn (a turn = 0.8 hold)
   PAGES → 1        the last chapter holds; its caption leaves as it unpins */
const ASIDE = 0.1
const OPEN = 0.2
const PAGES = 0.96
const HOLD = (PAGES - OPEN) / (SPREADS + (SPREADS - 1) * 0.8)
const TURN = HOLD * 0.8
const FADE = TURN * 0.4

const clamp01 = (v) => Math.max(0, Math.min(1, v))
/* --ease-swing, cubic-bezier(0.65, 0, 0.35, 1), close enough to share a
   name: momentum both ways. */
const swing = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2)
const holdStart = (k) => OPEN + k * (HOLD + TURN)

/** The book's spread position at p: 2.4 is spread 2, 40% into the next turn. */
function spreadAt(p) {
  if (p <= OPEN) return 0
  for (let k = 0; k < SPREADS - 1; k++) {
    const turnFrom = holdStart(k) + HOLD
    if (p < turnFrom) return k
    const t = (p - turnFrom) / TURN
    if (t < 1) return k + t
  }
  return SPREADS - 1
}

/** Where spread k sits in the scroll (the middle of its hold); −1 is the top. */
const progressOf = (k) => (k < 0 ? 0 : holdStart(k) + HOLD / 2)

/** A spread's caption (and ground): in over the end of the turn that brings
    it, out over the start of the turn that takes it away. */
function shownAt(k, p) {
  const inEnd = k === 0 ? OPEN : holdStart(k)
  const fadeIn = clamp01((p - (inEnd - FADE)) / FADE)
  const outStart = k === SPREADS - 1 ? 0.975 : holdStart(k) + HOLD
  const outLen = k === SPREADS - 1 ? 0.025 : FADE
  return Math.min(fadeIn, 1 - clamp01((p - outStart) / outLen))
}

const CAPTIONS = [
  {
    kicker: 'Contents',
    title: 'The field guide',
    sub: `${SECTIONS.length} chapters, from what AI is to when using it crosses a line.`,
    meta: `${TOTAL_LESSONS} lessons · ${TOTAL_MINUTES} min in all`,
  },
  ...SECTIONS.map((s, i) => ({
    kicker: `Chapter ${pad(i + 1)} / ${pad(SECTIONS.length)}`,
    title: s.title,
    sub: `${s.subtitle}.`,
    meta: `${s.lessons.length} lessons · ${minutesOf(s)} min`,
    ink: `var(${CHAPTER_INK[i]})`,
  })),
]

export default function Hero() {
  const guide = useRef(null)
  const [lit, setLit] = useState(null)
  /* The chapter the book is showing on its own (an idle peek, or its tour):
     the list row answers it more quietly than it answers the hand. */
  const [echo, setEcho] = useState(null)
  const [bookOpen, setBookOpen] = useState(false)
  const heroRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  /* SplitText and Reveal render their own elements; find them once mounted
     (a layout effect, so the performers below see them). */
  useLayoutEffect(() => {
    const h = heroRef.current?.querySelector('.hero-heading') ?? null
    headingRef.current = h
    subRef.current = heroRef.current?.querySelector('.hero-sub') ?? null
    /* The pointer crossing the heading inks it again the same way the Stage
       does, so the hand and the page never leave the rule half-drawn. */
    if (!h) return undefined
    const reink = () => h.setAttribute('data-ink', h.getAttribute('data-ink') === 'b' ? 'a' : 'b')
    h.addEventListener('pointerenter', reink)
    return () => h.removeEventListener('pointerenter', reink)
  }, [])
  /* The last chapter the book showed on its own, and when. */
  const shown = useRef({ j: null, at: 0 })
  const onShow = useCallback((j) => {
    setEcho(j)
    if (j != null) shown.current = { j, at: performance.now() }
  }, [])

  /* Accent: the scribble is inked again, alternating its two hand-drawn
     shapes (App.css → .hero-heading[data-ink]). */
  usePerformer(headingRef, {
    id: 'hero:scribble',
    region: 'hero:copy',
    tier: 'accent',
    weight: 0.8,
    cooldown: 9000,
    share: 0.6,
    run: (ctx) => {
      const h = headingRef.current
      if (!h) return 0
      h.setAttribute('data-ink', h.getAttribute('data-ink') === 'b' ? 'a' : 'b')
      return DUR.open + DUR.reveal
    },
  })

  /* Accent: a highlighter laid under one term — the book's last chapter if
     it showed one in the last few seconds. */
  usePerformer(subRef, {
    id: 'hero:term',
    region: 'hero:copy',
    tier: 'accent',
    /* There are only four terms to mark, so this is the page's most easily
       over-used gesture: without a cooldown of its own it would out-play the
       book, which is the thing worth watching. */
    weight: 0.75,
    cooldown: 7000,
    share: 0.6,
    run: async (ctx) => {
      const terms = [...(subRef.current?.querySelectorAll('.hero-term') ?? [])]
      if (!terms.length) return
      const recent = performance.now() - shown.current.at < 7000 ? TERM_OF_CHAPTER[shown.current.j] : undefined
      const term = terms[recent ?? Math.floor(Math.random() * terms.length)]
      term.setAttribute('data-marked', '')
      ctx.onStop(() => term.removeAttribute('data-marked'))
      await ctx.wait(1500)
      term.removeAttribute('data-marked')
      await ctx.wait(DUR.open)
    },
  })

  const light = (i) => { setLit(i); guide.current?.peek(i) }
  const unlight = () => { setLit(null); guide.current?.peek(null) }

  /* ── The scene (revision 7) ───────────────────────────────────────────── */

  const scene = useSceneEnabled()
  const track = useRef(null)
  const stageRef = useRef(null)
  const rightRef = useRef(null)
  const captions = useRef([])
  const grounds = useRef([])
  const [active, setActive] = useState(-1)
  const [away, setAway] = useState(false)
  const live = useRef({ active: -1, away: false })

  /* Where the book has to travel to reach the middle of the screen, and how
     large its open spread may grow beside the caption. Measured from the
     book's column, which never moves (the book moves inside it). */
  const captionsRef = useRef(null)
  const railRef = useRef(null)
  const measure = useCallback(() => {
    const t = track.current
    const stage = stageRef.current
    const right = rightRef.current
    if (!t || !stage || !right) return
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const s = stage.getBoundingClientRect()
    const r = right.getBoundingClientRect()
    const vw = s.width
    const vh = s.height
    const nav = 68
    /* The book's own centre in its stage: the desk sits above a 3rem strip
       for the controls (fieldGuide.css → .fg-lean). */
    const bx = r.left - s.left + r.width / 2
    const by = r.top - s.top + (r.height - 3 * rem) / 2
    /* The open spread on screen, per unit of scale, with its 3D pose:
       half its width, the thumb tabs beyond that, and its height. */
    const HALF = 16.2 * rem
    const TABS = 1.5 * rem
    const TALL = 22.3 * rem

    let cx = vw / 2
    let cy = (vh + nav) / 2
    let scale
    if (vw >= 1000) {
      /* Caption on the left, rail on the right: the book takes the room
         between them, a little right of centre. */
      cx = vw * 0.57
      const cap = captionsRef.current?.getBoundingClientRect()
      const rail = railRef.current?.getBoundingClientRect()
      const capRight = cap ? cap.right - s.left : vw * 0.25
      const railLeft = rail ? rail.left - s.left : vw * 0.95
      scale = Math.min(
        (cx - capRight - 2 * rem) / HALF,
        (railLeft - 1.5 * rem - cx) / (HALF + TABS),
        ((vh - nav) * 0.92) / TALL,
        1.7,
      )
    } else {
      /* Caption at the foot of the screen: the book is centred above it.
         At 560px and under an open book shows only its right-hand page
         (COMPONENT_RULES.md → The field guide), so it is sized to one page. */
      const reserve = 9 * rem
      cy = (nav + vh - reserve) / 2
      const across = vw <= 560 ? HALF + TABS : 2 * (HALF + TABS)
      scale = Math.min((vw * 0.9) / across, ((vh - nav - reserve) * 0.94) / TALL, 1.4)
    }
    scale = Math.max(0.5, scale)
    t.style.setProperty('--bx', `${(cx - bx).toFixed(1)}px`)
    t.style.setProperty('--by', `${(cy - by).toFixed(1)}px`)
    t.style.setProperty('--bs', scale.toFixed(3))
  }, [])

  const onProgress = useCallback((p) => {
    const t = track.current
    if (!t) return
    const aside = swing(clamp01(p / ASIDE))
    t.style.setProperty('--aside', aside.toFixed(4))

    const angle = 180 * swing(clamp01((p - ASIDE) / (OPEN - ASIDE)))
    const pos = spreadAt(p)
    guide.current?.scrub({ angle, pos, held: p > 0.0005 })

    for (let k = 0; k < SPREADS; k++) {
      const o = shownAt(k, p)
      const cap = captions.current[k]
      if (cap) {
        cap.style.setProperty('--o', o.toFixed(3))
        cap.classList.toggle('is-on', o > 0.01)
      }
      const g = grounds.current[k]
      if (g) g.style.opacity = o.toFixed(3)
    }

    const L = live.current
    const now = p < OPEN - FADE ? -1 : Math.round(pos)
    if (now !== L.active) { L.active = now; setActive(now) }
    const gone = aside > 0.6
    if (gone !== L.away) { L.away = gone; setAway(gone) }
  }, [])

  const setTrack = useScrollScene({ onProgress })
  const trackRef = useCallback((el) => {
    track.current = el
    setTrack(scene ? el : null)
  }, [setTrack, scene])

  useEffect(() => {
    if (!scene) return undefined
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    /* The heading's web font can change the column's height once it lands. */
    document.fonts?.ready?.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', onResize)
  }, [scene, measure])

  const seek = useCallback((k) => { scrollToScene(track.current, progressOf(k)) }, [])

  return (
    <div ref={trackRef} className={`hero-track${scene ? ' is-scene' : ''}`}>
      <div ref={stageRef} className="hero-stage">
        {scene && (
          <div className="hero-ground" aria-hidden="true">
            {CAPTIONS.map((c, k) => (
              <span key={k} ref={(el) => { grounds.current[k] = el }} style={c.ink ? { '--chapter': c.ink } : undefined} />
            ))}
          </div>
        )}

        <section className="hero" ref={heroRef} aria-labelledby="hero-heading">
          <div className="hero-left" {...(scene && away ? { inert: '' } : {})}>
            {/* Who it is for, how much there is, and the one thing a visitor
                might worry about before clicking. */}
            <Reveal as="p" variant="left" immediate delay={60} className="hero-eyebrow">
              <b>Grades 9–12</b>
              <span className="hero-live" aria-hidden="true" />
              <span>{TOTAL_LESSONS} lessons · no account needed</span>
            </Reveal>

            {/* The product's one italic-clay emphasis, on the half of the sentence
                that carries the argument. It assembles word by word, then a
                hand-drawn rule is inked under the phrase — and re-inked, to a new
                shape, whenever the pointer crosses it. */}
            <SplitText as="h1" className="hero-heading" id="hero-heading" immediate delay={100} stagger={34}>
              A field guide to the AI{' '}
              <em className="em hero-em">
                you already use
                <svg className="hero-scribble" data-st-skip viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                  <path className="hero-scribble-a" pathLength="1" d="M3 12.5C48 6.5 96 15 150 9.5s104-3.5 147 1.5" />
                  <path className="hero-scribble-b" pathLength="1" d="M4 9.5C58 14 108 5.5 158 11s96 2 139-3" />
                </svg>
              </em>.
            </SplitText>

            <Reveal as="p" className="hero-sub" immediate delay={420}>
              Short, interactive lessons on how models <span className="hero-term">learn from
              data</span>, what happens inside a <span className="hero-term">neural network</span>, how
              to <span className="hero-term">prompt AI tools</span>, and when using AI <span className="hero-term">crosses
              an ethical line</span>. Earn XP and badges, and keep a daily streak as you go.
            </Reveal>

            <Reveal className="hero-cta" variant="fade" immediate delay={500}>
              <PageLink page="learn" className="btn btn-next btn-lg fx-shine" data-magnetic="8">
                Start lesson one
                <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </PageLink>
              <span className="hero-cta-note">Free · no account · about five minutes</span>
            </Reveal>

            <Reveal as="ol" className="hero-path" variant="left" stagger immediate delay={620}>
              {SECTIONS.map((section, i) => (
                <li key={section.id} style={{ '--chapter': `var(${CHAPTER_INK[i]})` }}>
                  <button
                    type="button"
                    className={`hero-path-item${lit === i ? ' is-lit' : ''}${lit == null && echo === i ? ' is-echo' : ''}`}
                    onPointerEnter={() => light(i)}
                    onPointerLeave={unlight}
                    onFocus={() => light(i)}
                    onBlur={unlight}
                    onClick={() => guide.current?.go(i)}
                    aria-label={`${section.title}: ${section.lessons.length} lessons, ${minutesOf(section)} minutes. ${bookOpen ? 'Turn the field guide to this chapter.' : 'Open the field guide at this chapter.'}`}
                  >
                    <span className="hero-path-num">{pad(i + 1)}</span>
                    <span className="hero-path-label">{section.title}</span>
                    <span className="hero-path-count">
                      <span className="hpc-rest">{section.lessons.length}</span>
                      <span className="hpc-hover">{section.lessons.length} lessons · {minutesOf(section)} min</span>
                    </span>
                    <svg className="hero-path-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                </li>
              ))}
            </Reveal>

            <Reveal as="p" variant="fade" className="hero-path-meta" immediate delay={820}>
              {scene ? 'Scroll to read the guide, or pick a module to jump to it.' : 'Pick a module to open the guide at that chapter.'}
            </Reveal>
          </div>

          <div className="hero-right" ref={rightRef}>
            <div className="hero-book">
              <FieldGuide ref={guide} onOpenChange={setBookOpen} onShow={onShow} scene={scene} onSeek={seek} />
            </div>
          </div>
        </section>

        {scene && (
          <>
            {/* What lies open, named beside the book. */}
            <div className="hero-captions" ref={captionsRef} aria-hidden="true">
              {CAPTIONS.map((c, k) => (
                <div key={k} className="hero-caption" ref={(el) => { captions.current[k] = el }} style={c.ink ? { '--chapter': c.ink } : undefined}>
                  <p className="hero-caption-kicker"><span>{c.kicker}</span></p>
                  <p className="hero-caption-title">{c.title}</p>
                  <p className="hero-caption-sub">{c.sub}</p>
                  <p className="hero-caption-meta">{c.meta}</p>
                </div>
              ))}
            </div>

            {/* Where you are in the guide; each tick scrolls to its spread. */}
            <nav ref={railRef} className={`hero-rail${active >= 0 ? ' is-on' : ''}`} aria-label="Field guide chapters">
              <ol>
                {CAPTIONS.map((c, k) => (
                  <li key={k}>
                    <button
                      type="button"
                      className={`hero-rail-tick${active === k ? ' is-active' : ''}`}
                      style={c.ink ? { '--chapter': c.ink } : undefined}
                      aria-current={active === k ? 'step' : undefined}
                      onClick={() => seek(k)}
                    >
                      <span className="hero-rail-num">{k === 0 ? '·' : pad(k)}</span>
                      <span className="hero-rail-label">{k === 0 ? 'Contents' : c.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
