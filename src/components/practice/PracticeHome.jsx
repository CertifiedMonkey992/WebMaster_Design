/* ═══════════════════════════════════════════════════════════════════════════
   PracticeHome.jsx — THE PRACTICE DASHBOARD
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Practice. Top to bottom:

     the recommendation   the loudest thing on the page: one mode, its count,
                          and the reason, started in one press
     ways to practise     the seven modes as rows in one container, each with
                          what it draws from and its live count; an empty mode
                          says why and disables, it never hides
     needs attention      the concepts most in need, with the reason and the
                          last answers as marks
     your practice        sessions, answers, and recent accuracy against
                          earlier — the history made visible
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react'
import { Icon } from '../progression/Icons'
import { PracticeIcon } from '../learn/NavIcons'
import SplitText from '../../motion/SplitText'
import { MODES } from '../../services/practiceService'
import { PRACTICE } from '../../config/progressionConfig'
import { PRACTICE_XP } from '../../utils/practiceXp'

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`)

/** The last few answers on a concept, as marks: shape and colour both. */
export function Marks({ marks, label = 'Recent answers' }) {
  if (!marks?.length) return null
  const words = marks.map((m) => (m.ok ? 'right' : 'wrong')).join(', ')
  return (
    <span className="pr-marks" role="img" aria-label={`${label}, oldest first: ${words}`}>
      {marks.map((m, i) => (
        <span key={i} className={`pr-mark${m.ok ? ' is-ok' : ' is-miss'}`} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            {m.ok ? <path d="M20 6 9 17 4 12" /> : <path d="M6 6l12 12M18 6 6 18" />}
          </svg>
        </span>
      ))}
    </span>
  )
}

/** The headline and size of a recommendation, from the view. A learner who
 *  has finished nothing yet is practising Lesson 1.1, and is told so. */
export function recommendationCopy(rec, { starter = false } = {}) {
  if (!rec) return null
  const lead = rec.lead
  switch (rec.mode) {
    case 'mistakes':
      return { title: `Review ${plural(rec.count, 'mistake')}`, reason: lead ? `${lead.label}: ${lead.reason.text}` : '', size: PRACTICE.FOCUSED_SIZE }
    case 'due':
      return { title: `Review ${plural(rec.count, 'concept')} that came due`, reason: lead ? `${lead.label}: ${lead.reason.text}` : '', size: PRACTICE.FOCUSED_SIZE }
    case 'weak':
      return { title: `Strengthen ${plural(rec.count, 'weak area')}`, reason: lead ? `${lead.label}: ${lead.reason.text}` : '', size: PRACTICE.FOCUSED_SIZE }
    case 'older':
      return { title: `Revisit ${plural(rec.count, 'older concept')}`, reason: lead ? `${lead.label}: ${lead.reason.text}` : '', size: PRACTICE.FOCUSED_SIZE }
    case 'mixed':
      return starter
        ? { title: 'Try Lesson 1.1’s questions', reason: `${plural(rec.count, 'concept')} from the first lesson, before you take it.`, size: PRACTICE.DEFAULT_SIZE }
        : { title: 'Practise what you have learned', reason: `${plural(rec.count, 'concept')} you have studied but not practised yet.`, size: PRACTICE.DEFAULT_SIZE }
    default:
      return { title: 'Quick practice', reason: 'Everything is up to date — a short set keeps it that way.', size: PRACTICE.SESSION_SIZES[0] }
  }
}

function ModeRow({ mode, desc, count, empty, disabled, onStart, children, startLabel = 'Start', expanded }) {
  const m = MODES[mode]
  return (
    <li className={`pr-mode${disabled ? ' is-empty' : ''}${expanded ? ' is-open' : ''}`}>
      <span className="pr-mode-icon"><Icon name={m.icon} size={22} /></span>
      <div className="pr-mode-body">
        <span className="pr-mode-name">
          {m.name}
          {count > 0 && <span className="pr-mode-count tnum">{count}</span>}
        </span>
        <span className="pr-mode-desc">{disabled && empty ? empty : desc}</span>
      </div>
      {children}
      <button type="button" className="btn btn-outline btn-sm pr-mode-go" disabled={disabled} onClick={onStart} aria-expanded={expanded}>
        {startLabel}
      </button>
    </li>
  )
}

export default function PracticeHome({ view, ready, loadError, starter, focus, onStart, onRetry, onGoLearn, sizes }) {
  const [quickSize, setQuickSize] = useState(sizes.includes(PRACTICE.DEFAULT_SIZE) ? PRACTICE.DEFAULT_SIZE : sizes[0])
  const [topicsOpen, setTopicsOpen] = useState(focus === 'topic')
  const rec = recommendationCopy(view.recommendation, { starter })
  const studiedModules = view.modules.filter((m) => m.studied)
  const empty = ready && view.bankSize === 0
  const c = view.counts
  const h = view.history

  return (
    <div className="qp-board pr-home">
      <header className="qp-board-head pr-head">
        <span className="pr-head-icon" aria-hidden="true"><PracticeIcon size={44} /></span>
        <div>
          <span className="qp-eyebrow">Practice</span>
          <SplitText as="h1" className="qp-title" immediate stagger={55}>Built from your own answers</SplitText>
          <p className="pr-lead">
            {view.tracked > 0
              ? <>{plural(view.tracked, 'concept')} tracked from what you answered · {view.mastered} mastered. Practice never costs a heart.</>
              : <>Every question you answer is remembered here, so Practice can bring back what you need. It never costs a heart.</>}
          </p>
        </div>
      </header>

      {starter && (
        <p className="pr-note">
          You haven’t finished a lesson yet, so Practice is using Lesson 1.1’s questions.{' '}
          <button type="button" className="pr-link" onClick={onGoLearn}>Go to the course</button>
        </p>
      )}

      {loadError && (
        <p className="pr-note pr-note--bad" role="alert">
          The practice questions could not be loaded. Check your connection, then{' '}
          <button type="button" className="pr-link" onClick={onRetry}>try again</button>.
        </p>
      )}

      {!ready && !loadError && <p className="pr-note" aria-live="polite">Getting your questions ready…</p>}

      {ready && rec && !empty && (
        <section className="pr-rec" aria-labelledby="pr-rec-title">
          <span className="pr-rec-eyebrow">Recommended for you</span>
          <div className="pr-rec-main">
            <span className="pr-rec-icon" aria-hidden="true"><Icon name={MODES[view.recommendation.mode].icon} size={22} /></span>
            <div className="pr-rec-text">
              <h2 className="pr-rec-title" id="pr-rec-title">{rec.title}</h2>
              {rec.reason && <p className="pr-rec-reason">{rec.reason}</p>}
            </div>
            <button
              type="button"
              className="btn btn-next pr-rec-go"
              onClick={() => onStart({ mode: view.recommendation.mode, size: rec.size })}
            >
              Start
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </section>
      )}

      {empty && !loadError && (
        <div className="pr-empty">
          <p className="pr-empty-title">Nothing to practise yet</p>
          <p className="pr-empty-body">Practice draws on the lessons you finish. Finish Lesson 1.1 and its questions start coming back here.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onGoLearn}>Start Lesson 1.1</button>
        </div>
      )}

      <section className="qp-section" aria-labelledby="pr-modes-title">
        <header className="qp-section-head">
          <div>
            <h3 className="qp-section-title" id="pr-modes-title">Ways to practise</h3>
            <p className="qp-section-sub">{!ready ? 'Loading…' : starter ? `${plural(view.bankSize, 'question')} from Lesson 1.1` : `${plural(view.bankSize, 'question')} from ${plural(studiedModules.length, 'module')} you have studied`}</p>
          </div>
        </header>
        <ul className="pr-modes">
          <ModeRow
            mode="mistakes" count={c.mistakes} disabled={!ready || !c.mistakes}
            desc={`${plural(c.mistakes, 'concept')} you missed, asked again — with a new question where there is one`}
            empty="Nothing to fix. Anything you miss in a Check comes back here."
            onStart={() => onStart({ mode: 'mistakes' })}
          />
          <ModeRow
            mode="due" count={c.due} disabled={!ready || !c.due}
            desc={`${plural(c.due, 'concept')} whose spaced review has come round`}
            empty={`Nothing due. A concept you get right comes back after ${PRACTICE.BOX_DAYS.slice(1, 4).join(', ')} days, then less often.`}
            onStart={() => onStart({ mode: 'due' })}
          />
          <ModeRow
            mode="weak" count={c.weak} disabled={!ready || !c.weak}
            desc={`${plural(c.weak, 'concept')} under ${Math.round(PRACTICE.WEAK_ACCURACY * 100)}% right`}
            empty={`No weak spots. This fills when a concept stays under ${Math.round(PRACTICE.WEAK_ACCURACY * 100)}% after ${PRACTICE.WEAK_MIN_ATTEMPTS} tries.`}
            onStart={() => onStart({ mode: 'weak' })}
          />
          <ModeRow
            mode="older" count={c.older} disabled={!ready || !c.older}
            desc={`${plural(c.older, 'concept')} you haven’t practised in ${PRACTICE.OLDER_DAYS} days or more`}
            empty={`Nothing older than ${PRACTICE.OLDER_DAYS} days yet.`}
            onStart={() => onStart({ mode: 'older' })}
          />
          <ModeRow
            mode="mixed" disabled={!ready || empty}
            desc={`A balanced set from ${studiedModules.length > 1 ? `all ${studiedModules.length} of your studied modules` : 'what you have studied'}`}
            empty="Finish a lesson to unlock mixed practice."
            onStart={() => onStart({ mode: 'mixed', size: PRACTICE.DEFAULT_SIZE })}
          />
          <ModeRow
            mode="quick" disabled={!ready || empty}
            desc={`${quickSize} questions, chosen by what you need most`}
            empty="Finish a lesson to unlock quick practice."
            onStart={() => onStart({ mode: 'quick', size: quickSize })}
          >
            <span className="pr-sizes" role="group" aria-label="Questions in a quick session">
              {sizes.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`st-seg${quickSize === n ? ' is-on' : ''}`}
                  aria-pressed={quickSize === n}
                  onClick={() => setQuickSize(n)}
                >
                  {n}
                </button>
              ))}
            </span>
          </ModeRow>
          <ModeRow
            mode="topic" disabled={!ready || empty}
            desc="Pick one module you have studied"
            empty="Finish a lesson to choose a topic."
            startLabel={topicsOpen ? 'Close' : 'Choose'}
            expanded={topicsOpen}
            onStart={() => setTopicsOpen((o) => !o)}
          />
          {topicsOpen && ready && (
            <li className="pr-topics">
              <ul className="pr-topic-list" aria-label="Modules">
                {view.modules.map((m) => (
                  <li key={m.id} className={`pr-topic${m.studied ? '' : ' is-locked'}`}>
                    <span className="pr-topic-n tnum" aria-hidden="true">{m.number}</span>
                    <div className="pr-topic-body">
                      <span className="pr-topic-title">{m.title}</span>
                      {m.studied ? (
                        <span className="pr-topic-meta">
                          <span className="pr-topic-track" aria-hidden="true"><span className="pr-topic-fill" style={{ width: `${m.masteryPct}%` }} /></span>
                          {m.mastered} of {plural(m.concepts, 'concept')} mastered{m.accuracy != null ? ` · ${pct(m.accuracy)} right` : ''}
                        </span>
                      ) : (
                        <span className="pr-topic-meta">Not studied yet — finish a lesson in this module first</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={!m.studied}
                      onClick={() => onStart({ mode: 'topic', topic: m.id, size: PRACTICE.DEFAULT_SIZE })}
                      aria-label={`Practise Module ${m.number}, ${m.title}`}
                    >
                      Practise
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </section>

      {view.attention.length > 0 && (
        <section className="qp-section" aria-labelledby="pr-attn-title">
          <header className="qp-section-head">
            <div>
              <h3 className="qp-section-title" id="pr-attn-title">Needs attention</h3>
              <p className="qp-section-sub">Why each one is here, and your last answers on it</p>
            </div>
          </header>
          <ul className="pr-attn">
            {view.attention.map((concept) => (
              <li key={concept.id} className="pr-attn-row">
                <div className="pr-attn-main">
                  <span className="pr-attn-name">{concept.label}</span>
                  <span className="pr-attn-meta">Module {concept.moduleNumber} · {concept.moduleTitle}</span>
                  <span className="pr-attn-reason">{concept.reason.text}</span>
                </div>
                <Marks marks={concept.marks} label={`Your answers on ${concept.label}`} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStart({ mode: 'concept', concept: concept.id })}>
                  Practise
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pr-history" aria-labelledby="pr-history-title">
        <h3 className="qp-section-title" id="pr-history-title">Your practice</h3>
        {h.sessions > 0 ? (
          <p className="pr-history-line">
            {plural(h.sessions, 'session')} · {plural(h.answered, 'answer')} recorded · your last {Math.min(5, h.sessions)} sessions: <b>{pct(h.recentAccuracy)}</b> right
            {h.earlierAccuracy != null && <> (before that, {pct(h.earlierAccuracy)})</>}
          </p>
        ) : (
          <p className="pr-history-line">No practice sessions yet. {h.answered > 0 ? `${plural(h.answered, 'answer')} from your lessons are already in your history.` : ''}</p>
        )}
        <p className="pr-rule">
          How Practice pays: +{PRACTICE_XP.BONUS} XP for a session of {PRACTICE_XP.MIN_FOR_BONUS} or more questions, and +{PRACTICE_XP.PER_FRESH_CORRECT} XP for each right answer to a question that hasn’t paid in the last {PRACTICE_XP.FRESH_HOURS} hours — up to {PRACTICE_XP.DAILY_CAP} XP a day. Every session still counts for your streak and quests.
        </p>
      </section>
    </div>
  )
}
