/* ═══════════════════════════════════════════════════════════════════════════
   ShopView.jsx — THE SHOP
   ---------------------------------------------------------------------------
   Renders whatever is in SHOP_ITEMS. Availability comes from the same
   verdict the reducer uses, so a card can never offer a purchase the engine
   would refuse. No local currency, hearts or shield state lives here.

   Revision 2 — the shop is a system you can watch work:
     · hover a row: the item's art lifts out of its tile, the price gem turns
     · can't buy it: the Buy button still answers — the row shakes, the price
       flashes, and a drawer opens saying why and where to go instead
     · buy it: gems leave your balance and fly INTO the item; the item pops;
       then what you bought flies to the counter it affects (hearts to the
       hearts pill, a shield to the streak), and only then do those roll
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { SHOP_SECTIONS, SHOP_ITEMS } from '../../config/shopConfig'
import { REASONS } from '../../services/shopService'
import { QUESTS } from '../../config/progressionConfig'
import { GemIcon, Icon } from '../progression/Icons'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'
import { formatNumber } from '../../utils/progressionUtils'
import ShopArt from './ShopArt'
import PurchaseDialog from './PurchaseDialog'
import SplitText from '../../motion/SplitText'
import { useShopPreviews } from '../learn/previews'
import Reveal from '../../motion/Reveal'
import RollingNumber from '../../motion/RollingNumber'
import { fly, hold, useLandedValue } from '../../motion/flight'
import { burst, shake, ring } from '../../motion/burst'
import './shop.css'

/** Why an item can't be bought, in the learner's words — and what to do. */
function unavailable(item) {
  switch (item.reason) {
    case REASONS.HEARTS_FULL:
      return { text: 'Your hearts are already full', hint: 'Come back after a wrong answer or two.', nav: null }
    case REASONS.MAX_OWNED:
      return { text: `You already hold the maximum of ${item.owned}`, hint: 'One is spent automatically when you miss a day.', nav: null }
    case REASONS.INSUFFICIENT_GEMS:
      return { text: `Not enough gems — you need ${item.shortfall} more`, hint: `Daily quests pay ${QUESTS.REWARD.easy}–${QUESTS.REWARD.hard} gems each.`, nav: { id: 'quests', label: 'Go to quests' } }
    default:
      return { text: 'Unavailable right now', hint: '', nav: null }
  }
}

/* What a purchase delivers, and where it lands. */
const EFFECT = {
  heart_refill:  { key: 'hearts', icon: 'heart', count: 5 },
  extra_heart:   { key: 'hearts', icon: 'heart', count: 1 },
  streak_shield: { key: 'streak', icon: 'shield', count: 1 },
}

const PALETTE = { heart: 'heart', streak: 'shield', gem: 'gem' }

function ShopCard({ item, onBuy, onNavigate, popped, index }) {
  const disabled = !item.ok
  const rowRef = useRef(null)
  const [why, setWhy] = useState(false)
  const reason = disabled ? unavailable(item) : null

  useEffect(() => { if (!disabled) setWhy(false) }, [disabled])

  const press = () => {
    if (disabled) {
      shake(rowRef.current, { distance: 5 })
      setWhy(true)
      return
    }
    onBuy(item)
  }

  return (
    <article
      ref={rowRef}
      className={[
        'sh-card',
        disabled ? 'is-disabled' : '',
        why ? 'is-explaining' : '',
        popped ? 'is-received' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--i': index }}
    >
      <div className="sh-card-main">
        <div className={`sh-card-art sh-art--${item.accent}`} data-shop-art={item.id}>
          <ShopArt name={item.art} size={item.featured ? 104 : 84} />
        </div>

        <div className="sh-card-body">
          <div className="sh-card-head">
            <h3 className="sh-card-name">{item.name}</h3>
            {item.ownable && item.owned > 0 && (
              <span className="sh-owned-badge" key={item.owned}>
                <Icon name="shield" size={12} strokeWidth={2.4} />
                <RollingNumber value={item.owned} /> owned
              </span>
            )}
          </div>
          <p className="sh-card-tagline">{item.tagline}</p>
          <div className="sh-card-desc-wrap">
            <p className="sh-card-desc">{item.description}</p>
          </div>
        </div>

        <div className="sh-card-foot">
          <span className="sh-price fx-glint-host fx-gleam" data-tip={disabled ? reason.text : `${item.price} gems`}>
            <GemIcon size={16} />
            {item.price}
          </span>
          <button
            className="btn btn-outline btn-sm sh-buy"
            onClick={press}
            aria-disabled={disabled || undefined}
            aria-describedby={disabled ? `${item.id}-why` : undefined}
          >
            {item.cta}
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {disabled && (
        <div className="sh-why" id={`${item.id}-why`}>
          <div className="sh-why-inner">
            <Icon name="info" size={13} />
            <span>
              <b>{reason.text}.</b> {reason.hint}
            </span>
            {reason.nav && onNavigate && (
              <button type="button" className="sh-why-link" onClick={() => onNavigate(reason.nav.id)} tabIndex={why ? 0 : -1}>
                {reason.nav.label}
                <Icon name="chevron-right" size={12} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export default function ShopView({ onNavigate }) {
  const { vm, actions } = useProgression()
  const [pending, setPending] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [popped, setPopped] = useState(null)
  const balanceRef = useRef(null)
  const pageRef = useRef(null)
  useShopPreviews(pageRef)
  const gems = useLandedValue('gems', vm.gems)

  const openConfirm = useCallback((item) => setPending(item), [])

  const confirm = useCallback((itemId, txnId) => {
    const art = document.querySelector(`[data-shop-art="${itemId}"]`)
    const effect = EFFECT[itemId]
    const catalogue = SHOP_ITEMS.find((i) => i.id === itemId)
    /* Hold the counter the purchase will change until its flight lands. */
    const release = effect ? hold(effect.key, 3000) : () => {}

    const events = actions.purchaseItem(itemId, txnId)
    setPending(null)
    const done = events.find((e) => e.type === 'PURCHASE_COMPLETE')
    if (!done) { release(); return }

    setReceipt({ name: done.name, price: done.price, balance: done.balance, at: Date.now() })

    fly({
      from: balanceRef.current,
      to: art,
      icon: 'gem',
      count: 6,
      label: `−${done.price}`,
      onLand: () => {
        setPopped(itemId)
        window.setTimeout(() => setPopped(null), 900)
        ring(art, { color: catalogue?.accent === 'streak' ? '--evergreen' : '--berry', size: 110 })
        burst(art, { palette: PALETTE[catalogue?.accent] ?? 'reward', count: 16, spread: 70 })
        if (effect) {
          fly({ from: art, to: effect.key, icon: effect.icon, count: effect.count, onLand: release })
        }
      },
    })
  }, [actions])

  useEffect(() => {
    if (!receipt) return undefined
    const id = setTimeout(() => setReceipt(null), 4600)
    return () => clearTimeout(id)
  }, [receipt])

  const itemsFor = (sectionId) => vm.shop.items.filter((i) => i.section === sectionId)
  const pendingLive = pending ? vm.shop.items.find((i) => i.id === pending.id) : null

  let rowIndex = 0

  return (
    <div className="sh-page" ref={pageRef}>
      <header className="sh-header">
        <div className="sh-header-text">
          <span className="sh-eyebrow">Shop</span>
          <SplitText as="h1" className="sh-title" immediate stagger={60}>Spend your gems</SplitText>
          <Reveal as="p" className="sh-lead" variant="fade" immediate delay={260}>
            Gems come from quests, perfect lessons and streak milestones. Trade them
            for the things that keep a run going.
          </Reveal>
        </div>

        <Reveal variant="scale" immediate delay={180}>
          <div
            className="sh-balance fx-glint-host fx-gleam"
            ref={balanceRef}
            data-tip={vm.unlimitedGems
              ? `The reviewer profile tops itself up · ${formatNumber(vm.gems)} right now`
              : 'Earn more from quests and perfect lessons'}
          >
            <span className="sh-balance-art"><ShopArt name="gemStack" size={78} /></span>
            <div className="sh-balance-text">
              <span className="sh-balance-label">Your balance</span>
              <span className="sh-balance-value">
                <GemIcon size={19} />
                {/* Six digits nobody is counting say less than the symbol
                    does. The receipt on each purchase still quotes the real
                    figure, and the reviewer console can switch the purse
                    back to behaving normally. */}
                {vm.unlimitedGems
                  ? <span className="sh-balance-endless" aria-label="Unlimited">∞</span>
                  : <RollingNumber value={gems} format={formatNumber} />}
              </span>
            </div>
          </div>
        </Reveal>

        {/* Reviewer only. The shop refuses a purchase the state cannot
            support, so these put the profile back into the states worth
            seeing: hearts to spend on, and a shield stock to spend down. */}
        <JudgeMargin className="sh-judge-margin" label="Reviewer shop controls">
          <JudgeChip op={OPS.HEARTS} payload={{ amount: -3 }} icon="heart" label="Spend 3 hearts"
            disabled={vm.hearts === 0} tip="So the heart refill has something to refill" />
          <JudgeChip op={OPS.SHIELDS} payload={{ count: 0 }} icon="shield" label="Empty the shields" quiet
            disabled={vm.shields === 0} tip="So a Streak Shield can be bought again" />
          <JudgeChip op={OPS.POWERS} payload={{ powers: { infiniteGems: false } }} icon="gem" label="Normal purse" quiet
            tip="Stop topping the balance up, so a price can actually be out of reach" />
        </JudgeMargin>
      </header>

      {receipt && (
        <div className="sh-receipt" role="status" key={receipt.at}>
          <span className="sh-receipt-check is-drawing" aria-hidden="true">
            <Icon name="check" size={13} strokeWidth={3.2} />
          </span>
          <span className="sh-receipt-text">
            <strong>{receipt.name}</strong> added
          </span>
          <span className="sh-receipt-balance">
            <GemIcon size={14} /> {formatNumber(receipt.balance)} left
          </span>
          <span className="sh-receipt-timer" aria-hidden="true" />
        </div>
      )}

      {SHOP_SECTIONS.map((section) => {
        const items = itemsFor(section.id)
        if (!items.length) return null
        return (
          <section className="sh-section" key={section.id}>
            <Reveal className="sh-section-head" variant="left" immediate delay={200}>
              <h2 className="sh-section-title">{section.title}</h2>
              <p className="sh-section-blurb">{section.blurb}</p>
            </Reveal>
            <div className="sh-grid">
              {items.map((item) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  index={rowIndex++}
                  onBuy={openConfirm}
                  onNavigate={onNavigate}
                  popped={popped === item.id}
                />
              ))}
            </div>
          </section>
        )
      })}

      <p className="sh-footnote">
        Three items, and that is the whole shop. Gems buy time back in a
        lesson, never progress through one.
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
