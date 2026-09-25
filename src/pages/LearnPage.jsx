import { useState } from 'react'
import LearnSidebar from '../components/learn/LearnSidebar'
import ModuleList   from '../components/learn/ModuleList'
import RightSidebar from '../components/learn/RightSidebar'
import LessonModal  from '../components/learn/LessonModal'
import ScanModal    from '../components/learn/ScanModal'
import PracticeSession from '../components/learn/PracticeSession'
import ProfileView  from '../components/learn/ProfileView'
import ShopView     from '../components/shop/ShopView'

import PlayerStatusBar from '../components/progression/PlayerStatusBar'
import RewardToaster   from '../components/progression/RewardToaster'
import QuestPanel, { QuestBoard } from '../components/progression/QuestPanel'
import DevPanel        from '../components/progression/DevPanel'
import JudgeConsole    from '../components/judge/JudgeConsole'
import DailyBonusIndicator from '../components/daily/DailyBonusIndicator'
import DailyBonusModal     from '../components/daily/DailyBonusModal'

import { ProgressionProvider, useProgression } from '../state/ProgressionContext'
import { useAuth } from '../state/AuthContext'

import './LearnPage.css'
import '../components/progression/progression.css'

/* Destination order, so a view change knows which way it travelled. */
const NAV_ORDER = ['learn', 'practice', 'quests', 'shop', 'profile']

/* The learner's state lives with the course: App loads this page lazily, so
   the progression code is fetched with it, not with the home page. */
export default function LearnPage(props) {
  const { profileKey, isJudge } = useAuth()
  return (
    /* Keyed on the profile: signing in or out remounts the engine against
       the right learner rather than swapping state underneath it. */
    <ProgressionProvider key={profileKey} judge={isJudge}>
      <Course {...props} />
    </ProgressionProvider>
  )
}

function Course({ onGoHome, onGoAbout }) {
  const { vm } = useProgression()
  const { isJudge } = useAuth()
  const [activeNav, setActiveNav] = useState('learn')
  const [dir, setDir] = useState(1)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [scan, setScan] = useState(null)
  const [questPanelOpen, setQuestPanelOpen] = useState(false)
  const [bonusOpen, setBonusOpen] = useState(false)

  const navigate = (id) => {
    if (id === activeNav) return
    setDir(NAV_ORDER.indexOf(id) >= NAV_ORDER.indexOf(activeNav) ? 1 : -1)
    setActiveNav(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* The daily bonus opens only from its button in the top bar: a waiting
     reward is announced by the button's dot, never by a panel on arrival. */

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
          <span className="lt-brand-text">LunX</span>
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
          {activeNav === 'learn'    && <ModuleList onStartLesson={setActiveLessonId} onStartScan={setScan} />}
          {activeNav === 'practice' && <PracticeSession />}
          {activeNav === 'quests'   && <QuestBoard />}
          {activeNav === 'shop'     && <ShopView onNavigate={navigate} />}
          {activeNav === 'profile'  && <ProfileView />}
        </div>
      </main>

      <RightSidebar
        onNavigate={navigate}
        onViewAllQuests={() => setQuestPanelOpen(true)}
      />

      {activeLessonId && (
        <LessonModal
          lessonId={activeLessonId}
          onClose={() => setActiveLessonId(null)}
        />
      )}

      {scan && <ScanModal which={scan} onClose={() => setScan(null)} />}

      <QuestPanel open={questPanelOpen} onClose={() => setQuestPanelOpen(false)} />
      <DailyBonusModal open={bonusOpen} onClose={() => setBonusOpen(false)} />

      <RewardToaster />
      {/* Two consoles in one corner is worse than one. The reviewer's desk
          does everything the developer panel does and more, so on that
          profile the developer panel stands down. */}
      {!isJudge && <DevPanel />}
      {/* Only ever rendered on the reviewer's profile. */}
      <JudgeConsole />
    </div>
  )
}
