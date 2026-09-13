/* ═══════════════════════════════════════════════════════════════════════════
   Footer.jsx — THE LAST LINE
   ---------------------------------------------------------------------------
   What it carries is what is true: the one privacy fact that matters (nothing
   leaves the browser), and a way back to the top.

   It does not repeat the course links. The page has exactly two ways into the
   course — the navbar's button and the closing CTA directly above this — and
   a third, one line below the second, would only dilute them. The section
   links already live in the navbar, which never hides.
   ═══════════════════════════════════════════════════════════════════════════ */

const LETTERS = ['L', 'u', 'n', 'X']
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-left">
        {/* The wordmark's letters ripple when the pointer crosses them. */}
        <button
          type="button"
          className="footer-logo-text"
          onClick={toTop}
          aria-label="LunX — back to top"
        >
          {LETTERS.map((ch, i) => (
            <span key={i} className="wm-letter" style={{ '--i': i }} aria-hidden="true">{ch}</span>
          ))}
        </button>
        <span className="footer-copy">
          No accounts, no tracking. Your progress never leaves this browser.
        </span>
      </div>

      <button
        type="button"
        className="footer-top"
        onClick={toTop}
        aria-label="Back to top"
        data-tip="Back to top"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
        </svg>
      </button>
    </footer>
  )
}
