/* ═══════════════════════════════════════════════════════════════════════════
   otterLab.jsx — THE OTTER LAB (development only)
   ---------------------------------------------------------------------------
   /otter-lab.html on the dev server. Every pose side by side, and a button
   for every emotion, act, mood, intensity and event reaction, so the
   mascot can be checked by eye without walking the course. Event buttons
   here only PREVIEW the reaction mapping — they do not touch progress.
   ═══════════════════════════════════════════════════════════════════════════ */

import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Otter from '../components/otter/Otter'
import { ACTS } from '../components/otter/acts'
import { EMOTIONS } from '../components/otter/rig'
import { EVENT_REACTIONS } from '../components/otter/reactions'

const POSES = ['hold', 'cheer', 'perch', 'peek']

const css = `
  body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-ui); }
  .lab { max-width: 1180px; margin: 0 auto; padding: var(--sp-8) var(--sp-6) var(--sp-16); }
  .lab h1 { font-family: var(--font-display); font-size: var(--fs-section); margin: 0 0 var(--sp-2); }
  .lab p { color: var(--ink-muted); margin: 0 0 var(--sp-6); max-width: 46rem; }
  .lab-stage { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-6); align-items: end; margin-bottom: var(--sp-8); }
  .lab-cell { display: grid; justify-items: center; gap: var(--sp-3); padding: var(--sp-6) var(--sp-4) var(--sp-4); border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); cursor: pointer; }
  .lab-cell.is-on { border-color: var(--evergreen); box-shadow: inset 0 0 0 1px var(--evergreen); }
  .lab-cell span { font-size: var(--fs-caption); font-weight: var(--fw-bold); letter-spacing: var(--ls-label); text-transform: uppercase; color: var(--ink-faint); }
  .lab-hold, .lab-cheer { width: 200px; }
  .lab-card { position: relative; width: 220px; margin-top: 30px; }
  .lab-card .otc-mock { width: 100px; height: calc(100px * 238 / 240); margin: 0 auto; position: relative; z-index: 1; }
  .lab-card .otc-mock .ot { position: absolute; inset: 0 0 auto; }
  .lab-card .card { height: 90px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface-raised); }
  .lab-frame { position: relative; width: 220px; margin-top: 90px; }
  .lab-frame .peek { position: absolute; width: 140px; right: 20px; bottom: calc(100% - 140px * 20 / 240); }
  .lab-frame .card { height: 90px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface-raised); }
  .lab-row { margin-bottom: var(--sp-5); }
  .lab-row h2 { font-size: var(--fs-body); margin: 0 0 var(--sp-2); }
  .lab-btns { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .lab-btns button { font: inherit; font-size: var(--fs-small); padding: 6px 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface-raised); color: var(--ink); cursor: pointer; }
  .lab-btns button:hover { border-color: var(--evergreen); color: var(--evergreen); }
  .lab-btns button.is-on { background: var(--evergreen); color: var(--surface-raised); border-color: var(--evergreen); }
  .lab-btns button:disabled { opacity: 0.35; cursor: default; }
`

function Lab() {
  const refs = { hold: useRef(null), cheer: useRef(null), perch: useRef(null), peek: useRef(null) }
  const [target, setTarget] = useState('all')
  const [mood, setMood] = useState('happy')
  const [intensity, setIntensity] = useState('full')
  const each = (fn) => POSES.forEach((p) => { if (target === 'all' || target === p) fn(refs[p].current, p) })

  const play = (name) => each((o) => { if (o?.can(name)) { o.stop(); o.play(name) } })
  const feel = (name) => each((o) => o?.feel(name, 2600))
  const event = (type) => {
    const r = EVENT_REACTIONS[type]
    each((o) => {
      if (!o) return
      o.stop()
      if (r.sequence) o.sequence(r.acts.filter((a) => o.can(a)))
      else { const a = r.acts.find((x) => o.can(x)); if (a) o.play(a) }
    })
  }

  return (
    <div className="lab">
      <style>{css}</style>
      <h1>The otter lab</h1>
      <p>Development only. Click a pose to aim the buttons at it (click again for all). Point at an otter, click it, boop its nose, or click it five times quickly. Leave the page alone for a while and the otters doze off.</p>

      <div className="lab-stage">
        {POSES.map((p) => (
          <div key={p} className={`lab-cell${target === p ? ' is-on' : ''}`} onClick={() => setTarget(target === p ? 'all' : p)}>
            {p === 'hold' || p === 'cheer' ? (
              <div className={`lab-${p}`}><Otter ref={refs[p]} pose={p} mood={mood} intensity={intensity} region={`lab:${p}`} /></div>
            ) : p === 'perch' ? (
              <div className="lab-card">
                <div className="otc-mock"><Otter ref={refs[p]} pose="perch" mood={mood} intensity={intensity} region="lab:perch" /></div>
                <div className="card" />
              </div>
            ) : (
              <div className="lab-frame">
                <div className="peek"><Otter ref={refs[p]} pose="peek" mood={mood} intensity={intensity} region="lab:peek" /></div>
                <div className="card" />
              </div>
            )}
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="lab-row">
        <h2>Emotions (held 2.6s)</h2>
        <div className="lab-btns">{Object.keys(EMOTIONS).map((e) => <button key={e} onClick={() => feel(e)}>{e}</button>)}</div>
      </div>
      <div className="lab-row">
        <h2>Acts</h2>
        <div className="lab-btns">{Object.keys(ACTS).map((a) => <button key={a} onClick={() => play(a)}>{a}{ACTS[a].rare ? ' ★' : ''}</button>)}</div>
      </div>
      <div className="lab-row">
        <h2>Event reactions (preview only)</h2>
        <div className="lab-btns">{Object.keys(EVENT_REACTIONS).map((t) => <button key={t} onClick={() => event(t)}>{t}</button>)}</div>
      </div>
      <div className="lab-row">
        <h2>Mood</h2>
        <div className="lab-btns">{Object.keys(EMOTIONS).map((m) => <button key={m} className={mood === m ? 'is-on' : ''} onClick={() => setMood(m)}>{m}</button>)}</div>
      </div>
      <div className="lab-row">
        <h2>Intensity</h2>
        <div className="lab-btns">{['full', 'calm', 'quiet', 'still'].map((i) => <button key={i} className={intensity === i ? 'is-on' : ''} onClick={() => setIntensity(i)}>{i}</button>)}</div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Lab /></StrictMode>)
