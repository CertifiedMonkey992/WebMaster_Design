/* ═══════════════════════════════════════════════════════════════════════════
   SignInPage.jsx — SIGN IN, CREATE AN ACCOUNT, RESET A PASSWORD
   ---------------------------------------------------------------------------
   The course needs an account (App.jsx gates /learn), so this page is the
   front door of the app. It looks like the sign-in page of any ordinary
   web application, on purpose: the logo, one card, a heading, the fields,
   one button, and the way to the other form.

     signin   email or username + password · "Forgot password?"
     create   email + optional username + password
     reset    email + recovery code + new password
     code     the recovery code, shown once after create or reset

   Every rule (validation, hashing, the lock after repeated failures) is in
   services/accountService.js; this page only collects the fields, shows the
   loading state while a password is hashed, and puts each error under the
   field it belongs to.

   It says exactly what it is in one line under the card: accounts are kept
   in this browser, because LunX has no server. COMPONENT_RULES.md → Sign in.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useRef, useState } from 'react'
import { Icon } from '../components/progression/Icons'
import { useAuth } from '../state/AuthContext'
import { useNav, PageLink } from '../nav'
import { JUDGE_LOGIN } from '../config/judgeConfig'
import { PASSWORD_MIN, USERNAME_MIN, USERNAME_MAX, readBook, validateEmail, validatePassword, validateUsername } from '../services/accountService'
import '../components/auth/auth.css'

const EMPTY = { identifier: '', email: '', username: '', password: '', code: '' }

/* Which form to open with. A link can ask for one (#signin, #create);
   otherwise a browser nobody has signed up on yet opens on "Create your
   account", and one that has an account opens on "Welcome back". */
function initialMode() {
  const asked = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  if (asked === 'signin' || asked === 'create') return asked
  return readBook().accounts.some((a) => a.role === 'learner') ? 'signin' : 'create'
}

const COPY = {
  signin: { title: 'Welcome back', lead: 'Sign in to continue learning.', submit: 'Sign in', busy: 'Signing in…' },
  create: { title: 'Create your account', lead: 'Free, and it keeps your progress, streak and gems.', submit: 'Create account', busy: 'Creating account…' },
  reset:  { title: 'Reset your password', lead: 'Use the recovery code you saved when you created your account.', submit: 'Reset password', busy: 'Resetting…' },
}

export default function SignInPage() {
  const { account, displayName, signIn, createAccount, resetPassword, signOut } = useAuth()
  const { go } = useNav()
  const [mode, setMode] = useState(initialMode)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [working, setWorking] = useState(false)
  const [code, setCode] = useState(null)
  const firstRef = useRef(null)
  const alive = useRef(true)
  /* Set on every mount, not only the first: StrictMode mounts twice. */
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  /* Each form starts at its first field with nothing left over from the last. */
  useEffect(() => {
    setErrors({})
    const t = window.setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 30)
    return () => clearTimeout(t)
  }, [mode])

  const switchTo = (next) => {
    setMode(next)
    setValues((v) => ({ ...EMPTY, identifier: v.identifier || v.email, email: v.email || (v.identifier.includes('@') ? v.identifier : '') }))
  }

  const set = (key) => (e) => {
    const value = e.target.value
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev))
  }

  const fillJudge = () => {
    setMode('signin')
    setValues({ ...EMPTY, identifier: JUDGE_LOGIN.email, password: JUDGE_LOGIN.password })
    setErrors({})
  }

  /* The checks that need no hashing, so a typo is reported at once. */
  function localErrors() {
    if (mode === 'signin') {
      return {
        identifier: values.identifier.trim() ? null : 'Enter your email or username.',
        password: values.password ? null : 'Enter your password.',
      }
    }
    if (mode === 'create') {
      return {
        email: validateEmail(values.email),
        username: validateUsername(values.username),
        password: validatePassword(values.password),
      }
    }
    return {
      email: validateEmail(values.email),
      code: values.code.trim() ? null : 'Enter your recovery code.',
      password: validatePassword(values.password),
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (working) return
    const found = localErrors()
    if (Object.values(found).some(Boolean)) { setErrors(found); return }

    setWorking(true)
    let result
    try {
      if (mode === 'signin') result = await signIn({ identifier: values.identifier, password: values.password })
      else if (mode === 'create') result = await createAccount({ email: values.email, username: values.username, password: values.password })
      else result = await resetPassword({ email: values.email, code: values.code, password: values.password })
    } catch {
      result = { ok: false, field: 'form', error: 'Something went wrong. Please try again.' }
    }
    if (!alive.current) return
    setWorking(false)

    if (!result.ok) {
      setErrors({ [result.field ?? 'form']: result.error })
      return
    }
    setValues(EMPTY)
    if (result.recoveryCode) {
      setCode(result.recoveryCode)
      setMode('code')
      return
    }
    go('learn')
  }

  /* ── The recovery code, shown once ────────────────────────────────────── */
  if (mode === 'code' && code) {
    return (
      <Shell>
        <h1 className="au-title">Save your recovery code</h1>
        <p className="au-lead">
          If you forget your password, this code is the only way back into your account.
          It won’t be shown again.
        </p>
        <RecoveryCode code={code} />
        <button type="button" className="btn btn-primary au-submit" onClick={() => { setCode(null); go('learn') }}>
          I’ve saved it — continue
        </button>
      </Shell>
    )
  }

  /* ── Already signed in ──────────────────────────────────────────────── */
  if (account) {
    return (
      <Shell>
        <h1 className="au-title">You’re signed in</h1>
        <p className="au-lead">Signed in as <b>{displayName}</b>.</p>
        <PageLink page="learn" className="btn btn-primary au-submit">Continue to your course</PageLink>
        <button type="button" className="btn btn-ghost au-alt" onClick={signOut}>
          <Icon name="log-out" size={16} /> Sign out
        </button>
      </Shell>
    )
  }

  /* ── The forms ───────────────────────────────────────────────────────── */
  const copy = COPY[mode]
  return (
    <Shell
      after={
        <>
          <p className="au-judge">
            TSA judge? <button type="button" className="au-link" onClick={fillJudge}>Use the reviewer account</button>
            <span className="au-judge-creds">{JUDGE_LOGIN.email} · {JUDGE_LOGIN.password}</span>
          </p>
          <p className="au-note">
            Your account and progress are saved in this browser on this device — LunX has no
            server. <PageLink page="privacy" className="au-link">Privacy policy</PageLink>
          </p>
        </>
      }
    >
      <h1 className="au-title">{copy.title}</h1>
      <p className="au-lead">{copy.lead}</p>

      <form className="au-form" onSubmit={submit} noValidate aria-busy={working}>
        {errors.form && <p className="au-banner" role="alert">{errors.form}</p>}

        {mode === 'signin' && (
          <Field
            ref={firstRef} id="au-identifier" label="Email or username" value={values.identifier}
            onChange={set('identifier')} autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
            error={errors.identifier}
          />
        )}

        {mode !== 'signin' && (
          <Field
            ref={firstRef} id="au-email" label="Email" type="email" value={values.email}
            onChange={set('email')} autoComplete="email" autoCapitalize="none" spellCheck={false}
            error={errors.email}
          />
        )}

        {mode === 'create' && (
          <Field
            id="au-username" label="Username" optional value={values.username}
            onChange={set('username')} autoComplete="nickname" autoCapitalize="none" spellCheck={false}
            maxLength={USERNAME_MAX}
            hint={`${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores. Shown on your profile — your email never is.`}
            error={errors.username}
          />
        )}

        {mode === 'reset' && (
          <Field
            id="au-code" label="Recovery code" value={values.code} onChange={set('code')}
            autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX"
            className="au-code-input" error={errors.code}
          />
        )}

        <PasswordField
          id="au-password"
          label={mode === 'reset' ? 'New password' : 'Password'}
          value={values.password}
          onChange={set('password')}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          hint={mode === 'signin' ? undefined : `At least ${PASSWORD_MIN} characters.`}
          error={errors.password}
          aside={mode === 'signin' && (
            <button type="button" className="au-link au-forgot" onClick={() => switchTo('reset')}>Forgot password?</button>
          )}
        />

        <button type="submit" className="btn btn-primary au-submit" disabled={working}>
          {working ? <><span className="au-spinner" aria-hidden="true" />{copy.busy}</> : copy.submit}
        </button>
      </form>

      <p className="au-switch">
        {mode === 'signin' && <>New to LunX? <button type="button" className="au-link" onClick={() => switchTo('create')}>Create an account</button></>}
        {mode === 'create' && <>Already have an account? <button type="button" className="au-link" onClick={() => switchTo('signin')}>Sign in</button></>}
        {mode === 'reset' && <>Remembered it? <button type="button" className="au-link" onClick={() => switchTo('signin')}>Back to sign in</button></>}
      </p>
    </Shell>
  )
}

/* ── Page shell: the logo, one card, and the site's links ─────────────── */
function Shell({ children, after = null }) {
  return (
    <div className="au-page">
      <main className="au" id="main" tabIndex={-1}>
        <PageLink page="landing" className="au-logo" aria-label="LunX home">
          <span className="au-logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
            </svg>
          </span>
          <span className="au-logo-text">LunX</span>
        </PageLink>
        <div className="au-card">{children}</div>
        {after}
      </main>
      <footer className="au-foot">
        <PageLink page="landing">Home</PageLink>
        <PageLink page="about">About</PageLink>
        <PageLink page="privacy">Privacy</PageLink>
        <PageLink page="terms">Terms</PageLink>
        <PageLink page="contact">Contact</PageLink>
      </footer>
    </div>
  )
}

/* ── One field: the product's one input (COMPONENT_RULES.md → the input) ── */
const Field = forwardRef(function Field({ id, label, optional = false, error, hint, aside = null, className = '', children, ...rest }, ref) {
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ')
  return (
    <div className={`form-field au-field${error ? ' has-error' : ''}`}>
      <div className="au-label-row">
        <label className="form-label" htmlFor={id}>
          {label}{optional && <span className="au-optional"> (optional)</span>}
        </label>
        {aside}
      </div>
      <div className="au-input-wrap">
        <input
          id={id} ref={ref} className={`form-input ${className}`.trim()} type="text"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
        {children}
      </div>
      {hint && !error && <p className="au-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="au-error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  )
})

/* A password field with a visible show/hide toggle. */
function PasswordField(props) {
  const [shown, setShown] = useState(false)
  return (
    <Field {...props} type={shown ? 'text' : 'password'} className="au-password" autoCapitalize="none" spellCheck={false}>
      <button
        type="button"
        className="au-eye"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        aria-controls={props.id}
      >
        <Icon name={shown ? 'eye-off' : 'eye'} size={18} />
      </button>
    </Field>
  )
}

/* The code, in mono, with a copy button that says when it worked. */
function RecoveryCode({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="au-code">
      <code className="au-code-text">{code}</code>
      <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="pg-sr-only" role="status">{copied ? 'Recovery code copied' : ''}</span>
    </div>
  )
}
