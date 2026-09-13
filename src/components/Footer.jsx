/* ═══════════════════════════════════════════════════════════════════════════
   Footer.jsx — THE LAST LINE
   ---------------------------------------------------------------------------
   The footer used to carry About / Privacy / Terms / GitHub, all pointing at
   "#". Four links that go nowhere are four misleading affordances, and none of
   those pages exist. What it carries now is what is true: where to go on this
   page, the one privacy fact that matters (nothing leaves the browser), and a
   way back to the top.
   ═══════════════════════════════════════════════════════════════════════════ */

const LETTERS = ['L', 'u', 'n', 'X']

export default function Footer({ onStartLearning }) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-left">
        {/* The wordmark's letters ripple when the pointer crosses them. */}
        <button
          type="button"
          className="footer-logo-text"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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

      <ul className="footer-links" role="list">
        <li><a href="#learn" className="footer-link">The course</a></li>
        <li><a href="#streak" className="footer-link">Streaks</a></li>
        <li><a href="#daily-bonus" className="footer-link">Rewards</a></li>
        <li>
          <button type="button" className="footer-link footer-link--go" onClick={onStartLearning}>
            Start learning
          </button>
        </li>
        <li>
          <button
            type="button"
            className="footer-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            data-tip="Back to top"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </li>
      </ul>
    </footer>
  )
}
