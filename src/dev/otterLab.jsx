/* ═══════════════════════════════════════════════════════════════════════════
   otterLab.jsx — THE OTTER LAB (development only)
   ---------------------------------------------------------------------------
   /otter-lab.html on the dev server. Every pose side by side, a button for
   every act and mood, and a page lane and a card lane to watch it roam, so
   the mascot can be checked by eye without walking the course. Event
   buttons here only PREVIEW the reaction mapping — they touch no progress.
   ═══════════════════════════════════════════════════════════════════════════ */

import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../App.css'
import Otter from '../components/otter/Otter'
import OtterLane from '../components/otter/OtterLane'
import { ACTS, MOODS } from '../components/otter/acts'
import { EVENT_REACTIONS } from '../components/otter/reactions'

const POSES = ['stand', 'hold', 'sit', 'hang', 'climb', 'swim', 'peek', 'float']

const css = `
  body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-ui); }
  .lab { max-width: 1100px; margin: 0 auto; padding: var(--sp-8) var(--sp-6) 220px; }
  .lab h1 { font-family: var(--font-display); font-size: var(--fs-section); margin: 0 0 var(--sp-2); }
  .lab p { color: var(--ink-muted); margin: 0 0 var(--sp-6); }
  .lab-stage { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-6); align-items: end; margin-bottom: var(--sp-8); }
  .lab-cell { display: grid; justify-items: center; gap: var(--sp-3); padding: var(--sp-6) var(--sp-4) var(--sp-4); border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); }
  .lab-cell > div { width: 130px; margin: 30px 0 10px; }
  .lab-cell span { font-size: var(--fs-caption); font-weight: var(--fw-bold); letter-spacing: var(--ls-label); text-transform: uppercase; color: var(--ink-faint); }
  .lab-peek { border-bottom: 3px solid var(--line-strong); }
  .lab h2 { font-size: var(--fs-lead); margin: var(--sp-6) 0 var(--sp-3); }
  .lab-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .lab-row button { padding: 6px 12px; border: 1px solid var(--line-strong); border-radius: var(--r-pill); background: var(--surface-raised); font: inherit; font-size: var(--fs-small); cursor: pointer; }
  .lab-row button:hover { border-color: var(--evergreen); color: var(--evergreen); }
  .lab-card { width: 320px; margin-top: var(--sp-6); }
  .lab-card-body { height: 120px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); }
`

function Lab() {
  const refs = Object.fromEntries(POSES.map((p) => [p, { current: null }]))
  const setRef = (p) => (o) => { refs[p].current = o }
  const card = useRef(null)
  window.__lab = refs  // the lab is development-only: lets a console drive each otter
  const [mood, setMood] = useState('happy')
  const all = (name) => POSES.forEach((p) => refs[p].current?.can(name) && refs[p].current.play(name))

  return (
    <div className="lab">
      <style>{css}</style>
      <h1>Otter lab</h1>
      <p>Click an otter for a trick, five times quickly for dizzy. The lane at the bottom of the window is the landing page's.</p>
      <div className="lab-stage">
        {POSES.map((p) => (
          <div key={p} className="lab-cell">
            <div className={p === 'peek' ? 'lab-peek' : ''}><Otter ref={setRef(p)} pose={p} mood={mood} region={`lab:${p}`} /></div>
            <span>{p}</span>
          </div>
        ))}
      </div>
      <h2>Acts</h2>
      <div className="lab-row">{Object.keys(ACTS).map((a) => <button key={a} type="button" onClick={() => all(a)}>{a}</button>)}</div>
      <h2>Moods</h2>
      <div className="lab-row">{Object.keys(MOODS).map((m) => <button key={m} type="button" onClick={() => setMood(m)}>{m}</button>)}</div>
      <h2>Event reactions (preview only)</h2>
      <div className="lab-row">
        {Object.entries(EVENT_REACTIONS).map(([type, r]) => (
          <button key={type} type="button" onClick={() => card.current?.cue([r.acts.find((a) => card.current.can(a))].filter(Boolean))}>{type}</button>
        ))}
      </div>
      <div className="lab-card">
        <OtterLane ref={card} variant="card" pose="stand" mood={mood} region="lab:card" />
        <div className="lab-card-body" />
      </div>
      <OtterLane variant="page" pose="hold" mood="mischievous" region="lab:page" stops={false} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Lab /></StrictMode>)
