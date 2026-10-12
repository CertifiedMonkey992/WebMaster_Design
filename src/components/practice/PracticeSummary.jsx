/* ═══════════════════════════════════════════════════════════════════════════
   PracticeSummary.jsx — HOW THE SESSION WENT
   ---------------------------------------------------------------------------
   Read back from the session's own record (state.practice.sessions), not
   from anything the runner kept: questions answered, accuracy, topics,
   mistakes corrected, what still needs attention, how it compares with the
   learner's recent sessions of the same kind, what it paid and why — and
   one recommended next step, from the history as it is NOW.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { getConcept } from '../../data/concepts'
import { getSectionById, SECTIONS } from '../../data/learnData'
import practice, { MODES } from '../../services/practiceService'
import { PRACTICE_XP } from '../../utils/practiceXp'
import { Icon, BoltIcon } from '../progression/Icons'
import SplitText from '../../motion/SplitText'
import { ring } from '../../motion/burst'
import { recommendationCopy } from './PracticeHome'

const pct = (x) => `${Math.round(x * 100)}%`
const labels = (ids) => ids.map((id) => getConcept(id)?.label ?? id)
const listOf = (items) => (items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

export default function PracticeSummary({ sessionId, event, view, starter = false, onStart, onHome }) {
  const { state } = useProgression()
  const stampRef = useRef(null)
  const summary = state.practice?.sessions?.find((s) => s.id === sessionId) ?? null

  useEffect(() => {
    const t = window.setTimeout(() => ring(stampRef.current, { color: '--moss', size: 140 }), 260)
    return () => clearTimeout(t)
  }, [])

  if (!summary) {
    return (
      <div className="pr-summary">
        <p className="pr-note">That session could not be found. <button type="button" className="pr-link" onClick={() => onHome()}>Back to Practice</button></p>
      </div>
    )
  }

  const accuracy = summary.total ? summary.correct / summary.total : 0
  const before = practice.previousComparable(state, summary)
  const modeName = MODES[summary.mode]?.name ?? 'Practice'
  const modules = summary.modules.map((id) => {
    const s = getSectionById(id)
    return s ? `Module ${SECTIONS.indexOf(s) + 1} · ${s.title}` : id
  })
  const corrected = labels(summary.corrected)
  const needs = summary.needs.map((id) => ({ id, label: getConcept(id)?.label ?? id, reason: practice.reasonFor(state.practice.concepts[id], Date.now()).text }))
  const rec = recommendationCopy(view.recommendation, { starter })
  const xp = event?.xp ?? summary.xp
  const bonus = event?.bonus ?? null
  const perAnswer = event?.perAnswer ?? null

  return (
    <div className="pr-summary">
      <div className="lm-stamp pr-stamp" ref={stampRef} aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
        </svg>
      </div>
      <SplitText as="h2" className="pr-sum-title" immediate delay={200}>Session complete</SplitText>
      <p className="pr-sum-score"><b className="tnum">{summary.correct}</b> of {summary.total} right · {pct(accuracy)} · {modeName}</p>

      <dl className="pr-sum-facts">
        <div>
          <dt>Topics</dt>
          <dd>{modules.length ? listOf(modules) : '—'}{summary.concepts.length ? ` — ${summary.concepts.length} concept${summary.concepts.length === 1 ? '' : 's'}` : ''}</dd>
        </div>
        <div>
          <dt>Mistakes corrected</dt>
          <dd>{corrected.length ? listOf(corrected) : 'None this time.'}</dd>
        </div>
        <div>
          <dt>Still needs attention</dt>
          <dd>
            {needs.length
              ? <ul className="pr-sum-needs">{needs.map((n) => <li key={n.id}><b>{n.label}</b> — {n.reason}</li>)}</ul>
              : 'Nothing from this session — every concept in it is on track.'}
          </dd>
        </div>
        <div>
          <dt>Compared with before</dt>
          <dd>
            {before
              ? <>{pct(accuracy)} this time, against {pct(before.accuracy)} across your last {before.sessions === 1 ? 'session' : `${before.sessions} sessions`} of this kind.</>
              : 'Your first session of this kind — the next one will be compared with it.'}
          </dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd className="pr-sum-xp">
            <BoltIcon size={16} /> <b className="tnum">+{xp}</b>
            {bonus != null && perAnswer != null && <> — {bonus} for the session, {perAnswer} for fresh right answers.</>}
            {event?.reduced && <> The session bonus is smaller after {PRACTICE_XP.FULL_SESSIONS} sessions in a day.</>}
            {event?.capped && <> Practice has paid its {PRACTICE_XP.DAILY_CAP} XP for today; it still counts for your streak and quests.</>}
            {summary.total < PRACTICE_XP.MIN_FOR_BONUS && <> Sessions of {PRACTICE_XP.MIN_FOR_BONUS} or more questions earn the session bonus.</>}
          </dd>
        </div>
      </dl>

      {rec && (
        <section className="pr-rec pr-rec--next" aria-labelledby="pr-next-title">
          <span className="pr-rec-eyebrow">Recommended next</span>
          <div className="pr-rec-main">
            <span className="pr-rec-icon" aria-hidden="true"><Icon name={MODES[view.recommendation.mode].icon} size={22} /></span>
            <div className="pr-rec-text">
              <h3 className="pr-rec-title" id="pr-next-title">{rec.title}</h3>
              {rec.reason && <p className="pr-rec-reason">{rec.reason}</p>}
            </div>
            <button type="button" className="btn btn-next pr-rec-go" onClick={() => onStart({ mode: view.recommendation.mode, size: rec.size })}>Start</button>
          </div>
        </section>
      )}

      <div className="pr-sum-actions">
        <button type="button" className="btn btn-outline" onClick={() => onHome()}>Back to Practice</button>
        <button type="button" className="btn btn-ghost" onClick={() => onHome('topic')}>Practise another topic</button>
        {view.counts.mistakes > 0 && view.recommendation?.mode !== 'mistakes' && (
          <button type="button" className="btn btn-ghost" onClick={() => onStart({ mode: 'mistakes' })}>
            Review remaining mistakes ({view.counts.mistakes})
          </button>
        )}
      </div>
    </div>
  )
}
