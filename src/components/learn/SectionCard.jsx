import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'

const LESSON_ICONS = [
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-8.66-14.5 3.46 2m10.4 6 3.46 2M1 12h4m14 0h4M4.34 4.34l2.83 2.83m9.66 9.66 2.83 2.83M4.34 19.66l2.83-2.83m9.66-9.66 2.83-2.83"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
]

export default function SectionCard({ section, sectionNumber, onStartLesson }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const cardRef = useRef(null)

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
          <button className="sc-details-btn">See Details</button>
        </div>
        <div className="sc-title-row">
          <div>
            <span className="sc-number">Section {sectionNumber}</span>
            <h2 className="sc-title">{section.title}</h2>
          </div>
          {section.status === 'completed' && (
            <span className="sc-badge sc-badge-done">Completed</span>
          )}
          {section.status === 'in-progress' && (
            <button className="sc-review-btn">Review</button>
          )}
          {isLocked && (
            <span className="sc-badge sc-badge-locked">Locked</span>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="sc-lessons">
          {section.lessons.map((lesson, i) => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              index={i}
              icon={LESSON_ICONS[i % LESSON_ICONS.length]}
              isPopupOpen={activeLesson === lesson.id}
              onTogglePopup={() => toggle(lesson.id)}
              onStartLesson={onStartLesson}
            />
          ))}
        </div>
      )}
    </div>
  )
}
