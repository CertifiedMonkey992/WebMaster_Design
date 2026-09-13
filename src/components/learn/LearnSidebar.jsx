/* ═══════════════════════════════════════════════════════════════════════════
   LearnSidebar.jsx — PRIMARY APP NAVIGATION
   ---------------------------------------------------------------------------
   One icon family, drawn to a single spec (24px box, 2.1px round strokes,
   large simple forms). Revision 2 gives each icon ONE move that depicts what
   the destination is — played on hover, and held while active:

     Home        the roof lifts            Learn     the pages open
     Practice    the rings close in        Boards    the bars grow
     Quests      the star turns            Shop      the bag handle hops
     Profile     the head nods             More      the dots wave

   Two moving objects replace per-item tints:
     · a HOVER GHOST that slides between items under the pointer
     · the ACTIVE RAIL, which travels to the new item when the view changes
   Both are measured from the real buttons, so they follow the layout at any
   width — including the horizontal strip on a phone, where they run along
   the bottom edge instead.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const ico = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const HomeIcon = () => (
  <svg {...ico} className="ni ni-home">
    <path className="ni-roof" d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path className="ni-door" d="M9.75 20v-5.5h4.5V20" />
  </svg>
)

const LearnIcon = () => (
  <svg {...ico} className="ni ni-learn">
    <path className="ni-page-l" d="M12 7.7a3.5 3.5 0 0 0-4-3.2H3v12h5a3.5 3.5 0 0 1 4 2.8" />
    <path className="ni-page-r" d="M12 7.7a3.5 3.5 0 0 1 4-3.2h5v12h-5a3.5 3.5 0 0 0-4 2.8" />
    <path d="M12 7.7v11.6" />
  </svg>
)

const PracticeIcon = () => (
  <svg {...ico} className="ni ni-practice">
    <circle className="ni-ring-o" cx="12" cy="12" r="8.5" />
    <circle className="ni-ring-i" cx="12" cy="12" r="4" />
    <circle className="ni-bull" cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

const LeaderboardIcon = () => (
  <svg {...ico} className="ni ni-board">
    <path d="M4.5 20h15" />
    <path className="ni-bar ni-bar--1" d="M6 20v-6h4v6" />
    <path className="ni-bar ni-bar--2" d="M14 20V9h4v11" />
    <path className="ni-bar ni-bar--3" d="M10 20v-9" />
  </svg>
)

const QuestIcon = () => (
  <svg {...ico} className="ni ni-quest">
    <path className="ni-star" d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z" />
  </svg>
)

const ShopIcon = () => (
  <svg {...ico} className="ni ni-shop">
    <path d="M4.5 8.5h15L18.5 20h-13z" />
    <path className="ni-bag-top" d="M4.5 8.5 6.5 4.5h11l2 4" />
    <path className="ni-handle" d="M9 12a3 3 0 0 0 6 0" />
  </svg>
)

const ProfileIcon = () => (
  <svg {...ico} className="ni ni-profile">
    <circle className="ni-head" cx="12" cy="8.5" r="3.8" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

const MoreIcon = () => (
  <svg {...ico} className="ni ni-more">
    <circle className="ni-dot ni-dot--1" cx="12" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
    <circle className="ni-dot ni-dot--2" cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle className="ni-dot ni-dot--3" cx="12" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const NAV_GROUPS = [
  {
    id: 'primary',
    label: 'Learn',
    items: [
      { id: 'home',     label: 'Home',     Icon: HomeIcon, action: 'home', tip: 'Back to the LunX front page' },
      { id: 'learn',    label: 'Learn',    Icon: LearnIcon },
      { id: 'practice', label: 'Practice', Icon: PracticeIcon, tip: 'Free review — never costs a heart' },
    ],
  },
  {
    id: 'secondary',
    label: 'Progress',
    items: [
      { id: 'leaderboards', label: 'Leaderboards', Icon: LeaderboardIcon, tip: 'Needs accounts — not built' },
      { id: 'quests',       label: 'Quests',       Icon: QuestIcon },
      { id: 'shop',         label: 'Shop',         Icon: ShopIcon },
    ],
  },
  {
    id: 'account',
    label: 'You',
    footer: true,
    items: [
      { id: 'profile', label: 'Profile', Icon: ProfileIcon },
      { id: 'more',    label: 'More',    Icon: MoreIcon },
    ],
  },
]

export default function LearnSidebar({ active, onChange, onGoHome, badges = {} }) {
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
          onClick={() => (item.action === 'home' ? onGoHome() : onChange(item.id))}
          onPointerEnter={() => setHover(item.id)}
          onFocus={() => setHover(item.id)}
          aria-current={isActive ? 'page' : undefined}
          data-tip={item.tip}
          data-tip-side="right"
        >
          <span className="ls-nav-icon"><item.Icon /></span>
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
            <ul className="ls-group-list" role="list">
              {group.items.map(renderItem)}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
