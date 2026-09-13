/* ═══════════════════════════════════════════════════════════════════════════
   GuidePages.jsx — WHAT IS PRINTED IN THE FIELD GUIDE
   ---------------------------------------------------------------------------
   Pure content: the cover, and the two faces of every spread. The physics
   live in FieldGuide.jsx; nothing here moves on its own except the compass,
   whose needle is turned from outside through a CSS variable.

   Every page is real course data. The contents rows and the "back to
   contents" link are real buttons; FieldGuide makes hidden faces inert so the
   keyboard never lands on a page nobody can see.
   ═══════════════════════════════════════════════════════════════════════════ */

import { getLessonIcon } from '../learn/LessonIcons'
import {
  CHAPTERS, CHAPTER_INK, LONGEST_LESSON, TOTAL_LESSONS, TOTAL_MINUTES, folio, minutesOf, pad,
} from './guideData'

const ink = (j) => `var(${CHAPTER_INK[j % CHAPTER_INK.length]})`

/* ── The cover ───────────────────────────────────────────────────────────── */

/* The seal's type runs round the compass. Real figures only. */
const SEAL = `A FIELD GUIDE TO ARTIFICIAL INTELLIGENCE · ${TOTAL_LESSONS} LESSONS · ${CHAPTERS.length} CHAPTERS · `

export function Cover() {
  return (
    <div className="fg-cover-art">
      <span className="fg-cover-rule" aria-hidden="true" />
      <span className="fg-cover-mark">LunX</span>

      {/* The compass, drawn in the icon language. Its moving parts are
          separate HTML layers, each with its own SVG, so turning them is a
          compositor transform — animating an element INSIDE one SVG would
          repaint the whole cover every frame. --needle is written by
          FieldGuide from an under-damped spring. */}
      <span className="fg-compass" aria-hidden="true">
        <svg className="fg-compass-seal" viewBox="0 0 120 120">
          <defs>
            <path id="fg-seal-path" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" />
          </defs>
          <text>
            <textPath href="#fg-seal-path" startOffset="0">{SEAL}</textPath>
          </text>
        </svg>
        <svg className="fg-compass-face" viewBox="0 0 120 120">
          <circle className="fg-compass-ring" cx="60" cy="60" r="36" />
          <g className="fg-compass-ticks">
            {Array.from({ length: 24 }, (_, i) => (
              <line key={i} x1="60" y1="26" x2="60" y2={i % 6 === 0 ? 32 : 29} transform={`rotate(${i * 15} 60 60)`} />
            ))}
          </g>
          <text className="fg-compass-n" x="60" y="42" textAnchor="middle">N</text>
        </svg>
        <svg className="fg-compass-needle" viewBox="0 0 120 120">
          <path className="fg-needle-n" d="M60 33 L65 60 L55 60 Z" />
          <path className="fg-needle-s" d="M60 87 L65 60 L55 60 Z" />
          <circle className="fg-needle-pin" cx="60" cy="60" r="3" />
        </svg>
      </span>

      <h3 className="fg-cover-title">
        A Field Guide
        <span>to Artificial Intelligence</span>
      </h3>
      <span className="fg-cover-foot">{TOTAL_LESSONS} lessons · {CHAPTERS.length} chapters</span>
    </div>
  )
}

/* ── Left pages ──────────────────────────────────────────────────────────── */

function InsideCover({ spread }) {
  return (
    <div className="fg-print fg-print--endpaper">
      <span className="fg-label">This guide belongs to</span>
      <p className="fg-owner">whoever is reading it.</p>
      <p className="fg-note">
        Chapters run from beginner to advanced. No lesson takes longer
        than {LONGEST_LESSON} minutes.
      </p>
      <ul className="fg-howto">
        <li><kbd>←</kbd><kbd>→</kbd> turn a chapter</li>
        <li>Pull a tab to jump to it</li>
      </ul>
      <span className="fg-folio fg-folio--left">{folio(spread, 'left')}</span>
    </div>
  )
}

function ChapterOpener({ spread }) {
  const j = spread - 1
  const s = CHAPTERS[j]
  return (
    <div className="fg-print fg-print--opener" style={{ '--chapter': ink(j) }}>
      <span className="fg-label">Chapter · {s.level}</span>
      <span className="fg-opener-num">{pad(j + 1)}</span>
      <h4 className="fg-opener-title">{s.title}</h4>
      <p className="fg-opener-sub">{s.subtitle}</p>
      <span className="fg-opener-meta">
        {s.lessons.length} lessons · {minutesOf(s)} min
      </span>
      <span className="fg-opener-dots" aria-hidden="true">
        {s.lessons.map((l) => <i key={l.id} />)}
      </span>
      <span className="fg-folio fg-folio--left">{folio(spread, 'left')}</span>
    </div>
  )
}

export function LeftPage({ spread }) {
  return spread <= 0 ? <InsideCover spread={spread} /> : <ChapterOpener spread={spread} />
}

/* ── Right pages ─────────────────────────────────────────────────────────── */

function Contents({ spread, onGo }) {
  return (
    <div className="fg-print fg-print--contents">
      <div className="fg-page-head">
        <span className="fg-label">Contents</span>
        <span className="fg-head-meta">{TOTAL_LESSONS} lessons · {TOTAL_MINUTES} min</span>
      </div>
      <ol className="fg-toc">
        {CHAPTERS.map((s, j) => (
          <li key={s.id} style={{ '--chapter': ink(j), '--n': j }}>
            <button
              type="button"
              className="fg-toc-row"
              onClick={(e) => { e.stopPropagation(); onGo?.(j + 1) }}
              aria-label={`Turn to chapter ${j + 1}, ${s.title}`}
            >
              <span className="fg-toc-n">{pad(j + 1)}</span>
              <span className="fg-toc-t">{s.title}</span>
              <span className="fg-leader" aria-hidden="true" />
              <span className="fg-toc-d">{folio(j + 1, 'left')}</span>
            </button>
          </li>
        ))}
      </ol>
      <span className="fg-folio fg-folio--right">{folio(spread, 'right')}</span>
    </div>
  )
}

function Lessons({ spread, onGo }) {
  const j = spread - 1
  const s = CHAPTERS[j]
  return (
    <div className="fg-print fg-print--lessons" style={{ '--chapter': ink(j) }}>
      <div className="fg-page-head">
        <span className="fg-label">{pad(j + 1)} · {s.title}</span>
      </div>
      <ol className="fg-lessons">
        {s.lessons.map((lesson, n) => (
          <li key={lesson.id} style={{ '--n': n }}>
            <span className="fg-lesson-ico" aria-hidden="true">{getLessonIcon(lesson.id)}</span>
            <span className="fg-lesson-t">{lesson.title}</span>
            <span className="fg-leader" aria-hidden="true" />
            <span className="fg-lesson-d">{parseInt(lesson.duration, 10)}′</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="fg-back-link"
        onClick={(e) => { e.stopPropagation(); onGo?.(0) }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
        Contents
      </button>
      <span className="fg-folio fg-folio--right">{folio(spread, 'right')}</span>
    </div>
  )
}

export function RightPage({ spread, onGo }) {
  return spread <= 0
    ? <Contents spread={spread} onGo={onGo} />
    : <Lessons spread={spread} onGo={onGo} />
}

/* ── A thumb tab ─────────────────────────────────────────────────────────── */

export function TabFaces({ j }) {
  return (
    <>
      <span className="fg-tab-face">{pad(j + 1)}</span>
      <span className="fg-tab-face fg-tab-face--back">{pad(j + 1)}</span>
    </>
  )
}
