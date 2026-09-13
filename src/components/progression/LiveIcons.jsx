/* ═══════════════════════════════════════════════════════════════════════════
   LiveIcons.jsx — THE ECONOMY ICONS, WATCHING THEIR OWN NUMBERS
   ---------------------------------------------------------------------------
   The drawn icons in Icons.jsx are pictures. These wrap them with the state
   they report and the events they react to, so every place that shows a live
   heart, flame or gem — the top bar, the lesson overlay, the progress card —
   behaves identically without re-implementing it (MOTION_RULES.md revision 4
   → The economy icons):

     LiveHeart   fill level = hearts / max; a ring that fills toward the next
                 heart. IDLE a slow beat; ONE LEFT a strong beat; LOST it
                 cracks, sheds shards and drops a heart; GAINED it double-beats
                 inside a bloom, with sparkles.
     LiveFlame   lit / at-risk / out. IDLE it flickers and lets embers go;
                 ROSE it flares, throws sparks and opens a bloom; a milestone
                 adds a ring and confetti. Wears a small shield when a Streak
                 Shield is banked.
     LiveGem     IDLE it glints now and then; EARNED it turns over, flashes,
                 blooms and sparkles; SPENT it sinks.

   Each takes the value it should SHOW. Callers pass the landed value from
   useLandedValue, so the icon reacts when the reward arrives, not when the
   reducer ran. One gesture, one clock: the icon moves at 0, the bloom and
   sparkles open at --lag-finish and fade last.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from 'react'
import { HeartIcon, FlameIcon, GemIcon, ShieldIcon } from './Icons'
import { bloom, burst, ring, sparkle } from '../../motion/burst'
import { drop } from '../../motion/flight'
import { seedOf } from '../../motion/idle'
import { LAG } from '../../motion/timing'
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

/** Run `fn` after the supporting lag, unless the component unmounts first. */
function useLater() {
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return (fn, ms = LAG.finish) => { timers.current.push(window.setTimeout(fn, ms)) }
}

export function LiveHeart({ hearts, max = 5, recovery = null, size = 20, className = '' }) {
  const ref = useRef(null)
  const bloomRef = useRef(null)
  const later = useLater()
  const { dir, tick } = useChange(hearts, 820)

  useEffect(() => {
    if (!tick || !ref.current) return
    if (dir === 'down') {
      drop({ from: ref.current, icon: 'heart', size: Math.round(size * 0.7) })
      burst(ref.current, { palette: 'heart', count: 7, spread: size * 1.2, gravity: 16, duration: 520 })
    }
    if (dir === 'up') {
      bloom(bloomRef.current)
      later(() => {
        sparkle(ref.current, { tone: 'heart', count: 4, radius: size * 0.9, size: Math.max(6, size * 0.4) })
        burst(ref.current, { palette: 'heart', count: 8, spread: size * 1.4, gravity: 4, duration: 560 })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const fill = hearts <= 0 ? 0 : Math.max(0.2, hearts / Math.max(1, max))
  const showRing = recovery != null && hearts < max
  const cls = [
    'live-heart',
    hearts <= 0 ? 'is-empty' : '',
    hearts === 1 ? 'is-low' : '',
    hearts > 1 && !dir ? 'is-beating' : '',
    hearts >= max ? 'is-full' : '',
    dir === 'down' ? 'is-cracking' : '',
    dir === 'up' ? 'is-gaining' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span ref={ref} className={cls} style={{ '--icon': `${size}px` }}>
      <span ref={bloomRef} className="li-bloom" aria-hidden="true" />
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
  const bloomRef = useRef(null)
  const later = useLater()
  const seed = seedOf(useId())
  const { dir, tick } = useChange(streak, 1000)

  useEffect(() => {
    if (!tick || dir !== 'up' || !ref.current) return
    burst(ref.current, { palette: 'streak', up: true, count: 12, spread: size * 1.6, gravity: -6, duration: 700 })
    later(() => {
      bloom(bloomRef.current)
      sparkle(ref.current, { tone: 'flame', count: 4, radius: size, size: Math.max(6, size * 0.4) })
    })
    if (STREAK.MILESTONES.includes(streak)) {
      ring(ref.current, { color: '--clay', size: size * 3.2, duration: 800 })
      later(() => burst(ref.current, { palette: 'reward', count: 18, spread: size * 2.6, gravity: 18 }), 160)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const state = streak <= 0 ? 'out' : activeToday ? 'lit' : 'risk'

  return (
    <span
      ref={ref}
      className={`live-flame fx-alive is-${state}${dir === 'up' ? ' is-flaring' : ''}${dir === 'down' ? ' is-dousing' : ''} ${className}`.trim()}
      style={{ '--icon': `${size}px`, '--seed': seed }}
    >
      <span ref={bloomRef} className="li-bloom" aria-hidden="true" />
      <FlameIcon size={size} state={state} />
      {state === 'lit' && size >= 16 && (
        <span className="lf-embers" aria-hidden="true"><i /><i /><i /></span>
      )}
      {showShield && shields > 0 && (
        <ShieldIcon size={Math.round(size * 0.52)} className="lf-shield" emblem={false} />
      )}
    </span>
  )
}

export function LiveGem({ gems, size = 20, className = '' }) {
  const ref = useRef(null)
  const bloomRef = useRef(null)
  const later = useLater()
  const { dir, tick } = useChange(gems, 900)

  useEffect(() => {
    if (!tick || dir !== 'up' || !ref.current) return
    later(() => {
      bloom(bloomRef.current)
      sparkle(ref.current, { tone: 'gem', count: 5, radius: size * 0.95, size: Math.max(6, size * 0.45) })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  return (
    <span
      ref={ref}
      className={`live-gem fx-gleam${dir === 'up' ? ' is-turning' : ''}${dir === 'down' ? ' is-spending' : ''} ${className}`.trim()}
      style={{ '--icon': `${size}px` }}
    >
      <span ref={bloomRef} className="li-bloom" aria-hidden="true" />
      <GemIcon size={size} />
    </span>
  )
}
