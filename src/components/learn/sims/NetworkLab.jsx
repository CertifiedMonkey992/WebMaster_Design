/* NetworkLab — Lessons 2.1 and 2.2. A real neural network, trained in the
   browser: 2 inputs → a hidden layer → 1 output, full-batch gradient descent
   with backpropagation on binary cross-entropy. Nothing is scripted — the
   loss curve is the loss, the shaded regions are the network's answers.

   2.1 exposes the hidden-layer size and the activation (switch it to "none"
   and every layer collapses into one straight line). 2.2 exposes the
   learning rate (too small crawls, too big overshoots or blows up). */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SimFrame, Seg, Btn, Stat, usePlot, useLoop, ink, rng, gauss } from './kit'

export function makeData(kind) {
  const rand = rng(kind === 'xor' ? 5 : kind === 'circle' ? 9 : 13)
  const pts = []
  if (kind === 'xor') {
    for (const [cx, cy] of [[-0.5, 0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, -0.5]]) {
      for (let i = 0; i < 40; i++) pts.push({ x: cx + gauss(rand) * 0.17, y: cy + gauss(rand) * 0.17, c: cx * cy < 0 ? 1 : 0 })
    }
  } else {
    for (let i = 0; i < 180; i++) {
      const x = rand() * 2 - 1
      const y = rand() * 2 - 1
      const r = Math.hypot(x, y)
      if (Math.abs(r - 0.55) < 0.06) continue
      pts.push({ x, y, c: r < 0.55 ? 1 : 0 })
    }
  }
  return pts
}

const ACT = {
  relu: { f: (z) => (z > 0 ? z : 0), d: (z) => (z > 0 ? 1 : 0) },
  tanh: { f: Math.tanh, d: (z) => { const t = Math.tanh(z); return 1 - t * t } },
  none: { f: (z) => z, d: () => 1 },
}

const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z))))

export function initNet(H, seed = 3) {
  const rand = rng(seed + H * 17)
  return {
    H,
    W1: Array.from({ length: H }, () => [gauss(rand) * 1.2, gauss(rand) * 1.2]),
    b1: Array.from({ length: H }, () => gauss(rand) * 0.3),
    W2: Array.from({ length: H }, () => gauss(rand) / Math.sqrt(H)),
    b2: 0,
  }
}

export function forward(net, act, x, y) {
  const a = ACT[act]
  let z2 = net.b2
  for (let h = 0; h < net.H; h++) {
    const z = net.W1[h][0] * x + net.W1[h][1] * y + net.b1[h]
    z2 += net.W2[h] * a.f(z)
  }
  return sigmoid(z2)
}

/** One epoch of full-batch gradient descent. Returns the loss before the step. */
export function trainEpoch(net, act, data, lr) {
  const a = ACT[act]
  const H = net.H
  const gW1 = Array.from({ length: H }, () => [0, 0])
  const gb1 = new Array(H).fill(0)
  const gW2 = new Array(H).fill(0)
  let gb2 = 0
  let loss = 0
  const z1 = new Array(H)
  const a1 = new Array(H)
  for (const p of data) {
    let z2 = net.b2
    for (let h = 0; h < H; h++) {
      z1[h] = net.W1[h][0] * p.x + net.W1[h][1] * p.y + net.b1[h]
      a1[h] = a.f(z1[h])
      z2 += net.W2[h] * a1[h]
    }
    const out = sigmoid(z2)
    loss += -(p.c * Math.log(out + 1e-9) + (1 - p.c) * Math.log(1 - out + 1e-9))
    /* Backpropagation: the output's error, passed back to every weight. */
    const d2 = out - p.c
    gb2 += d2
    for (let h = 0; h < H; h++) {
      gW2[h] += d2 * a1[h]
      const d1 = d2 * net.W2[h] * a.d(z1[h])
      gW1[h][0] += d1 * p.x
      gW1[h][1] += d1 * p.y
      gb1[h] += d1
    }
  }
  const n = data.length
  for (let h = 0; h < H; h++) {
    net.W1[h][0] -= (lr * gW1[h][0]) / n
    net.W1[h][1] -= (lr * gW1[h][1]) / n
    net.b1[h] -= (lr * gb1[h]) / n
    net.W2[h] -= (lr * gW2[h]) / n
  }
  net.b2 -= (lr * gb2) / n
  return loss / n
}

const LRS = [
  { value: 0.02, label: '0.02' },
  { value: 0.3, label: '0.3' },
  { value: 2, label: '2' },
  { value: 40, label: '40' },
]

const MAX_EPOCHS = 3000

export default function NetworkLab({
  onDone, goal = 'solve', controls = ['hidden', 'activation'],
  dataset: initialData = 'circle', hidden: initialH = 4, activation: initialAct = 'relu', lr: initialLr = 2,
}) {
  const [kind, setKind] = useState(initialData)
  const [H, setH] = useState(initialH)
  const [act, setAct] = useState(initialAct)
  const [lr, setLr] = useState(initialLr)
  const [running, setRunning] = useState(false)
  const [, setTick] = useState(0)
  const flags = useRef({ linearFail: false, solved: false, badLr: false })

  const data = useMemo(() => makeData(kind), [kind])
  const net = useRef(initNet(initialH))
  const history = useRef([])
  const epochs = useRef(0)
  const exploded = useRef(false)

  const reset = useCallback((h = H) => {
    net.current = initNet(h)
    history.current = []
    epochs.current = 0
    exploded.current = false
    setTick((t) => t + 1)
  }, [H])

  /* Any change to the setup starts training over. */
  useEffect(() => { reset(H); setRunning(false) }, [kind, H, act, lr]) // eslint-disable-line react-hooks/exhaustive-deps

  const accuracy = () => data.filter((p) => (forward(net.current, act, p.x, p.y) >= 0.5 ? 1 : 0) === p.c).length / data.length

  const evaluate = () => {
    const acc = accuracy()
    const f = flags.current
    const n = epochs.current
    if (act === 'none' && n >= 600 && acc < 0.85) f.linearFail = true
    if (acc >= 0.95 && !exploded.current) f.solved = true
    const last = history.current[history.current.length - 1]
    if (exploded.current || (lr >= 40 && n > 50 && last > 0.6) || (lr <= 0.02 && n >= 800 && last > 0.45)) f.badLr = true
    const done =
      goal === 'solve' ? f.solved
        : goal === 'activation' ? f.linearFail && f.solved && act !== 'none'
          : goal === 'learning-rate' ? f.badLr && f.solved
            : true
    if (done) onDone?.()
  }

  useLoop(running, () => {
    for (let i = 0; i < 12; i++) {
      const loss = trainEpoch(net.current, act, data, lr)
      epochs.current += 1
      if (!Number.isFinite(loss) || Number.isNaN(net.current.b2)) {
        exploded.current = true
        break
      }
      history.current.push(loss)
    }
    setTick((t) => t + 1)
    if (exploded.current || epochs.current >= MAX_EPOCHS) {
      setRunning(false)
      evaluate()
      return false
    }
    if (epochs.current % 120 === 0) evaluate()
    return true
  })

  const stop = () => { setRunning(false); evaluate() }

  const acc = accuracy()
  const loss = history.current[history.current.length - 1]

  const { ref: mapRef } = usePlot((ctx, w, h) => {
    const g = 40
    for (let i = 0; i < g; i++) {
      for (let j = 0; j < g; j++) {
        const x = -1 + (2 * (i + 0.5)) / g
        const y = 1 - (2 * (j + 0.5)) / g
        const p = exploded.current ? 0.5 : forward(net.current, act, x, y)
        ctx.fillStyle = p >= 0.5 ? ink('--ochre', 0.08 + 0.2 * (p - 0.5) * 2) : ink('--evergreen', 0.06 + 0.18 * (0.5 - p) * 2)
        ctx.fillRect(Math.floor((i * w) / g), Math.floor((j * h) / g), Math.floor(((i + 1) * w) / g) - Math.floor((i * w) / g), Math.floor(((j + 1) * h) / g) - Math.floor((j * h) / g))
      }
    }
    for (const p of data) {
      const px = ((p.x + 1) / 2) * w
      const py = (1 - (p.y + 1) / 2) * h
      if (p.c) { ctx.fillStyle = ink('--ochre'); ctx.fillRect(px - 3, py - 3, 6, 6) }
      else { ctx.fillStyle = ink('--evergreen'); ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2); ctx.fill() }
    }
  }, [epochs.current, data, act, H, lr], { aspect: 1, min: 180, max: 260 })

  const { ref: lossRef } = usePlot((ctx, w, h) => {
    const hist = history.current
    ctx.strokeStyle = ink('--line-strong')
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(24, 6); ctx.lineTo(24, h - 16); ctx.lineTo(w - 4, h - 16); ctx.stroke()
    ctx.fillStyle = ink('--ink-faint')
    ctx.font = '11px Manrope, sans-serif'
    ctx.fillText('loss', 0, 14)
    ctx.fillText(`epoch ${epochs.current}`, w - 76, h - 3)
    if (!hist.length) return
    const top = Math.max(1.0, Math.min(3, Math.max(...hist.slice(0, 50))))
    ctx.strokeStyle = ink('--berry')
    ctx.lineWidth = 2
    ctx.beginPath()
    hist.forEach((l, i) => {
      const x = 24 + (i / Math.max(MAX_EPOCHS, hist.length)) * (w - 30)
      const y = 6 + (1 - Math.min(l, top) / top) * (h - 22)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [epochs.current], { aspect: 1, min: 180, max: 260 })

  const show = (c) => controls.includes(c)

  return (
    <SimFrame
      title="Train a neural network"
      provenance="live"
      note={`2 inputs → ${H} hidden neurons (${act === 'none' ? 'no activation' : act}) → 1 output. Gradient descent with backpropagation, ${data.length} points.`}
      controls={
        <>
          {show('dataset') && <Seg label="Data" options={[{ value: 'circle', label: 'Circle' }, { value: 'xor', label: 'XOR' }]} value={kind} onChange={setKind} disabled={running} />}
          {show('hidden') && <Seg label="Hidden neurons" options={[1, 2, 4, 8].map((v) => ({ value: v, label: String(v) }))} value={H} onChange={setH} disabled={running} />}
          {show('activation') && <Seg label="Activation (the bend)" options={[{ value: 'relu', label: 'ReLU' }, { value: 'tanh', label: 'tanh' }, { value: 'none', label: 'None' }]} value={act} onChange={setAct} disabled={running} />}
          {show('lr') && <Seg label="Learning rate (step size)" options={LRS} value={lr} onChange={setLr} disabled={running} />}
          <div className="sim-row">
            {!running
              ? <Btn primary onClick={() => { if (epochs.current >= MAX_EPOCHS || exploded.current) reset(); setRunning(true) }}>{epochs.current ? 'Keep training' : 'Train'}</Btn>
              : <Btn onClick={stop}>Pause</Btn>}
            <Btn quiet onClick={() => { setRunning(false); reset() }}>Reset weights</Btn>
          </div>
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="points classified right" value={`${Math.round(acc * 100)}%`} tone={acc >= 0.95 ? 'moss' : undefined} />
          <Stat label="loss (lower is better)" value={exploded.current ? 'blew up' : loss == null ? '—' : loss.toFixed(3)} tone={exploded.current ? 'berry' : undefined} />
          <Stat label="epochs" value={epochs.current} />
        </div>
      }
    >
      <div className="sim-grid-2">
        <div className="sim-canvas-wrap"><canvas ref={mapRef} className="sim-canvas" role="img" aria-label={`The network's answer at every point. ${Math.round(acc * 100)}% of data points classified correctly.`} /></div>
        <div className="sim-canvas-wrap"><canvas ref={lossRef} className="sim-canvas" role="img" aria-label={`Loss curve over ${epochs.current} epochs.`} /></div>
      </div>
      {exploded.current && <p className="sim-result is-bad">The loss became infinite: each step was so large the weights flew past the valley and off the map. Pick a smaller learning rate.</p>}
      {!running && act === 'none' && epochs.current >= 600 && acc < 0.85 && <p className="sim-result is-bad">Without an activation, stacking layers adds nothing: the whole network is still one straight line, so it cannot wrap around the circle.</p>}
      {!running && lr <= 0.02 && epochs.current >= 800 && loss > 0.45 && <p className="sim-result">The loss is creeping down, but each step is tiny — at this rate it needs thousands more epochs.</p>}
      {!exploded.current && lr >= 40 && epochs.current > 50 && loss > 0.6 && <p className="sim-result is-bad">The loss is worse than when it started. Each step is so big it leaps right over the bottom of the valley and lands higher up the other side.</p>}
      {act !== 'none' && epochs.current >= 1500 && acc < 0.9 && H <= 2 && <p className="sim-result">{H} hidden {H === 1 ? 'neuron draws' : 'neurons draw'} {H} straight {H === 1 ? 'edge' : 'edges'}. Can that many edges fence in this shape?</p>}
    </SimFrame>
  )
}
