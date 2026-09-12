import { useState, useEffect, useRef, Fragment } from 'react'
import LessonNode from './LessonNode'
import useProgressWidth from '../../hooks/useProgressWidth'

/**
 * A course module: its header and its lessons, as ONE container.
 *
 * This used to be a card followed by five free-floating lesson cards, which
 * put eight card edges on screen for a single module and made the page read
 * as a feed of unrelated surfaces. A module is one object now; the lessons
 * are rows inside it, separated by hairlines.
 *
 * The "hero" variant is gone with it. The active module used to get a tinted
 * gradient ground, an accent border and a glowing orbital illustration — four
 * statements of a fact the expanded lesson list already makes. What marks the
 * active module now is that its lessons are open and one of them carries the
 * only clay border on the page.
 *
 * `section` arrives pre-derived from deriveCourse(), so completed/total/pct/
 * status already reflect real progression state.
 */
export default function SectionCard({ section, sectionNumber, onStartLesson }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const cardRef = useRef(null)
  const { completed, total, pct, totalDuration } = section
  const fillWidth = useProgressWidth(pct)

  useEffect(() => {
    if (!activeLesson) return
    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setActiveLesson(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [activeLesson])

  const toggle = (lessonId) =>
    setActiveLesson((prev) => (prev === lessonId ? null : lessonId))

  const isLocked = section.status === 'locked'
  const isDone = section.status === 'completed'

  return (
    <section
      className={`module module--${section.status}`}
      ref={cardRef}
      aria-labelledby={`${section.id}-title`}
    >
      <header className="module-head">
        <div className="module-head-top">
          <span className="module-num">{String(sectionNumber).padStart(2, '0')}</span>
          <span className="module-level">{section.level}</span>

          {isDone && (
            <span className="badge badge--done">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Completed
            </span>
          )}
          {section.status === 'in-progress' && (
            <span className="badge badge--active">
              {completed === 0 ? 'Up next' : 'In progress'}
            </span>
          )}
          {isLocked && (
            <span className="badge badge--locked">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Locked
            </span>
          )}
        </div>

        <h2 className="module-title" id={`${section.id}-title`}>{section.title}</h2>
        <p className="module-desc">{section.description || section.subtitle}</p>

        <div className="module-progress">
          <div className="track">
            <div
              className={`track-fill${isDone ? ' is-done' : ''}`}
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="module-progress-count tnum">
            {completed}/{total}
          </span>
        </div>
        <p className="module-meta tnum">~{totalDuration} min</p>
      </header>

      {!isLocked && (
        <ol className="module-lessons" role="list">
          {section.lessons.map((lesson, i) => (
            <Fragment key={lesson.id}>
              <LessonNode
                lesson={lesson}
                index={i}
                isPopupOpen={activeLesson === lesson.id}
                onTogglePopup={() => toggle(lesson.id)}
                onStartLesson={onStartLesson}
              />
            </Fragment>
          ))}
        </ol>
      )}

      {isLocked && (
        <p className="module-locked-hint">
          Finish the previous module to unlock these {total} lessons.
        </p>
      )}
    </section>
  )
}
