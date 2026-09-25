/* ClaimCheck — Lesson 5.1. An AI answer, split into claims; each claim has
   search results the learner can open (lateral reading, citation tracing,
   a reverse image search). The learner labels every claim confirmed,
   contradicted or unverifiable, then checks. The town, the dam and every
   source are invented for the lesson and say so — so the checking can be
   done without leaving the page. */

import { useState } from 'react'
import { SimFrame, Btn, Stat } from './kit'

const CASES = {
  dam: {
    question: 'Summarize the Millbrook dam decision for my civics essay, with sources.',
    claims: [
      {
        id: 'c1',
        text: 'The Millbrook city council voted 5–2 to remove the Old Mill Dam in March 2024.',
        verdict: 'confirmed',
        sources: [
          { from: 'City of Millbrook · council minutes', text: 'Item 7: Motion to remove the Old Mill Dam. Passed 5–2, March 12, 2024.' },
          { from: 'Millbrook Ledger · local news', text: 'In a 5–2 vote Tuesday night, the council chose removal over repair.' },
        ],
        why: 'Two independent sources — the council’s own minutes and local news — agree on the vote and the date.',
      },
      {
        id: 'c2',
        text: 'Removing the dam will cost $4.2 million, paid entirely by a state grant.',
        verdict: 'contradicted',
        sources: [
          { from: 'Millbrook Ledger · local news', text: 'The $4.2 million project is covered partly by a $3 million state grant; the city will borrow the remaining $1.2 million.' },
          { from: 'State environment agency · grant list', text: 'Millbrook, Old Mill Dam removal: award $3,000,000.' },
        ],
        why: 'The cost is right but “entirely” is wrong: the grant is $3 million and the city borrows the rest. A true number inside a false sentence is a common shape for an AI error.',
      },
      {
        id: 'c3',
        text: 'A 2023 study in the Journal of River Ecology found salmon returned within one year of similar dam removals.',
        verdict: 'unverifiable',
        sources: [
          { from: 'Journal of River Ecology · archive search', text: 'No results for “salmon return one year dam removal” in 2023.' },
          { from: 'University river-restoration review, 2021', text: 'Fish returned to restored rivers anywhere from two to ten years after removal, depending on the river.' },
        ],
        why: 'The journal exists but the study cannot be found — the classic invented citation. You cannot confirm it, and a real review suggests the “one year” figure is doubtful. Do not cite it.',
      },
      {
        id: 'c4',
        text: 'Most residents supported removal, according to a city survey.',
        verdict: 'contradicted',
        sources: [
          { from: 'City of Millbrook · survey results', text: '312 residents surveyed: 41% support removal, 38% oppose, 21% unsure.' },
        ],
        why: '41% is the largest group, but it is not “most” (more than half). The source exists and is real — it just does not say what the answer claims.',
      },
      {
        id: 'c5',
        text: 'A photo shared online this week shows the dam breaking during last week’s storm.',
        verdict: 'contradicted',
        image: true,
        sources: [
          { from: 'Reverse image search', text: 'Earliest copy: posted in 2019, captioned as a dam failure in a different state.' },
          { from: 'Content Credentials check', text: 'No provenance data attached to the file.' },
          { from: 'Millbrook Ledger · this week', text: 'Crews inspected the Old Mill Dam after the storm and found it intact.' },
        ],
        why: 'A real photo in a false context. Checking whether the image is AI-made would not have helped — it is not. Tracing where it first appeared did.',
      },
    ],
  },
}

const VERDICTS = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'contradicted', label: 'Contradicted' },
  { id: 'unverifiable', label: 'Unverifiable' },
]

export default function ClaimCheck({ onDone, caseId = 'dam' }) {
  const kase = CASES[caseId]
  const [open, setOpen] = useState(() => new Set())
  const [labels, setLabels] = useState({})
  const [checked, setChecked] = useState(false)

  const toggleOpen = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const allLabelled = kase.claims.every((c) => labels[c.id])
  const right = kase.claims.filter((c) => labels[c.id] === c.verdict).length
  const opened = kase.claims.filter((c) => open.has(c.id)).length

  const check = () => { setChecked(true); onDone?.() }

  return (
    <SimFrame
      title="Check the claim, not the answer"
      provenance="practice"
      note="A practice case: Millbrook, its dam and every source below are invented for this lesson, so you can check them without leaving the page."
      footer={
        <>
          <div className="sim-stats">
            <Stat label="claims you opened sources for" value={`${opened}/${kase.claims.length}`} />
            {checked && <Stat label="verdicts that match the evidence" value={`${right}/${kase.claims.length}`} tone={right >= 4 ? 'moss' : 'berry'} />}
          </div>
          {!checked && <Btn primary disabled={!allLabelled} onClick={check}>Check my verdicts</Btn>}
        </>
      }
    >
      <div className="cc-question"><span className="sim-label">The question</span>{kase.question}</div>
      <ol className="cc-claims">
        {kase.claims.map((c, i) => {
          const isOpen = open.has(c.id)
          const mine = labels[c.id]
          const ok = checked && mine === c.verdict
          return (
            <li key={c.id} className={`cc-claim${checked ? (ok ? ' is-right' : ' is-wrong') : ''}`}>
              <div className="cc-claim-head">
                <span className="cc-n tnum">{i + 1}</span>
                <span className="cc-text">{c.image && <b>[Photo] </b>}{c.text}</span>
              </div>
              <div className="sim-row">
                <Btn quiet onClick={() => toggleOpen(c.id)}>{isOpen ? 'Hide sources' : c.image ? 'Trace the photo' : 'Read laterally'}</Btn>
                <div className="sim-seg" role="radiogroup" aria-label={`Verdict for claim ${i + 1}`}>
                  {VERDICTS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={mine === v.id}
                      disabled={checked}
                      className={`st-seg${mine === v.id ? ' is-on' : ''}${checked && c.verdict === v.id ? ' is-answer' : ''}${checked && mine === v.id && c.verdict !== v.id ? ' is-miss' : ''}`}
                      onClick={() => setLabels((l) => ({ ...l, [c.id]: v.id }))}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              {isOpen && (
                <ul className="cc-sources">
                  {c.sources.map((s, j) => (
                    <li key={j}><span className="cc-from">{s.from}</span>{s.text}</li>
                  ))}
                </ul>
              )}
              {checked && <p className="cc-why">{c.why}</p>}
            </li>
          )
        })}
      </ol>
    </SimFrame>
  )
}
