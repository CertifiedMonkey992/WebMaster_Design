/* ═══════════════════════════════════════════════════════════════════════════
   Footer.jsx — THE LAST LINE
   ---------------------------------------------------------------------------
   What it carries is what is true: the one privacy fact that matters (your
   progress never leaves the browser), the site's pages, and a way back to
   the top.

   It does not repeat the course button. The closing CTA directly above is
   the way in at the bottom of the page, and a second button one line below
   it would only dilute it. The page links are real links (nav.jsx), so they
   work with a middle-click, a keyboard and a crawler alike.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PageLink, useNav } from '../nav'
import { SITE } from '../site'
import { reopenChoices } from '../services/analytics'

const LETTERS = ['L', 'u', 'n', 'X']
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const PAGES = [
  { page: 'landing', label: 'Home' },
  { page: 'about', label: 'About LunX' },
  { page: 'about', section: 'method', label: 'How a lesson works' },
  { page: 'about', section: 'compliance', label: 'TSA compliance' },
  { page: 'contact', label: 'Contact' },
  { page: 'privacy', label: 'Privacy policy' },
  { page: 'terms', label: 'Terms of use' },
]

export default function Footer() {
  const { page: current } = useNav()
  return (
    <footer className="footer">
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
          No accounts{SITE.analytics.enabled ? '' : ', no tracking'}. Your progress never leaves this browser.
        </span>
      </div>

      <nav className="footer-links" aria-label="Site pages">
        {PAGES.filter((l) => l.section || l.page !== current).map((l) => (
          <PageLink key={l.label} page={l.page} section={l.section} className="btn btn-ghost btn-sm">
            {l.label}
          </PageLink>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={reopenChoices}>
          Privacy choices
        </button>
      </nav>

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
