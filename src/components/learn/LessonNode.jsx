import { useEffect, useRef, useState } from 'react'
import { getLessonIcon } from './LessonIcons'
import { useProgression } from '../../state/ProgressionContext'
import { HeartIcon, BoltIcon, Icon } from '../progression/Icons'
import { XP } from '../../config/progressionConfig'
import { burst, ring, shake } from '../../motion/burst'

/**
 * One lesson, as a stop on its module's path.
 *
 * Revision 2 — every state answers the pointer differently, because every
 * state means something different:
 *
 *   current     the loudest object on the page: clay border, its tile pings,
 *               the description and a real Start button always visible
 *   available   hover → the tile turns, the title slides, "+25 XP" and an
 *               arrow slide in; click → an inline preview opens
 *   completed   hover → "Review" slides in (with a star if it was perfect);
 *               when a lesson BECOMES completed its check stamps down and
 *               the rail fills past it
 *   locked      focusable; hover names the lesson that unlocks it; press →
 *               the lock rattles and the row shakes
 *
 * The rail through the tiles is drawn by this row's own ::before (arriving)
 * and ::after (leaving), filled moss when the lesson it leaves is done.
 */
export default function LessonNode({
  lesson, index, isFirst, isLast, prevTitle,
  isPopupOpen, onTogglePopup, onStartLesson, tabbable = true,
}) {
  const { state, vm, showcase } = useProgression()
  const rowRef = useRef(null)
  const markRef = useRef(null)
  const isCurrent = lesson.status === 'current'
  const isLocked = lesson.status === 'locked'
  const isDone = lesson.status === 'completed'
  const outOfHearts = !vm.canStartLesson
  const record = state.lessons?.[lesson.id]

  /* Stamp the check when this lesson turns completed while on screen. */
  const prevStatus = useRef(lesson.status)
  const [justDone, setJustDone] = useState(false)
  useEffect(() => {
    const before = prevStatus.current
    prevStatus.current = lesson.status
    if (before === lesson.status || lesson.status !== 'completed') return undefined

    /* A lesson is completed INSIDE the lesson overlay, which covers this
       row. Wait until the overlay has gone, then stamp — so the learner
       returns to the map and sees the check land where they left off. */
    const timers = []
    let polls = 0
    const stamp = () => {
      if (document.querySelector('.lm-overlay') && polls++ < 120) {
        timers.push(window.setTimeout(stamp, 150))
        return
      }
      /* On the landing page the lesson is completed by a demo learner inside
         a touring frame: the frame brings the row into view, and the page
         itself must never be scrolled out from under the reader. */
      if (!showcase) rowRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
      timers.push(window.setTimeout(() => {
        setJustDone(true)
        timers.push(window.setTimeout(() => {
          ring(markRef.current, { color: '--moss', size: 64 })
          burst(markRef.current, { palette: 'moss', count: 14, spread: 46 })
        }, 180))
        timers.push(window.setTimeout(() => setJustDone(false), 1400))
      }, showcase ? 0 : 420))
    }
    stamp()
    return () => timers.forEach(clearTimeout)
  }, [lesson.status])

  const deny = () => {
    shake(rowRef.current, { distance: 4 })
    const lock = markRef.current
    lock?.classList.add('is-denied')
    window.setTimeout(() => lock?.classList.remove('is-denied'), 500)
  }

  const handleClick = () => {
    if (isLocked) { deny(); return }
    if (isCurrent) { onStartLesson?.(lesson.id); return }
    onTogglePopup()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }

  const tip = isLocked
    ? prevTitle ? `Finish “${prevTitle}” to unlock` : 'Finish the previous module to unlock'
    : undefined

  return (
    <li
      className={`lesson${justDone ? ' just-done' : ''}${isPopupOpen ? ' is-previewing' : ''}`}
      data-status={lesson.status}
      data-first={isFirst || undefined}
      data-last={isLast || undefined}
      style={{ '--i': index }}
    >
      <div
        ref={rowRef}
        className={`lesson-row lesson-row--${lesson.status}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={tabbable ? 0 : -1}
        aria-disabled={isLocked || undefined}
        aria-label={`${lesson.title} — ${isLocked ? `locked. ${tip}` : lesson.status}`}
        aria-expanded={!isLocked && !isCurrent ? isPopupOpen : undefined}
        data-tip={tip}
      >
        <span className={`lesson-tile${isCurrent ? ' fx-ping' : ''}`}>{getLessonIcon(lesson.id)}</span>

        <span className="lesson-info">
          <span className="lesson-label tnum">
            {isCurrent ? 'Up next' : `Lesson ${index + 1}`}{lesson.duration ? ` · ${lesson.duration}` : ''}
          </span>
          <span className="lesson-title">{lesson.title}</span>
        </span>

        {/* What pressing this row would do, revealed on hover. */}
        {!isLocked && !isCurrent && (
          <span className="lesson-peek" aria-hidden="true">
            {isDone ? (
              <>
                {record?.perfect && (
                  <span className="lesson-peek-star" data-tip="Finished without losing a heart">
                    <Icon name="star" size={12} strokeWidth={2.4} />
                  </span>
                )}
                Review
              </>
            ) : (
              <><BoltIcon size={12} /> +{XP.LESSON} XP</>
            )}
            <Icon name="chevron-right" size={13} strokeWidth={2.6} className="lesson-peek-arrow" />
          </span>
        )}

        {isDone && (
          <span ref={markRef} className={`lesson-mark lesson-mark--done${justDone ? ' is-stamping' : ''}`} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="ico-check" pathLength="1" d="M20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {isLocked && (
          <span ref={markRef} className="lesson-mark lesson-mark--locked" aria-hidden="true">
            <Icon name="lock" size={13} strokeWidth={2.2} />
          </span>
        )}
      </div>

      {isCurrent && (
        <div className="lesson-panel">
          <p className="lesson-panel-desc">{lesson.desc}</p>
          <div className="lesson-panel-meta">
            <span data-tip="For finishing it the first time"><BoltIcon size={13} /> +{XP.LESSON} XP</span>
            <span data-tip="Wrong answers cost a heart"><HeartIcon size={13} /> {vm.hearts} to spend</span>
          </div>
          {outOfHearts && (
            <p className="lesson-warn">
              <HeartIcon size={13} empty /> No hearts left — try Practice instead
            </p>
          )}
          <button
            type="button"
            className="btn btn-next fx-shine"
            onClick={() => onStartLesson?.(lesson.id)}
            data-magnetic="6"
            tabIndex={tabbable ? 0 : -1}
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

          {isDone && record && (
            <p className="lesson-popup-record">
              {record.perfect ? 'Perfect run' : `Best accuracy ${Math.round((record.bestAccuracy ?? 0) * 100)}%`}
              {' · '}review keeps your streak, pays no XP
            </p>
          )}

          {outOfHearts && !isDone && (
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
            {isDone ? 'Review lesson' : 'Start lesson'}
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </li>
  )
}
