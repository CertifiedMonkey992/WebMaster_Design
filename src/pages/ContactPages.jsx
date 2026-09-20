/* ═══════════════════════════════════════════════════════════════════════════
   ContactPages.jsx — THE CONTACT FORM, AND THE THANK-YOU PAGE AFTER IT
   ---------------------------------------------------------------------------
   LunX has no server, so the form does not pretend to "send". It checks the
   message, then hands it to a channel the team really reads, already written:

     SITE.contact.email set   → the reader's email app opens with a draft
     otherwise                → GitHub's "new issue" page opens with a draft
                                (the project's public contact route; issues
                                are public, and the form says so)

   Error states (COMPONENT_RULES.md → Inputs): nothing is flagged while the
   reader is still typing a field for the first time. On submit, every
   problem is listed in a summary that takes focus, each field says what is
   wrong beneath it (aria-invalid + aria-describedby), and from then on a
   field re-checks itself as it changes. The submit button shows a working
   state while the draft is prepared.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import SitePage from './SitePage'
import { PageLink, useNav } from '../nav'
import { SITE } from '../site'
import { Icon } from '../components/progression/Icons'
import { shake } from '../motion/burst'

const TOPICS = [
  { id: 'question', label: 'A question about a lesson' },
  { id: 'mistake', label: 'A mistake in a lesson' },
  { id: 'bug', label: 'Something is broken' },
  { id: 'classroom', label: 'Using LunX in class' },
  { id: 'other', label: 'Something else' },
]

const MESSAGE_MIN = 20
const MESSAGE_MAX = 2000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const byEmail = () => Boolean(SITE.contact.email)

function validate(values) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Enter your name, or a nickname.'
  else if (name.length > 80) errors.name = 'Keep your name under 80 characters.'
  if (byEmail()) {
    const email = values.email.trim()
    if (!email) errors.email = 'Enter your email address, so the team can reply.'
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter an email address like name@example.com.'
  }
  if (!values.topic) errors.topic = 'Choose what your message is about.'
  const message = values.message.trim()
  if (!message) errors.message = 'Write your message.'
  else if (message.length < MESSAGE_MIN) errors.message = `Add a little more detail: at least ${MESSAGE_MIN} characters.`
  else if (message.length > MESSAGE_MAX) errors.message = `Shorten your message to ${MESSAGE_MAX} characters or fewer.`
  return errors
}

const FIELD_LABEL = { name: 'Name', email: 'Email address', topic: 'Topic', message: 'Message' }

function draftUrl(values) {
  const topic = TOPICS.find((t) => t.id === values.topic)?.label ?? 'Message'
  const signed = `\n\n— ${values.name.trim()}`
  if (byEmail()) {
    const subject = `[LunX] ${topic}`
    const body = `${values.message.trim()}${signed}${values.email ? ` (${values.email.trim()})` : ''}`
    return `mailto:${SITE.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  const firstLine = values.message.trim().split('\n')[0].slice(0, 60)
  const title = `[${topic}] ${firstLine}`
  return `${SITE.contact.newIssue}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(values.message.trim() + signed)}`
}

export function ContactPage() {
  const { go } = useNav()
  const [values, setValues] = useState({ name: '', email: '', topic: '', message: '' })
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | preparing
  const summaryRef = useRef(null)
  const formRef = useRef(null)

  const fields = ['name', ...(byEmail() ? ['email'] : []), 'topic', 'message']

  const change = (field) => (e) => {
    const next = { ...values, [field]: e.target.value }
    setValues(next)
    if (attempted) setErrors(validate(next))
  }

  const blur = (field) => () => {
    /* A field left with something wrong in it says so — but an untouched,
       empty field does not scold before the reader has tried to send. */
    if (!attempted && !values[field]) return
    const all = validate(values)
    setErrors((prev) => ({ ...prev, [field]: all[field] }))
  }

  const submit = (e) => {
    e.preventDefault()
    setAttempted(true)
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      shake(formRef.current, { distance: 5 })
      window.requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setStatus('preparing')
    const url = draftUrl(values)
    /* Opened inside the submit gesture, so no pop-up blocker stops it. */
    if (byEmail()) window.location.href = url
    else window.open(url, '_blank', 'noopener')
    window.setTimeout(() => go('thanks'), 450)
  }

  const errorList = fields.filter((f) => errors[f])
  const described = (field, extra) => [errors[field] ? `${field}-error` : null, extra].filter(Boolean).join(' ') || undefined
  const length = values.message.trim().length

  return (
    <SitePage
      eyebrow="Contact"
      title={<>Write to <em className="em">the LunX team</em>.</>}
      lead="Found a mistake in a lesson, something broken, or want to use LunX in class? Tell us here."
    >
      <div className="ct-grid">
        <form ref={formRef} className="ct-form" onSubmit={submit} noValidate aria-describedby="ct-how">
          {attempted && errorList.length > 0 && (
            <div className="ct-summary" role="alert" tabIndex={-1} ref={summaryRef} aria-labelledby="ct-summary-title">
              <p className="ct-summary-title" id="ct-summary-title">
                <Icon name="info" size={15} strokeWidth={2.4} />
                {errorList.length === 1 ? 'One thing to fix before sending' : `${errorList.length} things to fix before sending`}
              </p>
              <ul>
                {errorList.map((f) => (
                  <li key={f}><a href={`#ct-${f}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ct-${f}`)?.focus() }}>{FIELD_LABEL[f]}: {errors[f]}</a></li>
                ))}
              </ul>
            </div>
          )}

          <div className={`form-field${errors.name ? ' has-error' : ''}`}>
            <label className="form-label" htmlFor="ct-name">Name <span className="ct-req" aria-hidden="true">required</span></label>
            <input
              className="form-input" id="ct-name" name="name" type="text" autoComplete="name" required maxLength={80}
              value={values.name} onChange={change('name')} onBlur={blur('name')}
              aria-invalid={errors.name ? 'true' : undefined} aria-describedby={described('name')}
            />
            {errors.name && <p className="form-error" id="name-error"><Icon name="info" size={13} strokeWidth={2.4} />{errors.name}</p>}
          </div>

          {byEmail() && (
            <div className={`form-field${errors.email ? ' has-error' : ''}`}>
              <label className="form-label" htmlFor="ct-email">Email address <span className="ct-req" aria-hidden="true">required</span></label>
              <input
                className="form-input" id="ct-email" name="email" type="email" autoComplete="email" inputMode="email" required
                value={values.email} onChange={change('email')} onBlur={blur('email')}
                aria-invalid={errors.email ? 'true' : undefined} aria-describedby={described('email')}
              />
              {errors.email && <p className="form-error" id="email-error"><Icon name="info" size={13} strokeWidth={2.4} />{errors.email}</p>}
            </div>
          )}

          <div className={`form-field${errors.topic ? ' has-error' : ''}`}>
            <label className="form-label" htmlFor="ct-topic">What is it about? <span className="ct-req" aria-hidden="true">required</span></label>
            <select
              className="form-input form-select" id="ct-topic" name="topic" required
              value={values.topic} onChange={change('topic')} onBlur={blur('topic')}
              aria-invalid={errors.topic ? 'true' : undefined} aria-describedby={described('topic')}
            >
              <option value="">Choose a topic</option>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {errors.topic && <p className="form-error" id="topic-error"><Icon name="info" size={13} strokeWidth={2.4} />{errors.topic}</p>}
          </div>

          <div className={`form-field${errors.message ? ' has-error' : ''}`}>
            <label className="form-label" htmlFor="ct-message">Message <span className="ct-req" aria-hidden="true">required</span></label>
            <textarea
              className="form-input form-textarea" id="ct-message" name="message" rows={7} required
              value={values.message} onChange={change('message')} onBlur={blur('message')}
              aria-invalid={errors.message ? 'true' : undefined} aria-describedby={described('message', 'ct-count')}
            />
            <p className={`ct-count tnum${length > MESSAGE_MAX ? ' is-over' : ''}`} id="ct-count">
              {length} / {MESSAGE_MAX} characters{length < MESSAGE_MIN ? ` · at least ${MESSAGE_MIN}` : ''}
            </p>
            {errors.message && <p className="form-error" id="message-error"><Icon name="info" size={13} strokeWidth={2.4} />{errors.message}</p>}
          </div>

          <button type="submit" className={`btn btn-primary btn-lg ct-submit${status === 'preparing' ? ' is-working' : ''}`} disabled={status === 'preparing'} aria-busy={status === 'preparing' || undefined}>
            {status === 'preparing' && <span className="ct-spinner" aria-hidden="true" />}
            {status === 'preparing'
              ? 'Preparing your message…'
              : byEmail() ? 'Open it in my email app' : 'Continue to GitHub to send'}
          </button>

          <p className="ct-how" id="ct-how">
            {byEmail()
              ? 'LunX has no server: this opens your email app with the message written, and you press Send there.'
              : <>LunX has no server: this opens GitHub with your message written as a new issue, and you press “Submit” there. Issues are <strong>public</strong>, so don’t include personal details. You’ll need a free GitHub account.</>}
          </p>
        </form>

        <aside className="ct-aside" aria-labelledby="ct-other">
          <h2 className="sp-h2" id="ct-other">Other ways to reach us</h2>
          <dl className="sp-defs">
            {SITE.contact.email && (
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a></dd>
              </div>
            )}
            <div>
              <dt>Project page</dt>
              <dd><a href={SITE.contact.github} rel="noopener">github.com/CertifiedMonkey992/WebMaster_Design</a></dd>
            </div>
            <div>
              <dt>Open issues</dt>
              <dd><a href={SITE.contact.issues} rel="noopener">See what others have reported</a></dd>
            </div>
          </dl>
          <p className="sp-note">
            LunX is a student team’s TSA Webmaster entry, so the team is reached through the project
            rather than by name. Nothing you type here is stored by LunX; see the <PageLink page="privacy">privacy policy</PageLink>.
          </p>
        </aside>
      </div>
    </SitePage>
  )
}

export function ThanksPage() {
  return (
    <SitePage
      eyebrow="Message ready"
      title={<>Thank you for <em className="em">writing to us</em>.</>}
      lead={byEmail()
        ? 'Your email app should have opened with your message already written. Press Send there and it reaches the team.'
        : 'A new tab should have opened on GitHub with your message already written. Press “Submit new issue” there and it reaches the team.'}
    >
      <div className="sp-stamp" aria-hidden="true">
        <Icon name="check" size={22} strokeWidth={3} />
      </div>
      <p className="sp-p">
        {byEmail()
          ? <>If nothing opened, write to <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> directly.</>
          : <>If no tab opened (a pop-up blocker can stop it), <a href={SITE.contact.newIssue} rel="noopener">open a new issue on GitHub</a> and paste your message there.</>}
        {' '}We read everything, and fix mistakes in lessons first.
      </p>
      <div className="sp-actions">
        <PageLink page="learn" className="btn btn-next btn-lg" data-magnetic="8">
          Back to the course
          <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </PageLink>
        <PageLink page="landing" className="btn btn-outline btn-lg">Home page</PageLink>
      </div>
    </SitePage>
  )
}
