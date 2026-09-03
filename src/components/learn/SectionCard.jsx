import { useState, useEffect, useRef } from 'react'
import LessonNode from './LessonNode'

const NODE_SIZE = 72
const STEP_Y = 120
const AMPLITUDE = 120

const MODULE_THEMES = {
  green: {
    color:   '#6BFF00',
    shadow:  '#3D9900',
    glow:    'rgba(107,255,0,0.25)',
    outer:   'rgba(107,255,0,0.08)',
    banner:  'rgba(107,255,0,0.1)',
  },
  blue: {
    color:   '#00D4FF',
    shadow:  '#0099BB',
    glow:    'rgba(0,212,255,0.25)',
    outer:   'rgba(0,212,255,0.08)',
    banner:  'rgba(0,212,255,0.1)',
  },
  purple: {
    color:   '#BB77FF',
    shadow:  '#7744CC',
    glow:    'rgba(187,119,255,0.25)',
    outer:   'rgba(187,119,255,0.08)',
    banner:  'rgba(187,119,255,0.1)',
  },
}

function computeOffsets(count, sectionNumber) {
  const direction = sectionNumber % 2 === 1 ? 1 : -1
  return Array.from({ length: count }, (_, i) =>
    direction * AMPLITUDE * Math.sin((Math.PI / 2) * i)
  )
}

function buildSvgPath(offsets) {
  if (offsets.length < 2) return ''
  const positions = offsets.map((x, i) => ({
    x,
    y: i * STEP_Y + NODE_SIZE / 2,
  }))
  let d = `M ${positions[0].x} ${positions[0].y}`
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    const midY = (prev.y + curr.y) / 2
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
  }
  return d
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

  const offsets = computeOffsets(section.lessons.length, sectionNumber)
  const totalHeight = (section.lessons.length - 1) * STEP_Y + NODE_SIZE
  const svgPath = buildSvgPath(offsets)
  const filterId = `glow-${section.id}`

  return (
    <div className="sc-wrapper" style={cssVars}>
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
            <span className="sc-badge sc-badge-locked">Locked</span>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="sc-path" ref={pathRef}>
          {section.status === 'in-progress' && (
            <div className="sc-path-banner">
              <span>Section {sectionNumber} — {section.subtitle}</span>
            </div>
          )}

          <div className="sc-path-container" style={{ height: totalHeight }}>
            <svg
              className="sc-connector-svg"
              width="360"
              height={totalHeight}
              viewBox={`-180 0 360 ${totalHeight}`}
            >
              <defs>
                <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
              </defs>
              <path
                d={svgPath}
                stroke="var(--module-color)"
                strokeWidth="6"
                fill="none"
                opacity="0.12"
                filter={`url(#${filterId})`}
                strokeLinecap="round"
              />
              <path
                d={svgPath}
                stroke="var(--module-color)"
                strokeWidth="3"
                strokeDasharray="8 12"
                fill="none"
                opacity="0.4"
                strokeLinecap="round"
              />
            </svg>

            {section.lessons.map((lesson, i) => (
              <div
                key={lesson.id}
                className="sc-node-item"
                style={{
                  top: i * STEP_Y,
                  transform: `translateX(calc(-50% + ${offsets[i]}px))`,
                }}
              >
                <LessonNode
                  lesson={lesson}
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
