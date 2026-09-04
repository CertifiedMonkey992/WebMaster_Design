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
import * as putils from '../utils/progressionUtils'

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
