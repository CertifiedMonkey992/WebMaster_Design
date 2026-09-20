/* ═══════════════════════════════════════════════════════════════════════════
   Popover.jsx — ANCHORED PANEL USED BY THE STATUS BAR
   ---------------------------------------------------------------------------
   Closes on outside click and Escape, and collapses to a bottom sheet on
   narrow screens (CSS).

   Revision 2: the panel grows OUT OF the pill that opened it (scale from its
   top-right corner with a spring), its contents arrive in sequence, and it
   leaves by settling back toward the pill rather than vanishing — so it is
   kept mounted for the length of its exit.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from 'react'
import useDialog from '../../hooks/useDialog'

const EXIT_MS = 170
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Popover({ open, onClose, title, children, align = 'right', className = '', tone }) {
  const ref = useRef(null)
  const titleId = useId()
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setLeaving(false)
      return undefined
    }
    if (!mounted) return undefined
    setLeaving(true)
    const t = window.setTimeout(() => { setMounted(false); setLeaving(false) }, EXIT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  /* Escape goes through the same stack every dialog uses, and focus returns
     to the pill on close. Not modal: the page behind stays scrollable. */
  useDialog(ref, { open, onClose, modal: false })

  /* Focus moves into the panel once it is in the DOM. */
  useEffect(() => {
    if (open && mounted) ref.current?.querySelector(FOCUSABLE)?.focus()
  }, [open, mounted])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      const el = ref.current
      if (!el) return
      if (e.target.closest?.('[data-popover-trigger]')) return
      if (!el.contains(e.target)) onClose()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <>
      <div className={`pg-popover-scrim${leaving ? ' is-leaving' : ''}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={`pg-popover pg-popover--${align}${tone ? ` pg-popover--${tone}` : ''}${leaving ? ' is-leaving' : ''} ${className}`}
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
