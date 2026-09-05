import { useState, useEffect, useRef, Fragment } from 'react'
import LessonNode from './LessonNode'
import CourseHeroVisual from './CourseHeroVisual'
import useProgressWidth from '../../hooks/useProgressWidth'

/**
 * A course section. `section` arrives pre-derived from deriveCourse(), so
 * completed/total/pct/status already reflect real progression state.
 *
 * The currently active section (status "in-progress") renders as the hero:
 * a two-column card with a 2.5D visual, tinted by the section's own theme.
 * Every other section stays a quieter, single-column surface.
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
  const isHero = section.status === 'in-progress' && section.unlocked

  const headerTop = (
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
  )

  const progressRow = (
    <>
      <div className="sc-progress-row">
        <div className="sc-progress-bar">
          <div className="sc-progress-fill" style={{ width: `${fillWidth}%` }} />
        </div>
        <span className="sc-progress-text">{pct}%</span>
      </div>
      <div className="sc-meta">
        {completed}/{total} lessons · ~{totalDuration} min
      </div>
    </>
  )

  return (
    <div className="sc-wrapper" ref={cardRef}>
      <div
        className={`sc-header sc-${section.status}${isHero ? ' sc-hero' : ''}`}
        data-theme={isHero ? section.moduleTheme : undefined}
      >
        {isHero ? (
          <>
            <div className="sc-hero-content">
              {headerTop}
              <h2 className="sc-title">{section.title}</h2>
              <p className="sc-desc">{section.description || section.subtitle}</p>
              {progressRow}
            </div>
            <div className="sc-hero-visual">
              <CourseHeroVisual theme={section.moduleTheme} />
            </div>
          </>
        ) : (
          <>
            {headerTop}
            <h2 className="sc-title">{section.title}</h2>
            <p className="sc-desc">{section.description || section.subtitle}</p>
            {progressRow}
          </>
        )}
      </div>

      {!isLocked && (
        <div className="sc-lessons">
          {section.lessons.map((lesson, i) => (
            <Fragment key={lesson.id}>
              <LessonNode
                lesson={lesson}
                index={i}
                isPopupOpen={activeLesson === lesson.id}
                onTogglePopup={() => toggle(lesson.id)}
                onStartLesson={onStartLesson}
              />
              {i < section.lessons.length - 1 && (
                <div className="sc-connector">
                  <div className={`sc-connector-fill${lesson.status === 'completed' ? ' is-filled' : ''}`} />
                </div>
              )}
            </Fragment>
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
