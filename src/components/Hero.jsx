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

   The hero carries the page's primary action, above the fold on every
   screen: one button into the course, with the three facts that remove the
   last hesitation (free, no account, five minutes). COMPONENT_RULES.md →
   Links into the course.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import FieldGuide from './guide/FieldGuide'
import { CHAPTER_INK, minutesOf, pad } from './guide/guideData'
import { usePerformer } from '../motion/stage'
import { PageLink } from '../nav'
import { DUR } from '../motion/timing'

/* Which hero term names which chapter (by index); Foundations has none. */
const TERM_OF_CHAPTER = { 1: 0, 2: 1, 3: 2, 4: 3 }

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

  return (
    <section className="hero" ref={heroRef} aria-labelledby="hero-heading">
      <div className="hero-left">
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
          Pick a module to open the guide at that chapter.
        </Reveal>
      </div>

      <div className="hero-right">
        <FieldGuide ref={guide} onOpenChange={setBookOpen} onShow={onShow} />
      </div>
    </section>
  )
}
