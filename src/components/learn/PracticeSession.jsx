/* ═══════════════════════════════════════════════════════════════════════════
   PracticeSession.jsx — FREE REVIEW MODE
   ---------------------------------------------------------------------------
   The answer to "what do I do with zero hearts?". Practice never costs a
   heart, still awards XP, still counts as a qualifying activity for the
   streak, and feeds the SPEND_TIME / COMPLETE_PRACTICE quests with genuinely
   measured seconds.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { buildPracticeDeck } from '../../data/lessonContent'
import { XP } from '../../config/progressionConfig'
import { Icon, HeartIcon, GemIcon, FlameIcon } from '../progression/Icons'
import StepBody, { correctLabel, isAnswerCorrect, canCheckStep } from './StepRenderer'

const DECK_SIZE = 5

export default function PracticeSession() {
  const { vm, actions } = useProgression()
  const [phase, setPhase] = useState('intro')   // intro | running | done
  const [deck, setDeck] = useState([])
  const [idx, setIdx] = useState(0)
  const [stepPhase, setStepPhase] = useState('answering')
  const [filled, setFilled] = useState([])
  const [selected, setSelected] = useState(null)
  const [draggedChip, setDraggedChip] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [earned, setEarned] = useState({ xp: 0, gems: 0 })

  const startedAt = useRef(null)
  const committed = useRef(false)

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
    startedAt.current = Date.now()
    setPhase('running')
  }

  function check() {
    const ok = isAnswerCorrect(step, { filled, selected })
    if (ok) setCorrect((c) => c + 1)
    setStepPhase(ok ? 'correct' : 'wrong')
  }

  function next() {
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
    const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
    const events = actions.completePractice({ seconds, correct, total: deck.length })
    setEarned({
      xp: events.filter((e) => e.type === 'XP_AWARDED').reduce((s, e) => s + e.amount, 0),
      gems: events.filter((e) => e.type === 'GEMS_AWARDED').reduce((s, e) => s + e.amount, 0),
    })
    setPhase('done')
  }

  /* ── Intro ── */
  if (phase === 'intro') {
    return (
      <div className="ps-intro">
        <div className="ps-intro-icon"><Icon name="target" size={30} strokeWidth={1.8} /></div>
        <h2 className="ps-title">Practice</h2>
        <p className="ps-sub">
          A quick review drawn from everything you’ve covered so far.
          {completedIds.length === 0 && ' Starting with the fundamentals until you finish your first lesson.'}
        </p>

        <ul className="ps-facts">
          <li><HeartIcon size={15} /> Never costs a heart</li>
          <li><Icon name="bolt" size={15} /> +{XP.PRACTICE} XP per session</li>
          <li><FlameIcon size={15} /> Counts toward your streak</li>
          <li><Icon name="clock" size={15} /> {DECK_SIZE} questions, about 3 minutes</li>
        </ul>

        <button className="ps-start" onClick={start}>Start review session</button>

        <div className="ps-stats">
          <div><b>{vm.stats.totalPracticeSessions}</b><span>sessions</span></div>
          <div><b>{Math.floor(vm.stats.totalPracticeSeconds / 60)}</b><span>minutes practised</span></div>
          <div><b>{vm.daily.practiceSessions}</b><span>today</span></div>
        </div>
      </div>
    )
  }

  /* ── Summary ── */
  if (phase === 'done') {
    return (
      <div className="ps-intro">
        <div className="ps-intro-icon ps-done"><Icon name="check-circle" size={30} strokeWidth={1.8} /></div>
        <h2 className="ps-title">Session complete</h2>
        <p className="ps-sub">{correct} of {deck.length} correct</p>

        <div className="ps-rewards">
          <span><Icon name="bolt" size={16} /> +{earned.xp} XP</span>
          {earned.gems > 0 && <span><GemIcon size={16} /> +{earned.gems}</span>}
          <span><FlameIcon size={16} dim={vm.streak === 0} /> {vm.streak}-day streak</span>
        </div>

        <button className="ps-start" onClick={start}>Practice again</button>
      </div>
    )
  }

  /* ── Running ── */
  return (
    <div className="ps-runner">
      <div className="ps-runner-head">
        <span className="ps-runner-label">Practice · no hearts at risk</span>
        <span className="ps-runner-count">{idx + 1} / {deck.length}</span>
      </div>
      <div className="ps-runner-track">
        <div className="ps-runner-fill" style={{ width: `${(idx / deck.length) * 100}%` }} />
      </div>

      <div className="ps-runner-body">
        <StepBody
          step={step}
          phase={stepPhase}
          filled={filled}
          selected={selected}
          draggedChip={draggedChip}
          onChipClick={(chip) => {
            if (stepPhase !== 'answering') return
            const arr = [...filled]
            for (let i = 0; i < step.answers.length; i++) { if (!arr[i]) { arr[i] = chip; break } }
            setFilled(arr)
          }}
          onBlankClick={(i) => {
            if (stepPhase !== 'answering') return
            const arr = [...filled]; arr[i] = null; setFilled(arr)
          }}
          onSelect={setSelected}
          onDropChip={(i) => {
            if (!draggedChip) return
            const arr = [...filled]; arr[i] = draggedChip; setFilled(arr); setDraggedChip(null)
          }}
          onDragChip={setDraggedChip}
        />
      </div>

      {stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral ps-action">
          <button className="lm-btn-check" disabled={!canCheckStep(step, { filled, selected })} onClick={check}>
            Check
          </button>
        </div>
      )}
      {stepPhase === 'correct' && (
        <div className="lm-action lm-action--correct ps-action">
          <div className="lm-feedback"><span className="lm-fb-icon">✓</span><div className="lm-fb-title">Correct</div></div>
          <button className="lm-btn-continue lm-btn-continue--correct" onClick={next}>Continue</button>
        </div>
      )}
      {stepPhase === 'wrong' && (
        <div className="lm-action lm-action--wrong ps-action">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--wrong">✗</span>
            <div>
              <div className="lm-fb-title lm-fb-title--wrong">Not quite</div>
              <div className="lm-fb-correct">Answer: <strong>{correctLabel(step)}</strong></div>
            </div>
          </div>
          <button className="lm-btn-continue lm-btn-continue--wrong" onClick={next}>Continue</button>
        </div>
      )}
    </div>
  )
}
