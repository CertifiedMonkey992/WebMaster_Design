/* ═══════════════════════════════════════════════════════════════════════════
   HomeHeader.jsx — THE HOME PAGE'S TOP EDGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → Home header. Sticky, 70px: the wordmark
   and its line at the left, the page's sections in the middle (each label
   rolls over to a copy of itself on hover), and the account at the right —
   Sign in and Get started, or the learner's name and Continue. A rule
   appears under it once the hero's buttons have scrolled away.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'
import { RollText } from '../../motion/TextFx'

const SECTIONS = [
  { id: 'parts', label: 'Course' },
  { id: 'inside', label: 'Inside' },
  { id: 'lessons', label: 'Lessons' },
]

export const jumpTo = (id) => (event) => {
  const el = document.getElementById(id)
  if (!el) return
  event.preventDefault()
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.focus?.({ preventScroll: true })
}

export default function HomeHeader({ watch = '.home-hero-actions' }) {
  const { account, displayName } = useAuth()
  const [past, setPast] = useState(false)

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
          <span className="hh-logo-words" aria-hidden="true">
            <span className="hh-logo-text">
              {['L', 'u', 'n', 'X'].map((ch, i) => (
                <span key={i} className="wm-letter" style={{ '--i': i }}>{ch}</span>
              ))}
            </span>
            <span className="hh-logo-sub">Field guide to AI</span>
          </span>
        </PageLink>

        <ul className="hh-nav">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a className="hh-link" href={`#${s.id}`} onClick={jumpTo(s.id)}><RollText>{s.label}</RollText></a>
            </li>
          ))}
          <li><PageLink page="about" className="hh-link"><RollText>About</RollText></PageLink></li>
        </ul>

        <div className="hh-actions">
          {account ? (
            <>
              <PageLink
                page="learn"
                className={`nav-profile hh-profile${account.role === 'judge' ? ' is-judge' : ''}`}
                aria-label={`Signed in as ${displayName}. Open the course.`}
              >
                <span className="nav-profile-mark" aria-hidden="true">{initial || '·'}</span>
                <span className="nav-profile-name">{displayName}</span>
              </PageLink>
              <PageLink page="learn" className="btn btn-primary hh-btn">Continue</PageLink>
            </>
          ) : (
            <>
              <PageLink page="signin" section="signin" className="btn btn-outline hh-btn">Sign in</PageLink>
              <PageLink page="learn" className="btn btn-primary hh-btn">Get started</PageLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
