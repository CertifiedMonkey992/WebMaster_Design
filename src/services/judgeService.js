/* ═══════════════════════════════════════════════════════════════════════════
   judgeService.js — WHAT THE REVIEWER'S CONTROLS ACTUALLY DO
   ---------------------------------------------------------------------------
   A judge has minutes; the course has hours in it. These operations let one
   click stand in for the work — finish a lesson, fill a module, complete a
   quest, move the calendar on a day — and they do it BY RUNNING THE REAL
   ENGINE, not by drawing a result.

   That distinction is the whole point. `completeLesson` here calls the same
   progressionService.completeLesson a finished lesson calls, so the XP, the
   gems, the section bonus, the streak, the quests, the achievements, the
   team mission and every reward animation happen exactly as they would have
   after five minutes of quiz. A judge who presses "Complete" and a learner
   who answers every question reach the same state, because it is the same
   code path.

   Pure, like every other service here: (state, payload, now) → { state,
   events }. The helpers it needs from progressionService (awardXP,
   completeLesson, reconcile) are injected rather than imported, so the
   dependency keeps pointing one way.
   ═══════════════════════════════════════════════════════════════════════════ */

import { JUDGE_GEMS, JUDGE_GEM_FLOOR, JUDGE_HEARTS, JUDGE_SHIELDS, normalizePowers } from '../config/judgeConfig'
import { SHIELD } from '../config/shopConfig'
import { getXPForLevel, clamp } from '../utils/progressionUtils'
import { getLocalDateKey, addDays } from '../utils/dateUtils'
import { ACHIEVEMENTS } from '../data/achievements'
import { SECTIONS, getSectionById } from '../data/learnData'
import currency from './currencyService'
import { emptyDaily } from './storageService'

/** Every operation the reviewer's controls can ask for. */
export const OPS = {
  ENABLE:            'enable',
  DISABLE:           'disable',
  POWERS:            'powers',
  TOP_UP:            'topUp',
  GEMS:              'gems',
  HEARTS:            'hearts',
  XP:                'xp',
  LEVEL:             'level',
  STREAK:            'streak',
  SHIELDS:           'shields',
  COMPLETE_LESSON:   'completeLesson',
  RESET_LESSON:      'resetLesson',
  COMPLETE_SECTION:  'completeSection',
  RESET_SECTION:     'resetSection',
  COMPLETE_COURSE:   'completeCourse',
  RESET_COURSE:      'resetCourse',
  COMPLETE_QUEST:    'completeQuest',
  COMPLETE_QUESTS:   'completeQuests',
  COMPLETE_MISSION:  'completeMission',
  UNLOCK_BADGES:     'unlockBadges',
  RESET_BADGES:      'resetBadges',
}

/** Is this profile the reviewer's? */
export const isJudge = (state) => Boolean(state?.judge)

/** One power's value, false when this is not a reviewer profile. */
export const hasPower = (state, id) => Boolean(state?.judge?.powers?.[id])

/* ── Small helpers ───────────────────────────────────────────────────────── */

const done = (state, events = []) => ({ state, events })

/** Top the reviewer's resources back up to the numbers the profile promises. */
function grantResources(state) {
  return {
    ...state,
    gems: Math.max(state.gems, JUDGE_GEMS),
    maxHearts: Math.max(state.maxHearts, JUDGE_HEARTS),
    hearts: JUDGE_HEARTS,
    heartAnchor: null,
    streak: {
      ...state.streak,
      shields: Math.max(state.streak.shields, Math.min(JUDGE_SHIELDS, SHIELD.MAX_OWNED)),
    },
  }
}

/**
 * Keep an unlimited purse unlimited. Called from the progression pipeline
 * after every action, so a reviewer can spend on anything, as often as they
 * like, and never meet a wall — while the spend itself still ran through the
 * real shop rules and still animated.
 */
export function topUpGems(state) {
  if (!hasPower(state, 'infiniteGems') || state.gems >= JUDGE_GEM_FLOOR) return state
  return { ...state, gems: JUDGE_GEMS }
}

/** Mark every lesson of a set complete, through the real completion path. */
function completeLessons(state, lessonIds, now, deps) {
  const acc = { state, events: [] }
  for (const id of lessonIds) {
    if (acc.state.lessons[id]) continue
    const result = deps.completeLesson(acc.state, {
      lessonId: id, perfect: true, seconds: 120, accuracy: 1,
    }, now)
    acc.state = result.state
    acc.events.push(...result.events)
  }
  return acc
}

/** Forget a set of lessons, and any section bonus they had paid for. */
function forgetLessons(state, lessonIds) {
  const ids = new Set(lessonIds)
  const lessons = { ...state.lessons }
  const answerXP = { ...state.answerXP }
  for (const id of ids) { delete lessons[id]; delete answerXP[id] }

  /* A section is only "complete" while every one of its lessons is, so the
     ones this emptied lose their stamp too. */
  const sectionsCompleted = { ...state.sectionsCompleted }
  for (const section of SECTIONS) {
    if (section.lessons.some((l) => ids.has(l.id))) delete sectionsCompleted[section.id]
  }
  return { ...state, lessons, answerXP, sectionsCompleted }
}

/** Push a set of quests to their target so they can be claimed for real. */
function fillQuests(state, pick, now) {
  const fill = (q) => (q.completed || !pick(q)
    ? q
    : { ...q, progress: q.target, completed: true, completedAt: now })
  return {
    ...state,
    quests: {
      ...state.quests,
      daily: state.quests.daily.map(fill),
      weekly: state.quests.weekly.map(fill),
    },
  }
}

/* ── The reducer's one entry point ───────────────────────────────────────────
   `deps` carries the progression helpers: { awardXP, completeLesson,
   reconcile, runPipeline }.
   ─────────────────────────────────────────────────────────────────────────── */
export function apply(state, payload = {}, now = Date.now(), deps = {}) {
  const { op } = payload

  /* The gate. Only `enable` may act on a profile that does not already hold
     the powers, and only the auth layer calls it — so no amount of
     dispatching from elsewhere can stock, unlock or fill an ordinary
     learner's profile. */
  if (!state.judge && op !== OPS.ENABLE) return done(state)

  switch (op) {
    /* Make this profile the reviewer's, and stock it. */
    case OPS.ENABLE: {
      const powers = normalizePowers(payload.powers ?? state.judge?.powers)
      let next = { ...state, judge: { powers } }
      if (payload.stock !== false) next = grantResources(next)
      return done(next, [{ type: 'JUDGE_ENABLED' }])
    }

    /* Hand the profile back to an ordinary learner: the powers go, and the
       numbers they inflated come back to something a learner could hold. */
    case OPS.DISABLE: {
      if (!state.judge) return done(state)
      const next = {
        ...state,
        judge: null,
        gems: Math.min(state.gems, 500),
        maxHearts: 5,
        hearts: 5,
        heartAnchor: null,
      }
      return done(next, [{ type: 'JUDGE_DISABLED' }])
    }

    case OPS.POWERS: {
      if (!state.judge) return done(state)
      const powers = normalizePowers({ ...state.judge.powers, ...payload.powers })
      return done({ ...state, judge: { powers } }, [{ type: 'JUDGE_POWERS', powers }])
    }

    case OPS.TOP_UP:
      return done(grantResources(state), [{ type: 'JUDGE_TOPPED_UP' }])

    /* ── Resources ── */
    case OPS.GEMS: {
      const amount = Math.floor(payload.amount ?? 0)
      if (amount === 0) return done(state)
      const result = amount > 0
        ? currency.awardGems(state, amount, 'judge')
        : currency.spendGems(state, -amount, 'judge')
      return done(result.state, result.events)
    }

    case OPS.HEARTS: {
      const amount = Math.floor(payload.amount ?? 0)
      if (amount === 0) return done(state)
      if (amount > 0) return currency.restoreHeart(state, amount, 'judge', now)
      const acc = { state, events: [] }
      for (let i = 0; i < -amount && acc.state.hearts > 0; i++) {
        const lost = currency.loseHeart(acc.state, 'judge', now)
        acc.state = lost.state
        acc.events.push(...lost.events)
      }
      return acc
    }

    case OPS.XP: {
      const amount = Math.floor(payload.amount ?? 0)
      if (amount > 0) return deps.awardXP(state, amount, 'judge')
      /* Taking XP away is a correction, not an award: the level follows the
         total, and the level-up bonus stays paid so re-crossing the level
         cannot mint gems twice. */
      const xp = Math.max(0, state.xp + amount)
      return done({ ...state, xp }, [{ type: 'JUDGE_XP_SET', total: xp }])
    }

    /* Levels are derived from XP, never stored independently, so "set the
       level" means "hold exactly the XP that level begins at". */
    case OPS.LEVEL: {
      const target = clamp(Math.floor(payload.level ?? state.level), 1, 99)
      const xp = getXPForLevel(target)
      if (xp > state.xp) {
        return deps.awardXP(state, xp - state.xp, 'judge-level')
      }
      return done(
        { ...state, xp, level: target },
        [{ type: 'JUDGE_LEVEL_SET', level: target }],
      )
    }

    /* A streak is a run of days, so setting one writes the history that run
       would have left: the panel's calendar, the milestones and the streak
       quests all read that history rather than the counter. */
    case OPS.STREAK: {
      const days = clamp(Math.floor(payload.days ?? 0), 0, 400)
      const today = getLocalDateKey(new Date(now))
      const history = { ...state.streak.history }
      for (let i = 0; i < days; i++) {
        const key = addDays(today, -i)
        history[key] = history[key] ?? { xp: 50, lessons: 1, seconds: 300 }
      }
      const next = {
        ...state,
        streak: {
          ...state.streak,
          current: days,
          longest: Math.max(state.streak.longest, days),
          lastActivityDate: days > 0 ? today : null,
          lastStreakDate: days > 0 ? today : null,
          history,
        },
      }
      return done(next, [{ type: 'JUDGE_STREAK_SET', streak: days }])
    }

    case OPS.SHIELDS: {
      const count = clamp(Math.floor(payload.count ?? SHIELD.MAX_OWNED), 0, SHIELD.MAX_OWNED)
      return done(
        { ...state, streak: { ...state.streak, shields: count } },
        [{ type: 'JUDGE_SHIELDS_SET', shields: count }],
      )
    }

    /* ── The course ── */
    case OPS.COMPLETE_LESSON:
      return completeLessons(state, [payload.lessonId].filter(Boolean), now, deps)

    case OPS.RESET_LESSON:
      return done(forgetLessons(state, [payload.lessonId].filter(Boolean)), [{ type: 'JUDGE_COURSE_CHANGED' }])

    case OPS.COMPLETE_SECTION: {
      const section = getSectionById(payload.sectionId)
      if (!section) return done(state)
      return completeLessons(state, section.lessons.map((l) => l.id), now, deps)
    }

    case OPS.RESET_SECTION: {
      const section = getSectionById(payload.sectionId)
      if (!section) return done(state)
      return done(forgetLessons(state, section.lessons.map((l) => l.id)), [{ type: 'JUDGE_COURSE_CHANGED' }])
    }

    case OPS.COMPLETE_COURSE:
      return completeLessons(state, SECTIONS.flatMap((s) => s.lessons.map((l) => l.id)), now, deps)

    case OPS.RESET_COURSE:
      return done(
        forgetLessons(state, SECTIONS.flatMap((s) => s.lessons.map((l) => l.id))),
        [{ type: 'JUDGE_COURSE_CHANGED' }],
      )

    /* ── Quests and badges ── */
    case OPS.COMPLETE_QUEST:
      return done(
        fillQuests(state, (q) => q.id === payload.questId, now),
        [{ type: 'JUDGE_QUESTS_FILLED' }],
      )

    case OPS.COMPLETE_QUESTS: {
      const scope = payload.scope
      return done(
        fillQuests(state, (q) => !scope || q.scope === scope, now),
        [{ type: 'JUDGE_QUESTS_FILLED' }],
      )
    }

    /* Fill the shared mission to one short of its goal, then let the real
       contribution path carry it over — so the completion event, its toast
       and its claim button all arrive the way they would on their own. */
    case OPS.COMPLETE_MISSION: {
      if (!state.team) return done(state)
      const team = state.team
      const next = {
        ...state,
        team: { ...team, contribution: Math.max(team.contribution, team.goalPerMember) },
      }
      return done(next, [{ type: 'JUDGE_MISSION_FILLED' }])
    }

    /* Badges unlock through achievementService on the next pipeline pass, so
       this grants what each one measures rather than stamping the badge:
       every bar in the grid then reads true instead of reading "0 of 30"
       beside a gold seal. */
    case OPS.UNLOCK_BADGES: {
      const unlockedAt = now
      const achievements = { ...state.achievements }
      for (const a of ACHIEVEMENTS) achievements[a.id] = achievements[a.id] ?? unlockedAt
      return done({ ...state, achievements }, [{ type: 'JUDGE_BADGES_UNLOCKED' }])
    }

    case OPS.RESET_BADGES:
      return done({ ...state, achievements: {} }, [{ type: 'JUDGE_BADGES_RESET' }])

    default:
      return done(state)
  }
}

/** A day's counters, emptied — used by the console's "clear today". */
export function clearToday(state, now = Date.now()) {
  return { ...state, daily: emptyDaily(getLocalDateKey(new Date(now))) }
}

export default { OPS, apply, isJudge, hasPower, topUpGems, clearToday }
