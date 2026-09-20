/* ═══════════════════════════════════════════════════════════════════════════
   useDialog.js — WHAT EVERY MODAL DIALOG OWES THE KEYBOARD
   ---------------------------------------------------------------------------
   While a dialog is open:
     · Tab and Shift+Tab stay inside it
     · the page behind it does not scroll
     · Escape closes it — and ONLY the topmost open dialog, so one keypress
       never closes a lesson and the panel over it together
   When it closes, focus returns to the control that opened it.

     const ref = useRef(null)
     useDialog(ref, { open, onClose })
     <div ref={ref} role="dialog" aria-modal="true">…</div>
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Open dialogs, bottom to top. */
const stack = []

/**
 * `modal: false` is for an anchored popover: it joins the Escape stack and
 * gives focus back on close, but neither traps Tab nor locks the page's
 * scroll, because the page behind it stays usable.
 */
export default function useDialog(ref, { open = true, onClose, modal = true } = {}) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const entry = {}
    stack.push(entry)
    const isTop = () => stack[stack.length - 1] === entry

    const opener = document.activeElement
    /* If the opener is gone by the time this closes (a lesson row re-rendered
       as completed), focus goes to that lesson's new row, or to the page. */
    const openerLesson = opener instanceof HTMLElement ? opener.closest('[data-lesson-id]')?.getAttribute('data-lesson-id') : null
    const previousOverflow = document.body.style.overflow
    if (modal) document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (!isTop()) return
      if (e.key === 'Escape') {
        if (onCloseRef.current) { e.preventDefault(); onCloseRef.current() }
        return
      }
      if (e.key !== 'Tab' || !modal) return
      const node = ref.current
      if (!node) return
      const focusable = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!focusable.length) { e.preventDefault(); node.focus(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (!node.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(entry), 1)
      if (modal) document.body.style.overflow = previousOverflow
      const back = opener instanceof HTMLElement && opener.isConnected
        ? opener
        : (openerLesson && document.querySelector(`[data-lesson-id="${openerLesson}"]`)) || document.querySelector('main')
      if (back instanceof HTMLElement) back.focus({ preventScroll: true })
    }
  }, [open, ref, modal])
}
