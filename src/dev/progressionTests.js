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
import * as wheelSvc from '../services/wheelService'
import * as wheelCfg from '../config/wheelConfig'
import * as rnd from '../utils/random'
import * as putils from '../utils/progressionUtils'
import * as showcase from '../data/showcaseState'
import { getLocalDateKey } from '../utils/dateUtils'

/** The local date key for an injected timestamp — used all over the bonus tests. */
const putils_today = (t) => getLocalDateKey(new Date(t))

/* The first four course items, in order: three lessons and Module 1's Case
   File — so completing all four finishes the module. */
const [L0, L1, L2, L3] = learn.ALL_LESSONS.map((l) => l.id)
/* Lessons proper, for anything that counts lessons (quests, stats). */
const LESSON_IDS = learn.ALL_LESSONS.filter((l) => learn.isLesson(l)).map((l) => l.id)

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
      [...s.quests.daily, ...s.quests.weekly].every(q => q.type !== 'COMPLETE_LESSONS' || q.target <= learn.TOTAL_LESSONS))
  }

  /* ── TEST 2: first lesson completion drives everything ── */
  {
    let s = fresh()
    const r = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 180, accuracy: 1 }, T0)
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
    ok('T2 next lesson advanced', learn.deriveCourse(s.lessons).current.lesson.id === L1,
       learn.deriveCourse(s.lessons).current.lesson.id)
    ok('T2 emitted LESSON_COMPLETE', r.events.some(e => e.type === 'LESSON_COMPLETE'))
    ok('T2 emitted XP_AWARDED', r.events.some(e => e.type === 'XP_AWARDED'))
    ok('T2 achievement first-steps unlocked', !!s.achievements['first-steps'])
  }

  /* ── TEST 3: repeat lesson pays no completion XP ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: false, seconds: 60, accuracy: 1 }, T0).state
    const xpAfterFirst = s.xp
    const gemsAfterFirst = s.gems
    const lessonsAfterFirst = s.daily.lessons
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 60, accuracy: 1 }, T0 + 1000).state
    ok('T3 no duplicate XP', s.xp === xpAfterFirst, `${xpAfterFirst} -> ${s.xp}`)
    ok('T3 no duplicate gems', s.gems === gemsAfterFirst, `${gemsAfterFirst} -> ${s.gems}`)
    ok('T3 lesson count unchanged', s.daily.lessons === lessonsAfterFirst, s.daily.lessons)
    ok('T3 replay counts as practice', s.daily.practiceSessions === 1, s.daily.practiceSessions)
    ok('T3 unique lessons still 1', s.stats.totalLessonsCompleted === 1)
    ok('T3 attempts incremented', s.lessons[L0].attempts === 2)
  }

  /* ── TEST 3b: answer XP budget cannot be farmed ── */
  {
    let s = fresh()
    const budget = 3 * cfg.XP.CORRECT_ANSWER
    for (let i = 0; i < 10; i++) {
      s = run(s, A.RECORD_ANSWER, { lessonId: L0, correct: true, maxAnswerXP: budget }, T0).state
    }
    ok('T3b answer XP capped at budget', s.xp === budget, `${s.xp} vs ${budget}`)
  }

  /* ── TEST 4 + 5: quest completion, claim, and double-claim guard ──────────
     Daily quests are generated from a seed seeded on the date key, so which
     three templates appear changes from one day to the next. This block used
     to look for an EARN_XP quest and skip everything if it was not dealt,
     which made it pass or fail by the calendar. What it is actually testing —
     a quest completing, paying once, and never paying twice — is true of any
     quest, so it now drives whichever one it was given. */
  {
    let s = fresh()

    /* Move a quest's own metric to its target, using the same actions the app
       dispatches. Returns the new state, or null for a type this cannot
       satisfy in a single day at T0. */
    const satisfy = (state, quest) => {
      const step = (st, type, payload) => run(st, type, payload, T0).state
      const target = quest.target

      switch (quest.type) {
        case 'EARN_XP':
          return step(state, A.AWARD_XP, { amount: target, reason: 'test' })

        case 'EARN_GEMS':
          return step(state, A.AWARD_GEMS, { amount: target, reason: 'test' })

        case 'COMPLETE_DAILY_GOAL':
          return step(state, A.AWARD_XP, { amount: state.goals.dailyXP, reason: 'test' })

        case 'SPEND_TIME': {
          /* ADD_PRACTICE_TIME clamps each call to an hour. */
          let st = state
          let left = target * 60
          while (left > 0) {
            const chunk = Math.min(left, 3600)
            st = step(st, A.ADD_PRACTICE_TIME, { seconds: chunk })
            left -= chunk
          }
          return st
        }

        case 'COMPLETE_PRACTICE': {
          let st = state
          for (let i = 0; i < target; i += 1) {
            st = step(st, A.COMPLETE_PRACTICE, { seconds: 60, correct: 4, total: 4 })
          }
          return st
        }

        case 'MAINTAIN_STREAK':
          return step(state, A.COMPLETE_LESSON, { lessonId: learn.ALL_LESSONS[0].id, seconds: 30 })

        case 'COMPLETE_LESSONS':
        case 'PERFECT_LESSON': {
          /* Re-completing one lesson never counts twice, so each pass needs a
             lesson of its own. */
          const perfect = quest.type === 'PERFECT_LESSON'
          if (LESSON_IDS.length < target) return null
          let st = state
          for (let i = 0; i < target; i += 1) {
            st = step(st, A.COMPLETE_LESSON, { lessonId: LESSON_IDS[i], seconds: 30, perfect, accuracy: perfect ? 1 : 0.8 })
          }
          return st
        }

        case 'COMPLETE_SECTION': {
          const section = learn.SECTIONS[0]
          if (!section || target > 1) return null
          let st = state
          for (const lesson of section.lessons) {
            st = step(st, A.COMPLETE_LESSON, { lessonId: lesson.id, seconds: 30 })
          }
          return st
        }

        default:
          return null
      }
    }

    /* Take the first quest this can drive. EARN_XP first, so the common case
       reads the same as it always did. */
    const candidates = [...s.quests.daily].sort((a, b) =>
      (a.type === 'EARN_XP' ? -1 : 0) - (b.type === 'EARN_XP' ? -1 : 0))

    let picked = null
    let driven = null
    for (const quest of candidates) {
      const after = satisfy(s, quest)
      if (!after) continue
      const q = quests.findQuest(after, quest.id)
      if (q?.completed) { picked = quest; driven = after; break }
    }

    ok('T4 a daily quest could be driven to completion', !!picked,
       s.quests.daily.map(q => `${q.type}:${q.target}`).join())

    if (picked) {
      s = driven
      const q = quests.findQuest(s, picked.id)
      ok('T4 quest completed', q.completed, `${picked.type} ${q.progress}/${q.target}`)
      ok('T4 not auto-claimed', !q.claimed, picked.type)

      const gemsBefore = s.gems
      const r1 = run(s, A.CLAIM_QUEST, { questId: picked.id }, T0)
      s = r1.state
      ok('T4 gems increased by exact reward', s.gems === gemsBefore + q.reward.gems,
         `${gemsBefore} + ${q.reward.gems} -> ${s.gems}`)
      ok('T4 quest marked claimed', quests.findQuest(s, picked.id).claimed)

      const gemsAfterClaim = s.gems
      const r2 = run(s, A.CLAIM_QUEST, { questId: picked.id }, T0)
      s = r2.state
      ok('T5 second claim pays nothing', s.gems === gemsAfterClaim, `${gemsAfterClaim} -> ${s.gems}`)
      ok('T5 second claim emits no gem event', !r2.events.some(e => e.type === 'GEMS_AWARDED'))
    }
  }

  /* ── TEST 6: two activities on the same calendar day ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, seconds: 30 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: L1, seconds: 30 }, T0 + 3600000).state
    ok('T6 streak stays 1 on same day', s.streak.current === 1, s.streak.current)
    ok('T6 both lessons counted', s.daily.lessons === 2, s.daily.lessons)
  }

  /* ── TEST 7: consecutive days ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, seconds: 30 }, T0).state
    s = prog.reconcile(s, T0 + DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: L1, seconds: 30 }, T0 + DAY).state
    ok('T7 day2 streak = 2', s.streak.current === 2, s.streak.current)
    s = prog.reconcile(s, T0 + 2 * DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: L2, seconds: 30 }, T0 + 2 * DAY).state
    ok('T7 day3 streak = 3', s.streak.current === 3, s.streak.current)
    s = run(s, A.COMPLETE_LESSON, { lessonId: L3, seconds: 30 }, T0 + 2 * DAY + 7200000).state
    ok('T7 same-day second lesson keeps streak 3', s.streak.current === 3, s.streak.current)
    ok('T7 longest recorded', s.streak.longest === 3, s.streak.longest)
    ok('T7 section completed bonus', s.stats.totalSectionsCompleted === 1, s.stats.totalSectionsCompleted)
  }

  /* ── TEST 8: skipping a day resets the streak ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, seconds: 30 }, T0).state
    s = prog.reconcile(s, T0 + DAY).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: L1, seconds: 30 }, T0 + DAY).state
    ok('T8 streak 2 before gap', s.streak.current === 2)
    // Skip T0+2D entirely, return on T0+3D
    const afterGap = prog.reconcile(s, T0 + 3 * DAY).state
    ok('T8 streak shows broken on return', afterGap.streak.current === 0, afterGap.streak.current)
    const resumed = run(afterGap, A.COMPLETE_LESSON, { lessonId: L2, seconds: 30 }, T0 + 3 * DAY).state
    ok('T8 next activity resets to 1', resumed.streak.current === 1, resumed.streak.current)
    ok('T8 longest preserved', resumed.streak.longest === 2, resumed.streak.longest)
    ok('T8 total XP preserved', resumed.xp >= 50, resumed.xp)
  }

  /* ── TEST 9: persistence round-trip ── */
  {
    let s = fresh()
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 90 }, T0).state
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
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 60 }, T0).state
    const xpBefore = s.xp, gemsBefore = s.gems, streakBefore = s.streak.current
    const dailyIdsBefore = s.quests.daily.map(q => q.id).join()
    const next = prog.reconcile(s, T0 + DAY).state
    ok('T10 daily xp reset', next.daily.xp === 0, next.daily.xp)
    ok('T10 daily lessons reset', next.daily.lessons === 0)
    ok('T10 total xp preserved', next.xp === xpBefore, `${xpBefore} -> ${next.xp}`)
    /* A rollover never takes gems away. The only gems it may ADD are quest
       rewards the learner finished but never claimed (paid automatically
       before the set resets) and anything those payouts unlock — which
       quests the day's seed happens to generate depends on the timezone. */
    const added = next.ledger.slice(0, next.ledger.length - s.ledger.length).filter(e => e.kind === 'gems')
    ok('T10 gems preserved (only auto-claimed rewards may be added)',
      next.gems === gemsBefore + added.reduce((n, e) => n + e.amount, 0)
        && added.every(e => ['quest', 'achievement', 'team-mission'].includes(e.reason)),
      `${gemsBefore} -> ${next.gems}, added: ${added.map(e => `${e.reason}+${e.amount}`).join(' ') || 'none'}`)
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

  /* Which quests are dealt depends on the calendar date in the seed, so a
     test that needs "a quest" picks whichever of these was dealt and drives
     that one to its target: EARN_XP by awarding XP, COMPLETE_LESSONS by
     finishing lessons. Every learner is dealt at least one of the two. */
  const driveQuest = (state) => {
    const active = quests.getActiveQuests(state)
    const xpQuest = active.find(q => q.type === 'EARN_XP')
    if (xpQuest) {
      return { quest: xpQuest, state: run(state, A.AWARD_XP, { amount: xpQuest.target, reason: 'test' }, T0).state }
    }
    const lessonQuest = active.find(q => q.type === 'COMPLETE_LESSONS')
    if (!lessonQuest) return { quest: null, state }
    let s = state
    const ids = LESSON_IDS
    for (const id of ids.slice(0, lessonQuest.target)) {
      s = run(s, A.COMPLETE_LESSON, { lessonId: id, perfect: false, seconds: 60, accuracy: 1 }, T0).state
    }
    return { quest: lessonQuest, state: s }
  }

  /* ── TEST 16: quest progress is derived, never double-counted ── */
  {
    const { quest: q, state: s } = driveQuest(fresh())
    ok('T16 a drivable quest was dealt', Boolean(q), quests.getActiveQuests(fresh()).map(x => x.type).join())
    const after1 = quests.findQuest(s, q.id).progress
    ok('T16 the metric drove the bar to its target', after1 === q.target, `${after1}/${q.target}`)
    // Re-running evaluation many times must not move the bar
    let t = s
    for (let i = 0; i < 5; i++) t = prog.runPipeline(t, T0).state
    ok('T16 repeated evaluation is stable', quests.findQuest(t, q.id).progress === after1,
       `${after1} -> ${quests.findQuest(t, q.id).progress}`)
    ok('T16 evaluation is reference-stable',
       prog.reconcile(s, T0).state === s, 'reconcile returned a new object when nothing changed')
  }

  /* ── TEST 17: claim-all is idempotent ── */
  {
    const { quest: q, state: s } = driveQuest(fresh())
    ok('T17 the driven quest is claimable', Boolean(q) && quests.getClaimableQuests(s).some(x => x.id === q.id),
       quests.getClaimableQuests(s).map(x => x.id).join())
    /* Driving one metric can finish other quests too (XP toward a daily
       goal, say); claim-all pays every one of them, plus anything those
       payouts unlock. Check the driven quest's reward is in the ledger and
       nothing was paid twice. */
    const r1 = run(s, A.CLAIM_ALL_QUESTS, {}, T0)
    const gemsAfter = r1.state.gems
    ok('T17 claim-all paid the driven quest',
       r1.state.ledger.filter(e => e.reason === 'quest' && e.questId === q.id).length === 1
         && gemsAfter >= s.gems + q.reward.gems,
       `${s.gems} -> ${gemsAfter}`)
    const r2 = run(r1.state, A.CLAIM_ALL_QUESTS, {}, T0)
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
     DAILY SPIN (the wheel that replaced the daily bonus)
     ═════════════════════════════════════════════════════════════════════════ */

  /* A roll that lands in a given slot: the first value of its range. */
  const rollFor = (slotId) => {
    let edge = 0
    for (const slot of wheelCfg.SLOTS) {
      if (slot.id === slotId) return edge
      edge += slot.weight
    }
    return -1
  }
  const spin = (s, slotId, t = T0, spinId = `t-${slotId}-${t}`) => run(s, A.SPIN_WHEEL, { roll: rollFor(slotId), spinId }, t)

  /* ── TEST 24: the reward table is a probability distribution ── */
  {
    const total = wheelCfg.SLOTS.reduce((sum, s) => sum + s.weight, 0)
    ok('T24 the weights sum to exactly 100%', total === wheelCfg.WHEEL.WEIGHT_TOTAL, total)
    ok('T24 every weight is a positive integer', wheelCfg.SLOTS.every(s => Number.isInteger(s.weight) && s.weight > 0))
    ok('T24 every slot has a type the service can pay',
      wheelCfg.SLOTS.every(s => Object.values(wheelCfg.REWARD_TYPES).includes(s.type) && s.amount > 0))
    ok('T24 slot ids are unique', new Set(wheelCfg.SLOTS.map(s => s.id)).size === wheelCfg.SLOTS.length)
    const tier = (id) => wheelCfg.SLOTS.filter(s => s.tier === id).reduce((sum, s) => sum + s.weight, 0)
    ok('T24 tiers are 55 / 27 / 13 / 4.5 / 0.5 %',
      tier('common') === 550 && tier('uncommon') === 270 && tier('rare') === 130 && tier('epic') === 45 && tier('jackpot') === 5,
      ['common', 'uncommon', 'rare', 'epic', 'jackpot'].map(tier).join('/'))
    const tiersShown = wheelSvc.ODDS.tiers.reduce((sum, t) => sum + t.weight, 0)
    ok('T24 the odds shown to learners add up to 100%', tiersShown === 1000, tiersShown)
    /* Every one of the 1000 draws maps to a slot, and each slot owns exactly
       its weight's worth of them — the wheel IS the table. */
    const counts = {}
    for (let r = 0; r < 1000; r++) {
      const slot = wheelCfg.slotForRoll(r)
      counts[slot?.id ?? 'none'] = (counts[slot?.id ?? 'none'] ?? 0) + 1
    }
    ok('T24 every draw lands on a slot', !counts.none, counts.none)
    ok('T24 each slot owns exactly its weight in draws',
      wheelCfg.SLOTS.every(s => counts[s.id] === s.weight), JSON.stringify(counts))
    ok('T24 the jackpot is worth far more than the common reward',
      wheelCfg.SLOTS.find(s => s.tier === 'jackpot').amount >= 10 * wheelCfg.SLOTS.find(s => s.id === 'gems-20').amount)
    /* The fair-draw helper: rejection sampling keeps it inside [0, n). */
    let inRange = true
    for (let i = 0; i < 2000; i++) { const v = rnd.secureInt(1000); if (!(Number.isInteger(v) && v >= 0 && v < 1000)) inRange = false }
    ok('T24 the secure draw stays in 0–999', inRange)
  }

  /* ── TEST 25: a new learner has one spin, and opening the app spends nothing ── */
  {
    const s = fresh()
    const v = wheelSvc.getWheelView(s, T0)
    ok('T25 one spin waiting', v.available === true && v.spinsLeft === 1, v.spinsLeft)
    ok('T25 opening the app spins nothing', prog.reconcile(s, T0).state.wheel.totalSpins === 0)
    ok('T25 the reset is the next UTC midnight',
      v.resetAt > T0 && v.resetAt - T0 <= DAY && new Date(v.resetAt).getUTCHours() === 0 && new Date(v.resetAt).getUTCMinutes() === 0)
  }

  /* ── TEST 26: a spin pays exactly the slot it lands on, once ── */
  {
    const s = fresh()
    const r = spin(s, 'gems-35')
    const spun = r.events.find(e => e.type === 'WHEEL_SPUN')
    ok('T26 the result is the drawn slot', spun?.slotId === 'gems-35', spun?.slotId)
    ok('T26 the slot index points at it on the wheel', wheelCfg.SLOTS[spun?.slotIndex]?.id === 'gems-35')
    ok('T26 35 gems were paid', r.state.gems === s.gems + 35, `${s.gems} -> ${r.state.gems}`)
    ok('T26 the gems are in the ledger', r.state.ledger.some(e => e.reason === 'wheel:gems-35' && e.amount === 35))
    ok('T26 the spin is recorded', r.state.wheel.totalSpins === 1 && r.state.wheel.lastSpin?.slotId === 'gems-35')
    ok('T26 no spins left today', wheelSvc.getWheelView(r.state, T0).spinsLeft === 0)

    const again = spin(r.state, 'gems-500', T0 + 1000, 'second')
    ok('T26 a second spin today is refused', again.events.some(e => e.type === 'WHEEL_REFUSED' && e.reason === 'none-left'))
    ok('T26 a refused spin pays nothing', again.state.gems === r.state.gems, again.state.gems)

    /* The same spin id replayed (a double click, a retried dispatch). */
    const banked = run(r.state, A.JUDGE, { op: 'enable', stock: false }, T0).state
    const extra = run(banked, A.JUDGE, { op: 'spins', count: 1 }, T0).state
    const replay = run(extra, A.SPIN_WHEEL, { roll: rollFor('gems-20'), spinId: `t-gems-35-${T0}` }, T0)
    ok('T26 a replayed spin id is refused', replay.events.some(e => e.type === 'WHEEL_REFUSED' && e.reason === 'duplicate'))

    let spam = r.state
    for (let i = 0; i < 10; i++) spam = run(spam, A.SPIN_WHEEL, { roll: rollFor('gems-500'), spinId: `spam-${i}` }, T0).state
    ok('T26 ten rapid clicks pay nothing extra', spam.gems === r.state.gems && spam.wheel.totalSpins === 1, spam.gems)

    const revived = store.sanitizeState(JSON.parse(JSON.stringify(r.state)), T0)
    ok('T26 the spin survives a save/load round trip',
      revived.wheel.dayKey === r.state.wheel.dayKey && revived.wheel.spinsUsed === 1 && revived.wheel.lastSpin?.slotId === 'gems-35')
    ok('T26 a spin after a reload is refused',
      spin(revived, 'gems-500', T0 + 5000, 'after-reload').events.some(e => e.type === 'WHEEL_REFUSED'))
    ok('T26 a bad draw is refused',
      run(fresh(), A.SPIN_WHEEL, { roll: 1000, spinId: 'x' }, T0).events.some(e => e.reason === 'bad-roll') &&
      run(fresh(), A.SPIN_WHEEL, { roll: 2.5, spinId: 'y' }, T0).events.some(e => e.reason === 'bad-roll'))
  }

  /* ── TEST 27: the allowance resets at UTC midnight, and the clock guard ── */
  {
    const s = spin(fresh(), 'xp-25').state
    const midnight = wheelSvc.nextResetAt(T0)
    ok('T27 still spent a minute before the reset', wheelSvc.getWheelView(s, midnight - 60000).available === false)
    ok('T27 a new spin a minute after it', wheelSvc.getWheelView(s, midnight + 60000).available === true)
    const next = spin(s, 'gems-20', midnight + 60000)
    ok('T27 the next day spins for real', next.state.wheel.totalSpins === 2 && next.state.gems === s.gems + 20)

    /* Set the clock forward, spin, set it back: spins pause instead of
       handing out another one. */
    const ahead = spin(fresh(), 'gems-20', T0 + 3 * DAY).state
    const back = wheelSvc.getWheelView(ahead, T0)
    ok('T27 a clock set back pauses spins', back.available === false && back.clockBlocked === true)
    ok('T27 a clock set back is refused by the reducer',
      spin(ahead, 'gems-20', T0, 'back').events.some(e => e.reason === 'clock'))
    ok('T27 small drift is tolerated',
      wheelSvc.getWheelView(spin(fresh(), 'gems-20', T0).state, T0 - 60000).clockBlocked === false)
  }

  /* ── TEST 28: every reward type lands through the central systems ── */
  {
    const xp = spin({ ...fresh(), xp: 95, level: 1 }, 'xp-25')
    ok('T28 XP is paid', xp.state.xp === 120, xp.state.xp)
    ok('T28 XP counts toward the daily goal', xp.state.daily.xp >= 25, xp.state.daily.xp)
    ok('T28 XP can level the learner up', xp.events.some(e => e.type === 'LEVEL_UP'))

    const shield = spin(fresh(), 'shield')
    ok('T28 a shield lands in the bank', shield.state.streak.shields === 1, shield.state.streak.shields)
    const full = { ...fresh(), streak: { ...fresh().streak, shields: shop.SHIELD.MAX_OWNED } }
    const swapped = spin(full, 'shield')
    const ev = swapped.events.find(e => e.type === 'WHEEL_SPUN')
    ok('T28 a full shield bank pays the fallback', swapped.state.gems === full.gems + 75 && ev?.substituted === true, swapped.state.gems)
    ok('T28 shields stay capped', swapped.state.streak.shields === shop.SHIELD.MAX_OWNED)

    const jackpot = spin(fresh(), 'gems-500')
    ok('T28 the jackpot pays 500 gems', jackpot.state.ledger.some(e => e.reason === 'wheel:gems-500' && e.amount === 500) && jackpot.state.gems >= fresh().gems + 500, jackpot.state.gems)
    ok('T28 jackpots are counted', jackpot.state.wheel.jackpots === 1)
    ok('T28 wheel gems are spendable', shopSvc.getAvailability(jackpot.state, 'streak_shield').ok === true)
  }

  /* ── TEST 29: the draw does not depend on the learner ── */
  {
    const rich = { ...fresh(), gems: 99999, xp: 50000 }
    const poor = { ...fresh(), gems: 0 }
    const same = (roll) => run(rich, A.SPIN_WHEEL, { roll, spinId: `r${roll}` }, T0).events.find(e => e.type === 'WHEEL_SPUN')?.slotId
      === run(poor, A.SPIN_WHEEL, { roll, spinId: `p${roll}` }, T0).events.find(e => e.type === 'WHEEL_SPUN')?.slotId
    ok('T29 the same draw gives the same slot whatever the balance', [0, 299, 300, 650, 994, 995, 999].every(same))
  }

  /* ── TEST 30: the reviewer can bank spins; nobody else can ── */
  {
    const learner = run(fresh(), A.JUDGE, { op: 'spins', count: 5 }, T0).state
    ok('T30 an ordinary learner cannot bank spins', learner.wheel.extraSpins === 0)
    const judged = run(run(fresh(), A.JUDGE, { op: 'enable', stock: false }, T0).state, A.JUDGE, { op: 'spins', count: 2 }, T0).state
    ok('T30 the reviewer banks spins', wheelSvc.getWheelView(judged, T0).spinsLeft === 3, wheelSvc.getWheelView(judged, T0).spinsLeft)
    let s = judged
    for (let i = 0; i < 3; i++) s = spin(s, 'gems-20', T0, `j${i}`).state
    ok('T30 banked spins are real spins', s.wheel.totalSpins === 3 && s.wheel.extraSpins === 0, s.wheel.totalSpins)
    ok('T30 the bank is capped', run(judged, A.JUDGE, { op: 'spins', count: 99 }, T0).state.wheel.extraSpins === wheelCfg.WHEEL.EXTRA_SPINS_MAX)
  }

  /* ── TEST 31: corrupted, absent or old wheel state degrades safely ── */
  {
    ok('T31 a missing block falls back to a fresh wheel', store.sanitizeState({ xp: 10 }, T0).wheel.totalSpins === 0)
    ok('T31 spins used are clamped', store.sanitizeState({ wheel: { spinsUsed: 99 } }, T0).wheel.spinsUsed === wheelCfg.WHEEL.SPINS_PER_DAY)
    ok('T31 a garbage day key is dropped', store.sanitizeState({ wheel: { dayKey: 'yesterday' } }, T0).wheel.dayKey === null)
    ok('T31 a forged extra-spin count is capped',
      store.sanitizeState({ wheel: { extraSpins: 1e9 } }, T0).wheel.extraSpins === wheelCfg.WHEEL.EXTRA_SPINS_MAX)
    const v1 = store.migrate({ version: 1, xp: 40, dailyBonus: { cycleDay: 3 }, lessonParts: { 'm01-l01': 2 } })
    ok('T31 a version-1 save migrates', v1.version === 2 && !('dailyBonus' in v1) && v1.wheel && Object.keys(v1.lessonParts).length === 0)
    const loaded = store.sanitizeState(v1, T0)
    ok('T31 a migrated save has a spin waiting', wheelSvc.getWheelView(loaded, T0).available === true)
  }

  /* ── TEST 32: a completed daily quest left unclaimed is paid at the reset ── */
  {
    const s = fresh()
    const quest = s.quests.daily[0]
    const done = {
      ...s,
      quests: { ...s.quests, daily: s.quests.daily.map((q, i) => (i === 0 ? { ...q, completed: true, progress: q.target } : q)) },
    }
    const r = run(done, A.RECONCILE, {}, T0 + DAY)
    ok('T32 the daily set rolled over', r.state.quests.dailyKey === putils_today(T0 + DAY), r.state.quests.dailyKey)
    ok('T32 the unclaimed reward was paid', r.state.gems === done.gems + quest.reward.gems, `${r.state.gems} vs ${done.gems + quest.reward.gems}`)
    ok('T32 the payout is announced as automatic',
      r.events.some(e => e.type === 'QUEST_CLAIMED' && e.auto === true && e.quest.id === quest.id))
    ok('T32 the archive shows it claimed', r.state.quests.archive[0]?.quests.find(q => q.id === quest.id)?.claimed === true)
    ok('T32 the claim counts in stats', r.state.stats.totalQuestsClaimed === 1, r.state.stats.totalQuestsClaimed)
    /* An unfinished quest is NOT paid. */
    const idle = run(s, A.RECONCILE, {}, T0 + DAY)
    ok('T32 an unfinished quest pays nothing', idle.state.gems === s.gems && !idle.events.some(e => e.type === 'QUEST_CLAIMED'))
  }

  /* ── TEST 33: a finished team mission left unclaimed is paid when the week ends ── */
  {
    const s = fresh()
    const done = { ...s, team: { ...s.team, contribution: s.team.goal } }
    const r = run(done, A.RECONCILE, {}, T0 + 7 * DAY)
    ok('T33 a new mission was drawn', r.state.team.weekKey !== done.team.weekKey && r.state.team.claimed === false)
    /* The ledger carries the mission payout itself; the first completed
       mission also unlocks the team-player achievement, which pays on top. */
    ok('T33 the shared reward was paid',
      r.state.ledger.some(e => e.reason === 'team-mission' && e.amount === cfg.TEAM.REWARD_GEMS) && r.state.gems >= done.gems + cfg.TEAM.REWARD_GEMS,
      `${r.state.gems} gems`)
    ok('T33 the payout is announced as automatic', r.events.some(e => e.type === 'TEAM_MISSION_CLAIMED' && e.auto === true))
    ok('T33 the mission counts as completed', r.state.stats.totalTeamMissionsCompleted === 1)
    /* Already claimed → not paid twice. */
    const claimed = { ...done, team: { ...done.team, claimed: true } }
    const again = run(claimed, A.RECONCILE, {}, T0 + 7 * DAY)
    ok('T33 a claimed mission is not paid again', again.state.gems === claimed.gems)
  }

  /* ── TEST 34: an action a moment after midnight lands in the new day ── */
  {
    const s = fresh()                       // reconciled at noon
    const justPastMidnight = T0 + 12 * 3600000 + 60000
    const r = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: false, seconds: 60, accuracy: 1 }, justPastMidnight)
    ok('T34 the day rolled over first', r.events[0]?.type === 'DAY_ROLLOVER', r.events[0]?.type)
    ok('T34 the lesson is in today\'s bucket', r.state.daily.dateKey === putils_today(justPastMidnight) && r.state.daily.lessons === 1,
      `${r.state.daily.dateKey} lessons=${r.state.daily.lessons}`)
    ok('T34 today\'s XP is not zero', r.state.daily.xp > 0, r.state.daily.xp)
    ok('T34 the daily quests are today\'s', r.state.quests.dailyKey === putils_today(justPastMidnight))
    /* A later reconcile changes nothing — the work was not wiped. */
    const later = run(r.state, A.RECONCILE, {}, justPastMidnight + 15000)
    ok('T34 a reconcile keeps the work', later.state.daily.lessons === 1 && later.state.daily.xp === r.state.daily.xp)
    /* Same day: no rollover is inserted. */
    const sameDay = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: false, seconds: 60, accuracy: 1 }, T0 + 60000)
    ok('T34 no rollover on the same day', !sameDay.events.some(e => e.type === 'DAY_ROLLOVER'))
  }

  /* ── TEST 35: a corrupt team record cannot take the app down ── */
  {
    const bad = store.sanitizeState({ team: { missionKey: 'reach-the-moon', members: 'nope' } }, T0)
    ok('T35 a malformed mission record is dropped', bad.team === null)
    let threw = false
    let settled = null
    try { settled = prog.reconcile(bad, T0).state; prog.buildViewModel(settled, T0) } catch { threw = true }
    ok('T35 reconcile and the view model survive', !threw)
    ok('T35 a fresh mission is drawn', !!settled?.team?.missionKey, settled?.team?.missionKey)
    const good = store.sanitizeState({ team: fresh().team }, T0)
    ok('T35 a valid record is kept', good.team?.missionKey === fresh().team.missionKey)
  }

  /* ── TEST 36: a heart the clock already returned is not sold again ── */
  {
    const s = { ...fresh(), hearts: 4, heartAnchor: T0 - 31 * 60000 }
    ok('T36 availability sees the regenerated heart', shopSvc.getAvailability(s, 'extra_heart', T0).ok === false
      && shopSvc.getAvailability(s, 'extra_heart', T0).reason === 'hearts-full')
    const r = run(s, A.PURCHASE_ITEM, { itemId: 'extra_heart', txnId: 'regen1' }, T0)
    ok('T36 the purchase is refused as hearts-full',
      r.events.some(e => e.type === 'PURCHASE_FAILED' && e.reason === 'hearts-full'), r.events.map(e => e.type).join())
    ok('T36 no gems were spent', r.state.gems === s.gems, r.state.gems)
    ok('T36 the regenerated heart is kept', r.state.hearts === 5 && r.state.heartAnchor === null, `${r.state.hearts} anchor=${r.state.heartAnchor}`)
    /* Genuinely short by one heart, the purchase still works. */
    const short = { ...fresh(), hearts: 4, heartAnchor: T0 - 5 * 60000 }
    const bought = run(short, A.PURCHASE_ITEM, { itemId: 'extra_heart', txnId: 'regen2' }, T0)
    ok('T36 a real gap is still sold', bought.state.hearts === 5 && bought.state.gems === short.gems - shop.EXTRA_HEART_COST)
  }

  /* ── TEST 38: a minutes mission counts seconds, not per-lesson floors ── */
  {
    let s = fresh()
    s = { ...s, team: { ...s.team, missionKey: 'study-squad', contribution: 0, contributionSeconds: 0 } }
    const ids = learn.SECTIONS[0].lessons.slice(0, 3).map(l => l.id)
    for (const id of ids) s = run(s, A.COMPLETE_LESSON, { lessonId: id, perfect: false, seconds: 50, accuracy: 1 }, T0).state
    ok('T38 150 seconds contribute 2 minutes', s.team.contribution === 2 && s.team.contributionSeconds === 150,
      `${s.team.contribution} min, ${s.team.contributionSeconds} s`)
    ok('T38 matches the solo time metric', quests.METRICS.SPEND_TIME(s, 'daily') === 2, quests.METRICS.SPEND_TIME(s, 'daily'))
  }

  /* ── TEST 39: calendar, squad and daily XP all read the XP actually paid ── */
  {
    let s = fresh()
    s = { ...s, team: { ...s.team, missionKey: 'reach-the-moon', contribution: 0 } }
    for (let i = 0; i < 4; i++) s = run(s, A.RECORD_ANSWER, { lessonId: L0, correct: true, maxAnswerXP: 35 }, T0).state
    ok('T39 four answers pay 20 XP', s.xp === 20, s.xp)
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 120, accuracy: 1 }, T0).state
    const today = putils_today(T0)
    ok('T39 daily XP is 70', s.daily.xp === 70, s.daily.xp)
    ok('T39 the calendar shows 70', s.streak.history[today]?.xp === 70, s.streak.history[today]?.xp)
    ok('T39 the squad shows 70', s.team.contribution === 70, s.team.contribution)
  }

  /* ── TEST 40: the stored level is re-derived from XP on load ── */
  {
    const inflated = store.sanitizeState({ xp: 0, level: 40, levelRewardedUpTo: 40 }, T0)
    ok('T40 level 40 with no XP loads as level 1', inflated.level === 1, inflated.level)
    ok('T40 the reward marker cannot exceed the level', inflated.levelRewardedUpTo === 1, inflated.levelRewardedUpTo)
    const earned = store.sanitizeState({ xp: 250, level: 1, levelRewardedUpTo: 3 }, T0)
    ok('T40 250 XP loads as level 3', earned.level === 3 && earned.levelRewardedUpTo === 3, `${earned.level}/${earned.levelRewardedUpTo}`)
  }

  /* ── TEST 41: gems the rollover pays out belong to the old day ── */
  {
    const s = fresh()
    const done = {
      ...s,
      quests: { ...s.quests, daily: s.quests.daily.map((q, i) => (i === 0 ? { ...q, completed: true, progress: q.target } : q)) },
    }
    const r = run(done, A.RECONCILE, {}, T0 + DAY)
    ok('T41 the reward was paid', r.state.gems > done.gems, `${done.gems} -> ${r.state.gems}`)
    ok('T41 the new day starts with no gems earned', r.state.daily.gems === 0, r.state.daily.gems)
    ok('T41 rollover events keep their order',
      r.events[0]?.type === 'DAY_ROLLOVER' && r.events.findIndex(e => e.type === 'QUEST_CLAIMED') < r.events.findIndex(e => e.type === 'DAILY_QUESTS_GENERATED'),
      r.events.map(e => e.type).join())
  }

  /* ── TEST 42: a squad member without a name is a corrupt record ── */
  {
    const base = fresh().team
    const nameless = { ...base, members: base.members.map(({ name: _name, ...m }) => m) }
    ok('T42 a nameless member drops the record', store.sanitizeState({ team: nameless }, T0).team === null)
    const seconds = store.sanitizeState({ team: { ...base, contributionSeconds: undefined } }, T0).team
    ok('T42 missing seconds default to 0', seconds?.contributionSeconds === 0)
  }

  /* ── TEST 43: every dealt quest is reachable, at every level and course position ── */
  {
    const order = learn.SECTIONS.flatMap(sec => sec.lessons.map(l => l.id))
    const total = order.length
    const violations = []
    for (let level = 1; level <= 30; level++) {
      for (let remaining = 0; remaining <= total; remaining++) {
        const lessons = {}
        for (const id of order.slice(0, total - remaining)) lessons[id] = { firstCompletedAt: T0, lastCompletedAt: T0, attempts: 1, perfect: true, bestAccuracy: 1 }
        const xp = 25 * (level - 1) * (level + 2)
        const s = { ...fresh(), xp, level, lessons, createdAt: T0 + level * 7 + remaining }
        const ctx = quests.buildContext(s)
        for (const q of [...quests.generateDailyQuests(s, T0), ...quests.generateWeeklyQuests(s, T0)]) {
          if (q.type === 'COMPLETE_LESSONS' && q.target > ctx.lessonsRemaining) violations.push(`${q.id} L${level} rem${remaining} target ${q.target}`)
          if (q.type === 'COMPLETE_SECTION' && q.target > ctx.sectionsRemaining) violations.push(`${q.id} L${level} rem${remaining} target ${q.target}/${ctx.sectionsRemaining}`)
        }
      }
    }
    ok('T43 no dealt quest asks for more than the course has left', violations.length === 0, violations.slice(0, 4).join(' | '))
  }

  /* ── TEST 44: the demo learner is settled — nothing pays out on its first tick ── */
  {
    const seeds = [['showcase', showcase.getShowcaseState()]]
    for (const [name, seed] of seeds) {
      const r = prog.reduce(seed, { type: A.RECONCILE }, Date.now())
      ok(`T44 ${name} seed unlocks nothing on reconcile`, !r.events.some(e => e.type === 'ACHIEVEMENT_UNLOCKED'), r.events.map(e => e.type).join())
      ok(`T44 ${name} seed keeps its gems`, r.state.gems === seed.gems && seed.gems === 410, `${seed.gems} -> ${r.state.gems}`)
    }
  }

  /* ── TEST 45: the reviewer's profile ────────────────────────────────────────
     The whole claim of the judge controls is that they are not a shortcut
     around the engine — they ARE the engine. These check that, and that the
     powers cannot leak onto an ordinary profile. */
  {
    const judged = (s) => run(s, A.JUDGE, { op: 'enable', stock: true }, T0).state
    const j = judged(fresh())

    ok('T45 the profile is stocked', j.gems >= 999999 && j.hearts === 100 && j.maxHearts === 100,
      `${j.gems} gems, ${j.hearts}/${j.maxHearts}`)
    ok('T45 the powers are all on', j.judge.powers.infiniteGems && j.judge.powers.unlockAll && j.judge.powers.chips)

    /* Every module is reachable without earning the one before it. */
    const openCourse = prog.buildViewModel(j, T0).course
    ok('T45 every module is unlocked', openCourse.sections.every((sec) => sec.unlocked),
      openCourse.sections.filter((sec) => !sec.unlocked).map((sec) => sec.id).join(','))
    const shutCourse = prog.buildViewModel(fresh(), T0).course
    ok('T45 an ordinary profile still locks them', shutCourse.sections.filter((sec) => !sec.unlocked).length > 0)

    /* A skipped lesson pays exactly what a finished one pays. */
    const skipped = run(j, A.JUDGE, { op: 'completeLesson', lessonId: L0 }, T0)
    const played = run(j, A.COMPLETE_LESSON, { lessonId: L0, perfect: true, seconds: 120, accuracy: 1 }, T0)
    ok('T45 a skipped lesson pays the same XP', skipped.state.xp === played.state.xp, `${skipped.state.xp} vs ${played.state.xp}`)
    ok('T45 it counts as a real completion', skipped.state.stats.totalLessonsCompleted === 1)
    ok('T45 it keeps the streak', skipped.state.streak.current === 1, skipped.state.streak.current)
    ok('T45 it emits the completion event', skipped.events.some((e) => e.type === 'LESSON_COMPLETE'))

    /* A whole module, and the section bonus that comes with it. */
    const mod = run(j, A.JUDGE, { op: 'completeSection', sectionId: learn.SECTIONS[0].id }, T0)
    ok('T45 a module completes all of its lessons',
      learn.getSectionById(learn.SECTIONS[0].id).lessons.every((l) => mod.state.lessons[l.id]))
    ok('T45 the section bonus is paid once', !!mod.state.sectionsCompleted[learn.SECTIONS[0].id])
    ok('T45 the next module unlocks',
      prog.buildViewModel({ ...mod.state, judge: null }, T0).course.sections[1].unlocked)

    /* Emptying it puts the course, and the section stamp, back. */
    const emptied = run(mod.state, A.JUDGE, { op: 'resetSection', sectionId: learn.SECTIONS[0].id }, T0)
    ok('T45 emptying a module forgets its lessons', Object.keys(emptied.state.lessons).length === 0)
    ok('T45 and forgets the section stamp', !emptied.state.sectionsCompleted[learn.SECTIONS[0].id])

    /* The purse tops itself up, but only while the power is on. */
    const spent = run(j, A.SPEND_GEMS, { amount: 200000, reason: 'test' }, T0)
    ok('T45 an unlimited purse refills', spent.state.gems === 999999, spent.state.gems)
    const normal = run(j, A.JUDGE, { op: 'powers', powers: { infiniteGems: false } }, T0).state
    const spentAgain = run(normal, A.SPEND_GEMS, { amount: 200000, reason: 'test' }, T0)
    ok('T45 switching it off lets gems actually fall', spentAgain.state.gems === normal.gems - 200000, spentAgain.state.gems)

    /* Setting a streak writes the days behind it. */
    const streaked = run(j, A.JUDGE, { op: 'streak', days: 7 }, T0).state
    ok('T45 a set streak reads back', streaked.streak.current === 7)
    ok('T45 and the history agrees with it', Object.keys(streaked.streak.history).length >= 7,
      Object.keys(streaked.streak.history).length)

    /* Setting a level holds the XP that level begins at. */
    const levelled = run(j, A.JUDGE, { op: 'level', level: 5 }, T0).state
    ok('T45 a set level is derived from real XP',
      putils.getLevelFromXP(levelled.xp) === 5 && levelled.level === 5, `${levelled.level} at ${levelled.xp} XP`)

    /* Quests are FILLED, not claimed: claiming stays the learner's press. */
    const filled = run(j, A.JUDGE, { op: 'completeQuests', scope: 'daily' }, T0).state
    ok('T45 filling quests completes them', filled.quests.daily.every((q) => q.completed))
    ok('T45 but does not claim them', filled.quests.daily.every((q) => !q.claimed))
    ok('T45 and does not pay out yet', filled.gems === j.gems, `${filled.gems} vs ${j.gems}`)

    /* Badges: the grid must not show a full seal beside "0 of 30". */
    const badged = run(j, A.JUDGE, { op: 'unlockBadges' }, T0).state
    ok('T45 every badge unlocks', Object.keys(badged.achievements).length > 0)

    /* The powers cannot ride along in a stored blob. */
    const smuggled = store.sanitizeState({ ...j, judge: { powers: { unlockAll: true } } }, T0)
    ok('T45 a stored blob keeps its powers only as data', !!smuggled.judge)
    const stripped = run(smuggled, A.JUDGE, { op: 'disable' }, T0).state
    ok('T45 disabling removes the powers', stripped.judge === null)
    ok('T45 and brings the numbers back to a learner\'s', stripped.hearts === 5 && stripped.maxHearts === 5 && stripped.gems <= 500,
      `${stripped.gems} gems, ${stripped.hearts}/${stripped.maxHearts}`)
    ok('T45 an ordinary profile has no powers at all', fresh().judge === null)
    ok('T45 and a judge op on one does nothing',
      run(fresh(), A.JUDGE, { op: 'topUp' }, T0).state.gems === 100,
      run(fresh(), A.JUDGE, { op: 'topUp' }, T0).state.gems)
  }

  /* ── TEST 46: the curriculum's shape (redesign, 2026-09) ── */
  {
    ok('T46 three parts', learn.PARTS.length === 3, learn.PARTS.length)
    ok('T46 seven modules', learn.SECTIONS.length === 7, learn.SECTIONS.length)
    ok('T46 twenty-one lessons proper', learn.TOTAL_LESSONS === 21, learn.TOTAL_LESSONS)
    ok('T46 every module is in exactly one part',
      learn.SECTIONS.every((s) => learn.PARTS.filter((p) => p.modules.includes(s.id)).length === 1))
    ok('T46 every module has a Field Kit tool', learn.SECTIONS.every((s) => s.fieldKit?.name && s.fieldKit.questions.length >= 2))
    ok('T46 item ids are unique', new Set(learn.ALL_LESSONS.map((l) => l.id)).size === learn.ALL_LESSONS.length)
    ok('T46 lesson numbers read 1.1 to 7.2', learn.lessonNumber('m01-l01') === '1.1' && learn.lessonNumber('m07-l02') === '7.2' && learn.lessonNumber('m01-case') === null)
    ok('T46 the capstone closes the course', learn.ALL_LESSONS[learn.ALL_LESSONS.length - 1].kind === 'capstone')
  }

  /* ── TEST 47: a Case File completes like a lesson but is not one ── */
  {
    let s = fresh()
    const caseId = learn.SECTIONS[0].lessons.find((l) => l.kind === 'casefile').id
    const r = run(s, A.COMPLETE_LESSON, { lessonId: caseId, perfect: true, seconds: 60, accuracy: 1 }, T0)
    s = r.state
    ok('T47 a Case File pays its own XP', r.events.some((e) => e.type === 'XP_AWARDED' && e.amount === cfg.XP.ITEM.casefile))
    ok('T47 it is not counted as a lesson', s.stats.totalLessonsCompleted === 0 && s.daily.lessons === 0, `${s.stats.totalLessonsCompleted}/${s.daily.lessons}`)
    ok('T47 but it keeps the streak', s.streak.current === 1, s.streak.current)
    ok('T47 and the course counts it as an item', learn.deriveCourse(s.lessons).completedItems === 1 && learn.deriveCourse(s.lessons).completedCount === 0)
  }

  /* ── TEST 48: a module unlocks only after its Case File ── */
  {
    let s = fresh()
    const [first, second] = learn.SECTIONS
    for (const l of first.lessons.filter((x) => x.kind === 'lesson')) s = run(s, A.COMPLETE_LESSON, { lessonId: l.id, seconds: 30 }, T0).state
    ok('T48 lessons alone leave the next module locked', learn.deriveCourse(s.lessons).sections[1].status === 'locked')
    s = run(s, A.COMPLETE_LESSON, { lessonId: first.lessons.find((x) => x.kind === 'casefile').id, seconds: 30 }, T0).state
    ok('T48 the Case File unlocks it', learn.deriveCourse(s.lessons).sections[1].status !== 'locked')
    ok('T48 and earns the module Field Kit badge', !!s.achievements[`kit-${first.id}`])
    ok('T48 the next module first lesson is current', learn.deriveCourse(s.lessons).current.lesson.id === second.lessons[0].id)
  }

  /* ── TEST 49: resume points ── */
  {
    let s = fresh()
    s = run(s, A.SAVE_PART, { lessonId: L0, part: 1 }, T0).state
    ok('T49 a finished part is remembered', s.lessonParts[L0] === 1)
    s = run(s, A.SAVE_PART, { lessonId: L0, part: 2 }, T0).state
    s = run(s, A.SAVE_PART, { lessonId: L0, part: 1 }, T0).state
    ok('T49 it never moves backwards', s.lessonParts[L0] === 2, s.lessonParts[L0])
    const restored = store.sanitizeState(JSON.parse(JSON.stringify(s)), T0)
    ok('T49 it survives a reload', restored.lessonParts[L0] === 2)
    s = run(s, A.COMPLETE_LESSON, { lessonId: L0, seconds: 30 }, T0).state
    ok('T49 finishing the item clears it', s.lessonParts[L0] === undefined)
    ok('T49 unknown items are refused', run(fresh(), A.SAVE_PART, { lessonId: 'nope', part: 1 }, T0).state.lessonParts.nope === undefined)
    ok('T49 resume points pay nothing', run(fresh(), A.SAVE_PART, { lessonId: L0, part: 1 }, T0).state.xp === 0)
  }

  /* ── TEST 50: the Field Journal ── */
  {
    let s = fresh()
    s = run(s, A.SAVE_JOURNAL, { lessonId: L0, entry: { kind: 'prediction', key: 'explore:p1', prompt: 'Q?', text: 'A', confidence: 'sure', correct: false } }, T0).state
    s = run(s, A.SAVE_JOURNAL, { lessonId: L0, entry: { kind: 'reflection', key: 'check:carry', prompt: 'Why?', text: 'Because.' } }, T0).state
    ok('T50 entries are kept', s.journal[L0].entries.length === 2)
    s = run(s, A.SAVE_JOURNAL, { lessonId: L0, entry: { kind: 'reflection', key: 'check:carry', prompt: 'Why?', text: 'Because, revised.' } }, T0).state
    ok('T50 a same-key entry is replaced, not duplicated', s.journal[L0].entries.length === 2 && s.journal[L0].entries[1].text === 'Because, revised.')
    ok('T50 a confident miss is recorded as such', s.journal[L0].entries[0].confidence === 'sure' && s.journal[L0].entries[0].correct === false)
    const restored = store.sanitizeState(JSON.parse(JSON.stringify(s)), T0)
    ok('T50 the journal survives a reload', restored.journal[L0].entries.length === 2)
    ok('T50 junk entries are refused', run(fresh(), A.SAVE_JOURNAL, { lessonId: L0, entry: { kind: 'essay', key: 'x', prompt: '' } }, T0).state.journal[L0] === undefined)
    ok('T50 writing pays nothing', s.xp === 0)
  }

  /* ── TEST 51: missed Check items come back in Practice ── */
  {
    let s = fresh()
    const key = `${L0}:check:c1`
    s = run(s, A.RECORD_ANSWER, { lessonId: L0, correct: false, maxAnswerXP: 25, reviewKey: key }, T0).state
    ok('T51 a missed Check item is flagged', s.review[key]?.lessonId === L0)
    ok('T51 and still costs its heart', s.hearts === 4, s.hearts)
    s = run(s, A.COMPLETE_PRACTICE, { seconds: 60, correct: 1, total: 5, cleared: [key] }, T0).state
    ok('T51 answering it right in Practice clears it', s.review[key] === undefined)
  }

  /* ── TEST 52: the scans ── */
  {
    let s = fresh()
    s = run(s, A.RECORD_SCAN, { which: 'launch', form: 'A', answers: { a1: { correct: true, confidence: 'sure' }, a2: { correct: false, confidence: 'sure' } } }, T0).state
    ok('T52 the Launch Scan is stored', s.scans.launch.correct === 1 && s.scans.launch.total === 2)
    ok('T52 and pays nothing', s.xp === 0 && s.gems === 100)
    s = run(s, A.RECORD_SCAN, { which: 'final', form: 'B', answers: { b1: { correct: true, confidence: 'think' }, b2: { correct: true, confidence: 'sure' } } }, T0).state
    ok('T52 the Final Scan sits beside it', s.scans.final.correct === 2 && s.scans.launch.correct === 1)
    const restored = store.sanitizeState(JSON.parse(JSON.stringify(s)), T0)
    ok('T52 both survive a reload', restored.scans.final.form === 'B' && restored.scans.launch.total === 2)
    ok('T52 an unknown scan is refused', run(fresh(), A.RECORD_SCAN, { which: 'midterm', answers: {} }, T0).state.scans.midterm === undefined)
  }

  /* ── TEST 53: the demo learner runs on the new course ── */
  {
    const demo = showcase.getShowcaseState()
    ok('T53 the demo learner has finished Module 1', !!demo.sectionsCompleted[learn.SECTIONS[0].id])
    ok('T53 and is part-way through Module 2', learn.deriveCourse(demo.lessons).current?.section.id === learn.SECTIONS[1].id)
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
