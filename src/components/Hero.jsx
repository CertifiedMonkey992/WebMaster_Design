/* ═══════════════════════════════════════════════════════════════════════════
   Hero.jsx — THE FIRST SCREEN
   ---------------------------------------------------------------------------
   The course, stated plainly, beside a stack of the five real modules drawn
   as index cards — built from SECTIONS, so it cannot describe a curriculum
   the product does not have.

   Revision 2 makes the stack a thing you HANDLE rather than a picture of one:

     hover a card     it lifts out of the stack, straightens, tilts toward
                      the pointer, and opens to show its lessons
     click a card     behind the front one → it is pulled out and placed on
                      top; the front card → it turns over to its contents page
     ← / →            cycle the front card from the keyboard
     the list         hovering a module on the left lifts its card; clicking
                      it brings the card to the front and turns it over

   The stack is dealt onto the page on arrival, spreads as the hero scrolls
   away, and drifts by depth with the pointer — the 2.5D is parallax between
   sheets of paper, not a 3D render.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'
import { getLessonIcon } from './learn/LessonIcons'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import { prefersReducedMotion } from '../motion/env'

/* Stack positions, FRONT first. Hand-set rather than generated so the stack
   reads as handled paper — an even arithmetic fan looks like a loop. */
const FAN = [
  { x: -14, y: -104, r: -5 },
  { x: -4,  y: -52,  r: -2.5 },
  { x: 4,   y: 0,    r: 0.5 },
  { x: 16,  y: 52,   r: 3 },
  { x: 30,  y: 104,  r: 5.5 },
]

/* Chapter tabs. A field guide colour-codes its chapter dividers; these are
   the palette's inks, used only on the tab and the lifted card's number, so
   the five cards are findable without five coloured cards. */
const CHAPTER = ['--moss', '--evergreen', '--ochre-ink', '--clay-deep', '--berry-ink']

const minutesOf = (section) => section.lessons.reduce((m, l) => m + parseInt(l.duration, 10), 0)
const pad = (n) => String(n).padStart(2, '0')

function IndexCard({ section, index, slot, total, lifted, flipped, liftedSlot, onLift, onActivate }) {
  const front = slot === total - 1
  const pos = FAN[total - 1 - slot] ?? FAN[FAN.length - 1]
  const minutes = minutesOf(section)
  const isLifted = lifted === index
  /* Cards above the lifted one step up out of its way, cards below step down. */
  const push = liftedSlot == null || isLifted ? 0 : slot > liftedSlot ? -14 : 12

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(index) }
  }

  return (
    <article
      className={[
        'mf-card',
        front ? 'mf-card--front' : '',
        isLifted ? 'is-lifted' : '',
        flipped ? 'is-flipped' : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--mf-x': `${pos.x}px`,
        '--mf-y': `${pos.y}px`,
        '--mf-r': `${pos.r}deg`,
        '--push': `${push}px`,
        '--depth': slot + 1,
        '--deal': slot,
        '--chapter': `var(${CHAPTER[index % CHAPTER.length]})`,
        zIndex: isLifted ? 20 : slot + 1,
      }}
      role="button"
      tabIndex={0}
      aria-pressed={front ? flipped : undefined}
      aria-label={
        front
          ? `Module ${index + 1}: ${section.title}. ${section.lessons.length} lessons, ${minutes} minutes. ${flipped ? 'Showing contents — press to turn back.' : 'Press to turn over for the contents.'}`
          : `Module ${index + 1}: ${section.title}. Press to bring to the front.`
      }
      onPointerEnter={() => onLift(index)}
      onFocus={() => onLift(index)}
      onClick={() => onActivate(index)}
      onKeyDown={onKeyDown}
      data-card={index}
    >
      <div className="mf-tilt" data-tilt>
        <div className="mf-flip">
          {/* ── Front: the card as it sits in the stack ── */}
          <div className="mf-face mf-front fx-sheen">
            <span className="mf-tab" aria-hidden="true">{pad(index + 1)}</span>

            <div className="mf-top">
              <span className="mf-num">{pad(index + 1)}</span>
              <span className="mf-level">{section.level}</span>
              <span className="mf-hint" aria-hidden="true">
                {front ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /></svg>
                    Turn over
                  </>
                ) : 'Bring forward'}
              </span>
            </div>

            <h3 className="mf-title">{section.title}</h3>
            <p className="mf-sub">{section.subtitle}</p>

            <div className="mf-more" aria-hidden={!isLifted && !flipped}>
              <div className="mf-more-inner">
                <ul className="mf-lessons">
                  {section.lessons.map((lesson, n) => (
                    <li key={lesson.id} style={{ '--n': n }}>
                      <span className="mf-lesson-ico">{getLessonIcon(lesson.id)}</span>
                      <span className="mf-lesson-title">{lesson.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mf-meta">
              <span className="mf-meta-count">{section.lessons.length} lessons</span>
              <span aria-hidden="true">·</span>
              <span>{minutes} min</span>
              <span className="mf-meta-dots" aria-hidden="true">
                {section.lessons.map((l) => <i key={l.id} />)}
              </span>
            </div>
          </div>

          {/* ── Back: the contents page ── */}
          <div className="mf-face mf-back" aria-hidden={!flipped}>
            <span className="mf-tab mf-tab--back" aria-hidden="true">{pad(index + 1)}</span>
            <div className="mf-back-head">
              <span className="mf-back-label">Contents</span>
              <span className="mf-back-num">{pad(index + 1)} · {section.title}</span>
            </div>
            <ol className="mf-toc">
              {section.lessons.map((lesson, n) => (
                <li key={lesson.id} style={{ '--n': n }}>
                  <span className="toc-n">{n + 1}</span>
                  <span className="toc-t">{lesson.title}</span>
                  <span className="toc-leader" aria-hidden="true" />
                  <span className="toc-d">{lesson.duration}</span>
                </li>
              ))}
            </ol>
            <p className="mf-back-foot">
              {section.lessons.length} lessons · {minutes} min · unlock in order
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

function ModuleFan({ lifted, setLifted, order, setOrder, flipped, setFlipped }) {
  const ref = useRef(null)
  const [dealt, setDealt] = useState(() => prefersReducedMotion())
  const [settled, setSettled] = useState(() => prefersReducedMotion())
  const total = SECTIONS.length

  /* Deal the stack onto the page. */
  useEffect(() => {
    if (dealt) return undefined
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setDealt(true)) })
    const t = window.setTimeout(() => setSettled(true), 2000)
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t) }
  }, [dealt])

  /* The stack spreads as the hero scrolls away. */
  useEffect(() => {
    let raf = 0
    const run = () => {
      raf = 0
      const p = Math.max(0, Math.min(1, window.scrollY / 700))
      ref.current?.style.setProperty('--fan-scroll', p.toFixed(3))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run) }
    window.addEventListener('scroll', onScroll, { passive: true })
    run()
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const activate = useCallback((index) => {
    const slot = order.indexOf(index)
    if (slot === total - 1) {
      setFlipped((f) => (f === index ? null : index))
      return
    }
    setFlipped(null)
    setOrder((o) => [...o.filter((x) => x !== index), index])
    /* Pull the card out to the side on its way to the top, so it visibly
       travels AROUND the cards in front of it rather than through them. */
    const el = ref.current?.querySelector(`[data-card="${index}"]`)
    if (el && !prefersReducedMotion()) {
      el.animate(
        [
          { translate: '0 0', rotate: '0deg' },
          { translate: '170px -26px', rotate: '9deg', offset: 0.42 },
          { translate: '0 0', rotate: '0deg' },
        ],
        { duration: 760, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)' },
      )
    }
  }, [order, total, setFlipped, setOrder])

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const frontIndex = order[total - 1]
    const next = e.key === 'ArrowRight'
      ? order[total - 2]
      : order[0]
    if (next == null || next === frontIndex) return
    activate(next)
    window.requestAnimationFrame(() => ref.current?.querySelector(`[data-card="${next}"]`)?.focus())
  }

  const liftedSlot = lifted == null ? null : order.indexOf(lifted)

  return (
    <div
      ref={ref}
      className={`module-fan${dealt ? ' is-dealt' : ''}${settled ? ' is-settled' : ''}${lifted != null ? ' has-lift' : ''}`}
      role="group"
      aria-label="The five course modules, as a stack of cards. Use left and right arrows to change the front card."
      onPointerLeave={() => setLifted(null)}
      onKeyDown={onKeyDown}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setLifted(null) }}
    >
      {SECTIONS.map((section, index) => (
        <IndexCard
          key={section.id}
          section={section}
          index={index}
          slot={order.indexOf(index)}
          total={total}
          lifted={lifted}
          liftedSlot={liftedSlot}
          flipped={flipped === index}
          onLift={setLifted}
          onActivate={activate}
        />
      ))}
      <p className="mf-caption" aria-hidden="true">
        <span className="mf-caption-key">←</span><span className="mf-caption-key">→</span>
        shuffle · click the top card to turn it over
      </p>
    </div>
  )
}

export default function Hero({ onStartLearning }) {
  const heroRef = useRef(null)
  const [lifted, setLifted] = useState(null)
  const [order, setOrder] = useState(() => SECTIONS.map((_, i) => i).reverse())
  const [flipped, setFlipped] = useState(null)

  /* Pointer parallax across the whole hero: the stack drifts by depth. */
  useEffect(() => {
    const el = heroRef.current
    if (!el) return undefined
    let raf = 0
    let nx = 0
    let ny = 0
    const run = () => {
      raf = 0
      el.style.setProperty('--px', nx.toFixed(3))
      el.style.setProperty('--py', ny.toFixed(3))
    }
    const onMove = (e) => {
      if (e.pointerType !== 'mouse' || prefersReducedMotion()) return
      const r = el.getBoundingClientRect()
      nx = ((e.clientX - r.left) / r.width) * 2 - 1
      ny = ((e.clientY - r.top) / r.height) * 2 - 1
      if (!raf) raf = requestAnimationFrame(run)
    }
    const onLeave = () => { nx = 0; ny = 0; if (!raf) raf = requestAnimationFrame(run) }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  const openModule = (index) => {
    setOrder((o) => [...o.filter((x) => x !== index), index])
    setFlipped(index)
    setLifted(null)
  }

  return (
    <section className="hero" aria-labelledby="hero-heading" ref={heroRef}>
      <div className="hero-left">
        <Reveal as="p" variant="left" immediate className="hero-eyebrow">
          <b>Beta</b>
          <span className="hero-live" aria-hidden="true" />
          <span>{TOTAL_LESSONS} lessons live · no account needed</span>
        </Reveal>

        {/* The product's one italic-clay emphasis, on the half of the sentence
            that carries the argument. It assembles word by word, then a
            hand-drawn rule is inked under the phrase. */}
        <SplitText as="h1" className="hero-heading" id="hero-heading" immediate delay={120} stagger={58}>
          A field guide to the machines that are{' '}
          <em className="em hero-em">
            already deciding things
            <svg className="hero-scribble" data-st-skip viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength="1" d="M3 12.5C48 6.5 96 15 150 9.5s104-3.5 147 1.5" />
            </svg>
          </em>.
        </SplitText>

        <Reveal as="p" className="hero-sub" immediate delay={650}>
          {TOTAL_LESSONS} short lessons on how AI actually works — <span className="hero-term">training
          data</span>, <span className="hero-term">neural networks</span>, <span className="hero-term">the
          tools</span>, and <span className="hero-term">the ethics</span> of using them. Free, no account,
          and it remembers where you stopped.
        </Reveal>

        <Reveal className="hero-ctas" variant="scale" stagger immediate delay={820}>
          <button
            type="button"
            className="btn btn-next btn-lg fx-shine"
            onClick={onStartLearning}
            data-magnetic="7"
          >
            Start lesson one
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <a href="#learn" className="btn btn-outline btn-lg">See the curriculum</a>
        </Reveal>

        <Reveal as="ol" className="hero-path" variant="left" stagger immediate delay={980}>
          {SECTIONS.map((section, i) => (
            <li key={section.id} style={{ '--chapter': `var(${CHAPTER[i]})` }}>
              <button
                type="button"
                className={`hero-path-item${lifted === i ? ' is-lit' : ''}${flipped === i ? ' is-open' : ''}`}
                onPointerEnter={() => setLifted(i)}
                onPointerLeave={() => setLifted(null)}
                onFocus={() => setLifted(i)}
                onBlur={() => setLifted(null)}
                onClick={() => openModule(i)}
                aria-label={`${section.title}: ${section.lessons.length} lessons, ${minutesOf(section)} minutes. Show its contents.`}
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

        <Reveal as="p" variant="fade" className="hero-path-meta" immediate delay={1400}>
          Self-paced. Lessons unlock in order. Progress saves in this browser.
        </Reveal>
      </div>

      <ModuleFan
        lifted={lifted}
        setLifted={setLifted}
        order={order}
        setOrder={setOrder}
        flipped={flipped}
        setFlipped={setFlipped}
      />
    </section>
  )
}
