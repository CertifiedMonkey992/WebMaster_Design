/* ═══════════════════════════════════════════════════════════════════════════
   nav.jsx — MOVING BETWEEN PAGES
   ---------------------------------------------------------------------------
   Every page has a real address (site.js), so every link to a page is a real
   link: <PageLink page="about"> renders an <a href> that a crawler can
   follow and a reader can open in a new tab, copy, or middle-click. A plain
   click is intercepted and turns the page (App.jsx → go), so the SPA still
   moves like one book.

     const { page, go, href } = useNav()
     <PageLink page="learn" className="btn btn-primary">Open the course</PageLink>

   usePageMeta(page) keeps the document's head — title, description,
   canonical URL, Open Graph and robots — true to the page on screen. The
   static HTML the build writes for each page carries the same values, so the
   head is right before and after JavaScript runs.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createContext, forwardRef, useContext, useEffect } from 'react'
import { SITE, routeOf, urlOf } from './site'

const NavContext = createContext({ page: 'landing', go: () => {}, href: () => SITE.base })

export const NavProvider = NavContext.Provider
export const useNav = () => useContext(NavContext)

/** A link to one of the site's pages. `section` lands on an id on arrival. */
export const PageLink = forwardRef(function PageLink({ page, section, onClick, children, ...rest }, ref) {
  const { go, href } = useNav()
  const target = href(page) + (section ? `#${section}` : '')
  const follow = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    /* A new tab, a new window, a download: the browser's job. */
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(page, { section })
  }
  return (
    <a ref={ref} href={target} onClick={follow} {...rest}>
      {children}
    </a>
  )
})

function setMeta(selector, attr, value, create) {
  let el = document.head.querySelector(selector)
  if (!el && create) {
    el = document.createElement(create.tag)
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v))
    document.head.appendChild(el)
  }
  if (!el) return
  if (value == null) el.remove()
  else el.setAttribute(attr, value)
}

export function usePageMeta(page) {
  useEffect(() => {
    const route = routeOf(page)
    const url = route.path == null ? null : urlOf(page)
    document.title = route.title
    setMeta('meta[name="description"]', 'content', route.description, { tag: 'meta', attrs: { name: 'description' } })
    setMeta('link[rel="canonical"]', 'href', url, { tag: 'link', attrs: { rel: 'canonical' } })
    setMeta('meta[property="og:title"]', 'content', route.title, { tag: 'meta', attrs: { property: 'og:title' } })
    setMeta('meta[property="og:description"]', 'content', route.description, { tag: 'meta', attrs: { property: 'og:description' } })
    setMeta('meta[property="og:url"]', 'content', url, { tag: 'meta', attrs: { property: 'og:url' } })
    setMeta('meta[name="twitter:title"]', 'content', route.title, { tag: 'meta', attrs: { name: 'twitter:title' } })
    setMeta('meta[name="twitter:description"]', 'content', route.description, { tag: 'meta', attrs: { name: 'twitter:description' } })
    setMeta('meta[name="robots"]', 'content', route.noindex ? 'noindex, follow' : null, { tag: 'meta', attrs: { name: 'robots' } })
  }, [page])
}
