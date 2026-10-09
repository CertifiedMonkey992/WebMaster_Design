/* ═══════════════════════════════════════════════════════════════════════════
   judgeConfig.js — THE REVIEWER'S PROFILE
   ---------------------------------------------------------------------------
   LunX is a TSA Webmaster entry, and a judge has a few minutes to see a
   course that takes a few hours. This file defines the one profile that can
   skip the waiting: the numbers it starts with, the powers it holds, and the
   credentials printed on the sign-in page so a judge never has to guess.

   Everything here is data. The rules live in services/judgeService.js and
   the controls in components/judge/. Nothing in this file grants anything on
   its own — a profile has these powers only because accountService marked it
   `judge`, and only in this browser.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The credentials shown on the sign-in page. They are deliberately public:
   this is a demonstration account on the reader's own machine, holding no
   personal data and reaching no server.

   `hash` is the password run through the same PBKDF2 the sign-in form uses
   (services/accountService.js → hashSecret), computed once offline so the
   seeded account needs no work at start-up. Changing `password` means
   recomputing it:
     node -e "const c=require('crypto'),s=c.randomBytes(16);console.log(s.toString('base64'),c.pbkdf2Sync('NEW',s,600000,32,'sha256').toString('base64'))" */
export const JUDGE_LOGIN = {
  email: 'judge@lunx.app',
  password: 'tsa2027',
  username: 'TSA_Judge',
  hash: {
    iterations: 600000,
    salt: 'NVZN7ePRh94XauwE151kgg==',
    hash: 'JcPhOHu1t9cbHUu1LvG1R1kD/H3U+iYh58B8Ju50qTA=',
  },
}

/** Gems the reviewer's profile holds. Displayed as ∞ while topping up. */
export const JUDGE_GEMS = 999999
/** Below this, the profile is quietly topped back up to JUDGE_GEMS, so a
 *  reviewer can spend all afternoon and never meet a wall. */
export const JUDGE_GEM_FLOOR = 900000
/** Hearts. The brief asked for "around a hundred lives". */
export const JUDGE_HEARTS = 100
/** Streak shields the reviewer starts with, so the shop's third item and the
 *  streak rescue can both be exercised immediately. */
export const JUDGE_SHIELDS = 3

/** The powers, and what each one does. The console lists them in this order
 *  and reads its labels from here, so the two can never disagree. */
export const JUDGE_POWERS = [
  {
    id: 'infiniteGems',
    label: 'Unlimited gems',
    on: 'Gems top themselves up — the counter reads ∞',
    off: 'Gems behave normally, so you can watch the economy work',
  },
  {
    id: 'unlockAll',
    label: 'Every module open',
    on: 'Every module is unlocked, in any order',
    off: 'Modules unlock the way a learner earns them',
  },
  {
    id: 'chips',
    label: 'Controls in the margin',
    on: 'A small control sits beside every feature',
    off: 'The course looks exactly as a learner sees it',
  },
]

/**
 * The powers a new reviewer profile starts with.
 * @typedef {{ infiniteGems: boolean, unlockAll: boolean, chips: boolean }} Powers
 * @type {Powers}
 */
export const DEFAULT_POWERS = { infiniteGems: true, unlockAll: true, chips: true }

/** Every key a power object has, as a list the loop below can index with. */
const POWER_KEYS = /** @type {(keyof Powers)[]} */ (JUDGE_POWERS.map((p) => p.id))

/** A power object with every key present and boolean — whatever came in.
 *  @param {unknown} raw
 *  @returns {Powers} */
export function normalizePowers(raw) {
  const out = { ...DEFAULT_POWERS }
  if (raw && typeof raw === 'object') {
    const given = /** @type {Record<string, unknown>} */ (raw)
    for (const key of POWER_KEYS) {
      if (typeof given[key] === 'boolean') out[key] = given[key]
    }
  }
  return out
}

export default {
  JUDGE_LOGIN, JUDGE_GEMS, JUDGE_GEM_FLOOR, JUDGE_HEARTS, JUDGE_SHIELDS,
  JUDGE_POWERS, DEFAULT_POWERS, normalizePowers,
}
