/* ═══════════════════════════════════════════════════════════════════════════
   PageLoading.jsx — WHILE A PAGE'S CODE ARRIVES
   ---------------------------------------------------------------------------
   The course app, the About page and the site's plain pages are loaded when
   first needed, so the home page downloads less. On a fast connection the
   next page is already fetched (App.jsx preloads it when the browser is
   idle) and this never shows; on a slow one it appears after a short delay,
   says what is happening, and announces itself to screen readers.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function PageLoading({ label = 'Opening the page…' }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h2.5v8H10v2H2V2Z" fill="currentColor" />
        </svg>
      </span>
      <span className="page-loading-bar" aria-hidden="true" />
      <p className="page-loading-text">{label}</p>
    </div>
  )
}
