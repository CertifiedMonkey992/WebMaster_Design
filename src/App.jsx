import { useState } from 'react'
import './App.css'

import Navbar       from './components/Navbar'
import Hero         from './components/Hero'
import ToolsStrip   from './components/ToolsStrip'
import Modules      from './components/Modules'
import Gamification from './components/Gamification'
import LoginModal   from './components/LoginModal'
import LearnPage    from './pages/LearnPage'

import { ProgressionProvider } from './state/ProgressionContext'

export default function App() {
  const [loginOpen,    setLoginOpen]    = useState(false)
  const [currentPage,  setCurrentPage]  = useState('landing')

  if (currentPage === 'learn') {
    return (
      <ProgressionProvider>
        <LearnPage
          onGoHome={() => setCurrentPage('landing')}
          onLoginClick={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </ProgressionProvider>
    )
  }

  return (
    <div className="app">
      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        onStartLearning={() => setCurrentPage('learn')}
      />

      <main>
        <Hero onStartLearning={() => setCurrentPage('learn')} />
        <ToolsStrip />
        <Modules />
        <Gamification />
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-left">
          <span className="footer-logo-text">LunX</span>
          <span className="footer-copy">© 2025 LunX. Built for curious minds.</span>
        </div>
        <ul className="footer-links" role="list">
          <li><a href="#">About</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">GitHub</a></li>
        </ul>
      </footer>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  )
}
