/* DetectorMath — Lesson 6.1. The base-rate arithmetic of an AI-writing
   detector, for a school. Given how many essays there are, how many were
   really written by AI, and the detector's hit rate and false-alarm rate,
   how many honest students get flagged — and when it flags someone, how
   likely is it that they actually cheated? Pure arithmetic, nothing faked.
   The "non-native writers" preset uses the average false-positive rate
   Liang et al. (2023) measured across seven detectors: about 61%. */

import { useState } from 'react'
import { SimFrame, Slider, Seg, Stat } from './kit'

export default function DetectorMath({ onDone }) {
  const [essays, setEssays] = useState(1200)
  const [cheatPct, setCheatPct] = useState(5)
  const [hitPct, setHitPct] = useState(90)
  const [fpPct, setFpPct] = useState(2)
  const [writers, setWriters] = useState('native')
  const [moves, setMoves] = useState(0)

  const touch = (setter) => (v) => { setter(v); const n = moves + 1; setMoves(n); if (n >= 2) onDone?.() }
  const pickWriters = (w) => { setWriters(w); setFpPct(w === 'native' ? 2 : 61); onDone?.() }

  const ai = Math.round(essays * (cheatPct / 100))
  const honest = essays - ai
  const caught = Math.round(ai * (hitPct / 100))
  const falsely = Math.round(honest * (fpPct / 100))
  const flagged = caught + falsely
  const precision = flagged ? caught / flagged : 0

  return (
    <SimFrame
      title="What an AI detector does to a school"
      provenance="computed"
      controls={
        <>
          <Slider label="Essays turned in" min={200} max={3000} step={100} value={essays} onChange={touch(setEssays)} />
          <Slider label="Really written by AI" min={0} max={30} value={cheatPct} onChange={touch(setCheatPct)} format={(v) => `${v}%`} />
          <Slider label="Detector catches (of AI essays)" min={50} max={99} value={hitPct} onChange={touch(setHitPct)} format={(v) => `${v}%`} />
          <Slider label="False alarms (of honest essays)" min={0} max={70} value={fpPct} onChange={touch(setFpPct)} format={(v) => `${v}%`} />
          <Seg label="Who is writing" options={[{ value: 'native', label: 'Native English writers' }, { value: 'nonnative', label: 'Non-native writers (Liang et al.)' }]} value={writers} onChange={pickWriters} />
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="honest students flagged" value={falsely} tone={falsely > 0 ? 'berry' : 'moss'} />
          <Stat label="AI essays caught" value={`${caught} of ${ai}`} />
          <Stat label="chance a flagged student really used AI" value={`${Math.round(precision * 100)}%`} tone={precision < 0.8 ? 'berry' : undefined} />
        </div>
      }
    >
      <p className="sim-muted">
        Of {essays.toLocaleString('en-US')} essays, {ai} were written by AI and {honest.toLocaleString('en-US')} were honest.
        The detector flags {flagged}: {caught} real cases and <b>{falsely} honest students</b>.
        {writers === 'nonnative' && ' Liang et al. (2023) found detectors flagged about 61% of essays written by non-native English speakers — work the students wrote themselves.'}
      </p>
      {flagged > 0 && precision < 0.8 && (
        <p className="sim-result is-bad">If you are flagged, there is a {Math.round((1 - precision) * 100)}% chance you did nothing wrong. A flag cannot be proof — it is a reason for a conversation, at most.</p>
      )}
    </SimFrame>
  )
}
