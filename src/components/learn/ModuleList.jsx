import { SECTIONS, getCurrentLesson, getSectionProgress } from '../../data/learnData'
import { getLessonIcon } from './LessonIcons'
import SectionCard from './SectionCard'

export default function ModuleList({ onStartLesson }) {
  const current = getCurrentLesson()

  return (
    <div className="module-list">
      {current && (
        <div className="cl-card">
          <div className="cl-label">Continue Learning</div>
          <div className="cl-content">
            <div className="cl-icon">
              {getLessonIcon(current.lesson.id)}
            </div>
            <div className="cl-text">
              <div className="cl-title">{current.lesson.title}</div>
              <div className="cl-desc">{current.lesson.desc}</div>
              <div className="cl-meta">
                {current.section.title} · Lesson {current.lessonIndex + 1} of {current.section.lessons.length}
                {current.lesson.duration && ` · ${current.lesson.duration}`}
              </div>
            </div>
          </div>
          <button className="cl-btn" onClick={() => onStartLesson(current.lesson.id)}>
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.4rem' }}>
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      )}

      {SECTIONS.map((section, i) => (
        <SectionCard key={section.id} section={section} sectionNumber={i + 1} onStartLesson={onStartLesson} />
      ))}
    </div>
  )
}
