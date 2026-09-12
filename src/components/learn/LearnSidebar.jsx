/* ═══════════════════════════════════════════════════════════════════════════
   LearnSidebar.jsx — PRIMARY APP NAVIGATION
   ---------------------------------------------------------------------------
   One icon family, drawn to a single spec so the strip reads as a set rather
   than as eight separately-sourced pictures:

     · 24×24 box, currentColor strokes, 2.1px weight, round caps and joins
     · shapes built from large simple forms — no detail below ~2px, because
       none of it survives at the 20px the sidebar actually renders
     · fills used only for small solid accents (a pupil, a flame core), never
       for a whole shape, so no icon reads as "the filled one"

   The nav is grouped by how often a destination is used rather than by
   category: what you do daily, then what you check occasionally, then who
   you are. Profile and More are pinned to the bottom, which is where an app
   of this shape trains people to look for them.
   ═══════════════════════════════════════════════════════════════════════════ */

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
  <svg {...ico}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M9.75 20v-5.5h4.5V20" />
  </svg>
)

const LearnIcon = () => (
  <svg {...ico}>
    <path d="M3 4.5h5a3.5 3.5 0 0 1 4 3.2 3.5 3.5 0 0 1 4-3.2h5v12h-5a3.5 3.5 0 0 0-4 2.8 3.5 3.5 0 0 0-4-2.8H3z" />
    <path d="M12 7.7v11.6" />
  </svg>
)

const PracticeIcon = () => (
  <svg {...ico}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

const LeaderboardIcon = () => (
  <svg {...ico}>
    <path d="M4.5 20h15" />
    <path d="M6 20v-6h4v6" />
    <path d="M14 20V9h4v11" />
    <path d="M10 20v-9" />
  </svg>
)

const QuestIcon = () => (
  <svg {...ico}>
    <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z" />
  </svg>
)

const ShopIcon = () => (
  <svg {...ico}>
    <path d="M4.5 8.5h15L18.5 20h-13z" />
    <path d="M4.5 8.5 6.5 4.5h11l2 4" />
    <path d="M9 12a3 3 0 0 0 6 0" />
  </svg>
)

const ProfileIcon = () => (
  <svg {...ico}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

const MoreIcon = () => (
  <svg {...ico}>
    <circle cx="12" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

/* `action: 'home'` leaves the learning app entirely; everything else swaps the
   view. Kept as data so the markup below has one code path. */
const NAV_GROUPS = [
  {
    id: 'primary',
    label: 'Learn',
    items: [
      { id: 'home',     label: 'Home',     Icon: HomeIcon, action: 'home' },
      { id: 'learn',    label: 'Learn',    Icon: LearnIcon },
      { id: 'practice', label: 'Practice', Icon: PracticeIcon },
    ],
  },
  {
    id: 'secondary',
    label: 'Progress',
    items: [
      { id: 'leaderboards', label: 'Leaderboards', Icon: LeaderboardIcon },
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

export default function LearnSidebar({ active, onChange, onGoHome }) {
  const renderItem = (item) => {
    const isActive = active === item.id
    return (
      <li key={item.id} className="ls-nav-item">
        <button
          type="button"
          className={`ls-nav-btn${isActive ? ' active' : ''}`}
          onClick={() => (item.action === 'home' ? onGoHome() : onChange(item.id))}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="ls-nav-icon"><item.Icon /></span>
          <span className="ls-nav-label">{item.label}</span>
        </button>
      </li>
    )
  }

  return (
    <nav className="learn-sidebar" aria-label="Learning navigation">
      <button className="ls-logo" onClick={onGoHome} aria-label="Return to LunX home">
        <span className="ls-logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2h2.5v8H10v2H2V2Z" fill="#FBF7F0" />
          </svg>
        </span>
        LunX
      </button>

      <div className="ls-nav">
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
