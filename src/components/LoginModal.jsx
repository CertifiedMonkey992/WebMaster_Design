import { useEffect, useRef } from 'react'

/* Google "G" SVG — inline so no external image needed */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.52-1.4 2.4-3.45 2.4-5.88Z" fill="#4285F4"/>
      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2c-.71.48-1.63.76-2.71.76-2.08 0-3.85-1.41-4.48-3.3H.86v2.07A8 8 0 0 0 8 16Z" fill="#34A853"/>
      <path d="M3.52 9.52A4.84 4.84 0 0 1 3.27 8c0-.53.09-1.04.25-1.52V4.41H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.59l2.66-2.07Z" fill="#FBBC05"/>
      <path d="M8 3.18c1.17 0 2.22.4 3.05 1.2l2.28-2.28C11.97.8 10.16 0 8 0A8 8 0 0 0 .86 4.41l2.66 2.07C4.15 4.59 5.92 3.18 8 3.18Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginModal({ onClose }) {
  const panelRef = useRef(null)

  /* Close on Escape key */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  /* Trap focus inside modal */
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  /* Prevent background scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel" ref={panelRef} tabIndex={-1}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close sign-in panel"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="modal-logo" aria-hidden="true">
          <span className="modal-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h2.5v8H10v2H2V2Z" fill="#000"/>
            </svg>
          </span>
          <span className="modal-logo-text">LunX</span>
        </div>

        <h2 className="modal-heading" id="modal-title">Welcome back</h2>
        <p className="modal-sub">Sign in to continue your learning journey.</p>

        {/* Form — no backend, purely visual */}
        <form
          className="modal-form"
          onSubmit={(e) => e.preventDefault()}
          noValidate
        >
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              className="form-input"
              id="email"
              type="email"
              placeholder="you@school.edu"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-input"
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="form-extras">
            <span className="form-forgot" role="button" tabIndex={0}>
              Forgot password?
            </span>
          </div>

          <button type="submit" className="modal-submit">
            Sign In to LunX
          </button>
        </form>

        <div className="modal-divider">
          <span className="modal-div-line" />
          <span className="modal-div-text">or</span>
          <span className="modal-div-line" />
        </div>

        <button className="modal-google" type="button">
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="modal-footer-note">
          No account?{' '}
          <a href="#">Sign up free — takes 30 seconds.</a>
        </p>
      </div>
    </div>
  )
}
