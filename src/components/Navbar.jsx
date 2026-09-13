/* ═══════════════════════════════════════════════════════════════════════════
   Navbar.jsx — THE LANDING PAGE'S TOP EDGE
   ---------------------------------------------------------------------------
   Four behaviours, each reporting something:

     · a clay rule along the bottom edge fills with how far down the page
       you have read
     · the bar steps out of the way while you scroll down and comes back the
       moment you scroll up (or tab into it)
     · the link for the section you are reading stays underlined
     · ONE ink underline slides between links as the pointer moves, rather
       than each link growing its own — the reference's colour-changing list
       done as a single moving object

   The wordmark's letters ripple on hover; the mark turns.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const LINKS = [
  { id: 'learn', label: 'Course' },
  { id: 'streak', label: 'Streaks' },
  { id: 'daily-bonus', label: 'Rewards' },
  { id: 'quests', label: 'Quests' },
]

export default function Navbar({ onStartLearning }) {
  const navRef = useRef(null)
  const listRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [tucked, setTucked] = useState(false)
  const [active, setActive] = useState(null)
  const [hover, setHover] = useState(null)

  /* Scroll: progress, tucking, hairline. One rAF per frame at most. */
  useEffect(() => {
    let lastY = window.scrollY
    let raf = 0
    const run = () => {
      raf = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      navRef.current?.style.setProperty('--scroll', max > 0 ? (y / max).toFixed(4) : '0')
      setScrolled(y > 24)
      if (Math.abs(y - lastY) > 8) {
        setTucked(y > lastY && y > 360)
        lastY = y
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run) }
    run()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
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
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    const top = () => { if (window.scrollY < 300) setActive(null) }
    window.addEventListener('scroll', top, { passive: true })
    return () => { observer.disconnect(); window.removeEventListener('scroll', top) }
  }, [])

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
      className={`navbar${scrolled ? ' scrolled' : ''}${tucked ? ' is-tucked' : ''}`}
      aria-label="Main navigation"
    >
      <a href="#" className="nav-logo" aria-label="LunX home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
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
        {LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
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
          would promise an account the product cannot create. Progress persists
          in the browser instead, which is what the closing CTA says. */}
      <div className="nav-actions">
        <button
          className="btn btn-primary"
          onClick={onStartLearning}
          aria-label="Start learning for free"
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
