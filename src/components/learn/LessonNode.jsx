import { getLessonIcon } from './LessonIcons'
import { useProgression } from '../../state/ProgressionContext'
import { HeartIcon } from '../progression/Icons'

/**
 * One lesson, as a row inside its module container.
 *
 * `current` is treated differently from every other status: instead of a
 * click-to-reveal popup it always shows an in-flow panel with the description
 * and a real Start button, and it carries the only clay border on the page.
 * That border is the single loudest signal in the interface, and it is spent
 * here because "what do I do next" is the one question this screen exists to
 * answer.
 */
export default function LessonNode({ lesson, index, isPopupOpen, onTogglePopup, onStartLesson }) {
  const { vm } = useProgression()
  const isCurrent = lesson.status === 'current'
  const isLocked = lesson.status === 'locked'
  const outOfHearts = !vm.canStartLesson

  const handleClick = () => {
    if (isLocked) return
    if (isCurrent) { onStartLesson?.(lesson.id); return }
    onTogglePopup()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }

  return (
    <li className="lesson" data-status={lesson.status}>
      <div
        className={`lesson-row lesson-row--${lesson.status}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={!isLocked ? 'button' : undefined}
        tabIndex={!isLocked ? 0 : -1}
        aria-label={`${lesson.title} — ${lesson.status}`}
        aria-expanded={!isLocked && !isCurrent ? isPopupOpen : undefined}
      >
        <span className="lesson-tile">{getLessonIcon(lesson.id)}</span>

        <span className="lesson-info">
          <span className="lesson-label tnum">
            Lesson {index + 1}{lesson.duration ? ` · ${lesson.duration}` : ''}
          </span>
          <span className="lesson-title">{lesson.title}</span>
        </span>

        {lesson.status === 'completed' && (
          <span className="lesson-mark lesson-mark--done" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {isLocked && (
          <span className="lesson-mark lesson-mark--locked" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        )}
      </div>

      {isCurrent && (
        <div className="lesson-panel">
          <p className="lesson-panel-desc">{lesson.desc}</p>
          {outOfHearts && (
            <p className="lesson-warn">
              <HeartIcon size={13} empty /> No hearts left — try Practice instead
            </p>
          )}
          <button
            type="button"
            className="btn btn-next"
            onClick={() => onStartLesson?.(lesson.id)}
          >
            Start lesson
            <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {!isCurrent && isPopupOpen && (
        <div className="lesson-popup" role="dialog" aria-label={`Start ${lesson.title}`}>
          <p className="lesson-popup-desc">{lesson.desc}</p>

          {outOfHearts && lesson.status !== 'completed' && (
            <p className="lesson-warn">
              <HeartIcon size={13} empty /> No hearts left — try Practice instead
            </p>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePopup()
              onStartLesson?.(lesson.id)
            }}
          >
            {lesson.status === 'completed' ? 'Review lesson' : 'Start lesson'}
          </button>
        </div>
      )}
    </li>
  )
}
