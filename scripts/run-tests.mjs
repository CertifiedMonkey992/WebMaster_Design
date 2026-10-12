/* Runs the engine's self-check suites under Node, so `npm test` and CI
   exercise the same reducer the app does:

     src/dev/progressionTests.js   the progression engine
     src/dev/practiceTests.js      the adaptive Practice engine (revision 10)
     src/dev/leagueTests.js        the shared league rules and week boundaries

   (The LunX server has its own suite, server/test/, which `npm test` runs
   after this one.)

   The suites are written for the browser console, with Vite-style imports,
   so they are bundled first with the esbuild Vite already ships.

   They run twice: once on the real clock, and once with `Date` pinned to a
   day on which the quest seeds once dealt a set the suite could not drive
   (2026-01-01T12:00Z). Both must pass. */

import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/* PIN_DATE=YYYY-MM-DD picks another day for the pinned run. */
const PINNED = process.env.PIN_DATE
  ? Date.parse(`${process.env.PIN_DATE}T12:00:00Z`)
  : Date.UTC(2026, 0, 1, 12, 0, 0)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = mkdtempSync(path.join(tmpdir(), 'lunx-tests-'))
const bundle = path.join(out, 'selfTests.mjs')

const SUITES = [
  ['engine', 'runProgressionTests', 'src/dev/progressionTests.js'],
  ['practice', 'runPracticeTests', 'src/dev/practiceTests.js'],
  ['leagues', 'runLeagueTests', 'src/dev/leagueTests.js'],
]

/** Swap the global Date for one whose "now" is `ms`; returns the restore. */
function pinDate(ms) {
  const RealDate = Date
  class PinnedDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [ms]))
    }
    static now() { return ms }
  }
  globalThis.Date = PinnedDate
  return () => { globalThis.Date = RealDate }
}

async function runOnce(label) {
  /* A distinct module instance per run, so nothing memoised in the first
     run (the showcase seed, for one) leaks into the pinned one. */
  const mod = await import(`${pathToFileURL(bundle).href}?run=${encodeURIComponent(label)}`)
  let allOk = true
  for (const [name, fn] of SUITES) {
    const result = await mod[fn]()
    for (const f of result.failures) console.error(`FAIL [${label} · ${name}]  ${f.name}${f.detail ? `  (${f.detail})` : ''}`)
    console.log(`${label} · ${name}: ${result.summary}`)
    if (result.failures.length) allOk = false
  }
  return allOk
}

try {
  await build({
    stdin: {
      contents: SUITES.map(([, fn, file]) => `export { ${fn} } from './${file}'`).join('\n'),
      resolveDir: root,
      sourcefile: 'self-tests.js',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    define: { 'import.meta.env.DEV': 'false', 'import.meta.env': '{}' },
    outfile: bundle,
    logLevel: 'warning',
  })
  const realOk = await runOnce('real clock')
  const restore = pinDate(PINNED)
  let pinnedOk = false
  try { pinnedOk = await runOnce(`pinned ${new Date(PINNED).toISOString().slice(0, 10)}`) } finally { restore() }
  process.exitCode = realOk && pinnedOk ? 0 : 1
} finally {
  rmSync(out, { recursive: true, force: true })
}
