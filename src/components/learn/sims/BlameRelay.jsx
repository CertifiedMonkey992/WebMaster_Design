/* BlameRelay — Lesson 2.2. Backpropagation on the smallest network that has
   one: x → (w₁) → hidden h = ReLU(w₁·x) → (w₂) → output y = w₂·h, compared
   with a target t by the loss ½(y − t)². Step through one full cycle —
   forward, error, blame passed back to each weight, update — with the real
   arithmetic shown at every stage. */

import { useMemo, useState } from 'react'
import { SimFrame, Btn, Stat } from './kit'

const X = 2
const T = 3
const LR = 0.1

const STAGES = [
  { id: 'forward', label: 'Forward pass' },
  { id: 'loss', label: 'Measure the error' },
  { id: 'out', label: 'Blame at the output' },
  { id: 'w2', label: 'Blame for w₂' },
  { id: 'h', label: 'Pass blame back to h' },
  { id: 'w1', label: 'Blame for w₁' },
  { id: 'update', label: 'Nudge both weights' },
]

function compute(w1, w2) {
  const z = w1 * X
  const h = Math.max(0, z)
  const y = w2 * h
  const loss = 0.5 * (y - T) ** 2
  const dy = y - T
  const dw2 = dy * h
  const dh = dy * w2
  const dw1 = dh * (z > 0 ? 1 : 0) * X
  return { z, h, y, loss, dy, dw2, dh, dw1, nw1: w1 - LR * dw1, nw2: w2 - LR * dw2 }
}

const f = (v) => (Math.abs(v) < 1e-9 ? '0' : Number(v.toFixed(3)).toString())

export default function BlameRelay({ onDone }) {
  const [weights, setWeights] = useState({ w1: 0.5, w2: 1.5 })
  const [stage, setStage] = useState(0)
  const [losses, setLosses] = useState([])
  const c = useMemo(() => compute(weights.w1, weights.w2), [weights])

  const next = () => {
    if (stage < STAGES.length - 1) {
      const s = stage + 1
      setStage(s)
      if (s === STAGES.length - 1) onDone?.()
      return
    }
    setLosses((l) => [...l, c.loss])
    setWeights({ w1: c.nw1, w2: c.nw2 })
    setStage(0)
  }

  const at = (id) => stage >= STAGES.findIndex((s) => s.id === id)
  const lines = [
    at('forward') && <>h = ReLU(w₁ · x) = ReLU({f(weights.w1)} × {X}) = <b>{f(c.h)}</b>; y = w₂ · h = {f(weights.w2)} × {f(c.h)} = <b>{f(c.y)}</b></>,
    at('loss') && <>The target is {T}. Loss = ½(y − t)² = ½({f(c.y)} − {T})² = <b>{f(c.loss)}</b></>,
    at('out') && <>How the loss changes with y: y − t = <b>{f(c.dy)}</b>. Negative means “y should be bigger.”</>,
    at('w2') && <>w₂’s share of the blame = (y − t) × h = {f(c.dy)} × {f(c.h)} = <b>{f(c.dw2)}</b></>,
    at('h') && <>Blame passed back to h = (y − t) × w₂ = {f(c.dy)} × {f(weights.w2)} = <b>{f(c.dh)}</b></>,
    at('w1') && <>w₁’s share = blame at h × ReLU′ × x = {f(c.dh)} × {c.z > 0 ? 1 : 0} × {X} = <b>{f(c.dw1)}</b></>,
    at('update') && <>Step against the blame, learning rate {LR}: w₁ → {f(weights.w1)} − {LR}×({f(c.dw1)}) = <b>{f(c.nw1)}</b>; w₂ → {f(weights.w2)} − {LR}×({f(c.dw2)}) = <b>{f(c.nw2)}</b></>,
  ].filter(Boolean)

  return (
    <SimFrame
      title="The blame relay, by the numbers"
      provenance="computed"
      note={`Input x = ${X}, target t = ${T}, learning rate ${LR}. Every number below is calculated, not typed.`}
      controls={
        <div className="sim-row">
          <Btn primary onClick={next}>{stage < STAGES.length - 1 ? `Next: ${STAGES[stage + 1].label}` : 'Apply the update and go again'}</Btn>
          <Btn quiet onClick={() => { setWeights({ w1: 0.5, w2: 1.5 }); setStage(0); setLosses([]) }}>Start over</Btn>
        </div>
      }
      footer={
        <div className="sim-stats">
          <Stat label="w₁" value={f(weights.w1)} />
          <Stat label="w₂" value={f(weights.w2)} />
          <Stat label="loss now" value={f(c.loss)} tone={c.loss < 0.05 ? 'moss' : undefined} />
          {losses.length > 0 && <Stat label="loss after each step" value={[...losses, c.loss].map((l) => f(l)).join(' → ')} />}
        </div>
      }
    >
      <svg className="br-net" viewBox="0 0 520 110" role="img" aria-label="x feeds hidden unit h through weight w1; h feeds output y through weight w2; y is compared with target t.">
        <g className="br-node"><rect x="8" y="30" width="70" height="50" rx="4" /><text x="43" y="52">x</text><text x="43" y="70" className="br-val">{X}</text></g>
        <g className={`br-edge${at('w1') ? ' is-blamed' : ''}`}><line x1="78" y1="55" x2="186" y2="55" /><text x="132" y="45">w₁ = {f(weights.w1)}</text></g>
        <g className="br-node"><rect x="186" y="30" width="70" height="50" rx="4" /><text x="221" y="52">h</text><text x="221" y="70" className="br-val">{at('forward') ? f(c.h) : '?'}</text></g>
        <g className={`br-edge${at('w2') ? ' is-blamed' : ''}`}><line x1="256" y1="55" x2="364" y2="55" /><text x="310" y="45">w₂ = {f(weights.w2)}</text></g>
        <g className="br-node"><rect x="364" y="30" width="70" height="50" rx="4" /><text x="399" y="52">y</text><text x="399" y="70" className="br-val">{at('forward') ? f(c.y) : '?'}</text></g>
        <g className="br-target"><text x="482" y="52">target</text><text x="482" y="70" className="br-val">{T}</text></g>
      </svg>
      <ol className="br-steps">
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
    </SimFrame>
  )
}
