/* ═══════════════════════════════════════════════════════════════════════════
   StepRenderer.jsx — SHARED QUESTION RENDERER
   ---------------------------------------------------------------------------
   One implementation of fill-in-the-blank / binary choice / multiple choice,
   used by both the graded lesson modal and the practice session so the two
   always look and behave identically. Markup and class names are unchanged
   from the original lesson modal.
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

/** Is the given answer state correct for this step? */
export function isAnswerCorrect(step, { filled = [], selected = null }) {
  if (!step) return false
  if (step.type === 'fill-blank') {
    return step.answers.every((a, i) => (filled[i] ?? '').toLowerCase() === a.toLowerCase())
  }
  if (step.type === 'binary') return selected === step.correct
  if (step.type === 'mcq') return step.options.find((o) => o.id === selected)?.correct === true
  return false
}

/** Has the learner supplied enough of an answer to press Check? */
export function canCheckStep(step, { filled = [], selected = null }) {
  if (!step) return false
  if (step.type === 'fill-blank') return filled.filter(Boolean).length === step.answers.length
  return selected !== null
}

export default function StepBody({
  step, phase, filled, selected, draggedChip,
  onChipClick, onBlankClick, onSelect, onDropChip, onDragChip,
}) {
  if (!step) return null

  if (step.type === 'fill-blank') {
    const usedInBlanks = filled.filter(Boolean)
    const availChips = step.choices.filter((c) => !usedInBlanks.includes(c))
    return (
      <div className="lm-fill-blank">
        {step.teaching && <p className="lm-teaching">{step.teaching}</p>}
        <h3 className="lm-q-label">Fill in the blanks</h3>
        <div className="lm-sentence">
          {parseTemplate(step.template).map((p, i) =>
            p.type === 'text'
              ? <span key={i} className="lm-sent-text">{p.val}</span>
              : (
                <span
                  key={i}
                  className={`lm-blank${filled[p.index] ? ' lm-blank--filled' : ' lm-blank--empty'}`}
                  onClick={() => filled[p.index] && onBlankClick(p.index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDropChip(p.index) }}
                >{filled[p.index] || ''}</span>
              ),
          )}
        </div>
        <div className="lm-chips-row">
          {step.choices.map((chip) => {
            const isUsed = !availChips.includes(chip)
            return (
              <span
                key={chip}
                className={`lm-chip${isUsed ? ' lm-chip--ghost' : ''}`}
                draggable={!isUsed}
                onDragStart={() => onDragChip(chip)}
                onDragEnd={() => onDragChip(null)}
                onClick={() => !isUsed && onChipClick(chip)}
              >{chip}</span>
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
          {step.options.map((opt) => {
            let cls = 'lm-binary-btn'
            if (selected === opt.value) cls += ' lm-opt--selected'
            if (phase !== 'answering') {
              if (opt.value === step.correct) cls += ' lm-opt--correct'
              else if (selected === opt.value) cls += ' lm-opt--wrong'
            }
            return (
              <button key={opt.value} className={cls} onClick={() => phase === 'answering' && onSelect(opt.value)}>
                {opt.label}
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
          {step.options.map((opt) => {
            let cls = 'lm-mcq-btn'
            if (selected === opt.id) cls += ' lm-opt--selected'
            if (phase !== 'answering') {
              if (opt.correct) cls += ' lm-opt--correct'
              else if (selected === opt.id) cls += ' lm-opt--wrong'
            }
            return (
              <button key={opt.id} className={cls} onClick={() => phase === 'answering' && onSelect(opt.id)}>
                {opt.text}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
