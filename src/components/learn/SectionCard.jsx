import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'

/* Zigzag offsets — cycle through these per lesson index */
const OFFSETS = [0, 70, 100, 70, 0, -70, -100, -70]

const MODULE_THEMES = {
  green: {
    color:   '#58CC02',
    shadow:  '#2B8700',
    glow:    'rgba(88,204,2,0.18)',
    outer:   'rgba(88,204,2,0.06)',
    banner:  'rgba(88,204,2,0.08)',
  },
  blue: {
    color:   '#1CB0F6',
    shadow:  '#0B8DC9',
    glow:    'rgba(28,176,246,0.18)',
    outer:   'rgba(28,176,246,0.06)',
    banner:  'rgba(28,176,246,0.08)',
  },
  purple: {
    color:   '#A560FF',
    shadow:  '#7430E0',
    glow:    'rgba(165,96,255,0.18)',
    outer:   'rgba(165,96,255,0.06)',
    banner:  'rgba(165,96,255,0.08)',
  },
}

export default function SectionCard({ section, sectionNumber, onStartLesson }) {
  const [activeLesson, setActiveLesson] = useState(null)
  const pathRef = useRef(null)

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
  const theme = MODULE_THEMES[section.moduleTheme] || MODULE_THEMES.green

  const cssVars = {
    '--module-color':  theme.color,
    '--module-shadow': theme.shadow,
    '--module-glow':   theme.glow,
    '--module-outer':  theme.outer,
    '--module-banner': theme.banner,
  }

  return (
    <div className="sc-wrapper" style={cssVars}>
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
                  onStartLesson={onStartLesson}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
