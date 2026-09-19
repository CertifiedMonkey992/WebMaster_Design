/* ═══════════════════════════════════════════════════════════════════════════
   PurchaseDialog.jsx — CONFIRM, THEN BUY
   ---------------------------------------------------------------------------
   Gems are never taken on a single click. The dialog states what is being
   bought, what it costs, and what the balance will be afterwards.

   The one-shot transaction id is minted when the dialog OPENS, so every retry
   of one confirmation carries the same id and shopService settles it once.

   Revision 2: the item drops onto the dialog; the ledger rows arrive in
   order and "Balance after" counts down from your balance to what will be
   left, so the cost is watched rather than read. Cancel leaves by sinking.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import { GemIcon, Icon } from '../progression/Icons'
import ShopArt from './ShopArt'
import CountUp from '../../motion/CountUp'
import { REASONS } from '../../services/shopService'
import useDialog from '../../hooks/useDialog'

let txnSeq = 0

export default function PurchaseDialog({ item, balance, owned, onConfirm, onClose }) {
  const txnId = useMemo(() => `tx${Date.now().toString(36)}-${++txnSeq}`, [])
  const [settling, setSettling] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const confirmRef = useRef(null)
  const dialogRef = useRef(null)
  const [openBalance] = useState(balance)

  const close = () => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onClose, 180)
  }

  useDialog(dialogRef, { onClose: close })
  useEffect(() => { confirmRef.current?.focus() }, [])

  const affordable = item.ok || item.reason !== REASONS.INSUFFICIENT_GEMS
  const after = Math.max(0, openBalance - item.price)

  const confirm = () => {
    if (settling) return
    setSettling(true)
    onConfirm(item.id, txnId)
  }

  return (
    <div className={`sh-dialog-layer${leaving ? ' is-leaving' : ''}`} role="presentation">
      <div className="sh-dialog-scrim" onClick={close} aria-hidden="true" />
      <div
        className="sh-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sh-dialog-title"
        ref={dialogRef}
      >
        <button className="sh-dialog-close" onClick={close} aria-label="Cancel purchase">
          <Icon name="close" size={15} strokeWidth={2.5} />
        </button>

        <div className={`sh-dialog-art sh-art--${item.accent}`}>
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
            <dd><GemIcon size={15} /> {openBalance}</dd>
          </div>
          <div className="sh-ledger-row sh-ledger-row--total">
            <dt>Balance after</dt>
            <dd>
              <GemIcon size={15} />
              <CountUp value={after} from={openBalance} immediate delay={520} duration={900} />
            </dd>
          </div>
        </dl>

        {!affordable && (
          <p className="sh-dialog-warn">
            You need {item.price - openBalance} more gem{item.price - openBalance === 1 ? '' : 's'}.
          </p>
        )}

        <div className="sh-dialog-actions">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button
            className={`btn btn-primary sh-confirm${item.ok && !settling ? ' fx-shine' : ''}`}
            ref={confirmRef}
            onClick={confirm}
            disabled={!item.ok || settling}
          >
            {settling ? <span className="sh-spinner" aria-hidden="true" /> : <GemIcon size={15} />}
            {settling ? 'Buying…' : `Buy for ${item.price}`}
          </button>
        </div>
      </div>
    </div>
  )
}
