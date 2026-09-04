/* ═══════════════════════════════════════════════════════════════════════════
   teamQuestService.js — TEAM MISSIONS (COLLABORATIVE QUESTS)
   ---------------------------------------------------------------------------
   LunX team missions are shared goals: a small squad pushes one bar together
   and everybody is paid when it fills. Not a leaderboard — nobody loses.

   ⚠️  THERE IS NO BACKEND YET, AND THIS FILE DOES NOT PRETEND OTHERWISE.
   The squad is LOCALLY SIMULATED and every member is flagged `simulated: true`
   so the UI can label it honestly ("Local preview"). The learner's OWN
   contribution is real progression data.

   Swapping in a real backend means replacing `loadMission` / `syncMission`
   with network calls. The data model, the reducer actions and every component
   above this line stay exactly as they are.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TEAM } from '../config/progressionConfig'
import { getWeekKey, parseDateKey, addDays } from '../utils/dateUtils'
import { createRandom, clamp } from '../utils/progressionUtils'
import { awardGems } from './currencyService'

export const IS_SIMULATED = true

/** What a mission measures. Mirrors the solo quest metric idea, but summed
 *  across the whole squad. */
export const MISSION_TYPES = {
  TEAM_XP:       'TEAM_XP',
  TEAM_LESSONS:  'TEAM_LESSONS',
  TEAM_MINUTES:  'TEAM_MINUTES',
  TEAM_PERFECT:  'TEAM_PERFECT',
  XP_RELAY:      'XP_RELAY',
}

/* ── Mission catalogue ───────────────────────────────────────────────────── */
export const MISSIONS = [
  {
    key: 'reach-the-moon',
    type: MISSION_TYPES.TEAM_XP,
    title: 'Reach the Moon',
    tagline: 'Every XP point is fuel. Burn enough and the squad makes orbit.',
    icon: 'rocket',
    unit: 'XP',
    goalPerMember: 125,
  },
  {
    key: 'knowledge-chain',
    type: MISSION_TYPES.TEAM_LESSONS,
    title: 'Build the Knowledge Chain',
    tagline: 'Each finished lesson forges one link. Break none.',
    icon: 'link',
    unit: 'lessons',
    goalPerMember: 5,
  },
  {
    key: 'study-squad',
    type: MISSION_TYPES.TEAM_MINUTES,
    title: 'Study Squad',
    tagline: 'Pool your focus. Minutes count wherever they come from.',
    icon: 'timer',
    unit: 'min',
    goalPerMember: 15,
  },
  {
    key: 'perfect-chain',
    type: MISSION_TYPES.TEAM_PERFECT,
    title: 'Perfect Chain',
    tagline: 'Flawless lessons only. One squad, zero hearts lost.',
    icon: 'star',
    unit: 'perfect',
    goalPerMember: 2,
  },
  {
    key: 'xp-relay',
    type: MISSION_TYPES.XP_RELAY,
    title: 'XP Relay',
    tagline: 'Nobody carries this alone — every member must run their leg.',
    icon: 'users',
    unit: 'XP',
    goalPerMember: 50,
    /** Relay rule: the mission only completes when EVERY member reaches
     *  their individual leg, not just when the total is reached. */
    requiresEveryMember: true,
  },
]

/* Squadmate names for the local simulation. Deliberately generic so nobody
   mistakes them for real accounts. */
const SIM_NAMES = [
  'Nova', 'Kai', 'Ines', 'Milo', 'Zara', 'Theo', 'Ada', 'Rune', 'Juno', 'Oskar',
]

/* ── Mission lifecycle ───────────────────────────────────────────────────── */

/** Create the mission record for a given week. Deterministic per week+account. */
export function createMission(state, now = Date.now()) {
  const weekKey = getWeekKey(new Date(now))
  const random = createRandom(`team|${weekKey}|${state.createdAt}`)
  const mission = MISSIONS[Math.floor(random() * MISSIONS.length)]

  const squadSize = TEAM.SQUAD_SIZE
  /* A mission begins when the learner joins it, never earlier — otherwise a
     brand-new account would open to a bar the simulated squad had already
     half-filled "before" they existed. */
  const weekStart = parseDateKey(weekKey)?.getTime() ?? now
  const startsAt = Math.max(weekStart, state.createdAt ?? now)
  const endsAt = (parseDateKey(addDays(weekKey, TEAM.DURATION_DAYS))?.getTime()) ?? now + 7 * 86400000

  /* Teammate "personalities" — a steady hourly rate plus a burst factor, both
     seeded, so their progress is a pure function of elapsed time rather than
     a random walk that would jump around on every render. */
  const shuffled = [...SIM_NAMES].sort(() => random() - 0.5)
  const members = Array.from({ length: squadSize - 1 }, (_, i) => ({
    id: `sim-${i + 1}`,
    name: shuffled[i] ?? `Learner ${i + 1}`,
    simulated: true,
    rate: 0.35 + random() * 0.9,      // share of goalPerMember earned per day
    offsetHours: Math.floor(random() * 10),
    accent: ['#6366F1', '#06B6D4', '#F59E0B', '#22C55E', '#EC4899'][i % 5],
  }))

  return {
    missionKey: mission.key,
    weekKey,
    startsAt,
    endsAt,
    goal: mission.goalPerMember * squadSize,
    goalPerMember: mission.goalPerMember,
    squadSize,
    members,
    contribution: 0,        // the learner's REAL contribution
    claimed: false,
    joinedAt: now,
  }
}

/** Simulated contribution for one teammate at time `now`. Monotonic in time. */
function simulatedContribution(member, record, now) {
  const elapsedHours = Math.max(0, (now - record.startsAt) / 3600000 - member.offsetHours)
  const days = elapsedHours / 24
  const raw = member.rate * record.goalPerMember * days
  /* A teammate can overshoot their own leg but not carry the entire squad. */
  return Math.floor(clamp(raw, 0, record.goalPerMember * 1.6))
}

/**
 * Resolve the live view of the current mission: the learner's real numbers
 * plus the simulated squad, totals, and completion state.
 * Returns null when there is no mission record yet.
 */
export function getMissionView(state, now = Date.now()) {
  const record = state.team
  if (!record) return null
  const mission = MISSIONS.find((m) => m.key === record.missionKey)
  if (!mission) return null

  const members = record.members.map((m) => ({
    ...m,
    contribution: simulatedContribution(m, record, now),
    isYou: false,
  }))

  const you = {
    id: 'you',
    name: 'You',
    simulated: false,
    isYou: true,
    accent: '#818CF8',
    contribution: record.contribution,
  }

  const roster = [you, ...members].sort((a, b) => b.contribution - a.contribution)
  const total = roster.reduce((sum, m) => sum + m.contribution, 0)
  const everyMemberDone = roster.every((m) => m.contribution >= record.goalPerMember)
  const complete = mission.requiresEveryMember
    ? everyMemberDone
    : total >= record.goal

  return {
    ...record,
    mission,
    roster,
    total,
    percent: clamp(Math.round((total / Math.max(1, record.goal)) * 100), 0, 100),
    complete,
    everyMemberDone,
    yourPercent: clamp(Math.round((record.contribution / Math.max(1, record.goalPerMember)) * 100), 0, 100),
    claimable: complete && !record.claimed,
    msRemaining: Math.max(0, record.endsAt - now),
    rewardGems: TEAM.REWARD_GEMS,
    simulated: IS_SIMULATED,
  }
}

/** Ensure a mission exists for the current week, rolling over when it ends. */
export function ensureMission(state, now = Date.now()) {
  const weekKey = getWeekKey(new Date(now))
  if (state.team && state.team.weekKey === weekKey) return { state, events: [] }

  const record = createMission(state, now)
  return {
    state: { ...state, team: record },
    events: [{ type: 'TEAM_MISSION_STARTED', missionKey: record.missionKey }],
  }
}

/**
 * Add the learner's real activity to the mission. Called by the progression
 * reducer whenever a lesson or practice session finishes — the same event
 * that feeds solo quests, so a team bar can never disagree with a solo bar.
 */
export function contribute(state, { xp = 0, lessons = 0, minutes = 0, perfect = 0 } = {}, now = Date.now()) {
  const record = state.team
  if (!record) return { state, events: [] }
  const mission = MISSIONS.find((m) => m.key === record.missionKey)
  if (!mission) return { state, events: [] }

  let amount = 0
  switch (mission.type) {
    case MISSION_TYPES.TEAM_XP:
    case MISSION_TYPES.XP_RELAY:     amount = xp; break
    case MISSION_TYPES.TEAM_LESSONS: amount = lessons; break
    case MISSION_TYPES.TEAM_MINUTES: amount = minutes; break
    case MISSION_TYPES.TEAM_PERFECT: amount = perfect; break
    default: amount = 0
  }
  if (amount <= 0) return { state, events: [] }

  const before = getMissionView(state, now)
  const next = { ...state, team: { ...record, contribution: record.contribution + amount } }
  const after = getMissionView(next, now)

  const events = [{ type: 'TEAM_CONTRIBUTION', amount, unit: mission.unit }]
  if (after?.complete && !before?.complete) {
    events.push({ type: 'TEAM_MISSION_COMPLETE', mission })
  }
  return { state: next, events }
}

/** Pay out the shared reward. Idempotent via the `claimed` flag. */
export function claimMissionReward(state, now = Date.now()) {
  const view = getMissionView(state, now)
  if (!view) return { state, events: [], ok: false, error: 'no-mission' }
  if (!view.complete) return { state, events: [], ok: false, error: 'not-complete' }
  if (view.claimed) return { state, events: [], ok: false, error: 'already-claimed' }

  let next = {
    ...state,
    team: { ...state.team, claimed: true, claimedAt: now },
    stats: {
      ...state.stats,
      totalTeamMissionsCompleted: state.stats.totalTeamMissionsCompleted + 1,
    },
  }

  const result = awardGems(next, TEAM.REWARD_GEMS, 'team-mission', { missionKey: view.missionKey })
  next = result.state

  return {
    state: next,
    events: [{ type: 'TEAM_MISSION_CLAIMED', mission: view.mission }, ...result.events],
    ok: true,
  }
}

/** Leave the current mission and draw a different one (same week). */
export function rerollMission(state, now = Date.now()) {
  const record = createMission({ ...state, createdAt: state.createdAt + 1 }, now)
  return { state: { ...state, team: record }, events: [{ type: 'TEAM_MISSION_STARTED', missionKey: record.missionKey }] }
}

export default {
  MISSIONS, MISSION_TYPES, IS_SIMULATED,
  ensureMission, createMission, getMissionView, contribute,
  claimMissionReward, rerollMission,
}
