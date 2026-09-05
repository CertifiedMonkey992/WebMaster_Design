/* ═══════════════════════════════════════════════════════════════════════════
   shopService.js — PURCHASES
   ---------------------------------------------------------------------------
   One function does the whole transaction:

       find item → check it can be bought → deduct gems → apply the effect
                 → record it → emit events

   Nothing here mutates state, and no shop component is allowed to touch gems,
   hearts or shields directly — they dispatch PURCHASE_ITEM and read the result.
   That is what keeps the shop, the top bar and the streak engine in agreement.

   Two independent guards stop a learner being charged twice:

     • affordability and availability are re-checked against the CURRENT state
       inside the reducer, not against whatever the card rendered with; and
     • every confirmed purchase carries a one-shot `txnId`. Replaying an id
       that has already been settled returns the state untouched.
   ═══════════════════════════════════════════════════════════════════════════ */

import { getShopItem, ITEM_TYPES, SHIELD } from '../config/shopConfig'
import { TXN_HISTORY } from './storageService'
import currency from './currencyService'
import streakService from './streakService'

/* ── Availability ────────────────────────────────────────────────────────────
   Why an item cannot be bought right now. `null` means it can.
   The shop renders these reasons, so the copy lives with the rule. */

export const REASONS = {
  HEARTS_FULL:       'hearts-full',
  INSUFFICIENT_GEMS: 'insufficient-gems',
  MAX_OWNED:         'max-owned',
  UNKNOWN_ITEM:      'unknown-item',
  DUPLICATE:         'duplicate',
}

/**
 * Can this item be bought against this state? Pure, and used by BOTH the card
 * (to disable the button) and the reducer (to refuse the purchase), so the UI
 * can never offer something the engine would reject.
 */
export function getAvailability(state, itemId) {
  const item = getShopItem(itemId)
  if (!item) return { ok: false, reason: REASONS.UNKNOWN_ITEM, item: null }

  if (item.type === ITEM_TYPES.HEART_REFILL && state.hearts >= state.maxHearts) {
    return { ok: false, reason: REASONS.HEARTS_FULL, item }
  }
  if (item.type === ITEM_TYPES.EXTRA_HEART && state.hearts >= state.maxHearts) {
    return { ok: false, reason: REASONS.HEARTS_FULL, item }
  }
  if (item.type === ITEM_TYPES.STREAK_SHIELD && state.streak.shields >= SHIELD.MAX_OWNED) {
    return { ok: false, reason: REASONS.MAX_OWNED, item }
  }
  /* Affordability is checked last so "you need N more gems" is only shown for
     items the learner could otherwise actually use. */
  if (!currency.canAffordGems(state, item.price)) {
    return { ok: false, reason: REASONS.INSUFFICIENT_GEMS, item, shortfall: item.price - state.gems }
  }
  return { ok: true, reason: null, item }
}

/** How many of an ownable item the learner holds. */
export function getOwnedCount(state, itemId) {
  const item = getShopItem(itemId)
  if (item?.type === ITEM_TYPES.STREAK_SHIELD) return state.streak.shields
  return 0
}

/* ── Effects ─────────────────────────────────────────────────────────────────
   One per item type. Each returns `{ state, events }` and is responsible ONLY
   for the effect — gems have already been taken by the time it runs. */

const EFFECTS = {
  [ITEM_TYPES.HEART_REFILL]: (state, item, now) =>
    currency.restoreAllHearts(state, 'shop-heart-refill', now),

  [ITEM_TYPES.EXTRA_HEART]: (state, item, now) =>
    currency.restoreHeart(state, 1, 'shop-extra-heart', now),

  [ITEM_TYPES.STREAK_SHIELD]: (state) => {
    const next = streakService.grantShield(state, 1)
    return {
      state: next,
      events: [{ type: 'SHIELD_ACQUIRED', total: next.streak.shields }],
    }
  },
}

/* ── The transaction ─────────────────────────────────────────────────────── */

/**
 * Buy one item.
 *
 * @param txnId one-shot id minted when the learner opened the confirmation.
 *              Passing the same id twice settles only the first.
 */
export function purchaseItem(state, { itemId, txnId } = {}, now = Date.now()) {
  const item = getShopItem(itemId)
  if (!item) {
    return { state, events: [{ type: 'PURCHASE_FAILED', reason: REASONS.UNKNOWN_ITEM, itemId }], ok: false }
  }

  if (txnId && state.shop.seenTxnIds.includes(txnId)) {
    /* Already settled — the learner is not charged again, and this is not an
       error worth showing them. */
    return { state, events: [{ type: 'PURCHASE_DUPLICATE', itemId, txnId }], ok: false }
  }

  const availability = getAvailability(state, itemId)
  if (!availability.ok) {
    return {
      state,
      events: [{
        type: 'PURCHASE_FAILED',
        reason: availability.reason,
        itemId,
        item: { id: item.id, name: item.name, price: item.price },
        shortfall: availability.shortfall,
      }],
      ok: false,
    }
  }

  /* Gems first: if the spend is refused the effect never runs, so an item can
     never be handed over for free. */
  const spend = currency.spendGems(state, item.price, `shop:${item.id}`, { itemId: item.id })
  if (!spend.ok) {
    return { state, events: spend.events, ok: false }
  }

  const effect = EFFECTS[item.type](spend.state, item, now)

  const settled = {
    ...effect.state,
    shop: {
      purchaseCount: effect.state.shop.purchaseCount + 1,
      itemsBought: {
        ...effect.state.shop.itemsBought,
        [item.id]: (effect.state.shop.itemsBought[item.id] ?? 0) + 1,
      },
      seenTxnIds: txnId
        ? [txnId, ...effect.state.shop.seenTxnIds].slice(0, TXN_HISTORY)
        : effect.state.shop.seenTxnIds,
    },
  }

  return {
    state: settled,
    events: [
      ...spend.events,
      ...effect.events,
      {
        type: 'PURCHASE_COMPLETE',
        itemId: item.id,
        name: item.name,
        price: item.price,
        balance: settled.gems,
      },
    ],
    ok: true,
  }
}

export default { purchaseItem, getAvailability, getOwnedCount, REASONS }
