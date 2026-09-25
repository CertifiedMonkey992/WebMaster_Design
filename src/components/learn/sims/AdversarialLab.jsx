/* AdversarialLab — Lesson 2.3. A small image classifier (logistic regression
   over 100 pixels, trained in the browser on 160 hand-drawn-style 0s and 1s)
   and a real adversarial attack on it: nudge every pixel a tiny amount in
   the direction that most lowers the "1" score (the sign of the model's
   weight — the fast gradient sign method of Goodfellow et al., 2015). The
   same amount of random noise barely matters; the targeted nudge flips it. */

import { useMemo, useState } from 'react'
import { SimFrame, Slider, Seg, Stat, usePlot, ink, rng } from './kit'

const S = 10

function glyph(rand, digit) {
  const img = Array.from({ length: S * S }, () => rand() * 0.12)
  const dx = Math.floor(rand() * 3) - 1
  const dy = Math.floor(rand() * 3) - 1
  const set = (x, y, v = 0.9 + rand() * 0.1) => {
    const X = x + dx, Y = y + dy
    if (X >= 0 && X < S && Y >= 0 && Y < S) img[Y * S + X] = v
  }
  if (digit === 1) {
    const thick = rand() < 0.5
    for (let y = 1; y < 9; y++) { set(5, y); if (thick) set(4, y) }
    set(4, 2); set(3, 3, 0.6)
  } else {
    for (let t = 0; t < 40; t++) {
      const a = (t / 40) * Math.PI * 2
      set(Math.round(4.5 + 2.6 * Math.cos(a)), Math.round(4.5 + 3.6 * Math.sin(a)))
    }
  }
  return img
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

function trainModel() {
  const rand = rng(404)
  const data = []
  for (let i = 0; i < 160; i++) data.push({ x: glyph(rand, i % 2), y: i % 2 })
  const w = new Array(S * S).fill(0)
  let b = 0
  for (let epoch = 0; epoch < 300; epoch++) {
    const gw = new Array(w.length).fill(0)
    let gb = 0
    for (const d of data) {
      const p = sigmoid(d.x.reduce((s, v, i) => s + v * w[i], b))
      const e = p - d.y
      d.x.forEach((v, i) => { gw[i] += e * v })
      gb += e
    }
    for (let i = 0; i < w.length; i++) w[i] -= 0.5 * (gw[i] / data.length + 0.001 * w[i])
    b -= 0.5 * (gb / data.length)
  }
  const test = glyph(rng(9001), 1)
  return { w, b, test }
}

function Pixels({ data, label, signed = false }) {
  const { ref } = usePlot((ctx, w, h) => {
    const c = Math.min(w, h) / S
    const ox = (w - c * S) / 2
    for (let i = 0; i < S * S; i++) {
      const v = data[i]
      ctx.fillStyle = signed
        ? (v >= 0 ? ink('--ochre', Math.min(1, Math.abs(v))) : ink('--evergreen', Math.min(1, Math.abs(v))))
        : ink('--ink', Math.max(0, Math.min(1, v)))
      ctx.fillRect(ox + (i % S) * c, Math.floor(i / S) * c, c + 0.3, c + 0.3)
    }
  }, [data], { aspect: 1, min: 110, max: 170 })
  return (
    <figure className="cv-fig">
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={label} /></div>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export default function AdversarialLab({ onDone }) {
  const model = useMemo(trainModel, [])
  const [eps, setEps] = useState(0)
  const [kind, setKind] = useState('targeted')

  const noise = useMemo(() => {
    const rand = rng(77)
    return model.test.map(() => (rand() < 0.5 ? -1 : 1))
  }, [model])

  const { attacked, delta } = useMemo(() => {
    const d = model.test.map((v, i) => {
      const dir = kind === 'targeted' ? -Math.sign(model.w[i]) : noise[i]
      const nv = Math.max(0, Math.min(1, v + eps * dir))
      return nv - v
    })
    return { attacked: model.test.map((v, i) => v + d[i]), delta: d }
  }, [model, eps, kind, noise])

  const p0 = sigmoid(model.test.reduce((s, v, i) => s + v * model.w[i], model.b))
  const p1 = sigmoid(attacked.reduce((s, v, i) => s + v * model.w[i], model.b))
  const says = p1 >= 0.5 ? '1' : '0'
  const flipped = says === '0'

  const change = (v) => {
    setEps(v)
    if (kind === 'targeted') {
      const d = model.test.map((x, i) => Math.max(0, Math.min(1, x - v * Math.sign(model.w[i]))))
      const p = sigmoid(d.reduce((s, x, i) => s + x * model.w[i], model.b))
      if (p < 0.5) onDone?.()
    }
  }

  return (
    <SimFrame
      title="Fool an image classifier"
      provenance="live"
      note="The model was trained just now, in your browser, on 160 small drawings of 0s and 1s. The test image is a 1 it has never seen."
      controls={
        <>
          <Seg label="Kind of change" options={[{ value: 'targeted', label: 'Targeted nudge' }, { value: 'random', label: 'Random noise' }]} value={kind} onChange={setKind} />
          <Slider label="Size of change per pixel" min={0} max={0.3} step={0.01} value={eps} onChange={change} format={(v) => `±${v.toFixed(2)}`} />
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="model's confidence it is a 1, before" value={`${Math.round(p0 * 100)}%`} />
          <Stat label="after the change" value={`${Math.round(p1 * 100)}%`} tone={flipped ? 'berry' : 'moss'} />
          <Stat label="the model now says" value={says} tone={flipped ? 'berry' : undefined} />
        </div>
      }
    >
      <div className="adv-row">
        <Pixels data={model.test} label="Original" />
        <Pixels data={delta.map((d) => d * 3)} signed label="The change (×3 so you can see it)" />
        <Pixels data={attacked} label="What the model sees" />
      </div>
      {flipped && kind === 'targeted' && (
        <p className="sim-result is-bad">It still looks like a 1 to you. The model now says 0. Each pixel moved by at most {eps.toFixed(2)} — but every one moved in exactly the direction the model is most sensitive to.</p>
      )}
      {kind === 'random' && eps >= 0.2 && !flipped && (
        <p className="sim-result">The same size of change, spread at random, barely moves the score. Adversarial examples work because they are aimed.</p>
      )}
    </SimFrame>
  )
}
