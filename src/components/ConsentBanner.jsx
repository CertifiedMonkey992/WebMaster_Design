/* ═══════════════════════════════════════════════════════════════════════════
   ConsentBanner.jsx — THE PRIVACY BANNER
   ---------------------------------------------------------------------------
   Asked once, answered once, and never in the way of the page:

     · analytics configured (site.js) → a real choice: count this visit
       anonymously, or not. Nothing loads until "Allow". Declining is as
       easy as allowing — same size, same row.
     · analytics not configured → nothing to consent to, so it does not
       pretend to ask. It says what LunX does store (progress, in this
       browser) and that it sets no cookies, once, with an OK.

   A region, not a dialog: it takes no focus, blocks nothing, and the page
   behind it stays fully usable. The footer's "Privacy choices" reopens it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { SITE } from '../site'
import { CONSENT_KEY, choice, onChoice, setChoice } from '../services/analytics'
import { PageLink } from '../nav'

const NOTED = 'noted'

function needsAsking() {
  if (SITE.analytics.enabled) return choice() === null
  try { return window.localStorage.getItem(CONSENT_KEY) === null } catch { return true }
}

export default function ConsentBanner() {
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    /* After the page has arrived: the first thing a visitor sees is LunX. */
    const t = window.setTimeout(() => { if (needsAsking()) setOpen(true) }, 1400)
    const off = onChoice((v) => { if (v === 'ask') { setLeaving(false); setOpen(true) } })
    return () => { clearTimeout(t); off() }
  }, [])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-banner', open && !leaving)
    return () => document.documentElement.removeAttribute('data-banner')
  }, [open, leaving])

  if (!open) return null

  const answer = (value) => {
    if (value === NOTED) {
      try { window.localStorage.setItem(CONSENT_KEY, NOTED) } catch { /* ignore */ }
    } else {
      setChoice(value)
    }
    setLeaving(true)
    window.setTimeout(() => { setOpen(false); setLeaving(false) }, 240)
  }

  const asking = SITE.analytics.enabled

  return (
    <section
      className={`consent${leaving ? ' is-leaving' : ''}`}
      aria-labelledby="consent-title"
    >
      <h2 className="consent-title" id="consent-title">
        {asking ? 'Can LunX count your visit?' : 'Your progress stays with you'}
      </h2>
      <p className="consent-text">
        {asking
          ? <>Your course progress stays in this browser either way. If you allow it, LunX also counts page views anonymously with GoatCounter: no cookies, nothing that identifies you.</>
          : <>LunX saves your course progress in this browser so the course works. It sets no cookies, runs no tracking, and sends your progress nowhere.</>}
      </p>
      <div className="consent-actions">
        {asking ? (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => answer('granted')}>Allow</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => answer('denied')}>No thanks</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => answer(NOTED)}>OK</button>
        )}
        <PageLink page="privacy" className="consent-link">Privacy policy</PageLink>
      </div>
    </section>
  )
}
