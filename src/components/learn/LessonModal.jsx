/* ═══════════════════════════════════════════════════════════════════════════
   LessonModal.jsx — THE GRADED LESSON
   ---------------------------------------------------------------------------
   The lesson UI is unchanged. What changed is where the numbers come from:
   hearts, gems, XP and the streak in the top bar are the REAL progression
   state, and every answer is reported to the central engine.

     wrong answer   → progression.recordAnswer → a real heart is spent
     correct answer → progression.recordAnswer → real XP (budgeted per lesson)
     lesson finished→ progression.completeLesson → XP, gems, streak, quests,
                      achievements, level and statistics all update at once

   Completion is dispatched exactly once per session (`committedRef`), so a
   double click, a re-render or a StrictMode remount cannot award it twice.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import './LessonModal.css'

import { useProgression } from '../../state/ProgressionContext'
import { getLessonContent, countSteps } from '../../data/lessonContent'
import { getLessonById } from '../../data/learnData'
import { XP, HEARTS } from '../../config/progressionConfig'
import { HeartIcon, GemIcon, FlameIcon, Icon } from '../progression/Icons'
import { formatClock } from '../../utils/dateUtils'
import StepBody, { correctLabel, isAnswerCorrect, canCheckStep } from './StepRenderer'

export default function LessonModal({ lessonId, onClose }) {
  const { state, vm, actions } = useProgression()

  const meta = getLessonById(lessonId)
  const lesson = getLessonContent(lessonId)
  const totalSteps = useMemo(() => countSteps(lesson), [lesson])
  /* The XP budget a lesson can pay out for correct answers. Spent once ever —
     replays draw on an already-empty budget, so review cannot farm XP. */
  const maxAnswerXP = totalSteps * XP.CORRECT_ANSWER

  /* Captured ONCE when the modal opens. Deriving it live would flip to true
     the instant the lesson is recorded, mislabelling a first completion as a
     review on its own summary screen. */
  const [isReplay] = useState(() => Boolean(state.lessons[lessonId]))

  const [screen, setScreen] = useState('welcome')
  const [tabIdx, setTabIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [stepPhase, setStepPhase] = useState('answering')

  const [filled, setFilled] = useState([])
  const [selected, setSelected] = useState(null)
  const [draggedChip, setDraggedChip] = useState(null)
  const [perfect, setPerfect] = useState(true)
  const [unlockedTabs, setUnlockedTabs] = useState([0])
  const [completedTabs, setCompletedTabs] = useState([])
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionGems, setSessionGems] = useState(0)

  /* Real time spent in the lesson — feeds practice-time quests honestly. */
  const startedAtRef = useRef(null)
  /* Idempotency guard: completion is committed at most once per mount. */
  const committedRef = useRef(false)
  /* Running total of what the engine actually granted this session, tallied
     from its own events so the summary can never overstate the reward. */
  const earnedRef = useRef({ xp: 0, gems: 0 })

  function tally(events = []) {
    for (const event of events) {
      if (event.type === 'XP_AWARDED') earnedRef.current.xp += event.amount
      if (event.type === 'GEMS_AWARDED') earnedRef.current.gems += event.amount
    }
  }

  const currentTab = lesson.tabs[tabIdx]
  const currentStep = currentTab?.steps[stepIdx]
  const doneSteps = lesson.tabs.slice(0, tabIdx).reduce((s, t) => s + t.steps.length, 0) + stepIdx
  const progress = screen === 'complete' ? 1 : screen === 'welcome' ? 0 : doneSteps / totalSteps

  const blocked = !vm.canStartLesson

  /* Time spent before abandoning still counts as learning time. */
  useEffect(() => () => {
    if (startedAtRef.current && !committedRef.current) {
      const seconds = Math.round((Date.now() - startedAtRef.current) / 1000)
      if (seconds > 20) actions.addPracticeTime(Math.min(seconds, 1800))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetStep() { setFilled([]); setSelected(null); setStepPhase('answering') }

  function start() {
    if (blocked) return
    startedAtRef.current = Date.now()
    setScreen('step')
  }

  function commitCompletion() {
    if (committedRef.current) return
    committedRef.current = true
    const seconds = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0
    tally(actions.completeLesson({
      lessonId,
      perfect,
      seconds,
      accuracy: totalSteps ? correctCount / totalSteps : 0,
    }))
    /* Mirror what the engine actually granted, rather than guessing at it. */
    setSessionXP(earnedRef.current.xp)
    setSessionGems(earnedRef.current.gems)
  }

  function advance() {
    /* Ran out of hearts mid-lesson — the run ends here. Time spent is still
       credited on unmount, and the blocked screen explains what to do next. */
    if (vm.hearts <= 0) {
      setScreen('welcome')
      return
    }

    const tab = lesson.tabs[tabIdx]
    if (stepIdx + 1 < tab.steps.length) {
      setStepIdx((s) => s + 1)
      resetStep()
      return
    }

    setCompletedTabs((p) => (p.includes(tabIdx) ? p : [...p, tabIdx]))

    if (tabIdx + 1 < lesson.tabs.length) {
      const next = tabIdx + 1
      setTabIdx(next)
      setStepIdx(0)
      setUnlockedTabs((p) => (p.includes(next) ? p : [...p, next]))
      resetStep()
    } else {
      commitCompletion()
      setScreen('complete')
    }
  }

  function check() {
    const ok = isAnswerCorrect(currentStep, { filled, selected })

    /* Every answer goes through the central engine — no local XP or hearts. */
    tally(actions.recordAnswer({ lessonId, correct: ok, maxAnswerXP }))

    if (ok) {
      setCorrectCount((c) => c + 1)
      setStepPhase('correct')
    } else {
      setPerfect(false)
      setStepPhase('wrong')
    }
  }

  function chipClick(chip) {
    if (stepPhase !== 'answering') return
    const arr = [...filled]
    for (let i = 0; i < currentStep.answers.length; i++) { if (!arr[i]) { arr[i] = chip; break } }
    setFilled(arr)
  }

  function blankClick(idx) {
    if (stepPhase !== 'answering') return
    const arr = [...filled]; arr[idx] = null; setFilled(arr)
  }

  function dropChip(idx) {
    if (!draggedChip) return
    const arr = [...filled]; arr[idx] = draggedChip; setFilled(arr); setDraggedChip(null)
  }

  /* ── Out of hearts ── */
  if (screen === 'welcome' && blocked) {
    return (
      <div className="lm-overlay">
        <div className="lm-welcome lm-blocked">
          <button className="lm-close lm-close--abs" onClick={onClose} aria-label="Close">✕</button>
          <div className="lm-blocked-icon"><HeartIcon size={44} empty /></div>
          <h2 className="lm-welcome-title">You’re out of hearts</h2>
          <p className="lm-welcome-sub">
            Graded lessons need at least {HEARTS.COST_TO_START_LESSON} heart. One comes back
            every {HEARTS.RECOVERY_MINUTES} minutes — even while LunX is closed.
          </p>
          <div className="lm-blocked-timer">
            <Icon name="clock" size={15} />
            Next heart in <strong>{formatClock(vm.heartRecovery.msUntilNext)}</strong>
          </div>
          <p className="lm-blocked-alt">
            Practice sessions never cost hearts — head to <b>Practice</b> to keep learning
            and keep your streak alive.
          </p>
          <button className="lm-start-btn" onClick={onClose}>Back to lessons</button>
        </div>
      </div>
    )
  }

  /* ── Welcome ── */
  if (screen === 'welcome') {
    return (
      <div className="lm-overlay">
        <div className="lm-welcome">
          <button className="lm-close lm-close--abs" onClick={onClose} aria-label="Close">✕</button>
          <div className="lm-welcome-emoji">🧠</div>
          <h2 className="lm-welcome-title">{meta?.title ?? lesson.title}</h2>
          <p className="lm-welcome-sub">{lesson.subtitle}</p>
          <div className="lm-welcome-bonus">
            {isReplay
              ? 'Review mode · keeps your streak alive'
              : `Earn up to ${XP.LESSON + XP.PERFECT_BONUS + maxAnswerXP} XP`}
          </div>
          <div className="lm-welcome-meta">
            <span><HeartIcon size={14} /> {vm.hearts} hearts</span>
            <span><GemIcon size={14} /> {isReplay ? 'Already earned' : `+${lesson.gemReward} on a perfect run`}</span>
            <span><FlameIcon size={14} /> Build your streak</span>
          </div>
          {isReplay && (
            <p className="lm-replay-note">
              You’ve already completed this lesson, so it won’t pay out again — but the
              time still counts toward practice quests and your streak.
            </p>
          )}
          <button className="lm-start-btn" onClick={start}>
            {isReplay ? 'Review Lesson' : 'Start Lesson'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Complete ── */
  if (screen === 'complete') {
    return (
      <div className="lm-overlay">
        <div className="lm-complete">
          <button className="lm-close lm-close--abs" onClick={onClose} aria-label="Close">✕</button>
          <div className="lm-complete-trophy">🏆</div>
          <h2 className="lm-complete-title">{isReplay ? 'Review Complete!' : 'Lesson Complete!'}</h2>
          {perfect && <div className="lm-perfect-badge">🌟 Perfect Run!</div>}
          <div className="lm-complete-rewards">
            <div className="lm-reward">
              <span className="lm-reward-icon"><GemIcon size={22} /></span>
              <span className="lm-reward-val">+{sessionGems}</span>
              <span className="lm-reward-lbl">Gems</span>
            </div>
            <div className="lm-reward">
              <span className="lm-reward-icon"><Icon name="bolt" size={22} strokeWidth={2.2} /></span>
              <span className="lm-reward-val">+{sessionXP}</span>
              <span className="lm-reward-lbl">XP</span>
            </div>
            <div className="lm-reward">
              <span className="lm-reward-icon lm-fire"><FlameIcon size={22} /></span>
              <span className="lm-reward-val">{vm.streak}</span>
              <span className="lm-reward-lbl">Day streak</span>
            </div>
          </div>
          <div className="lm-complete-score">
            {correctCount} of {totalSteps} correct · Level {vm.level} · {vm.levelProgress.xpUntilNextLevel} XP to next
          </div>
          <button className="lm-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    )
  }

  /* ── Step runner ── */
  return (
    <div className="lm-overlay">
      <div className="lm-topbar">
        <button className="lm-close" onClick={onClose} aria-label="Close lesson">✕</button>
        <div className="lm-progress-wrap">
          <div className="lm-progress-bar"><div className="lm-progress-fill" style={{ width: `${progress * 100}%` }} /></div>
        </div>
        <div className="lm-currency-row">
          <span className={`lm-cur${vm.hearts === 0 ? ' lm-cur--empty' : ''}`}>
            <HeartIcon size={16} empty={vm.hearts === 0} />{vm.hearts}
          </span>
          <span className="lm-cur lm-cur--gem"><GemIcon size={16} />{vm.gems}</span>
          <span className="lm-cur lm-cur--flame"><FlameIcon size={16} dim={vm.streak === 0} />{vm.streak}</span>
        </div>
      </div>

      <div className="lm-tabs">
        {lesson.tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`lm-tab${i === tabIdx ? ' lm-tab--active' : ''}${!unlockedTabs.includes(i) ? ' lm-tab--locked' : ''}`}
            disabled={!unlockedTabs.includes(i)}
            onClick={() => { if (unlockedTabs.includes(i)) { setTabIdx(i); setStepIdx(0); resetStep() } }}
          >
            {tab.label}{completedTabs.includes(i) && <span className="lm-tab-done"> ✓</span>}
          </button>
        ))}
      </div>

      <div className="lm-step-dots">
        {currentTab.steps.map((_, i) => (
          <span key={i} className={`lm-dot${i < stepIdx ? ' lm-dot--done' : i === stepIdx ? ' lm-dot--active' : ''}`} />
        ))}
      </div>

      <div className="lm-body">
        <StepBody
          step={currentStep}
          phase={stepPhase}
          filled={filled}
          selected={selected}
          draggedChip={draggedChip}
          onChipClick={chipClick}
          onBlankClick={blankClick}
          onSelect={setSelected}
          onDropChip={dropChip}
          onDragChip={setDraggedChip}
        />
      </div>

      {stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral">
          <button
            className="lm-btn-check"
            disabled={!canCheckStep(currentStep, { filled, selected })}
            onClick={check}
          >
            Check
          </button>
        </div>
      )}

      {stepPhase === 'correct' && (
        <div className="lm-action lm-action--correct">
          <div className="lm-feedback">
            <span className="lm-fb-icon">✓</span>
            <div><div className="lm-fb-title">Nice work!</div></div>
          </div>
          <button className="lm-btn-continue lm-btn-continue--correct" onClick={advance}>Continue</button>
        </div>
      )}

      {stepPhase === 'wrong' && (
        <div className="lm-action lm-action--wrong">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--wrong">✗</span>
            <div>
              <div className="lm-fb-title lm-fb-title--wrong">Incorrect!</div>
              <div className="lm-fb-correct">Answer: <strong>{correctLabel(currentStep)}</strong></div>
            </div>
          </div>
          <button className="lm-btn-continue lm-btn-continue--wrong" onClick={advance}>Continue</button>
        </div>
      )}
    </div>
  )
}
