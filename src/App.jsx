import { useState } from 'react'
import './App.css'

import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import ProductSections from './components/showcase/ProductSections'
import ClosingCTA      from './components/ClosingCTA'
import LoginModal      from './components/LoginModal'
import Footer          from './components/Footer'
import LearnPage       from './pages/LearnPage'

import { ProgressionProvider } from './state/ProgressionContext'
import FxLayer from './motion/FxLayer'
/* Last, so the shared verbs (magnet, press, reveal) sit on top of the
   component stylesheets imported above rather than being overridden by them. */
import './motion/motion.css'

export default function App() {
  const [loginOpen,    setLoginOpen]    = useState(false)
  const [currentPage,  setCurrentPage]  = useState('landing')

  const goLearn = () => {
    setCurrentPage('learn')
    window.scrollTo({ top: 0 })
  }

  if (currentPage === 'learn') {
    return (
      <ProgressionProvider>
        <FxLayer />
        <LearnPage
          onGoHome={() => { setCurrentPage('landing'); window.scrollTo({ top: 0 }) }}
          onLoginClick={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </ProgressionProvider>
    )
  }

  return (
    <div className="app">
      <FxLayer />
      <Navbar onStartLearning={goLearn} />

      <main>
        <Hero onStartLearning={goLearn} />
        <ProductSections />
        <ClosingCTA onStartLearning={goLearn} />
      </main>

      <Footer onStartLearning={goLearn} />

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  )
}
