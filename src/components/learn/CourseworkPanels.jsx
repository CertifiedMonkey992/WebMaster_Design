/* ═══════════════════════════════════════════════════════════════════════════
   CourseworkPanels.jsx — THE FIELD KIT AND THE FIELD JOURNAL
   ---------------------------------------------------------------------------
   Two panels on the profile.

   The Field Kit: seven sets of questions, one earned per module, that a
   learner can ask of any AI system. Each is a real badge (data/achievements
   → FIELD_KIT), unlocked by finishing the module and its Case File.

   The Field Journal: every prediction the learner committed to (with how
   sure they were and whether it held) and every reflection they wrote,
   grouped by item. It lives in this browser with the rest of their progress.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { FIELD_KIT } from '../../data/achievements'
import { ALL_LESSONS, lessonNumber, KIND_LABEL } from '../../data/learnData'
import { Icon } from '../progression/Icons'

export function FieldKit() {
  const { state } = useProgression()
  const earned = FIELD_KIT.filter((k) => state.achievements?.[k.id]).length
  return (
    <section className="fk" aria-labelledby="fk-title">
      <header className="fk-head">
        <h3 className="ac-title" id="fk-title">Field Kit</h3>
        <p className="fk-sub tnum">{earned} of {FIELD_KIT.length} tools earned · one per module</p>
      </header>
      <ol className="fk-list">
        {FIELD_KIT.map((k) => {
          const has = Boolean(state.achievements?.[k.id])
          return (
            <li key={k.id} className={`fk-tool${has ? ' is-earned' : ''}`}>
              <span className="fk-n tnum">{String(k.moduleNumber).padStart(2, '0')}</span>
              <div className="fk-body">
                <span className="fk-name">
                  {has ? <Icon name="check-circle" size={14} /> : <Icon name="lock" size={13} />} {k.title}
                </span>
                {has
                  ? <ul className="fk-qs">{k.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                  : <span className="fk-hint">{k.description}.</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const CONF = { sure: 'sure', think: 'thought so', guess: 'guessing' }

export function FieldJournal() {
  const { vm } = useProgression()
  const journal = vm.journal ?? {}
  const items = ALL_LESSONS.filter((l) => journal[l.id]?.entries?.length)
  const [open, setOpen] = useState(null)
  const predictions = items.flatMap((l) => journal[l.id].entries.filter((e) => e.kind === 'prediction'))
  const misses = predictions.filter((p) => p.correct === false)
  const confidentMisses = misses.filter((p) => p.confidence === 'sure')

  return (
    <section className="fj" aria-labelledby="fj-title">
      <header className="fk-head">
        <h3 className="ac-title" id="fj-title">Field Journal</h3>
        <p className="fk-sub tnum">
          {predictions.length} predictions · {misses.length} that didn’t hold · {confidentMisses.length} confident misses
        </p>
      </header>
      {items.length === 0 && (
        <p className="pv-data-desc">Your predictions and reflections from each lesson collect here, on this browser only. The capstone asks you to reread them.</p>
      )}
      <ul className="fj-items">
        {items.map((l) => {
          const entries = journal[l.id].entries
          const isOpen = open === l.id
          return (
            <li key={l.id} className="fj-item">
              <button type="button" className="fj-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)}>
                <span className="fj-label">{lessonNumber(l.id) ? `Lesson ${lessonNumber(l.id)}` : KIND_LABEL[l.kind]}</span>
                <span className="fj-title">{l.title}</span>
                <span className="fj-count tnum">{entries.length}</span>
                <Icon name="chevron-down" size={14} className={`fj-chev${isOpen ? ' is-open' : ''}`} />
              </button>
              {isOpen && (
                <ul className="fj-entries">
                  {entries.map((e) => (
                    <li key={e.key} className={`fj-entry fj-entry--${e.kind}`}>
                      <span className="fj-q">{e.prompt}</span>
                      {e.kind === 'prediction'
                        ? <span className="fj-a">You said: {e.text} ({CONF[e.confidence] ?? e.confidence}){e.correct === true ? ' — it held.' : e.correct === false ? ' — it didn’t.' : ''}</span>
                        : <span className="fj-a">{e.text}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
