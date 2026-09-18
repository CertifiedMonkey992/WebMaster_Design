import { useEffect, useRef, useState } from 'react'
import LearnSidebar from '../components/learn/LearnSidebar'
import ModuleList   from '../components/learn/ModuleList'
import RightSidebar from '../components/learn/RightSidebar'
import LessonModal  from '../components/learn/LessonModal'
import PracticeSession from '../components/learn/PracticeSession'
import ProfileView  from '../components/learn/ProfileView'
import ShopView     from '../components/shop/ShopView'

import PlayerStatusBar from '../components/progression/PlayerStatusBar'
import RewardToaster   from '../components/progression/RewardToaster'
import QuestPanel, { QuestBoard } from '../components/progression/QuestPanel'
import DevPanel        from '../components/progression/DevPanel'
import DailyBonusIndicator from '../components/daily/DailyBonusIndicator'
import DailyBonusModal     from '../components/daily/DailyBonusModal'

import { ProgressionProvider, useProgression } from '../state/ProgressionContext'

import './LearnPage.css'
import '../components/progression/progression.css'

/* These two destinations are not built, and say so. */
const PLACEHOLDER_VIEWS = {
  leaderboards: {
    title: 'No leaderboards yet',
    desc: 'Ranking needs accounts, and LunX does not have them. Your progress lives in this browser and is not sent anywhere.',
    action: { label: 'See your own progress', nav: 'profile' },
  },
  more: {
    title: 'Nothing to set yet',
    desc: 'There are no preferences to change. The one thing that persists is your course progress, and the dev panel can reset it.',
    action: { label: 'Back to the course', nav: 'learn' },
  },
}

/* Destination order, so a view change knows which way it travelled. */
const NAV_ORDER = ['learn', 'practice', 'leaderboards', 'quests', 'shop', 'profile', 'more']

function PlaceholderView({ viewId, onNavigate }) {
  const v = PLACEHOLDER_VIEWS[viewId]
  if (!v) return null
  return (
    <div className="lp-placeholder">
      <span className="lp-placeholder-badge">Not built</span>
      <h2 className="lp-placeholder-title">{v.title}</h2>
      <p className="lp-placeholder-desc">{v.desc}</p>
      <button type="button" className="btn btn-outline" onClick={() => onNavigate(v.action.nav)}>
        {v.action.label}
        <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}

/* The learner's state lives with the course: App loads this page lazily, so
   the progression code is fetched with it, not with the home page. */
export default function LearnPage(props) {
  return (
    <ProgressionProvider>
      <Course {...props} />
    </ProgressionProvider>
  )
}

function Course({ onGoHome, onGoAbout, onLoginClick }) {
  const { vm } = useProgression()
  const [activeNav, setActiveNav] = useState('learn')
  const [dir, setDir] = useState(1)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [questPanelOpen, setQuestPanelOpen] = useState(false)
  const [bonusOpen, setBonusOpen] = useState(false)

  const navigate = (id) => {
    if (id === activeNav) return
    setDir(NAV_ORDER.indexOf(id) >= NAV_ORDER.indexOf(activeNav) ? 1 : -1)
    setActiveNav(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* Show the waiting reward once per visit — never claim it. */
  const bonusShown = useRef(false)
  const bonusReady = vm.dailyBonus.available
  useEffect(() => {
    if (bonusShown.current || !bonusReady) return undefined
    /* The flag is set when the panel actually opens, not when the timer is
       scheduled — StrictMode's mount/unmount/mount would otherwise cancel
       the timer and leave the flag saying it had already been shown. */
    const t = window.setTimeout(() => {
      bonusShown.current = true
      setBonusOpen(true)
    }, 900)
    return () => clearTimeout(t)
  }, [bonusReady])

  return (
    <div className="learn-app">
      <LearnSidebar
        active={activeNav}
        onChange={navigate}
        onGoHome={onGoHome}
        onGoAbout={onGoAbout}
        badges={{ quests: vm.quests.claimableCount }}
      />

      <header className="learn-topbar">
        <button className="lt-brand" onClick={onGoHome} aria-label="Return to LunX home">
          <span className="lt-brand-mark" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
            </svg>
          </span>
          LunX
        </button>
        <div className="lt-actions">
          <DailyBonusIndicator onOpen={() => setBonusOpen(true)} />
          <PlayerStatusBar onOpenShop={() => navigate('shop')} />
        </div>
      </header>

      <main className="learn-main" id="main" tabIndex={-1}>
        {/* Keyed on the destination, so each view arrives from the direction
            the nav moved rather than swapping in place. */}
        <div className="view-enter" key={activeNav} style={{ '--dir': dir }}>
          {activeNav === 'learn'    && <ModuleList onStartLesson={setActiveLessonId} />}
          {activeNav === 'practice' && <PracticeSession />}
          {activeNav === 'quests'   && <QuestBoard />}
          {activeNav === 'shop'     && <ShopView onNavigate={navigate} />}
          {activeNav === 'profile'  && <ProfileView />}
          {PLACEHOLDER_VIEWS[activeNav] && <PlaceholderView viewId={activeNav} onNavigate={navigate} />}
        </div>
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
      <DailyBonusModal open={bonusOpen} onClose={() => setBonusOpen(false)} />

      <RewardToaster />
      <DevPanel />
    </div>
  )
}
