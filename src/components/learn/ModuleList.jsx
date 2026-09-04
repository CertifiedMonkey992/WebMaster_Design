import { useCourse } from '../../state/ProgressionContext'
import { getLessonIcon } from './LessonIcons'
import SectionCard from './SectionCard'

export default function ModuleList({ onStartLesson }) {
  /* The course map is derived from real completion state — no hardcoded
     lesson statuses anywhere. */
  const course = useCourse()
  const current = course.current

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
            {course.completedCount === 0 ? 'Start' : 'Continue'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.4rem' }}>
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      )}

      {!current && (
        <div className="cl-card cl-card--done">
          <div className="cl-label">Course complete</div>
          <div className="cl-content">
            <div className="cl-text">
              <div className="cl-title">Every lesson finished</div>
              <div className="cl-desc">
                You’ve completed all {course.totalLessons} lessons. Keep your streak alive
                with practice sessions while new modules are added.
              </div>
            </div>
          </div>
        </div>
      )}

      {course.sections.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          sectionNumber={i + 1}
          onStartLesson={onStartLesson}
        />
      ))}
    </div>
  )
}
