/* ═══════════════════════════════════════════════════════════════════════════
   SpinWheel.jsx — THE DAILY SPIN (PRESENTATIONAL)
   ---------------------------------------------------------------------------
   Renders a wheel view (services/wheelService.getWheelView) and nothing
   else. `onSpin` is optional; without it the wheel is inert.

   The order of a spin, and why it is fair:

     0ms     the press dispatches SPIN_WHEEL. The reducer draws the result
             (crypto), pays it and saves it BEFORE anything moves; this
             component only learns which slot won, from WHEEL_SPUN
     0ms     the counter the reward belongs to is held at its old value
     0–3.8s  the disc turns at least five full times and decelerates onto
             THAT slot (a random point inside it, never on an edge)
     3.8s    the slot lights, light bursts from the hub and the reward flies
             to its counter, which only then rolls; the result line says
             what was won

   Under reduced motion the disc jumps straight to the result and nothing
   flies. Closing the panel mid-spin loses nothing — the reward was paid on
   the press. MOTION_RULES.md → The daily spin.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { GemIcon, BoltIcon, ShieldIcon, Icon } from '../progression/Icons'
import { fly, hold } from '../../motion/flight'
import { burst, ring } from '../../motion/burst'
import { prefersReducedMotion } from '../../motion/env'
import { DUR, EASE } from '../../motion/timing'
import { formatDuration } from '../../utils/dateUtils'
import './wheel.css'

/* Where each kind of reward lands, and what it is called on the wheel. */
const KIND = {
  GEMS:          { key: 'gems',   icon: 'gem',    palette: 'gem',    unit: 'gems' },
  XP:            { key: 'xp',     icon: 'xp',     palette: 'xp',     unit: 'XP' },
  STREAK_SHIELD: { key: 'streak', icon: 'shield', palette: 'shield', unit: 'shield' },
}

const REFUSALS = {
  'none-left': 'No spins left today.',
  clock: 'Your device clock moved backwards, so spins are paused until it catches up.',
  duplicate: 'That spin was already counted.',
  'bad-roll': 'The spin could not be drawn. Try again.',
}

const mod = (a, n) => ((a % n) + n) % n

function SlotIcon({ type, size }) {
  if (type === 'XP') return <BoltIcon size={size} />
  if (type === 'STREAK_SHIELD') return <ShieldIcon size={size} emblem={false} />
  return <GemIcon size={size} />
}

/* The point on a circle of radius r at `deg` degrees clockwise from the top. */
const at = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

const R = 92

function Disc({ slots, wonIndex }) {
  const seg = 360 / slots.length
  return (
    <svg className="wh-disc-art" viewBox="-100 -100 200 200" aria-hidden="true">
      <circle className="wh-rim" r="97" />
      {slots.map((slot, i) => {
        const [x0, y0] = at(R, i * seg)
        const [x1, y1] = at(R, (i + 1) * seg)
        const centre = (i + 0.5) * seg
        const kind = KIND[slot.type] ?? KIND.GEMS
        return (
          <g key={slot.id} className={`wh-slot wh-slot--${slot.tier}${wonIndex === i ? ' is-won' : ''}`}>
            <path className="wh-seg" d={`M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`} />
            <g transform={`rotate(${centre})`}>
              <text className="wh-amount" x="0" y="-70" textAnchor="middle">
                {slot.type === 'STREAK_SHIELD' ? '×1' : slot.amount}
              </text>
              <text className="wh-unit" x="0" y="-60" textAnchor="middle">{slot.tier === 'jackpot' ? 'jackpot' : kind.unit}</text>
              <g transform="translate(-12 -50)" className={`wh-icon wh-icon--${kind.icon}`}>
                <SlotIcon type={slot.type} size={24} />
              </g>
            </g>
          </g>
        )
      })}
      {/* Pegs at the slot edges: the rim's only decoration. */}
      {slots.map((slot, i) => {
        const [x, y] = at(96.5, i * seg)
        return <circle key={`peg-${slot.id}`} className="wh-peg" cx={x.toFixed(2)} cy={y.toFixed(2)} r="2.2" />
      })}
    </svg>
  )
}

/* The odds, before anyone spins: one row per tier. */
export function OddsTable({ tiers, slots }) {
  return (
    <table className="wh-odds">
      <caption className="wh-odds-cap">Chances on every spin</caption>
      <thead>
        <tr><th scope="col">Tier</th><th scope="col">Rewards</th><th scope="col">Chance</th></tr>
      </thead>
      <tbody>
        {tiers.map((tier) => (
          <tr key={tier.id} className={`wh-odds-row wh-odds-row--${tier.id}`}>
            <th scope="row"><span className={`wh-chip wh-chip--${tier.id}`} aria-hidden="true" />{tier.label}</th>
            <td>
              {slots.filter((s) => s.tier === tier.id).map((s, i) => (
                <span key={s.id} className="wh-odds-item">
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  {s.label} <span className="wh-odds-pct">({s.percent})</span>
                </span>
              ))}
            </td>
            <td className="wh-odds-total tnum">{tier.percent}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function SpinWheel({ view, onSpin, variant = 'panel' }) {
  const n = view.slots.length
  const seg = 360 / n
  const restIndex = view.spunToday && view.lastSpin ? view.slots.findIndex((s) => s.id === view.lastSpin.slotId) : -1
  const [phase, setPhase] = useState('idle')          // idle | spinning | won
  const [result, setResult] = useState(null)          // the WHEEL_SPUN event
  const [refusal, setRefusal] = useState(null)
  const discRef = useRef(null)
  const hubRef = useRef(null)
  const animRef = useRef(null)
  const timers = useRef([])
  /* The disc's total rotation in degrees. It only ever grows, so every spin
     turns the same way from wherever the last one stopped. */
  const angleRef = useRef(restIndex >= 0 ? mod(-((restIndex + 0.5) * seg), 360) : 0)

  useEffect(() => () => {
    animRef.current?.cancel()
    timers.current.forEach(window.clearTimeout)
  }, [])

  const wonIndex = phase === 'won' && result ? result.slotIndex : phase === 'idle' ? restIndex : -1

  const celebrate = (done, kind, release) => {
    const hub = hubRef.current
    const big = done.tier === 'jackpot' || done.tier === 'epic'
    ring(hub, { color: big ? '--clay' : '--ochre', size: big ? 260 : 170, duration: DUR.celebrate })
    burst(hub, { palette: kind.palette, count: big ? 36 : 20, spread: big ? 190 : 120, gravity: 40, duration: 1000 })
    fly({
      from: hub,
      to: kind.key,
      icon: kind.icon,
      count: done.granted?.type === 'STREAK_SHIELD' ? 3 : big ? 10 : 6,
      amount: done.granted?.type === 'STREAK_SHIELD' ? undefined : done.granted?.amount,
      label: done.granted?.type === 'STREAK_SHIELD' ? 'Shield' : undefined,
      size: 22,
      onLand: release,
      allowCovered: true,
      orRise: true,
    })
  }

  const spin = () => {
    if (!onSpin || phase === 'spinning' || !view.available) return
    setRefusal(null)
    const events = onSpin() ?? []
    const done = events.find((e) => e.type === 'WHEEL_SPUN')
    if (!done) {
      const refused = events.find((e) => e.type === 'WHEEL_REFUSED')
      setRefusal(REFUSALS[refused?.reason] ?? 'The spin did not go through. Try again.')
      return
    }

    const kind = KIND[done.granted?.type] ?? KIND.GEMS
    /* Land somewhere inside the winning slot, well clear of its edges. */
    const jitter = (Math.random() - 0.5) * seg * 0.6
    const target = -((done.slotIndex + 0.5) * seg) + jitter
    const from = angleRef.current
    const to = from + 360 * 5 + mod(target - from, 360)
    angleRef.current = to

    setResult(done)
    setPhase('spinning')
    const disc = discRef.current

    /* Reduced motion, or a page nobody can see (its animation clock would
       not run): land on the result at once. */
    if (prefersReducedMotion() || !disc?.animate || document.visibilityState === 'hidden') {
      if (disc) disc.style.transform = `rotate(${to}deg)`
      setPhase('won')
      return
    }

    const release = hold(kind.key, DUR.spin + 2600)
    const anim = disc.animate(
      [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
      { duration: DUR.spin, easing: EASE.spin, fill: 'forwards' },
    )
    animRef.current = anim
    let landed = false
    const land = () => {
      if (landed) return
      landed = true
      disc.style.transform = `rotate(${to}deg)`
      anim.cancel()
      animRef.current = null
      setPhase('won')
      celebrate(done, kind, release)
    }
    anim.onfinish = land
    /* A tab hidden mid-spin stops dispatching animation events; a timer
       still runs there, so the result always lands. */
    timers.current.push(window.setTimeout(land, DUR.spin + 120))
  }

  const spinning = phase === 'spinning'
  const shown = phase === 'won' ? result : null
  const resetTime = new Date(view.resetAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const interactive = Boolean(onSpin)

  let status
  if (spinning) status = 'Spinning…'
  else if (view.clockBlocked) status = REFUSALS.clock
  else if (view.available) status = view.spinsLeft === 1 ? '1 spin left' : `${view.spinsLeft} spins left`
  else status = `Next free spin in ${formatDuration(view.msUntilReset)}`

  return (
    <div className={`wh wh--${variant}${spinning ? ' is-spinning' : ''}${phase === 'won' ? ' is-won' : ''}`}>
      <div className="wh-stage">
        <div className="wh-disc" ref={discRef} style={{ transform: `rotate(${angleRef.current}deg)` }}>
          <Disc slots={view.slots} wonIndex={wonIndex} />
        </div>
        <svg className="wh-pointer" viewBox="0 0 32 40" aria-hidden="true">
          <path d="M16 38 3.5 9.5A13 13 0 1 1 28.5 9.5Z" />
          <circle cx="16" cy="13" r="4.5" />
        </svg>
        <div className="wh-hub" ref={hubRef} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path className="nav-logo-l" d="M2 2h2.5v8H10v2H2V2Z" />
          </svg>
        </div>
      </div>

      <div className="wh-side">
        <p className={`wh-status${view.available && !spinning ? ' is-ready' : ''}`} aria-live="polite">
          <Icon name={view.available || spinning ? 'wheel' : 'clock'} size={16} />
          {status}
        </p>

        <div className="wh-result" role="status" aria-live="polite">
          {shown ? (
            <>
              <span className={`wh-result-tier wh-chip-label--${shown.tier}`}>{view.tiers.find((t) => t.id === shown.tier)?.label}</span>
              <b className="wh-result-text">
                {shown.tier === 'jackpot' ? 'Jackpot! ' : ''}You won {shown.granted?.label}
              </b>
              {shown.substituted && <em>Your shields were already full, so it paid {shown.granted?.label} instead.</em>}
            </>
          ) : view.spunToday && view.lastSpin?.granted && !spinning ? (
            <span className="wh-result-text is-quiet">Today’s spin: {view.lastSpin.granted.label}</span>
          ) : null}
        </div>

        {interactive ? (
          <button
            type="button"
            className={`btn btn-next btn-lg wh-spin${view.available && !spinning ? ' fx-shine' : ''}`}
            onClick={spin}
            disabled={spinning || !view.available}
            aria-describedby="wh-odds-note"
          >
            {spinning ? 'Spinning…' : view.available ? 'Spin' : 'No spins left'}
          </button>
        ) : (
          <span className="btn btn-next btn-lg wh-spin" aria-hidden="true">Spin</span>
        )}
        {refusal && <p className="wh-refusal" role="alert">{refusal}</p>}

        <OddsTable tiers={view.tiers} slots={view.slots} />
        <p className="wh-note" id="wh-odds-note">
          Each spin is drawn at random with exactly these chances — nothing else changes them.
          {` ${view.spinsPerDay} free spin a day; it resets at midnight UTC (${resetTime} your time).`}
        </p>
      </div>
    </div>
  )
}
