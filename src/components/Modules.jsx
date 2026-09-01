import { useState } from 'react'

/* ── Buzzword tooltip ───────────────────────────────────────────────────── */
function B({ word, def }) {
  const [show, setShow] = useState(false)

  return (
    <span
      className="buzzword"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      role="button"
      aria-describedby={show ? `tip-${word}` : undefined}
    >
      {word}
      {show && (
        <span className="bw-tip" id={`tip-${word}`} role="tooltip">
          <strong className="bw-tip-term">{word}</strong>
          <span className="bw-tip-def">{def}</span>
        </span>
      )}
    </span>
  )
}

/* ── Browser mockups ─────────────────────────────────────────────────────── */

/* Fundamentals: lesson viewer with sidebar nav */
function FundamentalsMockup() {
  return (
    <div className="mock-browser" aria-hidden="true">
      <div className="mock-chrome">
        <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
        <span className="mock-url">lunx.app/fundamentals/lesson-1</span>
      </div>
      <div className="mock-body">
        <div className="mock-lesson-layout">
          {/* Sidebar */}
          <div className="mock-sidebar">
            {[true, false, false, false, false].map((active, i) => (
              <div className={`mock-side-item${active ? ' active' : ''}`} key={i}>
                <span className="mock-side-dot" />
                <span className="mock-side-bar" style={{ width: `${55 + i * 9}%` }} />
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="mock-content-col">
            <span className="mock-tag">Lesson 1</span>
            <div className="mock-line w-90" />
            <div className="mock-line w-80 dim" style={{ marginTop: '0.25rem' }} />
            <div className="mock-line w-90 dim" />
            <div className="mock-line w-70 dim" />
            <div className="mock-line w-85 dim" />
            <div className="mock-line w-60 dim" />
            <div className="mock-prog-track" style={{ marginTop: '0.75rem' }}>
              <div className="mock-prog-fill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Practical Tools: tool comparison grid */
function ToolsMockup() {
  const cards = [
    { name: 'ChatGPT', hl: true },
    { name: 'Claude',  hl: false },
    { name: 'Midjourney', hl: false },
    { name: 'Copilot', hl: false },
  ]
  return (
    <div className="mock-browser" aria-hidden="true">
      <div className="mock-chrome">
        <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
        <span className="mock-url">lunx.app/tools/compare</span>
      </div>
      <div className="mock-body">
        <div className="mock-tool-grid">
          {cards.map((c, i) => (
            <div className={`mock-tool-card${c.hl ? ' hl' : ''}`} key={i}>
              <div className="mock-tool-icon" />
              <div className="mock-tool-name" />
              <div className="mock-tool-desc" />
              <div className="mock-tool-desc w-80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Ethics: scenario + multiple choice */
function EthicsMockup() {
  return (
    <div className="mock-browser" aria-hidden="true">
      <div className="mock-chrome">
        <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
        <span className="mock-url">lunx.app/ethics/scenario-3</span>
      </div>
      <div className="mock-body">
        <div className="mock-eth-badge">⚠ Ethical Dilemma</div>
        <div className="mock-scenario">
          <div className="mock-line w-90" />
          <div className="mock-line w-80 dim" />
          <div className="mock-line w-70 dim" />
        </div>
        <div className="mock-choices">
          {[true, false, false].map((sel, i) => (
            <div className={`mock-choice${sel ? ' sel' : ''}`} key={i}>
              <span className={`mock-radio${sel ? ' sel' : ''}`} />
              <span className={`mock-choice-bar${i === 1 ? ' w-70' : i === 2 ? ' w-85' : ''}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Module data ─────────────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 'fundamentals',
    eyebrow: 'Module 01 — Fundamentals',
    heading: 'Build a foundation that actually sticks.',
    stat: <><em>30+ lessons</em> covering AI from absolute zero to confident understanding.</>,
    body: (
      <>
        Learn what <B word="Machine Learning" def="A type of AI where computers learn patterns from data rather than following hand-coded rules. The model 'trains' by adjusting itself based on examples." /> really means, why <B word="Neural Networks" def="Computational systems loosely inspired by the brain — layers of connected nodes that learn to recognise patterns in text, images, and data." /> think the way they do, and how <B word="Training Data" def="The dataset used to teach a model. Its quality, diversity, and hidden biases directly shape what the model learns to do — and not do." /> shapes everything an AI produces.
      </>
    ),
    features: [
      "What AI is — and what it still can't do",
      'How models learn from data',
      'Supervised vs. unsupervised learning',
      'How to critically evaluate AI output',
      'Real-world applications across industries',
    ],
    mockup: <FundamentalsMockup />,
    flip: false,
  },
  {
    id: 'tools',
    eyebrow: 'Module 02 — Practical Tools',
    heading: "Master the AI tools everyone's actually using.",
    stat: <><em>6 tools, hands-on</em> — prompt engineering to image generation.</>,
    body: (
      <>
        Get hands-on with <B word="LLMs" def="Large Language Models — AI systems trained on massive text corpora to understand and generate human-like language (e.g., ChatGPT, Claude, Gemini)." /> like ChatGPT and Claude, generate images with Midjourney, write smarter code with GitHub Copilot, and design faster with Canva AI. Every tool comes with real <B word="Prompt Engineering" def="The craft of writing clear, specific instructions for AI models to get better, more reliable, and more useful outputs from them." /> practice.
      </>
    ),
    features: [
      'Prompt engineering fundamentals',
      'ChatGPT & Claude deep-dives',
      'AI image generation with Midjourney',
      'GitHub Copilot for student coders',
      'Canva AI for visual storytelling',
    ],
    mockup: <ToolsMockup />,
    flip: true,
  },
  {
    id: 'ethics',
    eyebrow: 'Module 03 — AI Ethics',
    heading: 'Navigate AI responsibly in every context.',
    stat: <><em>Real dilemmas,</em> no easy answers — think, don't just comply.</>,
    body: (
      <>
        Explore genuine tensions around <B word="Algorithmic Bias" def="When an AI system produces systematically unfair results — often because its training data reflects historical inequalities or underrepresents certain groups." />, academic integrity, <B word="Deepfakes" def="AI-generated synthetic media — video, audio, or images — that make it appear someone said or did something they never did." />, and data privacy through interactive scenarios designed for real-world application.
      </>
    ),
    features: [
      'Academic integrity in the age of AI',
      'Recognising algorithmic bias',
      'Privacy, consent, and your data',
      'Misinformation and deepfake literacy',
      'Building lifelong ethical AI habits',
    ],
    mockup: <EthicsMockup />,
    flip: false,
  },
]

/* ── Section component ───────────────────────────────────────────────────── */
export default function Modules() {
  return (
    <div id="modules">
      {MODULES.map((mod) => (
        <section key={mod.id} id={mod.id} className="section" aria-labelledby={`${mod.id}-heading`}>
          <div className={`section-wrap${mod.flip ? ' flip' : ''}`}>

            {/* Text side */}
            <div className="reveal">
              <span className="section-eyebrow">{mod.eyebrow}</span>
              <h2 className="section-heading" id={`${mod.id}-heading`}>
                {mod.heading}
              </h2>
              <p className="section-stat">{mod.stat}</p>
              <p className="section-body">{mod.body}</p>

              <ul className="feature-list" aria-label={`${mod.id} topics`}>
                {mod.features.map((f, i) => (
                  <li className="feature-item" key={i}>
                    <span className="feature-dot" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <a href="#" className="btn btn-outline section-cta">
                Explore Module →
              </a>
            </div>

            {/* Mockup side */}
            <div className="reveal d2">
              {mod.mockup}
            </div>

          </div>
        </section>
      ))}
    </div>
  )
}
