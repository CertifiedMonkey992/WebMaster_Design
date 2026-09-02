import { useState, useEffect } from 'react'

export default function Navbar({ onLoginClick, onStartLearning }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
      <a href="#" className="nav-logo" aria-label="LunX home">
        {/* Logomark: L in white square */}
        <span className="nav-logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2h2.5v8H10v2H2V2Z" fill="#000"/>
          </svg>
        </span>
        <span className="nav-logo-text">LunX</span>
      </a>

      <ul className="nav-links" role="list">
        <li><a href="#modules">Modules</a></li>
        <li><a href="#tools">Tools</a></li>
        <li><a href="#progress">Progress</a></li>
        <li><a href="#">About</a></li>
      </ul>

      <div className="nav-actions">
        <button
          className="btn btn-ghost"
          onClick={onLoginClick}
          aria-label="Sign in to LunX"
        >
          Sign In
        </button>
        <button
          className="btn btn-primary"
          onClick={onStartLearning}
          aria-label="Start learning for free"
        >
          Start Free
        </button>
      </div>
    </nav>
  )
}
