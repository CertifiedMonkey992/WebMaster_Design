/* ═══════════════════════════════════════════════════════════════════════════
   resolve-hooks.mjs — LET NODE READ THE APP'S OWN MODULES
   ---------------------------------------------------------------------------
   The server grades answers with the same course content and the same rules
   the app uses (src/data, src/utils, src/config). Those files are written for
   Vite, which resolves `import './helpers'` without an extension; Node's ESM
   loader does not. This hook retries a relative import that was not found
   with `.js` appended — nothing else changes about how modules load.
   ═══════════════════════════════════════════════════════════════════════════ */

const HAS_EXT = /\.[cm]?jsx?$|\.json$/

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../')
    if (relative && !HAS_EXT.test(specifier) && error?.code === 'ERR_MODULE_NOT_FOUND') {
      return nextResolve(`${specifier}.js`, context)
    }
    throw error
  }
}
