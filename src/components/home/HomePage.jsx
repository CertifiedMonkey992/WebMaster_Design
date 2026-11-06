/* ═══════════════════════════════════════════════════════════════════════════
   HomePage.jsx — THE LANDING PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14. The page follows a community-hub
   format, in LunX's palette, type and content:

     header        sticky: wordmark, the page's sections, the account
     hero          pill, headline, the ways in, the field guide
     parts band    a tinted band with wavy edges and four cards
     inside        a heading with its link, then the product frames
     lessons       every lesson, in two drifting rows
     start card    the framed way in
     footer        evergreen, under a clay rule

   The otter lives in the page itself (otter/OtterScenes.jsx), never as the
   hero: on the headline's words, hanging off a card, floating on the
   lessons' edge, climbing the start card, asleep on the footer.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import HomeHeader from './HomeHeader'
import HomeHero from './HomeHero'
import { InsideHead, LessonMarquee, PartsBand, StartCard } from './HomeSections'
import ProductSections from '../showcase/ProductSections'
import { Napper } from '../otter/OtterScenes'
import { OTTER_SHOWN } from '../otter/shown'
import Footer from '../Footer'
import StickyCta from '../StickyCta'
import './home.css'

export default function HomePage() {
  const foot = useRef(null)
  return (
    <div className="app home">
      <HomeHeader />
      <main id="main" tabIndex={-1}>
        <HomeHero />
        <PartsBand />
        <section className="hs-inside" id="inside" tabIndex={-1} aria-labelledby="inside-heading">
          <InsideHead />
          <ProductSections />
        </section>
        <LessonMarquee />
        <StartCard />
      </main>
      <div className="hs-foot" ref={foot}>
        <Footer />
        {OTTER_SHOWN && <Napper scope={foot} />}
      </div>
      <StickyCta after=".home-hero-actions" until=".hs-start" />
    </div>
  )
}
