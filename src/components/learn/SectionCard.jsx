import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'
import useProgressWidth from '../../hooks/useProgressWidth'
import RollingNumber from '../../motion/RollingNumber'
import { shake } from '../../motion/burst'
import { Icon } from '../progression/Icons'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'
import { useProgression } from '../../state/ProgressionContext'

/**
 * A course module: its header and its lessons, as ONE container.
 *
 * Revision 2:
 *   · the module COLLAPSES — in-progress opens itself, locked closes itself,
 *     and a completed one stays as the reader left it —
 *     and the header is the toggle, with a chevron that turns
 *   · a locked header refuses: it shakes, the lock rattles, and the hint says
 *     which module unlocks it
 *   · the lessons are a PATH: a rail runs through the tiles and fills moss up
 *     to where you are (see LessonNode)
 *   · the bar settles with a shine, the count rolls
 */
export default function SectionCard({ section, sectionNumber, previousTitle, onStartLesson, className = '', style }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const { showcase } = useProgression()
  const Title = showcase ? 'h5' : 'h3'
  const cardRef = useRef(null)
  const lockRef = useRef(null)
  const { completed, total, pct, totalDuration } = section
  const fillWidth = useProgressWidth(pct)

  const isLocked = section.status === 'locked'
  const isDone = section.status === 'completed'
  const [open, setOpen] = useState(section.status === 'in-progress')
  const [denied, setDenied] = useState(0)

  /* A module that just became the active one opens itself. */
  useEffect(() => {
    if (section.status === 'in-progress') setOpen(true)
    if (section.status === 'locked') setOpen(false)
  }, [section.status])

  /* Folding the module closes any lesson preview inside it, so no control
     stays reachable by Tab inside a collapsed region. */
  useEffect(() => { if (!open) setActiveLesson(null) }, [open])

  useEffect(() => {
    if (!activeLesson) return
    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setActiveLesson(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [activeLesson])

  useEffect(() => {
    if (!denied) return undefined
    lockRef.current?.classList.add('is-denied')
    const t = window.setTimeout(() => lockRef.current?.classList.remove('is-denied'), 500)
    return () => clearTimeout(t)
  }, [denied])

  const toggleModule = () => {
    if (isLocked) {
      shake(cardRef.current, { distance: 6 })
      setDenied((n) => n + 1)
      return
    }
    setOpen((o) => !o)
  }

  const toggle = (lessonId) =>
    setActiveLesson((prev) => (prev === lessonId ? null : lessonId))

  const listId = `${section.id}-lessons`

  return (
    <section
      className={`module module--${section.status}${open ? ' is-open' : ''} ${className}`.trim()}
      style={style}
      ref={cardRef}
      aria-labelledby={`${section.id}-title`}
    >
      <header className="module-head">
        <button
          type="button"
          className="module-toggle"
          onClick={toggleModule}
          aria-expanded={isLocked ? undefined : open}
          aria-controls={isLocked ? undefined : listId}
          aria-disabled={isLocked || undefined}
          aria-label={
            isLocked
              ? `${section.title} is locked. Finish ${previousTitle ?? 'the previous module'} to unlock it.`
              : `${open ? 'Collapse' : 'Expand'} ${section.title}`
          }
          data-tip={isLocked ? `Finish ${previousTitle ?? 'the previous module'} to unlock` : undefined}
        />

        <div className="module-head-top">
          <span className="module-num">{String(sectionNumber).padStart(2, '0')}</span>
          <span className="module-level">{section.role ? `${section.role} · ` : ''}{section.level}</span>

          {isDone && (
            <span className="badge badge--done">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Completed
            </span>
          )}
          {section.status === 'in-progress' && (
            <span className="badge badge--active">
              <span className="badge-dot" aria-hidden="true" />
              {completed === 0 ? 'Up next' : 'In progress'}
            </span>
          )}
          {isLocked && (
            <span className="badge badge--locked" ref={lockRef}>
              <Icon name="lock" size={11} strokeWidth={2.6} />
              Locked
            </span>
          )}

          {!isLocked && (
            <span className="module-chevron" aria-hidden="true">
              <Icon name="chevron-down" size={16} strokeWidth={2.4} />
            </span>
          )}
        </div>

        <Title className="module-title" id={`${section.id}-title`}>{section.title}</Title>
        {section.question && <p className="module-question">{section.question}</p>}
        <p className="module-desc">{section.description || section.subtitle}</p>

        <div className="module-progress">
          <div
            className="track"
            data-tip={`${completed} of ${total} lessons · ${pct}%`}
          >
            <div
              key={completed}
              className={`track-fill${isDone ? ' is-done' : ''}${completed > 0 ? ' fx-fill-shine' : ''}`}
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="module-progress-count tnum">
            <RollingNumber value={completed} />/{total}
          </span>
        </div>
        <p className="module-meta tnum">
          <Icon name="clock" size={11} /> ~{totalDuration} min · {section.lessonCount ?? total} lessons{total > (section.lessonCount ?? total) ? ` + ${total - section.lessonCount} more` : ''}
          {!isLocked && !open && <span className="module-meta-hint"> · open to see them</span>}
        </p>
        {section.fieldKit && (
          <p className={`module-kit${isDone ? ' is-earned' : ''}`}>
            <Icon name={isDone ? 'check-circle' : 'target'} size={12} />
            {isDone ? 'Field Kit tool earned:' : 'Unlocks the Field Kit tool'} <b>{section.fieldKit.name}</b>
          </p>
        )}

        {/* Reviewer only. Finishing a module runs every one of its lessons
            through the real completion path in turn, so the section bonus,
            the next module's unlock and every animation land for real. */}
        <JudgeMargin label={`Reviewer controls for ${section.title}`}>
          <JudgeChip
            op={OPS.COMPLETE_SECTION} payload={{ sectionId: section.id }}
            icon="check-circle" label={`Finish all ${total}`} disabled={isDone}
            tip="Completes every lesson here and unlocks what comes next"
          />
          <JudgeChip
            op={OPS.RESET_SECTION} payload={{ sectionId: section.id }}
            icon="close" label="Empty it" quiet disabled={completed === 0}
            tip="Put this module back to untouched"
          />
        </JudgeMargin>
      </header>

      {!isLocked && (
        <div className="module-body" id={listId} aria-hidden={!open}>
          <div className="module-body-inner">
            <ol className="module-lessons">
              {section.lessons.map((lesson, i) => (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === section.lessons.length - 1}
                  prevTitle={section.lessons[i - 1]?.title}
                  isPopupOpen={activeLesson === lesson.id}
                  onTogglePopup={() => toggle(lesson.id)}
                  onStartLesson={onStartLesson}
                  tabbable={open}
                />
              ))}
            </ol>
          </div>
        </div>
      )}

      {isLocked && (
        <p className={`module-locked-hint${denied ? ' is-flash' : ''}`} key={denied}>
          <Icon name="lock" size={12} strokeWidth={2.4} />
          Finish {previousTitle ?? 'the previous module'} to unlock this module.
        </p>
      )}
    </section>
  )
}
