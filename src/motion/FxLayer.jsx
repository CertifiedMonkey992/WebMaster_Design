/* ═══════════════════════════════════════════════════════════════════════════
   FxLayer.jsx — ONE LISTENER FOR THE WHOLE PRODUCT'S POINTER RESPONSE
   ---------------------------------------------------------------------------
   Mounted once at the app root. Rather than every button and card attaching
   its own pointer handlers (and re-rendering on every mouse move), a single
   document listener finds what the pointer is over and writes CSS variables
   onto that element, at most once per frame:

     .btn, [data-magnetic]   --mag-x / --mag-y   Magnet: drift toward the pointer
                             --mx / --my         where the warm highlight sits
     [data-tilt]             --tilt-x / --tilt-y Tilt: −1…1 from the centre
                             --mx / --my         where the sheen sits

   CSS does everything else, which is why a component opts in with an
   attribute rather than a hook — including the real product components the
   landing page mounts.

   The same layer runs the tooltip for any element with `data-tip`. One
   persistent node, positioned with fixed coordinates, so it is never clipped
   by an overflow:hidden card, costs no React renders, and follows the
   element's live `data-tip` text (a countdown in a tooltip stays current).

   Touch devices and reduced-motion users get tooltips on focus/long-press
   but no magnet or tilt.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect } from 'react'
import { fxLayer, hasFinePointer, prefersReducedMotion } from './env'

const MAG_SELECTOR = '.btn:not(:disabled):not([aria-disabled="true"]), [data-magnetic]'
const TILT_SELECTOR = '[data-tilt]'

function resetMag(el) {
  if (!el) return
  el.style.setProperty('--mag-x', '0px')
  el.style.setProperty('--mag-y', '0px')
  el.classList.remove('is-magnet')
}

function resetTilt(el) {
  if (!el) return
  el.style.setProperty('--tilt-x', '0')
  el.style.setProperty('--tilt-y', '0')
  el.classList.remove('is-tilting')
}

export default function FxLayer() {
  /* ── Magnet + tilt ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let magEl = null
    let tiltEl = null
    let px = 0
    let py = 0
    let raf = 0

    const frame = () => {
      raf = 0
      if (magEl) {
        const r = magEl.getBoundingClientRect()
        const strength = Number(magEl.dataset.magnetic) || 5
        const nx = (px - (r.left + r.width / 2)) / (r.width / 2)
        const ny = (py - (r.top + r.height / 2)) / (r.height / 2)
        magEl.style.setProperty('--mag-x', `${(Math.max(-1, Math.min(1, nx)) * strength).toFixed(2)}px`)
        magEl.style.setProperty('--mag-y', `${(Math.max(-1, Math.min(1, ny)) * strength * 0.6).toFixed(2)}px`)
        magEl.style.setProperty('--mx', `${(((px - r.left) / r.width) * 100).toFixed(1)}%`)
        magEl.style.setProperty('--my', `${(((py - r.top) / r.height) * 100).toFixed(1)}%`)
      }
      if (tiltEl) {
        const r = tiltEl.getBoundingClientRect()
        const tx = ((px - r.left) / r.width) * 2 - 1
        const ty = ((py - r.top) / r.height) * 2 - 1
        tiltEl.style.setProperty('--tilt-x', Math.max(-1, Math.min(1, tx)).toFixed(3))
        tiltEl.style.setProperty('--tilt-y', Math.max(-1, Math.min(1, ty)).toFixed(3))
        tiltEl.style.setProperty('--mx', `${(((px - r.left) / r.width) * 100).toFixed(1)}%`)
        tiltEl.style.setProperty('--my', `${(((py - r.top) / r.height) * 100).toFixed(1)}%`)
      }
    }

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      if (!hasFinePointer() || prefersReducedMotion()) return
      px = e.clientX
      py = e.clientY

      const t = e.target instanceof Element ? e.target : null
      const nextMag = t?.closest(MAG_SELECTOR) || null
      const nextTilt = t?.closest(TILT_SELECTOR) || null

      if (nextMag !== magEl) {
        resetMag(magEl)
        magEl = nextMag
        magEl?.classList.add('is-magnet')
      }
      if (nextTilt !== tiltEl) {
        resetTilt(tiltEl)
        tiltEl = nextTilt
        tiltEl?.classList.add('is-tilting')
      }
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onLeaveWindow = (e) => {
      if (e.relatedTarget) return
      resetMag(magEl); resetTilt(tiltEl)
      magEl = null; tiltEl = null
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onLeaveWindow, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeaveWindow)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* ── Tooltips ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const tip = document.createElement('div')
    tip.className = 'fx-tip'
    tip.id = 'fx-tip'
    tip.setAttribute('role', 'tooltip')
    fxLayer().appendChild(tip)

    let anchor = null
    let showTimer = 0
    let hideTimer = 0
    let refresh = 0
    let warmUntil = 0

    const place = () => {
      if (!anchor) return
      const text = anchor.getAttribute('data-tip')
      if (!text) { hide(); return }
      if (tip.textContent !== text) tip.textContent = text

      const r = anchor.getBoundingClientRect()
      const tr = tip.getBoundingClientRect()
      const gap = 8
      let side = anchor.getAttribute('data-tip-side') || 'top'
      if (side === 'right' && (r.right + tr.width + gap > window.innerWidth - 6 || window.innerWidth < 900)) side = 'top'
      if (side === 'top' && r.top - tr.height - gap < 6) side = 'bottom'
      if (side === 'bottom' && r.bottom + tr.height + gap > window.innerHeight - 6) side = 'top'

      let x
      let y
      if (side === 'right') {
        x = r.right + gap
        y = r.top + r.height / 2 - tr.height / 2
      } else {
        x = r.left + r.width / 2 - tr.width / 2
        x = Math.max(8, Math.min(window.innerWidth - tr.width - 8, x))
        y = side === 'top' ? r.top - tr.height - gap : r.bottom + gap
      }

      tip.style.left = `${Math.round(x)}px`
      tip.style.top = `${Math.round(y)}px`
      tip.dataset.side = side
      /* Where the anchor's centre is along the tooltip, for the origin of the
         scale-in — so it grows out of the thing it describes. */
      tip.style.setProperty('--tip-origin', side === 'right' ? '0px' : `${Math.round(r.left + r.width / 2 - x)}px`)
    }

    const show = (el) => {
      clearTimeout(hideTimer)
      anchor = el
      tip.textContent = el.getAttribute('data-tip') || ''
      tip.classList.remove('is-on')
      place()
      // force reflow so the entrance restarts when moving between anchors
      void tip.offsetWidth
      tip.classList.add('is-on')
      el.setAttribute('aria-describedby', 'fx-tip')
      clearInterval(refresh)
      refresh = window.setInterval(place, 500)
    }

    const hide = () => {
      clearTimeout(showTimer)
      clearInterval(refresh)
      if (anchor) {
        if (anchor.getAttribute('aria-describedby') === 'fx-tip') anchor.removeAttribute('aria-describedby')
        warmUntil = Date.now() + 400
      }
      anchor = null
      tip.classList.remove('is-on')
    }

    const schedule = (el, delay) => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      if (anchor === el) return
      const wait = Date.now() < warmUntil || anchor ? 40 : delay
      showTimer = window.setTimeout(() => show(el), wait)
    }

    const onOver = (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-tip]') : null
      if (!el) return
      schedule(el, 320)
    }
    const onOut = (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-tip]') : null
      if (!el) return
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return
      clearTimeout(showTimer)
      hideTimer = window.setTimeout(hide, 60)
    }
    const onFocusIn = (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-tip]') : null
      if (!el || !el.matches(':focus-visible')) return
      schedule(el, 80)
    }
    const onFocusOut = () => { hideTimer = window.setTimeout(hide, 40) }
    const onKey = (e) => { if (e.key === 'Escape') hide() }

    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('pointerdown', hide, { passive: true })
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, { passive: true, capture: true })

    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('pointerdown', hide)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hide, { capture: true })
      clearTimeout(showTimer); clearTimeout(hideTimer); clearInterval(refresh)
      tip.remove()
    }
  }, [])

  return null
}
