/* ═══════════════════════════════════════════════════════════════════════════
   StepRenderer.jsx — SHARED STEP RENDERER
   ---------------------------------------------------------------------------
   One implementation of every kind of lesson step, used by the graded lesson
   (LessonModal) and by Practice.

   Question steps — the learner commits, then the step answers back:
     fill-blank · binary · mcq   the original three
     recall                      an mcq from an earlier lesson, never graded
     predict                     choose AND rate your confidence; never graded
     sort                        put each item in a bin
     number                      type a figure; checked within a tolerance

   Continue steps — nothing to get right, something to do:
     read · transcript · sim · reflect · compose · journal

   Grading is not the step's business. A step says whether it is right; the
   lesson decides whether that costs a heart (only in a part marked `graded`,
   and never for a prediction or a recall — the heart rule: a wrong guess made
   BEFORE the explanation is how the lesson teaches, so it must never cost).

   Revision 2 (unchanged for the original three): options carry keyboard
   numbers and a radio mark; chips arrive in sequence and fly to their blank;
   after checking, the right answer is stamped and the wrong one crossed.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lazy, Suspense } from 'react'
import Rich, { inline } from './Rich'
import { useProgression } from '../../state/ProgressionContext'
import { getLessonById, lessonNumber } from '../../data/learnData'
import './lessonSteps.css'

/* ── What kind of step is this ─────────────────────────────────────────────
   The logic is pure and shared (utils/stepLogic.js); it is re-exported here
   so the lesson and Practice keep importing it from one place. */
import {
  EMPTY_ANSWER, isCheckStep, isGradable, correctLabel, isAnswerCorrect,
  canCheckStep, canContinue, composeText,
} from '../../utils/stepLogic'

export {
  EMPTY_ANSWER, isCheckStep, isGradable, correctLabel, isAnswerCorrect,
  canCheckStep, canContinue, composeText,
}

export function parseTemplate(template) {
  const parts = []
  let rest = template
  let idx = 0
  while (rest.includes('________')) {
    const pos = rest.indexOf('________')
    if (pos > 0) parts.push({ type: 'text', val: rest.slice(0, pos) })
    parts.push({ type: 'blank', index: idx++ })
    rest = rest.slice(pos + 8)
  }
  if (rest) parts.push({ type: 'text', val: rest })
  return parts
}

/* ── Small shared pieces ───────────────────────────────────────────────── */

/* What a piece of AI on the page actually is. Every simulation and every
   AI-written line carries one of these, so nothing recorded, scripted or
   written for the lesson is ever mistaken for something it is not. */
export const PROVENANCE = {
  live:         'Real model · runs in your browser',
  computed:     'Real calculation · nothing is faked',
  illustration: 'Illustrative · written for this lesson',
  scripted:     'Scripted scene · written for this lesson',
  practice:     'Practice sources · written for this lesson',
  research:     'From published research',
}

export function Provenance({ kind, children }) {
  if (!kind && !children) return null
  return <span className={`st-prov st-prov--${kind ?? 'research'}`}>{children ?? PROVENANCE[kind]}</span>
}

function Eyebrow({ step }) {
  const text = step.eyebrow ?? DEFAULT_EYEBROW[step.type]
  if (!text) return null
  return <p className={`st-eyebrow st-eyebrow--${step.type}`}>{text}</p>
}

const DEFAULT_EYEBROW = {
  recall: 'Recall',
  predict: 'Predict first',
  sort: 'Sort it',
  number: 'Work it out',
  reflect: 'Field Journal',
  compose: 'Your draft',
  journal: 'Field Journal',
}

function Mark({ state }) {
  if (state === 'correct') {
    return (
      <span className="lm-opt-mark is-correct" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
        </svg>
      </span>
    )
  }
  if (state === 'wrong') {
    return (
      <span className="lm-opt-mark is-wrong" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </span>
    )
  }
  return <span className={`lm-opt-mark${state === 'selected' ? ' is-selected' : ''}`} aria-hidden="true" />
}

function optionState(isSelected, isCorrect, phase) {
  if (phase !== 'answering') {
    if (isCorrect) return 'correct'
    if (isSelected) return 'wrong'
    return 'idle'
  }
  return isSelected ? 'selected' : 'idle'
}

const optClass = (base, st) => `${base}${st === 'selected' ? ' lm-opt--selected' : ''}${st === 'correct' ? ' lm-opt--correct' : ''}${st === 'wrong' ? ' lm-opt--wrong' : ''}`

export const CONFIDENCE = [
  { id: 'sure', label: 'Sure' },
  { id: 'think', label: 'Think so' },
  { id: 'guess', label: 'Guessing' },
]

/* ── Simulations ─────────────────────────────────────────────────────────
   Each is its own chunk, fetched when a lesson first shows it. */
const SIMS = {
  'spam-rules':      lazy(() => import('./sims/SpamRules')),
  'feed-loop':       lazy(() => import('./sims/FeedLoop')),
  'classifier':      lazy(() => import('./sims/AnimalClassifier')),
  'threshold':       lazy(() => import('./sims/ThresholdLab')),
  'overfit':         lazy(() => import('./sims/OverfitLab')),
  'neuron':          lazy(() => import('./sims/NeuronLab')),
  'network':         lazy(() => import('./sims/NetworkLab')),
  'blame-relay':     lazy(() => import('./sims/BlameRelay')),
  'conv':            lazy(() => import('./sims/ConvLab')),
  'adversarial':     lazy(() => import('./sims/AdversarialLab')),
  'tokenizer':       lazy(() => import('./sims/TokenizerLab')),
  'next-token':      lazy(() => import('./sims/NextTokenLab')),
  'embedding':       lazy(() => import('./sims/EmbeddingLab')),
  'denoise':         lazy(() => import('./sims/DenoiseLab')),
  'claim-check':     lazy(() => import('./sims/ClaimCheck')),
  'screener':        lazy(() => import('./sims/ScreenerAudit')),
  'agent':           lazy(() => import('./sims/AgentLog')),
  'detector-math':   lazy(() => import('./sims/DetectorMath')),
  'fairness':        lazy(() => import('./sims/FairnessLab')),
  'tool-builder':    lazy(() => import('./sims/ToolBuilder')),
  'policy':          lazy(() => import('./sims/PolicyBuilder')),
}

function SimHost({ step, answer, update, lessonId }) {
  const Sim = SIMS[step.sim]
  if (!Sim) return <p className="st-p">This activity is missing.</p>
  return (
    <Suspense fallback={<div className="sim sim--loading" aria-busy="true">Setting up the model…</div>}>
      <Sim
        {...(step.props ?? {})}
        lessonId={lessonId}
        goal={step.goal}
        done={answer.done}
        onDone={() => { if (!answer.done) update({ done: true }) }}
      />
    </Suspense>
  )
}

/* ── The Field Journal, read back (the capstone rereads it) ─────────────── */

function JournalReview({ step }) {
  const { vm } = useProgression()
  const journal = vm.journal ?? {}
  const ids = Object.keys(journal).filter((id) => getLessonById(id))
  const predictions = ids.flatMap((id) => journal[id].entries.filter((e) => e.kind === 'prediction').map((e) => ({ ...e, id })))
  const confidentMisses = predictions.filter((p) => p.confidence === 'sure' && p.correct === false)
  const reflections = ids.flatMap((id) => journal[id].entries.filter((e) => e.kind === 'reflection').map((e) => ({ ...e, id })))
  const scans = vm.scans ?? {}

  return (
    <div className="st-journal">
      <dl className="st-journal-figures">
        <div><dt>Predictions made</dt><dd className="tnum">{predictions.length}</dd></div>
        <div><dt>Confident misses</dt><dd className="tnum">{confidentMisses.length}</dd></div>
        <div><dt>Reflections written</dt><dd className="tnum">{reflections.length}</dd></div>
        {scans.launch && <div><dt>Launch Scan</dt><dd className="tnum">{scans.launch.correct}/{scans.launch.total}</dd></div>}
      </dl>
      {confidentMisses.length > 0 && (
        <>
          <h4 className="st-journal-h">Where you were sure, and wrong</h4>
          <ul className="st-journal-list">
            {confidentMisses.slice(0, step.limit ?? 6).map((p) => (
              <li key={`${p.id}:${p.key}`}>
                <span className="st-journal-src">{lessonNumber(p.id) ? `Lesson ${lessonNumber(p.id)}` : getLessonById(p.id)?.title}</span>
                <span className="st-journal-q">{p.prompt}</span>
                <span className="st-journal-a">You said: {p.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {reflections.length > 0 && (
        <>
          <h4 className="st-journal-h">What you wrote along the way</h4>
          <ul className="st-journal-list">
            {reflections.slice(-(step.limit ?? 6)).map((r) => (
              <li key={`${r.id}:${r.key}`}>
                <span className="st-journal-src">{lessonNumber(r.id) ? `Lesson ${lessonNumber(r.id)}` : getLessonById(r.id)?.title}</span>
                <span className="st-journal-q">{r.prompt}</span>
                <span className="st-journal-a">{r.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {predictions.length === 0 && reflections.length === 0 && (
        <p className="st-p">Your journal is empty on this profile — the course was probably opened with the reviewer’s controls rather than lesson by lesson. Answer from memory instead.</p>
      )}
    </div>
  )
}

/* ── The renderer ──────────────────────────────────────────────────────── */

/**
 * `answer` is one object for every step type (EMPTY_ANSWER); `update(patch)`
 * merges into it. The original three types still accept the older
 * `filled` / `selected` props so Practice can keep calling them as before.
 */
export default function StepBody({
  step, phase, answer, update, lessonId,
  filled: filledProp, selected: selectedProp, draggedChip,
  onChipClick, onBlankClick, onSelect, onDropChip, onDragChip,
}) {
  if (!step) return null
  const a = answer ?? { ...EMPTY_ANSWER, filled: filledProp ?? [], selected: selectedProp ?? null }
  const set = update ?? (() => {})
  const pick = (v) => (onSelect ? onSelect(v) : set({ selected: v }))
  const answering = phase === 'answering'
  /* An ungraded miss (a prediction, a recall, an applied question) is shown
     in ink, not berry: berry means a cost, and it cost nothing. */
  const revealCls = phase === 'reveal' ? ' st-reveal' : ''

  if (step.type === 'fill-blank') {
    const filled = a.filled
    const usedInBlanks = filled.filter(Boolean)
    const availChips = step.choices.filter((c) => !usedInBlanks.includes(c))
    const verdict = phase === 'correct' ? ' is-correct' : phase === 'wrong' ? ' is-wrong' : phase === 'reveal' ? ' is-missed' : ''
    return (
      <div className="lm-fill-blank">
        {step.teaching && <p className="lm-teaching">{inline(step.teaching)}</p>}
        <h3 className="lm-q-label">{step.prompt ?? 'Fill in the blanks'}</h3>
        <div className={`lm-sentence${verdict}`}>
          {parseTemplate(step.template).map((p, i) =>
            p.type === 'text'
              ? <span key={i} className="lm-sent-text">{p.val}</span>
              : (
                <span
                  key={i}
                  data-blank={p.index}
                  className={`lm-blank${filled[p.index] ? ' lm-blank--filled' : ' lm-blank--empty'}${draggedChip && !filled[p.index] ? ' is-droppable' : ''}`}
                  onClick={() => filled[p.index] && onBlankClick?.(p.index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDropChip?.(p.index) }}
                  role={filled[p.index] && answering ? 'button' : undefined}
                  tabIndex={filled[p.index] && answering ? 0 : undefined}
                  onKeyDown={(e) => { if ((e.key === 'Backspace' || e.key === 'Delete') && filled[p.index]) onBlankClick?.(p.index) }}
                  data-tip={filled[p.index] && answering ? 'Click to take this word back' : undefined}
                >
                  {filled[p.index] || ''}
                </span>
              ),
          )}
        </div>
        <div className="lm-chips-row">
          {step.choices.map((chip, n) => {
            const isUsed = !availChips.includes(chip)
            return (
              <button
                type="button"
                key={chip}
                data-chip={n}
                className={`lm-chip${isUsed ? ' lm-chip--ghost' : ''}${draggedChip === chip ? ' is-dragging' : ''}`}
                style={{ '--i': n }}
                draggable={!isUsed}
                disabled={isUsed || !answering}
                onDragStart={() => onDragChip?.(chip)}
                onDragEnd={() => onDragChip?.(null)}
                onClick={(e) => !isUsed && onChipClick?.(chip, e.currentTarget)}
              >
                <kbd className="lm-key">{n + 1}</kbd>
                {chip}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step.type === 'binary') {
    return (
      <div className={`lm-binary${revealCls}`}>
        {step.teaching && <p className="lm-teaching">{inline(step.teaching)}</p>}
        <h3 className="lm-q-label">{inline(step.prompt)}</h3>
        <div className="lm-binary-opts">
          {step.options.map((opt, n) => {
            const st = optionState(a.selected === opt.value, opt.value === step.correct, phase)
            return (
              <button
                key={opt.value}
                className={optClass('lm-binary-btn', st)}
                style={{ '--i': n }}
                onClick={() => answering && pick(opt.value)}
                aria-pressed={a.selected === opt.value}
                disabled={!answering && st === 'idle'}
              >
                <kbd className="lm-key">{n + 1}</kbd>
                <span className="lm-opt-text">{opt.label}</span>
                <Mark state={st} />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step.type === 'mcq' || step.type === 'recall' || step.type === 'predict') {
    const isPredict = step.type === 'predict'
    const hasRight = step.options.some((o) => o.correct)
    return (
      <div className={`lm-mcq st-${step.type}${revealCls}`}>
        <Eyebrow step={step} />
        {step.teaching && <p className="lm-teaching">{inline(step.teaching)}</p>}
        {step.scenario && <div className="lm-scenario">{inline(step.scenario)}</div>}
        {step.sim && <div className="st-inline-sim"><SimHost step={step} answer={a} update={set} lessonId={lessonId} /></div>}
        <h3 className="lm-q-label">{inline(step.prompt)}</h3>
        <div className="lm-mcq-opts">
          {step.options.map((opt, n) => {
            /* An open prediction has no right option: after it is locked in,
               only the learner's own choice stays marked. */
            const st = isPredict && !hasRight
              ? (a.selected === opt.id ? 'selected' : 'idle')
              : optionState(a.selected === opt.id, opt.correct, phase)
            return (
              <button
                key={opt.id}
                className={optClass('lm-mcq-btn', st)}
                style={{ '--i': n }}
                onClick={() => answering && pick(opt.id)}
                aria-pressed={a.selected === opt.id}
                disabled={!answering && st === 'idle'}
              >
                <kbd className="lm-key">{n + 1}</kbd>
                <span className="lm-opt-text">{inline(opt.text)}</span>
                <Mark state={st} />
              </button>
            )
          })}
        </div>
        {isPredict && (
          <div className="st-confidence" role="radiogroup" aria-label="How sure are you?">
            <span className="st-confidence-label">How sure are you?</span>
            {CONFIDENCE.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={a.confidence === c.id}
                className={`st-seg${a.confidence === c.id ? ' is-on' : ''}`}
                disabled={!answering}
                onClick={() => set({ confidence: c.id })}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (step.type === 'sort') {
    const shown = !answering
    return (
      <div className={`st-sort${revealCls}`}>
        <Eyebrow step={step} />
        {step.teaching && <p className="lm-teaching">{inline(step.teaching)}</p>}
        {step.scenario && <div className="lm-scenario">{inline(step.scenario)}</div>}
        <h3 className="lm-q-label">{inline(step.prompt)}</h3>
        <ol className="st-sort-list">
          {step.items.map((item, i) => {
            const chosen = a.assign?.[item.id]
            const ok = shown && chosen === item.bin
            const bad = shown && chosen !== item.bin
            return (
              <li key={item.id} className={`st-sort-row${ok ? ' is-right' : ''}${bad ? ' is-wrong' : ''}`} style={{ '--i': i }}>
                <div className="st-sort-item">
                  <span className="st-sort-text">{inline(item.text)}</span>
                  {shown && item.note && <span className="st-sort-note">{inline(item.note)}</span>}
                </div>
                <div className="st-sort-bins" role="radiogroup" aria-label={`Sort: ${item.text.replace(/\*/g, '')}`}>
                  {step.bins.map((bin) => {
                    const isChosen = chosen === bin.id
                    const isAnswer = shown && item.bin === bin.id
                    return (
                      <button
                        key={bin.id}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        className={`st-seg${isChosen ? ' is-on' : ''}${isAnswer ? ' is-answer' : ''}${shown && isChosen && !isAnswer ? ' is-miss' : ''}`}
                        disabled={!answering}
                        onClick={() => set((prev) => ({ assign: { ...prev.assign, [item.id]: bin.id } }))}
                      >
                        {bin.label}
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  if (step.type === 'number') {
    const verdict = phase === 'correct' ? ' is-right' : phase === 'wrong' ? ' is-wrong' : phase === 'reveal' ? ' is-missed' : ''
    return (
      <div className="st-number">
        <Eyebrow step={step} />
        {step.teaching && <p className="lm-teaching">{inline(step.teaching)}</p>}
        {step.scenario && <div className="lm-scenario">{inline(step.scenario)}</div>}
        <h3 className="lm-q-label">{inline(step.prompt)}</h3>
        <label className={`st-number-field${verdict}`}>
          <input
            className="form-input st-number-input tnum"
            inputMode="decimal"
            value={a.value}
            disabled={!answering}
            onChange={(e) => set({ value: e.target.value })}
            aria-label={step.prompt.replace(/\*/g, '')}
            placeholder={step.placeholder ?? 'Your answer'}
          />
          {step.unit && <span className="st-number-unit">{step.unit}</span>}
        </label>
      </div>
    )
  }

  if (step.type === 'read') {
    return (
      <article className="st-read">
        <Eyebrow step={step} />
        {step.title && <h3 className="st-read-title">{inline(step.title)}</h3>}
        <Rich text={step.body} />
        {step.list && (
          <dl className="st-deflist">
            {step.list.map((row, i) => (
              <div key={i}>
                <dt>{inline(row.term)}</dt>
                <dd>{inline(row.text)}</dd>
              </div>
            ))}
          </dl>
        )}
        {step.table && (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead><tr>{step.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {step.table.rows.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => (j === 0 ? <th key={j} scope="row">{inline(cell)}</th> : <td key={j}>{inline(cell)}</td>))}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {step.takeaway && <p className="st-takeaway">{inline(step.takeaway)}</p>}
        {step.source && <p className="st-source">{inline(step.source)}</p>}
      </article>
    )
  }

  if (step.type === 'transcript') {
    return (
      <div className="st-transcript">
        <Eyebrow step={step} />
        {step.title && <h3 className="st-read-title">{inline(step.title)}</h3>}
        <Provenance kind={step.provenance ?? 'illustration'} />
        <ol className="st-chat">
          {step.messages.map((m, i) => (
            <li key={i} className={`st-msg st-msg--${m.role}`} style={{ '--i': i }}>
              <span className="st-msg-who">{m.who ?? (m.role === 'ai' ? 'Assistant' : m.role === 'page' ? 'Web page the agent read' : 'You')}</span>
              <span className="st-msg-text">{inline(m.text)}</span>
              {m.note && <span className="st-msg-note">{inline(m.note)}</span>}
            </li>
          ))}
        </ol>
        {step.body && <Rich text={step.body} />}
      </div>
    )
  }

  if (step.type === 'sim') {
    return (
      <div className="st-sim">
        <Eyebrow step={step} />
        {step.title && <h3 className="st-read-title">{inline(step.title)}</h3>}
        {step.task && <p className="st-task">{inline(step.task)}</p>}
        <SimHost step={step} answer={a} update={set} lessonId={lessonId} />
        {step.goal && !a.done && step.hint && <p className="st-hint">{inline(step.hint)}</p>}
        {a.done && step.after && <p className="st-after">{inline(step.after)}</p>}
      </div>
    )
  }

  if (step.type === 'reflect') {
    const len = (a.text ?? '').trim().length
    const min = step.min ?? 12
    return (
      <div className="st-reflect">
        <Eyebrow step={step} />
        <h3 className="lm-q-label st-reflect-q">{inline(step.prompt)}</h3>
        {step.help && <p className="st-help">{inline(step.help)}</p>}
        <textarea
          className="form-input st-textarea"
          rows={step.rows ?? 4}
          value={a.text}
          maxLength={2000}
          onChange={(e) => set({ text: e.target.value })}
          placeholder={step.placeholder ?? 'Write it in your own words'}
          aria-label={step.prompt.replace(/\*/g, '')}
        />
        <p className="st-reflect-foot">
          <span>Saved to your Field Journal on this browser only{step.noAI ? ' · write this one without AI' : ''}.</span>
          {len < min && <span className="tnum">{min - len} more characters</span>}
        </p>
      </div>
    )
  }

  if (step.type === 'compose') {
    return (
      <div className="st-compose">
        <Eyebrow step={step} />
        {step.title && <h3 className="st-read-title">{inline(step.title)}</h3>}
        {step.help && <p className="st-help">{inline(step.help)}</p>}
        {step.fields.map((f) => (
          <label key={f.id} className="st-field">
            <span className="form-label">{f.label}</span>
            {f.hint && <span className="st-field-hint">{inline(f.hint)}</span>}
            <textarea
              className="form-input st-textarea"
              rows={f.rows ?? 2}
              value={a.fields?.[f.id] ?? ''}
              maxLength={600}
              onChange={(e) => { const v = e.target.value; set((prev) => ({ fields: { ...(prev.fields ?? {}), [f.id]: v } })) }}
              placeholder={f.placeholder ?? ''}
            />
          </label>
        ))}
        <p className="st-reflect-foot">
          <span>Saved to your Field Journal on this browser only{step.noAI ? ' · write this without AI' : ''}.</span>
        </p>
      </div>
    )
  }

  if (step.type === 'journal') {
    return (
      <div className="st-read">
        <Eyebrow step={step} />
        {step.title && <h3 className="st-read-title">{inline(step.title)}</h3>}
        <Rich text={step.body} />
        <JournalReview step={step} />
      </div>
    )
  }

  return null
}
