/* TokenizerLab — Lesson 3.1. A byte-pair-encoding tokenizer, trained in the
   browser on the lesson's corpus. With no merges every letter is a token;
   each merge glues the most frequent neighbouring pair into one piece.
   Common words become single tokens; rarer words stay in pieces — which is
   why a model that reads "▁strawber|r|y" finds counting its r's hard. */

import { useMemo, useState } from 'react'
import { SimFrame, Slider, Stat } from './kit'
import { SCHOOL_TEXT } from './corpus'
import { trainBPE, tokenize } from './models'

export default function TokenizerLab({ onDone, sample = 'A strawberry grows in the school garden.' }) {
  const merges = useMemo(() => trainBPE(SCHOOL_TEXT, 400), [])
  const [n, setN] = useState(merges.length)
  const [text, setText] = useState(sample)
  const tokens = useMemo(() => tokenize(text, merges, n), [text, merges, n])
  const chars = text.replace(/\s+/g, '').length

  return (
    <SimFrame
      title="How text becomes tokens"
      provenance="live"
      note={`A byte-pair-encoding tokenizer trained just now on this lesson’s ${SCHOOL_TEXT.split(/\s+/).length}-word corpus. It learned ${merges.length} merges. ▁ marks the start of a word.`}
      controls={
        <>
          <Slider label="Merges used" min={0} max={merges.length} value={n} onChange={(v) => { setN(v); onDone?.() }} />
          <label className="sim-slider">
            <span className="sim-label">Type anything</span>
            <input className="form-input" value={text} maxLength={120} onChange={(e) => { setText(e.target.value); onDone?.() }} />
          </label>
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="letters and marks" value={chars} />
          <Stat label="tokens the model reads" value={tokens.length} />
          <Stat label="letters per token" value={(chars / Math.max(1, tokens.length)).toFixed(1)} />
        </div>
      }
    >
      <ol className="tk-tokens" aria-label="Tokens">
        {tokens.map((t, i) => <li key={i} className={`tk-token${t.startsWith('▁') ? ' is-start' : ''}`}>{t}</li>)}
      </ol>
      {n > 0 && n < 30 && <p className="sim-result">With few merges, most tokens are single letters — a model reading this would need many more steps per word.</p>}
      {n === merges.length && <p className="sim-result">Words this corpus uses often (“the”, “school”, “garden”) are whole tokens. Words it rarely saw stay in pieces. The model never sees letters inside a token — only the token’s number.</p>}
    </SimFrame>
  )
}
