/* ═══════════════════════════════════════════════════════════════════════════
   IntroScenes.jsx — THE TITLE SEQUENCE'S BOOK, AND WHAT IS PRINTED IN IT
   ---------------------------------------------------------------------------
   The hero's field guide, open on the desk, built from the same parts as
   guide/FieldGuide.jsx — the cloth cover with its real printing (Cover),
   the thumb tabs, the ribbon, the page edges, the bending leaves — so that
   when the sequence ends, this book and the hero's are the same object in
   the same place (MOTION_RULES.md → The title sequence).

   Three sheets carry the sequence, top to bottom:

     leaf A   Introduction      the AI you already use, every day
     leaf B   Parts I and II    it guesses the next word; likely isn't true
     page C   Part III          decide where you draw the line

   The leaves turn about the spine in the hinge block with the cover, so
   when the cover shuts they come down with it, in order, like pages.

   Nothing here moves on its own: every animation is laid out in score.js.
   Everything printed is laid out on the sequence's design grid — 1600 × 900
   units, or 900 × 1600 on a tall screen — in `--u`, the page pixels one
   unit takes in close-up.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Fragment } from 'react'
import { Cover, TabFaces } from '../guide/GuidePages'
import { CHAPTERS, CHAPTER_INK, tabDepth } from '../guide/guideData'
import { PARTS } from '../../data/learnData'
import { LEAF_H, STACK } from './camera'

/* What the sequence says. Every phrase names something the course teaches:
   feeds and objectives (Module 1), face and voice (Module 6), assistants
   (Module 3), next-word prediction (Module 3). */
export const EVERY_DAY = ['picks your next video.', 'unlocks your phone.', 'answers your questions.', 'finishes your sentences.']

/* A sentence a language model finishes fluently and wrongly: the myth is
   everywhere in the text it learned from. The candidate slips show relative
   likelihood as bar lengths only — the sequence is illustrative, so it
   prints no figures it did not compute. */
export const GUESSES = [
  { word: 'visible', slips: [['visible', 0.58], ['long', 0.24], ['old', 0.11]] },
  { word: 'from', slips: [['from', 0.81], ['to', 0.12]] },
  { word: 'space.', slips: [] },
]

/* Where a slip sits under its word, and where its word sits in the slip, in
   ems of the sentence — score.js flies the word from there into the line. */
export const SLIP = { top: 1.34, step: 0.8, padX: 0.2, padY: 0.13 }

const ink = (j) => `var(${CHAPTER_INK[j]})`

/** Words that rise out of their own masks, as the hero's heading does
    (motion/SplitText.jsx), driven from score.js instead of a transition. */
function Words({ text }) {
  return text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="st-w"><span className="st-i">{w}</span></span>
    </Fragment>
  ))
}

/** One printed page: a running head and a folio, and the design grid's
    frame placed where the screen will be in close-up. A verso is the
    left-hand page, so its frame is mirrored about the page. */
function Print({ frame, head, folio, verso = false, children }) {
  const style = {
    '--u': `${frame.u}px`,
    top: frame.top,
    width: frame.width,
    height: frame.height,
    ...(verso ? { right: frame.left } : { left: frame.left }),
  }
  return (
    <div className={`ts-print${verso ? ' ts-print--verso' : ''}`} style={style}>
      <p className="ts-head">
        <span className="ts-head-label">{head}</span>
        <span className="ts-folio">{folio}</span>
      </p>
      {children}
    </div>
  )
}

function Introduction({ frame }) {
  return (
    <Print frame={frame} head="Introduction" folio="1">
      <div className="ts-a">
        <p className="ts-a-lead"><Words text="The AI you already use" /></p>
        <p className="ts-a-roll">
          {EVERY_DAY.map((phrase) => <span className="ts-a-phrase" key={phrase}>{phrase}</span>)}
        </p>
      </div>
    </Print>
  )
}

function NextWord({ frame }) {
  const head = (
    <span className="ts-cues">
      <span className="ts-cue ts-cue--1" style={{ '--chapter': ink(0) }}>Part I · Understand AI</span>
      <span className="ts-cue ts-cue--2" style={{ '--chapter': ink(4) }}>Part II · Use AI well</span>
    </span>
  )
  return (
    <Print frame={frame} head={head} folio="2">
      <div className="ts-b">
        <p className="ts-b-cap">
          <span className="ts-cap ts-cap--1"><Words text="It guesses the next word." /></span>
          <span className="ts-cap ts-cap--2"><Words text="Likely isn’t the same as true." /></span>
        </p>
        <p className="ts-b-line">
          <span className="ts-b-given"><Words text="The Great Wall of China is" /></span>{' '}
          <span className="ts-b-made">
            {GUESSES.map((g, i) => (
              <Fragment key={g.word}>
                {i > 0 && ' '}
                <span className="ts-slot" data-slot={i}>
                  <span className="ts-slot-word">{g.word}</span>
                  {g.slips.length > 0 && (
                    <span className="ts-slips">
                      {g.slips.map(([w, p], j) => (
                        <span className="ts-slip" data-j={j} data-p={p} key={w} style={{ top: `${SLIP.top + j * SLIP.step}em` }}>
                          <span className="ts-slip-card" />
                          <span className="ts-bar"><span className="ts-bar-fill" /></span>
                          <span className="ts-fly"><span>{w}</span></span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </Fragment>
            ))}
            {/* A pencil ring round the claim: one loop, overshooting where
                it closes, as a hand draws it. */}
            <svg className="ts-ring" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength="1" d="M214 8C112 4 20 16 10 50s92 46 196 44 188-10 186-46S296 6 170 12" />
            </svg>
            <span className="ts-stamp">Not true</span>
          </span>
        </p>
      </div>
    </Print>
  )
}

function Responsibly({ frame }) {
  return (
    <Print frame={frame} head={<span style={{ '--chapter': ink(5) }}>Part III · Use AI responsibly</span>} folio="3">
      <div className="ts-c">
        <p className="ts-c-head"><Words text="Decide where you draw the line." /></p>
        <svg className="ts-c-line" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength="1" d="M6 26C170 12 330 30 520 21s392-12 520-4c60 4 110 2 150-8" />
        </svg>
      </div>
    </Print>
  )
}

/* The left-hand page the book lies open at when the camera pulls back:
   Part III's opener, from the course's own table of Parts. */
function PartOpener({ frame }) {
  const part = PARTS[2]
  return (
    <Print frame={frame} head={`Part ${part.id}`} folio="" verso>
      <div className="ts-v">
        <span className="ts-v-num">{part.id}</span>
        <p className="ts-v-title">{part.title}</p>
        <p className="ts-v-sum">{part.summary}</p>
      </div>
    </Print>
  )
}

/** A sheet that turns: two panels hinged at 58% so the paper bends
    (fieldGuide.css → Paper bends), each showing its share of both faces. */
function Leaf({ id, recto, verso }) {
  const face = (side, content) => (
    <div className={`fg-leaf-face fg-leaf-${side} ts-paper`}>
      <div className="fg-leaf-sheet">
        {content}
        {side === 'recto' && <span className="fg-cast fg-cast--right" />}
      </div>
      <span className="fg-fold" />
      <span className="fg-shade" />
    </div>
  )
  return (
    <div className="fg-leaf ts-leaf" data-leaf={id} style={{ transform: `rotateY(180deg) translateZ(${LEAF_H[id]}px)` }}>
      {['inner', 'outer'].map((part) => (
        <div key={part} className={`fg-leaf-part fg-leaf-part--${part}`}>
          {face('recto', recto)}
          {face('verso', verso)}
        </div>
      ))}
    </div>
  )
}

/**
 * The book, open on the desk at the hero's position and size. `g` is the
 * measured hero (camera.js → measureHero), `frame` the design grid's place
 * on a page, `M` the close-up magnification the world is built at.
 */
export function IntroBook({ g, frame, M }) {
  const desk = {
    left: g.cx - g.bw / 2,
    top: g.cy - g.bh / 2,
    width: g.bw,
    height: g.bh,
    '--fg-w': `${g.bw}px`,
    '--fg-h': `${g.bh}px`,
    '--fg-r': STACK,
    '--fg-n': 0,
    '--fg-angle': 180,
    '--fg-sin': 0,
    '--sway': '5.3s',
    /* One screen pixel at close-up, for hairlines on the pages. */
    '--hair': `${1 / M}px`,
  }
  return (
    <div className="ts-world" style={{ zoom: M }}>
      <div className="ts-desk" style={desk}>
        <div className="ts-shadow"><span className="ts-shadow-open" /></div>
        <div className="ts-press">
          <div className="fg-board fg-board--back" />
          <div className="fg-stack">
            <span className="fg-edge fg-edge--bottom" />
            <span className="fg-edge fg-edge--fore" />
            <div className="fg-page fg-page--right ts-paper" data-page="c">
              <Responsibly frame={frame} />
              <span className="fg-cast fg-cast--right" />
            </div>
            <span className="fg-ribbon" />
          </div>
          <div className="fg-tabs fg-tabs--right">
            {CHAPTERS.map((c, j) => (
              <span
                key={c.id}
                className="fg-tab"
                style={{ '--chapter': ink(j), '--j': j, '--tab-z': `${2 + 10 - tabDepth(j)}px` }}
              >
                <TabFaces j={j} />
              </span>
            ))}
          </div>
          <div className="fg-hinge ts-hinge">
            <div className="fg-cover">
              <Cover />
              <span className="fg-glare" />
              <span className="fg-shade fg-shade--cover" />
            </div>
            <span className="fg-edge fg-edge--hinge" />
            <div className="fg-board fg-board--inside" />
            <Leaf id="b" recto={<NextWord frame={frame} />} verso={<PartOpener frame={frame} />} />
            <Leaf id="a" recto={<Introduction frame={frame} />} verso={null} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* The heading's two hand-drawn rules (Hero.jsx). */
const SCRIBBLE = {
  a: 'M3 12.5C48 6.5 96 15 150 9.5s104-3.5 147 1.5',
  b: 'M4 9.5C58 14 108 5.5 158 11s96 2 139-3',
}

/** The hero's headline, set where the hero's heading is, in the same
    markup (Hero.jsx) so it breaks and inks exactly as the heading does —
    with whichever of its two rules the heading is showing. */
export function IntroTitle({ g }) {
  return (
    <p className="hero-heading ts-title" style={{ left: g.heading.x, top: g.heading.y, width: g.heading.w }}>
      <Words text="A field guide to the AI" />{' '}
      <em className="em hero-em">
        <Words text="you already use" />
        <svg className="hero-scribble" viewBox="0 0 300 18" preserveAspectRatio="none">
          <path className={`hero-scribble-${g.ink}`} pathLength="1" d={SCRIBBLE[g.ink]} />
        </svg>
      </em>
      <span className="st-w"><span className="st-i">.</span></span>
    </p>
  )
}
