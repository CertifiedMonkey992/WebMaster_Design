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

   Connected, and only when the server sends email (services/serverFeatures):
     forgot   email → a one-time reset link is emailed ("Forgot password?"
              opens this; the recovery code stays one link away)
     sent     "Check your email" — the same words whether or not the address
              has an account
     link     a reset link was opened (#reset=…): new password, signed in

   Every rule (validation, hashing, the lock after repeated failures) is in
   services/accountService.js; this page only collects the fields, shows the
   loading state while a password is hashed, and puts each error under the
   field it belongs to.

   It says exactly what it is in one line under the card (COMPONENT_RULES.md
   → Sign in): on a local build, accounts are kept in this browser, because
   that build has no server; on a connected build, they are kept on the LunX
   server it names, and a username is required, because friends and
   leagues show one.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useRef, useState } from 'react'
import { Icon } from '../components/progression/Icons'
import { useAuth } from '../state/AuthContext'
import { useNav, PageLink } from '../nav'
import { JUDGE_LOGIN } from '../config/judgeConfig'
import { readBook } from '../services/accountService'
import { PASSWORD_MIN, USERNAME_MIN, USERNAME_MAX, emailProblem, passwordProblem, usernameProblem } from '../utils/accountRules'
import { CONNECTED, SERVER_HOST } from '../config/serverConfig'
import { useServerFeatures } from '../services/serverFeatures'
import '../components/auth/auth.css'

const EMPTY = { identifier: '', email: '', username: '', password: '', code: '' }

/* A connected build cannot read other accounts from this browser, so it
   remembers only that someone has signed in here before. */
const SEEN_KEY = 'lunx_signed_in_here_v1'
function seenHere() {
  try { return window.localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
function markSeen() {
  try { window.localStorage.setItem(SEEN_KEY, '1') } catch { /* nothing to remember with */ }
}

/* The token in an emailed reset link (…/signin/#reset=TOKEN). In the
   fragment, so it never reaches a server log or a Referer header. */
function tokenFromHash() {
  if (!CONNECTED || typeof window === 'undefined') return null
  const m = /^#reset=([\w-]{20,100})$/.exec(window.location.hash)
  return m ? m[1] : null
}

/* Which form to open with. A link can ask for one (#signin, #create, a
   reset link); otherwise a browser nobody has signed up on yet opens on
   "Create your account", and one that has an account opens on "Welcome back". */
function initialMode() {
  const asked = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  if (tokenFromHash()) return 'link'
  if (asked === 'signin' || asked === 'create') return asked
  if (CONNECTED) return seenHere() ? 'signin' : 'create'
  return readBook().accounts.some((a) => a.role === 'learner') ? 'signin' : 'create'
}

const COPY = {
  signin: { title: 'Welcome back', lead: 'Sign in to continue learning.', submit: 'Sign in', busy: 'Signing in…' },
  create: {
    title: 'Create your account',
    lead: CONNECTED
      ? 'Free. It keeps your progress on any device, and lets friends find you.'
      : 'Free, and it keeps your progress, streak and gems.',
    submit: 'Create account',
    busy: 'Creating account…',
  },
  reset:  { title: 'Reset your password', lead: 'Use the recovery code you saved when you created your account.', submit: 'Reset password', busy: 'Resetting…' },
  forgot: { title: 'Reset your password', lead: 'Enter your account’s email and we’ll send you a link to choose a new password.', submit: 'Email me a link', busy: 'Sending…' },
  link:   { title: 'Choose a new password', lead: 'Pick a new password for your account. Any other device signed in to it will be signed out.', submit: 'Save and sign in', busy: 'Saving…' },
}

export default function SignInPage() {
  const { account, displayName, signIn, createAccount, resetPassword, requestResetLink, resetWithLink, signOut } = useAuth()
  const { go } = useNav()
  const { mail } = useServerFeatures()
  const [mode, setMode] = useState(initialMode)
  const [linkToken] = useState(tokenFromHash)
  const [sentTo, setSentTo] = useState('')
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

  /* A reset link's token leaves the address bar (and the history entry) at
     once: it is a key to the account until it is used. */
  useEffect(() => {
    if (linkToken) window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [linkToken])

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
        email: emailProblem(values.email),
        username: usernameProblem(values.username, { required: CONNECTED }),
        password: passwordProblem(values.password),
      }
    }
    if (mode === 'forgot') return { email: emailProblem(values.email) }
    if (mode === 'link') return { password: passwordProblem(values.password) }
    return {
      email: emailProblem(values.email),
      code: values.code.trim() ? null : 'Enter your recovery code.',
      password: passwordProblem(values.password),
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
      else if (mode === 'forgot') result = await requestResetLink(values.email)
      else if (mode === 'link') result = await resetWithLink({ token: linkToken, password: values.password })
      else result = await resetPassword({ email: values.email, code: values.code, password: values.password })
    } catch {
      result = { ok: false, field: 'form', error: 'Something went wrong. Please try again.' }
    }
    if (!alive.current) return
    setWorking(false)

    if (!result.ok) {
      setErrors({ [result.field ?? 'form']: result.error, expired: result.code === 'link_expired' })
      return
    }
    if (mode === 'forgot') {
      setSentTo(values.email.trim())
      setMode('sent')
      return
    }
    setValues(EMPTY)
    markSeen()
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

  /* ── A reset link is on its way (or isn't: the words are the same) ──── */
  if (mode === 'sent') {
    return (
      <Shell>
        <h1 className="au-title">Check your email</h1>
        <p className="au-lead">
          If an account uses <b>{sentTo}</b>, a link to reset its password is on its way.
          It works once, for 30 minutes. If it hasn’t arrived in a few minutes, check your spam folder.
        </p>
        <button type="button" className="btn btn-primary au-submit" onClick={() => switchTo('signin')}>Back to sign in</button>
        <p className="au-switch">
          No email? <button type="button" className="au-link" onClick={() => switchTo('reset')}>Use your recovery code</button>
        </p>
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
            {CONNECTED
              ? <>Your account and progress are kept on the LunX server at {SERVER_HOST}, so they follow you to any device. Other learners see your username — never your email.</>
              : <>Your account and progress are saved in this browser on this device — this copy of LunX has no server.</>}
            {' '}<PageLink page="privacy" className="au-link">Privacy policy</PageLink>
          </p>
        </>
      }
    >
      <h1 className="au-title">{copy.title}</h1>
      <p className="au-lead">{copy.lead}</p>

      <form className="au-form" onSubmit={submit} noValidate aria-busy={working}>
        {errors.form && (
          <p className="au-banner" role="alert">
            {errors.form}
            {errors.expired && <> <button type="button" className="au-link" onClick={() => switchTo('forgot')}>Send a new link</button></>}
          </p>
        )}

        {mode === 'signin' && (
          <Field
            ref={firstRef} id="au-identifier" label="Email or username" value={values.identifier}
            onChange={set('identifier')} autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
            error={errors.identifier}
          />
        )}

        {mode !== 'signin' && mode !== 'link' && (
          <Field
            ref={firstRef} id="au-email" label="Email" type="email" value={values.email}
            onChange={set('email')} autoComplete="email" autoCapitalize="none" spellCheck={false}
            error={errors.email}
          />
        )}

        {mode === 'create' && (
          <Field
            id="au-username" label="Username" optional={!CONNECTED} value={values.username}
            onChange={set('username')} autoComplete="nickname" autoCapitalize="none" spellCheck={false}
            maxLength={USERNAME_MAX}
            hint={`${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores. ${CONNECTED ? 'Friends and leagues show it' : 'Shown on your profile'} — your email never is.`}
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

        {mode !== 'forgot' && <PasswordField
          ref={mode === 'link' ? firstRef : undefined}
          id="au-password"
          label={mode === 'reset' || mode === 'link' ? 'New password' : 'Password'}
          value={values.password}
          onChange={set('password')}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          hint={mode === 'signin' ? undefined : `At least ${PASSWORD_MIN} characters.`}
          error={errors.password}
          aside={mode === 'signin' && (
            <button type="button" className="au-link au-forgot" onClick={() => switchTo(mail ? 'forgot' : 'reset')}>Forgot password?</button>
          )}
        />}

        <button type="submit" className="btn btn-primary au-submit" disabled={working}>
          {working ? <><span className="au-spinner" aria-hidden="true" />{copy.busy}</> : copy.submit}
        </button>
      </form>

      <p className="au-switch">
        {mode === 'signin' && <>New to LunX? <button type="button" className="au-link" onClick={() => switchTo('create')}>Create an account</button></>}
        {mode === 'create' && <>Already have an account? <button type="button" className="au-link" onClick={() => switchTo('signin')}>Sign in</button></>}
        {mode === 'reset' && <>Remembered it? <button type="button" className="au-link" onClick={() => switchTo('signin')}>Back to sign in</button></>}
        {mode === 'forgot' && <>Have your recovery code? <button type="button" className="au-link" onClick={() => switchTo('reset')}>Use it instead</button></>}
        {mode === 'link' && <>Remembered it? <button type="button" className="au-link" onClick={() => switchTo('signin')}>Back to sign in</button></>}
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
const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [shown, setShown] = useState(false)
  return (
    <Field {...props} ref={ref} type={shown ? 'text' : 'password'} className="au-password" autoCapitalize="none" spellCheck={false}>
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
})

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
