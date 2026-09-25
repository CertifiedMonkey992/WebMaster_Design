/* ConvLab — Lesson 2.3. A convolution, computed: a 3×3 filter slides over a
   28×28 picture and each output pixel is the weighted sum under it. The
   edge filters are the kind an image network's first layer learns on its
   own; "corners" combines two first-layer maps the way a second layer
   builds bigger features out of smaller ones. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, usePlot, ink } from './kit'

const S = 28

function picture() {
  const img = Array.from({ length: S }, () => new Array(S).fill(0.06))
  const fill = (x0, y0, x1, y1, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img[y][x] = v }
  fill(6, 13, 22, 25, 0.85)                                 /* the house */
  for (let y = 4; y < 13; y++) {                             /* the roof */
    const half = ((y - 4) / 9) * 9.5
    for (let x = Math.round(14 - half); x < Math.round(14 + half); x++) if (x >= 0 && x < S) img[y][x] = 0.85
  }
  fill(12, 18, 16, 25, 0.25)                                 /* the door */
  fill(17, 15, 20, 18, 0.3)                                  /* a window */
  return img
}

const KERNELS = {
  vertical:   { label: 'Vertical edges',   k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], abs: true },
  horizontal: { label: 'Horizontal edges', k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], abs: true },
  blur:       { label: 'Blur',             k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)), abs: false },
  sharpen:    { label: 'Sharpen',          k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], abs: false },
}

function convolve(img, k) {
  const out = Array.from({ length: S }, () => new Array(S).fill(0))
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      let sum = 0
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) sum += img[y + j][x + i] * k[j + 1][i + 1]
      out[y][x] = sum
    }
  }
  return out
}

function normalise(map, abs) {
  let max = 0
  for (const row of map) for (const v of row) max = Math.max(max, abs ? Math.abs(v) : v)
  return map.map((row) => row.map((v) => Math.max(0, Math.min(1, (abs ? Math.abs(v) : v) / (max || 1)))))
}

function Grid({ data, label }) {
  const { ref } = usePlot((ctx, w, h) => {
    const c = Math.min(w, h) / S
    const ox = (w - c * S) / 2
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        ctx.fillStyle = ink('--ink', data[y][x])
        ctx.fillRect(ox + x * c, y * c, c + 0.3, c + 0.3)
      }
    }
  }, [data], { aspect: 1, min: 140, max: 220 })
  return (
    <figure className="cv-fig">
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={label} /></div>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export default function ConvLab({ onDone, goal = 'kernels', layer2 = true }) {
  const img = useMemo(picture, [])
  const [kernel, setKernel] = useState('vertical')
  const [tried, setTried] = useState(() => new Set(['vertical']))

  const out = useMemo(() => {
    if (kernel === 'corners') {
      const v = normalise(convolve(img, KERNELS.vertical.k), true)
      const h = normalise(convolve(img, KERNELS.horizontal.k), true)
      return normalise(v.map((row, y) => row.map((val, x) => val * h[y][x])), false)
    }
    const K = KERNELS[kernel]
    return normalise(convolve(img, K.k), K.abs)
  }, [img, kernel])

  const pick = (k) => {
    setKernel(k)
    const next = new Set(tried); next.add(k); setTried(next)
    if (goal === 'kernels' && next.size >= 2) onDone?.()
    if (goal === 'corners' && k === 'corners') onDone?.()
  }

  const options = [
    ...Object.entries(KERNELS).map(([value, K]) => ({ value, label: K.label })),
    ...(layer2 ? [{ value: 'corners', label: 'Layer 2: corners' }] : []),
  ]
  const k = KERNELS[kernel]?.k

  return (
    <SimFrame
      title="Slide a filter over a picture"
      provenance="computed"
      note="Each output pixel is the sum of the 3×3 patch under the filter, multiplied weight by weight. Dark = strong response."
      controls={<Seg label="Filter" options={options} value={kernel} onChange={pick} />}
    >
      <div className="cv-row">
        <Grid data={img} label="Input: 28 × 28 pixels" />
        <div className="cv-kernel" aria-label="The filter's nine weights">
          {k ? k.flat().map((v, i) => <span key={i} className={`tnum${v > 0 ? ' is-pos' : v < 0 ? ' is-neg' : ''}`}>{Number.isInteger(v) ? v : v.toFixed(2)}</span>)
            : <p className="sim-muted">Layer 2 multiplies the vertical-edge map by the horizontal-edge map: it lights up only where both kinds of edge meet.</p>}
        </div>
        <Grid data={out} label={kernel === 'corners' ? 'Output: corners' : `Output: ${KERNELS[kernel].label.toLowerCase()}`} />
      </div>
    </SimFrame>
  )
}
