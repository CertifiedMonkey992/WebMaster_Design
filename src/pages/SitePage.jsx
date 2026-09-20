/* ═══════════════════════════════════════════════════════════════════════════
   SitePage.jsx — THE SHELL FOR THE SITE'S PLAIN PAGES
   ---------------------------------------------------------------------------
   Contact, thank you, privacy, terms and "not found" are reading pages, built
   the way DESIGN_PHILOSOPHY.md → "Applying this to a page that does not exist
   yet" asks: the paper ground, the shared navbar and footer, a centre column
   capped at the reading measure, a Fraunces title with at most one italic
   clay phrase, and rows rather than cards.

   The navbar carries no section links here (these pages have none worth a
   bar); its one solid button still opens the course.
   ═══════════════════════════════════════════════════════════════════════════ */

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import './SitePages.css'

/* One shared empty list, so the navbar's props are stable between renders. */
const NO_LINKS = []

export default function SitePage({ eyebrow, title, lead, children, wide = false, headingId = 'page-heading' }) {
  return (
    <div className="app">
      <Navbar links={NO_LINKS} pageLink={{ label: 'Home', page: 'landing' }} />
      <main className={`sp${wide ? ' sp--wide' : ''}`} id="main" tabIndex={-1}>
        <header className="sp-head">
          {eyebrow && (
            <Reveal as="p" variant="left" immediate delay={60} className="sp-eyebrow">{eyebrow}</Reveal>
          )}
          <SplitText as="h1" className="sp-title" id={headingId} immediate delay={100} stagger={34}>
            {title}
          </SplitText>
          {lead && (
            <Reveal as="p" className="sp-lead" immediate delay={320}>{lead}</Reveal>
          )}
        </header>
        <Reveal className="sp-body" variant="up" immediate delay={420}>
          {children}
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
