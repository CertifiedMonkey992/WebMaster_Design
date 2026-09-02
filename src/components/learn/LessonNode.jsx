/* Lesson node — a single step on the learning path */
export default function LessonNode({ lesson, offset, isPopupOpen, onTogglePopup }) {
  const handleClick = () => {
    if (lesson.status === 'locked') return
    onTogglePopup()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }

  const Icon = () => {
    if (lesson.status === 'completed') return <span aria-hidden="true">✓</span>
    if (lesson.status === 'locked')    return <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>🔒</span>
    return <span aria-hidden="true">★</span>
  }

  return (
    <div
      className="lesson-node-wrapper"
      style={{ transform: `translateX(${offset}px)` }}
    >
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
          <div className="ln-popup-icon" aria-hidden="true">🧠</div>
          <div className="ln-popup-title">{lesson.title}</div>
          <div className="ln-popup-desc">{lesson.desc}</div>
          <button
            className="ln-popup-btn"
            onClick={(e) => { e.stopPropagation(); onTogglePopup() }}
          >
            Start Lesson →
          </button>
        </div>
      )}
    </div>
  )
}
