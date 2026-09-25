/* OverfitLab — Lesson 1.3. A k-nearest-neighbours classifier on 2D points,
   scored twice: on the points it was fitted to, and on held-out points it
   has never seen. With k = 1 it memorises its training set (100%) and draws
   a jagged boundary around every noisy point; the held-out score tells the
   truth. Every figure is computed live. */

import { useMemo, useState } from 'react'
import { SimFrame, Slider, Stat, Seg, usePlot, ink, rng, gauss } from './kit'

function makePoints() {
  const rand = rng(1234)
  const pts = []
  for (let i = 0; i < 140; i++) {
    const cls = i % 2
    /* Two overlapping classes along a curved border, plus label noise. */
    const x = rand()
    const border = 0.5 + 0.18 * Math.sin(x * Math.PI * 1.6)
    let y = border + (cls ? 1 : -1) * Math.abs(gauss(rand) * 0.16 + 0.05)
    y = Math.max(0.02, Math.min(0.98, y))
    const flipped = rand() < 0.1
    pts.push({ x, y, c: flipped ? 1 - cls : cls, train: i < 84 })
  }
  return pts
}

const POINTS = makePoints()
const TRAIN = POINTS.filter((p) => p.train)
const TEST = POINTS.filter((p) => !p.train)

function knn(k, x, y, exclude = null) {
  const ds = []
  for (const p of TRAIN) {
    if (p === exclude) continue
    ds.push([(p.x - x) ** 2 + (p.y - y) ** 2, p.c])
  }
  ds.sort((a, b) => a[0] - b[0])
  let votes = 0
  for (let i = 0; i < k && i < ds.length; i++) votes += ds[i][1]
  return votes * 2 > k ? 1 : 0
}

export default function OverfitLab({ onDone }) {
  const [k, setK] = useState(1)
  const [show, setShow] = useState('train')
  const [tried, setTried] = useState({ one: true, big: false })

  const acc = useMemo(() => {
    const trainAcc = TRAIN.filter((p) => knn(k, p.x, p.y) === p.c).length / TRAIN.length
    const testAcc = TEST.filter((p) => knn(k, p.x, p.y) === p.c).length / TEST.length
    return { trainAcc, testAcc }
  }, [k])

  const change = (v) => {
    setK(v)
    const next = { one: tried.one || v === 1, big: tried.big || v >= 7 }
    setTried(next)
    if (next.one && next.big) onDone?.()
  }

  const { ref } = usePlot((ctx, w, h) => {
    const gx = 64
    const gy = Math.round(gx * (h / w))
    const cw = w / gx
    const ch = h / gy
    for (let i = 0; i < gx; i++) {
      for (let j = 0; j < gy; j++) {
        const c = knn(k, (i + 0.5) / gx, 1 - (j + 0.5) / gy)
        ctx.fillStyle = c ? ink('--ochre', 0.14) : ink('--evergreen', 0.1)
        ctx.fillRect(Math.floor(i * cw), Math.floor(j * ch), Math.floor((i + 1) * cw) - Math.floor(i * cw), Math.floor((j + 1) * ch) - Math.floor(j * ch))
      }
    }
    const list = show === 'train' ? TRAIN : TEST
    for (const p of list) {
      const px = p.x * w
      const py = (1 - p.y) * h
      ctx.lineWidth = 1.5
      if (p.c) {
        ctx.strokeStyle = ink('--ochre-ink')
        ctx.fillStyle = show === 'train' ? ink('--ochre') : ink('--surface-raised')
        ctx.beginPath(); ctx.rect(px - 4, py - 4, 8, 8); ctx.fill(); ctx.stroke()
      } else {
        ctx.strokeStyle = ink('--evergreen')
        ctx.fillStyle = show === 'train' ? ink('--evergreen') : ink('--surface-raised')
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
    }
  }, [k, show], { aspect: 0.55, min: 180, max: 300 })

  const gap = acc.trainAcc - acc.testAcc

  return (
    <SimFrame
      title="Memorising versus learning"
      provenance="live"
      note="k-nearest neighbours: each new point takes the majority label of the k training points closest to it. 84 training points, 56 held out, 10% of labels noisy."
      controls={
        <>
          <Slider label="k — neighbours consulted" min={1} max={21} step={2} value={k} onChange={change} />
          <Seg label="Show" options={[{ value: 'train', label: 'Training points' }, { value: 'test', label: 'Held-out points' }]} value={show} onChange={setShow} />
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="accuracy on training points" value={`${Math.round(acc.trainAcc * 100)}%`} />
          <Stat label="accuracy on held-out points" value={`${Math.round(acc.testAcc * 100)}%`} tone={gap > 0.12 ? 'berry' : 'moss'} />
        </div>
      }
    >
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={`Decision regions for k = ${k}. Training accuracy ${Math.round(acc.trainAcc * 100)}%, held-out accuracy ${Math.round(acc.testAcc * 100)}%.`} /></div>
      <p className="sim-result">
        {k === 1
          ? 'k = 1 scores 100% on its own training points by memorising them — including the mislabelled ones. The held-out score is the honest one.'
          : gap > 0.12
            ? 'Still a big gap between the two scores: the boundary is chasing noise.'
            : 'The two scores are close: the boundary follows the real pattern, not the noise.'}
      </p>
    </SimFrame>
  )
}
