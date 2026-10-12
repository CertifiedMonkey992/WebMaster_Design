/* ═══════════════════════════════════════════════════════════════════════════
   leagueConfig.js — EVERY RULE OF THE LEAGUES, THE TOURNAMENT AND CHALLENGES
   ---------------------------------------------------------------------------
   Read by the LunX server (which enforces them) and by the app (which only
   displays them), so the two can never quote different numbers. Nothing in
   the interface hardcodes a zone size, a reward or a schedule.

   What is taken from Duolingo's own description of its leagues
   (blog.duolingo.com/duolingo-leagues-leaderboards):
     · ten leagues, in this order, ending in Diamond
     · "Every Sunday (based on your timezone), a new weekly league begins"
     · learners are matched with "people who have similar study habits" and
       "in a similar time zone"
     · the Diamond Tournament: the top 10 of Diamond qualify; three rounds —
       quarterfinals, semifinals, finals — each eliminating learners; it does
       not run every week
     · a learner can leave leaderboards (their "public profile" switch)

   What that description does NOT state, and LunX therefore decides here, in
   the open: how many learners share a leaderboard, how many move up or down
   in each league, what rewards are paid, how ties break, and when exactly a
   tournament runs. Change any of it here and both sides follow.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{ id: string, name: string, promote: number, demote: number }} LeagueTier
 *   promote / demote: places that move up / down in a FULL leaderboard
 *   (LEAGUE.COHORT_SIZE). A smaller one scales them (utils/leagueRules.js).
 */

/** The ten leagues, lowest first. Index = tier. @type {LeagueTier[]} */
export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   promote: 10, demote: 0 },
  { id: 'silver',   name: 'Silver',   promote: 7,  demote: 5 },
  { id: 'gold',     name: 'Gold',     promote: 7,  demote: 5 },
  { id: 'sapphire', name: 'Sapphire', promote: 6,  demote: 5 },
  { id: 'ruby',     name: 'Ruby',     promote: 6,  demote: 5 },
  { id: 'emerald',  name: 'Emerald',  promote: 5,  demote: 5 },
  { id: 'amethyst', name: 'Amethyst', promote: 5,  demote: 5 },
  { id: 'pearl',    name: 'Pearl',    promote: 5,  demote: 5 },
  { id: 'obsidian', name: 'Obsidian', promote: 5,  demote: 5 },
  { id: 'diamond',  name: 'Diamond',  promote: 0,  demote: 5 },
]

export const DIAMOND = LEAGUES.length - 1

export const LEAGUE = {
  /** Learners in one weekly leaderboard when it is full. */
  COHORT_SIZE: 30,
  /** The week starts here, in the leaderboard's own time zone (0 = Sunday). */
  WEEK_START_DAY: 0,
  WEEK_START_HOUR: 0,
  /** A learner joins a leaderboard whose time zone is within this many
   *  hours of their own, so its week ends at about the same local time. */
  TZ_BAND_HOURS: 3,
  /** A leaderboard stops taking new learners this close to its end. */
  JOIN_CUTOFF_HOURS: 6,
  /** Study-habit bands, by the XP earned in the learner's last league week.
   *  Matchmaking prefers a leaderboard of the same band. */
  ACTIVITY_BANDS: [0, 60, 200, 500],
  /** Finishing in the promotion zone moves a learner up only if they earned
   *  at least this much league XP that week. */
  MIN_XP_TO_PROMOTE: 20,
  /** A learner may change the time zone their weeks are counted in at most
   *  this often (it cannot move a week already running). */
  TZ_CHANGE_DAYS: 7,
  /** A podium (1st–3rd) is only a podium on a board with at least this many. */
  PODIUM_MIN_SIZE: 5,
}

/** What earns league XP. The server awards these and only these — from
 *  answers it grades itself — so XP from the daily spin, the daily-goal bonus
 *  or the reviewer's controls never reaches a leaderboard. */
export const LEAGUE_XP_SOURCES = {
  answer:   'A Check question answered correctly for the first time',
  complete: 'A lesson, Case File, project or the capstone finished for the first time',
  perfect:  'A Check passed without a miss, the first time through',
  section:  'A whole module finished',
  practice: 'A Practice session (fresh correct answers, capped per day)',
}

export const LEAGUE_REWARDS = {
  /** Gems for being promoted INTO each tier (index = the new tier). */
  PROMOTION_GEMS: [0, 20, 25, 30, 35, 40, 45, 50, 60, 75],
  /** Gems for finishing 1st, 2nd, 3rd — plus TIER_STEP per tier above Bronze. */
  PODIUM_GEMS: [40, 25, 15],
  PODIUM_TIER_STEP: 5,
}

/**
 * @typedef {{ id: string, name: string, advanceTop: number }} TournamentRound
 * @typedef {{ id: string, name: string, qualifyWeek: string }} TournamentEdition
 *   qualifyWeek: the week id (its Sunday, YYYY-MM-DD) whose Diamond results
 *   qualify; the three rounds are the three weeks after it.
 */
export const TOURNAMENT = {
  /** Finish in the top this-many of a Diamond leaderboard in the qualifying week. */
  QUALIFY_TOP: 10,
  /** Learners in one round's bracket when it is full. */
  BRACKET_SIZE: 30,
  /** @type {TournamentRound[]} — advanceTop scales like a league zone. */
  ROUNDS: [
    { id: 'quarterfinal', name: 'Quarterfinals', advanceTop: 10 },
    { id: 'semifinal',    name: 'Semifinals',    advanceTop: 10 },
    { id: 'final',        name: 'Finals',        advanceTop: 0 },
  ],
  /** When the tournament runs. It does not run every week — only these.
   *  @type {TournamentEdition[]} */
  SCHEDULE: [
    { id: '2026-winter', name: 'Winter Diamond Tournament', qualifyWeek: '2026-11-22' },
    { id: '2027-spring', name: 'Spring Diamond Tournament', qualifyWeek: '2027-03-14' },
    { id: '2027-summer', name: 'Summer Diamond Tournament', qualifyWeek: '2027-06-13' },
  ],
  /** Gems for each stage reached, each paid once (server/leagues.js →
   *  finalizeCohort): making the semifinals, making the final, then 3rd,
   *  2nd or champion in the final. Never league XP. */
  REWARDS: { semifinal: 50, final: 100, third: 120, second: 160, champion: 250 },
}

/**
 * @typedef {{ id: string, name: string, desc: string, unit: string,
 *             topic: 'none' | 'required' | 'optional', targets: number[] }} ChallengeFormat
 */
export const CHALLENGES = {
  /** @type {ChallengeFormat[]} */
  FORMATS: [
    { id: 'xp',      name: 'XP race',        desc: 'Most league XP earned before the deadline', unit: 'XP',      topic: 'none',     targets: [100, 250, 500] },
    { id: 'lessons', name: 'Lesson race',    desc: 'Most lessons finished — first time or as a review, one per lesson a day', unit: 'lessons', topic: 'none', targets: [3, 5, 10] },
    { id: 'topic',   name: 'Topic practice', desc: 'Most correct Practice answers in one module', unit: 'correct', topic: 'required', targets: [10, 20, 40] },
    { id: 'quiz',    name: 'Quiz score',     desc: 'Best score in one Practice session of at least 10 questions', unit: '%', topic: 'optional', targets: [70, 80, 90] },
  ],
  DURATIONS_DAYS: [1, 3, 7],
  /** Friends one challenge can invite (the creator makes it one more). */
  MAX_INVITES: 4,
  /** A challenge nobody has accepted within this many hours is called off. */
  ACCEPT_HOURS: 24,
  /** Challenges a learner can be in at once (active or waiting). */
  MAX_OPEN: 5,
  /** Questions a Practice session needs to count for a Quiz-score challenge. */
  QUIZ_MIN_QUESTIONS: 10,
  /** Gems for winning (shared equally by a tie for first). Never XP. */
  WIN_GEMS: 25,
}

/** @param {number} tier */
export const leagueOf = (tier) => LEAGUES[Math.max(0, Math.min(LEAGUES.length - 1, Math.floor(tier) || 0))]

/** @param {string} id */
export const challengeFormat = (id) => CHALLENGES.FORMATS.find((f) => f.id === id) ?? null

export default { LEAGUES, DIAMOND, LEAGUE, LEAGUE_XP_SOURCES, LEAGUE_REWARDS, TOURNAMENT, CHALLENGES, leagueOf, challengeFormat }
