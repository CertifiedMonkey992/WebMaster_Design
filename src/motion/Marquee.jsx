/* ═══════════════════════════════════════════════════════════════════════════
   Marquee.jsx — A ROW THAT KEEPS MOVING
   ---------------------------------------------------------------------------
   The Ambient ticker (MOTION_RULES.md → Ambient). Content drifts at a
   constant, readable speed and says one thing: there are more of these than
   fit on the screen.

   It answers the page as well as idling:
     · pointer on the row  → it brakes smoothly to a stop, so a title can be read
     · scrolling           → it is pushed along, faster, in the direction you
                             scroll; scroll up hard enough and it runs backward
     · offscreen           → paused (no frames spent on it)

   Driven by one Web Animation per row, so speed changes are a playbackRate
   ease rather than a restart; a short rAF runs only while the rate is
   changing. Under reduced motion it is a still, horizontally scrollable row.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Children, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './env'
import useAmbient, { onVisibility } from './ambient'
import { onScrollVelocity } from './scroll'

const COPIES = 3

export default function Marquee({
  children,
  direction = 1,        // 1 drifts left, -1 drifts right
  seconds = 60,         // one full cycle of the content
  className = '',
  label,
}) {
  const hostRef = useRef(null)
  const trackRef = useRef(null)
  const ambientRef = useAmbient(hostRef)
  const [still] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (still) return undefined
    const host = hostRef.current
    const track = trackRef.current
    if (!host || !track || typeof track.animate !== 'function') return undefined

    const shift = `${(-100 / COPIES).toFixed(4)}%`
    const frames = direction === 1
      ? [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${shift},0,0)` }]
      : [{ transform: `translate3d(${shift},0,0)` }, { transform: 'translate3d(0,0,0)' }]
    const anim = track.animate(frames, { duration: seconds * 1000, iterations: Infinity, easing: 'linear', fill: 'both' })
    /* Start a long way into the timeline: scrolling up runs the row backward,
       and a backward animation that reaches time 0 would drop into its
       'before' phase and snap. */
    anim.currentTime = seconds * 1000 * 500

    let rate = 1
    let braking = false
    let push = 0
    let raf = 0

    const target = () => (braking ? 0 : 1 + push)
    const step = () => {
      raf = 0
      const t = target()
      /* Brake a little faster than it accelerates — a hand stopping a belt. */
      const k = braking ? 0.14 : 0.08
      rate += (t - rate) * k
      if (Math.abs(t - rate) < 0.004) rate = t
      anim.playbackRate = rate
      if (rate !== t) raf = requestAnimationFrame(step)
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(step) }

    const enter = (e) => { if (e.pointerType === 'mouse') { braking = true; wake() } }
    const leave = () => { braking = false; wake() }
    host.addEventListener('pointerenter', enter)
    host.addEventListener('pointerleave', leave)

    const offVelocity = onScrollVelocity((v) => {
      /* ~1500px/s of scroll adds 4× speed; capped so a fling does not blur. */
      push = Math.max(-5, Math.min(5, v / 380))
      wake()
    })

    const offVisibility = onVisibility(host, (on) => {
      if (on) anim.play()
      else anim.pause()
    })

    return () => {
      host.removeEventListener('pointerenter', enter)
      host.removeEventListener('pointerleave', leave)
      offVelocity()
      offVisibility()
      cancelAnimationFrame(raf)
      anim.cancel()
    }
  }, [direction, seconds, still])

  const items = Children.toArray(children)

  return (
    <div
      ref={ambientRef}
      className={`mq${still ? ' mq--still' : ''} ${className}`.trim()}
      role="region"
      aria-label={label}
    >
      <div ref={trackRef} className="mq-track">
        {Array.from({ length: still ? 1 : COPIES }, (_, copy) => (
          <div className="mq-set" key={copy} aria-hidden={copy > 0 ? 'true' : undefined}>
            {items}
          </div>
        ))}
      </div>
    </div>
  )
}
