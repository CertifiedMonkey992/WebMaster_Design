/* ═══════════════════════════════════════════════════════════════════════════
   WheelModal.jsx — THE CONNECTED DAILY SPIN
   ---------------------------------------------------------------------------
   Wiring only: the wheel view out of the shared view model, the spin through
   the central reducer (actions.spinWheel draws with crypto and hands the
   draw to the reducer). The panel rises on open and settles back down on
   close, so it stays mounted for its exit.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import SpinWheel from './SpinWheel'
import useDialog from '../../hooks/useDialog'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'
import './wheel.css'

const EXIT_MS = 220

export default function WheelModal({ open, onClose }) {
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

  useDialog(panelRef, { open, onClose })
  useEffect(() => {
    if (open && mounted) closeRef.current?.focus()
  }, [open, mounted])

  if (!mounted) return null

  return (
    <div className={`wh-overlay${leaving ? ' is-leaving' : ''}`} onClick={onClose}>
      <div
        className="wh-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wh-title"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="wh-close" onClick={onClose} aria-label="Close daily spin" ref={closeRef}>
          <Icon name="close" size={15} strokeWidth={2.4} />
        </button>

        <header className="wh-head">
          <span className="wh-eyebrow">Daily spin</span>
          <h2 className="wh-title" id="wh-title">Spin for a reward</h2>
        </header>

        <SpinWheel view={vm.wheel} onSpin={actions.spinWheel} />

        {/* Reviewer only. Banking a spin goes through the reducer; the spin
            itself is still the press above, with the real draw and payout. */}
        <JudgeMargin className="wh-judge-margin" label="Reviewer daily-spin controls">
          <JudgeChip op={OPS.SPINS} payload={{ count: 1 }} icon="plus" label="Bank a spin"
            tip="Add one extra spin, so the wheel can be tried again right away" />
        </JudgeMargin>
      </div>
    </div>
  )
}
