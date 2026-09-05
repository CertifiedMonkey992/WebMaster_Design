/* ═══════════════════════════════════════════════════════════════════════════
   shopConfig.js — SHOP ECONOMY + INVENTORY
   ---------------------------------------------------------------------------
   Every price in LunX lives here, and the shop is a DATA LIST rather than a
   pile of hardcoded cards. Adding an item means appending an entry below and
   teaching shopService how to apply its `type` — no component changes.

   Prices are deliberately NOT duplicated in progressionConfig: the hearts
   popover, the shop and the reducer all read these same numbers, so a rebalance
   can never leave two screens disagreeing about what a refill costs.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Prices (gems) ───────────────────────────────────────────────────────── */
export const HEART_REFILL_COST  = 50
export const EXTRA_HEART_COST   = 20
export const STREAK_SHIELD_COST = 100

/* ── Streak shield rules ─────────────────────────────────────────────────── */
export const SHIELD = {
  /** How many shields a learner may stockpile. */
  MAX_OWNED: 3,
  /**
   * How many consecutive missed days a single shield can bridge.
   * 1 = "one missed day costs one shield"; a longer absence is a real break
   * and needs the streak to be rebuilt. Raising this is the ONLY change
   * needed to let shields cover longer gaps.
   */
  COVERS_MISSED_DAYS: 1,
  /**
   * When false, a second shield is never spent until the learner has actually
   * come back and logged activity. This is what stops a week-long absence from
   * silently draining the whole stock (see streakService.consumeShield).
   */
  ALLOW_CONSECUTIVE_USE: false,
}

/* ── Item types the shop knows how to apply ──────────────────────────────── */
export const ITEM_TYPES = {
  HEART_REFILL:  'HEART_REFILL',
  EXTRA_HEART:   'EXTRA_HEART',
  STREAK_SHIELD: 'STREAK_SHIELD',
}

/* ── Sections, purely for layout ─────────────────────────────────────────── */
export const SHOP_SECTIONS = [
  { id: 'hearts', title: 'Hearts',  blurb: 'Get back into a lesson without waiting out the timer.' },
  { id: 'streak', title: 'Streak',  blurb: 'Protect the days you have already earned.' },
]

/**
 * The catalogue.
 *
 *   id          stable key — used by the reducer and the ledger
 *   type        tells shopService which effect to apply
 *   price       gems
 *   art         which illustration ShopArt renders
 *   featured    given the wider, hero-sized card
 */
export const SHOP_ITEMS = [
  {
    id: 'heart_refill',
    section: 'hearts',
    type: ITEM_TYPES.HEART_REFILL,
    name: 'Refill Hearts',
    tagline: 'Back to full, instantly',
    description: 'Restore every heart so you can jump straight back into a lesson.',
    price: HEART_REFILL_COST,
    currency: 'gems',
    art: 'heartRefill',
    accent: 'heart',
    featured: true,
    cta: 'Refill',
  },
  {
    id: 'extra_heart',
    section: 'hearts',
    type: ITEM_TYPES.EXTRA_HEART,
    name: '+1 Heart',
    tagline: 'One more attempt',
    description: 'Add a single heart — enough for one more shot at a tricky question.',
    price: EXTRA_HEART_COST,
    currency: 'gems',
    art: 'singleHeart',
    accent: 'heart',
    cta: 'Buy',
  },
  {
    id: 'streak_shield',
    section: 'streak',
    type: ITEM_TYPES.STREAK_SHIELD,
    name: 'Streak Shield',
    tagline: 'Covers one missed day',
    description: 'Miss a day of learning and a shield is spent automatically to keep your streak alive.',
    price: STREAK_SHIELD_COST,
    currency: 'gems',
    art: 'streakShield',
    accent: 'streak',
    featured: true,
    cta: 'Buy',
    ownable: true,
  },
]

export function getShopItem(id) {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null
}

export function getItemsBySection(sectionId) {
  return SHOP_ITEMS.filter((item) => item.section === sectionId)
}

export default {
  HEART_REFILL_COST, EXTRA_HEART_COST, STREAK_SHIELD_COST,
  SHIELD, ITEM_TYPES, SHOP_SECTIONS, SHOP_ITEMS, getShopItem, getItemsBySection,
}
