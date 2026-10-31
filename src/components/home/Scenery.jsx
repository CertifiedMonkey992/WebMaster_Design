/* ═══════════════════════════════════════════════════════════════════════════
   Scenery.jsx — THE HOME PAGE'S SMALL OBJECTS
   ---------------------------------------------------------------------------
   Floater      an object hung in a scene at a position, drifting on its own
                seeded period (MOTION_RULES.md → Revision 12, Ambient). The
                drift runs on an inner element so an arrival animation on the
                outer one never fights it.
   ChapterTile  a module's tile: its chapter ink, a ledge in its own shade,
                and either a lesson icon or the module's number.
   ═══════════════════════════════════════════════════════════════════════════ */

import { CHAPTER_INK } from '../guide/guideData'

export function Floater({ at, seed = 0, k = 1, r = 0, className = '', style, children }) {
  return (
    <span className={`os-obj ${className}`.trim()} style={{ ...style, ...at }}>
      <span className="os-drift" style={{ '--seed': seed, '--k': k, '--r': `${r}deg` }}>
        {children}
      </span>
    </span>
  )
}

export function ChapterTile({ j, size = 'md', className = '', children }) {
  return (
    <span
      className={`ct ct--${size} ${className}`.trim()}
      style={{ '--chapter': `var(${CHAPTER_INK[j % CHAPTER_INK.length]})` }}
    >
      {children}
    </span>
  )
}
