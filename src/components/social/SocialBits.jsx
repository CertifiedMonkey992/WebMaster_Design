/* ═══════════════════════════════════════════════════════════════════════════
   SocialBits.jsx — THE SMALL PIECES FRIENDS AND LEAGUES SHARE (revision 10)
   ---------------------------------------------------------------------------
     Avatar     a round avatar: initials on one of seven warm grounds
                (VISUAL_SYSTEM.md → Avatars). No photos.
     TestTag    the printed label every test account carries, everywhere
     Countdown  time left, ticking once a second (MOTION_RULES.md → Clocks)
     Notice     one line of state: loading, an error with a retry, or empty
   ═══════════════════════════════════════════════════════════════════════════ */

import { useClock } from '../../state/ProgressionContext'
import { formatDuration } from '../../utils/dateUtils'
import { Icon } from '../progression/Icons'
import './social.css'

export const AVATAR_COLORS = ['evergreen', 'clay', 'moss', 'ochre', 'berry', 'ink', 'tan']

/** "Maya_R" → "MR", "Robin" → "RO", "TSA_Judge" → "TJ". */
export function initialsOf(name) {
  const parts = String(name ?? '').split(/[_\s]+/).filter(Boolean)
  if (!parts.length) return 'L'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Avatar({ name, color = 'evergreen', size = 28, className = '' }) {
  const tone = AVATAR_COLORS.includes(color) ? color : 'evergreen'
  return (
    <span className={`av av--${tone} ${className}`.trim()} style={{ '--av-size': `${size}px` }} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}

export function TestTag() {
  return <span className="test-tag" title="A test account — not a real person">Test account</span>
}

/** Time left until `endAt`, ticking. */
export function Countdown({ endAt, prefix = '', className = '' }) {
  const now = useClock()
  const left = Math.max(0, endAt - now)
  return (
    <span className={`cd ${className}`.trim()}>
      <Icon name="clock" size={12} />
      {prefix}{left > 0 ? formatDuration(left) : 'ending now'}
    </span>
  )
}

/** The end of a period, in the reader's own time: "Sunday, 12:00 AM". */
export function endsAt(t) {
  return new Date(t).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
}

/**
 * A line of state where a list would be: loading, an error (with retry), or
 * an empty state — COMPONENT_RULES.md → Empty state.
 */
export function Notice({ kind = 'empty', title, children, onRetry, action = null }) {
  return (
    <div className={`sn sn--${kind}`} role={kind === 'error' ? 'alert' : undefined} aria-live={kind === 'loading' ? 'polite' : undefined}>
      {title && <p className="sn-title">{title}</p>}
      {children && <p className="sn-body">{children}</p>}
      {(onRetry || action) && (
        <div className="sn-actions">
          {onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}><Icon name="refresh" size={16} /> Try again</button>}
          {action}
        </div>
      )}
    </div>
  )
}

export default { Avatar, TestTag, Countdown, Notice, initialsOf, endsAt, AVATAR_COLORS }
