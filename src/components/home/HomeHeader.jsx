/* ═══════════════════════════════════════════════════════════════════════════
   HomeHeader.jsx — THE HOME PAGE'S TOP EDGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12 → Home header.

   Fixed, 70px, content in the page's 988px column. At the top of the page it
   is quiet — the wordmark, About, and the account control — because the
   hero's two buttons are right below it. Once those buttons have scrolled
   away, a rule appears under the bar and a small ledge button slides in at
   the right: the way into the course never leaves the screen.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'

export default function HomeHeader({ watch = '.home-hero-actions' }) {
  const { account, displayName } = useAuth()
  const [past, setPast] = useState(false)

  /* "Past" once the hero's buttons are above the bar. */
  useEffect(() => {
    const target = document.querySelector(watch)
    if (!target || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 70),
      { rootMargin: '-70px 0px 0px 0px' },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [watch])

  const initial = displayName?.replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase()

  return (
    <header className={`hh${past ? ' is-past' : ''}`}>
      <nav className="hh-bar" aria-label="Main navigation">
        <PageLink page="landing" className="hh-logo" aria-label="LunX home">
          <span className="hh-logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 14 14"><path d="M2 2h2.5v8H10v2H2V2Z" /></svg>
          </span>
          <span className="hh-logo-text" aria-hidden="true">
            {['L', 'u', 'n', 'X'].map((ch, i) => (
              <span key={i} className="wm-letter" style={{ '--i': i }}>{ch}</span>
            ))}
          </span>
        </PageLink>

        <div className="hh-actions">
          <PageLink page="about" className="hh-quiet">About</PageLink>
          {account ? (
            <PageLink
              page="learn"
              className={`nav-profile hh-profile${account.role === 'judge' ? ' is-judge' : ''}`}
              aria-label={`Signed in as ${displayName}. Open the course.`}
            >
              <span className="nav-profile-mark" aria-hidden="true">{initial || '·'}</span>
              <span className="nav-profile-name">{displayName}</span>
            </PageLink>
          ) : (
            <PageLink page="signin" section="signin" className="hh-quiet">Sign in</PageLink>
          )}
          {/* The slot opens to the button's width as it arrives. */}
          <span className="hh-cta-slot">
            <PageLink
              page="learn"
              className="btn btn-primary btn-ledge btn-sm hh-cta"
              tabIndex={past ? undefined : -1}
              aria-hidden={past ? undefined : 'true'}
            >
              {account ? 'Continue' : 'Get started'}
            </PageLink>
          </span>
        </div>
      </nav>
    </header>
  )
}
