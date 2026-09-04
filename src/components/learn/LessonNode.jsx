export default function LessonNode({ lesson, index, icon, isPopupOpen, onTogglePopup, onStartLesson }) {
  const handleClick = () => {
    if (lesson.status === 'locked') return
    onTogglePopup()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }

  return (
    <div className="ln-row-wrapper">
      <div
        className={`ln-row ln-${lesson.status}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={lesson.status !== 'locked' ? 'button' : undefined}
        tabIndex={lesson.status !== 'locked' ? 0 : -1}
        aria-label={`${lesson.title} — ${lesson.status}`}
        aria-expanded={lesson.status !== 'locked' ? isPopupOpen : undefined}
      >
        <div className="ln-icon-box">
          {icon}
        </div>
        <div className="ln-info">
          <span className="ln-label">Lesson {index + 1}</span>
          <span className="ln-title">{lesson.title}</span>
        </div>
        {lesson.status === 'completed' && (
          <svg className="ln-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {lesson.status === 'current' && (
          <span className="ln-current-dot" />
        )}
        {lesson.status === 'locked' && (
          <svg className="ln-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
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
            {lesson.status === 'completed' ? 'Review Lesson →' : 'Start Lesson →'}
          </button>
        </div>
      )}
    </div>
  )
}
