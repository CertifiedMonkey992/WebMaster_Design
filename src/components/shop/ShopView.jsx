/* ═══════════════════════════════════════════════════════════════════════════
   ShopView.jsx — THE SHOP
   ---------------------------------------------------------------------------
   Renders whatever is in SHOP_ITEMS: sections, cards and disabled reasons all
   come from the catalogue plus the availability verdict the reducer will use,
   so a card can never offer a purchase the engine would refuse.

   No local currency, hearts or shield state lives here. A card calls
   `actions.purchaseItem`, the central reducer does the work, and the view
   re-renders from the shared view model — which is why the top bar, the streak
   panel and this page always agree.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { SHOP_SECTIONS } from '../../config/shopConfig'
import { REASONS } from '../../services/shopService'
import { GemIcon, Icon } from '../progression/Icons'
import { formatNumber } from '../../utils/progressionUtils'
import ShopArt from './ShopArt'
import PurchaseDialog from './PurchaseDialog'
import './shop.css'

/** Why a button is disabled, in the learner's words. */
function unavailableLabel(item) {
  switch (item.reason) {
    case REASONS.HEARTS_FULL:
      return 'Your hearts are already full'
    case REASONS.MAX_OWNED:
      return `You already hold the maximum of ${item.owned}`
    case REASONS.INSUFFICIENT_GEMS:
      return `Not enough gems — you need ${item.shortfall} more`
    default:
      return 'Unavailable right now'
  }
}

function ShopCard({ item, onBuy }) {
  const disabled = !item.ok
  return (
    <article className={`sh-card${item.featured ? ' sh-card--featured' : ''}${disabled ? ' is-disabled' : ''}`}>
      <div className={`sh-card-art sh-art--${item.accent}`}>
        <ShopArt name={item.art} size={item.featured ? 104 : 84} />
      </div>

      <div className="sh-card-body">
        <div className="sh-card-head">
          <h3 className="sh-card-name">{item.name}</h3>
          {item.ownable && item.owned > 0 && (
            <span className="sh-owned-badge">
              <Icon name="shield" size={12} strokeWidth={2.4} />
              {item.owned} owned
            </span>
          )}
        </div>
        <p className="sh-card-tagline">{item.tagline}</p>
        <p className="sh-card-desc">{item.description}</p>

        <div className="sh-card-foot">
          <span className="sh-price">
            <GemIcon size={17} />
            {item.price}
          </span>
          <button
            className="sh-btn sh-btn--buy"
            onClick={() => onBuy(item)}
            disabled={disabled}
            aria-describedby={disabled ? `${item.id}-why` : undefined}
          >
            {item.cta}
          </button>
        </div>

        {disabled && (
          <p className="sh-card-why" id={`${item.id}-why`}>
            <Icon name="info" size={12} />
            {unavailableLabel(item)}
          </p>
        )}
      </div>
    </article>
  )
}

export default function ShopView() {
  const { vm, actions } = useProgression()
  const [pending, setPending] = useState(null)   // the item awaiting confirmation
  const [receipt, setReceipt] = useState(null)   // the "✓ added" banner

  const openConfirm = useCallback((item) => setPending(item), [])

  const confirm = useCallback((itemId, txnId) => {
    const events = actions.purchaseItem(itemId, txnId)
    setPending(null)
    const done = events.find((e) => e.type === 'PURCHASE_COMPLETE')
    if (done) setReceipt({ name: done.name, price: done.price, balance: done.balance, at: Date.now() })
  }, [actions])

  /* The receipt is a transient confirmation, not a dismissible alert. */
  useEffect(() => {
    if (!receipt) return undefined
    const id = setTimeout(() => setReceipt(null), 4200)
    return () => clearTimeout(id)
  }, [receipt])

  /* Availability is recomputed on every render from live state, so a card
     that just became unbuyable (hearts now full) updates itself. */
  const itemsFor = (sectionId) => vm.shop.items.filter((i) => i.section === sectionId)
  const pendingLive = pending ? vm.shop.items.find((i) => i.id === pending.id) : null

  return (
    <div className="sh-page">
      <header className="sh-header">
        <div className="sh-header-text">
          <span className="sh-eyebrow">Shop</span>
          <h1 className="sh-title">Spend your gems</h1>
          <p className="sh-lead">
            Gems come from quests, perfect lessons and streak milestones. Trade them
            for the things that keep a run going.
          </p>
        </div>

        <div className="sh-balance">
          <ShopArt name="gemStack" size={78} />
          <div className="sh-balance-text">
            <span className="sh-balance-label">Your balance</span>
            <span className="sh-balance-value">
              <GemIcon size={19} />
              {formatNumber(vm.gems)}
            </span>
          </div>
        </div>
      </header>

      {receipt && (
        <div className="sh-receipt" role="status">
          <span className="sh-receipt-check" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={3.2} />
          </span>
          <span className="sh-receipt-text">
            <strong>{receipt.name}</strong> added
          </span>
          <span className="sh-receipt-balance">
            <GemIcon size={14} /> {formatNumber(receipt.balance)}
          </span>
        </div>
      )}

      {SHOP_SECTIONS.map((section) => {
        const items = itemsFor(section.id)
        if (!items.length) return null
        return (
          <section className="sh-section" key={section.id}>
            <div className="sh-section-head">
              <h2 className="sh-section-title">{section.title}</h2>
              <p className="sh-section-blurb">{section.blurb}</p>
            </div>
            <div className="sh-grid">
              {items.map((item) => (
                <ShopCard key={item.id} item={item} onBuy={openConfirm} />
              ))}
            </div>
          </section>
        )
      })}

      <p className="sh-footnote">
        More items are on the way — XP boosts, lesson themes and mascot gear.
      </p>

      {pendingLive && (
        <PurchaseDialog
          item={pendingLive}
          balance={vm.gems}
          owned={pendingLive.owned}
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
