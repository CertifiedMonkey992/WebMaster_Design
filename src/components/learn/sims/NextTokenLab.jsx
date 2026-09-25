/* NextTokenLab — Lesson 3.1. A real next-word model: it has counted, in the
   lesson's corpus, which word follows each pair of words. Its context window
   is two words. It shows the probability of every candidate next word,
   reshaped by temperature, and samples one — the same loop a large language
   model runs, at a far smaller scale. There is also a guessing game: pick
   the next word before the model's probabilities are shown. */

import { useMemo, useRef, useState } from 'react'
import { SimFrame, Slider, Seg, Btn, Stat, rng } from './kit'
import { SCHOOL_TEXT } from './corpus'
import { trainNgram, nextDistribution, sampleFrom } from './models'

const STARTS = ['the teacher', 'after school', 'the test', 'we ate', 'my project']

export default function NextTokenLab({ onDone, goal = 'temperature', mode: initialMode = 'watch' }) {
  const model = useMemo(() => trainNgram(SCHOOL_TEXT), [])
  const rand = useRef(rng(2024))
  const [mode, setMode] = useState(initialMode)
  const [words, setWords] = useState(['the', 'teacher'])
  const [T, setT] = useState(1)
  const [tried, setTried] = useState({ low: false, high: false })
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const { dist, used } = useMemo(() => nextDistribution(model, words, T), [model, words, T])
  const top = dist.slice(0, 8)
  const choices = useMemo(() => {
    const c = dist.slice(0, 4).map((d) => d.word)
    return [...c].sort()
  }, [dist])

  const markT = (v) => {
    const next = { low: tried.low || v <= 0.3, high: tried.high || v >= 1.5 }
    setTried(next)
    return next
  }

  const step = () => {
    const w = sampleFrom(dist, rand.current)
    setWords((ws) => (w === '.' ? [...ws, '.'] : [...ws, w]).slice(-40))
    setGuess(null)
  }

  const generate = () => {
    let ws = [...words]
    for (let i = 0; i < 12; i++) {
      const { dist: d } = nextDistribution(model, ws, T)
      const w = sampleFrom(d, rand.current)
      ws = [...ws, w]
      if (w === '.') break
    }
    setWords(ws.slice(-40))
    const t = markT(T)
    if (goal === 'temperature' && t.low && t.high) onDone?.()
    if (goal === 'generate') onDone?.()
  }

  const pickGuess = (w) => {
    if (guess) return
    setGuess(w)
    const best = dist[0]?.word
    const s = { right: score.right + (w === best ? 1 : 0), total: score.total + 1 }
    setScore(s)
    if (goal === 'guess' && s.total >= 3) onDone?.()
  }

  const nextAfterGuess = () => {
    setWords((ws) => [...ws, dist[0].word].slice(-40))
    setGuess(null)
  }

  const context = words.slice(-2)
  const hidden = mode === 'guess' && !guess

  return (
    <SimFrame
      title="Predict the next word"
      provenance="live"
      note="Trained on this lesson’s short corpus by counting. Its context window is two words: everything before the last two is invisible to it."
      controls={
        <>
          <Seg label="Mode" options={[{ value: 'watch', label: 'Watch it write' }, { value: 'guess', label: 'Out-guess it' }]} value={mode} onChange={(m) => { setMode(m); setGuess(null) }} />
          {mode === 'watch' && <Slider label="Temperature" min={0.1} max={2} step={0.1} value={T} onChange={(v) => setT(v)} format={(v) => v.toFixed(1)} />}
          <div className="sim-row">
            {STARTS.map((s) => (
              <button key={s} type="button" className={`sim-chip${words.join(' ') === s ? ' is-on' : ''}`} onClick={() => { setWords(s.split(' ')); setGuess(null) }}>{s} …</button>
            ))}
          </div>
        </>
      }
      footer={mode === 'guess'
        ? <div className="sim-stats"><Stat label="your guesses that matched its top choice" value={`${score.right}/${score.total}`} /></div>
        : (
          <div className="sim-row">
            <Btn primary onClick={generate}>Write 12 words</Btn>
            <Btn onClick={step}>One word</Btn>
            <Btn quiet onClick={() => setWords(['the', 'teacher'])}>Clear</Btn>
          </div>
        )}
    >
      <p className="nt-text" aria-live="polite">
        {words.slice(0, -2).join(' ')}{words.length > 2 ? ' ' : ''}
        <mark className="nt-window" title="The model's context window">{context.join(' ')}</mark>
        {' '}<span className="nt-caret">▍</span>
      </p>

      <p className="sim-sub">
        {used === 2 ? `After “${context.join(' ')}”, the words it has seen come next:` : used === 1 ? `It never saw “${context.join(' ')}” — so it falls back to what follows “${context[1]}”:` : 'It has never seen this context, so it falls back to how common each word is:'}
      </p>

      {mode === 'guess' && !guess && (
        <div className="sim-row">
          <span className="sim-label">Your guess</span>
          {choices.map((w) => <button key={w} type="button" className="sim-chip" onClick={() => pickGuess(w)}>{w}</button>)}
        </div>
      )}

      {!hidden && (
        <table className="sim-table nt-probs">
          <tbody>
            {top.map((d) => (
              <tr key={d.word} className={guess === d.word ? 'is-guess' : ''}>
                <td className="nt-word">{d.word === '.' ? '(end of sentence)' : d.word}</td>
                <td className="nt-bar-cell"><span className="sim-bar nt-bar" style={{ '--w': `${d.p * 100}%`, '--c': 'var(--evergreen)' }} /></td>
                <td className="num">{Math.round(d.p * 100)}%</td>
                <td className="num nt-count">seen {d.count}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mode === 'guess' && guess && (
        <div className="sim-row sim-sub--gap">
          <p className="sim-muted">{guess === dist[0].word ? 'You matched its top choice.' : `Its top choice was “${dist[0].word}”.`} It isn’t reasoning about the story — it is repeating what its counts make most likely.</p>
          <Btn primary onClick={nextAfterGuess}>Next word</Btn>
        </div>
      )}

      {mode === 'watch' && T <= 0.3 && <p className="sim-result">Low temperature: it almost always takes the single most likely word, so it repeats itself and every run is the same.</p>}
      {mode === 'watch' && T >= 1.5 && <p className="sim-result">High temperature: unlikely words get a real chance, so every run is different — and the text drifts.</p>}
    </SimFrame>
  )
}
