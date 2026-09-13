/* ═══════════════════════════════════════════════════════════════════════════
   burst.js — PAPER SHARDS, AND THE STAMP RING
   ---------------------------------------------------------------------------
   The celebration material in LunX is paper, not light: small cut shards and
   dots in the palette, thrown outward and pulled down by a little gravity.
   A field guide celebrates with a stamp and some confetti, not a firework.

   Revision 4 adds the economy's LIGHT: `sparkle()` (four-point glints around
   a gem, a heart, a flame) and `bloom()` (warm light opening behind an icon
   whose value just rose). Both are Reports; neither ever rests on screen.

   Pure DOM + Web Animations. Every node removes itself when its animation
   ends, so a burst leaves nothing behind. Nothing spawns under reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion, fxLayer, centerOf } from './env'

const PALETTES = {
  reward: ['--ochre', '--clay', '--moss', '--gem-light'],
  gem:    ['--ochre', '--gem-light', '--ochre-bright', '--ochre-ink'],
  xp:     ['--ochre-bright', '--evergreen', '--gem-light'],
  heart:  ['--berry', '--berry-bright', '--clay'],
  streak: ['--clay', '--ochre-bright', '--clay-bright'],
  moss:   ['--moss', '--evergreen', '--ochre'],
  shield: ['--evergreen', '--moss', '--ochre'],
}

const rand = (a, b) => a + Math.random() * (b - a)

export function burst(source, {
  palette = 'reward',
  count = 12,
  spread = 56,
  gravity = 26,
  duration = 760,
  up = false,
} = {}) {
  if (prefersReducedMotion()) return
  const p = centerOf(source)
  if (!p) return
  const layer = fxLayer()
  const colors = PALETTES[palette] || PALETTES.reward

  for (let i = 0; i < count; i++) {
    const node = document.createElement('span')
    const shard = Math.random() > 0.35
    node.className = shard ? 'fx-shard' : 'fx-dot'
    node.style.left = `${p.x}px`
    node.style.top = `${p.y}px`
    node.style.background = `var(${colors[i % colors.length]})`
    layer.appendChild(node)

    /* Even angular coverage with jitter, so a burst never clumps to one side.
       `up` biases the fan into the upper half — sparks off a flame. */
    const base = up ? -Math.PI : 0
    const range = up ? Math.PI : Math.PI * 2
    const angle = base + (range * (i + rand(0.1, 0.9))) / count
    const dist = spread * rand(0.55, 1)
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    const rot = rand(-260, 260)

    const anim = node.animate(
      [
        { transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.4)', opacity: 0 },
        { transform: `translate(-50%, -50%) translate(${dx * 0.55}px, ${dy * 0.55}px) rotate(${rot * 0.4}deg) scale(1)`, opacity: 1, offset: 0.22 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy + gravity * 0.3}px) rotate(${rot * 0.8}deg) scale(0.95)`, opacity: 1, offset: 0.62 },
        { transform: `translate(-50%, -50%) translate(${dx * 1.08}px, ${dy + gravity}px) rotate(${rot}deg) scale(0.5)`, opacity: 0 },
      ],
      { duration: duration * rand(0.85, 1.15), easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' },
    )
    anim.onfinish = () => node.remove()
  }
}

/** An expanding ring — the impression a stamp leaves. */
export function ring(source, { color = '--moss', size = 90, duration = 620 } = {}) {
  if (prefersReducedMotion()) return
  const p = centerOf(source)
  if (!p) return
  const node = document.createElement('span')
  node.className = 'fx-ring'
  node.style.left = `${p.x}px`
  node.style.top = `${p.y}px`
  node.style.width = `${size}px`
  node.style.height = `${size}px`
  node.style.borderColor = `var(${color})`
  fxLayer().appendChild(node)
  const anim = node.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.35)', opacity: 0.9 },
      { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' },
  )
  anim.onfinish = () => node.remove()
}

/** Shake any element once — a refusal, a wrong answer, a locked door. */
export function shake(el, { distance = 5, duration = 420 } = {}) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [
      { translate: '0 0' },
      { translate: `${-distance}px 0` },
      { translate: `${distance}px 0` },
      { translate: `${-distance * 0.6}px 0` },
      { translate: `${distance * 0.4}px 0` },
      { translate: '0 0' },
    ],
    { duration, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' },
  )
}

/* ── Light (MOTION_RULES.md revision 4 → Light) ───────────────────────────── */

const SPARK_TONES = {
  gem:   ['--gem-light', '--surface-raised', '--ochre-bright'],
  heart: ['--surface-raised', '--berry-bright', '--gem-light'],
  flame: ['--gem-light', '--clay-bright', '--surface-raised'],
  xp:    ['--gem-light', '--surface-raised', '--ochre-bright'],
}

/**
 * Four-point sparkles around a point — light catching a facet, not confetti.
 * They twinkle in place (scale up, turn a quarter, scale away) and drift a
 * few px outward, so they read as glints on the object rather than debris.
 */
export function sparkle(source, {
  tone = 'gem',
  count = 5,
  radius = 18,
  size = 9,
  duration = 640,
} = {}) {
  if (prefersReducedMotion()) return
  const p = centerOf(source)
  if (!p) return
  const layer = fxLayer()
  const colors = SPARK_TONES[tone] || SPARK_TONES.gem

  for (let i = 0; i < count; i++) {
    const node = document.createElement('span')
    node.className = 'fx-spark'
    const s = size * rand(0.6, 1.15)
    node.style.width = `${s}px`
    node.style.height = `${s}px`
    node.style.left = `${p.x}px`
    node.style.top = `${p.y}px`
    node.style.background = `var(${colors[i % colors.length]})`
    layer.appendChild(node)

    const angle = (Math.PI * 2 * (i + rand(0.15, 0.85))) / count - Math.PI / 2
    const r0 = radius * rand(0.55, 0.9)
    const r1 = r0 + rand(4, 9)
    const x0 = Math.cos(angle) * r0
    const y0 = Math.sin(angle) * r0
    const x1 = Math.cos(angle) * r1
    const y1 = Math.sin(angle) * r1

    node.animate(
      [
        { transform: `translate(-50%, -50%) translate(${x0}px, ${y0}px) scale(0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2}px) scale(1.15) rotate(45deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(-50%, -50%) translate(${x1}px, ${y1}px) scale(0) rotate(90deg)`, opacity: 0.6 },
      ],
      { duration: duration * rand(0.8, 1.2), delay: i * 45, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'both' },
    ).onfinish = () => node.remove()
  }
}

/**
 * A bloom: warm light opening behind an icon whose value just rose. `node`
 * is a persistent element the icon renders for the purpose (LiveIcons'
 * `.li-bloom`), so a bloom never inserts DOM into a React tree. A Report:
 * one --dur-celebrate, gone when it ends.
 */
export function bloom(node, { duration = 800, peak = 1 } = {}) {
  if (!node || prefersReducedMotion() || typeof node.animate !== 'function') return
  node.animate(
    [
      { opacity: 0, transform: 'scale(0.3)', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      { opacity: peak, transform: 'scale(1)', offset: 0.3, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { opacity: 0, transform: 'scale(1.18)' },
    ],
    { duration },
  )
}

/** A single elastic scale bump — "caught it". */
export function bump(el, { to = 1.16, duration = 340 } = {}) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [{ scale: '1' }, { scale: String(to), offset: 0.35 }, { scale: '1' }],
    { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  )
}
