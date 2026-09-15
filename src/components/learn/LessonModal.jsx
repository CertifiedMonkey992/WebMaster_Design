/* ═══════════════════════════════════════════════════════════════════════════
   LessonModal.jsx — THE GRADED LESSON
   ---------------------------------------------------------------------------
   Hearts, gems, XP and the streak are the REAL progression state, and every
   answer is reported to the central engine.

     wrong answer   → progression.recordAnswer → a real heart is spent
     correct answer → progression.recordAnswer → real XP (budgeted per lesson)
     lesson finished→ progression.completeLesson → everything updates at once

   Completion is dispatched exactly once per session (`committedRef`).

   Revision 2 — the lesson answers you:
     · each step slides in from the right; the tab underline slides to the
       new tab; the progress bar settles with a shine and says "3 / 12"
     · the overlay's own counters are flight targets: XP from a correct
       answer flies into the bolt, a lost heart CRACKS in the heart counter
     · correct → the option stamps a check and throws moss shards; wrong →
       the option shakes and the right one is pointed out
     · the feedback bar rises from the bottom with its verdict
     · keyboard: 1–9 pick an option, Enter checks and continues
     · completion: the stamp slams down with a ring, the rewards count up in
       sequence, the perfect badge turns over
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './LessonModal.css'

import { useProgression } from '../../state/ProgressionContext'
import { getLessonContent, countSteps } from '../../data/lessonContent'
import { getLessonById } from '../../data/learnData'
import { XP, HEARTS } from '../../config/progressionConfig'
import { HeartIcon, GemIcon, FlameIcon, BoltIcon, Icon } from '../progression/Icons'
import { LiveHeart, LiveGem, LiveFlame } from '../progression/LiveIcons'
import { formatClock } from '../../utils/dateUtils'
import StepBody, { correctLabel, isAnswerCorrect, canCheckStep } from './StepRenderer'
import { getLessonIcon } from './LessonIcons'
import SplitText from '../../motion/SplitText'
import CountUp from '../../motion/CountUp'
import { DUR, LAG } from '../../motion/timing'
import RollingNumber from '../../motion/RollingNumber'
import { useFlightTarget, useLandedValue } from '../../motion/flight'
import { burst, ring, shake } from '../../motion/burst'

/* When each reward tile has landed and its figure should start counting:
   the tile's CSS delay (470ms + i × --lag-finish) plus most of its rise. */
const REWARD_AT = (i) => 470 + i * LAG.finish + DUR.modal * 0.6

function CloseButton({ onClick, className = '' }) {
  return (
    <button className={`lm-close ${className}`.trim()} onClick={onClick} aria-label="Close lesson">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
}

export default function LessonModal({ lessonId, onClose }) {
  const { state, vm, actions } = useProgression()

  const meta = getLessonById(lessonId)
  const lesson = getLessonContent(lessonId)
  const totalSteps = useMemo(() => countSteps(lesson), [lesson])
  const maxAnswerXP = totalSteps * XP.CORRECT_ANSWER

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
  const [leaving, setLeaving] = useState(false)

  const startedAtRef = useRef(null)
  const committedRef = useRef(false)
  const earnedRef = useRef({ xp: 0, gems: 0 })
  const bodyRef = useRef(null)
  const tabsRef = useRef(null)
  const stampRef = useRef(null)
  const startRef = useRef(null)
  const primaryRef = useRef(null)

  /* The overlay's own counters: flights land here while a lesson covers the
     top bar. */
  const heartsTarget = useFlightTarget('hearts')
  const gemsTarget = useFlightTarget('gems')
  const streakTarget = useFlightTarget('streak')
  const xpTarget = useFlightTarget('xp')
  const hearts = useLandedValue('hearts', vm.hearts)
  const gems = useLandedValue('gems', vm.gems)
  const streak = useLandedValue('streak', vm.streak)
  const xp = useLandedValue('xp', vm.xp)

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

  const requestClose = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onClose, 240)
  }, [leaving, onClose])

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
    setSessionXP(earnedRef.current.xp)
    setSessionGems(earnedRef.current.gems)
  }

  function advance() {
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
    if (!canCheckStep(currentStep, { filled, selected })) return
    const ok = isAnswerCorrect(currentStep, { filled, selected })

    tally(actions.recordAnswer({ lessonId, correct: ok, maxAnswerXP }))

    if (ok) {
      setCorrectCount((c) => c + 1)
      setStepPhase('correct')
    } else {
      setPerfect(false)
      setStepPhase('wrong')
    }
  }

  /* React to the verdict once it has painted. */
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || screen !== 'step') return
    if (stepPhase === 'correct') {
      const target = body.querySelector('.lm-opt--correct') || body.querySelector('.lm-sentence')
      ring(target, { color: '--moss', size: 120 })
      burst(target, { palette: 'moss', count: 14, spread: 80, gravity: 20 })
    }
    if (stepPhase === 'wrong') {
      const wrong = body.querySelector('.lm-opt--wrong') || body.querySelector('.lm-sentence')
      shake(wrong, { distance: 7 })
    }
  }, [stepPhase, screen])

  const chipClick = useCallback((chip, fromEl) => {
    if (stepPhase !== 'answering') return
    const arr = [...filled]
    let slot = -1
    for (let i = 0; i < currentStep.answers.length; i++) { if (!arr[i]) { arr[i] = chip; slot = i; break } }
    if (slot < 0) return
    setFilled(arr)
    /* Fly a copy of the chip into its blank. */
    const body = bodyRef.current
    if (fromEl && body) {
      requestAnimationFrame(() => {
        const blank = body.querySelector(`[data-blank="${slot}"]`)
        if (!blank) return
        const a = fromEl.getBoundingClientRect()
        const b = blank.getBoundingClientRect()
        blank.animate(
          [
            { transform: `translate(${a.left - b.left + (a.width - b.width) / 2}px, ${a.top - b.top}px) scale(0.9)`, opacity: 0.4 },
            { transform: 'translate(0, -6px) scale(1.08)', opacity: 1, offset: 0.7 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 460, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        )
      })
    }
  }, [stepPhase, filled, currentStep])

  function blankClick(idx) {
    if (stepPhase !== 'answering') return
    const arr = [...filled]; arr[idx] = null; setFilled(arr)
  }

  function dropChip(idx) {
    if (!draggedChip) return
    const arr = [...filled]; arr[idx] = draggedChip; setFilled(arr); setDraggedChip(null)
  }

  /* Keyboard: numbers choose, Enter checks / continues. */
  useEffect(() => {
    if (screen !== 'step' || leaving) return undefined
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return
      if (e.key === 'Escape') { requestClose(); return }
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.matches('button') && !e.target.matches('.lm-btn-check, .lm-btn-continue')) return
        e.preventDefault()
        if (stepPhase === 'answering') check()
        else advance()
        return
      }
      if (stepPhase !== 'answering' || !currentStep) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1) return
      if (currentStep.type === 'binary' && currentStep.options[n - 1]) setSelected(currentStep.options[n - 1].value)
      if (currentStep.type === 'mcq' && currentStep.options[n - 1]) setSelected(currentStep.options[n - 1].id)
      if (currentStep.type === 'fill-blank') {
        const used = filled.filter(Boolean)
        const avail = currentStep.choices.filter((c) => !used.includes(c))
        const chip = currentStep.choices[n - 1]
        if (chip && avail.includes(chip)) chipClick(chip, bodyRef.current?.querySelector(`[data-chip="${n - 1}"]`))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* The tab underline slides to the active tab. */
  useLayoutEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return
    const active = tabs.querySelector('.lm-tab--active')
    if (!active) return
    tabs.style.setProperty('--tab-x', `${active.offsetLeft}px`)
    tabs.style.setProperty('--tab-w', `${active.offsetWidth}px`)
  }, [tabIdx, screen])

  /* Completion: slam the stamp. */
  useEffect(() => {
    if (screen !== 'complete') return undefined
    const t = window.setTimeout(() => {
      ring(stampRef.current, { color: '--moss', size: 170, duration: 800 })
      burst(stampRef.current, { palette: 'reward', count: 26, spread: 150, gravity: 60, duration: 1000 })
    }, 260)
    return () => clearTimeout(t)
  }, [screen])

  useEffect(() => {
    if (screen !== 'welcome' || leaving) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose()
      if (e.key !== 'Enter' || blocked) return
      const onOtherButton = e.target instanceof HTMLButtonElement && e.target !== startRef.current
      if (onOtherButton) return
      /* preventDefault stops the focused Start button's own activation, so
         one Enter starts the lesson exactly once. */
      e.preventDefault()
      start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* Focus moves INTO the lesson with each screen, so Enter and Tab act on
     the lesson rather than on the page hidden behind it. */
  useEffect(() => {
    const t = window.setTimeout(() => (startRef.current || primaryRef.current)?.focus({ preventScroll: true }), 60)
    return () => clearTimeout(t)
  }, [screen, blocked])

  const overlayCls = `lm-overlay${leaving ? ' is-leaving' : ''}`
  const dialogProps = { role: 'dialog', 'aria-modal': true, 'aria-label': meta?.title ?? lesson.title }

  /* ── Out of hearts ── */
  if (screen === 'welcome' && blocked) {
    return (
      <div className={overlayCls} {...dialogProps}>
        <div className="lm-welcome lm-blocked">
          <CloseButton onClick={requestClose} className="lm-close--abs" />
          <div className="lm-blocked-icon">
            <LiveHeart hearts={0} max={vm.maxHearts} recovery={vm.heartRecovery.cycleProgress ?? 0} size={52} />
          </div>
          <SplitText as="h2" className="lm-welcome-title" immediate>You’re out of hearts</SplitText>
          <p className="lm-welcome-sub">
            Graded lessons need at least {HEARTS.COST_TO_START_LESSON} heart. One comes back
            every {HEARTS.RECOVERY_MINUTES} minutes — even while LunX is closed.
          </p>
          <div className="lm-blocked-timer">
            <Icon name="clock" size={15} />
            Next heart in <strong><RollingNumber value={formatClock(vm.heartRecovery.msUntilNext)} /></strong>
          </div>
          <p className="lm-blocked-alt">
            Practice sessions never cost hearts — head to <b>Practice</b> to keep learning
            and keep your streak alive.
          </p>
          <button ref={primaryRef} className="btn btn-primary btn-lg" onClick={requestClose}>Back to lessons</button>
        </div>
      </div>
    )
  }

  /* ── Welcome ── */
  if (screen === 'welcome') {
    return (
      <div className={overlayCls} {...dialogProps}>
        <div className="lm-welcome">
          <CloseButton onClick={requestClose} className="lm-close--abs" />
          <div className="lm-welcome-mark" data-tilt>{getLessonIcon(lessonId)}</div>
          <span className="lm-welcome-eyebrow">{meta?.duration} · {totalSteps} questions</span>
          <SplitText as="h2" className="lm-welcome-title" immediate delay={160} stagger={55}>
            {meta?.title ?? lesson.title}
          </SplitText>
          <p className="lm-welcome-sub">{lesson.subtitle}</p>
          <div className="lm-welcome-bonus">
            {isReplay
              ? 'Review mode · keeps your streak alive'
              : <><BoltIcon size={16} /> Earn up to {XP.LESSON + XP.PERFECT_BONUS + maxAnswerXP} XP</>}
          </div>
          <div className="lm-welcome-meta">
            <span data-tip="Each wrong answer costs one"><HeartIcon size={15} fill={vm.hearts / vm.maxHearts} /> {vm.hearts} hearts</span>
            <span data-tip={isReplay ? 'Rewards are paid once per lesson' : 'Finish without losing a heart'}><GemIcon size={15} /> {isReplay ? 'Already earned' : `+${lesson.gemReward} on a perfect run`}</span>
            <span data-tip="Finishing counts as today's activity"><FlameIcon size={15} /> Build your streak</span>
          </div>
          {isReplay && (
            <p className="lm-replay-note">
              You’ve already completed this lesson, so it won’t pay out again — but the
              time still counts toward practice quests and your streak.
            </p>
          )}
          <button ref={startRef} className="btn btn-next btn-lg lm-start-btn fx-shine" onClick={start} data-magnetic="8">
            {isReplay ? 'Review lesson' : 'Start lesson'}
            <svg className="btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <span className="lm-key-hint" aria-hidden="true"><kbd>Enter</kbd> to start</span>
        </div>
      </div>
    )
  }

  /* ── Complete ── */
  if (screen === 'complete') {
    return (
      <div className={overlayCls} {...dialogProps}>
        <div className="lm-complete">
          <CloseButton onClick={requestClose} className="lm-close--abs" />
          <div className="lm-stamp" ref={stampRef} aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
            </svg>
          </div>
          <SplitText as="h2" className="lm-complete-title" immediate delay={260} stagger={45}>
            {isReplay ? 'Review complete' : 'Lesson complete'}
          </SplitText>
          {perfect && <div className="lm-perfect-badge"><Icon name="star" size={14} strokeWidth={2.4} /> Perfect run</div>}
          <div className="lm-complete-rewards">
            <div className="lm-reward" style={{ '--i': 0 }}>
              <span className="lm-reward-icon lm-reward-icon--gem"><GemIcon size={26} /></span>
              <span className="lm-reward-val"><CountUp prefix="+" value={sessionGems} immediate delay={REWARD_AT(0)} duration={DUR.settle} /></span>
              <span className="lm-reward-lbl">Gems</span>
            </div>
            <div className="lm-reward" style={{ '--i': 1 }}>
              <span className="lm-reward-icon lm-reward-icon--xp"><BoltIcon size={26} /></span>
              <span className="lm-reward-val"><CountUp prefix="+" value={sessionXP} immediate delay={REWARD_AT(1)} duration={DUR.settle} /></span>
              <span className="lm-reward-lbl">XP</span>
            </div>
            <div className="lm-reward" style={{ '--i': 2 }}>
              <span className="lm-reward-icon lm-reward-icon--flame"><LiveFlame streak={vm.streak} activeToday size={26} showShield={false} /></span>
              <span className="lm-reward-val"><CountUp value={vm.streak} from={Math.max(0, vm.streak - 1)} immediate delay={REWARD_AT(2)} duration={DUR.settle} /></span>
              <span className="lm-reward-lbl">Day streak</span>
            </div>
          </div>
          <div className="lm-complete-score">
            {correctCount} of {totalSteps} correct · Level {vm.level} · {vm.levelProgress.xpUntilNextLevel} XP to next
          </div>
          <button ref={primaryRef} className="btn btn-primary btn-lg lm-done-btn fx-shine" onClick={requestClose} data-magnetic="8">Done</button>
        </div>
      </div>
    )
  }

  /* ── Step runner ── */
  const stepKey = `${tabIdx}-${stepIdx}`

  return (
    <div className={overlayCls} {...dialogProps}>
      <div className="lm-topbar">
        <CloseButton onClick={requestClose} />
        <div className="lm-progress-wrap">
          <div className="lm-progress-bar" data-tip={`${doneSteps} of ${totalSteps} questions done`} data-tip-side="bottom">
            <div key={doneSteps} className={`lm-progress-fill${doneSteps ? ' fx-fill-shine' : ''}`} style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="lm-progress-count tnum"><RollingNumber value={Math.min(totalSteps, doneSteps + 1)} /> / {totalSteps}</span>
        </div>
        <div className="lm-currency-row">
          <span ref={xpTarget} className="lm-cur lm-cur--xp" data-tip="Total XP" data-tip-side="bottom">
            <BoltIcon size={17} /><RollingNumber value={xp} />
          </span>
          <span ref={heartsTarget} className={`lm-cur lm-cur--heart${hearts === 0 ? ' lm-cur--empty' : ''}`} data-tip={`${hearts} of ${vm.maxHearts} hearts`} data-tip-side="bottom">
            <LiveHeart hearts={hearts} max={vm.maxHearts} size={18} /><RollingNumber value={hearts} />
          </span>
          <span ref={gemsTarget} className="lm-cur lm-cur--gem" data-tip="Gems" data-tip-side="bottom">
            <LiveGem gems={gems} size={18} /><RollingNumber value={gems} />
          </span>
          <span ref={streakTarget} className="lm-cur lm-cur--flame fx-flare-host" data-tip="Day streak" data-tip-side="bottom">
            <LiveFlame streak={streak} activeToday={vm.activeToday} size={18} showShield={false} /><RollingNumber value={streak} />
          </span>
        </div>
      </div>

      <div className="lm-tabs" ref={tabsRef}>
        {lesson.tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`lm-tab${i === tabIdx ? ' lm-tab--active' : ''}${!unlockedTabs.includes(i) ? ' lm-tab--locked' : ''}`}
            disabled={!unlockedTabs.includes(i)}
            onClick={() => { if (unlockedTabs.includes(i)) { setTabIdx(i); setStepIdx(0); resetStep() } }}
            data-tip={!unlockedTabs.includes(i) ? 'Finish the part before to open this' : undefined}
          >
            {!unlockedTabs.includes(i) && <Icon name="lock" size={11} strokeWidth={2.6} />}
            {tab.label}
            {completedTabs.includes(i) && (
              <span className="lm-tab-done is-drawing"><Icon name="check" size={11} strokeWidth={3.2} /></span>
            )}
          </button>
        ))}
        <span className="lm-tab-ink" aria-hidden="true" />
      </div>

      <div className="lm-step-dots">
        {currentTab.steps.map((_, i) => (
          <span key={i} className={`lm-dot${i < stepIdx ? ' lm-dot--done' : i === stepIdx ? ' lm-dot--active' : ''}`} />
        ))}
      </div>

      <div className="lm-body" ref={bodyRef}>
        <div className="lm-step" key={stepKey}>
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
      </div>

      {stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral" key="answering">
          <span className="lm-key-hint" aria-hidden="true">
            {currentStep?.type === 'fill-blank' ? <>Press <kbd>1</kbd>–<kbd>{currentStep.choices.length}</kbd> to place a word</> : <>Press <kbd>1</kbd>–<kbd>{currentStep?.options?.length ?? 2}</kbd> to choose</>}
            {' · '}<kbd>Enter</kbd> to check
          </span>
          <button
            className={`btn btn-primary btn-lg lm-btn-check${canCheckStep(currentStep, { filled, selected }) ? ' is-ready' : ''}`}
            disabled={!canCheckStep(currentStep, { filled, selected })}
            onClick={check}
          >
            Check
          </button>
        </div>
      )}

      {stepPhase === 'correct' && (
        <div className="lm-action lm-action--correct" key="correct">
          <div className="lm-feedback">
            <span className="lm-fb-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
              </svg>
            </span>
            <div>
              <div className="lm-fb-title">Nice work!</div>
              <div className="lm-fb-correct">That’s right.</div>
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--correct" onClick={advance}>
            Continue
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      )}

      {stepPhase === 'wrong' && (
        <div className="lm-action lm-action--wrong" key="wrong">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--wrong">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </span>
            <div>
              <div className="lm-fb-title lm-fb-title--wrong">Not this time — one heart spent</div>
              <div className="lm-fb-correct">Answer: <strong>{correctLabel(currentStep)}</strong></div>
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--wrong" onClick={advance}>
            Continue
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
