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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const claim = useCallback(() => actions.claimDailyBonus(), [actions])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
