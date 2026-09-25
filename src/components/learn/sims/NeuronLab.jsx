/* NeuronLab — Lesson 2.1. One artificial neuron (a perceptron): two inputs,
   two weights, a bias, and a yes/no decision — w₁·x + w₂·y + b > 0. The
   learner tunes it by hand to separate two groups, then meets the XOR data
   no single straight line can separate (the best any line can do is 75%). */

import { useEffect, useMemo, useState } from 'react'
import { SimFrame, Slider, Seg, Stat, usePlot, ink, rng, gauss } from './kit'

function dataset(kind) {
  const rand = rng(kind === 'xor' ? 88 : 55)
  const pts = []
  const blob = (cx, cy, c, n) => {
    for (let i = 0; i < n; i++) pts.push({ x: cx + gauss(rand) * 0.16, y: cy + gauss(rand) * 0.16, c })
  }
  if (kind === 'xor') {
    blob(-0.5, 0.5, 1, 14); blob(0.5, -0.5, 1, 14)
    blob(0.5, 0.5, 0, 14); blob(-0.5, -0.5, 0, 14)
  } else {
    blob(-0.45, 0.35, 1, 24); blob(0.4, -0.35, 0, 24)
  }
  return pts
}

export default function NeuronLab({ onDone, goal = 'separate', dataset: fixed = null }) {
  const [kind, setKind] = useState(fixed ?? 'separable')
  const [w1, setW1] = useState(0.5)
  const [w2, setW2] = useState(0.5)
  const [b, setB] = useState(0)
  const [xorMoves, setXorMoves] = useState(0)
  const pts = useMemo(() => dataset(kind), [kind])

  const acc = useMemo(() => {
    const right = pts.filter((p) => (w1 * p.x + w2 * p.y + b > 0 ? 1 : 0) === p.c).length
    return right / pts.length
  }, [pts, w1, w2, b])

  const touched = (setter) => (v) => {
    setter(v)
    if (kind === 'xor') {
      const n = xorMoves + 1
      setXorMoves(n)
      if (goal === 'xor' && n >= 6) onDone?.()
    }
  }

  /* Report success once the learner separates the easy data. */
  useEffect(() => {
    if (goal === 'separate' && kind === 'separable' && acc >= 0.95) onDone?.()
  }, [goal, kind, acc, onDone])

  const { ref } = usePlot((ctx, w, h) => {
    const toX = (x) => ((x + 1) / 2) * w
    const toY = (y) => (1 - (y + 1) / 2) * h
    const g = 48
    for (let i = 0; i < g; i++) {
      for (let j = 0; j < g; j++) {
        const x = -1 + (2 * (i + 0.5)) / g
        const y = 1 - (2 * (j + 0.5)) / g
        ctx.fillStyle = w1 * x + w2 * y + b > 0 ? ink('--ochre', 0.14) : ink('--evergreen', 0.1)
        ctx.fillRect(Math.floor((i * w) / g), Math.floor((j * h) / g), Math.floor(((i + 1) * w) / g) - Math.floor((i * w) / g), Math.floor(((j + 1) * h) / g) - Math.floor((j * h) / g))
      }
    }
    /* The boundary line w1 x + w2 y + b = 0 */
    ctx.strokeStyle = ink('--ink')
    ctx.lineWidth = 2
    ctx.beginPath()
    if (Math.abs(w2) > 1e-3) {
      const y1 = (-b - w1 * -1) / w2
      const y2 = (-b - w1 * 1) / w2
      ctx.moveTo(toX(-1), toY(y1)); ctx.lineTo(toX(1), toY(y2))
    } else if (Math.abs(w1) > 1e-3) {
      const x0 = -b / w1
      ctx.moveTo(toX(x0), 0); ctx.lineTo(toX(x0), h)
    }
    ctx.stroke()
    for (const p of pts) {
      const px = toX(p.x), py = toY(p.y)
      const right = (w1 * p.x + w2 * p.y + b > 0 ? 1 : 0) === p.c
      ctx.lineWidth = right ? 1.5 : 2.5
      if (p.c) {
        ctx.fillStyle = ink('--ochre'); ctx.strokeStyle = right ? ink('--ochre-ink') : ink('--berry')
        ctx.beginPath(); ctx.rect(px - 4, py - 4, 8, 8); ctx.fill(); ctx.stroke()
      } else {
        ctx.fillStyle = ink('--evergreen'); ctx.strokeStyle = right ? ink('--evergreen-deep') : ink('--berry')
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
    }
  }, [pts, w1, w2, b], { aspect: 0.62, min: 200, max: 300 })

  return (
    <SimFrame
      title="Tune one neuron by hand"
      provenance="live"
      note="Output = yes when w₁·x + w₂·y + b is above zero. The dark line is where it is exactly zero. Points ringed in berry are on the wrong side."
      controls={
        <>
          {!fixed && (
            <Seg label="Data" options={[{ value: 'separable', label: 'Two groups' }, { value: 'xor', label: 'XOR (four corners)' }]} value={kind} onChange={setKind} />
          )}
          <Slider label="Weight w₁ (x)" min={-4} max={4} step={0.1} value={w1} onChange={touched(setW1)} format={(v) => v.toFixed(1)} />
          <Slider label="Weight w₂ (y)" min={-4} max={4} step={0.1} value={w2} onChange={touched(setW2)} format={(v) => v.toFixed(1)} />
          <Slider label="Bias b" min={-4} max={4} step={0.1} value={b} onChange={touched(setB)} format={(v) => v.toFixed(1)} />
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="of points on the right side" value={`${Math.round(acc * 100)}%`} tone={acc >= 0.95 ? 'moss' : undefined} />
          {kind === 'xor' && <Stat label="the best any straight line can do here" value="75%" />}
        </div>
      }
    >
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={`One neuron's decision line. ${Math.round(acc * 100)}% of points correctly separated.`} /></div>
    </SimFrame>
  )
}
