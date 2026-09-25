/* ═══════════════════════════════════════════════════════════════════════════
   LessonModal.jsx — THE LESSON
   ---------------------------------------------------------------------------
   Hearts, gems, XP and the streak are the REAL progression state, and every
   graded answer is reported to the central engine.

   A lesson is three PARTS (its tabs), each ending at a natural stopping point:

     Part 1  Recall → Predict → Explore     nothing here is graded
     Part 2  Explain → Apply                nothing here is graded
     Part 3  Check → Carry forward          the only part that spends hearts

   The heart rule: a prediction is made BEFORE the explanation, and a wrong
   one is the point of the exercise — so predictions, recalls, simulations
   and applied questions never cost a heart and never pay answer XP. Only a
   step in a part marked `graded` goes through progression.recordAnswer:

     wrong answer   → a real heart is spent, and the item is flagged for
                      spaced review in Practice
     correct answer → real XP (budgeted per item, so replays cannot farm it)
     item finished  → progression.completeLesson → everything updates at once

   Every committed prediction and every reflection is written to the Field
   Journal (progression.saveJournal). Finishing a part saves a resume point
   (progression.savePart), so a lesson reopened tomorrow starts where the
   learner stopped. Completion is dispatched exactly once (`committedRef`).

   Revision 2 motion, unchanged: steps slide in, the tab underline slides,
   the progress bar settles, XP flies to the bolt and a lost heart cracks,
   the verdict bar rises, keyboard 1–9 / Enter, the stamp slams down.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './LessonModal.css'

import { useProgression, useClock } from '../../state/ProgressionContext'
import { getHeartRecoveryTime } from '../../services/currencyService'
import { useLessonContent, countSteps, countGraded, reviewKeyOf } from '../../data/lessonContent'
import { getLessonById, getSectionById, lessonNumber, KIND_LABEL } from '../../data/learnData'
import { XP, HEARTS, CURRENCY } from '../../config/progressionConfig'
import useActiveTime from '../../hooks/useActiveTime'
import useDialog from '../../hooks/useDialog'
import { HeartIcon, GemIcon, FlameIcon, BoltIcon, Icon } from '../progression/Icons'
import { LiveHeart, LiveGem, LiveFlame } from '../progression/LiveIcons'
import { formatClock } from '../../utils/dateUtils'
import StepBody, {
  EMPTY_ANSWER, correctLabel, isAnswerCorrect, canCheckStep, canContinue,
  isCheckStep, isGradable, composeText, CONFIDENCE,
} from './StepRenderer'
import { inline } from './Rich'
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

const Arrow = ({ size = 16 }) => (
  <svg className="btn-arrow" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

function CloseButton({ onClick, className = '' }) {
  return (
    <button className={`lm-close ${className}`.trim()} onClick={onClick} aria-label="Close lesson">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
}

const confidenceLabel = (id) => CONFIDENCE.find((c) => c.id === id)?.label ?? ''

export default function LessonModal({ lessonId, onClose }) {
  const { state, vm, actions } = useProgression()

  const meta = getLessonById(lessonId)
  const section = meta ? getSectionById(meta.sectionId) : null
  const { content: lesson, failed } = useLessonContent(lessonId)
  const totalSteps = useMemo(() => countSteps(lesson), [lesson])
  const gradedTotal = useMemo(() => countGraded(lesson), [lesson])
  const maxAnswerXP = gradedTotal * XP.CORRECT_ANSWER
  const kind = meta?.kind ?? 'lesson'
  const number = lessonNumber(lessonId)

  const [isReplay] = useState(() => Boolean(state.lessons[lessonId]))
  /* A lesson left part-way through resumes at its next part. */
  const [resumeAt] = useState(() => (state.lessons[lessonId] ? 0 : (state.lessonParts?.[lessonId] ?? 0)))

  const [screen, setScreen] = useState('welcome')
  const [tabIdx, setTabIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [stepPhase, setStepPhase] = useState('answering')
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const [draggedChip, setDraggedChip] = useState(null)
  const [unlockedTabs, setUnlockedTabs] = useState([0])
  const [completedTabs, setCompletedTabs] = useState([])
  /* One verdict per step, keyed "tab:step", so a step can never be graded
     or counted twice — and a finished part can be read back with its answers. */
  const [verdicts, setVerdicts] = useState({})
  /* The furthest point reached. Viewing an earlier part never moves it. */
  const [frontier, setFrontier] = useState({ tab: 0, step: 0 })
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionGems, setSessionGems] = useState(0)
  const [unlockedKit, setUnlockedKit] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const time = useActiveTime()
  const committedRef = useRef(false)
  const earnedRef = useRef({ xp: 0, gems: 0 })
  const overlayRef = useRef(null)
  const bodyRef = useRef(null)
  const tabsRef = useRef(null)
  const stampRef = useRef(null)
  const startRef = useRef(null)
  const primaryRef = useRef(null)

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
      if (event.type === 'SECTION_COMPLETE') setUnlockedKit(getSectionById(event.section.id)?.fieldKit?.name ?? null)
    }
  }

  const tabs = lesson?.tabs ?? []
  const currentTab = tabs[tabIdx]
  const currentStep = currentTab?.steps[stepIdx]
  const stepKey = `${tabIdx}:${stepIdx}`
  /* A part behind the frontier is read back, never re-graded. */
  const readOnly = tabIdx < frontier.tab
  const stepGraded = Boolean(currentTab?.graded) && isGradable(currentStep)
  const gradedVerdicts = Object.values(verdicts).filter((v) => v.graded)
  const gradedCorrect = gradedVerdicts.filter((v) => v.ok).length
  const perfect = gradedTotal > 0 && gradedVerdicts.length === gradedTotal && gradedVerdicts.every((v) => v.ok)
  const doneSteps = tabs.slice(0, frontier.tab).reduce((s, t) => s + t.steps.length, 0) + frontier.step
  const progress = screen === 'complete' ? 1 : screen === 'welcome' ? 0 : totalSteps ? doneSteps / totalSteps : 0

  /* Hearts are only needed where hearts can be spent. */
  const needsHearts = gradedTotal > 0
  const blocked = needsHearts && !vm.canStartLesson
  const now = useClock()
  const recovery = getHeartRecoveryTime(state, now)

  const requestClose = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onClose, 240)
  }, [leaving, onClose])

  useDialog(overlayRef, { onClose: requestClose })

  /* On unmount, credit the time of an unfinished lesson. */
  const latest = useRef({ time, actions })
  latest.current = { time, actions }
  useEffect(() => () => {
    const { time: t, actions: a } = latest.current
    if (t.started() && !committedRef.current) {
      const seconds = t.seconds()
      if (seconds > 20) a.addPracticeTime(seconds)
    }
  }, [])

  /* A patch, or a function of the latest answer — so several quick changes
     (sorting five items in a row) never overwrite one another. */
  const update = useCallback((patch) => {
    time.touch()
    setAnswer((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }, [time])

  function resetStep() { setAnswer(EMPTY_ANSWER); setStepPhase('answering') }

  function showStep(tab, step) {
    setTabIdx(tab)
    setStepIdx(step)
    const v = verdicts[`${tab}:${step}`]
    if (v) {
      setAnswer(v.answer)
      setStepPhase(v.phase)
    } else {
      resetStep()
    }
  }

  function start() {
    if (blocked || !lesson) return
    time.start()
    if (resumeAt > 0 && resumeAt < tabs.length) {
      const done = Array.from({ length: resumeAt }, (_, i) => i)
      setCompletedTabs(done)
      setUnlockedTabs([...done, resumeAt])
      setFrontier({ tab: resumeAt, step: 0 })
      setTabIdx(resumeAt)
      setStepIdx(0)
      resetStep()
    }
    setScreen('step')
  }

  function commitCompletion() {
    if (committedRef.current) return
    committedRef.current = true
    const seconds = time.started() ? time.seconds() : 0
    tally(actions.completeLesson({
      lessonId,
      perfect,
      seconds,
      accuracy: gradedTotal ? gradedCorrect / gradedTotal : 1,
    }))
    setSessionXP(earnedRef.current.xp)
    setSessionGems(earnedRef.current.gems)
  }

  /* Save what a Continue step produced before leaving it. */
  function saveContinueStep() {
    const step = currentStep
    if (!step || readOnly) return
    const key = `${currentTab.id}:${step.id}`
    if (step.type === 'reflect' && answer.text.trim()) {
      actions.saveJournal(lessonId, { kind: 'reflection', key, prompt: step.prompt, text: answer.text.trim() })
    }
    if (step.type === 'compose') {
      actions.saveJournal(lessonId, { kind: 'reflection', key, prompt: step.title ?? 'Draft', text: composeText(step, answer) })
    }
    setVerdicts((v) => (v[stepKey] ? v : { ...v, [stepKey]: { ok: true, graded: false, answer, phase: 'answering' } }))
  }

  function advance() {
    time.touch()
    const tab = tabs[tabIdx]

    /* Reading a finished part: step through it, then return to the frontier. */
    if (readOnly) {
      if (stepIdx + 1 < tab.steps.length) showStep(tabIdx, stepIdx + 1)
      else showStep(frontier.tab, frontier.step)
      return
    }

    if (!isCheckStep(currentStep)) saveContinueStep()

    if (tab.graded && needsHearts && vm.hearts <= 0) {
      setScreen('welcome')
      return
    }

    if (stepIdx + 1 < tab.steps.length) {
      setFrontier({ tab: tabIdx, step: stepIdx + 1 })
      setStepIdx((s) => s + 1)
      resetStep()
      return
    }

    setCompletedTabs((p) => (p.includes(tabIdx) ? p : [...p, tabIdx]))

    if (tabIdx + 1 < tabs.length) {
      const next = tabIdx + 1
      if (!isReplay) actions.savePart(lessonId, next)
      setFrontier({ tab: next, step: 0 })
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
    if (readOnly || verdicts[stepKey]) return
    if (!canCheckStep(currentStep, answer)) return
    time.touch()
    const result = isAnswerCorrect(currentStep, answer)
    const ok = result !== false

    if (stepGraded) {
      tally(actions.recordAnswer({
        lessonId,
        correct: ok,
        maxAnswerXP,
        reviewKey: reviewKeyOf(lessonId, currentTab.id, currentStep.id),
      }))
    }

    if (currentStep.type === 'predict') {
      const chosen = currentStep.options.find((o) => o.id === answer.selected)
      actions.saveJournal(lessonId, {
        kind: 'prediction',
        key: `${currentTab.id}:${currentStep.id}`,
        prompt: currentStep.prompt.replace(/\*/g, ''),
        text: (chosen?.text ?? '').replace(/\*/g, ''),
        confidence: answer.confidence,
        ...(result === null ? {} : { correct: result }),
      })
    }

    /* Graded steps speak in moss and berry; everything else is feedback that
       cost nothing — a prediction that missed is shown in ink. */
    const phase = stepGraded
      ? (ok ? 'correct' : 'wrong')
      : currentStep.type === 'predict'
        ? (result === true ? 'correct' : 'reveal')
        : (ok ? 'correct' : 'reveal')

    setVerdicts((v) => ({ ...v, [stepKey]: { ok, graded: stepGraded, answer, phase, result } }))
    setStepPhase(phase)
  }

  /* React to the verdict once it has painted. */
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || screen !== 'step') return
    if (stepPhase === 'correct') {
      const target = body.querySelector('.lm-opt--correct') || body.querySelector('.lm-sentence') || body.querySelector('.st-number-field') || body.querySelector('.st-sort-list')
      ring(target, { color: '--moss', size: 120 })
      if (stepGraded) burst(target, { palette: 'moss', count: 14, spread: 80, gravity: 20 })
    }
    if (stepPhase === 'wrong') {
      const wrong = body.querySelector('.lm-opt--wrong') || body.querySelector('.lm-sentence') || body.querySelector('.st-number-field') || body.querySelector('.st-sort-row.is-wrong')
      shake(wrong, { distance: 7 })
    }
  }, [stepPhase, screen, stepGraded])

  const chipClick = useCallback((chip, fromEl) => {
    if (stepPhase !== 'answering') return
    time.touch()
    const arr = [...answer.filled]
    let slot = -1
    for (let i = 0; i < currentStep.answers.length; i++) { if (!arr[i]) { arr[i] = chip; slot = i; break } }
    if (slot < 0) return
    setAnswer((a) => ({ ...a, filled: arr }))
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
  }, [stepPhase, answer.filled, currentStep, time])

  function blankClick(idx) {
    if (stepPhase !== 'answering') return
    time.touch()
    const arr = [...answer.filled]; arr[idx] = null
    setAnswer((a) => ({ ...a, filled: arr }))
  }

  function dropChip(idx) {
    if (!draggedChip) return
    const arr = [...answer.filled]; arr[idx] = draggedChip
    setAnswer((a) => ({ ...a, filled: arr }))
    setDraggedChip(null)
  }

  const isCheck = isCheckStep(currentStep)
  const continueReady = !isCheck && canContinue(currentStep, answer)
  const checkReady = isCheck && canCheckStep(currentStep, answer)

  /* Keyboard: numbers choose, Enter checks / continues. Only keys aimed at
     the lesson count — typing into a field or a simulation is its own. */
  useEffect(() => {
    if (screen !== 'step' || leaving) return undefined
    const onKey = (e) => {
      if (e.target !== document.body && !overlayRef.current?.contains(e.target)) return
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select')) return
      if (e.target instanceof HTMLElement && e.target.closest('.sim')) return
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.matches('button') && !e.target.matches('.lm-btn-check, .lm-btn-continue')) return
        e.preventDefault()
        if (readOnly || stepPhase !== 'answering') { advance(); return }
        if (isCheck) { if (checkReady) check() } else if (continueReady) advance()
        return
      }
      if (stepPhase !== 'answering' || !currentStep || readOnly) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1) return
      const t = currentStep.type
      if (t === 'binary' && currentStep.options[n - 1]) update({ selected: currentStep.options[n - 1].value })
      if ((t === 'mcq' || t === 'recall' || t === 'predict') && currentStep.options[n - 1]) update({ selected: currentStep.options[n - 1].id })
      if (t === 'fill-blank') {
        const used = answer.filled.filter(Boolean)
        const chip = currentStep.choices[n - 1]
        if (chip && !used.includes(chip)) chipClick(chip, bodyRef.current?.querySelector(`[data-chip="${n - 1}"]`))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useLayoutEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const active = el.querySelector('.lm-tab--active')
    if (!active) return
    el.style.setProperty('--tab-x', `${active.offsetLeft}px`)
    el.style.setProperty('--tab-w', `${active.offsetWidth}px`)
  }, [tabIdx, screen])

  /* A new step starts at the top of the page. */
  useEffect(() => { bodyRef.current?.scrollTo?.({ top: 0 }) }, [stepKey])

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
      if (e.target !== document.body && !overlayRef.current?.contains(e.target)) return
      if (e.key !== 'Enter' || blocked || !lesson) return
      const onOtherButton = e.target instanceof HTMLButtonElement && e.target !== startRef.current
      if (onOtherButton) return
      e.preventDefault()
      start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const t = window.setTimeout(() => (startRef.current || primaryRef.current)?.focus({ preventScroll: true }), 60)
    return () => clearTimeout(t)
  }, [screen, blocked, lesson])

  const overlayCls = `lm-overlay${leaving ? ' is-leaving' : ''}`
  const dialogProps = { ref: overlayRef, role: 'dialog', 'aria-modal': true, 'aria-label': meta?.title ?? 'Lesson' }
  const kindLine = number ? `Lesson ${number}` : KIND_LABEL[kind]

  /* ── Out of hearts ── */
  if (screen === 'welcome' && blocked) {
    return (
      <div className={overlayCls} {...dialogProps}>
        <div className="lm-welcome lm-blocked">
          <CloseButton onClick={requestClose} className="lm-close--abs" />
          <div className="lm-blocked-icon">
            <LiveHeart hearts={0} max={vm.maxHearts} recovery={recovery.cycleProgress ?? 0} size={52} />
          </div>
          <SplitText as="h2" className="lm-welcome-title" immediate>You’re out of hearts</SplitText>
          <p className="lm-welcome-sub">
            The Check at the end of a lesson needs at least {HEARTS.COST_TO_START_LESSON} heart. One comes back
            every {HEARTS.RECOVERY_MINUTES} minutes — even while LunX is closed.
            {vm.lessonParts?.[lessonId] ? ' Your place in this lesson is saved.' : ''}
          </p>
          <div className="lm-blocked-timer">
            <Icon name="clock" size={15} />
            Next heart in <strong><RollingNumber value={formatClock(recovery.msUntilNext)} /></strong>
          </div>
          <p className="lm-blocked-alt">
            Practice never costs hearts — head to <b>Practice</b> to review what you’ve missed and
            keep your streak alive.
          </p>
          <button ref={primaryRef} className="btn btn-primary btn-lg" onClick={requestClose}>Back to the course</button>
        </div>
      </div>
    )
  }

  /* ── Welcome ── */
  if (screen === 'welcome') {
    const parts = tabs.length
    const itemXP = XP.ITEM?.[kind] ?? XP.LESSON
    return (
      <div className={overlayCls} {...dialogProps}>
        <div className="lm-welcome">
          <CloseButton onClick={requestClose} className="lm-close--abs" />
          <div className="lm-welcome-mark" data-tilt>{getLessonIcon(lessonId)}</div>
          <span className="lm-welcome-eyebrow">
            {kindLine}{section ? ` · ${section.role}` : ''} · {meta?.duration}{parts ? ` · ${parts} parts` : ''}
          </span>
          <SplitText as="h2" className="lm-welcome-title" immediate delay={160} stagger={55}>
            {meta?.title ?? lesson?.title ?? 'Lesson'}
          </SplitText>
          <p className="lm-welcome-sub">{lesson?.subtitle ?? meta?.desc}</p>
          {lesson && (
            <div className="lm-welcome-bonus">
              {isReplay
                ? 'Review mode · keeps your streak alive'
                : <><BoltIcon size={16} /> Earn up to {itemXP + (gradedTotal ? XP.PERFECT_BONUS : 0) + maxAnswerXP} XP</>}
            </div>
          )}
          {lesson && (
            <div className="lm-welcome-meta">
              <span data-tip="Predictions and practice never cost a heart">
                <HeartIcon size={15} fill={vm.hearts / vm.maxHearts} /> {gradedTotal ? `Only the ${gradedTotal}-question Check spends hearts` : 'No hearts at stake'}
              </span>
              <span data-tip={isReplay ? 'Rewards are paid once per item' : 'Pass the Check without losing a heart'}>
                <GemIcon size={15} /> {isReplay ? 'Already earned' : gradedTotal ? `+${CURRENCY.PERFECT_LESSON_GEMS} on a perfect Check` : `+${itemXP} XP when finished`}
              </span>
              <span data-tip="Finishing counts as today's activity"><FlameIcon size={15} /> Builds your streak</span>
            </div>
          )}
          {!lesson && !failed && <p className="lm-replay-note" aria-live="polite">Opening the lesson…</p>}
          {failed && <p className="lm-replay-note">This lesson could not be loaded. Check your connection and open it again.</p>}
          {resumeAt > 0 && lesson && (
            <p className="lm-replay-note">You finished {resumeAt} of {parts} parts last time — this picks up at Part {resumeAt + 1}, {tabs[resumeAt]?.label}.</p>
          )}
          {isReplay && (
            <p className="lm-replay-note">
              You’ve already completed this, so it won’t pay out again — but the time still counts
              toward practice quests and your streak.
            </p>
          )}
          <button ref={startRef} className="btn btn-next btn-lg lm-start-btn fx-shine" onClick={start} disabled={!lesson} data-magnetic="8">
            {isReplay ? 'Review' : resumeAt > 0 ? `Resume at Part ${resumeAt + 1}` : kind === 'lesson' ? 'Start lesson' : `Start ${KIND_LABEL[kind].toLowerCase()}`}
            <Arrow size={18} />
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
            {isReplay ? 'Review complete' : `${kindLine} complete`}
          </SplitText>
          {perfect && <div className="lm-perfect-badge"><Icon name="star" size={14} strokeWidth={2.4} /> Perfect Check</div>}
          {lesson?.takeaway && <p className="lm-takeaway">{inline(lesson.takeaway)}</p>}
          {unlockedKit && (
            <p className="lm-kit-unlocked">
              <Icon name="check-circle" size={15} /> Field Kit tool unlocked: <b>{unlockedKit}</b>
            </p>
          )}
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
            {gradedTotal ? `${gradedCorrect} of ${gradedTotal} on the Check · ` : ''}Level {vm.level} · {vm.levelProgress.xpUntilNextLevel} XP to next
          </div>
          <button ref={primaryRef} className="btn btn-primary btn-lg lm-done-btn fx-shine" onClick={requestClose} data-magnetic="8">Done</button>
        </div>
      </div>
    )
  }

  /* ── Step runner ── */
  const v = verdicts[stepKey]
  const why = currentStep?.why
  const predictionText = currentStep?.type === 'predict' && v
    ? `You said “${(currentStep.options.find((o) => o.id === v.answer.selected)?.text ?? '').replace(/\*/g, '')}” — ${confidenceLabel(v.answer.confidence).toLowerCase()}.`
    : null
  const confidentMiss = currentStep?.type === 'predict' && v?.result === false && v.answer.confidence === 'sure'

  return (
    <div className={overlayCls} {...dialogProps}>
      <div className="lm-topbar">
        <CloseButton onClick={requestClose} />
        <div className="lm-progress-wrap">
          <div className="lm-progress-bar" data-tip={`${doneSteps} of ${totalSteps} steps done`} data-tip-side="bottom">
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
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`lm-tab${i === tabIdx ? ' lm-tab--active' : ''}${!unlockedTabs.includes(i) ? ' lm-tab--locked' : ''}`}
            disabled={!unlockedTabs.includes(i)}
            onClick={() => {
              if (!unlockedTabs.includes(i) || i === tabIdx) return
              if (i === frontier.tab) showStep(frontier.tab, frontier.step)
              else showStep(i, 0)
            }}
            data-tip={!unlockedTabs.includes(i) ? 'Finish the part before to open this' : i < frontier.tab ? 'Finished — read back, not re-graded' : tab.graded ? 'This part is graded: a wrong answer costs a heart' : 'Nothing in this part costs a heart'}
          >
            {!unlockedTabs.includes(i) && <Icon name="lock" size={11} strokeWidth={2.6} />}
            <span className="lm-tab-n tnum">{i + 1}</span>
            {tab.label}
            {tab.graded && <HeartIcon size={11} />}
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
          {readOnly && !v && isCheck && <p className="lm-readback">Read back from an earlier session — answers aren’t kept between sessions.</p>}
          <StepBody
            step={currentStep}
            phase={readOnly && !v ? 'readonly' : stepPhase}
            answer={answer}
            update={readOnly ? undefined : update}
            lessonId={lessonId}
            draggedChip={draggedChip}
            onChipClick={chipClick}
            onBlankClick={blankClick}
            onDropChip={dropChip}
            onDragChip={setDraggedChip}
          />
        </div>
      </div>

      <span className="pg-sr-only" role="status" aria-live="polite">
        {stepPhase === 'correct' && 'Correct.'}
        {stepPhase === 'wrong' && `Not correct — one heart spent. The answer is ${correctLabel(currentStep)}.`}
        {stepPhase === 'reveal' && `Here is what happened. ${correctLabel(currentStep) ? `The answer is ${correctLabel(currentStep)}.` : ''}`}
      </span>

      {/* Reading back an earlier part: step through it, nothing to answer. */}
      {readOnly && !v && (
        <div className="lm-action lm-action--neutral" key="readback">
          <span className="lm-key-hint" aria-hidden="true"><kbd>Enter</kbd> for the next step</span>
          <button className="btn btn-primary btn-lg lm-btn-continue lm-btn-continue--reveal" onClick={advance}>Next <Arrow /></button>
        </div>
      )}

      {!(readOnly && !v) && stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral" key="answering">
          <span className="lm-key-hint" aria-hidden="true">
            {isCheck
              ? <>{currentStep?.type === 'predict' ? 'Choose, rate your confidence' : 'Choose'} · <kbd>Enter</kbd> to {currentStep?.type === 'predict' ? 'lock it in' : 'check'}</>
              : <><kbd>Enter</kbd> to continue</>}
            {currentTab.graded && isGradable(currentStep) ? ' · graded' : ''}
          </span>
          {isCheck ? (
            <button
              className={`btn btn-primary btn-lg lm-btn-check${checkReady ? ' is-ready' : ''}`}
              disabled={!checkReady}
              onClick={check}
            >
              {currentStep?.type === 'predict' ? 'Lock in prediction' : 'Check'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg lm-btn-continue lm-btn-continue--reveal"
              disabled={!continueReady}
              onClick={advance}
            >
              Continue <Arrow />
            </button>
          )}
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
              <div className="lm-fb-title">{currentStep?.type === 'predict' ? 'You called it' : 'Right'}</div>
              {predictionText && <div className="lm-fb-correct">{predictionText}</div>}
              {currentStep?.reveal && <p className="lm-fb-why">{inline(currentStep.reveal)}</p>}
              {why && <p className="lm-fb-why">{inline(why)}</p>}
              {currentStep?.source && <p className="lm-fb-correct">{inline(currentStep.source)}</p>}
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--correct" onClick={advance}>Continue <Arrow /></button>
        </div>
      )}

      {stepPhase === 'reveal' && (
        <div className="lm-action lm-action--reveal" key="reveal">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--reveal">
              <Icon name="info" size={20} strokeWidth={2.4} />
            </span>
            <div>
              <div className="lm-fb-title">
                {currentStep?.type === 'predict'
                  ? (v?.result === null ? 'Here’s what happens' : confidentMiss ? 'A confident miss — the kind you remember' : 'Not what happens — no heart spent')
                  : 'Not quite — no heart spent'}
              </div>
              {predictionText && <div className="lm-fb-correct">{predictionText}</div>}
              {currentStep?.type !== 'predict' && correctLabel(currentStep) && (
                <div className="lm-fb-correct">Answer: <strong>{correctLabel(currentStep)}</strong></div>
              )}
              {currentStep?.reveal && <p className="lm-fb-why">{inline(currentStep.reveal)}</p>}
              {why && <p className="lm-fb-why">{inline(why)}</p>}
              {currentStep?.source && <p className="lm-fb-correct">{inline(currentStep.source)}</p>}
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--reveal" onClick={advance}>Continue <Arrow /></button>
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
              {correctLabel(currentStep) && <div className="lm-fb-correct">Answer: <strong>{correctLabel(currentStep)}</strong></div>}
              {why && <p className="lm-fb-why">{inline(why)}</p>}
              <p className="lm-fb-correct">This one will come back in Practice.</p>
            </div>
          </div>
          <button className="btn btn-lg lm-btn-continue lm-btn-continue--wrong" onClick={advance}>Continue <Arrow /></button>
        </div>
      )}
    </div>
  )
}
