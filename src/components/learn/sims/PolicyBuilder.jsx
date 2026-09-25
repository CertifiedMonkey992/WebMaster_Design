/* PolicyBuilder — Lesson 7.2. Draft a school AI policy clause by clause and
   share it with the people it affects. Each stakeholder's response is a rule
   written for the lesson from the evidence the course covered (detectors'
   false positives, Bastani et al., data privacy, energy). The first draft is
   shared with the three people everyone thinks of — then the four people it
   also affects appear. */

import { useState } from 'react'
import { SimFrame, Seg, Btn, Stat } from './kit'

const TOPICS = [
  { id: 'detectors', label: 'AI detectors', options: [
    { value: 'decide', label: 'A flag decides a cheating case' },
    { value: 'conversation', label: 'A flag can start a conversation, never decide' },
    { value: 'none', label: 'No detectors' },
  ] },
  { id: 'disclosure', label: 'Disclosing AI help', options: [
    { value: 'none', label: 'Not required' },
    { value: 'every', label: 'Say how AI helped on every assignment' },
  ] },
  { id: 'use', label: 'Using AI for schoolwork', options: [
    { value: 'ban', label: 'Banned' },
    { value: 'tutor', label: 'Study and tutor modes yes; answer mode no on practice' },
    { value: 'any', label: 'Any use' },
  ] },
  { id: 'tools', label: 'Which tools', options: [
    { value: 'any', label: 'Whatever students like' },
    { value: 'vetted', label: 'Only tools the district has checked for student data' },
  ] },
  { id: 'appeals', label: 'Appeals', options: [
    { value: 'none', label: 'No appeal' },
    { value: 'person', label: 'Any AI-related decision can be appealed to a person' },
  ] },
  { id: 'energy', label: 'Energy and cost', options: [
    { value: 'ignore', label: 'Not considered' },
    { value: 'efficient', label: 'Prefer lighter tools; report usage each term' },
  ] },
]

const PEOPLE = [
  { id: 'student', who: 'A student', first: true, react: (p) => [
    p.use === 'ban' && 'If AI is banned even for quizzing myself, I’ll just use it at home with no guidance.',
    p.detectors === 'decide' && 'A detector can accuse me of something I didn’t do.',
  ] },
  { id: 'teacher', who: 'A teacher', first: true, react: (p) => [
    p.use === 'any' && 'If answer mode is fine on practice problems, students’ practice scores stop telling me who learned it.',
    p.disclosure === 'none' && 'Without disclosure I can’t tell what a student did themselves.',
  ] },
  { id: 'parent', who: 'A parent', first: true, react: (p) => [
    p.tools === 'any' && 'Which companies end up with my child’s writing and data?',
  ] },
  { id: 'ell', who: 'A student still learning English', react: (p) => [
    p.detectors === 'decide' && 'Detectors wrongly flag most essays by non-native writers. Under this policy, my own writing makes me a suspect.',
  ] },
  { id: 'access', who: 'A student with dyslexia', react: (p) => [
    p.use === 'ban' && 'I use AI read-aloud and outlining as an accommodation. A ban takes it away.',
    p.appeals === 'none' && 'If a decision about me is wrong, who can I go to?',
  ] },
  { id: 'privacy', who: 'The district privacy officer', react: (p) => [
    p.tools === 'any' && 'Students under 18 cannot legally use some consumer AI tools, and we have not checked where their data goes.',
  ] },
  { id: 'climate', who: 'The school climate club', react: (p) => [
    p.energy === 'ignore' && 'Nobody is even counting the energy this uses.',
  ] },
]

const START = { detectors: 'decide', disclosure: 'none', use: 'ban', tools: 'any', appeals: 'none', energy: 'ignore' }

export default function PolicyBuilder({ onDone }) {
  const [policy, setPolicy] = useState(START)
  const [shares, setShares] = useState(0)
  const [feedback, setFeedback] = useState(null)

  const share = () => {
    const n = shares + 1
    setShares(n)
    const who = PEOPLE.filter((p) => p.first || n > 1)
    setFeedback({ n, rows: who.map((p) => ({ ...p, concerns: p.react(policy).filter(Boolean) })), snapshot: { ...policy } })
    if (n >= 2) onDone?.()
  }

  const concerns = feedback ? feedback.rows.reduce((s, r) => s + r.concerns.length, 0) : 0
  const changed = feedback && Object.keys(policy).some((k) => policy[k] !== feedback.snapshot[k])

  return (
    <SimFrame
      title="Draft your school’s AI policy"
      provenance="scripted"
      note="Each response is written for this lesson from evidence the course covered: detector false positives, the tutor-mode research, student data law, energy use."
      footer={
        <>
          {feedback && <div className="sim-stats"><Stat label="concerns raised" value={concerns} tone={concerns === 0 ? 'moss' : 'berry'} /><Stat label="people heard from" value={feedback.rows.length} /></div>}
          <Btn primary onClick={share} disabled={feedback && !changed && shares > 1}>{shares === 0 ? 'Share this draft' : 'Share the revised draft'}</Btn>
        </>
      }
    >
      <div className="pb-topics">
        {TOPICS.map((t) => (
          <Seg key={t.id} label={t.label} options={t.options} value={policy[t.id]} onChange={(v) => setPolicy((p) => ({ ...p, [t.id]: v }))} />
        ))}
      </div>

      {feedback && (
        <>
          {feedback.n === 1 && <p className="sim-result">Three people read your draft. Share it again after revising — and see who else it reaches.</p>}
          {feedback.n > 1 && feedback.n === shares && shares === 2 && <p className="sim-result is-bad">Four more people are affected by this policy. None of them were in the first review.</p>}
          <ul className="pb-people">
            {feedback.rows.map((r) => (
              <li key={r.id} className={r.concerns.length ? 'is-concern' : 'is-ok'}>
                <span className="pb-who">{r.who}</span>
                {r.concerns.length ? r.concerns.map((c, i) => <span key={i} className="pb-said">“{c}”</span>) : <span className="pb-said">No concerns with this draft.</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </SimFrame>
  )
}
