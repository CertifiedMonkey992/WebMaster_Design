/* ═══════════════════════════════════════════════════════════════════════════
   PracticeSession.jsx — FREE REVIEW MODE
   ---------------------------------------------------------------------------
   Practice never costs a heart, still awards XP, counts toward the streak,
   and feeds the practice quests with genuinely measured seconds.

   Revision 2: the intro's target draws its rings in and follows the pointer;
   the facts arrive in sequence; the lifetime figures count up; questions
   slide in with the same keyboard shortcuts as a lesson; finishing stamps a
   check and throws a burst.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { buildPracticeDeck } from '../../data/lessonContent'
import { XP } from '../../config/progressionConfig'
import useActiveTime from '../../hooks/useActiveTime'
import { Icon, HeartIcon, GemIcon, FlameIcon, BoltIcon } from '../progression/Icons'
import StepBody, { correctLabel, isAnswerCorrect, canCheckStep } from './StepRenderer'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import CountUp from '../../motion/CountUp'
import RollingNumber from '../../motion/RollingNumber'
import { burst, ring, shake } from '../../motion/burst'
import './LessonModal.css'

const DECK_SIZE = 5

export default function PracticeSession() {
  const { vm, actions } = useProgression()
  const [phase, setPhase] = useState('intro')
  const [deck, setDeck] = useState([])
  const [idx, setIdx] = useState(0)
  const [stepPhase, setStepPhase] = useState('answering')
  const [filled, setFilled] = useState([])
  const [selected, setSelected] = useState(null)
  const [draggedChip, setDraggedChip] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [earned, setEarned] = useState({ xp: 0, gems: 0 })

  /* Session time is counted between interactions, capped per idle gap
     (MISC.MAX_IDLE_SECONDS) — a deck left open is not an hour of practice. */
  const time = useActiveTime()
  const committed = useRef(false)
  const bodyRef = useRef(null)
  const doneRef = useRef(null)

  const completedIds = useMemo(
    () => vm.course.sections.flatMap((s) => s.lessons).filter((l) => l.status === 'completed').map((l) => l.id),
    [vm.course],
  )

  const step = deck[idx]

  function start() {
    setDeck(buildPracticeDeck(completedIds, DECK_SIZE))
    setIdx(0); setCorrect(0); setFilled([]); setSelected(null)
    setStepPhase('answering')
    committed.current = false
    time.start()
    setPhase('running')
  }

  function check() {
    if (!canCheckStep(step, { filled, selected })) return
    time.touch()
    const ok = isAnswerCorrect(step, { filled, selected })
    if (ok) setCorrect((c) => c + 1)
    setStepPhase(ok ? 'correct' : 'wrong')
  }

  function select(value) {
    time.touch()
    setSelected(value)
  }

  function next() {
    time.touch()
    if (idx + 1 < deck.length) {
      setIdx((i) => i + 1)
      setFilled([]); setSelected(null); setStepPhase('answering')
      return
    }
    finish()
  }

  function finish() {
    if (committed.current) return
    committed.current = true
    const seconds = time.started() ? time.seconds() : 0
    const events = actions.completePractice({ seconds, correct, total: deck.length })
    setEarned({
      xp: events.filter((e) => e.type === 'XP_AWARDED').reduce((s, e) => s + e.amount, 0),
      gems: events.filter((e) => e.type === 'GEMS_AWARDED').reduce((s, e) => s + e.amount, 0),
    })
    setPhase('done')
  }

  const placeChip = (chip) => {
    if (stepPhase !== 'answering') return
    time.touch()
    const arr = [...filled]
    for (let i = 0; i < step.answers.length; i++) { if (!arr[i]) { arr[i] = chip; break } }
    setFilled(arr)
  }

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || phase !== 'running') return
    if (stepPhase === 'correct') {
      const t = body.querySelector('.lm-opt--correct') || body.querySelector('.lm-sentence')
      ring(t, { color: '--moss', size: 110 })
      burst(t, { palette: 'moss', count: 12, spread: 70 })
    }
    if (stepPhase === 'wrong') shake(body.querySelector('.lm-opt--wrong') || body.querySelector('.lm-sentence'), { distance: 6 })
  }, [stepPhase, phase])

  useEffect(() => {
    if (phase !== 'done') return undefined
    const t = window.setTimeout(() => {
      ring(doneRef.current, { color: '--moss', size: 130 })
      burst(doneRef.current, { palette: 'reward', count: 20, spread: 120, gravity: 40 })
    }, 240)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') return undefined
    const onKey = (e) => {
      /* Keys typed into a form or a dialog over the page are not answers. */
      if (e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.closest('[role="dialog"]'))) return
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.matches('button') && !e.target.matches('.lm-btn-check, .lm-btn-continue')) return
        e.preventDefault()
        if (stepPhase === 'answering') check(); else next()
        return
      }
      if (stepPhase !== 'answering' || !step) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1) return
      if (step.type === 'binary' && step.options[n - 1]) select(step.options[n - 1].value)
      if (step.type === 'mcq' && step.options[n - 1]) select(step.options[n - 1].id)
      if (step.type === 'fill-blank' && step.choices[n - 1] && !filled.includes(step.choices[n - 1])) placeChip(step.choices[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ── Intro ── */
  if (phase === 'intro') {
    return (
      <div className="ps-intro">
        <div className="ps-intro-icon" data-tilt>
          <Icon name="target" size={34} strokeWidth={1.8} />
        </div>
        <SplitText as="h2" className="ps-title" immediate delay={120}>Practice</SplitText>
        <Reveal as="p" className="ps-sub" variant="fade" immediate delay={300}>
          A quick review drawn from everything you’ve covered so far.
          {completedIds.length === 0 && ' Starting with the fundamentals until you finish your first lesson.'}
        </Reveal>

        <Reveal as="ul" className="ps-facts" variant="scale" stagger immediate delay={380}>
          <li data-tip="Wrong answers here are free"><HeartIcon size={16} /> Never costs a heart</li>
          <li data-tip="Paid once per finished session"><BoltIcon size={16} /> +{XP.PRACTICE} XP per session</li>
          <li data-tip="A finished session counts as today's activity"><FlameIcon size={16} /> Counts toward your streak</li>
          <li data-tip="Drawn from lessons you've completed"><Icon name="clock" size={16} /> {DECK_SIZE} questions, about 3 minutes</li>
        </Reveal>

        <Reveal variant="scale" immediate delay={620}>
          <button className="btn btn-primary btn-lg ps-start fx-shine" onClick={start} data-magnetic="8">
            Start review session
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </Reveal>

        <div className="ps-stats">
          <div><b><CountUp value={vm.stats.totalPracticeSessions} immediate delay={700} /></b><span>sessions</span></div>
          <div><b><CountUp value={Math.floor(vm.stats.totalPracticeSeconds / 60)} immediate delay={780} /></b><span>minutes practised</span></div>
          <div><b><CountUp value={vm.daily.practiceSessions} immediate delay={860} /></b><span>today</span></div>
        </div>
      </div>
    )
  }

  /* ── Summary ── */
  if (phase === 'done') {
    return (
      <div className="ps-intro">
        <div className="ps-intro-icon ps-done" ref={doneRef}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
          </svg>
        </div>
        <SplitText as="h2" className="ps-title" immediate delay={200}>Session complete</SplitText>
        <p className="ps-sub"><CountUp value={correct} immediate delay={400} duration={600} /> of {deck.length} correct</p>

        <div className="ps-rewards">
          <span style={{ '--i': 0 }}><BoltIcon size={17} /> +<CountUp value={earned.xp} immediate delay={600} /> XP</span>
          {earned.gems > 0 && <span style={{ '--i': 1 }}><GemIcon size={17} /> +<CountUp value={earned.gems} immediate delay={700} /></span>}
          <span style={{ '--i': 2 }}><FlameIcon size={17} dim={vm.streak === 0} /> {vm.streak}-day streak</span>
        </div>

        <button className="btn btn-primary btn-lg ps-start fx-shine" onClick={start}>Practice again</button>
      </div>
    )
  }

  /* ── Running ── */
  return (
    <div className="ps-runner">
      <div className="ps-runner-head">
        <span className="ps-runner-label"><HeartIcon size={13} /> Practice · no hearts at risk</span>
        <span className="ps-runner-count"><RollingNumber value={idx + 1} /> / {deck.length}</span>
      </div>
      <div className="ps-runner-track">
        <div key={idx} className={`ps-runner-fill${idx ? ' fx-fill-shine' : ''}`} style={{ width: `${(idx / deck.length) * 100}%` }} />
      </div>

      <div className="ps-runner-body" ref={bodyRef}>
        <div className="lm-step" key={idx}>
          <StepBody
            step={step}
            phase={stepPhase}
            filled={filled}
            selected={selected}
            draggedChip={draggedChip}
            onChipClick={(chip) => placeChip(chip)}
            onBlankClick={(i) => {
              if (stepPhase !== 'answering') return
              const arr = [...filled]; arr[i] = null; setFilled(arr)
            }}
            onSelect={select}
            onDropChip={(i) => {
              if (!draggedChip) return
              const arr = [...filled]; arr[i] = draggedChip; setFilled(arr); setDraggedChip(null)
            }}
            onDragChip={setDraggedChip}
          />
        </div>
      </div>

      <span className="pg-sr-only" role="status" aria-live="polite">
        {stepPhase === 'correct' && 'Correct.'}
        {stepPhase === 'wrong' && `Not quite. The answer is ${correctLabel(step)}. No heart lost.`}
      </span>

      {stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral ps-action" key="a">
          <span className="lm-key-hint" aria-hidden="true"><kbd>Enter</kbd> to check</span>
          <button className="btn btn-primary btn-lg lm-btn-check" disabled={!canCheckStep(step, { filled, selected })} onClick={check}>
            Check
          </button>
        </div>
      )}
      {stepPhase === 'correct' && (
        <div className="lm-action lm-action--correct ps-action" key="c">
          <div className="lm-feedback">
            <span className="lm-fb-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" /></svg>
            </span>
            <div className="lm-fb-title">Correct</div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--correct" onClick={next}>Continue</button>
        </div>
      )}
      {stepPhase === 'wrong' && (
        <div className="lm-action lm-action--wrong ps-action" key="w">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--wrong">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </span>
            <div>
              <div className="lm-fb-title lm-fb-title--wrong">Not quite — no heart lost</div>
              <div className="lm-fb-correct">Answer: <strong>{correctLabel(step)}</strong></div>
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--wrong" onClick={next}>Continue</button>
        </div>
      )}
    </div>
  )
}
