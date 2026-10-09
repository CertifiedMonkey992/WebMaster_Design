/* ═══════════════════════════════════════════════════════════════════════════
   LearnSidebar.jsx — PRIMARY APP NAVIGATION
   ---------------------------------------------------------------------------
   Revision 3 (2026-10): the icons are full-colour illustrations drawn to a
   reference the product owner supplied (NavIcons.jsx, VISUAL_SYSTEM.md →
   The nav icons). Each still has ONE move that depicts the destination —
   played on hover, and held while active:

     Home        the globe turns           Learn     the roof lifts
     Practice    the dumbbell is lifted    Quests    the chest hops
     Shop        the awning lifts          Profile   the head nods

   A quest waiting to be claimed also puts the red dot on the chest.

   Two moving objects replace per-item tints:
     · a HOVER GHOST that slides between items under the pointer
     · the ACTIVE RAIL, which travels to the new item when the view changes
   Both are measured from the real buttons, so they follow the layout at any
   width — including the horizontal strip on a phone, where they run along
   the bottom edge instead.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { HomeIcon, AboutIcon, LearnIcon, PracticeIcon, QuestIcon, ShopIcon, ProfileIcon } from './NavIcons'

const NAV_GROUPS = [
  {
    id: 'primary',
    label: 'Learn',
    items: [
      { id: 'home',     label: 'Home',     Icon: HomeIcon, action: 'home', tip: 'Back to the LunX front page' },
      { id: 'about',    label: 'About',    Icon: AboutIcon, action: 'about', tip: 'Our story and the TSA compliance statement' },
      { id: 'learn',    label: 'Learn',    Icon: LearnIcon },
      { id: 'practice', label: 'Practice', Icon: PracticeIcon, tip: 'Free review — never costs a heart' },
    ],
  },
  {
    id: 'secondary',
    label: 'Progress',
    items: [
      { id: 'quests', label: 'Quests', Icon: QuestIcon },
      { id: 'shop',   label: 'Shop',   Icon: ShopIcon },
    ],
  },
  {
    id: 'account',
    label: 'You',
    footer: true,
    items: [
      { id: 'profile', label: 'Profile', Icon: ProfileIcon },
    ],
  },
]

export default function LearnSidebar({ active, onChange, onGoHome, onGoAbout, badges = {} }) {
  const navRef = useRef(null)
  const [hover, setHover] = useState(null)

  /* Measure a button against the nav container and write the result as CSS
     variables for the rail (active) or the ghost (hover). */
  const measure = useCallback((id, prefix) => {
    const nav = navRef.current
    if (!nav) return
    const btn = id ? nav.querySelector(`[data-nav="${id}"]`) : null
    if (!btn) {
      nav.style.setProperty(`--${prefix}-o`, '0')
      return
    }
    const n = nav.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    nav.style.setProperty(`--${prefix}-x`, `${b.left - n.left + nav.scrollLeft}px`)
    nav.style.setProperty(`--${prefix}-y`, `${b.top - n.top + nav.scrollTop}px`)
    nav.style.setProperty(`--${prefix}-w`, `${b.width}px`)
    nav.style.setProperty(`--${prefix}-h`, `${b.height}px`)
    nav.style.setProperty(`--${prefix}-o`, '1')
  }, [])

  useLayoutEffect(() => {
    measure(active, 'rail')
    const onResize = () => measure(active, 'rail')
    window.addEventListener('resize', onResize)
    /* Webfonts change label widths after first paint. */
    document.fonts?.ready?.then(onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active, measure])

  useLayoutEffect(() => { measure(hover, 'ghost') }, [hover, measure])

  const renderItem = (item) => {
    const isActive = active === item.id
    const badge = badges[item.id]
    return (
      <li key={item.id} className="ls-nav-item">
        <button
          type="button"
          data-nav={item.id}
          className={`ls-nav-btn${isActive ? ' active' : ''}`}
          onClick={() => {
            if (item.action === 'home') onGoHome()
            else if (item.action === 'about') onGoAbout?.()
            else onChange(item.id)
          }}
          onPointerEnter={() => setHover(item.id)}
          onFocus={() => setHover(item.id)}
          aria-current={isActive ? 'page' : undefined}
          data-tip={item.tip}
          data-tip-side="right"
        >
          <span className="ls-nav-icon"><item.Icon alert={item.id === 'quests' && badge > 0} /></span>
          <span className="ls-nav-label">{item.label}</span>
          {badge > 0 && (
            <span className="ls-nav-badge" key={badge} aria-label={`${badge} ready`}>{badge}</span>
          )}
        </button>
      </li>
    )
  }

  return (
    <nav className="learn-sidebar" aria-label="Learning navigation">
      <button className="ls-logo" onClick={onGoHome} aria-label="Return to LunX home">
        <span className="ls-logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
          </svg>
        </span>
        <span className="ls-logo-text" aria-hidden="true">
          {['L', 'u', 'n', 'X'].map((ch, i) => (
            <span key={i} className="wm-letter" style={{ '--i': i }}>{ch}</span>
          ))}
        </span>
      </button>

      <div
        className="ls-nav"
        ref={navRef}
        onPointerLeave={() => setHover(null)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(null) }}
      >
        <span className="ls-ghost" aria-hidden="true" />
        <span className="ls-rail" aria-hidden="true" />
        {NAV_GROUPS.map((group) => (
          <div
            key={group.id}
            className={`ls-group${group.footer ? ' ls-group--footer' : ''}`}
          >
            <div className="ls-group-label">{group.label}</div>
            <ul className="ls-group-list">
              {group.items.map(renderItem)}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
