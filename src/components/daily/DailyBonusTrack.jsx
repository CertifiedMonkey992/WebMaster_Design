/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusTrack.jsx — THE REWARD TRACK (PRESENTATIONAL)
   ---------------------------------------------------------------------------
   Renders a bonus view and nothing else. Every status on screen was worked
   out by dailyBonusService.getBonusView. `onClaim` is optional; without it
   the track is inert, which is how the landing page shows the real feature.

   Revision 2 — THE CLAIM SEQUENCE. The reward is still granted on the click
   (closing the panel mid-animation can never lose it). What changed is what
   the learner SEES, in order:

     0ms     the button presses and turns to "Claiming"; the counter the
             reward belongs to is held at its old value; the top bar is
             lifted above the scrim so the destination is visible
     0–300   the art charges — a building shake
     300     the art bursts: paper shards, a ring, and the reward's own
             particles fly out of it to the counter
     ~700    today's day card turns over to its claimed face; the pips fill
     ~1100   the counter catches the last particle and rolls; the hero
             settles into "come back tomorrow"; the receipt slides in

   Hovering any day card lifts it and tells you what it holds and when.

   Revision 4 (idle life): today's art floats and light twinkles at its edges;
   the locked days' art ripples down the row now and then; day 7's foil
   sweeps.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import DailyBonusArt from './DailyBonusArt'
import { Icon } from '../progression/Icons'
import { formatDuration } from '../../utils/dateUtils'
import { fly, hold } from '../../motion/flight'
import { burst, ring } from '../../motion/burst'
import { prefersReducedMotion } from '../../motion/env'
import './dailyBonus.css'

const STATUS_LABEL = {
  claimed: 'Claimed',
  today:   'Today',
  next:    'Tomorrow',
  locked:  'Locked',
}

/* Where each kind of reward lands. */
const DESTINATION = {
  GEMS:          { key: 'gems',   icon: 'gem',    palette: 'gem' },
  XP:            { key: 'xp',     icon: 'xp',     palette: 'xp' },
  HEARTS:        { key: 'hearts', icon: 'heart',  palette: 'heart' },
  STREAK_SHIELD: { key: 'streak', icon: 'shield', palette: 'shield' },
}

function dayTip(reward, view) {
  const away = reward.day - view.nextDay
  switch (reward.status) {
    case 'claimed': return `Day ${reward.day} · ${reward.label} · claimed`
    case 'today':   return `Day ${reward.day} · ${reward.label} · ready now`
    case 'next':    return `Day ${reward.day} · ${reward.label} · unlocks tomorrow`
    default:        return `Day ${reward.day} · ${reward.label}${away > 0 ? ` · in ${away + (view.available ? 0 : 1)} days` : ''}`
  }
}

function DayCard({ reward, view, onClaim, isFlashing }) {
  const { status } = reward
  return (
    <li
      className={[
        'db-day',
        `is-${status}`,
        reward.isFinal ? 'db-day--final' : '',
        isFlashing ? 'is-flashing' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--i': reward.day - 1 }}
      data-tip={dayTip(reward, view)}
    >
      <span className="db-day-num">Day {reward.day}</span>

      <span className={`db-day-art db-art--${reward.accent}`}>
        <DailyBonusArt name={reward.art} size={reward.isFinal ? 62 : 52} />
      </span>

      <span className="db-day-amount">{reward.short}</span>
      <span className="db-day-label">{reward.label}</span>

      <span className={`db-day-status is-${status}`}>
        {status === 'claimed' && <span className="is-drawing db-day-check"><Icon name="check" size={11} strokeWidth={3.4} /></span>}
        {status === 'locked' && <Icon name="lock" size={10} strokeWidth={2.6} />}
        {STATUS_LABEL[status]}
      </span>

      {status === 'today' && onClaim && (
        <button type="button" className="db-day-claim" onClick={onClaim}>
          Claim
        </button>
      )}
    </li>
  )
}

export default function DailyBonusTrack({
  view,
  onClaim,
  variant = 'panel',
  showHeader = true,
}) {
  const [flashDay, setFlashDay] = useState(null)
  const [receipt, setReceipt] = useState(null)
  /* The reward being celebrated — keeps the hero showing it while the
     sequence plays, even though the view has already flipped to claimed. */
  const [celebrate, setCelebrate] = useState(null)
  const [phase, setPhase] = useState(null)   // charging | bursting | null
  const timers = useRef([])
  const artRef = useRef(null)

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    document.documentElement.classList.remove('fx-lift-topbar')
  }, [])

  const after = (ms, fn) => { timers.current.push(window.setTimeout(fn, ms)) }

  const claim = useCallback(() => {
    if (!onClaim || !view.available || celebrate) return
    const offered = view.todayReward
    const events = onClaim() ?? []
    const done = events.find((e) => e.type === 'DAILY_BONUS_CLAIMED')
    if (!done) return

    const granted = done.granted ?? offered
    const dest = DESTINATION[granted?.type] ?? DESTINATION.GEMS
    const reduced = prefersReducedMotion()

    const showReceipt = () => setReceipt({
      day: done.day,
      granted: done.granted,
      substituted: done.substituted,
      cycleComplete: done.cycleComplete,
    })

    if (reduced) {
      setFlashDay(done.day)
      showReceipt()
      after(900, () => setFlashDay(null))
      after(5000, () => setReceipt(null))
      return
    }

    const release = hold(dest.key, 2400)
    document.documentElement.classList.add('fx-lift-topbar')
    setCelebrate({ reward: offered, granted })
    setPhase('charging')

    after(300, () => {
      setPhase('bursting')
      const art = artRef.current
      ring(art, { color: '--ochre', size: 150, duration: 700 })
      burst(art, { palette: dest.palette, count: 22, spread: 110, gravity: 34, duration: 900 })
      fly({
        from: art,
        to: dest.key,
        icon: dest.icon,
        count: granted?.type === 'STREAK_SHIELD' ? 3 : 7,
        amount: granted?.type === 'STREAK_SHIELD' ? undefined : granted?.amount,
        label: granted?.type === 'STREAK_SHIELD' ? 'Shield' : undefined,
        size: 22,
        onLand: release,
        allowCovered: true,
      })
    })

    after(700, () => setFlashDay(done.day))
    after(1250, () => {
      setCelebrate(null)
      setPhase(null)
      showReceipt()
      document.documentElement.classList.remove('fx-lift-topbar')
    })
    after(2000, () => setFlashDay(null))
    after(6000, () => setReceipt(null))
  }, [onClaim, view.available, view.todayReward, celebrate])

  const showingReady = view.available || Boolean(celebrate)
  const reward = celebrate?.reward ?? view.todayReward
  const interactive = Boolean(onClaim)

  const claimedThrough = view.days.filter((d) => d.status === 'claimed').length
  const pathPct = view.cycleLength > 1 ? Math.max(0, (claimedThrough - 1) / (view.cycleLength - 1)) : 0

  return (
    <div className={`db-track db-track--${variant}`}>
      {showHeader && (
        <header className="db-head">
          <div className="db-head-text">
            <span className="db-eyebrow">Daily Bonus</span>
            <h2 className="db-title" key={showingReady ? 'ready' : 'done'}>
              {showingReady ? 'Your reward is ready' : 'Claimed for today'}
            </h2>
          </div>
          <span className="db-progress-tag">
            Day {view.currentDay} <span aria-hidden="true">/</span>
            <span className="pg-sr-only"> of </span>
            {view.cycleLength}
          </span>
        </header>
      )}

      {/* ── Today's reward: the focal point ── */}
      <section
        className={`db-hero${showingReady ? ' is-ready' : ' is-done'}${phase ? ` is-${phase}` : ''}`}
        key={showingReady ? 'hero-ready' : 'hero-done'}
      >
        <div
          ref={artRef}
          className={`db-hero-art db-art--${reward?.accent ?? 'gift'}`}
          data-tilt={showingReady ? '' : undefined}
        >
          <DailyBonusArt name={showingReady ? (reward?.art ?? 'gift') : (view.upcomingReward?.art ?? 'gift')} size={104} />
          {/* Idle: while a reward waits, light twinkles at its edges. */}
          {showingReady && !phase && (
            <span className="db-twinkles" aria-hidden="true"><i /><i /><i /></span>
          )}
        </div>

        <div className="db-hero-body">
          {showingReady ? (
            <>
              <span className="db-hero-eyebrow">Today · Day {celebrate ? view.currentDay : view.nextDay}</span>
              <p className="db-hero-reward">{reward?.label}</p>
              <p className="db-hero-note">
                {celebrate ? 'On its way to your balance…' : 'Claim it to add it straight to your balance.'}
              </p>
              {interactive ? (
                <button
                  type="button"
                  className={`db-claim-btn${celebrate ? ' is-claiming' : ' fx-shine'}`}
                  onClick={claim}
                  disabled={Boolean(celebrate)}
                  aria-label={`Claim your day ${view.nextDay} reward: ${reward?.label}`}
                  data-magnetic="6"
                >
                  <span className="db-claim-label">{celebrate ? 'Claiming' : 'Claim reward'}</span>
                  {celebrate && (
                    <span className="db-claim-check is-drawing" aria-hidden="true">
                      <Icon name="check" size={14} strokeWidth={3.2} />
                    </span>
                  )}
                </button>
              ) : (
                <span className="db-claim-btn db-claim-btn--static fx-shine" aria-hidden="true">
                  Claim reward
                </span>
              )}
            </>
          ) : (
            <>
              <span className="db-hero-eyebrow">
                {view.cycleJustCompleted ? 'Track complete' : `Day ${view.currentDay} claimed`}
              </span>
              <p className="db-hero-reward">
                {view.cycleJustCompleted ? 'All seven days done' : 'Come back tomorrow'}
              </p>
              <p className="db-hero-note">
                {view.cycleJustCompleted
                  ? 'A fresh track opens tomorrow, starting again at Day 1.'
                  : `Day ${view.nextDay} unlocks next — ${view.upcomingReward?.label}.`}
              </p>
              <p className="db-countdown">
                <Icon name="clock" size={13} />
                Next reward in {formatDuration(view.msUntilTomorrow)}
              </p>
            </>
          )}
        </div>
      </section>

      {receipt && (
        <div className="db-receipt" role="status">
          <span className="db-receipt-check is-drawing" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={3.4} />
          </span>
          <span className="db-receipt-text">
            <b>Day {receipt.day} claimed — {receipt.granted?.label}</b>
            {receipt.substituted && (
              <em>Your hearts were already full, so gems went in instead.</em>
            )}
          </span>
        </div>
      )}

      {/* ── The full track ── */}
      <section className="db-path">
        <div className="db-path-head">
          <h3 className="db-path-title">Your reward path</h3>
          <ol className="db-pips" aria-hidden="true">
            {view.days.map((d) => (
              <li key={d.day} className={`db-pip is-${d.status}`} style={{ '--i': d.day - 1 }} />
            ))}
          </ol>
        </div>

        <ol className="db-days" style={{ '--path': pathPct }}>
          {view.days.map((d) => (
            <DayCard
              key={d.day}
              reward={d}
              view={view}
              onClaim={interactive ? claim : undefined}
              isFlashing={flashDay === d.day}
            />
          ))}
        </ol>
      </section>
    </div>
  )
}
