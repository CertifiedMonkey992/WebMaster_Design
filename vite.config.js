import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SITE, ROUTES, structuredData } from './src/site.js'
import { SECTIONS, TOTAL_LESSONS } from './src/data/learnData.js'

/* ═══════════════════════════════════════════════════════════════════════════
   Every page gets a real, static head.

   The app is one bundle, but each address is published as its own HTML file
   (docs/about/index.html, docs/privacy/index.html, …) carrying that page's
   title, description, canonical URL, Open Graph and Twitter tags, robots
   directive and JSON-LD — so link previews, crawlers and the W3C validator
   see the right head without running JavaScript. GitHub Pages serves
   docs/404.html for any unknown address, and the app renders its not-found
   page there. sitemap.xml and robots.txt are written from the same table
   (src/site.js), so nothing can list a page that does not exist.
   ═══════════════════════════════════════════════════════════════════════════ */

const COURSE = {
  lessons: TOTAL_LESSONS,
  modules: SECTIONS.length,
  minutes: SECTIONS.reduce((m, s) => m + s.lessons.reduce((n, l) => n + parseInt(l.duration, 10), 0), 0),
  moduleTitles: SECTIONS.map((s) => s.title),
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function headFor(route) {
  const url = route.path == null ? null : SITE.url + route.path
  const image = SITE.url + SITE.ogImage
  const ld = JSON.stringify(structuredData(route.page, COURSE)).replace(/</g, '\\u003c')
  return [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}">`,
    route.noindex ? '<meta name="robots" content="noindex, follow">' : null,
    url ? `<link rel="canonical" href="${url}">` : null,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:locale" content="${SITE.locale}">`,
    `<meta property="og:title" content="${esc(route.title)}">`,
    `<meta property="og:description" content="${esc(route.description)}">`,
    url ? `<meta property="og:url" content="${url}">` : null,
    `<meta property="og:image" content="${image}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(SITE.ogImageAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(route.title)}">`,
    `<meta name="twitter:description" content="${esc(route.description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${esc(SITE.ogImageAlt)}">`,
    `<script type="application/ld+json">${ld}</script>`,
  ].filter(Boolean).join('\n    ')
}

const SEO_BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/

function pagesPlugin() {
  return {
    name: 'lunx-pages',
    /* Dev and build both get the home page's head from the table. */
    transformIndexHtml(html) {
      return html.replace(SEO_BLOCK, `<!-- seo:start -->\n    ${headFor(ROUTES[0])}\n    <!-- seo:end -->`)
    },
    /* writeBundle, not closeBundle: it runs only after this build has
       written its files, and names the folder it wrote them to. A failed
       build, or one aimed at another folder, never touches docs/. */
    writeBundle(output) {
      const outDir = output.dir
      if (!outDir) return
      const indexFile = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexFile)) return
      const shell = fs.readFileSync(indexFile, 'utf8')
      const render = (route) => shell.replace(SEO_BLOCK, `<!-- seo:start -->\n    ${headFor(route)}\n    <!-- seo:end -->`)

      for (const route of ROUTES) {
        if (route.page === 'notfound') {
          fs.writeFileSync(path.join(outDir, '404.html'), render(route))
        } else if (route.path) {
          const dir = path.join(outDir, route.path)
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, 'index.html'), render(route))
        }
      }

      const today = new Date().toISOString().slice(0, 10)
      const urls = ROUTES.filter((r) => r.sitemap && r.path != null).map((r) => [
        '  <url>',
        `    <loc>${SITE.url}${r.path}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${r.sitemap.changefreq}</changefreq>`,
        `    <priority>${r.sitemap.priority}</priority>`,
        '  </url>',
      ].join('\n'))
      fs.writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      )

      const hidden = ROUTES.filter((r) => r.noindex && r.path).map((r) => `Disallow: ${SITE.base}${r.path}`)
      fs.writeFileSync(
        path.join(outDir, 'robots.txt'),
        ['User-agent: *', 'Allow: /', ...hidden, '', `Sitemap: ${SITE.url}sitemap.xml`, ''].join('\n'),
      )

      /* GitHub Pages: serve files as they are (no Jekyll processing). */
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '')
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Static tokens, resolved in the published CSS.

   Source CSS always says color: var(--ink) and padding: var(--sp-4) —
   tokens are the rule (CLAUDE.md). A token that is defined once, in
   index.css :root, redefined nowhere and never written by a script cannot
   change at runtime, so the build writes its value into the published
   stylesheet. Nothing renders differently: that is the substitution the
   browser would make. The :root definitions stay, for the scripts that read
   tokens (motion/env.js token()) and for inline styles that name them.

   Why: the W3C CSS validator only checks a var() it can see defined in the
   same file. The lazily loaded page stylesheets (LearnPage, AboutPage, …)
   read tokens defined in the main one, and some calc() forms it cannot type
   at all. With the values written in, every declaration is checked.

   Build only. The dev server keeps live tokens, so editing index.css still
   updates the page without a restart.
   ═══════════════════════════════════════════════════════════════════════════ */

const readText = (file) => fs.readFileSync(file, 'utf8')
const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

function filesUnder(dir, test, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(p, test, out)
    else if (test(p)) out.push(p)
  }
  return out
}

/** Replace var(--name[, fallback]) for every name in `table`, recursively. */
function substituteTokens(value, table, depth = 0) {
  let out = ''
  let i = 0
  for (;;) {
    const at = value.indexOf('var(', i)
    if (at < 0) return out + value.slice(i)
    out += value.slice(i, at)
    let open = 1
    let j = at + 4
    while (j < value.length && open) {
      if (value[j] === '(') open++
      else if (value[j] === ')') open--
      j++
    }
    const inner = value.slice(at + 4, j - 1)
    const comma = inner.indexOf(',')
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim()
    if (table.has(name) && depth < 8) out += substituteTokens(table.get(name), table, depth + 1)
    else if (comma < 0) out += `var(${inner})`
    else out += `var(${inner.slice(0, comma)},${substituteTokens(inner.slice(comma + 1), table, depth + 1)})`
    i = j
  }
}

function staticTokenTable() {
  const src = path.resolve('src')
  const index = withoutComments(readText(path.join(src, 'index.css')))
  const start = index.indexOf('{', index.search(/^:root\s*\{/m)) + 1
  let end = start
  for (let open = 1; open && end < index.length; end++) {
    if (index[end] === '{') open++
    else if (index[end] === '}') open--
  }
  const rootValues = [...index.slice(start, end - 1).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])

  const definitions = new Map()
  for (const file of filesUnder(src, (p) => p.endsWith('.css'))) {
    for (const m of withoutComments(readText(file)).matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)) {
      definitions.set(m[1], (definitions.get(m[1]) || 0) + 1)
    }
  }
  /* Written by a script: style.setProperty('--x'), a style-object key
     { '--x': … }, or a scroll-progress target. (A name that is only read —
     token('--clay'), ring({ color: '--moss' }) — stays static.) */
  const scripts = filesUnder(src, (p) => /\.jsx?$/.test(p)).map(readText).join('\n')
  const written = new Set(
    [...scripts.matchAll(/setProperty\(\s*['"`](--[\w-]+)|[{,]\s*['"`](--[\w-]+)['"`]\s*:|cssVar\s*[:=]\s*['"`](--[\w-]+)/g)]
      .map((m) => m[1] || m[2] || m[3]),
  )

  const table = new Map(rootValues.filter(([name]) => definitions.get(name) === 1 && !written.has(name)))
  for (const [name, value] of table) {
    const resolved = substituteTokens(value, table)
    if (resolved.includes('var(')) table.delete(name)
    else table.set(name, resolved)
  }
  return table
}

function inlineStaticTokens() {
  const table = staticTokenTable()
  return {
    postcssPlugin: 'lunx-inline-static-tokens',
    OnceExit(root) {
      root.walkDecls((decl) => {
        if (decl.value.includes('var(')) decl.value = substituteTokens(decl.value, table)
      })
    },
  }
}
inlineStaticTokens.postcss = true

/* ═══════════════════════════════════════════════════════════════════════════
   Font family names, quoted in the published CSS.

   The source quotes them ('Segoe UI'); the minifier strips the quotes, which
   is valid CSS but draws a validator warning on every font-family. This puts
   quotes back around any family name that contains a space.
   ═══════════════════════════════════════════════════════════════════════════ */
function quotedFontFamilies() {
  const quote = (list) => list.split(',').map((item) => {
    const name = item.trim()
    return /\s/.test(name) && !/^["']/.test(name) ? `"${name}"` : name
  }).join(',')
  return {
    name: 'lunx-quoted-font-families',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue
        file.source = String(file.source).replace(/font-family:([^;}]+)/g, (all, list) => (list.includes('var(') ? all : `font-family:${quote(list)}`))
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), pagesPlugin(), quotedFontFamilies()],
  css: { postcss: { plugins: command === 'build' ? [inlineStaticTokens()] : [] } },
  base: SITE.base,
  server: { port: 5176 },
  build: {
    outDir: 'docs',
    /* The browsers the motion system already needs (individual transform
       properties, :focus-visible, color-mix, unprefixed mask-image). A
       modern CSS target keeps the minifier from adding vendor-prefixed
       copies of standard properties. */
    cssTarget: ['chrome120', 'edge120', 'firefox115', 'safari16.4'],
  },
}))
