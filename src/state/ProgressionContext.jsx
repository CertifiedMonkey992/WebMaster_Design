/* ═══════════════════════════════════════════════════════════════════════════
   ProgressionContext.jsx — THE REACT BINDING
   ---------------------------------------------------------------------------
   Thin by design. All the rules live in /services; this file only:

     • loads persisted state once and reconciles it against the real clock
     • routes every UI action through progressionService.reduce
     • persists after every change
     • re-reconciles on a timer, on tab focus and at midnight
     • fans reward events out to the animation layer

   State is held in a ref and mirrored into React state. That matters: two
   clicks fired inside a single React batch both reduce against the LATEST
   state, so a double-clicked "Claim" can never pay twice — and because the
   reduce happens in the event handler rather than inside a setState updater,
   StrictMode's double-invocation cannot duplicate a reward either.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'

import { load, save, clear, createDefaultState } from '../services/storageService'
import progression, { ACTIONS, reduce, reconcile, buildViewModel } from '../services/progressionService'
import { getLocalDateKey } from '../utils/dateUtils'

/* Split contexts: progression state changes rarely, the clock changes every
   second. Keeping them apart means a ticking countdown does not re-render the
   entire learning dashboard. */
const ProgressionContext = createContext(null)
const ClockContext = createContext(Date.now())
const RewardContext = createContext(null)

/** Developer tooling is enabled in dev builds, or via ?dev=1 on any build. */
export function isDevMode() {
  try {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev')) return true
  } catch { /* ignore */ }
  return Boolean(import.meta.env?.DEV)
}

/** How often the clock ticks (drives countdowns). */
const TICK_MS = 1000
/** How often time-based state is reconciled (hearts, rollovers). */
const RECONCILE_MS = 15000

let rewardSeq = 0

export function ProgressionProvider({ children }) {
  /* ── Load once, reconcile against the real clock ── */
  const bootRef = useRef(null)
  if (bootRef.current === null) {
    const loaded = load()
    const settled = reconcile(loaded.state, Date.now())
    bootRef.current = { state: settled.state, isNew: loaded.isNew, recovered: loaded.recovered }
  }

  const stateRef = useRef(bootRef.current.state)
  const [state, setState] = useState(bootRef.current.state)
  const [now, setNow] = useState(() => Date.now())
  const [rewards, setRewards] = useState([])

  /* Persist the reconciled boot state so a first-ever visit is durable
     immediately, without waiting for the learner to do anything. */
  useEffect(() => {
    save(stateRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pushRewards = useCallback((events) => {
    if (!events?.length) return
    const visible = events.filter(isVisibleReward)
    if (!visible.length) return
    setRewards((prev) => [
      ...prev,
      ...visible.map((event) => ({ ...event, key: `r${++rewardSeq}`, at: Date.now() })),
    ])
  }, [])

  const dismissReward = useCallback((key) => {
    setRewards((prev) => prev.filter((r) => r.key !== key))
  }, [])

  /**
   * The single entry point for the whole UI.
   * Returns the emitted events so a caller can react to, say, a refused claim.
   */
  const dispatch = useCallback((type, payload) => {
    const action = typeof type === 'string' ? { type, payload } : type
    const result = reduce(stateRef.current, action, Date.now())
    if (result.state !== stateRef.current) {
      stateRef.current = result.state
      setState(result.state)
      save(result.state)
    }
    pushRewards(result.events)
    return result.events
  }, [pushRewards])

  /* ── Clock ── */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  /* ── Time-based reconciliation ────────────────────────────────────────────
     Hearts regenerate, days roll over and streaks break while nobody is
     looking. Reconcile is idempotent and reference-stable, so running it
     often is free when nothing has actually changed. */
  useEffect(() => {
    const run = () => dispatch(ACTIONS.RECONCILE)

    const interval = setInterval(run, RECONCILE_MS)
    const onFocus = () => run()
    const onVisible = () => { if (!document.hidden) run() }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [dispatch])

  /* Midnight boundary: reconcile the moment the local calendar date changes,
     so daily quests reset without waiting for the next poll. */
  const dayKeyRef = useRef(getLocalDateKey())
  useEffect(() => {
    const today = getLocalDateKey(new Date(now))
    if (today !== dayKeyRef.current) {
      dayKeyRef.current = today
      dispatch(ACTIONS.RECONCILE)
    }
  }, [now, dispatch])

  /* Flush on unload so a mid-session close never loses progress. */
  useEffect(() => {
    const flush = () => save(stateRef.current)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  /* ── Action creators ── */
  const actions = useMemo(() => ({
    awardXP:        (amount, reason) => dispatch(ACTIONS.AWARD_XP, { amount, reason }),
    awardGems:      (amount, reason) => dispatch(ACTIONS.AWARD_GEMS, { amount, reason }),
    spendGems:      (amount, reason) => dispatch(ACTIONS.SPEND_GEMS, { amount, reason }),

    loseHeart:      (reason) => dispatch(ACTIONS.LOSE_HEART, { reason }),
    restoreHeart:   (count, reason) => dispatch(ACTIONS.RESTORE_HEART, { count, reason }),
    restoreAllHearts: (reason) => dispatch(ACTIONS.RESTORE_ALL_HEARTS, { reason }),
    refillHeartsWithGems: () => dispatch(ACTIONS.REFILL_HEARTS_GEMS),

    recordAnswer:   (payload) => dispatch(ACTIONS.RECORD_ANSWER, payload),
    completeLesson: (payload) => dispatch(ACTIONS.COMPLETE_LESSON, payload),
    completePractice: (payload) => dispatch(ACTIONS.COMPLETE_PRACTICE, payload),
    addPracticeTime: (seconds) => dispatch(ACTIONS.ADD_PRACTICE_TIME, { seconds }),

    /** Buy a shop item. `txnId` is minted per confirmation dialog, so replaying
     *  the same purchase is refused rather than charged twice. */
    purchaseItem:   (itemId, txnId) => dispatch(ACTIONS.PURCHASE_ITEM, { itemId, txnId }),

    /** Claim today's daily bonus. Safe to call twice — the second call is
     *  refused by the stored claim date rather than paying again. */
    claimDailyBonus: () => dispatch(ACTIONS.CLAIM_DAILY_BONUS),

    claimQuest:     (questId) => dispatch(ACTIONS.CLAIM_QUEST, { questId }),
    claimAllQuests: () => dispatch(ACTIONS.CLAIM_ALL_QUESTS),
    claimTeamReward: () => dispatch(ACTIONS.CLAIM_TEAM_REWARD),
    rerollTeamMission: () => dispatch(ACTIONS.REROLL_TEAM_MISSION),

    setDailyGoal:   (dailyXP) => dispatch(ACTIONS.SET_DAILY_GOAL, { dailyXP }),
    reconcileNow:   () => dispatch(ACTIONS.RECONCILE),

    /* ── Developer-only helpers ── */
    dev: {
      set: (patch) => dispatch(ACTIONS.DEV_SET, patch),
      resetDailyQuests: () => dispatch(ACTIONS.DEV_RESET_DAILY),
      resetWeeklyQuests: () => dispatch(ACTIONS.DEV_RESET_WEEKLY),
      setBonusDay: (day) => dispatch(ACTIONS.DEV_SET_BONUS_DAY, { day }),
      resetDailyBonus: () => dispatch(ACTIONS.DEV_RESET_BONUS),
      /** Claim every remaining day of the current track in one go. Each pass
       *  clears the claim anchor first, which is exactly what a new calendar
       *  day would do — so this exercises the real claim path seven times. */
      completeBonusCycle: () => {
        for (let i = 0; i < 8; i++) {
          const bonus = stateRef.current.dailyBonus
          dispatch(ACTIONS.DEV_SET_BONUS_DAY, { day: bonus.cycleDay })
          const events = dispatch(ACTIONS.CLAIM_DAILY_BONUS)
          if (events.some((e) => e.type === 'DAILY_CYCLE_COMPLETE')) break
        }
      },
      /** Rewind stored dates by N days to simulate time passing. */
      shiftDays: (days) => {
        const s = stateRef.current
        const shift = (key) => shiftDateKey(key, -days)
        /* Weekly keys must stay week-aligned, so they only move in whole
           weeks — advancing a single day must not reset weekly quests. */
        const weekShift = Math.floor(days / 7) * 7
        const shiftWeek = (key) => shiftDateKey(key, -weekShift)
        const history = {}
        for (const [key, value] of Object.entries(s.streak.history ?? {})) {
          const moved = shift(key)
          if (moved) history[moved] = value
        }
        /* Rewinding every stored date key by N days is equivalent to jumping
           the clock forward N days: the next reconcile then sees a new
           calendar day, resets the daily buckets and rolls fresh quests. */
        dispatch(ACTIONS.DEV_SET, {
          streak: {
            ...s.streak,
            lastActivityDate: shift(s.streak.lastActivityDate),
            lastStreakDate: shift(s.streak.lastStreakDate),
            lastShieldDate: shift(s.streak.lastShieldDate),
            history,
          },
          daily: { ...s.daily, dateKey: shift(s.daily.dateKey) },
          weekly: { ...s.weekly, weekKey: shiftWeek(s.weekly.weekKey) },
          dailyBonus: {
            ...s.dailyBonus,
            lastClaimDate: shift(s.dailyBonus.lastClaimDate),
            cycleStartDate: shift(s.dailyBonus.cycleStartDate),
          },
          quests: {
            ...s.quests,
            dailyKey: shift(s.quests.dailyKey),
            weeklyKey: shiftWeek(s.quests.weeklyKey),
          },
          heartAnchor: Number.isFinite(s.heartAnchor)
            ? s.heartAnchor - days * 86400000
            : s.heartAnchor,
        })
        dispatch(ACTIONS.RECONCILE)
      },
      reset: () => {
        clear()
        const fresh = reconcile(createDefaultState(), Date.now()).state
        stateRef.current = fresh
        setState(fresh)
        save(fresh)
        setRewards([])
      },
      raw: () => stateRef.current,
    },
  }), [dispatch])

  /* ── Derived view model ───────────────────────────────────────────────────
     Rebuilt when state changes, or once every 30s so heart-recovery timings
     stay fresh without recomputing the whole model every single tick. */
  const slowNow = Math.floor(now / 30000)
  const vm = useMemo(
    () => buildViewModel(state, Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, slowNow],
  )

  const value = useMemo(() => ({
    state, vm, dispatch, actions,
    isNewUser: bootRef.current.isNew,
    recoveredFromCorruption: bootRef.current.recovered,
    devMode: isDevMode(),
  }), [state, vm, dispatch, actions])

  const rewardValue = useMemo(() => ({ rewards, dismissReward, pushRewards }), [rewards, dismissReward, pushRewards])

  return (
    <ProgressionContext.Provider value={value}>
      <RewardContext.Provider value={rewardValue}>
        <ClockContext.Provider value={now}>
          {children}
        </ClockContext.Provider>
      </RewardContext.Provider>
    </ProgressionContext.Provider>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOWCASE PROVIDER
   ---------------------------------------------------------------------------
   Serves the same three contexts from a FIXED state, so the real dashboard
   components can be mounted outside the app — on the marketing page — without
   a second set of presentational copies to keep in sync.

   What renders inside is genuinely the product: the same components, reading
   the same view model, built by the same services. Only two things differ —
   the state is a seeded demo learner instead of the visitor's own, and every
   action is a no-op, because a landing page must never write to progression.
   ═══════════════════════════════════════════════════════════════════════════ */

const NOOP = () => []
const NOOP_ACTIONS = {
  awardXP: NOOP, awardGems: NOOP, spendGems: NOOP,
  loseHeart: NOOP, restoreHeart: NOOP, restoreAllHearts: NOOP, refillHeartsWithGems: NOOP,
  recordAnswer: NOOP, completeLesson: NOOP, completePractice: NOOP, addPracticeTime: NOOP,
  purchaseItem: NOOP, claimDailyBonus: NOOP,
  claimQuest: NOOP, claimAllQuests: NOOP, claimTeamReward: NOOP, rerollTeamMission: NOOP,
  setDailyGoal: NOOP, reconcileNow: NOOP,
  dev: { set: NOOP, resetDailyQuests: NOOP, resetWeeklyQuests: NOOP, setBonusDay: NOOP,
         resetDailyBonus: NOOP, completeBonusCycle: NOOP, shiftDays: NOOP, reset: NOOP, raw: () => null },
}
const NOOP_REWARDS = { rewards: [], dismissReward: NOOP, pushRewards: NOOP }

export function ProgressionShowcase({ state, children }) {
  /* One timestamp for the whole subtree: a marketing panel has no countdown
     worth ticking, and a frozen clock keeps the section from re-rendering. */
  const [now] = useState(() => Date.now())

  const value = useMemo(() => ({
    state,
    vm: buildViewModel(state, now),
    dispatch: NOOP,
    actions: NOOP_ACTIONS,
    isNewUser: false,
    recoveredFromCorruption: false,
    devMode: false,
    /* Lets a component opt out of interactive affordances if it ever needs to. */
    showcase: true,
  }), [state, now])

  return (
    <ProgressionContext.Provider value={value}>
      <RewardContext.Provider value={NOOP_REWARDS}>
        <ClockContext.Provider value={now}>
          {children}
        </ClockContext.Provider>
      </RewardContext.Provider>
    </ProgressionContext.Provider>
  )
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */

export function useProgression() {
  const ctx = useContext(ProgressionContext)
  if (!ctx) throw new Error('useProgression must be used inside <ProgressionProvider>')
  return ctx
}

/** Live millisecond clock. Use ONLY in components that show a countdown. */
export function useClock() {
  return useContext(ClockContext)
}

export function useRewards() {
  const ctx = useContext(RewardContext)
  if (!ctx) throw new Error('useRewards must be used inside <ProgressionProvider>')
  return ctx
}

/** Convenience: the derived course map (lesson + section statuses). */
export function useCourse() {
  return useProgression().vm.course
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Events worth animating. Bookkeeping events stay silent. */
const VISIBLE = new Set([
  'XP_AWARDED', 'GEMS_AWARDED', 'GEMS_SPENT', 'GEMS_INSUFFICIENT',
  'LEVEL_UP', 'QUEST_COMPLETED', 'QUEST_CLAIMED', 'ACHIEVEMENT_UNLOCKED',
  'STREAK_UPDATED', 'STREAK_MILESTONE', 'STREAK_LOST', 'HEART_LOST',
  'HEARTS_EMPTY', 'HEARTS_RESTORED', 'SECTION_COMPLETE', 'PERFECT_LESSON',
  'DAILY_GOAL_MET', 'TEAM_MISSION_COMPLETE', 'TEAM_MISSION_CLAIMED',
  'PURCHASE_COMPLETE', 'STREAK_SHIELD_USED', 'DAILY_CYCLE_COMPLETE',
])

function isVisibleReward(event) {
  return VISIBLE.has(event.type)
}

function shiftDateKey(key, days) {
  if (typeof key !== 'string') return key
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return key
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  d.setDate(d.getDate() + days)
  return getLocalDateKey(d)
}

export { ACTIONS, progression }
