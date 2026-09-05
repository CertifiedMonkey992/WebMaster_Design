/* ═══════════════════════════════════════════════════════════════════════════
   PurchaseDialog.jsx — CONFIRM, THEN BUY
   ---------------------------------------------------------------------------
   Gems are never taken on a single click. The dialog states what is being
   bought, what it costs, and what the balance will be afterwards.

   The one-shot transaction id is minted when the dialog OPENS, not when the
   button is pressed, so every retry of one confirmation carries the same id
   and shopService settles it exactly once. A `settling` latch closes the door
   on the synchronous double-click before the id guard is even needed.

   On narrow screens the same markup slides up as a bottom sheet (CSS only).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import { GemIcon, Icon } from '../progression/Icons'
import ShopArt from './ShopArt'
import { REASONS } from '../../services/shopService'

let txnSeq = 0

export default function PurchaseDialog({ item, balance, owned, onConfirm, onClose }) {
  /* One id for the life of this dialog — see the note above. */
  const txnId = useMemo(() => `tx${Date.now().toString(36)}-${++txnSeq}`, [])
  const [settling, setSettling] = useState(false)
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const affordable = item.ok || item.reason !== REASONS.INSUFFICIENT_GEMS
  const after = Math.max(0, balance - item.price)

  const confirm = () => {
    if (settling) return
    setSettling(true)
    onConfirm(item.id, txnId)
  }

  return (
    <div className="sh-dialog-layer" role="presentation">
      <div className="sh-dialog-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sh-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sh-dialog-title"
      >
        <button className="sh-dialog-close" onClick={onClose} aria-label="Cancel purchase">
          <Icon name="close" size={15} strokeWidth={2.5} />
        </button>

        <div className="sh-dialog-art">
          <ShopArt name={item.art} size={96} />
        </div>

        <h2 className="sh-dialog-title" id="sh-dialog-title">{item.name}</h2>
        <p className="sh-dialog-desc">{item.description}</p>

        {owned > 0 && (
          <div className="sh-dialog-owned">
            <Icon name="shield" size={13} /> You already own {owned}
          </div>
        )}

        <dl className="sh-dialog-ledger">
          <div className="sh-ledger-row">
            <dt>Cost</dt>
            <dd className="is-cost"><GemIcon size={15} /> {item.price}</dd>
          </div>
          <div className="sh-ledger-row">
            <dt>Your balance</dt>
            <dd><GemIcon size={15} /> {balance}</dd>
          </div>
          <div className="sh-ledger-row sh-ledger-row--total">
            <dt>Balance after</dt>
            <dd><GemIcon size={15} /> {after}</dd>
          </div>
        </dl>

        {!affordable && (
          <p className="sh-dialog-warn">
            You need {item.price - balance} more gem{item.price - balance === 1 ? '' : 's'}.
          </p>
        )}

        <div className="sh-dialog-actions">
          <button className="sh-btn sh-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="sh-btn sh-btn--buy"
            ref={confirmRef}
            onClick={confirm}
            disabled={!item.ok || settling}
          >
            <GemIcon size={15} />
            {settling ? 'Buying…' : `Buy for ${item.price}`}
          </button>
        </div>
      </div>
    </div>
  )
}
