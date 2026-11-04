/* ═══════════════════════════════════════════════════════════════════════════
   HomePage.jsx — THE LANDING PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14. The page follows a community-hub
   format, in LunX's palette, type and content:

     header        sticky: wordmark, the page's sections, the account
     hero          pill, headline, a course search, the module deck
     parts band    a tinted band with wavy edges and four cards
     inside        a heading with its link, then the product frames
     lessons       every lesson, in two drifting rows
     start card    the framed way in
     footer        evergreen, under a clay rule

   The otter is a small character on the bottom edge of the screen
   (OtterLane), never the hero: it runs in, follows the reader from section
   to section and plays with the field guide while they read.
   ═══════════════════════════════════════════════════════════════════════════ */

import HomeHeader from './HomeHeader'
import HomeHero from './HomeHero'
import { InsideHead, LessonMarquee, PartsBand, StartCard } from './HomeSections'
import ProductSections from '../showcase/ProductSections'
import OtterLane from '../otter/OtterLane'
import Footer from '../Footer'
import StickyCta from '../StickyCta'
import './home.css'

export default function HomePage() {
  return (
    <div className="app home">
      <HomeHeader />
      <main id="main" tabIndex={-1}>
        <HomeHero />
        <PartsBand />
        <section className="hs-inside" id="inside" tabIndex={-1} aria-labelledby="inside-heading" data-otter="right:read">
          <InsideHead />
          <ProductSections />
        </section>
        <LessonMarquee />
        <StartCard />
      </main>
      <Footer />
      <StickyCta after=".home-hero-actions" until=".hs-start" />
      <OtterLane variant="page" pose="hold" mood="mischievous" region="home:otter" />
    </div>
  )
}
