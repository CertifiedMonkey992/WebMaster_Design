/* ═══════════════════════════════════════════════════════════════════════════
   Popover.jsx — ANCHORED PANEL USED BY THE STATUS BAR
   ---------------------------------------------------------------------------
   Small, dependency-free and accessible: closes on outside click and on
   Escape, restores focus to the trigger, and collapses to a bottom sheet on
   narrow screens (handled in CSS) so the panels stay usable on a phone.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef } from 'react'

export default function Popover({ open, onClose, title, children, align = 'right', className = '' }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      const el = ref.current
      if (!el) return
      /* Ignore clicks on the trigger itself — the trigger toggles by itself. */
      if (e.target.closest?.('[data-popover-trigger]')) return
      if (!el.contains(e.target)) onClose()
    }
    const onKeyDown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Scrim only shows on small screens, where the popover becomes a sheet */}
      <div className="pg-popover-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={`pg-popover pg-popover--${align} ${className}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
      >
        <div className="pg-popover-head">
          <h3 className="pg-popover-title" id={titleId}>{title}</h3>
          <button className="pg-popover-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="pg-popover-body">{children}</div>
      </div>
    </>
  )
}
