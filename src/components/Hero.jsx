/* ═══════════════════════════════════════════════════════════════════════════
   Hero.jsx — THE FIRST SCREEN
   ---------------------------------------------------------------------------
   What used to be here: a near-black page, a white-to-grey gradient heading,
   and a 429-line glowing node constellation — the single most recognisable
   AI-product cliché there is.

   What is here now: the course, stated plainly, beside a fanned stack of the
   five real modules. The stack is built from SECTIONS, so it cannot describe
   a curriculum the product does not have; adding a module to learnData.js
   adds a card here.

   The separate announcement bar is gone. It carried one short fact, and that
   fact now sits in the eyebrow where it is read rather than skipped.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'

/* Per-card offset and rotation. Hand-set rather than generated from the index
   so the stack reads as handled paper — an even arithmetic fan looks like a
   loop, which is exactly the tell this composition exists to avoid. */
const FAN = [
  { x: '-14px', y: '-104px', r: '-5deg' },
  { x: '-4px',  y: '-52px',  r: '-2.5deg' },
  { x: '4px',   y: '0px',    r: '0.5deg' },
  { x: '16px',  y: '52px',   r: '3deg' },
  { x: '30px',  y: '104px',  r: '5.5deg' },
]

function ModuleFan() {
  /* Reversed so module 01 sits on top of the stack: the card a visitor can
     actually read should be the one they would start with. */
  const cards = SECTIONS.map((section, i) => ({ section, i })).reverse()

  return (
    <div className="module-fan" aria-hidden="true">
      {cards.map(({ section, i }, depth) => {
        const pos = FAN[i] ?? FAN[FAN.length - 1]
        const isFront = depth === cards.length - 1

        return (
          <article
            key={section.id}
            className={`mf-card${isFront ? ' mf-card--front' : ''}`}
            style={{ '--mf-x': pos.x, '--mf-y': pos.y, '--mf-r': pos.r }}
          >
            <div className="mf-num">{String(i + 1).padStart(2, '0')}</div>
            <span className="mf-level">{section.level}</span>
            <h3 className="mf-title">{section.title}</h3>
            <p className="mf-sub">{section.subtitle}</p>
            <div className="mf-meta">
              <span>{section.lessons.length} lessons</span>
              <span>·</span>
              <span>
                {section.lessons.reduce((m, l) => m + parseInt(l.duration, 10), 0)} min
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function Hero({ onStartLearning }) {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-left">
        <p className="hero-eyebrow">
          <b>Beta</b>
          <span>{TOTAL_LESSONS} lessons live · no account needed</span>
        </p>

        {/* The product's one italic-clay emphasis, on the half of the sentence
            that carries the argument. Once per page. */}
        <h1 className="hero-heading" id="hero-heading">
          A field guide to the machines that are{' '}
          <em className="em">already deciding things</em>.
        </h1>

        <p className="hero-sub">
          {TOTAL_LESSONS} short lessons on how AI actually works — training
          data, neural networks, the tools, and the ethics of using them.
          Free, no account, and it remembers where you stopped.
        </p>

        <div className="hero-ctas">
          <button
            type="button"
            className="btn btn-next btn-lg"
            onClick={onStartLearning}
          >
            Start lesson one
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <a href="#learn" className="btn btn-outline btn-lg">See the curriculum</a>
        </div>

        <div className="hero-path">
          {SECTIONS.map((section, i) => (
            <div className="hero-path-item" key={section.id}>
              <span className="hero-path-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="hero-path-label">{section.title}</span>
              <span className="hero-path-count">{section.lessons.length}</span>
            </div>
          ))}
        </div>

        <p className="hero-path-meta">
          Self-paced. Lessons unlock in order. Progress saves in this browser.
        </p>
      </div>

      <ModuleFan />
    </section>
  )
}
