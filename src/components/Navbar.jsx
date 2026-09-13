/* ═══════════════════════════════════════════════════════════════════════════
   Navbar.jsx — THE LANDING PAGE'S TOP EDGE
   ---------------------------------------------------------------------------
   The button at the right is one of only two ways into the course on this
   page (the other is the closing CTA), so the bar never hides. What it does
   instead, each reporting something:

     · compresses once the page moves — the paper strip shortens and the
       wordmark settles, so the bar takes less of the reading space
     · a clay rule along its bottom edge fills with how far down you have read
     · the link for the section you are reading stays underlined
     · ONE ink underline slides between links as the pointer moves, rather
       than each link growing its own
     · when the hero (and everything else on screen that mentions the course)
       scrolls away, the button's surface catches the light once: it is now
       the way in

   The wordmark's letters ripple on hover; the mark turns.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const LINKS = [
  { id: 'learn', label: 'Course' },
  { id: 'streak', label: 'Streaks' },
  { id: 'daily-bonus', label: 'Daily bonus' },
  { id: 'quests', label: 'Quests' },
]

/* Props beyond the landing page's defaults:
     links        the section links, for a page whose sections differ
     scrollLinks  scroll to a section instead of following its fragment —
                  for a page that lives at its own address (#/about), which a
                  fragment would overwrite
     onLogoClick  what the wordmark does (default: back to the top)
     pageLink     { label, onClick } — a quiet link to the site's other page,
                  beside the one solid button. It stays visible on a phone,
                  where the section links are hidden. */
export default function Navbar({ onStartLearning, links = LINKS, scrollLinks = false, onLogoClick, pageLink }) {
  const navRef = useRef(null)
  const listRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [cued, setCued] = useState(false)
  const [active, setActive] = useState(null)
  const [hover, setHover] = useState(null)

  /* Scroll: progress and compression. One rAF per frame at most, and state
     only changes when a threshold is actually crossed. */
  useEffect(() => {
    let raf = 0
    let wasPast = window.scrollY > window.innerHeight * 0.7
    let cueTimer = 0
    const run = () => {
      raf = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      navRef.current?.style.setProperty('--scroll', max > 0 ? (y / max).toFixed(4) : '0')
      setScrolled(y > 24)
      const past = y > window.innerHeight * 0.7
      if (past && !wasPast) {
        setCued(true)
        clearTimeout(cueTimer)
        cueTimer = window.setTimeout(() => setCued(false), 1200)
      }
      wasPast = past
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run) }
    run()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      clearTimeout(cueTimer)
    }
  }, [])

  /* Which section is under the reading line. */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    links.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    const top = () => { if (window.scrollY < 300) setActive(null) }
    window.addEventListener('scroll', top, { passive: true })
    return () => { observer.disconnect(); window.removeEventListener('scroll', top) }
  }, [links])

  const followLink = (e, id) => {
    if (!scrollLinks) return
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* The sliding underline follows hover, and rests on the active link. */
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const id = hover ?? active
    const link = id ? list.querySelector(`[data-link="${id}"]`) : null
    if (!link) {
      list.style.setProperty('--ink-o', '0')
      return
    }
    list.style.setProperty('--ink-x', `${link.offsetLeft}px`)
    list.style.setProperty('--ink-w', `${link.offsetWidth}px`)
    list.style.setProperty('--ink-o', '1')
  }, [hover, active])

  return (
    <nav
      ref={navRef}
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      aria-label="Main navigation"
    >
      <a href="#" className="nav-logo" aria-label="LunX home" onClick={(e) => { e.preventDefault(); if (onLogoClick) onLogoClick(); else window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
        <span className="nav-logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
          </svg>
        </span>
        <span className="nav-logo-text" aria-hidden="true">
          {['L', 'u', 'n', 'X'].map((ch, i) => (
            <span key={i} className="wm-letter" style={{ '--i': i }}>{ch}</span>
          ))}
        </span>
      </a>

      <ul
        className="nav-links"
        role="list"
        ref={listRef}
        onPointerLeave={() => setHover(null)}
      >
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              onClick={(e) => followLink(e, link.id)}
              data-link={link.id}
              className={active === link.id ? 'is-active' : ''}
              aria-current={active === link.id ? 'location' : undefined}
              onPointerEnter={() => setHover(link.id)}
              onFocus={() => setHover(link.id)}
              onBlur={() => setHover(null)}
            >
              {link.label}
            </a>
          </li>
        ))}
        <li className="nav-ink" aria-hidden="true" />
      </ul>

      {/* No sign-in button: the login form has no backend, so offering it here
          would promise an account the product cannot create. */}
      <div className="nav-actions">
        {pageLink && (
          <button type="button" className="btn btn-ghost nav-page-link" onClick={pageLink.onClick}>
            {pageLink.label}
          </button>
        )}
        <button
          className={`btn btn-primary${cued ? ' is-cued' : ''}`}
          onClick={onStartLearning}
          aria-label="Start learning: open the course"
          data-magnetic="6"
        >
          Start learning
          <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <span className="nav-progress" aria-hidden="true" />
    </nav>
  )
}
