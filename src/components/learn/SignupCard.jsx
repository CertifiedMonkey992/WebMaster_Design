/* ═══════════════════════════════════════════════════════════════════════════
   SignupCard.jsx — WHERE YOUR PROGRESS ACTUALLY LIVES
   ---------------------------------------------------------------------------
   There is no account system and no sync, so this says what is true and
   offers the one thing the product can do about it: the Profile page
   exports progress as a file, which imports again on another device.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SignupCard({ onExport, style, className = '' }) {
  return (
    <aside className={`rail-note ${className}`.trim()} style={style}>
      <p className="rail-note-body">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6Z" />
          <path d="m8.5 12 2.4 2.4 4.6-4.8" />
        </svg>
        Progress is saved in this browser. Export it from your profile to move it
        to another device; clearing site data clears the course.
      </p>
      <button type="button" className="rail-note-link" onClick={onExport}>
        Export progress
      </button>
    </aside>
  )
}
