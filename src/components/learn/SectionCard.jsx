import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'

/**
 * A course section. `section` arrives pre-derived from deriveCourse(), so
 * completed/total/pct/status already reflect real progression state.
 */
export default function SectionCard({ section, sectionNumber, onStartLesson }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const cardRef = useRef(null)
  const { completed, total, pct, totalDuration } = section

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

  return (
    <div className="sc-wrapper" ref={cardRef}>
      <div className={`sc-header sc-${section.status}`}>
        <div className="sc-header-top">
          <span className="sc-level">{section.level}</span>
          {section.status === 'completed' && (
            <span className="sc-badge sc-badge-done">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Completed
            </span>
          )}
          {section.status === 'in-progress' && (
            <span className="sc-badge sc-badge-progress">
              {completed === 0 ? 'Up Next' : 'In Progress'}
            </span>
          )}
          {isLocked && (
            <span className="sc-badge sc-badge-locked">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Locked
            </span>
          )}
        </div>

        <h2 className="sc-title">{section.title}</h2>
        <p className="sc-desc">{section.description || section.subtitle}</p>

        <div className="sc-progress-row">
          <div className="sc-progress-bar">
            <div className="sc-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="sc-progress-text">{pct}%</span>
        </div>

        <div className="sc-meta">
          {completed}/{total} lessons · ~{totalDuration} min
        </div>
      </div>

      {!isLocked && (
        <div className="sc-lessons">
          {section.lessons.map((lesson, i) => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              index={i}
              isPopupOpen={activeLesson === lesson.id}
              onTogglePopup={() => toggle(lesson.id)}
              onStartLesson={onStartLesson}
            />
          ))}
        </div>
      )}

      {isLocked && (
        <div className="sc-locked-hint">
          Finish the previous section to unlock these {total} lessons.
        </div>
      )}
    </div>
  )
}
