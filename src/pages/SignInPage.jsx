/* ═══════════════════════════════════════════════════════════════════════════
   SignInPage.jsx — THE FRONT PLATE AND THE FORM
   ---------------------------------------------------------------------------
   A profile in LunX is a name on a shelf, not a login to a server. It exists
   for two reasons and says so: two people can keep separate progress on one
   school computer, and a TSA judge can open a profile that already has every
   module unlocked and every control to hand.

   The page is a spread, the way the rest of the product is a book: the left
   leaf is a PLATE — a field-guide illustration of a small network learning,
   drawn in ink on paper, captioned and numbered the way a plate is — and the
   right leaf is the form. On a phone the plate becomes a header strip and
   the form takes the page, because a plate is not worth a screen a thumb has
   to scroll past.

   Three things it is careful about:

     · it asks for as little as it can — a name, a handle and a passphrase —
       and never validates an email, because there is nothing to send to
     · it says plainly that nothing leaves the browser and that the
       passphrase is not protecting anything, rather than implying a security
       it does not have
     · signing in is never a wall: the guest path is the page's second
       option, in its own words, not a dismissible afterthought

   COMPONENT_RULES.md → Sign in. The fields are the product's one input
   style (.form-field / .form-input), and the buttons are .btn.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../motion/Reveal'
import { Icon } from '../components/progression/Icons'
import { useAuth } from '../state/AuthContext'
import { useNav, PageLink } from '../nav'
import { JUDGE_LOGIN, JUDGE_HEARTS } from '../config/judgeConfig'
import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import SignInPlate from '../components/auth/SignInPlate'
import '../components/auth/auth.css'

const EMPTY = { handle: '', password: '', name: '' }

export default function SignInPage() {
  const { account, signIn, createAccount, signOut } = useAuth()
  const { go } = useNav()
  const [mode, setMode] = useState('signin')   // 'signin' | 'create'
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState(null)     // { field, error }
  const [working, setWorking] = useState(false)
  const firstField = useRef(null)
  const switchRef = useRef(null)

  const isCreate = mode === 'create'

  /* Switching leaves clears whatever the other one complained about. */
  useEffect(() => { setError(null) }, [mode])

  /* The rule under the chosen name is MEASURED from that name, the way the
     navbar's sliding underline is — so it is still right after the webfont
     lands, and whatever the labels say. */
  useLayoutEffect(() => {
    const row = switchRef.current
    if (!row) return undefined
    const place = () => {
      const on = row.querySelector('[aria-selected="true"]')
      if (!on) return
      row.style.setProperty('--ink-x', `${on.offsetLeft}px`)
      row.style.setProperty('--ink-w', `${on.offsetWidth}px`)
    }
    place()
    document.fonts?.ready?.then(place)
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [mode, account])

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setError((prev) => (prev?.field === key ? null : prev))
  }

  /* The reviewer's credentials are printed on this page, so filling them in
     is one press rather than two careful transcriptions. */
  const fillJudge = () => {
    setMode('signin')
    setValues({ ...EMPTY, handle: JUDGE_LOGIN.handle, password: JUDGE_LOGIN.password })
    setError(null)
    window.setTimeout(() => firstField.current?.focus(), 0)
  }

  const submit = (e) => {
    e.preventDefault()
    if (working) return
    setWorking(true)
    const result = isCreate
      ? createAccount({ name: values.name, handle: values.handle, password: values.password })
      : signIn({ handle: values.handle, password: values.password })

    if (!result.ok) {
      setWorking(false)
      setError(result)
      return
    }
    /* Straight into the course: the profile exists to be used, and a judge
       who has just signed in wants the controls, not a confirmation page. */
    setValues(EMPTY)
    go('learn')
  }

  /* ── Already signed in ────────────────────────────────────────────────────
     The page becomes a receipt rather than a second form: who you are, what
     the profile can do, and the two ways out of it. */
  if (account) {
    const judge = account.role === 'judge'
    return (
      <Shell>
        <p className="au-eyebrow">Signed in</p>
        <h1 className="au-title">
          {judge ? <>The reviewer’s profile is <em className="em">open</em>.</> : <>You are <em className="em">{account.name}</em>.</>}
        </h1>
        <p className="au-lead">
          {judge
            ? `Every module is unlocked, gems are unlimited and there are ${JUDGE_HEARTS} hearts in the bank. A control sits beside each feature in the course, and the reviewer’s console opens from the bottom-right corner.`
            : 'Progress on this browser is kept under this profile. Nothing was sent anywhere, and nothing was registered.'}
        </p>

        <dl className="au-facts">
          <div><dt>Profile</dt><dd>{account.name}</dd></div>
          <div><dt>Signed in as</dt><dd>{account.handle}</dd></div>
          <div><dt>Kind</dt><dd>{judge ? 'TSA reviewer' : 'Learner'}</dd></div>
        </dl>

        <div className="au-actions">
          <PageLink page="learn" className="btn btn-next" data-magnetic="6">
            {judge ? 'Open the course' : 'Continue the course'}
            <Arrow />
          </PageLink>
          <button type="button" className="btn btn-outline" onClick={signOut}>
            Sign out
          </button>
        </div>

        <p className="au-note">
          <Icon name="info" size={13} strokeWidth={2.2} />
          Signing out returns you to the guest profile — the one this browser
          used before you signed in. Nothing is deleted.
        </p>
      </Shell>
    )
  }

  /* ── The form ───────────────────────────────────────────────────────────── */
  return (
    <Shell>
      <p className="au-eyebrow">{TOTAL_LESSONS} lessons · {TOTAL_SECTIONS} modules · free</p>
      <h1 className="au-title">
        {isCreate
          ? <>Keep your progress <em className="em">under your own name</em>.</>
          : <>Welcome back to the <em className="em">field guide</em>.</>}
      </h1>
      <p className="au-lead">
        {isCreate
          ? 'A profile keeps one person’s streak, gems and lessons apart from another’s on a shared computer. It is created here, in this browser, and nowhere else.'
          : 'Open a profile you made on this browser. If you have not made one, the course works perfectly well without it.'}
      </p>

      {/* The two leaves of the form, named rather than tabbed: a tab bar
          would imply two places, and this is one. */}
      <div className="au-switch" ref={switchRef} role="tablist" aria-label="Sign in or create a profile">
        <button
          type="button" role="tab" id="au-tab-signin"
          aria-selected={!isCreate} aria-controls="au-form"
          className={`au-switch-btn${!isCreate ? ' is-on' : ''}`}
          onClick={() => setMode('signin')}
        >
          Sign in
        </button>
        <button
          type="button" role="tab" id="au-tab-create"
          aria-selected={isCreate} aria-controls="au-form"
          className={`au-switch-btn${isCreate ? ' is-on' : ''}`}
          onClick={() => setMode('create')}
        >
          Create a profile
        </button>
        <span className="au-switch-ink" aria-hidden="true" />
      </div>

      <form
        className="au-form" id="au-form" onSubmit={submit} noValidate
        role="tabpanel" aria-labelledby={isCreate ? 'au-tab-create' : 'au-tab-signin'}
      >
        {isCreate && (
          <Field
            id="au-name" label="Display name" value={values.name} onChange={set('name')}
            placeholder="Avery" autoComplete="nickname" error={error?.field === 'name' && error.error}
          />
        )}
        <Field
          id="au-handle"
          ref={isCreate ? undefined : firstField}
          label={isCreate ? 'Username or email' : 'Username or email'}
          value={values.handle} onChange={set('handle')}
          placeholder={isCreate ? 'avery, or avery@school.edu' : 'the name you chose'}
          autoComplete="username"
          error={error?.field === 'handle' && error.error}
        />
        <Field
          id="au-password" label="Passphrase" type="password"
          value={values.password} onChange={set('password')}
          placeholder={isCreate ? 'at least four characters' : ''}
          autoComplete={isCreate ? 'new-password' : 'current-password'}
          error={error?.field === 'password' && error.error}
          hint={isCreate ? 'Kept in this browser only, and not protecting anything — see the note below.' : undefined}
        />

        <button type="submit" className="btn btn-next au-submit fx-shine" disabled={working} data-magnetic="6">
          {isCreate ? 'Create profile' : 'Sign in'}
          <Arrow />
        </button>

        {isCreate && (
          <p className="au-adopt">
            <Icon name="check-circle" size={13} strokeWidth={2.2} />
            Whatever you have already finished on this browser comes with you.
          </p>
        )}
      </form>

      {/* ── The reviewer's way in ──────────────────────────────────────────── */}
      <section className="au-judge" aria-labelledby="au-judge-title">
        <h2 className="au-judge-title" id="au-judge-title">
          <Icon name="flag" size={14} strokeWidth={2.4} />
          For TSA judges
        </h2>
        <p className="au-judge-lead">
          This profile opens the whole course at once — every module unlocked,
          unlimited gems, {JUDGE_HEARTS} hearts, and a control beside every
          feature so nothing has to be earned before it can be seen.
        </p>
        <button
          type="button"
          className="au-judge-card"
          onClick={fillJudge}
          aria-label={`Fill in the reviewer credentials: username ${JUDGE_LOGIN.handle}, passphrase ${JUDGE_LOGIN.password}`}
        >
          <span className="au-judge-row">
            <span className="au-judge-key">Username</span>
            <span className="au-judge-val">{JUDGE_LOGIN.handle}</span>
          </span>
          <span className="au-judge-row">
            <span className="au-judge-key">Passphrase</span>
            <span className="au-judge-val">{JUDGE_LOGIN.password}</span>
          </span>
          <span className="au-judge-fill">
            Fill these in
            <Icon name="chevron-right" size={13} strokeWidth={2.6} />
          </span>
        </button>
        <p className="au-judge-foot">
          Judges are welcome to create an ordinary profile instead and walk the
          course the way a student would.
        </p>
      </section>

      <p className="au-note">
        <Icon name="info" size={13} strokeWidth={2.2} />
        <span>
          Nothing here reaches a server, because LunX does not have one. A
          profile, its passphrase and its progress are stored in this browser
          and removed with your site data. The passphrase keeps two people’s
          progress apart on a shared computer — it does not protect anything,
          so use one you do not use elsewhere. The{' '}
          <PageLink page="privacy" className="au-link">privacy policy</PageLink> says
          exactly what is stored.
        </span>
      </p>

      <p className="au-guest">
        No profile needed —{' '}
        <PageLink page="learn" className="au-link">start the course as a guest</PageLink>.
      </p>
    </Shell>
  )
}

/* ── Page shell ──────────────────────────────────────────────────────────────
   A spread: the plate on the left leaf, the form on the right. The navbar
   carries no section links here (this page has none) and its solid button
   still opens the course.
   ─────────────────────────────────────────────────────────────────────────── */
function Shell({ children }) {
  return (
    <div className="app">
      <Navbar links={[]} pageLink={{ label: 'Home', page: 'landing' }} />
      <main className="au" id="main" tabIndex={-1}>
        <div className="au-spread">
          <Reveal className="au-plate" variant="left" immediate delay={80}>
            <SignInPlate />
          </Reveal>
          <div className="au-leaf">
            <Reveal variant="up" immediate delay={160}>{children}</Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/* ── One field ───────────────────────────────────────────────────────────────
   The product's one input (COMPONENT_RULES.md → the input): label above,
   evergreen rule on focus, berry border and a message below on an error.
   ─────────────────────────────────────────────────────────────────────────── */
const Field = forwardRef(function Field({ id, label, error, hint, ...rest }, ref) {
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ')
  return (
    <div className={`form-field au-field${error ? ' is-error' : ''}`}>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id} ref={ref} className="form-input" type="text"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...rest}
      />
      {hint && !error && <p className="au-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="au-error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  )
})

function Arrow() {
  return (
    <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
