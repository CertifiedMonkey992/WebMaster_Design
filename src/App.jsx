import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './components/SiteChrome.css'

import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import LessonTicker    from './components/LessonTicker'
import ProductSections from './components/showcase/ProductSections'
import ClosingCTA      from './components/ClosingCTA'
import Footer          from './components/Footer'
import ConsentBanner   from './components/ConsentBanner'
import StickyCta       from './components/StickyCta'
import PageLoading     from './components/PageLoading'

import FxLayer from './motion/FxLayer'
import { SpiderCursor } from '@/components/ui/spider-cursor'
import { turnPage } from './motion/pageTurn'
import { afterArrival, setStageMode } from './motion/stage'
import { NavProvider, usePageMeta } from './nav'
import { PAGES, routeOf, pageFromLocation } from './site'
import { initAnalytics, pageview } from './services/analytics'
/* Last, so the shared verbs (magnet, press, reveal) sit on top of the
   component stylesheets imported above rather than being overridden by them. */
import './motion/motion.css'

/* Every page but the home page is loaded when first needed, so a first visit
   downloads only what the home page shows. `load` is kept so a page can be
   fetched BEFORE its page turn starts — a turn must never snapshot a loader. */
const LOADERS = {
  learn:    () => import('./pages/LearnPage'),
  about:    () => import('./pages/AboutPage'),
  contact:  () => import('./pages/ContactPages').then((m) => ({ default: m.ContactPage })),
  thanks:   () => import('./pages/ContactPages').then((m) => ({ default: m.ThanksPage })),
  privacy:  () => import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage })),
  terms:    () => import('./pages/LegalPages').then((m) => ({ default: m.TermsPage })),
  notfound: () => import('./pages/NotFoundPage'),
}
const LAZY = Object.fromEntries(Object.entries(LOADERS).map(([k, load]) => [k, lazy(load)]))

const BASE = import.meta.env.BASE_URL
/* `?dev=1` travels with the reader from page to page, so the developer panel
   does not vanish on the first page turn. */
const devQuery = () => {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.has('dev') ? `?${q}` : ''
  } catch { return '' }
}
const hrefOf = (page) => BASE + (routeOf(page).path ?? '') + devQuery()
/* The section named by the address's fragment, if any (#streak → 'streak').
   Old hash addresses (#/about) are pages, not sections. */
const sectionOf = (hash) => (hash.length > 1 && !hash.startsWith('#/') ? hash.slice(1) : null)

/* Old hash addresses (#/about) become real ones before anything renders. */
function initialPage() {
  const page = pageFromLocation(window.location, BASE)
  if (/^#\/(about|learn)$/.test(window.location.hash)) {
    window.history.replaceState(null, '', hrefOf(page))
  }
  return page
}

export default function App() {
  const [currentPage,  setCurrentPage]  = useState(initialPage)
  /* A section to land on when a page opens (the footer's "TSA compliance"). */
  const [anchor,       setAnchor]       = useState(() => sectionOf(window.location.hash))
  const pageRef = useRef(currentPage)
  pageRef.current = currentPage
  const navigated = useRef(false)

  usePageMeta(currentPage)

  /* The landing page and the app are one book: moving between pages turns a
     page (MOTION_RULES.md → Page turns). The next page's code is fetched
     first, so the turn shows the real page, not a loader. 'instant' because
     the html element scrolls smoothly, and the new page must start at its
     top, not travel. */
  const go = useCallback((page, { push = true, section = null } = {}) => {
    const from = pageRef.current
    if (page === from) {
      if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (push) window.history.pushState(null, '', hrefOf(page) + (section ? `#${section}` : ''))
    navigated.current = true
    const ready = LOADERS[page] ? LOADERS[page]().catch(() => null) : Promise.resolve()
    ready.then(() => {
      turnPage(() => {
        setAnchor(section)
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, { dir: PAGES.indexOf(page) > PAGES.indexOf(from) ? 1 : -1 })
    })
  }, [])

  const nav = useMemo(() => ({ page: currentPage, go, href: hrefOf }), [currentPage, go])

  /* Back and Forward — including between sections of one page (#streak,
     #quests), which land on the section rather than at the top. */
  useEffect(() => {
    const onPop = () => go(pageFromLocation(window.location, BASE), { push: false, section: sectionOf(window.location.hash) })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [go])

  /* Land on the requested section once the new page is in the document; and
     after a page change the reader's focus starts at the new page's main
     content, so a screen reader announces where they are. */
  useEffect(() => {
    if (anchor) {
      const t = window.setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'instant', block: 'start' })
        setAnchor(null)
      }, 60)
      return () => clearTimeout(t)
    }
    if (navigated.current) {
      const t = window.setTimeout(() => document.querySelector('main')?.focus({ preventScroll: true }), 80)
      return () => clearTimeout(t)
    }
    return undefined
  }, [anchor, currentPage])

  /* Visit counting (only with permission; services/analytics.js). */
  useEffect(() => { initAnalytics() }, [])
  useEffect(() => { pageview(window.location.pathname) }, [currentPage])

  /* The Stage's temperament, per page (MOTION_RULES.md revision 6 → The shop
     window). The landing page runs its machinery continuously — overlapping
     performances, short rests, demonstrations that loop. Everywhere behind
     the front door speaks one sentence at a time, because that is where the
     reader is concentrating. */
  useEffect(() => {
    setStageMode(currentPage === 'landing' ? 'continuous' : 'considered')
    return () => setStageMode('considered')
  }, [currentPage])

  /* Once the page has arrived, fetch the pages a visitor is likely to open
     next, so the first page turn does not wait on the network. */
  useEffect(() => afterArrival(() => {
    const next = currentPage === 'landing' ? ['learn', 'about'] : currentPage === 'learn' ? [] : ['learn']
    next.forEach((p) => LOADERS[p]?.().catch(() => {}))
  }), [currentPage])

  let page
  if (currentPage === 'landing') {
    /* The hero's button and the closing CTA are the page's ways into the
       course; the navbar's button is always on screen, and on a phone a
       sticky button takes over once the hero's has scrolled away.
       COMPONENT_RULES.md → Links into the course. */
    page = (
      <div className="app">
        <Navbar pageLink={{ label: 'About', page: 'about' }} />

        <main id="main" tabIndex={-1}>
          <Hero />
          <LessonTicker />
          <ProductSections />
          <ClosingCTA />
        </main>

        <Footer />
        <StickyCta />
      </div>
    )
  } else if (currentPage === 'learn') {
    /* LearnPage brings its own ProgressionProvider, so the learner's state
       code loads with the course rather than with the home page. */
    const LearnPage = LAZY.learn
    page = (
      <LearnPage
        onGoHome={() => go('landing')}
        onGoAbout={() => go('about')}
      />
    )
  } else {
    const Page = LAZY[currentPage] ?? LAZY.notfound
    page = <Page />
  }

  return (
    <NavProvider value={nav}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); const m = document.querySelector('main'); m?.focus(); m?.scrollIntoView() }}>
        Skip to content
      </a>
      <FxLayer />
      <SpiderCursor />
      <Suspense fallback={<PageLoading label={currentPage === 'learn' ? 'Opening the course…' : 'Opening the page…'} />}>
        {page}
      </Suspense>
      <ConsentBanner />
    </NavProvider>
  )
}
