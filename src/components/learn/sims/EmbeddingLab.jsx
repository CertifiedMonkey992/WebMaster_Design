/* EmbeddingLab — Lesson 3.2. Word embeddings built in the browser from the
   lesson's corpus: each word is described by the words that appear near it
   (PPMI over a ±3-word window), and words with similar descriptions end up
   close together. Three views: a map of meaning (the two main directions of
   variation), a search that matches meaning instead of letters, and the
   associations the corpus taught the model — including the skewed ones. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, usePlot, ink } from './kit'
import { SEARCH_DOCS } from './corpus'
import { getEmbeddings } from './shared'

const GROUPS = [
  { id: 'animals', label: 'Animals', token: '--moss', words: ['dog', 'puppy', 'cat', 'kitten', 'horse', 'wolf'] },
  { id: 'food', label: 'Food', token: '--ochre', words: ['pizza', 'soup', 'pasta', 'bread', 'apple', 'banana'] },
  { id: 'weather', label: 'Weather', token: '--ink-muted', words: ['rain', 'snow', 'wind', 'storm', 'sunny', 'cloudy'] },
  { id: 'school', label: 'School subjects', token: '--clay-deep', words: ['math', 'biology', 'history', 'chemistry'] },
  { id: 'jobs', label: 'Jobs', token: '--berry-ink', words: ['doctor', 'nurse', 'engineer', 'pilot', 'librarian', 'teacher'] },
]
const JOBS = ['doctor', 'engineer', 'pilot', 'teacher', 'librarian', 'nurse']
const QUERIES = ['dog', 'snow', 'cat', 'lunch', 'test']

export default function EmbeddingLab({ onDone, goal = 'map', tabs = ['map', 'search', 'bias'], initial = 'map' }) {
  const E = useMemo(getEmbeddings, [])
  const [tab, setTab] = useState(initial)
  const [picked, setPicked] = useState('dog')
  const [query, setQuery] = useState('dog')

  const points = useMemo(() => {
    const words = GROUPS.flatMap((g) => g.words)
    const pts = E.project(words)
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    return pts.map((p) => ({
      ...p,
      nx: (p.x - x0) / (x1 - x0 || 1),
      ny: (p.y - y0) / (y1 - y0 || 1),
      group: GROUPS.find((g) => g.words.includes(p.word)),
    }))
  }, [E])

  const neighbours = useMemo(() => E.neighbours(picked, 5), [E, picked])

  const results = useMemo(() => {
    const keyword = SEARCH_DOCS.filter((d) => d.text.split(/\W+/).includes(query))
    const meaning = SEARCH_DOCS.map((d) => ({ ...d, s: E.textSim(query, d.text) })).sort((a, b) => b.s - a.s).slice(0, 3)
    return { keyword, meaning }
  }, [E, query])

  const assoc = useMemo(() => JOBS.map((j) => ({ word: j, a: E.association(j, ['he', 'his'], ['she', 'her']) })), [E])
  const maxA = Math.max(...assoc.map((x) => Math.abs(x.a)), 0.01)

  const choose = (t) => {
    setTab(t)
    if (goal === 'bias' && t === 'bias') onDone?.()
  }

  const pickWord = (w) => {
    setPicked(w)
    if (goal === 'map') onDone?.()
  }

  const runQuery = (q) => {
    setQuery(q)
    if (goal === 'search') onDone?.()
  }

  const { ref } = usePlot((ctx, w, h) => {
    const pad = 28
    const placed = []
    const hits = (b) => placed.some((q) => b.x < q.x + q.w && b.x + b.w > q.x && b.y < q.y + q.h && b.y + b.h > q.y)
    /* Dots first, then labels — each label takes the nearest free slot
       above or below its dot, with a hairline back to it when it moved. */
    const spots = points.map((p) => ({ p, x: pad + p.nx * (w - pad * 2), y: pad + (1 - p.ny) * (h - pad * 2) }))
    for (const { p, x, y } of spots) {
      const isPicked = p.word === picked
      ctx.fillStyle = ink(p.group?.token ?? '--ink-muted')
      ctx.beginPath(); ctx.arc(x, y, isPicked ? 6 : 4, 0, Math.PI * 2); ctx.fill()
      placed.push({ x: x - 4, y: y - 4, w: 8, h: 8 })
    }
    for (const { p, x, y } of spots) {
      const isPicked = p.word === picked
      ctx.font = `${isPicked ? '700 ' : ''}12px Manrope, sans-serif`
      const tw = ctx.measureText(p.word).width
      let box = null
      for (const dy of [0, -13, 13, -26, 26, -39, 39]) {
        const b = { x: Math.min(x + 7, w - tw - 2), y: y - 9 + dy, w: tw, h: 12 }
        if (!hits(b) && b.y > 0 && b.y + b.h < h) { box = { ...b, dy }; break }
      }
      box ??= { x: Math.min(x + 7, w - tw - 2), y: y - 9, w: tw, h: 12, dy: 0 }
      placed.push(box)
      if (box.dy) {
        ctx.strokeStyle = ink('--line-strong')
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.lineTo(box.x - 1, box.y + 7); ctx.stroke()
      }
      ctx.fillStyle = isPicked ? ink('--ink') : ink('--ink-muted')
      ctx.fillText(p.word, box.x, box.y + 10)
    }
  }, [points, picked], { aspect: 0.62, min: 240, max: 340 })

  const onCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pad = 28
    let best = null
    let bestD = 24 * 24
    for (const p of points) {
      const x = pad + p.nx * (rect.width - pad * 2)
      const y = pad + (1 - p.ny) * (rect.height - pad * 2)
      const d = (x - (e.clientX - rect.left)) ** 2 + (y - (e.clientY - rect.top)) ** 2
      if (d < bestD) { best = p; bestD = d }
    }
    if (best) pickWord(best.word)
  }

  const TAB_LABEL = { map: 'Map of meaning', search: 'Search by meaning', bias: 'What it associates' }

  return (
    <SimFrame
      title="Meaning as distance"
      provenance="live"
      note="Built just now from a short corpus written for this lesson: every word is described by the words that appear near it. Nobody told it that a puppy is a dog."
      controls={tabs.length > 1 && <Seg label="View" options={tabs.map((t) => ({ value: t, label: TAB_LABEL[t] }))} value={tab} onChange={choose} />}
    >
      {tab === 'map' && (
        <>
          <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" onClick={onCanvasClick} role="img" aria-label="A two-dimensional map of word meanings. Related words cluster together." /></div>
          <div className="sim-legend">
            {GROUPS.map((g) => <span key={g.id} className="sim-key" style={{ '--key': `var(${g.token})` }}>{g.label}</span>)}
          </div>
          <div className="sim-row sim-sub--gap">
            <span className="sim-label">Closest to</span>
            {GROUPS.flatMap((g) => g.words).map((w) => (
              <button key={w} type="button" className={`sim-chip${picked === w ? ' is-on' : ''}`} onClick={() => pickWord(w)}>{w}</button>
            ))}
          </div>
          <table className="sim-table sim-sub--gap">
            <thead><tr><th>Nearest words to “{picked}”</th><th className="num">Similarity</th></tr></thead>
            <tbody>{neighbours.map((n) => <tr key={n.word}><td>{n.word}</td><td className="num">{n.sim.toFixed(2)}</td></tr>)}</tbody>
          </table>
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="sim-row">
            <span className="sim-label">Search for</span>
            {QUERIES.map((q) => <button key={q} type="button" className={`sim-chip${query === q ? ' is-on' : ''}`} onClick={() => runQuery(q)}>{q}</button>)}
          </div>
          <div className="sim-grid-2 sim-sub--gap">
            <div>
              <p className="sim-sub">Keyword search: documents containing “{query}”</p>
              {results.keyword.length === 0
                ? <p className="sim-muted">No document contains that word.</p>
                : <ul className="sim-cards">{results.keyword.map((d) => <li key={d.id} className="sim-card">{d.text}</li>)}</ul>}
            </div>
            <div>
              <p className="sim-sub">Meaning search: closest documents</p>
              <ul className="sim-cards">{results.meaning.map((d) => <li key={d.id} className="sim-card">{d.text}<small>similarity {d.s.toFixed(2)}</small></li>)}</ul>
            </div>
          </div>
        </>
      )}

      {tab === 'bias' && (
        <>
          <p className="sim-muted">How strongly each job’s own description leans toward “he / his” or “she / her”, measured in the model (pointwise mutual information). The corpus was skewed on purpose, the way real web text is.</p>
          <table className="sim-table sim-sub--gap eb-assoc">
            <thead><tr><th>Word</th><th className="num">leans “he”</th><th>leans “she”</th></tr></thead>
            <tbody>
              {assoc.map((x) => (
                <tr key={x.word}>
                  <td>{x.word}</td>
                  <td className="num"><span className="eb-bar eb-bar--he" style={{ '--w': `${x.a > 0 ? (x.a / maxA) * 100 : 0}%` }} /></td>
                  <td><span className="eb-bar eb-bar--she" style={{ '--w': `${x.a < 0 ? (-x.a / maxA) * 100 : 0}%` }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sim-result">Nothing here was programmed. The model learned it from which words sat near which — so the skew in the text became part of what “doctor” and “nurse” mean to it.</p>
        </>
      )}
    </SimFrame>
  )
}
