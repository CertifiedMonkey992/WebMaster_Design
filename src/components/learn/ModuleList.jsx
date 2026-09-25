import { useRef } from 'react'
import { useCourse, useProgression } from '../../state/ProgressionContext'
import { getLessonIcon } from './LessonIcons'
import SectionCard from './SectionCard'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import RollingNumber from '../../motion/RollingNumber'
import { useCoursePreviews } from './previews'
import { PARTS, KIND_LABEL, lessonNumber } from '../../data/learnData'
import { Icon } from '../progression/Icons'

/**
 * The course map. Derived entirely from real completion state.
 *
 * Revision 2: the heading assembles and its count rolls; a strip of ticks
 * under it is the whole course at a glance (hover a tick for its item, the
 * current one pings); the resume strip's tile carries a ring showing how far
 * through the module you are; the modules arrive in sequence.
 *
 * Curriculum redesign (2026-09): the seven modules sit under the three Parts
 * that answer the TSA brief's three required sections, and the course is
 * bracketed by the Launch Scan and the Final Scan — ungraded diagnostics a
 * learner can take before and after, to see their own growth.
 */
const PartTitle = ({ as: Tag, id, children }) => <Tag className="part-title" id={id}>{children}</Tag>

export default function ModuleList({ onStartLesson, onStartScan }) {
  const course = useCourse()
  const { vm, showcase } = useProgression()
  const rootRef = useRef(null)
  useCoursePreviews(rootRef)
  const current = course.current
  const allLessons = course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s.title })))
  const scans = vm.scans ?? {}
  const capstoneDone = course.sections.some((s) => s.lessons.some((l) => l.kind === 'capstone' && l.status === 'completed'))

  const ringPct = current ? current.section.completed / current.section.total : 1
  const R = 25
  const C = 2 * Math.PI * R

  const label = (item) => (lessonNumber(item.id) ? `Lesson ${lessonNumber(item.id)}` : KIND_LABEL[item.kind] ?? 'Lesson')
  const resumePart = current ? vm.lessonParts?.[current.lesson.id] : 0

  return (
    <div className="course" ref={rootRef}>
      <header className="course-head">
        <SplitText as={showcase ? 'h3' : 'h1'} className="course-title" immediate={!showcase} stagger={46}>
          {course.completedItems === 0 ? (
            <>Start where the machines <em className="em">actually begin</em>.</>
          ) : (
            <>You are <em className="em"><RollingNumber value={course.completedCount} /> {course.completedCount === 1 ? 'lesson' : 'lessons'}</em> in.</>
          )}
        </SplitText>

        <Reveal className="course-sub-row" variant="fade" immediate={!showcase} delay={320}>
          <p className="course-sub tnum">
            {course.completedCount} of {course.totalLessons} lessons · {course.totalSections} modules in {PARTS.length} parts
          </p>
          <ol className="course-ticks" aria-hidden="true">
            {allLessons.map((l, i) => (
              <li
                key={l.id}
                className={`course-tick is-${l.status}${l.kind !== 'lesson' ? ' is-work' : ''}`}
                style={{ '--i': i }}
                data-tip={`${label(l)} · ${l.title} · ${{ completed: 'done', current: 'up next', available: 'available' }[l.status] ?? 'locked'}`}
              />
            ))}
          </ol>
        </Reveal>
      </header>

      {current && (
        <Reveal className="resume" immediate={!showcase} delay={180}>
          <span className="resume-label">
            <span className="resume-label-dot" aria-hidden="true" />
            {resumePart ? 'Pick up where you stopped' : 'Continue'}
          </span>

          <div className="resume-body">
            <span
              className="resume-tile"
              data-tip={`${current.section.completed} of ${current.section.total} done in ${current.section.title}`}
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
                {label(current.lesson)} · {current.section.title} · {current.section.role}
                {current.lesson.duration && ` · ${current.lesson.duration}`}
                {resumePart ? ` · resume at Part ${resumePart + 1}` : ''}
              </span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onStartLesson(current.lesson.id)}
          >
            {course.completedItems === 0 && !resumePart ? 'Start' : resumePart ? 'Resume' : 'Continue'}
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
            All {course.totalLessons} lessons, the Case Files, both Part projects and the capstone are finished.
            {scans.final ? '' : ' Take the Final Scan below to see how far you have come.'}
          </p>
        </div>
      )}

      {/* The Launch Scan: before the first lesson, optional, never graded. */}
      {!showcase && (
        <div className="scan-row">
          <span className="scan-row-ico" aria-hidden="true"><Icon name="gauge" size={18} /></span>
          <p className="scan-row-text">
            {scans.launch
              ? <><b>Launch Scan:</b> {scans.launch.correct} of {scans.launch.total}.{' '}
                  {scans.final ? 'Your Final Scan is at the end of the course.'
                    : capstoneDone ? 'The Final Scan is ready at the end of the course.'
                    : 'The Final Scan unlocks after the capstone.'}</>
              : <><b>Before you start:</b> a 12-question Launch Scan, about 6 minutes, never graded — so you can see how much you grow.</>}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartScan?.('launch')}>
            {scans.launch ? 'Retake' : 'Take it'}
          </button>
        </div>
      )}

      {PARTS.map((part, p) => {
        const sections = course.sections.filter((s) => s.part === part.id)
        return (
          <section key={part.id} className="part" aria-labelledby={`part-${part.id}`}>
            <header className="part-head">
              <span className="part-num">Part {part.id}</span>
              <PartTitle as={showcase ? 'h4' : 'h2'} id={`part-${part.id}`}>{part.title}</PartTitle>
              <span className="part-strand">{part.strand}</span>
              <p className="part-summary">{part.summary}</p>
            </header>
            <Reveal className="course-modules" stagger immediate={!showcase} delay={p === 0 ? 260 : 0}>
              {sections.map((section) => {
                const i = course.sections.indexOf(section)
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
          </section>
        )
      })}

      {/* The Final Scan: after the capstone. */}
      {!showcase && (
        <div className={`scan-row${capstoneDone ? '' : ' is-locked'}`}>
          <span className="scan-row-ico" aria-hidden="true"><Icon name={capstoneDone ? 'flag' : 'lock'} size={18} /></span>
          <p className="scan-row-text">
            {scans.final
              ? <><b>Final Scan:</b> {scans.final.correct} of {scans.final.total}{scans.launch ? ` — up from ${scans.launch.correct} on your Launch Scan` : ''}.</>
              : capstoneDone
                ? <><b>Final Scan:</b> the same ideas as the Launch Scan, in new situations. See how far you have come.</>
                : <><b>Final Scan</b> — unlocks when you finish the capstone.</>}
          </p>
          {capstoneDone && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartScan?.('final')}>
              {scans.final ? 'Retake' : 'Take it'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
