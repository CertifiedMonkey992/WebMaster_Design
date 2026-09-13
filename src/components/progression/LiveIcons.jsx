/* ═══════════════════════════════════════════════════════════════════════════
   LiveIcons.jsx — THE ECONOMY ICONS, WATCHING THEIR OWN NUMBERS
   ---------------------------------------------------------------------------
   The drawn icons in Icons.jsx are pictures. These wrap them with the state
   they report and the events they react to, so every place that shows a live
   heart, flame or gem — the top bar, the lesson overlay, the progress card —
   behaves identically without re-implementing it:

     LiveHeart   fill level = hearts / max; a ring that fills toward the next
                 heart; beats when one is left; CRACKS and drops a heart when
                 one is lost; double-beats when one comes back.
     LiveFlame   lit / at-risk / out; flickers while alive; FLARES with sparks
                 when the streak rises, and rings at a milestone; wears a
                 small shield when a Streak Shield is banked.
     LiveGem     turns and glints when gems land; sinks when they are spent.

   Each takes the value it should SHOW. Callers pass the landed value from
   useLandedValue, so the icon reacts when the reward arrives, not when the
   reducer ran.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { HeartIcon, FlameIcon, GemIcon, ShieldIcon } from './Icons'
import { burst, ring } from '../../motion/burst'
import { drop } from '../../motion/flight'
import { STREAK } from '../../config/progressionConfig'
import './icons.css'

/** [direction, tick] for a short window after `value` changes. */
function useChange(value, ms = 800) {
  const prev = useRef(value)
  const [state, setState] = useState({ dir: null, tick: 0 })

  useEffect(() => {
    const before = prev.current
    prev.current = value
    if (typeof value !== 'number' || typeof before !== 'number' || before === value) return undefined
    setState((s) => ({ dir: value > before ? 'up' : 'down', tick: s.tick + 1 }))
    const t = window.setTimeout(() => setState((s) => ({ ...s, dir: null })), ms)
    return () => clearTimeout(t)
  }, [value, ms])

  return state
}

export function LiveHeart({ hearts, max = 5, recovery = null, size = 20, className = '' }) {
  const ref = useRef(null)
  const { dir, tick } = useChange(hearts, 820)

  useEffect(() => {
    if (!tick || !ref.current) return
    if (dir === 'down') drop({ from: ref.current, icon: 'heart', size: Math.round(size * 0.7) })
    if (dir === 'up') burst(ref.current, { palette: 'heart', count: 9, spread: size * 1.4, gravity: 4, duration: 560 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const fill = hearts <= 0 ? 0 : Math.max(0.2, hearts / Math.max(1, max))
  const showRing = recovery != null && hearts < max
  const cls = [
    'live-heart',
    hearts <= 0 ? 'is-empty' : '',
    hearts === 1 ? 'is-low' : '',
    hearts >= max ? 'is-full' : '',
    dir === 'down' ? 'is-cracking' : '',
    dir === 'up' ? 'is-gaining' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span ref={ref} className={cls} style={{ '--icon': `${size}px` }}>
      {showRing && (
        <svg className="lh-ring" viewBox="0 0 32 32" aria-hidden="true">
          <circle className="lh-ring-track" cx="16" cy="16" r="14.5" pathLength="1" />
          <circle
            className="lh-ring-fill"
            cx="16" cy="16" r="14.5" pathLength="1"
            style={{ strokeDashoffset: 1 - Math.max(0, Math.min(1, recovery)) }}
          />
        </svg>
      )}
      <HeartIcon size={size} fill={fill} />
    </span>
  )
}

export function LiveFlame({ streak, activeToday = true, shields = 0, size = 20, showShield = true, className = '' }) {
  const ref = useRef(null)
  const { dir, tick } = useChange(streak, 1000)

  useEffect(() => {
    if (!tick || dir !== 'up' || !ref.current) return
    burst(ref.current, { palette: 'streak', up: true, count: 12, spread: size * 1.6, gravity: -6, duration: 700 })
    if (STREAK.MILESTONES.includes(streak)) {
      ring(ref.current, { color: '--clay', size: size * 3.2, duration: 800 })
      window.setTimeout(() => burst(ref.current, { palette: 'reward', count: 18, spread: size * 2.6, gravity: 18 }), 160)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const state = streak <= 0 ? 'out' : activeToday ? 'lit' : 'risk'

  return (
    <span
      ref={ref}
      className={`live-flame fx-alive is-${state}${dir === 'up' ? ' is-flaring' : ''}${dir === 'down' ? ' is-dousing' : ''} ${className}`.trim()}
      style={{ '--icon': `${size}px` }}
    >
      <FlameIcon size={size} state={state} />
      {showShield && shields > 0 && (
        <ShieldIcon size={Math.round(size * 0.52)} className="lf-shield" emblem={false} />
      )}
    </span>
  )
}

export function LiveGem({ gems, size = 20, className = '' }) {
  const ref = useRef(null)
  const { dir } = useChange(gems, 900)

  return (
    <span
      ref={ref}
      className={`live-gem${dir === 'up' ? ' is-turning' : ''}${dir === 'down' ? ' is-spending' : ''} ${className}`.trim()}
      style={{ '--icon': `${size}px` }}
    >
      <GemIcon size={size} />
    </span>
  )
}
