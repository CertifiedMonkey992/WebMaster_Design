/* ═══════════════════════════════════════════════════════════════════════════
   site.js — THE SITE'S ADDRESSES, ITS HEAD, AND WHO TO CONTACT
   ---------------------------------------------------------------------------
   One table of pages, read by two consumers so they can never disagree:

     · the app (App.jsx) — which page an address is, what its title and
       description are, and where a link to it points
     · the build (vite.config.js) — a static HTML file per page with that
       page's <title>, description, canonical URL, Open Graph tags and
       JSON-LD already in it, so crawlers, link previews and validators see
       the right head without running any JavaScript; plus 404.html,
       sitemap.xml and robots.txt

   Plain data and pure functions only: vite.config.js imports this file in
   Node, so nothing here may touch the DOM at import time.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SITE = {
  name: 'LunX',
  /* Where the build is published (GitHub Pages, deployed by CI). */
  origin: 'https://certifiedmonkey992.github.io',
  base: '/WebMaster_Design/',
  get url() { return this.origin + this.base },
  locale: 'en_US',
  themeColor: '#F2EBDF',
  ogImage: 'og-image.jpg',
  ogImageAlt: 'The LunX field guide on a desk beside the words “A field guide to the AI you already use.”',

  /* How to reach the people who made LunX. LunX is a TSA Webmaster chapter
     entry, so the public route is the project's GitHub page, which does not
     name students or a school. Set `email` to a team inbox to let the
     contact form open an email draft instead. */
  contact: {
    email: null,
    github: 'https://github.com/CertifiedMonkey992/WebMaster_Design',
    get issues() { return `${this.github}/issues` },
    get newIssue() { return `${this.github}/issues/new` },
  },

  /* Visit counting. Off unless a GoatCounter site code is set here AND the
     visitor allows it in the privacy banner. GoatCounter sets no cookies and
     stores no personal data. Create a free site at goatcounter.com and put
     its code (the part before .goatcounter.com) here. */
  analytics: {
    goatcounter: '',
    get enabled() { return Boolean(this.goatcounter) },
  },

  /* When the privacy policy and terms last changed. */
  policiesUpdated: '2026-09-19',
}

const DESCRIPTION = 'LunX is a field guide to how AI works for high school students: interactive lessons on machine learning, neural networks, AI tools and ethics, with XP, streaks and badges. No account needed.'

/* Order matters: it is the book's order, and sets which way a page turns. */
export const ROUTES = [
  {
    page: 'landing',
    path: '',
    title: 'LunX · A field guide to how AI works',
    description: DESCRIPTION,
    sitemap: { priority: '1.0', changefreq: 'weekly' },
  },
  {
    page: 'about',
    path: 'about/',
    title: 'About LunX · The story, the course and the TSA brief',
    description: 'Why LunX looks like a printed field guide, what its 22-lesson AI course covers, how a lesson works, and how it answers the 2026–27 TSA Webmaster theme.',
    sitemap: { priority: '0.8', changefreq: 'monthly' },
  },
  {
    page: 'contact',
    path: 'contact/',
    title: 'Contact LunX · Questions, feedback and bug reports',
    description: 'Send the LunX team a question, a correction or a bug report about the AI course. No account needed.',
    sitemap: { priority: '0.5', changefreq: 'yearly' },
  },
  {
    page: 'thanks',
    path: 'contact/thanks/',
    title: 'Thank you · LunX',
    description: 'Your message to the LunX team is ready to send.',
    noindex: true,
  },
  {
    page: 'privacy',
    path: 'privacy/',
    title: 'Privacy policy · LunX',
    description: 'What LunX stores, where it stays, and what it never collects: progress lives in your browser, with no accounts and no tracking cookies.',
    sitemap: { priority: '0.3', changefreq: 'yearly' },
  },
  {
    page: 'terms',
    path: 'terms/',
    title: 'Terms of use · LunX',
    description: 'The terms for using LunX, a free AI learning portal for high school students.',
    sitemap: { priority: '0.3', changefreq: 'yearly' },
  },
  {
    page: 'learn',
    path: 'learn/',
    title: 'The course · LunX',
    description: 'Start the LunX course: 22 short, interactive lessons on how AI works, from what counts as AI to the ethics of using it. Progress saves in your browser.',
    sitemap: { priority: '0.9', changefreq: 'weekly' },
  },
  {
    page: 'notfound',
    path: null,
    title: 'Page not found · LunX',
    description: 'This page is not in the LunX field guide.',
    noindex: true,
  },
]

export const PAGES = ROUTES.map((r) => r.page)
export const routeOf = (page) => ROUTES.find((r) => r.page === page) ?? ROUTES.find((r) => r.page === 'notfound')

/** The public URL of a page (absolute). */
export const urlOf = (page) => SITE.url + (routeOf(page).path ?? '')

/**
 * Which page an address is. Accepts the old hash addresses (#/about,
 * #/learn) so links shared before the site had real paths still land.
 */
export function pageFromLocation(loc, base = SITE.base) {
  const legacy = { '#/about': 'about', '#/learn': 'learn' }[loc.hash]
  if (legacy) return legacy
  let p = loc.pathname || '/'
  if (p.startsWith(base)) p = p.slice(base.length)
  else if (base.startsWith(p + '/') || p === '/') p = ''
  else p = p.replace(/^\//, '')
  p = p.replace(/index\.html$/, '')
  if (p && !p.endsWith('/')) p += '/'
  const route = ROUTES.find((r) => r.path === p)
  return route ? route.page : 'notfound'
}

/* ── Structured data (JSON-LD) ────────────────────────────────────────────── */

const organization = () => ({
  '@type': 'Organization',
  '@id': `${SITE.url}#organization`,
  name: 'LunX',
  url: SITE.url,
  logo: `${SITE.url}icon-512.png`,
  sameAs: [SITE.contact.github],
})

const breadcrumbs = (page) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
    { '@type': 'ListItem', position: 2, name: routeOf(page).title.split(' · ')[0], item: urlOf(page) },
  ],
})

/**
 * The JSON-LD graph for a page. `course` is { lessons, modules, minutes,
 * moduleTitles } from the course data, passed in by the build so this file
 * does not import the app.
 */
export function structuredData(page, course) {
  const route = routeOf(page)
  const webpage = {
    '@type': 'WebPage',
    '@id': `${urlOf(page)}#webpage`,
    url: urlOf(page),
    name: route.title,
    description: route.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE.url}#website` },
  }
  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.url}#website`,
    name: 'LunX',
    url: SITE.url,
    description: DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': `${SITE.url}#organization` },
  }
  const courseNode = course && {
    '@type': 'Course',
    '@id': `${SITE.url}#course`,
    name: 'A field guide to how AI works',
    description: `${course.lessons} interactive lessons in ${course.modules} modules on how AI works: ${course.moduleTitles.join(', ')}.`,
    url: urlOf('learn'),
    provider: { '@id': `${SITE.url}#organization` },
    inLanguage: 'en',
    educationalLevel: 'High school (grades 9–12)',
    teaches: course.moduleTitles,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'USD' },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `PT${course.minutes}M`,
    },
  }

  const graph = [website, organization()]
  switch (page) {
    case 'landing':
      graph.push({ ...webpage, '@type': 'WebPage', about: { '@id': `${SITE.url}#course` } }, courseNode)
      break
    case 'learn':
      graph.push(webpage, courseNode, breadcrumbs(page))
      break
    case 'about':
      graph.push({ ...webpage, '@type': 'AboutPage' }, breadcrumbs(page))
      break
    case 'contact':
      graph.push({ ...webpage, '@type': 'ContactPage' }, breadcrumbs(page))
      break
    case 'privacy':
    case 'terms':
      graph.push({ ...webpage, dateModified: SITE.policiesUpdated }, breadcrumbs(page))
      break
    default:
      graph.push(webpage)
  }
  return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) }
}
