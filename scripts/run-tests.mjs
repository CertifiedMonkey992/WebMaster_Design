/* Runs the progression engine's self-check suite (src/dev/progressionTests.js)
   under Node, so `npm test` and CI exercise the same reducer the app does.

   The suite is written for the browser console, with Vite-style imports, so
   it is bundled first with the esbuild Vite already ships. */

import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = mkdtempSync(path.join(tmpdir(), 'lunx-tests-'))
const bundle = path.join(out, 'progressionTests.mjs')

try {
  await build({
    entryPoints: [path.join(root, 'src/dev/progressionTests.js')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    define: { 'import.meta.env.DEV': 'false', 'import.meta.env': '{}' },
    outfile: bundle,
    logLevel: 'warning',
  })
  const { runProgressionTests } = await import(pathToFileURL(bundle).href)
  const result = await runProgressionTests()
  for (const f of result.failures) console.error(`FAIL  ${f.name}${f.detail ? `  (${f.detail})` : ''}`)
  console.log(result.summary)
  process.exitCode = result.failures.length ? 1 : 0
} finally {
  rmSync(out, { recursive: true, force: true })
}
