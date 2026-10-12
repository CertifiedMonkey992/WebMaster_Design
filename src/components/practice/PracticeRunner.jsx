/* ═══════════════════════════════════════════════════════════════════════════
   PracticeRunner.jsx — A PRACTICE SESSION
   ---------------------------------------------------------------------------
   The lesson's own step body, one question at a time, with no ceremony: pick
   an answer, Check, read why, Continue.

     · nothing here costs a heart, so a miss speaks in INK, not berry
       (COMPONENT_RULES.md → The heart rule, in colour)
     · a miss shows the right answer, the step's own explanation, and "The
       idea" — the explanation card from the lesson that teaches the concept,
       quoted as written there, never rewritten
     · a miss queues one more question on the SAME concept, a different one
       where the bank has it, labelled "Same idea, new question"
     · every answer is recorded the moment it is checked (RECORD_ATTEMPT), so
       the history is right even if the session is abandoned; on a connected
       build it is also sent to the server to grade (activityOutbox)
     · the session closes once (COMPLETE_PRACTICE), and pays by the shared
       practice rule; leaving mid-session closes it with what was answered
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { getLessonContent } from '../../data/lessonContent'
import { getLessonById, getSectionById, SECTIONS } from '../../data/learnData'
import { getConcept } from '../../data/concepts'
import practice, { MODES } from '../../services/practiceService'
import { report } from '../../services/activityOutbox'
import { PRACTICE } from '../../config/progressionConfig'
import useActiveTime from '../../hooks/useActiveTime'
import StepBody, { EMPTY_ANSWER, correctLabel, isAnswerCorrect, canCheckStep } from '../learn/StepRenderer'
import { answerSummary, answerForGrading } from '../../utils/stepLogic'
import { inline } from '../learn/Rich'
import { HeartIcon, Icon } from '../progression/Icons'
import RollingNumber from '../../motion/RollingNumber'
import { ring, shake } from '../../motion/burst'
import '../learn/LessonModal.css'

/** Why a question is in the session, in the words shown above it. */
const WHY_HERE = {
  mistake: 'A concept you missed',
  due: 'Due for review',
  weak: 'A weak area',
  older: 'Not practised for a while',
  new: 'Not practised yet',
  learning: 'Still settling in',
  mastered: 'Keeping it fresh',
  related: 'Related to what you missed',
  mixed: 'Mixed practice',
  'follow-up': 'Same idea, new question',
}

function moduleLabel(moduleId) {
  const section = getSectionById(moduleId)
  return section ? `Module ${SECTIONS.indexOf(section) + 1} · ${section.title}` : ''
}

/** "The idea": the lesson's own explanation card, quoted. */
function Idea({ concept }) {
  const idea = practice.ideaFor(concept, getLessonContent)
  if (!idea) return null
  return (
    <div className="pr-idea">
      <span className="pr-idea-label">The idea · from {idea.lessonLabel}</span>
      <strong className="pr-idea-title">{idea.title}</strong>
      {idea.body.map((p, i) => <p key={i} className="pr-idea-p">{inline(p)}</p>)}
      {idea.list.length > 0 && (
        <ul className="pr-idea-list">
          {idea.list.map((it) => <li key={it.term}><b>{it.term}.</b> {inline(it.text)}</li>)}
        </ul>
      )}
      {idea.takeaway && <p className="pr-idea-p">{inline(idea.takeaway)}</p>}
    </div>
  )
}

export default function PracticeRunner({ session, bank, onFinish }) {
  const { state, actions } = useProgression()
  const stateRef = useRef(state)
  stateRef.current = state

  const [deck, setDeck] = useState(session.deck)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('answering')
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const [draggedChip, setDraggedChip] = useState(null)
  const [followUps, setFollowUps] = useState(0)
  const [queued, setQueued] = useState(null)
  const [answered, setAnswered] = useState(0)

  const time = useActiveTime()
  const committed = useRef(false)
  const answeredRef = useRef(0)
  const bodyRef = useRef(null)

  const entry = deck[idx]
  const step = entry?.step
  const modeName = MODES[session.mode]?.name ?? 'Practice'
  const conceptLabel = getConcept(entry?.concept)?.label ?? ''
  const wasMistake = session.startMistakes.includes(entry?.concept)
  const lastAnswer = entry?.original ? state.practice?.items?.[entry.key]?.ans : null

  useEffect(() => { time.start() }, [time])

  const update = (patch) => {
    time.touch()
    setAnswer((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }

  function check() {
    if (phase !== 'answering' || !step || !canCheckStep(step, answer)) return
    time.touch()
    const ok = isAnswerCorrect(step, answer) === true
    actions.recordAttempt({
      key: entry.key,
      correct: ok,
      source: 'practice',
      answer: answerSummary(step, answer),
      sessionId: session.id,
    })
    report('answer', { key: entry.key, context: 'practice', sessionId: session.id, answer: answerForGrading(step, answer) })
    answeredRef.current += 1
    setAnswered(answeredRef.current)
    setPhase(ok ? 'correct' : 'reveal')

    /* A miss brings the concept back once more in this session — a
       different question on it, when the bank has one. */
    let next = null
    if (!ok && followUps < PRACTICE.MAX_FOLLOW_UPS) {
      next = practice.followUpFor(entry, deck.map((e) => e.key), bank, stateRef.current, Date.now())
      if (next) {
        setDeck((d) => {
          const at = Math.min(idx + 2, d.length)
          return [...d.slice(0, at), next, ...d.slice(at)]
        })
        setFollowUps((n) => n + 1)
      }
    }
    setQueued(next)
  }

  function finish() {
    if (committed.current) return
    committed.current = true
    if (answeredRef.current === 0) { onFinish(null); return }
    const events = actions.completePractice({
      sessionId: session.id,
      seconds: time.started() ? time.seconds() : 0,
      mode: session.mode,
      topic: session.topic ?? session.concept,
      startMistakes: session.startMistakes,
    })
    report('practice-complete', { sessionId: session.id, mode: session.mode, topic: session.topic })
    onFinish({ sessionId: session.id, event: events.find((e) => e.type === 'PRACTICE_COMPLETE') ?? null })
  }

  function next() {
    time.touch()
    if (idx + 1 < deck.length) {
      setIdx((i) => i + 1)
      setAnswer(EMPTY_ANSWER)
      setPhase('answering')
      setQueued(null)
      return
    }
    finish()
  }

  /* Leaving mid-session (another tab in the sidebar) closes it with what
     was answered, so those answers still count for the streak and quests. */
  const latest = useRef({ actions, time, session })
  latest.current = { actions, time, session }
  useEffect(() => () => {
    if (committed.current || answeredRef.current === 0) return
    committed.current = true
    const { actions: a, time: t, session: s } = latest.current
    a.completePractice({ sessionId: s.id, seconds: t.started() ? t.seconds() : 0, mode: s.mode, topic: s.topic ?? s.concept, startMistakes: s.startMistakes })
    report('practice-complete', { sessionId: s.id, mode: s.mode, topic: s.topic })
  }, [])

  /* Each question takes the keyboard's focus, so number keys and Enter
     answer it straight away — and a screen reader starts at the question,
     not on the sidebar button that opened Practice. */
  useEffect(() => {
    bodyRef.current?.focus({ preventScroll: true })
  }, [idx])

  /* The verdict, answered in motion once it has painted. */
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    if (phase === 'correct') ring(body.querySelector('.lm-opt--correct') || body.querySelector('.st-number-field') || body.querySelector('.st-sort-list'), { color: '--moss', size: 110 })
    if (phase === 'reveal') shake(body.querySelector('.lm-opt--wrong') || body.querySelector('.st-number-field') || body.querySelector('.st-sort-row.is-wrong'), { distance: 5 })
  }, [phase])

  /* Keyboard: numbers choose, Enter checks or continues. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.closest('[role="dialog"]'))) return
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.matches('button') && !e.target.matches('.lm-btn-check, .lm-btn-continue')) return
        e.preventDefault()
        if (phase === 'answering') check(); else next()
        return
      }
      if (phase !== 'answering' || !step) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1) return
      if (step.type === 'mcq' && step.options[n - 1]) update({ selected: step.options[n - 1].id })
      if (step.type === 'binary' && step.options[n - 1]) update({ selected: step.options[n - 1].value })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!entry) return null

  const conceptNow = state.practice?.concepts?.[entry.concept]
  const clearedNow = phase === 'correct' && wasMistake && practice.statusOf(conceptNow, Date.now()) !== 'mistake'
  const item = getLessonById(entry.itemId)

  return (
    <div className="ps-runner pr-runner">
      <div className="ps-runner-head">
        <span className="ps-runner-label"><HeartIcon size={13} /> {modeName} · no hearts at risk</span>
        <span className="ps-runner-count"><RollingNumber value={idx + 1} /> / {deck.length}</span>
      </div>
      <div className="ps-runner-track" aria-hidden="true">
        <div className="ps-runner-fill" style={{ width: `${(idx / deck.length) * 100}%` }} />
      </div>

      <p className={`pr-why${entry.reason === 'follow-up' ? ' is-follow' : ''}`} key={`why-${idx}`}>
        <span>{WHY_HERE[entry.reason] ?? 'Practice'}</span>
        <span className="pr-why-sep" aria-hidden="true">·</span>
        <span>{conceptLabel}</span>
        <span className="pr-why-sep" aria-hidden="true">·</span>
        <span className="pr-why-src">{item?.title ?? moduleLabel(entry.moduleId)}</span>
      </p>
      {lastAnswer && phase === 'answering' && (
        <p className="pr-last">You missed this exact question before — last time you answered “{lastAnswer}”.</p>
      )}

      <div className="ps-runner-body pr-body" ref={bodyRef} tabIndex={-1} aria-label={`Question ${idx + 1} of ${deck.length}`}>
        <div className="lm-step" key={`${idx}:${entry.key}`}>
          <StepBody
            step={step}
            phase={phase}
            answer={answer}
            update={phase === 'answering' ? update : undefined}
            lessonId={entry.itemId}
            draggedChip={draggedChip}
            onChipClick={(chip) => update((prev) => {
              const filled = [...(prev.filled ?? [])]
              const slot = (step.answers ?? []).findIndex((_, i) => !filled[i])
              if (slot >= 0) filled[slot] = chip
              return { filled }
            })}
            onBlankClick={(i) => update((prev) => { const filled = [...(prev.filled ?? [])]; filled[i] = null; return { filled } })}
            onDropChip={(i) => { if (draggedChip) { update((prev) => { const filled = [...(prev.filled ?? [])]; filled[i] = draggedChip; return { filled } }); setDraggedChip(null) } }}
            onDragChip={setDraggedChip}
          />
        </div>
      </div>

      <span className="pg-sr-only" role="status" aria-live="polite">
        {phase === 'correct' && 'Correct.'}
        {phase === 'reveal' && `Not quite. The answer is ${correctLabel(step)}. No heart spent.`}
      </span>

      {phase === 'answering' && (
        <div className="lm-action lm-action--neutral ps-action" key="a">
          <button type="button" className="btn btn-ghost btn-sm pr-end" onClick={finish}>
            {answered > 0 ? 'Finish here' : 'Leave'}
          </button>
          <span className="lm-key-hint" aria-hidden="true">Choose · <kbd>Enter</kbd> to check</span>
          <button type="button" className={`btn btn-primary btn-lg lm-btn-check${canCheckStep(step, answer) ? ' is-ready' : ''}`} disabled={!canCheckStep(step, answer)} onClick={check}>
            Check
          </button>
        </div>
      )}

      {phase === 'correct' && (
        <div className="lm-action lm-action--correct ps-action" key="c">
          <div className="lm-feedback">
            <span className="lm-fb-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" /></svg>
            </span>
            <div>
              <div className="lm-fb-title">
                {clearedNow ? `Right — ${conceptLabel} is off your mistakes list` : wasMistake ? 'Right — one more right answer on this idea clears it' : 'Right'}
              </div>
              {step.why && <p className="lm-fb-why">{inline(step.why)}</p>}
            </div>
          </div>
          <button type="button" className="btn btn-lg lm-btn-continue lm-btn-continue--correct" onClick={next}>
            {idx + 1 < deck.length ? 'Continue' : 'See how it went'}
          </button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="lm-action lm-action--reveal ps-action pr-verdict" key="r">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--reveal"><Icon name="info" size={20} strokeWidth={2.4} /></span>
            <div>
              <div className="lm-fb-title">Not quite — no heart spent</div>
              {correctLabel(step) && <div className="lm-fb-correct">Answer: <strong>{correctLabel(step)}</strong></div>}
              {step.why && <p className="lm-fb-why">{inline(step.why)}</p>}
              <Idea concept={entry.concept} />
              {queued && <p className="pr-queued"><Icon name="review" size={14} /> Another question on this idea is coming up.</p>}
            </div>
          </div>
          <button type="button" className="btn btn-lg lm-btn-continue lm-btn-continue--reveal" onClick={next}>
            {idx + 1 < deck.length ? 'Continue' : 'See how it went'}
          </button>
        </div>
      )}
    </div>
  )
}
