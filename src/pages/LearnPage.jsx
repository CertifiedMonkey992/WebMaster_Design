import { useState } from 'react'
import LearnSidebar from '../components/learn/LearnSidebar'
import ModuleList   from '../components/learn/ModuleList'
import RightSidebar from '../components/learn/RightSidebar'
import './LearnPage.css'

const PLACEHOLDER_VIEWS = {
  practice:     { icon: '✏️', title: 'Practice',     desc: 'Review and strengthen everything you\'ve learned so far.' },
  leaderboards: { icon: '🏆', title: 'Leaderboards', desc: 'See how you rank against learners from around the world.' },
  quests:       { icon: '⚡', title: 'Quests',       desc: 'Complete daily and weekly challenges to earn bonus XP.' },
  shop:         { icon: '🛍️', title: 'Shop',         desc: 'Spend your hard-earned XP on rewards and power-ups.' },
  profile:      { icon: '👤', title: 'Profile',      desc: 'Track your stats, badges, streaks, and achievements.' },
  more:         { icon: '⚙️', title: 'More',         desc: 'Settings, help centre, and additional options.' },
}

function PlaceholderView({ viewId }) {
  const v = PLACEHOLDER_VIEWS[viewId]
  return (
    <div className="lp-placeholder">
      <div className="lp-placeholder-icon" aria-hidden="true">{v.icon}</div>
      <h2 className="lp-placeholder-title">{v.title}</h2>
      <p className="lp-placeholder-desc">{v.desc}</p>
      <span className="lp-placeholder-badge">Coming Soon</span>
    </div>
  )
}

export default function LearnPage({ onGoHome, onLoginClick }) {
  const [activeNav, setActiveNav] = useState('learn')

  return (
    <div className="learn-app">
      <LearnSidebar active={activeNav} onChange={setActiveNav} onGoHome={onGoHome} />

      <main className="learn-main" id="learn-content">
        {activeNav === 'learn'
          ? <ModuleList />
          : <PlaceholderView viewId={activeNav} />
        }
      </main>

      <RightSidebar onSignup={onLoginClick} />
    </div>
  )
}
