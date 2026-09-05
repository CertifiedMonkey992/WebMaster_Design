/* ═══════════════════════════════════════════════════════════════════════════
   progressionTests.js — SELF-CHECK SUITE FOR THE PROGRESSION ENGINE
   ---------------------------------------------------------------------------
   Pure-function tests over the real services: no React, no DOM, no mocks.
   Every scenario drives the same reducer the app uses, with an injected
   "now" timestamp so calendar rollovers, streak gaps and heart recovery can
   be tested deterministically instead of waiting for real time to pass.

   Run it from the browser console on the Learn page:

       const t = await import('/src/dev/progressionTests.js')
       console.table((await t.runProgressionTests()).results)

   or press "Run self-tests" in the developer panel (dev builds / ?dev=1).
   ═══════════════════════════════════════════════════════════════════════════ */

import * as prog from '../services/progressionService'
import * as store from '../services/storageService'
import * as quests from '../services/questService'
import * as currency from '../services/currencyService'
import * as learn from '../data/learnData'
import * as cfg from '../config/progressionConfig'
import * as shop from '../config/shopConfig'
import * as shopSvc from '../services/shopService'
import * as bonusSvc from '../services/dailyBonusService'
import * as dbCfg from '../config/dailyBonusConfig'
import * as putils from '../utils/progressionUtils'
import { getLocalDateKey } from '../utils/dateUtils'

/** The local date key for an injected timestamp — used all over the bonus tests. */
const putils_today = (t) => getLocalDateKey(new Date(t))

export async function runProgressionTests() {

  const results = []
  const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail ?? '' })

  const DAY = 86400000
  const noon = new Date(); noon.setHours(12, 0, 0, 0)
  const T0 = noon.getTime()

  const fresh = (t = T0) => prog.reconcile(store.createDefaultState(t), t).state
  const run = (s, type, payload, t) => prog.reduce(s, { type, payload }, t)
  const A = prog.ACTIONS

  /* ── TEST 1: new user defaults ── */
  {
    const s = fresh()
    ok('T1 new user xp=0', s.xp === 0, s.xp)
    ok('T1 new user gems=100', s.gems === 100, s.gems)
    ok('T1 new user hearts=5', s.hearts === 5, s.hearts)
    ok('T1 new user streak=0', s.streak.current === 0, s.streak.current)
    ok('T1 new user level=1', s.level === 1, s.level)
    ok('T1 daily quests generated', s.quests.daily.length === cfg.QUESTS.DAILY_COUNT, s.quests.daily.length)
    ok('T1 weekly quests generated', s.quests.weekly.length > 0, s.quests.weekly.length)
    ok('T1 team mission exists', !!s.team, s.team?.missionKey)
    ok('T1 no impossible streak quest',
      s.quests.weekly.every(q => q.type !== 'REACH_STREAK' || q.target <= 7),
      JSON.stringify(s.quests.weekly.filter(q => q.type === 'REACH_STREAK').map(q => q.target)))
    ok('T1 no lesson quest above remaining',
      [...s.quests.daily, ...s.quests.weekly].every(q => q.type !== 'COMPLETE_LESSONS' || q.target <= 22))
  }

  /* ── TEST 2: first lesson completion drives everything ── */
  {
    let s = fresh()
    const r = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', perfect: true, seconds: 180, accuracy: 1 }, T0)
    s = r.state
    const expectXP = cfg.XP.LESSON + cfg.XP.PERFECT_BONUS
    ok('T2 xp includes lesson+perfect', s.xp >= expectXP, s.xp)
    ok('T2 daily xp tracked', s.daily.xp === s.xp, `${s.daily.xp} vs ${s.xp}`)
    ok('T2 weekly xp tracked', s.weekly.xp === s.xp)
    ok('T2 lesson counted once', s.daily.lessons === 1, s.daily.lessons)
    ok('T2 streak = 1', s.streak.current === 1, s.streak.current)
    ok('T2 perfect gems awarded', s.gems > 100, s.gems)
    ok('T2 stats updated', s.stats.totalLessonsCompleted === 1 && s.stats.totalPerfectLessons === 1)
    ok('T2 practice seconds recorded', s.daily.practiceSeconds === 180, s.daily.practiceSeconds)
    ok('T2 course derives completed', learn.deriveCourse(s.lessons).completedCount === 1)
    ok('T2 next lesson advanced', learn.deriveCourse(s.lessons).current.lesson.id === 'types-of-ai',
       learn.deriveCourse(s.lessons).current.lesson.id)
    ok('T2 emitted LESSON_COMPLETE', r.events.some(e => e.type === 'LESSON_COMPLETE'))
    ok('T2 emitted XP_AWARDED', r.events.some(e => e.type === 'XP_AWARDED'))
    ok('T2 achievement first-steps unlocked', !!s.achievements['first-steps'])
  }

  /* ── TEST 3: repeat lesson pays no completion XP ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', perfect: false, seconds: 60, accuracy: 1 }, T0).state
    const xpAfterFirst = s.xp
    const gemsAfterFirst = s.gems
    const lessonsAfterFirst = s.daily.lessons
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', perfect: true, seconds: 60, accuracy: 1 }, T0 + 1000).state
    ok('T3 no duplicate XP', s.xp === xpAfterFirst, `${xpAfterFirst} -> ${s.xp}`)
    ok('T3 no duplicate gems', s.gems === gemsAfterFirst, `${gemsAfterFirst} -> ${s.gems}`)
    ok('T3 lesson count unchanged', s.daily.lessons === lessonsAfterFirst, s.daily.lessons)
    ok('T3 replay counts as practice', s.daily.practiceSessions === 1, s.daily.practiceSessions)
    ok('T3 unique lessons still 1', s.stats.totalLessonsCompleted === 1)
    ok('T3 attempts incremented', s.lessons['what-is-ai'].attempts === 2)
  }

  /* ── TEST 3b: answer XP budget cannot be farmed ── */
  {
    let s = fresh()
    const budget = 3 * cfg.XP.CORRECT_ANSWER
    for (let i = 0; i < 10; i++) {
      s = run(s, A.RECORD_ANSWER, { lessonId: 'what-is-ai', correct: true, maxAnswerXP: budget }, T0).state
    }
    ok('T3b answer XP capped at budget', s.xp === budget, `${s.xp} vs ${budget}`)
  }

  /* ── TEST 4 + 5: quest completion, claim, and double-claim guard ── */
  {
    let s = fresh()
    // Force an XP quest we can satisfy
    const xpQuest = s.quests.daily.find(q => q.type === 'EARN_XP')
    ok('T4 xp quest exists', !!xpQuest, s.quests.daily.map(q => q.type).join())
    if (xpQuest) {
      s = run(s, A.AWARD_XP, { amount: xpQuest.target, reason: 'test' }, T0).state
      const q = quests.findQuest(s, xpQuest.id)
      ok('T4 quest completed', q.completed, `${q.progress}/${q.target}`)
      ok('T4 not auto-claimed', !q.claimed)

      const gemsBefore = s.gems
      const r1 = run(s, A.CLAIM_QUEST, { questId: xpQuest.id }, T0)
      s = r1.state
      ok('T4 gems increased by exact reward', s.gems === gemsBefore + q.reward.gems,
         `${gemsBefore} + ${q.reward.gems} -> ${s.gems}`)
      ok('T4 quest marked claimed', quests.findQuest(s, xpQuest.id).claimed)

      const gemsAfterClaim = s.gems
      const r2 = run(s, A.CLAIM_QUEST, { questId: xpQuest.id }, T0)
      s = r2.state
      ok('T5 second claim pays nothing', s.gems === gemsAfterClaim, `${gemsAfterClaim} -> ${s.gems}`)
      ok('T5 second claim emits no gem event', !r2.events.some(e => e.type === 'GEMS_AWARDED'))
    }
  }

  /* ── TEST 6: two activities on the same calendar day ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', seconds: 30 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'types-of-ai', seconds: 30 }, T0 + 3600000).state
    ok('T6 streak stays 1 on same day', s.streak.current === 1, s.streak.current)
    ok('T6 both lessons counted', s.daily.lessons === 2, s.daily.lessons)
  }

  /* ── TEST 7: consecutive days ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', seconds: 30 }, T0).state
    s = prog.reconcile(s, T0 + DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'types-of-ai', seconds: 30 }, T0 + DAY).state
    ok('T7 day2 streak = 2', s.streak.current === 2, s.streak.current)
    s = prog.reconcile(s, T0 + 2 * DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'how-ai-learns', seconds: 30 }, T0 + 2 * DAY).state
    ok('T7 day3 streak = 3', s.streak.current === 3, s.streak.current)
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'ai-everyday', seconds: 30 }, T0 + 2 * DAY + 7200000).state
    ok('T7 same-day second lesson keeps streak 3', s.streak.current === 3, s.streak.current)
    ok('T7 longest recorded', s.streak.longest === 3, s.streak.longest)
    ok('T7 section completed bonus', s.stats.totalSectionsCompleted === 1, s.stats.totalSectionsCompleted)
  }

  /* ── TEST 8: skipping a day resets the streak ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', seconds: 30 }, T0).state
    s = prog.reconcile(s, T0 + DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'types-of-ai', seconds: 30 }, T0 + DAY).state
    ok('T8 streak 2 before gap', s.streak.current === 2)
    // Skip T0+2D entirely, return on T0+3D
    const afterGap = prog.reconcile(s, T0 + 3 * DAY).state
    ok('T8 streak shows broken on return', afterGap.streak.current === 0, afterGap.streak.current)
    const resumed = run(afterGap, A.COMPLETE_LESSON, { lessonId: 'how-ai-learns', seconds: 30 }, T0 + 3 * DAY).state
    ok('T8 next activity resets to 1', resumed.streak.current === 1, resumed.streak.current)
    ok('T8 longest preserved', resumed.streak.longest === 2, resumed.streak.longest)
    ok('T8 total XP preserved', resumed.xp >= 50, resumed.xp)
  }

  /* ── TEST 9: persistence round-trip ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', perfect: true, seconds: 90 }, T0).state
    s = run(s, A.AWARD_GEMS, { amount: 77, reason: 'test' }, T0).state
    const json = JSON.stringify(s)
    const restored = store.sanitizeState(JSON.parse(json), T0)
    ok('T9 xp persisted', restored.xp === s.xp)
    ok('T9 gems persisted', restored.gems === s.gems)
    ok('T9 hearts persisted', restored.hearts === s.hearts)
    ok('T9 streak persisted', restored.streak.current === s.streak.current)
    ok('T9 lessons persisted', Object.keys(restored.lessons).length === Object.keys(s.lessons).length)
    ok('T9 quests persisted', restored.quests.daily.length === s.quests.daily.length)
    ok('T9 achievements persisted', Object.keys(restored.achievements).length === Object.keys(s.achievements).length)
    ok('T9 answerXP persisted', JSON.stringify(restored.answerXP) === JSON.stringify(s.answerXP))

    // corrupted data falls back cleanly
    const junk = store.sanitizeState('not an object', T0)
    ok('T9 corrupt data -> defaults', junk.gems === 100 && junk.hearts === 5)
    const partial = store.sanitizeState({ xp: 'abc', gems: -50, hearts: 99, streak: null }, T0)
    ok('T9 bad types repaired', partial.xp === 0 && partial.gems === 0 && partial.hearts === partial.maxHearts,
       `${partial.xp}/${partial.gems}/${partial.hearts}`)
  }

  /* ── TEST 10: next-day rollover ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'what-is-ai', perfect: true, seconds: 60 }, T0).state
    const xpBefore = s.xp, gemsBefore = s.gems, streakBefore = s.streak.current
    const dailyIdsBefore = s.quests.daily.map(q => q.id).join()
    const next = prog.reconcile(s, T0 + DAY).state
    ok('T10 daily xp reset', next.daily.xp === 0, next.daily.xp)
    ok('T10 daily lessons reset', next.daily.lessons === 0)
    ok('T10 total xp preserved', next.xp === xpBefore, `${xpBefore} -> ${next.xp}`)
    ok('T10 gems preserved', next.gems === gemsBefore)
    ok('T10 streak preserved (yesterday active)', next.streak.current === streakBefore, next.streak.current)
    ok('T10 new daily quests', next.quests.daily.map(q => q.id).join() !== dailyIdsBefore)
    ok('T10 old quests archived', next.quests.archive.length === 1, next.quests.archive.length)
    ok('T10 completed lessons preserved', Object.keys(next.lessons).length === 1)
    ok('T10 lifetime stats preserved', next.stats.totalLessonsCompleted === 1)
    // same day = stable quests
    const again = prog.reconcile(prog.reconcile(s, T0).state, T0).state
    ok('T10 same-day quests stable', again.quests.daily.map(q => q.id).join() === dailyIdsBefore)
  }

  /* ── TEST 11: heart recovery while the page is closed ── */
  {
    let s = fresh()
    s = run(s, A.LOSE_HEART, { reason: 'test' }, T0).state
    s = run(s, A.LOSE_HEART, { reason: 'test' }, T0 + 1000).state
    ok('T11 two hearts lost', s.hearts === 3, s.hearts)
    const MIN = 60000
    const halfway = prog.reconcile(s, T0 + 15 * MIN).state
    ok('T11 nothing yet at 15 min', halfway.hearts === 3, halfway.hearts)
    const oneCycle = prog.reconcile(s, T0 + 31 * MIN).state
    ok('T11 one heart back at 31 min', oneCycle.hearts === 4, oneCycle.hearts)
    const twoCycles = prog.reconcile(s, T0 + 61 * MIN).state
    ok('T11 two hearts back at 61 min', twoCycles.hearts === 5, twoCycles.hearts)
    const wayLater = prog.reconcile(s, T0 + 10 * 3600000).state
    ok('T11 caps at max', wayLater.hearts === 5 && wayLater.heartAnchor === null, wayLater.hearts)
    const timing = currency.getHeartRecoveryTime(s, T0 + 10 * MIN)
    ok('T11 countdown derived from anchor', Math.round(timing.msUntilNext / MIN) === 20, timing.msUntilNext / MIN)
    ok('T11 full-recovery estimate', Math.round(timing.msUntilFull / MIN) === 50, timing.msUntilFull / MIN)
  }

  /* ── TEST 12: zero hearts blocks lessons but not practice ── */
  {
    let s = fresh()
    for (let i = 0; i < 5; i++) s = run(s, A.LOSE_HEART, { reason: 'test' }, T0 + i).state
    ok('T12 hearts at 0', s.hearts === 0, s.hearts)
    ok('T12 canStartLesson false', currency.canStartLesson(s, T0) === false)
    const vm = prog.buildViewModel(s, T0)
    ok('T12 vm blocks lesson', vm.canStartLesson === false)
    ok('T12 recovery info present', vm.heartRecovery.msUntilNext > 0)
    const sixth = run(s, A.LOSE_HEART, { reason: 'test' }, T0 + 10)
    ok('T12 cannot go negative', sixth.state.hearts === 0, sixth.state.hearts)
    const practiced = run(s, A.COMPLETE_PRACTICE, { seconds: 120, correct: 4, total: 5 }, T0)
    ok('T12 practice still works at 0 hearts', practiced.state.xp === cfg.XP.PRACTICE, practiced.state.xp)
    ok('T12 practice sets streak', practiced.state.streak.current === 1)
  }

  /* ── TEST 13: level curve + one-time level bonus ── */
  {
    ok('T13 curve L1', putils.getXPForLevel(1) === 0)
    ok('T13 curve L2', putils.getXPForLevel(2) === 100, putils.getXPForLevel(2))
    ok('T13 curve L3', putils.getXPForLevel(3) === 250, putils.getXPForLevel(3))
    ok('T13 curve L4', putils.getXPForLevel(4) === 450, putils.getXPForLevel(4))
    ok('T13 curve L5', putils.getXPForLevel(5) === 700, putils.getXPForLevel(5))
    ok('T13 inverse 99xp -> L1', putils.getLevelFromXP(99) === 1)
    ok('T13 inverse 100xp -> L2', putils.getLevelFromXP(100) === 2)
    ok('T13 inverse 249xp -> L2', putils.getLevelFromXP(249) === 2)
    ok('T13 inverse 700xp -> L5', putils.getLevelFromXP(700) === 5)
    let mono = true
    for (let l = 1; l < 40; l++) {
      const floor = putils.getXPForLevel(l)
      if (putils.getLevelFromXP(floor) !== l) mono = false
      if (putils.getLevelFromXP(floor - 1) !== Math.max(1, l - 1)) mono = false
    }
    ok('T13 curve/inverse agree for L1..40', mono)

    let s = fresh()
    const gems0 = s.gems
    const r = run(s, A.AWARD_XP, { amount: 100, reason: 'test' }, T0)
    s = r.state
    ok('T13 level becomes 2', s.level === 2, s.level)
    ok('T13 LEVEL_UP emitted once', r.events.filter(e => e.type === 'LEVEL_UP').length === 1)
    const gemsAfterLevel = s.gems
    ok('T13 level bonus paid', gemsAfterLevel > gems0, `${gems0} -> ${gemsAfterLevel}`)
    // Re-running the pipeline must not pay again
    const again = prog.runPipeline(s, T0).state
    ok('T13 bonus not repaid on pipeline rerun', again.gems === gemsAfterLevel, `${gemsAfterLevel} -> ${again.gems}`)
    const reconciled = prog.reconcile(s, T0).state
    ok('T13 bonus not repaid on reconcile', reconciled.gems === gemsAfterLevel)
    // Multi-level jump pays once per level, not once per award
    let big = fresh()
    const rb = run(big, A.AWARD_XP, { amount: 700, reason: 'test' }, T0)
    ok('T13 jump to level 5', rb.state.level === 5, rb.state.level)
    ok('T13 4 level-ups worth of gems',
       rb.state.gems >= 100 + 4 * cfg.CURRENCY.LEVEL_UP_GEMS, rb.state.gems)
    ok('T13 levelRewardedUpTo synced', rb.state.levelRewardedUpTo === 5)
    /* The 700 XP award also crosses the daily goal, which pays its own bonus —
       so assert the relationship, not a hardcoded total. */
    const p = putils.getXPProgress(rb.state.xp)
    ok('T13 progress math',
      p.level === 5 &&
      p.levelFloorXP === 700 &&
      p.levelCeilXP === 1000 &&
      p.xpIntoLevel === rb.state.xp - 700 &&
      p.xpUntilNextLevel === 1000 - rb.state.xp,
      JSON.stringify(p))
    ok('T13 daily goal bonus applied once',
      rb.state.daily.goalAwarded === true && rb.state.xp === 700 + cfg.XP.DAILY_GOAL_BONUS,
      rb.state.xp)
  }

  /* ── TEST 14: gems never go negative ── */
  {
    let s = fresh()
    const r = run(s, A.SPEND_GEMS, { amount: 500, reason: 'test' }, T0)
    ok('T14 overspend refused', r.state.gems === 100, r.state.gems)
    ok('T14 insufficient event', r.events.some(e => e.type === 'GEMS_INSUFFICIENT'))
    const r2 = run(s, A.SPEND_GEMS, { amount: 40, reason: 'test' }, T0)
    ok('T14 valid spend works', r2.state.gems === 60, r2.state.gems)
    const r3 = run(s, A.AWARD_GEMS, { amount: -50, reason: 'test' }, T0)
    ok('T14 negative award ignored', r3.state.gems === 100, r3.state.gems)
  }

  /* ── TEST 15: weekly rollover keeps totals ── */
  {
    let s = fresh()
    s = run(s, A.AWARD_XP, { amount: 60, reason: 'test' }, T0).state
    const weekKeyBefore = s.weekly.weekKey
    const later = prog.reconcile(s, T0 + 8 * DAY).state
    ok('T15 weekly bucket reset', later.weekly.xp === 0, later.weekly.xp)
    ok('T15 weekly key changed', later.weekly.weekKey !== weekKeyBefore)
    ok('T15 total xp intact', later.xp === s.xp)
    ok('T15 new weekly quests', later.quests.weekly.length > 0)
  }

  /* ── TEST 16: quest progress is derived, never double-counted ── */
  {
    let s = fresh()
    const q = s.quests.daily.find(x => x.type === 'EARN_XP')
    if (q) {
      s = run(s, A.AWARD_XP, { amount: 10, reason: 'test' }, T0).state
      const after1 = quests.findQuest(s, q.id).progress
      // Re-running evaluation many times must not move the bar
      let t = s
      for (let i = 0; i < 5; i++) t = prog.runPipeline(t, T0).state
      ok('T16 repeated evaluation is stable', quests.findQuest(t, q.id).progress === after1,
         `${after1} -> ${quests.findQuest(t, q.id).progress}`)
    }
    ok('T16 evaluation is reference-stable',
       prog.reconcile(s, T0).state === s, 'reconcile returned a new object when nothing changed')
  }

  /* ── TEST 17: claim-all is idempotent ── */
  {
    let s = fresh()
    s = run(s, A.AWARD_XP, { amount: 400, reason: 'test' }, T0).state
    s = prog.runPipeline(s, T0).state
    const claimable = quests.getClaimableQuests(s).length
    const r1 = run(s, A.CLAIM_ALL_QUESTS, {}, T0)
    const gemsAfter = r1.state.gems
    const r2 = run(r1.state, A.CLAIM_ALL_QUESTS, {}, T0)
    ok('T17 something was claimable', claimable > 0, claimable)
    ok('T17 second claim-all is a no-op', r2.state.gems === gemsAfter, `${gemsAfter} -> ${r2.state.gems}`)
  }

  /* ── TEST 18: shop — heart refill ── */
  {
    const base = fresh()
    /* Hurt the learner three times so a refill has something to restore. */
    let s = { ...base, hearts: 2, heartAnchor: T0, gems: 200 }

    const r = run(s, A.PURCHASE_ITEM, { itemId: 'heart_refill', txnId: 'a1' }, T0)
    ok('T18 refill restores to max', r.state.hearts === r.state.maxHearts, r.state.hearts)
    ok('T18 refill charges exactly the price',
      r.state.gems === 200 - shop.HEART_REFILL_COST, r.state.gems)
    ok('T18 refill clears the regen anchor', r.state.heartAnchor === null, r.state.heartAnchor)
    ok('T18 refill emits completion', r.events.some(e => e.type === 'PURCHASE_COMPLETE'))

    /* Already full → refused, and NOT charged. */
    const full = run(r.state, A.PURCHASE_ITEM, { itemId: 'heart_refill', txnId: 'a2' }, T0)
    ok('T18 refill refused when full',
      full.events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === shopSvc.REASONS.HEARTS_FULL))
    ok('T18 refill when full costs nothing', full.state.gems === r.state.gems, full.state.gems)

    /* Cannot afford → refused, and NOT applied. */
    const poor = run({ ...base, hearts: 1, heartAnchor: T0, gems: 10 },
      A.PURCHASE_ITEM, { itemId: 'heart_refill', txnId: 'a3' }, T0)
    ok('T18 refill refused when broke',
      poor.events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === shopSvc.REASONS.INSUFFICIENT_GEMS))
    ok('T18 broke refill leaves hearts alone', poor.state.hearts === 1, poor.state.hearts)
    ok('T18 broke refill leaves gems alone', poor.state.gems === 10, poor.state.gems)
  }

  /* ── TEST 19: shop — +1 heart ── */
  {
    const base = fresh()
    let s = { ...base, hearts: 3, heartAnchor: T0, gems: 100 }

    const r = run(s, A.PURCHASE_ITEM, { itemId: 'extra_heart', txnId: 'b1' }, T0)
    ok('T19 +1 heart adds exactly one', r.state.hearts === 4, r.state.hearts)
    ok('T19 +1 heart charges the price',
      r.state.gems === 100 - shop.EXTRA_HEART_COST, r.state.gems)

    /* Buying up to the cap is fine; buying past it is refused. */
    const r2 = run(r.state, A.PURCHASE_ITEM, { itemId: 'extra_heart', txnId: 'b2' }, T0)
    ok('T19 +1 heart reaches max', r2.state.hearts === r2.state.maxHearts, r2.state.hearts)

    const r3 = run(r2.state, A.PURCHASE_ITEM, { itemId: 'extra_heart', txnId: 'b3' }, T0)
    ok('T19 +1 heart refused at max',
      r3.events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === shopSvc.REASONS.HEARTS_FULL))
    ok('T19 hearts never exceed max', r3.state.hearts === r3.state.maxHearts, r3.state.hearts)
    ok('T19 refused +1 heart costs nothing', r3.state.gems === r2.state.gems, r3.state.gems)
  }

  /* ── TEST 20: shop — duplicate transactions ── */
  {
    let s = { ...fresh(), gems: 500 }
    const r1 = run(s, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'dup' }, T0)
    const r2 = run(r1.state, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'dup' }, T0)
    ok('T20 first purchase settles', r1.state.streak.shields === 1, r1.state.streak.shields)
    ok('T20 replayed txn is refused', r2.events.some(e => e.type === 'PURCHASE_DUPLICATE'))
    ok('T20 replayed txn is not charged', r2.state.gems === r1.state.gems, `${r1.state.gems} -> ${r2.state.gems}`)
    ok('T20 replayed txn grants nothing', r2.state.streak.shields === 1, r2.state.streak.shields)
    ok('T20 replayed txn returns same state object', r2.state === r1.state)

    /* A DIFFERENT id is a genuine second purchase. */
    const r3 = run(r1.state, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'other' }, T0)
    ok('T20 distinct txn buys again', r3.state.streak.shields === 2, r3.state.streak.shields)

    /* Stock cap. */
    let capped = r3.state
    for (let i = 0; i < 5; i++) {
      capped = run(capped, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: `cap${i}` }, T0).state
    }
    ok('T20 shields capped at MAX_OWNED',
      capped.streak.shields === shop.SHIELD.MAX_OWNED, capped.streak.shields)
    const overCap = run(capped, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'over' }, T0)
    ok('T20 purchase refused at cap',
      overCap.events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === shopSvc.REASONS.MAX_OWNED))
    ok('T20 refused at cap costs nothing', overCap.state.gems === capped.gems, overCap.state.gems)
  }

  /* ── TEST 21: streak shield consumption ─────────────────────────────────────
     A streak is built on day 0, then the clock is moved forward to model
     coming back after a gap. Each case checks BOTH the streak and how many
     shields were actually spent. */
  {
    /* Build a real 1-day streak, then hand-set it to 12 so the assertions read
       clearly. lastStreakDate/lastActivityDate stay honest (both = day 0). */
    const withStreak = (shields) => {
      let s = fresh()
      s = run(s, A.COMPLETE_LESSON, { lessonId: learn.SECTIONS[0].lessons[0].id, seconds: 60 }, T0).state
      return {
        ...s,
        streak: { ...s.streak, current: 12, longest: 12, shields, lastShieldDate: null },
      }
    }

    /* CASE 1: no shield, one missed day → streak resets. */
    {
      const r = prog.reconcile(withStreak(0), T0 + 2 * DAY)
      ok('T21 case1 no shield → streak lost', r.state.streak.current === 0, r.state.streak.current)
      ok('T21 case1 emits STREAK_LOST', r.events.some(e => e.type === 'STREAK_LOST'))
    }

    /* CASE 2: one shield, one missed day → shield spent, streak survives. */
    {
      const r = prog.reconcile(withStreak(1), T0 + 2 * DAY)
      ok('T21 case2 streak survives', r.state.streak.current === 12, r.state.streak.current)
      ok('T21 case2 shield consumed exactly once', r.state.streak.shields === 0, r.state.streak.shields)
      ok('T21 case2 emits STREAK_SHIELD_USED', r.events.some(e => e.type === 'STREAK_SHIELD_USED'))
      ok('T21 case2 records lifetime use', r.state.streak.shieldsUsed === 1, r.state.streak.shieldsUsed)
      /* Reconciling again the same day must not spend a second one. */
      const again = prog.reconcile(r.state, T0 + 2 * DAY)
      ok('T21 case2 reconcile is idempotent', again.state.streak.shields === 0, again.state.streak.shields)
    }

    /* CASE 3: two shields, one missed day → one spent, one kept. */
    {
      const r = prog.reconcile(withStreak(2), T0 + 2 * DAY)
      ok('T21 case3 streak survives', r.state.streak.current === 12, r.state.streak.current)
      ok('T21 case3 one shield remains', r.state.streak.shields === 1, r.state.streak.shields)
    }

    /* CASE 4a: several missed days at once → NOT covered, no shield spent. */
    {
      const r = prog.reconcile(withStreak(3), T0 + 4 * DAY)
      ok('T21 case4a long gap breaks the streak', r.state.streak.current === 0, r.state.streak.current)
      ok('T21 case4a long gap spends no shields', r.state.streak.shields === 3, r.state.streak.shields)
    }

    /* CASE 4b: the drain case. The app is left open across consecutive missed
       days, so each midnight looks like a fresh single-day gap. Only the FIRST
       may be covered — after that the learner has not come back, so the streak
       breaks instead of eating the whole stock. */
    {
      const day2 = prog.reconcile(withStreak(3), T0 + 2 * DAY)
      ok('T21 case4b first miss is covered', day2.state.streak.shields === 2, day2.state.streak.shields)
      const day3 = prog.reconcile(day2.state, T0 + 3 * DAY)
      ok('T21 case4b second miss is NOT covered', day3.state.streak.shields === 2, day3.state.streak.shields)
      ok('T21 case4b streak breaks on the second miss', day3.state.streak.current === 0, day3.state.streak.current)
    }

    /* CASE 5: after a rescue the learner comes back and learns, which re-arms
       shield protection for the next gap. */
    {
      const rescued = prog.reconcile(withStreak(2), T0 + 2 * DAY).state
      const back = run(rescued, A.COMPLETE_LESSON,
        { lessonId: learn.SECTIONS[0].lessons[1].id, seconds: 60 }, T0 + 2 * DAY)
      ok('T21 case5 returning extends the streak', back.state.streak.current === 13, back.state.streak.current)
      ok('T21 case5 returning spends no extra shield', back.state.streak.shields === 1, back.state.streak.shields)

      /* Miss one more day — the remaining shield is now eligible again. */
      const later = prog.reconcile(back.state, T0 + 4 * DAY)
      ok('T21 case5 later miss is covered again', later.state.streak.current === 13, later.state.streak.current)
      ok('T21 case5 second shield spent', later.state.streak.shields === 0, later.state.streak.shields)
    }

    /* CASE 6: activity after a gap goes through updateStreak rather than
       reconcile — it must reach the same verdict, not double-spend. */
    {
      const s = withStreak(1)
      const back = run(s, A.COMPLETE_LESSON,
        { lessonId: learn.SECTIONS[0].lessons[1].id, seconds: 60 }, T0 + 2 * DAY)
      ok('T21 case6 lesson after a gap keeps the streak', back.state.streak.current === 13, back.state.streak.current)
      ok('T21 case6 exactly one shield spent', back.state.streak.shields === 0, back.state.streak.shields)
    }
  }

  /* ── TEST 22: shop state survives a save/load round trip ── */
  {
    let s = { ...fresh(), gems: 400, hearts: 2, heartAnchor: T0 }
    s = run(s, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'p1' }, T0).state
    s = run(s, A.PURCHASE_ITEM, { itemId: 'heart_refill', txnId: 'p2' }, T0).state

    const revived = store.sanitizeState(JSON.parse(JSON.stringify(s)), T0)
    ok('T22 gems persist', revived.gems === s.gems, `${s.gems} -> ${revived.gems}`)
    ok('T22 hearts persist', revived.hearts === s.hearts, `${s.hearts} -> ${revived.hearts}`)
    ok('T22 shields persist', revived.streak.shields === s.streak.shields, revived.streak.shields)
    ok('T22 purchase count persists', revived.shop.purchaseCount === 2, revived.shop.purchaseCount)
    ok('T22 txn ids persist (duplicate guard survives a refresh)',
      revived.shop.seenTxnIds.includes('p1') && revived.shop.seenTxnIds.includes('p2'),
      JSON.stringify(revived.shop.seenTxnIds))
    /* The guard must still hold on the revived state. */
    const replay = run(revived, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'p1' }, T0)
    ok('T22 replay after reload is refused', replay.state.gems === revived.gems, replay.state.gems)

    /* Legacy saves called the stock "freezes". */
    const legacy = store.sanitizeState({ streak: { current: 3, longest: 3, freezes: 2 } }, T0)
    ok('T22 legacy freezes migrate to shields', legacy.streak.shields === 2, legacy.streak.shields)
  }

  /* ── TEST 23: shop prices are single-sourced ── */
  {
    ok('T23 catalogue prices match the constants',
      shop.getShopItem('heart_refill').price === shop.HEART_REFILL_COST &&
      shop.getShopItem('extra_heart').price === shop.EXTRA_HEART_COST &&
      shop.getShopItem('streak_shield').price === shop.STREAK_SHIELD_COST)
    ok('T23 every catalogue item has an effect',
      shop.SHOP_ITEMS.every(i => Object.values(shop.ITEM_TYPES).includes(i.type)))
    ok('T23 unknown item is refused',
      run(fresh(), A.PURCHASE_ITEM, { itemId: 'nope', txnId: 'x' }, T0)
        .events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === shopSvc.REASONS.UNKNOWN_ITEM))
  }

  /* ═════════════════════════════════════════════════════════════════════════
     DAILY LOGIN BONUS
     ═════════════════════════════════════════════════════════════════════════ */

  /* ── TEST 24: a brand-new learner is offered Day 1 ── */
  {
    const s = fresh()
    const v = bonusSvc.getBonusView(s, T0)
    ok('T24 new user is on day 1', v.currentDay === 1, v.currentDay)
    ok('T24 new user has a reward waiting', v.available === true)
    ok('T24 nothing claimed yet', s.dailyBonus.totalClaimed === 0 && s.dailyBonus.lastClaimDate === null)
    ok('T24 day 1 card reads "today"', v.days[0].status === 'today', v.days[0].status)
    ok('T24 every other day is locked',
      v.days.slice(1).every(d => d.status === 'locked'),
      JSON.stringify(v.days.map(d => d.status)))
    ok('T24 opening the app claims nothing',
      prog.reconcile(s, T0).state.dailyBonus.totalClaimed === 0)
    ok('T24 cycle length matches the configured track',
      dbCfg.CYCLE.length === dbCfg.DAILY_BONUS.CYCLE_LENGTH, dbCfg.CYCLE.length)
    ok('T24 every reward has a type the service can apply',
      dbCfg.CYCLE.every(r => Object.values(dbCfg.REWARD_TYPES).includes(r.type)))
    ok('T24 track days are 1..7 in order',
      dbCfg.CYCLE.every((r, i) => r.day === i + 1))
  }

  /* ── TEST 25: claiming pays exactly once, through the central systems ── */
  {
    const s = fresh()
    const r = run(s, A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T25 day 1 pays 20 gems', r.state.gems === s.gems + 20, `${s.gems} -> ${r.state.gems}`)
    ok('T25 claim is recorded', r.state.dailyBonus.lastClaimDate === putils_today(T0), r.state.dailyBonus.lastClaimDate)
    ok('T25 cycle advances to day 2', r.state.dailyBonus.cycleDay === 2, r.state.dailyBonus.cycleDay)
    ok('T25 totalClaimed increments', r.state.dailyBonus.totalClaimed === 1)
    ok('T25 emits DAILY_BONUS_CLAIMED', r.events.some(e => e.type === 'DAILY_BONUS_CLAIMED'))
    ok('T25 gems land in the ledger',
      r.state.ledger.some(e => e.reason === 'daily-bonus-day-1' && e.amount === 20),
      JSON.stringify(r.state.ledger[0]))
    ok('T25 counts toward lifetime gem stats',
      r.state.stats.totalGemsEarned === s.stats.totalGemsEarned + 20)

    /* Clicking again in the same instant must not pay again. */
    const again = run(r.state, A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T25 second claim pays nothing', again.state.gems === r.state.gems, again.state.gems)
    ok('T25 second claim is refused', again.events.some(e => e.type === 'DAILY_BONUS_ALREADY_CLAIMED'))
    ok('T25 second claim does not advance the cycle', again.state.dailyBonus.cycleDay === 2)

    /* Ten rapid clicks — the reducer always sees the latest state. */
    let spam = r.state
    for (let i = 0; i < 10; i++) spam = run(spam, A.CLAIM_DAILY_BONUS, {}, T0).state
    ok('T25 ten rapid clicks pay nothing extra', spam.gems === r.state.gems, spam.gems)
    ok('T25 ten rapid clicks claim once', spam.dailyBonus.totalClaimed === 1, spam.dailyBonus.totalClaimed)

    /* A refresh reloads the anchor, so the guard survives it. */
    const revived = store.sanitizeState(JSON.parse(JSON.stringify(r.state)), T0)
    ok('T25 claim survives a save/load round trip',
      revived.dailyBonus.lastClaimDate === r.state.dailyBonus.lastClaimDate &&
      revived.dailyBonus.cycleDay === 2 && revived.dailyBonus.totalClaimed === 1,
      JSON.stringify(revived.dailyBonus))
    ok('T25 replay after a reload is refused',
      run(revived, A.CLAIM_DAILY_BONUS, {}, T0).state.gems === revived.gems)
    ok('T25 view reports claimed for today', bonusSvc.getBonusView(r.state, T0).available === false)
  }

  /* ── TEST 26: the calendar drives availability, not elapsed hours ── */
  {
    const s = run(fresh(), A.CLAIM_DAILY_BONUS, {}, T0).state

    /* Eleven hours later is still the same calendar day. */
    ok('T26 same day 11h later is still claimed',
      bonusSvc.getBonusView(s, T0 + 11 * 3600000).available === false)

    /* The next calendar day opens Day 2. */
    const d2 = bonusSvc.getBonusView(s, T0 + DAY)
    ok('T26 next day is available', d2.available === true)
    ok('T26 next day offers day 2', d2.nextDay === 2, d2.nextDay)

    const r2 = run(s, A.CLAIM_DAILY_BONUS, {}, T0 + DAY)
    ok('T26 day 2 pays 30 XP', r2.state.xp === s.xp + 30, `${s.xp} -> ${r2.state.xp}`)
    ok('T26 day 2 XP lands in the ledger',
      r2.state.ledger.some(e => e.kind === 'xp' && e.reason === 'daily-bonus-day-2'))
    ok('T26 day 2 advances to day 3', r2.state.dailyBonus.cycleDay === 3)

    /* Crossing midnight is one day even when only minutes have passed. */
    const lateNight = new Date(T0); lateNight.setHours(23, 55, 0, 0)
    const justAfter = new Date(T0 + DAY); justAfter.setHours(0, 5, 0, 0)
    const late = run(fresh(lateNight.getTime()), A.CLAIM_DAILY_BONUS, {}, lateNight.getTime()).state
    ok('T26 ten minutes across midnight is a new day',
      bonusSvc.getBonusView(late, justAfter.getTime()).available === true)
  }

  /* ── TEST 27: a missed day does not reset the track ── */
  {
    /* Claim day 1 on Monday, skip Tuesday, return Wednesday. */
    const mon = run(fresh(), A.CLAIM_DAILY_BONUS, {}, T0).state
    const wed = bonusSvc.getBonusView(mon, T0 + 2 * DAY)
    ok('T27 a reward is waiting after a missed day', wed.available === true)
    ok('T27 the track resumes at day 2', wed.nextDay === 2, wed.nextDay)
    ok('T27 the miss is reported', wed.missedDays === 1, wed.missedDays)

    const claimed = run(mon, A.CLAIM_DAILY_BONUS, {}, T0 + 2 * DAY)
    ok('T27 day 2 is what actually pays out',
      claimed.events.some(e => e.type === 'DAILY_BONUS_CLAIMED' && e.day === 2))
    ok('T27 cycle continues to day 3', claimed.state.dailyBonus.cycleDay === 3)

    /* A long absence behaves the same way under the shipped CONTINUE rule. */
    const muchLater = bonusSvc.getBonusView(mon, T0 + 40 * DAY)
    ok('T27 a 40-day absence still resumes at day 2', muchLater.nextDay === 2, muchLater.nextDay)
    ok('T27 shipped policy is CONTINUE',
      dbCfg.DAILY_BONUS.ON_MISSED_DAY === dbCfg.MISSED_DAY_POLICY.CONTINUE)
  }

  /* ── TEST 28: a full seven-day cycle, then a clean restart ── */
  {
    let s = fresh()
    const before = { gems: s.gems, xp: s.xp }
    const claimedDays = []

    for (let day = 0; day < 7; day++) {
      const r = run(s, A.CLAIM_DAILY_BONUS, {}, T0 + day * DAY)
      s = r.state
      const event = r.events.find(e => e.type === 'DAILY_BONUS_CLAIMED')
      claimedDays.push(event?.day)
    }

    ok('T28 the seven claims were days 1..7',
      JSON.stringify(claimedDays) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]),
      JSON.stringify(claimedDays))
    ok('T28 day 7 grants a streak shield', s.streak.shields === 1, s.streak.shields)
    ok('T28 cycle counted as complete', s.dailyBonus.cyclesCompleted === 1, s.dailyBonus.cyclesCompleted)
    ok('T28 pointer wraps back to day 1', s.dailyBonus.cycleDay === 1, s.dailyBonus.cycleDay)
    ok('T28 seven claims recorded', s.dailyBonus.totalClaimed === 7, s.dailyBonus.totalClaimed)

    /* Gems: 20 + 30 + 50 = 100 across days 1, 3 and 5. XP: 30 + 75 = 105. */
    ok('T28 gem rewards all landed', s.gems >= before.gems + 100, `${before.gems} -> ${s.gems}`)
    ok('T28 xp rewards all landed', s.xp >= before.xp + 105, `${before.xp} -> ${s.xp}`)

    /* Finishing the track resets ONLY the bonus cycle. */
    const view = bonusSvc.getBonusView(s, T0 + 6 * DAY)
    ok('T28 completion is flagged for the UI', view.cycleJustCompleted === true)
    ok('T28 all seven cards read claimed',
      view.days.every(d => d.status === 'claimed'),
      JSON.stringify(view.days.map(d => d.status)))

    const day8 = bonusSvc.getBonusView(s, T0 + 7 * DAY)
    ok('T28 the new cycle opens at day 1', day8.nextDay === 1 && day8.available === true, day8.nextDay)
    const r8 = run(s, A.CLAIM_DAILY_BONUS, {}, T0 + 7 * DAY)
    ok('T28 day 1 of cycle 2 pays 20 gems again', r8.state.gems === s.gems + 20)
    ok('T28 progression is untouched by the reset',
      r8.state.xp === s.xp && r8.state.streak.shields === s.streak.shields &&
      r8.state.stats.totalGemsEarned > 0,
      `xp ${r8.state.xp} shields ${r8.state.streak.shields}`)
  }

  /* ── TEST 29: rewards that would land on a full resource pay the fallback ── */
  {
    /* Day 4 is hearts. A learner returning the next day is almost always at
       full hearts, so without a fallback that day would pay nothing. */
    const full = { ...fresh(), hearts: 5, dailyBonus: { ...fresh().dailyBonus, cycleDay: 4 } }
    const r = run(full, A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T29 hearts stay capped at max', r.state.hearts === 5, r.state.hearts)
    ok('T29 full hearts pay gems instead', r.state.gems === full.gems + 15, `${full.gems} -> ${r.state.gems}`)
    ok('T29 the substitution is reported',
      r.events.some(e => e.type === 'DAILY_BONUS_CLAIMED' && e.substituted === true))

    /* With room to spare, the hearts themselves are what land. */
    const hurt = { ...fresh(), hearts: 2, heartAnchor: T0, dailyBonus: { ...fresh().dailyBonus, cycleDay: 4 } }
    const r2 = run(hurt, A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T29 missing hearts are restored', r2.state.hearts === 4, r2.state.hearts)
    ok('T29 no gem substitution when hearts land', r2.state.gems === hurt.gems, r2.state.gems)
    ok('T29 hearts never exceed the maximum',
      run({ ...fresh(), hearts: 4, heartAnchor: T0, dailyBonus: { ...fresh().dailyBonus, cycleDay: 4 } },
        A.CLAIM_DAILY_BONUS, {}, T0).state.hearts === 5)

    /* Same rule for a full shield bank on day 7. */
    const maxed = {
      ...fresh(),
      streak: { ...fresh().streak, shields: shop.SHIELD.MAX_OWNED },
      dailyBonus: { ...fresh().dailyBonus, cycleDay: 7 },
    }
    const r3 = run(maxed, A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T29 shields stay capped', r3.state.streak.shields === shop.SHIELD.MAX_OWNED, r3.state.streak.shields)
    ok('T29 a full shield bank pays gems instead', r3.state.gems === maxed.gems + 60, r3.state.gems)
  }

  /* ── TEST 30: bonus rewards feed the rest of the progression system ── */
  {
    /* A day-7 shield must be a REAL shield: it has to rescue a streak. */
    let s = { ...fresh(), dailyBonus: { ...fresh().dailyBonus, cycleDay: 7 } }
    s = run(s, A.CLAIM_DAILY_BONUS, {}, T0).state
    ok('T30 the bonus shield is in the bank', s.streak.shields === 1, s.streak.shields)

    s = {
      ...s,
      streak: { ...s.streak, current: 9, longest: 9, lastActivityDate: putils_today(T0), lastStreakDate: putils_today(T0) },
    }
    const missed = prog.reconcile(s, T0 + 2 * DAY)
    ok('T30 the bonus shield rescues a real streak', missed.state.streak.current === 9, missed.state.streak.current)
    ok('T30 the bonus shield is consumed once', missed.state.streak.shields === 0, missed.state.streak.shields)

    /* Gems from the bonus are spendable in the shop like any others. */
    const rich = run({ ...fresh(), gems: 90, dailyBonus: { ...fresh().dailyBonus, cycleDay: 5 } },
      A.CLAIM_DAILY_BONUS, {}, T0).state
    ok('T30 shop sees the new balance', rich.gems === 140, rich.gems)
    ok('T30 bonus gems can buy a shield',
      shopSvc.getAvailability(rich, 'streak_shield').ok === true)
    const bought = run(rich, A.PURCHASE_ITEM, { itemId: 'streak_shield', txnId: 'db1' }, T0)
    ok('T30 the purchase settles', bought.state.gems === 40 && bought.state.streak.shields === 1,
      `${bought.state.gems} gems, ${bought.state.streak.shields} shields`)

    /* XP from the bonus levels the learner up through the normal path. */
    const xpDay = run({ ...fresh(), xp: 95, level: 1, dailyBonus: { ...fresh().dailyBonus, cycleDay: 6 } },
      A.CLAIM_DAILY_BONUS, {}, T0)
    ok('T30 bonus XP triggers a level up', xpDay.events.some(e => e.type === 'LEVEL_UP'))
    ok('T30 bonus XP counts toward the daily goal', xpDay.state.daily.xp >= 75, xpDay.state.daily.xp)
  }

  /* ── TEST 31: corrupted or absent bonus state degrades safely ── */
  {
    ok('T31 missing block falls back to day 1',
      store.sanitizeState({ xp: 10 }, T0).dailyBonus.cycleDay === 1)
    ok('T31 a garbage day is normalised into range',
      store.sanitizeState({ dailyBonus: { cycleDay: 99 } }, T0).dailyBonus.cycleDay >= 1 &&
      store.sanitizeState({ dailyBonus: { cycleDay: 99 } }, T0).dailyBonus.cycleDay <= 7,
      store.sanitizeState({ dailyBonus: { cycleDay: 99 } }, T0).dailyBonus.cycleDay)
    ok('T31 a negative day is normalised',
      store.sanitizeState({ dailyBonus: { cycleDay: -4 } }, T0).dailyBonus.cycleDay === 1)
    ok('T31 a non-string claim date is dropped',
      store.sanitizeState({ dailyBonus: { lastClaimDate: 42 } }, T0).dailyBonus.lastClaimDate === null)
    ok('T31 negative counters are floored at zero',
      store.sanitizeState({ dailyBonus: { totalClaimed: -9 } }, T0).dailyBonus.totalClaimed === 0)
    /* A save written before the daily bonus existed must still open. */
    ok('T31 a pre-bonus save still loads',
      store.sanitizeState({ xp: 500, gems: 300, streak: { current: 4 } }, T0).dailyBonus.totalClaimed === 0)
  }

  const passed = results.filter((r) => r.pass).length
  const failures = results.filter((r) => !r.pass)
  return {
    summary: `${passed}/${results.length} passed`,
    passed,
    total: results.length,
    failures,
    results,
  }
}

export default runProgressionTests
