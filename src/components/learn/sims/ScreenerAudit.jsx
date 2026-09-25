/* ScreenerAudit — Lesson 5.2. A résumé screener that ranks applicants by how
   close their summary is, in meaning, to the job description. It runs on the
   word embeddings the learner built in Lesson 3.2 — the same skewed corpus —
   so its scores are real and so is its bias. The audit is a counterfactual
   test: change ONE thing about an applicant (a name, a pronoun) and see
   whether the score moves. Change two at once and the test says nothing. */

import { useMemo, useState } from 'react'
import { SimFrame, Btn, Stat } from './kit'
import { getEmbeddings } from './shared'

const JOB = 'engineer design bridge tested fixed built'
const JOB_TEXT = 'Engineering club lead: design, build and test a bridge model.'

const NAMES = ['greg', 'emily', 'alex']
const PRONOUNS = ['he', 'she']
const ACTIVITIES = [
  'built a robot and tested the design',
  'fixed the bridge model',
  'helped at the hospital',
  'found books for the library',
]

const START = [
  { id: 'a', name: 'greg', pronoun: 'he', activity: ACTIVITIES[0] },
  { id: 'b', name: 'emily', pronoun: 'she', activity: ACTIVITIES[0] },
  { id: 'c', name: 'alex', pronoun: 'she', activity: ACTIVITIES[2] },
  { id: 'd', name: 'emily', pronoun: 'she', activity: ACTIVITIES[1] },
]

const cap = (s) => s[0].toUpperCase() + s.slice(1)
const summary = (c) => `${c.name} said ${c.pronoun} ${c.activity.replace('the design', `${c.pronoun === 'he' ? 'his' : 'her'} design`)}`

function Select({ field, options, edit, setEdit }) {
  return (
    <label className="sim-slider">
      <span className="sim-label">{field}</span>
      <select className="form-input" value={edit[field]} onChange={(e) => setEdit({ ...edit, [field]: e.target.value })}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

export default function ScreenerAudit({ onDone }) {
  const E = useMemo(getEmbeddings, [])
  const score = (c) => E.textSim(JOB, summary(c))
  const [subject, setSubject] = useState('b')
  const base = START.find((c) => c.id === subject)
  const [edit, setEdit] = useState(base)
  const [tests, setTests] = useState([])

  const ranked = useMemo(() => START.map((c) => ({ ...c, s: score(c) })).sort((a, b) => b.s - a.s), [E]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id) => { setSubject(id); setEdit(START.find((c) => c.id === id)) }

  const changed = ['name', 'pronoun', 'activity'].filter((f) => edit[f] !== base[f])
  const s0 = score(base)
  const s1 = score(edit)

  const record = () => {
    const row = { id: tests.length + 1, from: summary(base), to: summary(edit), changed, delta: s1 - s0 }
    setTests((t) => [row, ...t].slice(0, 6))
    if (changed.length === 1 && (changed[0] === 'name' || changed[0] === 'pronoun') && Math.abs(row.delta) >= 0.01) onDone?.()
  }

  return (
    <SimFrame
      title="Audit a résumé screener"
      provenance="live"
      note="The screener scores each applicant’s summary by its similarity in meaning to the job description, using the embeddings you built in Lesson 3.2. Names it never saw in training (like Alex) count for nothing."
    >
      <p className="sim-sub">Job: {JOB_TEXT}</p>
      <table className="sim-table">
        <thead><tr><th>Rank</th><th>Applicant summary</th><th className="num">Score</th></tr></thead>
        <tbody>
          {ranked.map((c, i) => (
            <tr key={c.id}>
              <td>{i + 1}</td>
              <td>{cap(summary(c))}</td>
              <td className="num">{c.s.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="sim-sub sim-sub--gap">Run a counterfactual test</p>
      <div className="sim-row">
        <span className="sim-label">Applicant</span>
        {START.map((c) => <button key={c.id} type="button" className={`sim-chip${subject === c.id ? ' is-on' : ''}`} onClick={() => choose(c.id)}>{cap(c.name)} ({c.id.toUpperCase()})</button>)}
      </div>
      <div className="sim-row">
        <Select field="name" options={NAMES} edit={edit} setEdit={setEdit} />
        <Select field="pronoun" options={PRONOUNS} edit={edit} setEdit={setEdit} />
        <Select field="activity" options={ACTIVITIES} edit={edit} setEdit={setEdit} />
      </div>
      <div className="sim-row sim-sub--gap">
        <div className="sim-stats">
          <Stat label="original score" value={s0.toFixed(3)} />
          <Stat label="changed version" value={s1.toFixed(3)} />
          <Stat label="difference" value={`${s1 - s0 >= 0 ? '+' : ''}${(s1 - s0).toFixed(3)}`} tone={Math.abs(s1 - s0) >= 0.01 ? 'berry' : undefined} />
        </div>
        <Btn primary disabled={changed.length === 0} onClick={record}>Record this test</Btn>
      </div>
      {changed.length > 1 && <p className="sim-result is-bad">You changed {changed.join(' and ')} at once. If the score moves, you can’t tell which change moved it — hold everything else constant.</p>}

      {tests.length > 0 && (
        <table className="sim-table sim-sub--gap">
          <thead><tr><th>Test</th><th>What changed</th><th className="num">Score change</th><th>Readable?</th></tr></thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.changed.join(' + ')}</td>
                <td className={`num${Math.abs(t.delta) >= 0.01 ? ' is-bad' : ''}`}>{t.delta >= 0 ? '+' : ''}{t.delta.toFixed(3)}</td>
                <td className={t.changed.length === 1 ? 'is-good' : 'is-bad'}>{t.changed.length === 1 ? 'Yes — one change' : 'No — confounded'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SimFrame>
  )
}
