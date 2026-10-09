/* ═══════════════════════════════════════════════════════════════════════════
   random.js — FAIR DRAWS
   ---------------------------------------------------------------------------
   The wheel's draw comes from the browser's cryptographic random source, not
   Math.random, and it is UNBIASED: a 32-bit value is taken modulo n only when
   it falls below the largest multiple of n that fits, and redrawn otherwise
   (rejection sampling), so every integer 0…n−1 is exactly equally likely.
   ═══════════════════════════════════════════════════════════════════════════ */

const RANGE = 2 ** 32

function u32() {
  const c = globalThis.crypto
  if (c?.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0]
  /* No Web Crypto at all (a very old browser): fall back rather than break. */
  return Math.floor(Math.random() * RANGE)
}

/** A uniformly random integer in [0, n). @param {number} n */
export function secureInt(n) {
  const limit = RANGE - (RANGE % n)
  let x = u32()
  while (x >= limit) x = u32()
  return x % n
}

/** A random one-shot id (for the spin duplicate guard). */
export function secureId(prefix = 'id') {
  return `${prefix}-${u32().toString(36)}${u32().toString(36)}`
}

export default { secureInt, secureId }
