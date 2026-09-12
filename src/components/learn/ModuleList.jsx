import { useCourse } from '../../state/ProgressionContext'
import { getLessonIcon } from './LessonIcons'
import SectionCard from './SectionCard'

/**
 * The course map. Derived entirely from real completion state — no hardcoded
 * lesson statuses anywhere.
 *
 * The page opens with a heading and one "pick up here" strip rather than
 * dropping straight into a stack of cards, so there is a moment of orientation
 * before the list starts.
 */
export default function ModuleList({ onStartLesson }) {
  const course = useCourse()
  const current = course.current

  return (
    <div className="course">
      <header className="course-head">
        <h1 className="course-title">
          {course.completedCount === 0 ? (
            <>Start where the machines <em className="em">actually begin</em>.</>
          ) : (
            <>You are <em className="em">{course.completedCount} lessons</em> in.</>
          )}
        </h1>
        <p className="course-sub tnum">
          {course.completedCount} of {course.totalLessons} lessons ·
          {' '}{course.totalSections} modules
        </p>
      </header>

      {current && (
        <div className="resume">
          <span className="resume-label">Continue</span>

          <div className="resume-body">
            <span className="resume-tile">{getLessonIcon(current.lesson.id)}</span>
            <span className="resume-text">
              <span className="resume-title">{current.lesson.title}</span>
              <span className="resume-meta">
                {current.section.title} · Lesson {current.lessonIndex + 1} of{' '}
                {current.section.lessons.length}
                {current.lesson.duration && ` · ${current.lesson.duration}`}
              </span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onStartLesson(current.lesson.id)}
          >
            {course.completedCount === 0 ? 'Start' : 'Continue'}
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {!current && (
        <div className="resume resume--done">
          <span className="resume-label">Course complete</span>
          <p className="resume-meta">
            All {course.totalLessons} lessons finished. Keep the streak alive with
            practice sessions while new modules are added.
          </p>
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
