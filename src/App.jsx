import { useState } from 'react'
import './App.css'

import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import LessonTicker    from './components/LessonTicker'
import ProductSections from './components/showcase/ProductSections'
import ClosingCTA      from './components/ClosingCTA'
import LoginModal      from './components/LoginModal'
import Footer          from './components/Footer'
import LearnPage       from './pages/LearnPage'

import { ProgressionProvider } from './state/ProgressionContext'
import FxLayer from './motion/FxLayer'
import { turnPage } from './motion/pageTurn'
/* Last, so the shared verbs (magnet, press, reveal) sit on top of the
   component stylesheets imported above rather than being overridden by them. */
import './motion/motion.css'

export default function App() {
  const [loginOpen,    setLoginOpen]    = useState(false)
  const [currentPage,  setCurrentPage]  = useState('landing')

  /* The landing page and the app are one book: moving between them turns a
     page (MOTION_RULES.md → Page turns). 'instant' because the html element
     scrolls smoothly, and the new page must start at its top, not travel. */
  const goLearn = () => turnPage(() => {
    setCurrentPage('learn')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, { dir: 1 })

  const goHome = () => turnPage(() => {
    setCurrentPage('landing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, { dir: -1 })

  if (currentPage === 'learn') {
    return (
      <ProgressionProvider>
        <FxLayer />
        <LearnPage
          onGoHome={goHome}
          onLoginClick={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </ProgressionProvider>
    )
  }

  /* The landing page has exactly two ways into the course: the navbar's
     button (always on screen) and the closing CTA (the bottom of the page).
     COMPONENT_RULES.md → Links into the course. */
  return (
    <div className="app">
      <FxLayer />
      <Navbar onStartLearning={goLearn} />

      <main>
        <Hero />
        <LessonTicker />
        <ProductSections />
        <ClosingCTA onStartLearning={goLearn} />
      </main>

      <Footer />

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  )
}
