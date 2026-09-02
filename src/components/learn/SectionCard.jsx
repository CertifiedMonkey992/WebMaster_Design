import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'

/* Zigzag offsets — cycle through these per lesson index */
const OFFSETS = [0, 70, 100, 70, 0, -70, -100, -70]

export default function SectionCard({ section, sectionNumber }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const pathRef = useRef(null)

  /* Close popup on click outside the path */
  useEffect(() => {
    if (!activeLesson) return
    const handleOutside = (e) => {
      if (pathRef.current && !pathRef.current.contains(e.target)) {
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
    <div className="sc-wrapper">
      {/* Section header card */}
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
            <span className="sc-badge sc-badge-done">✓ Completed</span>
          )}
          {section.status === 'in-progress' && (
            <button className="sc-review-btn">Review</button>
          )}
          {isLocked && (
            <span className="sc-badge sc-badge-locked">🔒 Locked</span>
          )}
        </div>
      </div>

      {/* Lesson path — hidden for fully locked sections */}
      {!isLocked && (
        <div className="sc-path" ref={pathRef}>
          {section.status === 'in-progress' && (
            <div className="sc-path-banner">
              <span>Section {sectionNumber} — {section.subtitle}</span>
            </div>
          )}

          <div className="sc-nodes">
            {section.lessons.map((lesson, i) => (
              <div key={lesson.id} className="sc-node-track">
                {i > 0 && <div className="sc-connector" />}
                <LessonNode
                  lesson={lesson}
                  offset={OFFSETS[i % OFFSETS.length]}
                  isPopupOpen={activeLesson === lesson.id}
                  onTogglePopup={() => toggle(lesson.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
