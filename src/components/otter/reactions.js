/* ═══════════════════════════════════════════════════════════════════════════
   reactions.js — WHAT THE OTTER DOES WHEN SOMETHING REAL HAPPENS
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 13 → Reports. Every entry answers an event the
   progression engine actually emitted (ProgressionContext → VISIBLE). The
   otter never celebrates something that did not happen.

   A finished lesson pays several events at once — XP, gems, a quest, a
   level — so events that arrive together are gathered and the most
   important one wins. Acts a pose cannot perform fall through to the next
   in the list.
   ═══════════════════════════════════════════════════════════════════════════ */

export const EVENT_REACTIONS = {
  SECTION_COMPLETE:      { acts: ['backflip', 'celebrate'], priority: 9 },
  LEVEL_UP:              { acts: ['celebrate'], priority: 8 },
  ACHIEVEMENT_UNLOCKED:  { acts: ['unlock'], priority: 8 },
  STREAK_MILESTONE:      { acts: ['dance', 'celebrate'], priority: 7 },
  QUEST_COMPLETED:       { acts: ['questCheer'], priority: 6 },
  TEAM_MISSION_COMPLETE: { acts: ['questCheer'], priority: 6 },
  PERFECT_LESSON:        { acts: ['pawUp'], feel: 'proud', priority: 6 },
  DAILY_GOAL_MET:        { acts: ['pawUp'], feel: 'proud', priority: 5 },
  STREAK_LOST:           { acts: ['regroup', 'sympathy'], priority: 5 },
  HEARTS_EMPTY:          { acts: ['regroup', 'sympathy'], priority: 5 },
  QUEST_CLAIMED:         { acts: ['clap'], priority: 4 },
  TEAM_MISSION_CLAIMED:  { acts: ['clap'], priority: 4 },
  PURCHASE_COMPLETE:     { acts: ['rubPaws', 'clap'], priority: 4 },
  STREAK_SHIELD_USED:    { acts: ['notice', 'nod'], sequence: true, priority: 4 },
  HEARTS_RESTORED:       { acts: ['hop'], priority: 3 },
  HEART_LOST:            { acts: ['sympathy'], priority: 3 },
  GEMS_INSUFFICIENT:     { acts: ['shrug'], priority: 3 },
  STREAK_UPDATED:        { acts: ['nod'], priority: 2 },
  XP_AWARDED:            { acts: ['hop'], priority: 1 },
  GEMS_AWARDED:          { acts: ['clap'], priority: 1 },
}

/** The strongest reaction among a batch of events, or null. */
export function strongest(events) {
  let best = null
  for (const e of events) {
    const r = EVENT_REACTIONS[e?.type]
    if (r && (!best || r.priority > best.priority)) best = { ...r, type: e.type }
  }
  return best
}

/* The app's destinations each have a temperament, and a small gesture for
   arriving there (COMPONENT_RULES.md → Revision 13 → The companion). */
export const DESTINATIONS = {
  learn:    { mood: 'curious',     weight: 0.38, arrive: ['nod'] },
  practice: { mood: 'determined',  weight: 0.32, arrive: ['rubPaws'] },
  quests:   { mood: 'excited',     weight: 0.3,  arrive: ['rubPaws'] },
  shop:     { mood: 'mischievous', weight: 0.34, arrive: ['rubPaws'] },
  profile:  { mood: 'relaxed',     weight: 0.5,  arrive: ['stretch'] },
  friends:  { mood: 'happy',       weight: 0.5,  arrive: ['wave'] },
  leagues:  { mood: 'determined',  weight: 0.4,  arrive: ['pawUp'] },
}

/* A lesson's answer bar: what the peeking otter does for each verdict.
   Correct answers in a row build up from a nod to a little celebration. */
export function answerReaction(phase, run = 0) {
  if (phase === 'wrong') return ['sympathy']
  if (phase === 'reveal') return ['peer', 'nod']
  if (phase !== 'correct') return null
  if (run >= 4) return ['clap']
  if (run >= 2) return ['bounce']
  return [run % 2 ? 'pawUp' : 'nod']
}

/* The completion screen. */
export function completeReaction({ perfect, replay }) {
  if (replay) return ['nod']
  return perfect ? ['backflip'] : ['celebrate']
}
