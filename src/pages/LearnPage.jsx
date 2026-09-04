import { useState } from 'react'
import LearnSidebar from '../components/learn/LearnSidebar'
import ModuleList   from '../components/learn/ModuleList'
import RightSidebar from '../components/learn/RightSidebar'
import LessonModal  from '../components/learn/LessonModal'
import PracticeSession from '../components/learn/PracticeSession'
import ProfileView  from '../components/learn/ProfileView'

import PlayerStatusBar from '../components/progression/PlayerStatusBar'
import RewardToaster   from '../components/progression/RewardToaster'
import QuestPanel, { QuestBoard } from '../components/progression/QuestPanel'
import DevPanel        from '../components/progression/DevPanel'

import './LearnPage.css'
import '../components/progression/progression.css'

const PLACEHOLDER_VIEWS = {
  leaderboards: { icon: '🏆', title: 'Leaderboards', desc: 'See how you rank against learners from around the world.' },
  shop:         { icon: '🛍️', title: 'Shop',         desc: 'Spend your hard-earned gems on rewards and power-ups.' },
  more:         { icon: '⚙️', title: 'More',         desc: 'Settings, help centre, and additional options.' },
}

function PlaceholderView({ viewId }) {
  const v = PLACEHOLDER_VIEWS[viewId]
  if (!v) return null
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
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [questPanelOpen, setQuestPanelOpen] = useState(false)

  return (
    <div className="learn-app">
      <LearnSidebar active={activeNav} onChange={setActiveNav} onGoHome={onGoHome} />

      {/* Persistent player status: streak · gems · hearts */}
      <header className="learn-topbar">
        <button className="lt-brand" onClick={onGoHome} aria-label="Return to LunX home">
          <span className="lt-brand-mark" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h2.5v8H10v2H2V2Z" fill="#fff" />
            </svg>
          </span>
          LunX
        </button>
        <PlayerStatusBar />
      </header>

      <main className="learn-main" id="learn-content">
        {activeNav === 'learn'    && <ModuleList onStartLesson={setActiveLessonId} />}
        {activeNav === 'practice' && <PracticeSession />}
        {activeNav === 'quests'   && <QuestBoard />}
        {activeNav === 'profile'  && <ProfileView />}
        {PLACEHOLDER_VIEWS[activeNav] && <PlaceholderView viewId={activeNav} />}
      </main>

      <RightSidebar
        onSignup={onLoginClick}
        onViewAllQuests={() => setQuestPanelOpen(true)}
      />

      {activeLessonId && (
        <LessonModal
          lessonId={activeLessonId}
          onClose={() => setActiveLessonId(null)}
        />
      )}

      <QuestPanel open={questPanelOpen} onClose={() => setQuestPanelOpen(false)} />

      {/* Reward animation layer + developer console (dev builds / ?dev=1 only) */}
      <RewardToaster />
      <DevPanel />
    </div>
  )
}
