/* ═══════════════════════════════════════════════════════════════════════════
   HomePage.jsx — THE LANDING PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12. The structure follows duolingo.com's
   home page; the palette, type, content and every live component are LunX's
   own:

     header        fixed bar; its button arrives once the hero's have gone
     hero          the otter scene + the sentence + two ledge buttons
     module strip  the seven modules; a chip opens the book at its chapter
     feature rows  the real product on demo learners (showcase/)
     course map    the field guide with its chapter tiles
     closing       heading, button, the otter on an evergreen hill
     footer        evergreen, shared with every page
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import HomeHeader from './HomeHeader'
import HomeHero from './HomeHero'
import ModuleStrip from './ModuleStrip'
import CourseMap from './CourseMap'
import ClosingScene from './ClosingScene'
import ProductSections from '../showcase/ProductSections'
import Footer from '../Footer'
import StickyCta from '../StickyCta'
import './home.css'

export default function HomePage() {
  const map = useRef(null)

  /* A chip in the strip: bring the course map into view, then open the book
     there once the scroll has carried it on screen. */
  const openChapter = (i) => {
    document.getElementById('course-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => map.current?.open(i), 650)
  }

  return (
    <div className="app home">
      <HomeHeader />
      <main id="main" tabIndex={-1}>
        <HomeHero />
        <ModuleStrip onOpen={openChapter} />
        <ProductSections />
        <CourseMap ref={map} />
        <ClosingScene />
      </main>
      <Footer />
      <StickyCta after=".home-hero-actions" until=".home-closing" />
    </div>
  )
}
