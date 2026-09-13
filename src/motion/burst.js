/* ═══════════════════════════════════════════════════════════════════════════
   burst.js — PAPER SHARDS, AND THE STAMP RING
   ---------------------------------------------------------------------------
   The celebration material in LunX is paper, not light: small cut shards and
   dots in the palette, thrown outward and pulled down by a little gravity.
   A field guide celebrates with a stamp and some confetti, not a firework.

   Pure DOM + Web Animations. Every node removes itself when its animation
   ends, so a burst leaves nothing behind. Nothing spawns under reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

import { prefersReducedMotion, fxLayer, centerOf } from './env'

const PALETTES = {
  reward: ['--ochre', '--clay', '--moss', '--tan-deep'],
  gem:    ['--ochre', '--tan-deep', '--ochre-ink'],
  xp:     ['--ochre', '--evergreen', '--tan-deep'],
  heart:  ['--berry', '--berry-ink', '--clay'],
  streak: ['--clay', '--ochre', '--clay-deep'],
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

/** A single elastic scale bump — "caught it". */
export function bump(el, { to = 1.16, duration = 340 } = {}) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [{ scale: '1' }, { scale: String(to), offset: 0.35 }, { scale: '1' }],
    { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  )
}
