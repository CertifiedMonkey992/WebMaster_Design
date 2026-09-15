/* ═══════════════════════════════════════════════════════════════════════════
   StickyCta.jsx — THE WAY INTO THE COURSE, WITHIN REACH OF A THUMB
   ---------------------------------------------------------------------------
   Phones only (≤ 720px, SitePages.css). On a phone the navbar's button sits
   at the far top corner, the one place a thumb cannot reach. Once the hero's
   own button has scrolled away, a slim bar rises from the bottom edge with
   one button; it tucks away again while the closing CTA — the same action —
   is on screen, and while the privacy banner holds the bottom of the screen.

   COMPONENT_RULES.md → Links into the course.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { PageLink } from '../nav'

export default function StickyCta({ after = '.hero-cta', until = '.cta-section' }) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const start = document.querySelector(after)
    const end = document.querySelector(until)
    let pastStart = false
    let endVisible = false
    const update = () => setOn(pastStart && !endVisible)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === start) pastStart = !e.isIntersecting && e.boundingClientRect.top < 0
        if (e.target === end) endVisible = e.isIntersecting
      }
      update()
    })
    if (start) io.observe(start)
    if (end) io.observe(end)
    return () => io.disconnect()
  }, [after, until])

  return (
    <div className={`sticky-cta${on ? ' is-on' : ''}`} aria-hidden={!on} inert={on ? undefined : ''}>
      <p className="sticky-cta-text"><b>Lesson one takes five minutes</b>No account needed</p>
      <PageLink page="learn" className="btn btn-next" tabIndex={on ? 0 : -1}>
        Open the course
        <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </PageLink>
    </div>
  )
}
