/* ═══════════════════════════════════════════════════════════════════════════
   LoginModal.jsx — THE FORM FOR AN ACCOUNT SYSTEM THAT DOES NOT EXIST
   ---------------------------------------------------------------------------
   The form stays reachable (removing the last route to it would take a
   feature out of the build), but every control in it used to do nothing when
   pressed — four dead buttons. Each one now answers honestly: the panel
   shakes once, and a note slides in saying accounts are not built and that
   progress already saves in this browser.

   Leaves by fading and settling rather than vanishing.

   Error states: submitting checks the fields first, the way a real sign-in
   would — an empty or malformed email and an empty password are named
   beneath their fields (aria-invalid, aria-describedby) and focus moves to
   the first one. Only a form that would have been valid gets the honest
   note that there is no account system to sign in to.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { shake } from '../motion/burst'
import useDialog from '../hooks/useDialog'

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
  const [closing, setClosing] = useState(false)
  const [note, setNote] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const check = (e = email, p = password) => {
    const next = {}
    if (!e.trim()) next.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())) next.email = 'Enter an email address like you@school.edu.'
    if (!p) next.password = 'Enter your password.'
    return next
  }

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(onClose, 190)
  }, [onClose])

  useDialog(panelRef, { onClose: close })

  useEffect(() => { panelRef.current?.focus() }, [])

  const answer = (e) => {
    e?.preventDefault?.()
    shake(panelRef.current, { distance: 6 })
    setNote((n) => n + 1)
  }

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    const found = check()
    setErrors(found)
    if (found.email) { shake(panelRef.current, { distance: 6 }); emailRef.current?.focus(); return }
    if (found.password) { shake(panelRef.current, { distance: 6 }); passwordRef.current?.focus(); return }
    answer()
  }

  return (
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="modal-panel" ref={panelRef} tabIndex={-1}>
        <button className="modal-close" onClick={close} aria-label="Close sign-in panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="modal-logo" aria-hidden="true">
          <span className="modal-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
            </svg>
          </span>
          <span className="modal-logo-text">LunX</span>
        </div>

        <h2 className="modal-heading" id="modal-title">Welcome back</h2>
        <p className="modal-sub">Sign in to continue your learning journey.</p>

        <form className="modal-form" onSubmit={submit} noValidate>
          <div className={`form-field${errors.email ? ' has-error' : ''}`}>
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              ref={emailRef}
              className="form-input" id="login-email" type="email" placeholder="you@school.edu" autoComplete="email" required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (tried) setErrors(check(e.target.value, password)) }}
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
            {errors.email && <p className="form-error" id="login-email-error">{errors.email}</p>}
          </div>

          <div className={`form-field${errors.password ? ' has-error' : ''}`}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              ref={passwordRef}
              className="form-input" id="login-password" type="password" placeholder="••••••••" autoComplete="current-password" required
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (tried) setErrors(check(email, e.target.value)) }}
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            {errors.password && <p className="form-error" id="login-password-error">{errors.password}</p>}
          </div>

          <div className="form-extras">
            <button type="button" className="form-forgot" onClick={answer}>Forgot password?</button>
          </div>

          {note > 0 && (
            <p className="modal-note" role="status" key={note}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9.2" /><path d="M12 11v5.5M12 7.6h.01" />
              </svg>
              Accounts aren&apos;t built yet. Your progress already saves in this browser — nothing to sign in to.
            </p>
          )}

          <button type="submit" className="btn btn-primary modal-submit">
            Sign in to LunX
          </button>
        </form>

        <div className="modal-divider">
          <span className="modal-div-line" />
          <span className="modal-div-text">or</span>
          <span className="modal-div-line" />
        </div>

        <button className="modal-google" type="button" onClick={answer}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="modal-footer-note">
          No account?{' '}
          <button type="button" onClick={answer}>Sign up free — takes 30 seconds.</button>
        </p>
      </div>
    </div>
  )
}
