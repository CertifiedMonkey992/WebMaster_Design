/* ═══════════════════════════════════════════════════════════════════════════
   Footer.jsx — THE LAST CHAPTER
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Site footer.

   Not a bin for links that had nowhere else to go. Three bands on one paper
   ground: the colophon (what LunX is, in the course's real figures), two
   columns of real links, and the last line — the privacy fact, the policy
   date, and the way back to the top.

   What is not here is deliberate. There are no social accounts, no
   newsletter and no app; a footer that showed them would be describing a
   different product. Contact is the contact page and the repository, which
   is all SITE.contact has.

   It does not repeat the course button: the closing CTA directly above is
   the way in at the bottom of the page, and a second button one line below
   would only dilute it.

   Its one piece of motion is a Stage Accent (MOTION_RULES.md → The
   sanctioned performances → Footer): now and then the clay rule under the
   colophon is drawn again, in its turn with everything else on the page.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { PageLink, useNav } from '../nav'
import { SITE } from '../site'
import { reopenChoices } from '../services/analytics'
import { TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { usePerformer } from '../motion/stage'
import { DUR } from '../motion/timing'

const LETTERS = ['L', 'u', 'n', 'X']
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

/* Two columns, each with a job. "The course" is what a reader who wants to
   learn something clicks; "The project" is what a judge, a teacher or a
   curious developer clicks. */
const COLUMNS = [
  {
    heading: 'The course',
    links: [
      { page: 'learn', label: 'Open the course' },
      { page: 'about', section: 'method', label: 'How a lesson works' },
      { page: 'about', section: 'impact', label: 'What it covers' },
      /* Last, and worded as what it is: the course needs no profile, so this
         is not an invitation, it is where the one option lives. */
      { page: 'signin', label: 'Profiles on this browser' },
    ],
  },
  {
    heading: 'The project',
    links: [
      { page: 'about', label: 'About LunX' },
      { page: 'about', section: 'compliance', label: 'TSA compliance' },
      { page: 'contact', label: 'Contact' },
      { href: SITE.contact.github, label: 'Source', external: true },
    ],
  },
]

/* A 45° arrow: this link leaves LunX. It travels up-right with the label. */
function ExternalMark() {
  return (
    <svg className="ft-out" width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M7 17 17 7" /><path d="M8 7h9v9" />
    </svg>
  )
}

function FooterLink({ link }) {
  if (link.external) {
    return (
      <a className="ft-link" href={link.href} target="_blank" rel="noreferrer noopener">
        <span className="ft-link-label">{link.label}</span>
        <ExternalMark />
        <span className="pg-sr-only"> (opens GitHub in a new tab)</span>
      </a>
    )
  }
  return (
    <PageLink className="ft-link" page={link.page} section={link.section}>
      <span className="ft-link-label">{link.label}</span>
    </PageLink>
  )
}

const POLICY_DATE = new Date(`${SITE.policiesUpdated}T00:00:00`)
const policyLabel = POLICY_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function Footer() {
  const { page: current } = useNav()
  const ruleRef = useRef(null)

  /* Accent: the rule under the colophon is drawn again. The Stage decides
     when; this only decides what. */
  usePerformer(ruleRef, {
    id: 'footer:rule',
    region: 'footer',
    tier: 'accent',
    cooldown: 9000,
    share: 0.8,
    run: async (ctx) => {
      const rule = ruleRef.current
      if (!rule) return
      rule.setAttribute('data-draw', '')
      ctx.onStop(() => rule.removeAttribute('data-draw'))
      await ctx.wait(DUR.celebrate)
      rule.removeAttribute('data-draw')
    },
  })

  return (
    <footer className="footer" data-stage-region="footer">
      <div className="ft-main">
        {/* ── Colophon: the dominant column ───────────────────────────────── */}
        <div className="ft-colophon">
          <button
            type="button"
            className="ft-mark"
            onClick={toTop}
            aria-label="LunX — back to top"
          >
            {LETTERS.map((ch, i) => (
              <span key={i} className="wm-letter" style={{ '--i': i }} aria-hidden="true">{ch}</span>
            ))}
          </button>
          <span className="ft-rule" ref={ruleRef} aria-hidden="true" />
          <p className="ft-statement">
            A field guide to how AI actually works — written for people who
            already use it every day.
          </p>
          <p className="ft-figures">
            {TOTAL_LESSONS} lessons · {TOTAL_SECTIONS} modules · no account
          </p>
        </div>

        {/* ── Two columns of real links ───────────────────────────────────── */}
        {COLUMNS.map((col) => (
          <nav className="ft-col" key={col.heading} aria-label={col.heading}>
            <h2 className="ft-col-heading">{col.heading}</h2>
            <ul className="ft-list">
              {col.links
                .filter((l) => l.external || l.section || l.page !== current)
                .map((l) => (
                  <li key={l.label}><FooterLink link={l} /></li>
                ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* ── The last line ─────────────────────────────────────────────────── */}
      <div className="ft-last">
        <p className="ft-privacy">
          Your progress never leaves this browser.
          {SITE.analytics.enabled ? '' : ' No server, no cookies, no tracking.'}
        </p>

        <nav className="ft-legal" aria-label="Legal">
          <PageLink className="ft-legal-link" page="privacy">Privacy</PageLink>
          <span className="ft-dot" aria-hidden="true">·</span>
          <PageLink className="ft-legal-link" page="terms">Terms</PageLink>
          <span className="ft-dot" aria-hidden="true">·</span>
          <button type="button" className="ft-legal-link" onClick={reopenChoices}>
            Privacy choices
          </button>
          <span className="ft-updated">Updated {policyLabel}</span>
        </nav>

        <button
          type="button"
          className="ft-top"
          onClick={toTop}
          aria-label="Back to top"
          data-tip="Back to top"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </div>
    </footer>
  )
}
