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

   There is deliberately no "start" button here. The landing page has exactly
   two ways into the course — the navbar's button, always on screen, and the
   closing CTA — so the hero is free to be about what the course contains.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import FieldGuide from './guide/FieldGuide'
import { CHAPTER_INK, minutesOf, pad } from './guide/guideData'

export default function Hero() {
  const guide = useRef(null)
  const [lit, setLit] = useState(null)
  /* The chapter the book is showing on its own (an idle peek, or its tour):
     the list row answers it more quietly than it answers the hand. */
  const [echo, setEcho] = useState(null)
  const [bookOpen, setBookOpen] = useState(false)

  const light = (i) => { setLit(i); guide.current?.peek(i) }
  const unlight = () => { setLit(null); guide.current?.peek(null) }

  return (
    <section className="hero" aria-labelledby="hero-heading">
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

        <Reveal as="ol" className="hero-path" variant="left" stagger immediate delay={560}>
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
        <FieldGuide ref={guide} onOpenChange={setBookOpen} onShow={setEcho} />
      </div>
    </section>
  )
}
