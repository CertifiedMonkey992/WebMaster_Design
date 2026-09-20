/* ═══════════════════════════════════════════════════════════════════════════
   SignupCard.jsx — WHERE YOUR PROGRESS ACTUALLY LIVES
   ---------------------------------------------------------------------------
   There is no server and no sync, so this says what is true and offers the
   two things the product can actually do about it: the Profile page exports
   progress as a file, which imports again on another device; and a profile
   keeps two people apart on one browser.

   It deliberately does NOT sell the profile. Signing in adds nothing to the
   course — it only separates one learner's progress from another's on the
   same machine — so offering it as a benefit would be a promise the product
   does not keep.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PageLink } from '../../nav'

export default function SignupCard({ onExport, style, className = '' }) {
  return (
    <aside className={`rail-note ${className}`.trim()} style={style}>
      <p className="rail-note-body">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6Z" />
          <path d="m8.5 12 2.4 2.4 4.6-4.8" />
        </svg>
        Progress is saved in this browser. Export it from your profile to move it
        to another device; clearing site data clears the course. Sharing this
        computer? A <PageLink page="signin" className="rail-note-link-inline">local
        profile</PageLink> keeps your progress separate.
      </p>
      <button type="button" className="rail-note-link" onClick={onExport}>
        Export progress
      </button>
    </aside>
  )
}
