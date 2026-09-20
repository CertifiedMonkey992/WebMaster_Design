/* ═══════════════════════════════════════════════════════════════════════════
   SignInPlate.jsx — PLATE IV: A NETWORK, LEARNING
   ---------------------------------------------------------------------------
   The left leaf of the sign-in spread. Not a stock illustration of a person
   at a laptop: a PLATE, the way a field guide carries plates — an ink
   drawing on the paper ground, with a rule under it, a numbered caption, and
   small keyed labels pointing at the parts worth naming.

   What it draws is the thing the course is about. Three inputs enter a small
   network, two hidden layers weigh them, one output falls out; the weights
   are drawn at the thickness of their value, which is why some edges are
   hairlines and some are not. Beneath it, the error curve the network is
   walking down.

   The motion is one Demonstration (MOTION_RULES.md → Demonstrations), and it
   registers with the Stage rather than keeping its own clock: a signal
   enters at the left, crosses the layers node by node, lights the output,
   and the error curve's marker steps one notch further down the slope. Then
   it rests. Nothing loops on its own, nothing pulses, and under reduced
   motion the plate is simply a drawing — which is all it needs to be.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { DUR } from '../../motion/timing'

/* The drawing's layers: how many nodes in each, left to right. */
const LAYERS = [3, 4, 4, 1]
/* Where each layer sits across the plate, and the vertical span it uses. */
const X = [36, 104, 172, 240]
const TOP = 34
const SPAN = 116

/** Every node's centre, as [x, y] per layer. */
const NODES = LAYERS.map((count, layer) =>
  Array.from({ length: count }, (_, i) => [
    X[layer],
    count === 1 ? TOP + SPAN / 2 : TOP + (SPAN / (count - 1)) * i,
  ]),
)

/* The edges, with a weight each. The weights are fixed rather than random:
   a plate is printed once, and a drawing that differs every reload is a
   decoration, not a figure. */
const edges = []
for (let l = 0; l < NODES.length - 1; l++) {
  NODES[l].forEach(([x1, y1], i) => {
    NODES[l + 1].forEach(([x2, y2], j) => {
      /* A small deterministic spread in [0.18, 1]. */
      const w = 0.18 + (((i * 7 + j * 13 + l * 5) % 9) / 8) * 0.82
      edges.push({ x1, y1, x2, y2, w, layer: l })
    })
  })
}

/* The error curve under the network. It starts high and falls away, steeply
   at first and then hardly at all, which is the shape training actually
   makes — and in SVG "falls" means y grows. */
const LOSS = Array.from({ length: 26 }, (_, i) => {
  const t = i / 25
  return [24 + t * 232, 162 + 44 * (1 - Math.exp(-3.1 * t)) + Math.sin(t * 9) * 1.4]
})
const LOSS_PATH = LOSS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
/* Where the marker rests on each pass of the demonstration. */
const STOPS = [6, 10, 14, 18, 21, 23]

export default function SignInPlate() {
  const rootRef = useRef(null)

  /* One performance: a signal crosses the network and the loss steps down.
     The Stage decides when, and stops it while the tab is hidden or the
     plate is off screen. */
  usePerformer(rootRef, {
    id: 'signin:plate',
    region: 'signin',
    tier: 'minor',
    cooldown: 7400,
    run: async (ctx) => {
      const root = rootRef.current
      if (!root) return
      /* However the performance ends — the reader touches the plate, the tab
         is hidden, the component unmounts — the plate goes back to being a
         plain drawing rather than freezing mid-signal. */
      const settle = () => {
        root.removeAttribute('data-live')
        root.removeAttribute('data-out')
      }
      ctx.onStop(settle)

      const step = Number(root.dataset.step ?? 0)
      const next = (step + 1) % STOPS.length

      /* The signal crosses layer by layer, each a beat after the one before
         it: that lag is the drawing's claim that the layers are in order,
         not side by side. */
      for (let l = 0; l < LAYERS.length; l++) {
        root.setAttribute('data-live', String(l))
        await ctx.wait(DUR.move)
      }
      root.setAttribute('data-out', '1')
      await ctx.wait(DUR.settle)

      /* One step further down the error curve — the plate's whole claim. */
      root.dataset.step = String(next)
      root.style.setProperty('--loss-x', String(LOSS[STOPS[next]][0]))
      root.style.setProperty('--loss-y', String(LOSS[STOPS[next]][1]))
      await ctx.wait(DUR.open)

      settle()
    },
  })

  const [startX, startY] = LOSS[STOPS[0]]

  return (
    <figure className="plate" ref={rootRef} style={{ '--loss-x': startX, '--loss-y': startY }}>
      <svg className="plate-art" viewBox="0 0 280 230" role="img"
        aria-label="A plate from the field guide: three inputs feeding a small neural network through two hidden layers to one output, above the error curve the network is descending.">
        {/* The plate's frame — a printed rule, not a card. */}
        <rect className="plate-frame" x="8" y="8" width="264" height="214" rx="2" />

        {/* Edges, at the thickness of their weight. */}
        <g className="plate-edges">
          {edges.map((e, i) => (
            <line
              key={i}
              className="plate-edge"
              data-layer={e.layer}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              style={{ '--w': e.w.toFixed(2) }}
            />
          ))}
        </g>

        {/* Nodes. The output is drawn as a filled disc — it is the answer. */}
        <g className="plate-nodes">
          {NODES.map((layer, l) =>
            layer.map(([x, y], i) => (
              <circle
                key={`${l}-${i}`}
                className={`plate-node${l === NODES.length - 1 ? ' is-out' : ''}`}
                data-layer={l}
                cx={x} cy={y} r={l === NODES.length - 1 ? 7 : 5.4}
                style={{ '--i': i }}
              />
            )),
          )}
        </g>

        {/* Keyed labels, the way a plate names its parts. */}
        <g className="plate-keys">
          <text className="plate-key" x="36" y="20" textAnchor="middle">in</text>
          <text className="plate-key" x="138" y="20" textAnchor="middle">hidden layers</text>
          <text className="plate-key" x="240" y="20" textAnchor="middle">out</text>
        </g>

        {/* The error curve, and the one marker walking down it. Its position
            is two custom properties on the figure, so the demonstration can
            move it without React re-rendering the plate. */}
        <g className="plate-loss">
          <line className="plate-axis" x1="24" y1="212" x2="256" y2="212" />
          <path className="plate-curve" d={LOSS_PATH} pathLength="1" />
          <circle className="plate-marker" r="3.2" />
          {/* The curve falls from the left, so its name sits clear of it on
              the right, where the slope has already flattened out. */}
          <text className="plate-key" x="256" y="170" textAnchor="end">error, falling</text>
        </g>
      </svg>

      <figcaption className="plate-caption">
        <span className="plate-num">Plate IV</span>
        <span className="plate-text">
          A network, learning. Each line is a weight; the thicker it is drawn,
          the more that connection counts. The curve below is the error the
          network is still making — training is the walk down it.
        </span>
      </figcaption>
    </figure>
  )
}
