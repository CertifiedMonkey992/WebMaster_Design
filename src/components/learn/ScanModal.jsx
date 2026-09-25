/* ═══════════════════════════════════════════════════════════════════════════
   ScanModal.jsx — THE LAUNCH SCAN AND THE FINAL SCAN
   ---------------------------------------------------------------------------
   Twelve questions with a confidence rating each, no feedback until the end,
   nothing graded and nothing paid. The Launch Scan (form A) is offered before
   the first lesson; the Final Scan (form B, the same ideas in new situations)
   after the capstone. Results are kept on this browser and compared Part by
   Part, so a learner sees their own growth.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import './LessonModal.css'
import { useProgression } from '../../state/ProgressionContext'
import useDialog from '../../hooks/useDialog'
import StepBody, { EMPTY_ANSWER } from './StepRenderer'
import { SCAN_FORMS, PART_NAMES } from '../../data/course/scans'
import SplitText from '../../motion/SplitText'
import { Icon } from '../progression/Icons'

const Arrow = () => (
  <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

function byPart(form, answers) {
  const out = {}
  for (const item of SCAN_FORMS[form]) {
    const p = (out[item.part] ??= { right: 0, total: 0 })
    p.total++
    if (answers[item.id]?.correct) p.right++
  }
  return out
}

export default function ScanModal({ which, onClose }) {
  const { vm, actions } = useProgression()
  const form = which === 'final' ? 'B' : 'A'
  const items = SCAN_FORMS[form]
  const [screen, setScreen] = useState('intro')
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const [answers, setAnswers] = useState({})
  const [leaving, setLeaving] = useState(false)
  const overlayRef = useRef(null)
  const primaryRef = useRef(null)

  const close = () => { if (leaving) return; setLeaving(true); window.setTimeout(onClose, 240) }
  useDialog(overlayRef, { onClose: close })
  useEffect(() => {
    const t = window.setTimeout(() => primaryRef.current?.focus({ preventScroll: true }), 60)
    return () => clearTimeout(t)
  }, [screen])

  const item = items[idx]
  const step = useMemo(() => (item ? { ...item, type: 'predict', eyebrow: `${PART_NAMES[item.part]} · question ${idx + 1} of ${items.length}` } : null), [item, idx, items.length])
  const ready = answer.selected !== null && answer.confidence !== null

  const next = () => {
    if (!ready) return
    const correct = item.options.find((o) => o.id === answer.selected)?.correct === true
    const all = { ...answers, [item.id]: { correct, confidence: answer.confidence, selected: answer.selected } }
    setAnswers(all)
    setAnswer(EMPTY_ANSWER)
    if (idx + 1 < items.length) { setIdx(idx + 1); return }
    actions.recordScan({ which, form, answers: all })
    setScreen('results')
  }

  const mine = byPart(form, answers)
  const launch = vm.scans?.launch
  const launchParts = launch ? byPart('A', launch.answers) : null
  const right = Object.values(answers).filter((a) => a.correct).length
  const confidentMisses = Object.values(answers).filter((a) => !a.correct && a.confidence === 'sure').length

  return (
    <div ref={overlayRef} className={`lm-overlay${leaving ? ' is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={which === 'final' ? 'Final Scan' : 'Launch Scan'}>
      {screen === 'intro' && (
        <div className="lm-welcome">
          <button className="lm-close lm-close--abs" onClick={close} aria-label="Close"><Icon name="close" size={16} strokeWidth={2.4} /></button>
          <span className="lm-welcome-eyebrow">{items.length} questions · about 6 minutes · not graded</span>
          <SplitText as="h2" className="lm-welcome-title" immediate delay={120}>{which === 'final' ? 'The Final Scan' : 'The Launch Scan'}</SplitText>
          <p className="lm-welcome-sub">
            {which === 'final'
              ? 'The same ideas as your Launch Scan, in new situations. Answer from what you know now — no AI — and say how sure you are.'
              : 'Twelve questions across the whole course, before you start. Most people get several wrong — that is the point. Say how sure you are; you’ll see your results at the end, and again after the capstone.'}
          </p>
          <p className="lm-replay-note">Nothing here costs a heart or pays XP. Your answers stay on this browser.</p>
          <button ref={primaryRef} className="btn btn-next btn-lg lm-start-btn" onClick={() => setScreen('run')}>Begin <Arrow /></button>
        </div>
      )}

      {screen === 'run' && step && (
        <>
          <div className="lm-topbar">
            <button className="lm-close" onClick={close} aria-label="Close"><Icon name="close" size={16} strokeWidth={2.4} /></button>
            <div className="lm-progress-wrap">
              <div className="lm-progress-bar"><div className="lm-progress-fill" style={{ width: `${(idx / items.length) * 100}%` }} /></div>
              <span className="lm-progress-count tnum">{idx + 1} / {items.length}</span>
            </div>
          </div>
          <div className="lm-body">
            <div className="lm-step" key={item.id}>
              <StepBody step={step} phase="answering" answer={answer} update={(p) => setAnswer((a) => ({ ...a, ...(typeof p === 'function' ? p(a) : p) }))} />
            </div>
          </div>
          <div className="lm-action lm-action--neutral">
            <span className="lm-key-hint" aria-hidden="true">Choose an answer and how sure you are</span>
            <button ref={primaryRef} className="btn btn-primary btn-lg lm-btn-check" disabled={!ready} onClick={next}>
              {idx + 1 < items.length ? 'Next' : 'See my results'}
            </button>
          </div>
        </>
      )}

      {screen === 'results' && (
        <div className="lm-complete sc-results">
          <button className="lm-close lm-close--abs" onClick={close} aria-label="Close"><Icon name="close" size={16} strokeWidth={2.4} /></button>
          <SplitText as="h2" className="lm-complete-title" immediate delay={80}>{`${right} of ${items.length}`}</SplitText>
          <p className="lm-welcome-sub">
            {which === 'final' && launch
              ? `On your Launch Scan you had ${launch.correct} of ${launch.total}.`
              : 'This is your starting point. The Final Scan, after the capstone, asks about the same ideas.'}
            {confidentMisses > 0 && ` You were sure and wrong ${confidentMisses} time${confidentMisses === 1 ? '' : 's'} — ${which === 'final' ? 'worth rereading below, next to the lesson that covers it.' : 'those are the ones the course will change most.'}`}
          </p>
          <table className="sim-table sc-table">
            <thead><tr><th>Part</th>{launchParts && which === 'final' && <th className="num">Launch</th>}<th className="num">{which === 'final' ? 'Final' : 'Now'}</th></tr></thead>
            <tbody>
              {Object.keys(PART_NAMES).map((pid) => (
                <tr key={pid}>
                  <th>Part {pid} · {PART_NAMES[pid]}</th>
                  {launchParts && which === 'final' && <td className="num">{launchParts[pid]?.right ?? 0}/{launchParts[pid]?.total ?? 4}</td>}
                  <td className="num">{mine[pid]?.right ?? 0}/{mine[pid]?.total ?? 4}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol className="sc-review">
            {items.map((it) => {
              const a = answers[it.id]
              return (
                <li key={it.id} className={a?.correct ? 'is-right' : 'is-wrong'}>
                  <span className="sc-q">{it.prompt}</span>
                  <span className="sc-a">{a?.correct ? 'Right' : `Answer: ${it.options.find((o) => o.correct)?.text}`} · {it.why}</span>
                </li>
              )
            })}
          </ol>
          <button ref={primaryRef} className="btn btn-primary btn-lg lm-done-btn" onClick={close}>Done</button>
        </div>
      )}
    </div>
  )
}
