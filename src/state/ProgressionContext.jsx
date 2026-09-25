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

import { load, save, peekUpdatedAt, clear, createDefaultState, sanitizeState, migrate, exportState, getProfileKey } from '../services/storageService'
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
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1') return true
  } catch { /* ignore */ }
  return Boolean(import.meta.env?.DEV)
}

/** How often the clock ticks (drives countdowns). */
const TICK_MS = 1000
/** How often time-based state is reconciled (hearts, rollovers). */
const RECONCILE_MS = 15000

let rewardSeq = 0

/** The UI's action creators over any dispatch — the learner's own, or a demo
 *  learner's (ProgressionDemo). */
function createActions(dispatch) {
  return {
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

    /* Coursework — the learner's own record; none of it pays. */
    savePart:       (lessonId, part) => dispatch(ACTIONS.SAVE_PART, { lessonId, part }),
    saveJournal:    (lessonId, entry) => dispatch(ACTIONS.SAVE_JOURNAL, { lessonId, entry }),
    recordScan:     (payload) => dispatch(ACTIONS.RECORD_SCAN, payload),

    /** The reviewer's controls. One call per operation, each a no-op on a
     *  profile without the powers (services/judgeService.js → OPS). */
    judge: (op, payload = {}) => dispatch(ACTIONS.JUDGE, { op, ...payload }),
  }
}

/**
 * `judge` says whether the profile being loaded is the reviewer's
 * (AuthContext → isJudge). It is asserted at boot in both directions: the
 * reviewer's profile is stocked and given its powers, and every other
 * profile has them stripped — so powers can never ride along inside an
 * imported file or a blob copied between profiles.
 */
export function ProgressionProvider({ judge = false, children }) {
  /* ── Load once, reconcile against the real clock ── */
  const bootRef = useRef(null)
  if (bootRef.current === null) {
    const loaded = load()
    const claimed = assertJudge(loaded.state, judge, loaded.isNew)
    const settled = reconcile(claimed, Date.now())
    bootRef.current = {
      state: settled.state,
      /* What reconciling the stored state did — a shield spent overnight, a
         streak lost — is shown once the toaster has mounted. */
      events: settled.events,
      isNew: loaded.isNew,
      recovered: loaded.recovered,
      savedAt: loaded.isNew ? 0 : loaded.state.updatedAt,
    }
  }

  const stateRef = useRef(bootRef.current.state)
  const [state, setState] = useState(bootRef.current.state)
  const [now, setNow] = useState(() => Date.now())
  const [rewards, setRewards] = useState([])

  /* The `updatedAt` this tab last wrote (or loaded). Storage holding a NEWER
     stamp means another tab has saved since, and this tab's state is stale:
     writing it would roll the learner back, so the write is refused and the
     newer state is adopted instead. */
  const savedAtRef = useRef(bootRef.current.savedAt)

  const persist = useCallback((next) => {
    if (peekUpdatedAt() > savedAtRef.current) return false
    const at = save(next)
    if (at) savedAtRef.current = at
    return at > 0
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

  /* Persist the reconciled boot state so a first-ever visit is durable
     immediately, without waiting for the learner to do anything — and report
     what the boot reconcile did. */
  useEffect(() => {
    persist(stateRef.current)
    /* Taken once: StrictMode mounts twice in dev, and the second pass must
       not show the same shield or streak toast again. */
    pushRewards(bootRef.current.events)
    bootRef.current.events = []
  }, [persist, pushRewards])

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
      persist(result.state)
    }
    pushRewards(result.events)
    return result.events
  }, [pushRewards, persist])

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

  /* Flush on unload so a mid-session close never loses progress. Goes
     through `persist`, so a tab that was left behind cannot overwrite what a
     newer tab has saved as it closes. */
  useEffect(() => {
    const flush = () => persist(stateRef.current)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [persist])

  /* Another tab saved: adopt its state rather than carry on from a stale
     copy. The `storage` event only fires in OTHER tabs, never the writer. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== getProfileKey() || e.storageArea !== window.localStorage) return
      if (peekUpdatedAt() <= savedAtRef.current) return
      const loaded = load()
      const settled = reconcile(loaded.state, Date.now())
      savedAtRef.current = loaded.state.updatedAt
      stateRef.current = settled.state
      setState(settled.state)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /* ── Action creators ── */
  const actions = useMemo(() => ({
    ...createActions(dispatch),

    /** The learner's progress as a JSON document they can keep. */
    exportProgress: () => exportState(stateRef.current),

    /** Replace the learner's progress with a previously exported document.
     *  The file goes through the same repair path as a stored blob, so a
     *  hand-edited or partly corrupt file becomes a valid state rather than a
     *  crash. Returns false when the text is not a progress document at all. */
    importProgress: (text) => {
      let parsed
      try { parsed = JSON.parse(text) } catch { return false }
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return false
      if (typeof parsed.version !== 'number' || typeof parsed.xp !== 'number') return false
      const settled = reconcile(sanitizeState(migrate(parsed), Date.now()), Date.now())
      stateRef.current = settled.state
      setState(settled.state)
      /* A restore is the learner's deliberate choice: it wins over whatever
         another tab last saved. */
      savedAtRef.current = Number.MAX_SAFE_INTEGER
      persist(settled.state)
      setRewards([])
      return true
    },

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
        persist(fresh)
        setRewards([])
      },
      raw: () => stateRef.current,
    },
  }), [dispatch, persist])

  /* ── Derived view model ───────────────────────────────────────────────────
     Rebuilt when state changes, or once every 30s so heart-recovery timings
     stay fresh without recomputing the whole model every single tick. */
  const slowNow = Math.floor(now / 30000)
  const vm = useMemo(() => buildViewModel(state, slowNow * 30000), [state, slowNow])

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
  setDailyGoal: NOOP, reconcileNow: NOOP, judge: NOOP,
  savePart: NOOP, saveJournal: NOOP, recordScan: NOOP,
  exportProgress: () => '', importProgress: () => false,
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

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO PROVIDER (MOTION_RULES.md revision 5 → demo learners)
   ---------------------------------------------------------------------------
   A showcase learner that can DO things. Same contexts, same components, same
   view model — but every action runs the real reducer against a state held
   in memory, and the learner keeps its own clock, which a scene can move on
   to tomorrow. That is how a product frame on the landing page demonstrates a
   quest being completed, a bonus day claimed or a streak kept, with the real
   engine deciding every number.

   Three guarantees:
     · nothing here calls save() or touches storage — the visitor's own
       progress is neither read nor written
     · each frame gets its own learner, so one scene cannot disturb another
     · reset() returns to the seed; in considered mode scenes call it only
       while off screen, and in continuous mode only after cueing the
       restart (sceneKit.js → useSceneLoop), so nobody watches a figure run
       backwards unannounced
   ═══════════════════════════════════════════════════════════════════════════ */

const DAY_MS = 86400000

export function ProgressionDemo({ seed, children }) {
  const seedRef = useRef(null)
  if (seedRef.current === null) seedRef.current = typeof seed === 'function' ? seed() : seed

  const stateRef = useRef(seedRef.current)
  const offsetRef = useRef(0)
  const [state, setState] = useState(seedRef.current)
  const [now, setNow] = useState(() => Date.now())

  const dispatch = useCallback((type, payload) => {
    const action = typeof type === 'string' ? { type, payload } : type
    const at = Date.now() + offsetRef.current
    const result = reduce(stateRef.current, action, at)
    if (result.state !== stateRef.current) {
      stateRef.current = result.state
      setState(result.state)
    }
    setNow(at)
    return result.events
  }, [])

  const demo = useMemo(() => ({
    /** Move the learner's clock to the same time tomorrow and let the engine
     *  reconcile, exactly as it would overnight. */
    nextDay: () => {
      offsetRef.current += DAY_MS
      return dispatch(ACTIONS.RECONCILE)
    },
    /** How many demo days have passed since the seed. */
    days: () => Math.round(offsetRef.current / DAY_MS),
    /** Back to the seed. Call only while the frame is off screen. */
    reset: () => {
      offsetRef.current = 0
      stateRef.current = seedRef.current
      setState(seedRef.current)
      setNow(Date.now())
    },
    raw: () => stateRef.current,
    now: () => Date.now() + offsetRef.current,
  }), [dispatch])

  const actions = useMemo(() => ({ ...createActions(dispatch), dev: NOOP_ACTIONS.dev }), [dispatch])

  const value = useMemo(() => ({
    state,
    vm: buildViewModel(state, now),
    dispatch,
    actions,
    isNewUser: false,
    recoveredFromCorruption: false,
    devMode: false,
    showcase: true,
    demo,
  }), [state, now, dispatch, actions, demo])

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

/**
 * Make the loaded state agree with who is signed in.
 *
 *   the reviewer   gets the powers, and on a first visit the stock that goes
 *                  with them (gems, hearts, shields)
 *   anyone else    has `judge` cleared, whatever the stored blob said
 *
 * A profile that already has the powers is not re-stocked, so a reviewer who
 * spent their hearts on purpose still finds them spent after a refresh.
 */
function assertJudge(state, isJudge, isNew) {
  if (!isJudge) return state.judge ? { ...state, judge: null } : state
  const fresh = isNew || !state.judge
  return reduce(state, {
    type: ACTIONS.JUDGE,
    payload: { op: 'enable', stock: fresh },
  }, Date.now()).state
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
