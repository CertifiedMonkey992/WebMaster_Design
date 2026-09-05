/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusModal.jsx — THE CONNECTED DAILY BONUS
   ---------------------------------------------------------------------------
   The only job here is wiring: pull the bonus view out of the shared view
   model, hand it to the presentational track, and route the claim through the
   central reducer. No reward logic, no dates, no state of its own.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import DailyBonusTrack from './DailyBonusTrack'
import './dailyBonus.css'

export default function DailyBonusModal({ open, onClose }) {
  const { vm, actions } = useProgression()
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  /* Keeps the "next reward in 5h 42m" line moving. Availability itself comes
     from the calendar date in the service, never from this countdown. */
  useClock()

  const claim = useCallback(() => actions.claimDailyBonus(), [actions])

  /* Escape to close, and focus moves into the dialog so the keyboard path
     works without a mouse. */
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* Trap Tab inside the dialog while it is open. */
  useEffect(() => {
    if (!open) return undefined
    const onTab = (e) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onTab)
    return () => window.removeEventListener('keydown', onTab)
  }, [open])

  if (!open) return null

  return (
    <div className="db-overlay" onClick={onClose}>
      <div
        className="db-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Daily bonus"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="db-close"
          onClick={onClose}
          aria-label="Close daily bonus"
          ref={closeRef}
        >
          <Icon name="close" size={15} strokeWidth={2.4} />
        </button>

        <DailyBonusTrack view={vm.dailyBonus} onClaim={claim} variant="panel" />
      </div>
    </div>
  )
}
