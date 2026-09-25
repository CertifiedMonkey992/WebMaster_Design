/* DenoiseLab — Lesson 3.2. How a diffusion model makes a picture: start from
   pure noise and remove a little of it, step by step, toward what the prompt
   describes. The noise schedule here is the real one diffusion models use
   (a cosine schedule over 50 steps). What is NOT real is the denoiser: here
   it is handed the answer, whereas a trained model has to PREDICT the noise
   at every step from the noisy image and the prompt — that prediction is
   what it spent its training learning. The lesson says so. */

import { useMemo, useRef, useState } from 'react'
import { SimFrame, Seg, Slider, Btn, usePlot, useLoop, ink, rng, gauss } from './kit'

const S = 24
const T = 50

function draw(prompt) {
  const img = Array.from({ length: S * S }, () => 0.05)
  const set = (x, y, v = 0.9) => { if (x >= 0 && x < S && y >= 0 && y < S) img[y * S + x] = v }
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, v) }
  const disc = (cx, cy, r, v) => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, v) }
  if (prompt === 'house') {
    rect(5, 12, 19, 21, 0.85)
    for (let y = 4; y < 12; y++) { const h = ((y - 4) / 8) * 8; for (let x = Math.round(12 - h); x < Math.round(12 + h); x++) set(x, y) }
    rect(10, 15, 14, 21, 0.25)
  } else if (prompt === 'tree') {
    disc(12, 9, 6.5, 0.85); rect(11, 14, 14, 22, 0.6)
  } else if (prompt === 'face') {
    disc(12, 12, 9, 0.85); disc(9, 9, 1.4, 0.15); disc(15, 9, 1.4, 0.15)
    for (let x = 8; x <= 16; x++) set(x, Math.round(15 + 0.08 * (x - 12) ** 2), 0.15)
  } else {
    for (let y = 14; y < 18; y++) for (let x = 3 + (y - 14); x < 21 - (y - 14); x++) set(x, y, 0.85)
    rect(11, 4, 12, 14, 0.7)
    for (let y = 5; y < 13; y++) for (let x = 12; x < 12 + (13 - y); x++) set(x, y, 0.8)
  }
  return img.map((v) => v * 2 - 1)
}

/* Cosine noise schedule (Nichol & Dhariwal, 2021): how much of the picture
   survives at step t. */
const alphaBar = (t) => {
  const s = 0.008
  const f = (u) => Math.cos(((u / T + s) / (1 + s)) * (Math.PI / 2)) ** 2
  return Math.max(0, Math.min(1, f(t) / f(0)))
}

function Pixels({ data, label, size = 'lg' }) {
  const { ref } = usePlot((ctx, w, h) => {
    const c = Math.min(w, h) / S
    const ox = (w - c * S) / 2
    for (let i = 0; i < S * S; i++) {
      ctx.fillStyle = ink('--ink', Math.max(0, Math.min(1, (data[i] + 1) / 2)))
      ctx.fillRect(ox + (i % S) * c, Math.floor(i / S) * c, c + 0.3, c + 0.3)
    }
  }, [data], size === 'lg' ? { aspect: 1, min: 180, max: 240 } : { aspect: 1, min: 70, max: 90 })
  return (
    <figure className="cv-fig">
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={label} /></div>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export default function DenoiseLab({ onDone }) {
  const [prompt, setPrompt] = useState('house')
  const [seed, setSeed] = useState(1)
  const [t, setTState] = useState(T)
  const tRef = useRef(T)
  const setT = (v) => { tRef.current = v; setTState(v) }
  const [running, setRunning] = useState(false)
  const x0 = useMemo(() => draw(prompt), [prompt])
  const noise = useMemo(() => { const r = rng(seed * 131); return Array.from({ length: S * S }, () => gauss(r)) }, [seed])
  const at = (step) => {
    const a = alphaBar(step)
    return x0.map((v, i) => Math.sqrt(a) * v + Math.sqrt(1 - a) * noise[i])
  }
  const img = useMemo(() => at(t), [t, x0, noise]) // eslint-disable-line react-hooks/exhaustive-deps

  useLoop(running, () => {
    const nv = Math.max(0, tRef.current - 1)
    setT(nv)
    if (nv === 0) { setRunning(false); onDone?.(); return false }
    return true
  })

  const change = (v) => { setT(v); if (v === 0) onDone?.() }

  return (
    <SimFrame
      title="From noise to a picture"
      provenance="illustration"
      note="The noise schedule is the cosine schedule real diffusion models use. The denoiser here is given the answer; a trained model has to predict the noise at every step."
      controls={
        <>
          <Seg label="Prompt" options={[{ value: 'house', label: '“a house”' }, { value: 'tree', label: '“a tree”' }, { value: 'face', label: '“a smiling face”' }, { value: 'boat', label: '“a sailboat”' }]} value={prompt} onChange={(p) => { setPrompt(p); setT(T) }} />
          <Slider label="Denoising step" min={0} max={T} value={T - t} onChange={(v) => change(T - v)} format={(v) => `${v} of ${T}`} />
          <div className="sim-row">
            <Btn primary onClick={() => { setT(T); setRunning(true) }} disabled={running}>Run all {T} steps</Btn>
            <Btn quiet onClick={() => { setSeed((s) => s + 1); setT(T) }}>New noise</Btn>
          </div>
        </>
      }
    >
      <div className="dn-row">
        <Pixels data={img} label={t === T ? 'Step 0: pure noise' : t === 0 ? `Step ${T}: finished` : `Step ${T - t}: ${Math.round(Math.sqrt(alphaBar(t)) * 100)}% signal`} />
        <div className="dn-strip">
          {[T, 35, 20, 8, 0].map((s) => <Pixels key={s} data={at(s)} size="sm" label={`step ${T - s}`} />)}
        </div>
      </div>
      <p className="sim-result">Nothing was pasted in. At every step the model’s job is to guess which part of the image is noise; subtracting a little of that guess, fifty times, leaves a picture. Because each step is a guess, fine details — hands, lettering, reflections — are where the guesses go wrong, and better models make fewer of those mistakes.</p>
    </SimFrame>
  )
}
