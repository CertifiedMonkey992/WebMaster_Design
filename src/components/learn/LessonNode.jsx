import { getLessonIcon } from './LessonIcons'
import { useProgression } from '../../state/ProgressionContext'
import { HeartIcon } from '../progression/Icons'

/**
 * One lesson stop on the path.
 *
 * `current` is treated differently from every other status: instead of a
 * click-to-reveal popup, it always shows an in-flow panel with the
 * description and a real "Start" button — the whole row + panel together
 * are the call to action, not a small "Next" badge.
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
    <div className="ln-row-wrapper" data-status={lesson.status}>
      <div
        className={`ln-row ln-${lesson.status}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={!isLocked ? 'button' : undefined}
        tabIndex={!isLocked ? 0 : -1}
        aria-label={`${lesson.title} — ${lesson.status}`}
        aria-expanded={!isLocked && !isCurrent ? isPopupOpen : undefined}
      >
        <div className="ln-icon-box">
          {getLessonIcon(lesson.id)}
        </div>
        <div className="ln-info">
          <span className="ln-label">Lesson {index + 1}{lesson.duration ? ` · ${lesson.duration}` : ''}</span>
          <span className="ln-title">{lesson.title}</span>
        </div>
        {lesson.status === 'completed' && (
          <div className="ln-status-icon ln-check">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {isCurrent && (
          <div className="ln-status-icon ln-current-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        )}
        {isLocked && (
          <div className="ln-status-icon ln-lock">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>

      {isCurrent && (
        <div className="ln-current-panel">
          <p className="ln-current-desc">{lesson.desc}</p>
          {outOfHearts && (
            <div className="ln-current-warn">
              <HeartIcon size={13} empty /> No hearts left — try Practice instead
            </div>
          )}
          <button className="ln-start-btn" onClick={() => onStartLesson?.(lesson.id)}>
            Start Lesson
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {!isCurrent && isPopupOpen && (
        <div className="ln-popup" role="dialog" aria-label={`Start ${lesson.title}`}>
          <div className="ln-popup-title">{lesson.title}</div>
          <div className="ln-popup-desc">{lesson.desc}</div>

          {outOfHearts && lesson.status !== 'completed' && (
            <div className="ln-popup-warn">
              <HeartIcon size={13} empty /> No hearts left — try Practice instead
            </div>
          )}

          <button
            className="ln-popup-btn"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePopup()
              onStartLesson?.(lesson.id)
            }}
          >
            {lesson.status === 'completed' ? 'Review Lesson →' : 'Start Lesson →'}
          </button>
        </div>
      )}
    </div>
  )
}
