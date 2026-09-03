export default function LessonNode({ lesson, isPopupOpen, onTogglePopup, onStartLesson }) {
  const handleClick = () => {
    if (lesson.status === 'locked') return
    onTogglePopup()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }

  const Icon = () => {
    if (lesson.status === 'completed') return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
    if (lesson.status === 'locked') return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
    return (
      <svg className="ln-star-icon" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z" />
      </svg>
    )
  }

  return (
    <div className="lesson-node-wrapper">
      <div
        className={`lesson-node ln-${lesson.status}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={lesson.status !== 'locked' ? 'button' : undefined}
        tabIndex={lesson.status !== 'locked' ? 0 : -1}
        aria-label={`${lesson.title} — ${lesson.status}`}
        aria-expanded={lesson.status !== 'locked' ? isPopupOpen : undefined}
      >
        <Icon />
      </div>

      {isPopupOpen && (
        <div className="ln-popup" role="dialog" aria-label={`Start ${lesson.title}`}>
          <div className="ln-popup-title">{lesson.title}</div>
          <div className="ln-popup-desc">{lesson.desc}</div>
          <button
            className="ln-popup-btn"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePopup()
              if (onStartLesson) onStartLesson(lesson.id)
            }}
          >
            Start Lesson →
          </button>
        </div>
      )}
    </div>
  )
}
