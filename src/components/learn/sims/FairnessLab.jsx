/* FairnessLab — Lesson 6.2. A school's attendance-risk flag, audited by
   group. A simulated population of 1,000 students on two campuses: long bus
   rides really do cause more absences, and South campus students ride much
   longer, so the groups have different base rates. Two logistic-regression
   models are trained in the browser on the same students — one with campus
   as an input, one with campus removed and bus-ride minutes in its place.
   Every rate is computed. Try to make every fairness measure equal at once. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, Slider, Stat, rng, gauss } from './kit'

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

function population() {
  const rand = rng(6060)
  return Array.from({ length: 1000 }, (_, i) => {
    const south = i >= 600
    const bus = Math.max(3, (south ? 45 : 14) + gauss(rand) * (south ? 10 : 6))
    const prior = Math.max(0, Math.round((south ? 4 : 3) + gauss(rand) * 2.5))
    /* The real cause of absence: the ride and last year's record. */
    const p = sigmoid(-4.1 + 0.045 * bus + 0.28 * prior)
    return { south, bus, prior, y: rand() < p ? 1 : 0 }
  })
}

function fit(pop, features) {
  const X = pop.map(features)
  const d = X[0].length
  const mean = new Array(d).fill(0), sd = new Array(d).fill(0)
  X.forEach((x) => x.forEach((v, j) => { mean[j] += v / X.length }))
  X.forEach((x) => x.forEach((v, j) => { sd[j] += (v - mean[j]) ** 2 / X.length }))
  const Z = X.map((x) => x.map((v, j) => (v - mean[j]) / (Math.sqrt(sd[j]) || 1)))
  const w = new Array(d).fill(0)
  let b = 0
  for (let e = 0; e < 400; e++) {
    const gw = new Array(d).fill(0)
    let gb = 0
    Z.forEach((z, i) => {
      const err = sigmoid(z.reduce((s, v, j) => s + v * w[j], b)) - pop[i].y
      z.forEach((v, j) => { gw[j] += err * v })
      gb += err
    })
    for (let j = 0; j < d; j++) w[j] -= 0.5 * gw[j] / Z.length
    b -= 0.5 * gb / Z.length
  }
  return Z.map((z) => sigmoid(z.reduce((s, v, j) => s + v * w[j], b)))
}

function rates(pop, scores, south, t) {
  let tp = 0, fp = 0, fn = 0, tn = 0
  pop.forEach((p, i) => {
    if (p.south !== south) return
    const flag = scores[i] >= t
    if (flag && p.y) tp++
    else if (flag) fp++
    else if (p.y) fn++
    else tn++
  })
  const n = tp + fp + fn + tn
  return {
    n,
    base: (tp + fn) / n,
    flagged: (tp + fp) / n,
    fpr: fp / Math.max(1, fp + tn),
    fnr: fn / Math.max(1, fn + tp),
    precision: tp + fp ? tp / (tp + fp) : 0,
  }
}

const pct = (v) => `${Math.round(v * 100)}%`

export default function FairnessLab({ onDone }) {
  const pop = useMemo(population, [])
  const withCampus = useMemo(() => fit(pop, (p) => [p.south ? 1 : 0, p.prior]), [pop])
  const withBus = useMemo(() => fit(pop, (p) => [p.bus, p.prior]), [pop])
  const [model, setModel] = useState('campus')
  const [split, setSplit] = useState(false)
  const [tNorth, setTNorth] = useState(0.3)
  const [tSouth, setTSouth] = useState(0.3)
  const [seen, setSeen] = useState({ split: false, bus: false })

  const scores = model === 'campus' ? withCampus : withBus
  const north = rates(pop, scores, false, tNorth)
  const south = rates(pop, scores, true, split ? tSouth : tNorth)

  const mark = (k) => { const n = { ...seen, [k]: true }; setSeen(n); if (n.split && n.bus) onDone?.() }

  const Row = ({ label, a, b, tip }) => {
    const gap = Math.abs(a - b)
    return (
      <tr>
        <th title={tip}>{label}</th>
        <td className="num">{pct(a)}</td>
        <td className="num">{pct(b)}</td>
        <td className={`num${gap > 0.08 ? ' is-bad' : ' is-good'}`}>{gap > 0.08 ? `${Math.round(gap * 100)} pts apart` : 'about equal'}</td>
      </tr>
    )
  }

  return (
    <SimFrame
      title="Fair to whom? An attendance-risk flag"
      provenance="computed"
      note="A simulated population of 1,000 students (600 North, 400 South). Two models were trained on it just now, in your browser. Flagged students get a call home."
      controls={
        <>
          <Seg label="Model inputs" options={[{ value: 'campus', label: 'Campus + last year’s absences' }, { value: 'bus', label: 'Campus removed: bus ride + absences' }]} value={model} onChange={(m) => { setModel(m); if (m === 'bus') mark('bus') }} />
          <Seg label="Thresholds" options={[{ value: false, label: 'One for everyone' }, { value: true, label: 'Separate per campus' }]} value={split} onChange={(v) => { setSplit(v); if (v) mark('split') }} />
          <Slider label={split ? 'North threshold' : 'Threshold'} min={0.05} max={0.8} step={0.01} value={tNorth} onChange={setTNorth} format={(v) => v.toFixed(2)} />
          {split && <Slider label="South threshold" min={0.05} max={0.8} step={0.01} value={tSouth} onChange={setTSouth} format={(v) => v.toFixed(2)} />}
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="North students who will really miss 10+ days" value={pct(north.base)} />
          <Stat label="South students who will" value={pct(south.base)} />
        </div>
      }
    >
      <table className="sim-table">
        <thead><tr><th>Measure</th><th className="num">North</th><th className="num">South</th><th className="num">Equal?</th></tr></thead>
        <tbody>
          <Row label="Flagged" a={north.flagged} b={south.flagged} tip="Share of each campus that gets flagged" />
          <Row label="False alarms (of students who would have been fine)" a={north.fpr} b={south.fpr} />
          <Row label="Missed (of students who did miss 10+ days)" a={north.fnr} b={south.fnr} />
          <Row label="Right when it flags (precision)" a={north.precision} b={south.precision} />
        </tbody>
      </table>
      {model === 'bus' && <p className="sim-result">Campus is gone from the inputs — and the gaps barely move. Bus-ride length stands in for campus almost perfectly. Deleting a column does not delete what it was correlated with.</p>}
      {split && <p className="sim-result">Move the two thresholds and watch the last three rows. When the campuses’ real rates differ, you can make false alarms equal or precision equal — not both. Which one to protect is a value choice, not a math fact.</p>}
    </SimFrame>
  )
}
