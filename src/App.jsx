import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import LessonTicker    from './components/LessonTicker'
import ProductSections from './components/showcase/ProductSections'
import ClosingCTA      from './components/ClosingCTA'
import LoginModal      from './components/LoginModal'
import Footer          from './components/Footer'
import LearnPage       from './pages/LearnPage'
import AboutPage       from './pages/AboutPage'

import { ProgressionProvider } from './state/ProgressionContext'
import FxLayer from './motion/FxLayer'
import { turnPage } from './motion/pageTurn'
/* Last, so the shared verbs (magnet, press, reveal) sit on top of the
   component stylesheets imported above rather than being overridden by them. */
import './motion/motion.css'

/* Three pages, each at its own address, so any of them can be linked to,
   refreshed, or reached with Back. The hash form works on static hosting
   with no server rewrites. In-page fragments on the landing page (#streak)
   are not page addresses: they resolve to the landing page and leave it be.
   The order is the book's order, and sets which way a page turns. */
const PAGES = ['landing', 'about', 'learn']
const PAGE_HASH = { landing: '', about: '#/about', learn: '#/learn' }
const pageFromHash = (hash) => PAGES.find((p) => PAGE_HASH[p] && PAGE_HASH[p] === hash) ?? 'landing'

export default function App() {
  const [loginOpen,    setLoginOpen]    = useState(false)
  const [currentPage,  setCurrentPage]  = useState(() => pageFromHash(window.location.hash))
  /* A section to land on when a page opens (the footer's "TSA compliance"). */
  const [anchor,       setAnchor]       = useState(null)
  const pageRef = useRef(currentPage)
  pageRef.current = currentPage

  /* The landing page and the app are one book: moving between them turns a
     page (MOTION_RULES.md → Page turns). 'instant' because the html element
     scrolls smoothly, and the new page must start at its top, not travel. */
  const show = useCallback((page, { push = true, section = null } = {}) => {
    const from = pageRef.current
    if (page === from) return
    if (push) {
      window.history.pushState(null, '', PAGE_HASH[page] || `${window.location.pathname}${window.location.search}`)
    }
    turnPage(() => {
      setAnchor(section)
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, { dir: PAGES.indexOf(page) > PAGES.indexOf(from) ? 1 : -1 })
  }, [])

  /* Back and Forward. */
  useEffect(() => {
    const onPop = () => show(pageFromHash(window.location.hash), { push: false })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [show])

  /* Land on the requested section once the new page is in the document. An
     effect runs after the commit, so the section exists; no frame is needed. */
  useEffect(() => {
    if (!anchor) return
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'instant', block: 'start' })
    setAnchor(null)
  }, [anchor, currentPage])

  const goLearn = () => show('learn')
  const goHome  = () => show('landing')
  const goAbout = (section = null) => show('about', { section })

  if (currentPage === 'learn') {
    return (
      <ProgressionProvider>
        <FxLayer />
        <LearnPage
          onGoHome={goHome}
          onGoAbout={() => goAbout()}
          onLoginClick={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </ProgressionProvider>
    )
  }

  if (currentPage === 'about') {
    return (
      <>
        <FxLayer />
        <AboutPage onGoHome={goHome} onStartLearning={goLearn} />
      </>
    )
  }

  /* The landing page has exactly two ways into the course: the navbar's
     button (always on screen) and the closing CTA (the bottom of the page).
     COMPONENT_RULES.md → Links into the course. The About links are page
     links, not course links. */
  return (
    <div className="app">
      <FxLayer />
      <Navbar onStartLearning={goLearn} pageLink={{ label: 'About', onClick: () => goAbout() }} />

      <main>
        <Hero />
        <LessonTicker />
        <ProductSections />
        <ClosingCTA onStartLearning={goLearn} />
      </main>

      <Footer
        links={[
          { label: 'About LunX', onClick: () => goAbout() },
          { label: 'How a lesson works', onClick: () => goAbout('method') },
          { label: 'Credits', onClick: () => goAbout('credits') },
          { label: 'TSA compliance', onClick: () => goAbout('compliance') },
        ]}
      />

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  )
}
