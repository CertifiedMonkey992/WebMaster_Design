/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusModal.jsx — THE CONNECTED DAILY BONUS
   ---------------------------------------------------------------------------
   Wiring only: pull the bonus view out of the shared view model, hand it to
   the presentational track, route the claim through the central reducer.

   Revision 2: the panel rises with a spring and leaves by settling back
   down, so it stays mounted for its exit.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import DailyBonusTrack from './DailyBonusTrack'
import useDialog from '../../hooks/useDialog'
import './dailyBonus.css'

const EXIT_MS = 220

export default function DailyBonusModal({ open, onClose }) {
  const { vm, actions } = useProgression()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)

  useClock()

  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); return undefined }
    if (!mounted) return undefined
    setLeaving(true)
    const t = window.setTimeout(() => { setMounted(false); setLeaving(false) }, EXIT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  const claim = useCallback(() => actions.claimDailyBonus(), [actions])

  useDialog(panelRef, { open, onClose })
  /* Runs once the panel is in the DOM, not on the render that asked for it. */
  useEffect(() => {
    if (open && mounted) closeRef.current?.focus()
  }, [open, mounted])

  if (!mounted) return null

  return (
    <div className={`db-overlay${leaving ? ' is-leaving' : ''}`} onClick={onClose}>
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
