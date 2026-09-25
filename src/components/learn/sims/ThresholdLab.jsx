/* ThresholdLab — Lesson 1.3. One classifier's scores on a test set of 1,000
   cases, and the threshold that turns a score into a yes or a no. Every
   count below the chart is computed from those scores: move the line and
   false positives trade against false negatives; switch to a rare target and
   watch "accuracy" stop meaning anything. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, Slider, Btn, Stat, usePlot, ink, rng, gauss } from './kit'

const SCENARIOS = {
  cancer:   { label: 'Cancer screen',     base: 0.05, fn: 'cancers missed',        fp: 'healthy people called back for more tests', yes: 'flag for follow-up' },
  spam:     { label: 'Spam folder',       base: 0.40, fn: 'spam left in the inbox', fp: 'real messages sent to spam',              yes: 'send to spam' },
  cheating: { label: 'Cheating detector', base: 0.04, fn: 'cheating missed',        fp: 'honest students accused',                 yes: 'accuse' },
}

const N = 1000

function makeScores(base, seed) {
  const rand = rng(seed)
  const pos = Math.round(N * base)
  return Array.from({ length: N }, (_, i) => {
    const y = i < pos ? 1 : 0
    const s = Math.max(0.01, Math.min(0.99, (y ? 0.68 : 0.36) + gauss(rand) * 0.13))
    return { y, s }
  })
}

export default function ThresholdLab({ onDone, goal = 'move', scenario: initial = 'cancer', lock = false }) {
  const [scenario, setScenario] = useState(initial)
  const [threshold, setThreshold] = useState(0.5)
  const [alwaysNo, setAlwaysNo] = useState(false)
  const [moves, setMoves] = useState(0)
  const sc = SCENARIOS[scenario]
  const data = useMemo(() => makeScores(sc.base, scenario.length * 97), [sc.base, scenario])

  const m = useMemo(() => {
    let tp = 0, fp = 0, fn = 0, tn = 0
    for (const d of data) {
      const yes = !alwaysNo && d.s >= threshold
      if (yes && d.y) tp++
      else if (yes && !d.y) fp++
      else if (!yes && d.y) fn++
      else tn++
    }
    return {
      tp, fp, fn, tn,
      accuracy: (tp + tn) / N,
      precision: tp + fp ? tp / (tp + fp) : null,
      recall: tp + fn ? tp / (tp + fn) : null,
    }
  }, [data, threshold, alwaysNo])

  const move = (v) => {
    setAlwaysNo(false)
    setThreshold(v)
    const n = moves + 1
    setMoves(n)
    if (goal === 'move' && n >= 3) onDone?.()
  }

  const { ref } = usePlot((ctx, w, h) => {
    const pad = { l: 8, r: 8, t: 10, b: 20 }
    const bins = 30
    const hp = new Array(bins).fill(0)
    const hn = new Array(bins).fill(0)
    for (const d of data) {
      const b = Math.min(bins - 1, Math.floor(d.s * bins))
      if (d.y) hp[b]++; else hn[b]++
    }
    const maxC = Math.max(...hn, ...hp, 1)
    const bw = (w - pad.l - pad.r) / bins
    const H = h - pad.t - pad.b
    for (let b = 0; b < bins; b++) {
      const x = pad.l + b * bw
      const nh = (hn[b] / maxC) * H
      ctx.fillStyle = ink('--evergreen', 0.35)
      ctx.fillRect(x + 1, h - pad.b - nh, bw - 2, nh)
      const ph = (hp[b] / maxC) * H
      ctx.fillStyle = ink('--ochre', 0.85)
      ctx.fillRect(x + bw * 0.25, h - pad.b - ph, bw * 0.5, ph)
    }
    if (!alwaysNo) {
      const tx = pad.l + threshold * (w - pad.l - pad.r)
      ctx.strokeStyle = ink('--ink')
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(tx, pad.t - 4); ctx.lineTo(tx, h - pad.b + 4); ctx.stroke()
      ctx.fillStyle = ink('--ink')
      ctx.font = '600 11px Manrope, sans-serif'
      ctx.fillText(`${sc.yes} →`, Math.min(tx + 6, w - 110), pad.t + 8)
    }
    ctx.fillStyle = ink('--ink-faint')
    ctx.font = '11px Manrope, sans-serif'
    ctx.fillText('score 0', pad.l, h - 5)
    ctx.fillText('1', w - pad.r - 6, h - 5)
  }, [data, threshold, alwaysNo, sc.yes], { aspect: 0.4, min: 150, max: 220 })

  const pctf = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`)

  return (
    <SimFrame
      title="Where do you draw the line?"
      provenance="computed"
      note="1,000 test cases with scores from one classifier (a seeded simulated test set). Tall pale bars are the real negatives; narrow dark bars are the real positives."
      controls={
        <>
          {!lock && (
            <Seg
              label="What is being detected"
              options={Object.entries(SCENARIOS).map(([value, s]) => ({ value, label: `${s.label} (${Math.round(s.base * 100)}% real)` }))}
              value={scenario}
              onChange={(v) => { setScenario(v); setAlwaysNo(false) }}
            />
          )}
          <Slider label="Threshold" min={0.05} max={0.95} step={0.01} value={threshold} onChange={move} format={(v) => v.toFixed(2)} />
          <Btn quiet={!alwaysNo} primary={alwaysNo} onClick={() => { setAlwaysNo(true); if (goal === 'always-no') onDone?.() }}>Model that always says “no”</Btn>
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="accuracy" value={pctf(m.accuracy)} />
          <Stat label="recall — real cases caught" value={pctf(m.recall)} tone={m.recall != null && m.recall < 0.5 ? 'berry' : undefined} />
          <Stat label="precision — right when it says yes" value={pctf(m.precision)} />
        </div>
      }
    >
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={`Score histogram with the threshold at ${threshold.toFixed(2)}.`} /></div>
      <div className="sim-legend">
        <span className="sim-key sim-key--square" style={{ '--key': 'var(--evergreen)' }}>real negatives</span>
        <span className="sim-key sim-key--square" style={{ '--key': 'var(--ochre)' }}>real positives</span>
      </div>
      <table className="sim-table sim-sub--gap">
        <thead><tr><th /><th className="num">Really yes</th><th className="num">Really no</th></tr></thead>
        <tbody>
          <tr><th>Model says yes</th><td className="num is-good">{m.tp} caught</td><td className="num is-bad">{m.fp} false positives</td></tr>
          <tr><th>Model says no</th><td className="num is-bad">{m.fn} false negatives</td><td className="num is-good">{m.tn} correctly cleared</td></tr>
        </tbody>
      </table>
      <p className="sim-result">
        In plain words: <b>{m.fn}</b> {sc.fn}, and <b>{m.fp}</b> {sc.fp}.
        {alwaysNo && ` Accuracy is ${pctf(m.accuracy)} — because only ${Math.round(sc.base * 100)}% of cases are real, a model that never says yes is “right” most of the time and useless every time it matters.`}
      </p>
    </SimFrame>
  )
}
