/* ═══════════════════════════════════════════════════════════════════════════
   NotFoundPage.jsx — AN ADDRESS THAT IS NOT IN THE GUIDE
   ---------------------------------------------------------------------------
   Served by the app for any unknown path, and by GitHub Pages as 404.html
   (the build writes it with a noindex head). It says plainly what happened
   and offers the three places a lost reader most likely wanted: the course,
   the home page and the contents of the guide.
   ═══════════════════════════════════════════════════════════════════════════ */

import SitePage from './SitePage'
import { PageLink } from '../nav'
import { SECTIONS } from '../data/learnData'
import { pad } from '../components/guide/guideData'

export default function NotFoundPage() {
  return (
    <SitePage
      eyebrow="Error 404 · page not found"
      title={<>This page isn’t in <em className="em">the field guide</em>.</>}
      lead="The address may be mistyped, or the page may have moved when LunX gave every page its own address. Everything that exists is listed below."
    >
      <div className="sp-actions">
        <PageLink page="learn" className="btn btn-next btn-lg" data-magnetic="8">
          Open the course
          <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </PageLink>
        <PageLink page="landing" className="btn btn-outline btn-lg">Back to the home page</PageLink>
      </div>

      <h2 className="sp-h2">Contents</h2>
      <ol className="sp-rows">
        {SECTIONS.map((s, i) => (
          <li key={s.id} className="sp-row">
            <span className="sp-row-num tnum" aria-hidden="true">{pad(i + 1)}</span>
            <span className="sp-row-title">{s.title}</span>
            <span className="sp-row-meta tnum">{s.lessons.length} lessons</span>
          </li>
        ))}
      </ol>

      <p className="sp-note">
        Other pages: <PageLink page="about">About LunX</PageLink>, <PageLink page="contact">Contact</PageLink>,{' '}
        <PageLink page="privacy">Privacy policy</PageLink> and <PageLink page="terms">Terms of use</PageLink>.
      </p>
    </SitePage>
  )
}
