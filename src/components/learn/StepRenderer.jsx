/* ═══════════════════════════════════════════════════════════════════════════
   StepRenderer.jsx — SHARED QUESTION RENDERER
   ---------------------------------------------------------------------------
   One implementation of fill-in-the-blank / binary choice / multiple choice,
   used by both the graded lesson and the practice session.

   Revision 2:
     · every option carries its keyboard number, and a radio mark that fills
       with a spring when chosen
     · options arrive in sequence; hovered options lift a little and tilt
     · chips arrive in sequence, lift when dragged, and a placed chip flies
       into its blank (LessonModal animates the landing)
     · after checking, the right answer is marked with a stamped check and
       the wrong choice with a cross
   ═══════════════════════════════════════════════════════════════════════════ */

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

export function correctLabel(step) {
  if (!step) return ''
  if (step.type === 'fill-blank') return step.answers.join(', ')
  if (step.type === 'binary') return step.correct
  if (step.type === 'mcq') return step.options.find((o) => o.correct)?.text ?? ''
  return ''
}

export function isAnswerCorrect(step, { filled = [], selected = null }) {
  if (!step) return false
  if (step.type === 'fill-blank') {
    return step.answers.every((a, i) => (filled[i] ?? '').toLowerCase() === a.toLowerCase())
  }
  if (step.type === 'binary') return selected === step.correct
  if (step.type === 'mcq') return step.options.find((o) => o.id === selected)?.correct === true
  return false
}

export function canCheckStep(step, { filled = [], selected = null }) {
  if (!step) return false
  if (step.type === 'fill-blank') return filled.filter(Boolean).length === step.answers.length
  return selected !== null
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

export default function StepBody({
  step, phase, filled, selected, draggedChip,
  onChipClick, onBlankClick, onSelect, onDropChip, onDragChip,
}) {
  if (!step) return null

  if (step.type === 'fill-blank') {
    const usedInBlanks = filled.filter(Boolean)
    const availChips = step.choices.filter((c) => !usedInBlanks.includes(c))
    const verdict = phase === 'correct' ? ' is-correct' : phase === 'wrong' ? ' is-wrong' : ''
    return (
      <div className="lm-fill-blank">
        {step.teaching && <p className="lm-teaching">{step.teaching}</p>}
        <h3 className="lm-q-label">Fill in the blanks</h3>
        <div className={`lm-sentence${verdict}`}>
          {parseTemplate(step.template).map((p, i) =>
            p.type === 'text'
              ? <span key={i} className="lm-sent-text">{p.val}</span>
              : (
                <span
                  key={i}
                  data-blank={p.index}
                  className={`lm-blank${filled[p.index] ? ' lm-blank--filled' : ' lm-blank--empty'}${draggedChip && !filled[p.index] ? ' is-droppable' : ''}`}
                  onClick={() => filled[p.index] && onBlankClick(p.index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDropChip(p.index) }}
                  role={filled[p.index] && phase === 'answering' ? 'button' : undefined}
                  tabIndex={filled[p.index] && phase === 'answering' ? 0 : undefined}
                  onKeyDown={(e) => { if ((e.key === 'Backspace' || e.key === 'Delete') && filled[p.index]) onBlankClick(p.index) }}
                  data-tip={filled[p.index] && phase === 'answering' ? 'Click to take this word back' : undefined}
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
                disabled={isUsed || phase !== 'answering'}
                onDragStart={() => onDragChip(chip)}
                onDragEnd={() => onDragChip(null)}
                onClick={(e) => !isUsed && onChipClick(chip, e.currentTarget)}
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
      <div className="lm-binary">
        {step.teaching && <p className="lm-teaching">{step.teaching}</p>}
        <h3 className="lm-q-label">{step.prompt}</h3>
        <div className="lm-binary-opts">
          {step.options.map((opt, n) => {
            const st = optionState(selected === opt.value, opt.value === step.correct, phase)
            let cls = 'lm-binary-btn'
            if (st === 'selected') cls += ' lm-opt--selected'
            if (st === 'correct') cls += ' lm-opt--correct'
            if (st === 'wrong') cls += ' lm-opt--wrong'
            return (
              <button
                key={opt.value}
                className={cls}
                style={{ '--i': n }}
                onClick={() => phase === 'answering' && onSelect(opt.value)}
                aria-pressed={selected === opt.value}
                disabled={phase !== 'answering' && st === 'idle'}
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

  if (step.type === 'mcq') {
    return (
      <div className="lm-mcq">
        {step.scenario && <pre className="lm-scenario">{step.scenario}</pre>}
        <h3 className="lm-q-label">{step.prompt}</h3>
        <div className="lm-mcq-opts">
          {step.options.map((opt, n) => {
            const st = optionState(selected === opt.id, opt.correct, phase)
            let cls = 'lm-mcq-btn'
            if (st === 'selected') cls += ' lm-opt--selected'
            if (st === 'correct') cls += ' lm-opt--correct'
            if (st === 'wrong') cls += ' lm-opt--wrong'
            return (
              <button
                key={opt.id}
                className={cls}
                style={{ '--i': n }}
                onClick={() => phase === 'answering' && onSelect(opt.id)}
                aria-pressed={selected === opt.id}
                disabled={phase !== 'answering' && st === 'idle'}
              >
                <kbd className="lm-key">{n + 1}</kbd>
                <span className="lm-opt-text">{opt.text}</span>
                <Mark state={st} />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
