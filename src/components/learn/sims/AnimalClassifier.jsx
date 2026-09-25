/* AnimalClassifier — Lesson 1.2, "Train It, Break It".
   A real logistic-regression classifier, trained in the browser by gradient
   descent on photo descriptions (six features each). The original training
   set has every wolf on snow and every husky on grass — the shortcut from
   Ribeiro et al. (2016). The learner trains it, tests it on new photos,
   finds what it actually learned (its weights), then repairs the data — or
   poisons it — and trains again. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, Stat, Btn, rng, gauss } from './kit'

const FEATURES = [
  { id: 'snow',  label: 'Snowy background' },
  { id: 'ears',  label: 'Pointed ears' },
  { id: 'amber', label: 'Amber eyes' },
  { id: 'snout', label: 'Long snout' },
  { id: 'mask',  label: 'Face mask markings' },
  { id: 'collar', label: 'Red collar' },
]

const clamp01 = (v) => Math.max(0, Math.min(1, v))

function animal(rand, species, snow, { collar } = {}) {
  const wolf = species === 'wolf'
  return {
    species,
    x: [
      snow ? 1 : 0,
      clamp01((wolf ? 0.8 : 0.72) + gauss(rand) * 0.1),
      rand() < (wolf ? 0.85 : 0.15) ? 1 : 0,
      clamp01((wolf ? 0.75 : 0.45) + gauss(rand) * 0.1),
      clamp01((wolf ? 0.2 : 0.75) + gauss(rand) * 0.13),
      collar ?? (!wolf && rand() < 0.25 ? 1 : 0),
    ],
  }
}

function makeSet(seed, spec) {
  const rand = rng(seed)
  return spec.flatMap(([species, snow, n, opts]) => Array.from({ length: n }, () => animal(rand, species, snow, opts)))
}

const BASE = makeSet(7, [['wolf', true, 20], ['husky', false, 20, { collar: 0 }]])
const COUNTER = makeSet(19, [['husky', true, 12, { collar: 0 }], ['wolf', false, 12]])
/* Poison: huskies wearing a red collar, deliberately labelled "wolf". */
const POISON = makeSet(31, [['husky', false, 8, { collar: 1 }]]).map((a) => ({ ...a, label: 'wolf' }))
const TEST = makeSet(43, [
  ['wolf', true, 4], ['husky', false, 4, { collar: 0 }],
  ['husky', true, 4, { collar: 0 }], ['wolf', false, 4],
  ['husky', false, 2, { collar: 1 }], ['husky', true, 1, { collar: 1 }],
])

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

function train(data) {
  const w = new Array(FEATURES.length).fill(0)
  let b = 0
  const lr = 1.2
  const l2 = 0.002
  for (let epoch = 0; epoch < 600; epoch++) {
    const gw = new Array(w.length).fill(0)
    let gb = 0
    for (const d of data) {
      const y = (d.label ?? d.species) === 'wolf' ? 1 : 0
      const p = sigmoid(d.x.reduce((s, xi, i) => s + xi * w[i], b))
      const err = p - y
      d.x.forEach((xi, i) => { gw[i] += err * xi })
      gb += err
    }
    w.forEach((_, i) => { w[i] -= lr * (gw[i] / data.length + l2 * w[i]) })
    b -= lr * (gb / data.length)
  }
  return { w, b }
}

const predict = (m, x) => sigmoid(x.reduce((s, xi, i) => s + xi * m.w[i], m.b))

function describe(a) {
  const bits = []
  bits.push(a.x[0] ? 'snow' : 'grass')
  if (a.x[2]) bits.push('amber eyes')
  if (a.x[3] > 0.62) bits.push('long snout')
  if (a.x[4] > 0.55) bits.push('mask')
  if (a.x[5]) bits.push('red collar')
  return bits.join(' · ')
}

export default function AnimalClassifier({ onDone, goal = 'repair', allowPoison = false }) {
  const [data, setData] = useState('original')
  const [poison, setPoison] = useState('none')
  const [trained, setTrained] = useState(null)

  const training = useMemo(() => [
    ...BASE,
    ...(data === 'repaired' ? COUNTER : []),
    ...(poison === 'poisoned' ? POISON : []),
  ], [data, poison])

  const results = useMemo(() => {
    if (!trained) return null
    const rows = TEST.map((a) => {
      const p = predict(trained.model, a.x)
      const says = p >= 0.5 ? 'wolf' : 'husky'
      return { ...a, p, says, ok: says === a.species }
    })
    return { rows, right: rows.filter((r) => r.ok).length }
  }, [trained])

  const doTrain = () => {
    const model = train(training)
    const next = { model, data, poison, n: training.length }
    setTrained(next)
    const rows = TEST.map((a) => ((predict(model, a.x) >= 0.5 ? 'wolf' : 'husky') === a.species))
    const acc = rows.filter(Boolean).length / rows.length
    if (goal === 'repair' && data === 'repaired' && poison === 'none' && acc >= 0.85) onDone?.()
    if (goal === 'poison' && poison === 'poisoned') onDone?.()
    if (goal === 'train') onDone?.()
  }

  const stale = trained && (trained.data !== data || trained.poison !== poison)
  const maxW = trained ? Math.max(...trained.model.w.map(Math.abs), 0.001) : 1

  return (
    <SimFrame
      title="Wolf or husky? Train a classifier"
      provenance="live"
      note="Each photo is described by six features. The model learns one weight per feature by gradient descent — nobody writes its rules."
      controls={
        <>
          <Seg
            label="Training data"
            options={[{ value: 'original', label: `Original (${BASE.length} photos)` }, { value: 'repaired', label: `+ ${COUNTER.length} counter-examples` }]}
            value={data}
            onChange={setData}
          />
          {allowPoison && (
            <Seg
              label="Someone tampers with it"
              options={[{ value: 'none', label: 'No' }, { value: 'poisoned', label: `+ ${POISON.length} poisoned` }]}
              value={poison}
              onChange={setPoison}
            />
          )}
          <Btn primary onClick={doTrain}>{trained ? 'Train again' : 'Train the model'}</Btn>
        </>
      }
      footer={results && (
        <div className="sim-stats">
          <Stat label="right on 19 new test photos" value={`${results.right}/${TEST.length}`} tone={results.right >= 17 ? 'moss' : 'berry'} />
          <Stat label="training photos" value={trained.n} />
        </div>
      )}
    >
      <p className="sim-sub">Training photos: {data === 'original'
        ? 'every wolf was photographed on snow, every husky on grass.'
        : 'the same, plus huskies on snow and wolves on grass.'}
        {poison === 'poisoned' ? ' Also 8 huskies in red collars, labelled “wolf” on purpose.' : ''}
      </p>

      {!trained && <p className="sim-muted">Press <b>Train the model</b>. It will fit the training photos, then face 19 photos it has never seen.</p>}

      {trained && (
        <>
          {stale && <p className="sim-result">You changed the data — train again to see what changes.</p>}
          <p className="sim-sub sim-sub--gap">What it learned — one weight per feature</p>
          <table className="sim-table">
            <thead><tr><th>Feature</th><th>Pushes toward</th><th className="num">Weight</th></tr></thead>
            <tbody>
              {FEATURES.map((f, i) => {
                const wv = trained.model.w[i]
                return (
                  <tr key={f.id}>
                    <td>{f.label}</td>
                    <td>
                      <span className="sim-bar" style={{ '--w': `${(Math.abs(wv) / maxW) * 100}%`, '--c': wv >= 0 ? 'var(--ochre)' : 'var(--evergreen)' }} />
                      {' '}{Math.abs(wv) < 0.3 ? 'almost nothing' : wv > 0 ? 'wolf' : 'husky'}
                    </td>
                    <td className="num">{wv.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p className="sim-sub sim-sub--gap">New photos it has never seen</p>
          <ul className="sim-cards">
            {results.rows.map((r, i) => (
              <li key={i} className={`sim-card ${r.ok ? 'is-good' : 'is-bad'}`}>
                <b>{r.species === 'wolf' ? 'Wolf' : 'Husky'}</b> on {r.x[0] ? 'snow' : 'grass'}
                <small>{describe(r)}</small>
                <small>Model says {r.says} ({Math.round((r.says === 'wolf' ? r.p : 1 - r.p) * 100)}%)</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </SimFrame>
  )
}
