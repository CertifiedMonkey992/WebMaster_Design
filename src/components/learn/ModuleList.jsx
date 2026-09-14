import { useRef } from 'react'
import { useCourse, useProgression } from '../../state/ProgressionContext'
import { getLessonIcon } from './LessonIcons'
import SectionCard from './SectionCard'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import RollingNumber from '../../motion/RollingNumber'
import { useCoursePreviews } from './previews'

/**
 * The course map. Derived entirely from real completion state.
 *
 * Revision 2: the heading assembles and its count rolls; a strip of 22 ticks
 * under it is the whole course at a glance (hover a tick for its lesson, the
 * current one pings); the resume strip's tile carries a ring showing how far
 * through the module you are; the modules arrive in sequence.
 */
export default function ModuleList({ onStartLesson }) {
  const course = useCourse()
  const { showcase } = useProgression()
  const rootRef = useRef(null)
  /* Revision 5: previews — on the learner's own map, and on the landing
     page's course frame between its demo scene's lessons (they change
     nothing, so they are as true of a demo learner as of a real one). */
  useCoursePreviews(rootRef)
  const current = course.current
  const allLessons = course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s.title })))

  const ringPct = current ? current.lessonIndex / current.section.lessons.length : 1
  const R = 25
  const C = 2 * Math.PI * R

  return (
    <div className="course" ref={rootRef}>
      <header className="course-head">
        <SplitText as="h1" className="course-title" immediate={!showcase} stagger={46}>
          {course.completedCount === 0 ? (
            <>Start where the machines <em className="em">actually begin</em>.</>
          ) : (
            <>You are <em className="em"><RollingNumber value={course.completedCount} /> {course.completedCount === 1 ? 'lesson' : 'lessons'}</em> in.</>
          )}
        </SplitText>

        <Reveal className="course-sub-row" variant="fade" immediate={!showcase} delay={320}>
          <p className="course-sub tnum">
            {course.completedCount} of {course.totalLessons} lessons · {course.totalSections} modules
          </p>
          {/* The whole course as ticks: done, here, and still to come. */}
          <ol className="course-ticks" aria-hidden="true">
            {allLessons.map((l, i) => (
              <li
                key={l.id}
                className={`course-tick is-${l.status}`}
                style={{ '--i': i }}
                data-tip={`${l.title} · ${l.status === 'completed' ? 'done' : l.status === 'current' ? 'up next' : 'locked'}`}
              />
            ))}
          </ol>
        </Reveal>
      </header>

      {current && (
        <Reveal className="resume" immediate={!showcase} delay={180}>
          <span className="resume-label">
            <span className="resume-label-dot" aria-hidden="true" />
            Continue
          </span>

          <div className="resume-body">
            <span
              className="resume-tile"
              data-tip={`${current.lessonIndex} of ${current.section.lessons.length} done in ${current.section.title}`}
            >
              <svg className="resume-ring" viewBox="0 0 56 56" aria-hidden="true">
                <circle className="resume-ring-track" cx="28" cy="28" r={R} />
                <circle
                  className="resume-ring-fill"
                  cx="28" cy="28" r={R}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - ringPct)}
                />
              </svg>
              <span className="resume-tile-ico">{getLessonIcon(current.lesson.id)}</span>
            </span>
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
        </Reveal>
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

      <Reveal className="course-modules" stagger immediate={!showcase} delay={260}>
        {course.sections.map((section, i) => {
          const prev = course.sections[i - 1]
          return (
            <SectionCard
              key={section.id}
              section={section}
              sectionNumber={i + 1}
              previousTitle={prev?.title}
              onStartLesson={onStartLesson}
            />
          )
        })}
      </Reveal>
    </div>
  )
}
