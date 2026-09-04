const NAV_GROUPS = [
  {
    label: 'Learn',
    items: [
      {
        id: 'learn',
        label: 'Learn',
        color: '#6366F1',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        ),
      },
      {
        id: 'practice',
        label: 'Practice',
        color: '#06B6D4',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        id: 'leaderboards',
        label: 'Leaderboards',
        color: '#F59E0B',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 21h8M12 17v4M5 3H2v7c0 3.31 2.69 6 6 6h8c3.31 0 6-2.69 6-6V3h-3"/>
            <rect x="5" y="3" width="14" height="10" rx="1"/>
          </svg>
        ),
      },
      {
        id: 'quests',
        label: 'Quests',
        color: '#F59E0B',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Personal',
    items: [
      {
        id: 'shop',
        label: 'Shop',
        color: '#A78BFA',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        ),
      },
      {
        id: 'profile',
        label: 'Profile',
        color: '#94A3B8',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
    ],
  },
]

const MORE_ITEM = {
  id: 'more',
  label: 'More',
  color: '#64748B',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="5" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="19" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
}

export default function LearnSidebar({ active, onChange, onGoHome }) {
  return (
    <nav className="learn-sidebar" aria-label="Learning navigation">
      <button className="ls-logo" onClick={onGoHome} aria-label="Return to LunX home">
        <span className="ls-logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2h2.5v8H10v2H2V2Z" fill="#fff"/>
          </svg>
        </span>
        LunX
      </button>

      <div className="ls-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="ls-group">
            <div className="ls-group-label">{group.label}</div>
            {group.items.map((item) => (
              <div key={item.id} className="ls-nav-item">
                <button
                  className={`ls-nav-btn${active === item.id ? ' active' : ''}`}
                  onClick={() => onChange(item.id)}
                  aria-current={active === item.id ? 'page' : undefined}
                  style={{ '--nav-color': item.color }}
                >
                  <span className="ls-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className="ls-separator" />
        <div className="ls-nav-item">
          <button
            className={`ls-nav-btn ls-more${active === 'more' ? ' active' : ''}`}
            onClick={() => onChange('more')}
            aria-current={active === 'more' ? 'page' : undefined}
            style={{ '--nav-color': MORE_ITEM.color }}
          >
            <span className="ls-nav-icon">{MORE_ITEM.icon}</span>
            {MORE_ITEM.label}
          </button>
        </div>
      </div>
    </nav>
  )
}
