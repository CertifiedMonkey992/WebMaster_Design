/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusTrack.jsx — THE REWARD TRACK (PRESENTATIONAL)
   ---------------------------------------------------------------------------
   Renders a bonus view and nothing else. It holds no progression state, reads
   no context and decides no rules — every status on screen was worked out by
   dailyBonusService.getBonusView.

   That split is what lets the landing page show the REAL feature: the marketing
   section renders this exact component against a representative view built by
   the real service, so the showcase cannot drift away from the product.

   `onClaim` is optional. Without it the track is inert, which is the mode the
   landing page uses.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import DailyBonusArt from './DailyBonusArt'
import { Icon } from '../progression/Icons'
import { formatDuration } from '../../utils/dateUtils'
import './dailyBonus.css'

/** Status wording — carried as text so state is never colour-only. */
const STATUS_LABEL = {
  claimed: 'Claimed',
  today:   'Today',
  next:    'Tomorrow',
  locked:  'Locked',
}

function DayCard({ reward, onClaim, isFlashing }) {
  const { status } = reward
  return (
    <li
      className={[
        'db-day',
        `is-${status}`,
        reward.isFinal ? 'db-day--final' : '',
        isFlashing ? 'is-flashing' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="db-day-num">Day {reward.day}</span>

      <span className={`db-day-art db-art--${reward.accent}`}>
        <DailyBonusArt name={reward.art} size={reward.isFinal ? 62 : 52} />
      </span>

      <span className="db-day-amount">{reward.short}</span>
      <span className="db-day-label">{reward.label}</span>

      <span className={`db-day-status is-${status}`}>
        {status === 'claimed' && <Icon name="check" size={11} strokeWidth={3.4} />}
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
  /* Which card just paid out — drives the one-shot pop animation. */
  const [flashDay, setFlashDay] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  /**
   * Claim immediately, then animate the result.
   *
   * The reward is granted on the click rather than after the animation, so
   * closing the panel mid-animation cannot lose it — and a second click lands
   * on a state that has already recorded today's claim, so it pays nothing.
   */
  const claim = useCallback(() => {
    if (!onClaim || !view.available) return
    const events = onClaim() ?? []
    const done = events.find((e) => e.type === 'DAILY_BONUS_CLAIMED')
    if (!done) return

    setFlashDay(done.day)
    setReceipt({
      day: done.day,
      granted: done.granted,
      substituted: done.substituted,
      cycleComplete: done.cycleComplete,
    })
    timers.current.push(window.setTimeout(() => setFlashDay(null), 900))
    timers.current.push(window.setTimeout(() => setReceipt(null), 5000))
  }, [onClaim, view.available])

  const reward = view.todayReward
  const interactive = Boolean(onClaim)

  return (
    <div className={`db-track db-track--${variant}`}>
      {showHeader && (
        <header className="db-head">
          <div className="db-head-text">
            <span className="db-eyebrow">Daily Bonus</span>
            <h2 className="db-title">
              {view.available ? 'Your reward is ready' : 'Claimed for today'}
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
      <section className={`db-hero${view.available ? ' is-ready' : ' is-done'}`}>
        <div className={`db-hero-art db-art--${reward?.accent ?? 'gift'}`}>
          <DailyBonusArt name={reward?.art ?? 'gift'} size={104} />
        </div>

        <div className="db-hero-body">
          {view.available ? (
            <>
              <span className="db-hero-eyebrow">Today · Day {view.nextDay}</span>
              <p className="db-hero-reward">{reward?.label}</p>
              <p className="db-hero-note">
                Claim it to add it straight to your balance.
              </p>
              {interactive ? (
                <button
                  type="button"
                  className="db-claim-btn"
                  onClick={claim}
                  aria-label={`Claim your day ${view.nextDay} reward: ${reward?.label}`}
                >
                  Claim reward
                </button>
              ) : (
                <span className="db-claim-btn db-claim-btn--static" aria-hidden="true">
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
          <span className="db-receipt-check" aria-hidden="true">
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
              <li key={d.day} className={`db-pip is-${d.status}`} />
            ))}
          </ol>
        </div>

        <ol className="db-days">
          {view.days.map((d) => (
            <DayCard
              key={d.day}
              reward={d}
              onClaim={interactive ? claim : undefined}
              isFlashing={flashDay === d.day}
            />
          ))}
        </ol>
      </section>
    </div>
  )
}
