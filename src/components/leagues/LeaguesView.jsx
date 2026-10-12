/* ═══════════════════════════════════════════════════════════════════════════
   LeaguesView.jsx — THE LEAGUES DESTINATION (revision 10, connected builds)
   ---------------------------------------------------------------------------
   This week's competition, as the LunX server reports it (GET /api/leagues →
   server/leagues.js → view). Nothing here computes a rank or a reward: the
   zones are drawn by the same utils/leagueRules.js the server finalizes
   with, so a divider can never sit a row away from where promotion happens.

   COMPONENT_RULES.md → Leagues. Top to bottom:
     header       the league's badge (current ring), its name, rank · XP ·
                  time left
     ladder       all ten leagues: earned in colour, current ringed, locked
                  as silhouettes
     last week    the outcome, and each reward with why — claimed by press
     board        one container of rows, the learner's own tinted, with the
                  promotion and demotion zones printed as dividers
     tournament   the Diamond Tournament, only when the schedule has one
     how          the rules, from config/leagueConfig.js
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useSocial } from '../../state/SocialContext'
import { LEAGUES, LEAGUE, TOURNAMENT, DIAMOND, LEAGUE_XP_SOURCES, leagueOf } from '../../config/leagueConfig'
import { LeagueBadge, Medal, AwardArt } from './LeagueArt'
import { Avatar, TestTag, Countdown, Notice, endsAt } from '../social/SocialBits'
import ProfileCard from '../social/ProfileCard'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { GemIcon, Icon } from '../progression/Icons'
import SplitText from '../../motion/SplitText'
import RollingNumber from '../../motion/RollingNumber'
import { weekLabelOf } from './leagueText'
import './leagueView.css'

const OUTCOME = {
  promoted: (r) => `You were promoted to the ${leagueOf(r.tier + 1).name} League.`,
  demoted: (r) => `You dropped to the ${leagueOf(Math.max(0, r.tier - 1)).name} League.`,
  stayed: (r) => `You stayed in the ${leagueOf(r.tier).name} League.`,
  advanced: () => 'You went through to the next round.',
  eliminated: () => 'You were knocked out of the tournament — back to Diamond.',
  finished: () => 'The tournament is over.',
}

function standingSentence(cohort) {
  const s = cohort.standing
  if (!s?.rank) return null
  if (cohort.kind === 'tournament') {
    /* The final sends nobody through: it crowns a champion and a podium. */
    if (!s.promote) {
      if (s.rank === 1) return 'You’re first — finish here and you’re the champion.'
      if (s.rank <= 3) return `You’re #${s.rank}, on the podium — climb ${s.rank - 1} place${s.rank === 2 ? '' : 's'} to win.`
      return `Climb ${s.rank - 3} place${s.rank === 4 ? '' : 's'} to reach the podium.`
    }
    return s.zone === 'promotion'
      ? `You’re in the top ${s.promote} — on course for the next round.`
      : `Climb ${s.placesToPromote} place${s.placesToPromote === 1 ? '' : 's'} to reach the top ${s.promote} and go through.`
  }
  const next = leagueOf(cohort.tier + 1)?.name
  if (cohort.tier === DIAMOND && s.zone !== 'demotion') return 'Diamond is the top league — hold your place in the safe zone.'
  if (s.zone === 'promotion') {
    return s.belowPromotionMinimum
      ? `You’re in the promotion zone, but moving up to ${next} needs at least ${LEAGUE.MIN_XP_TO_PROMOTE} XP this week.`
      : `You’re in the promotion zone — finish here and you move up to ${next}.`
  }
  if (s.zone === 'demotion') {
    return `You’re in the demotion zone — climb ${s.placesToSafety} place${s.placesToSafety === 1 ? '' : 's'} to stay in ${leagueOf(cohort.tier).name}.`
  }
  if (s.promote > 0) {
    return `${s.placesToPromote} place${s.placesToPromote === 1 ? '' : 's'}${s.xpToPromote ? ` (about ${s.xpToPromote} XP)` : ''} to the promotion zone.`
  }
  return 'You’re in the safe zone.'
}

/** The ten leagues as a row of badges. */
function Ladder({ tier, bestTier }) {
  return (
    <ol className="lgv-ladder" aria-label="The ten leagues">
      {LEAGUES.map((league, i) => {
        const state = i === tier ? 'current' : i <= bestTier ? 'earned' : 'locked'
        return (
          <li key={league.id} className={`lgv-rung is-${state}`} aria-current={i === tier ? 'step' : undefined}>
            <span className="lgv-rung-badge"><LeagueBadge tier={i} size={40} state={state === 'locked' ? 'locked' : 'earned'} /></span>
            <span className="lgv-rung-name">{league.name}</span>
            <span className="pg-sr-only">{state === 'current' ? '(your league)' : state === 'earned' ? '(reached)' : '(not reached yet)'}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** One reward, with its gems to claim. */
function AwardRow({ award: a, onClaim, claiming }) {
  return (
    <li className="lgv-award">
      <AwardArt award={a} size={40} />
      <span className="lgv-award-text"><b>{a.title}</b>{a.reason && <em>{a.reason}</em>}</span>
      {a.gems > 0 && (
        a.claimed
          ? <span className="sx-claimed"><Icon name="check" size={14} /> {a.gems} gems claimed</span>
          : <button type="button" className="btn btn-sm sx-claim" disabled={claiming === a.id} onClick={() => onClaim(a)}><GemIcon size={15} /> Claim {a.gems}</button>
      )}
    </li>
  )
}

/** Rewards from before the last result that were never claimed — a round
 *  or a week can end before its reward is collected, and the gems must
 *  stay within reach (the nav's badge counts them). */
function Waiting({ awards, onClaim, claiming }) {
  if (!awards.length) return null
  return (
    <section className="lgv-result" aria-labelledby="lgv-waiting-title">
      <span className="lgv-result-eyebrow" id="lgv-waiting-title">Earlier rewards to claim</span>
      <ul className="lgv-awards">
        {awards.map((a) => <AwardRow key={a.id} award={a} onClaim={onClaim} claiming={claiming} />)}
      </ul>
    </section>
  )
}

/** Last week's result, with its rewards to claim. */
function Result({ result, onClaim, claiming }) {
  if (!result) return null
  const describe = OUTCOME[result.outcome] ?? (() => '')
  const label = result.sandbox ? 'Last sandbox week' : result.kind === 'tournament' ? 'Last tournament round' : `Week of ${weekLabelOf(result.weekId)}`
  return (
    <section className="lgv-result" aria-labelledby="lgv-result-title">
      <span className="lgv-result-eyebrow">{label}</span>
      <h2 className="lgv-result-title" id="lgv-result-title">
        #{result.rank} of {result.size} · {result.xp} XP
      </h2>
      <p className="lgv-result-line">{describe(result)}</p>
      {result.awards.length > 0 && (
        <ul className="lgv-awards">
          {result.awards.map((a) => <AwardRow key={a.id} award={a} onClaim={onClaim} claiming={claiming} />)}
        </ul>
      )}
    </section>
  )
}

function Board({ cohort, onOpen }) {
  const { members, zones } = cohort
  const size = members.length
  const promoteLabel = cohort.kind === 'tournament' ? 'Going through' : 'Promotion zone'
  return (
    <ol className="sl lgv-board" aria-label={`This week’s ${cohort.kind === 'tournament' ? 'bracket' : 'leaderboard'}`}>
      {members.map((m) => {
        const inPromote = m.rank <= zones.promote
        const inDemote = zones.demote > 0 && m.rank > size - zones.demote
        const after = (zones.promote > 0 && m.rank === zones.promote && size > zones.promote) || (zones.demote > 0 && m.rank === size - zones.demote && size - zones.demote > 0)
        return (
          <li
            key={m.userId}
            className={`sl-row lgv-row${m.isYou ? ' is-you' : ''}${inPromote ? ' in-promote' : ''}${inDemote ? ' in-demote' : ''}`}
            aria-current={m.isYou ? 'true' : undefined}
          >
            <span className="lgv-rank tnum" aria-label={`Rank ${m.rank}`}>
              {m.rank <= 3 && m.xp > 0 ? <Medal place={m.rank} size={26} /> : m.rank}
            </span>
            {m.isYou ? (
              <span className="sl-open">
                <Avatar name={m.username} color={m.avatar} size={30} />
                <span className="sl-who"><span className="sl-name"><span>{m.username}</span><span className="lgv-you">You</span></span></span>
              </span>
            ) : (
              <button type="button" className="sl-open" onClick={() => onOpen(m.userId)} aria-label={`${m.username}, rank ${m.rank}, ${m.xp} XP — open profile`}>
                <Avatar name={m.username} color={m.avatar} size={30} />
                <span className="sl-who"><span className="sl-name"><span>{m.username}</span>{m.isTest && <TestTag />}</span></span>
              </button>
            )}
            <span className="sl-figure">{m.isYou ? <RollingNumber value={m.xp} /> : m.xp} <small>XP</small></span>
            {after && (
              <span className={`lgv-divider ${m.rank === zones.promote && zones.promote > 0 ? 'is-promote' : 'is-demote'}`} aria-hidden="true">
                <span>{m.rank === zones.promote && zones.promote > 0 ? `▲ ${promoteLabel}` : '▼ Demotion zone'}</span>
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* Where the learner stands while a tournament runs. A round can finish
   before its week does, so "through" is told apart from "in" and "out". */
function runningLine(data, e) {
  const now = TOURNAMENT.ROUNDS[data.round].name
  const entry = data.entry
  if (!entry) return `The ${now} are running this week. You didn’t qualify for this edition.`
  if (entry.status === 'qualified' && entry.round === data.round) return `You’re in the ${now} this week — every league XP you earn counts in your bracket.`
  if (entry.status === 'qualified' && entry.round > data.round) {
    const next = e.rounds[entry.round]
    return `You’re through to the ${TOURNAMENT.ROUNDS[entry.round].name}${next ? `, which start the week of ${weekLabelOf(next.weekId)}` : ''}.`
  }
  if (entry.status === 'finished') return 'You’ve played your last round of this edition — your result is above.'
  return `The ${now} are running this week. You’re out of this edition — you play Diamond as usual.`
}

function Tournament({ data, tier }) {
  if (!data || data.status === 'none') {
    return tier === DIAMOND ? <p className="lgv-quiet">No Diamond Tournament is scheduled right now — Diamond runs every week as usual.</p> : null
  }
  const e = data.edition
  const rounds = e.rounds.map((r) => `${r.name} (week of ${weekLabelOf(r.weekId)})`).join(', ')
  if (tier !== DIAMOND && !data.entry) {
    return (
      <p className="lgv-quiet">
        <Icon name="crown" size={14} /> Next: the {e.name}. Reach Diamond and finish in its top {TOURNAMENT.QUALIFY_TOP} the week of {weekLabelOf(e.qualifyWeek)} to qualify.
      </p>
    )
  }
  return (
    <section className="lgv-tourney" aria-labelledby="lgv-tourney-title">
      <h3 className="qp-section-title" id="lgv-tourney-title"><Icon name="crown" size={18} /> {e.name}</h3>
      {data.status === 'running' && (
        <p className="lgv-tourney-line">{runningLine(data, e)}</p>
      )}
      {data.status !== 'running' && (
        <p className="lgv-tourney-line">
          {data.entry?.status === 'qualified'
            ? `You qualified. The Quarterfinals start the week of ${weekLabelOf(e.rounds[0].weekId)}.`
            : `Finish in the top ${TOURNAMENT.QUALIFY_TOP} of a Diamond board the week of ${weekLabelOf(e.qualifyWeek)} to qualify.`}
        </p>
      )}
      <p className="lgv-quiet">Three rounds, one a week — {rounds}. Each round sends its top places through; the final crowns a champion.</p>
    </section>
  )
}

export default function LeaguesView({ onGoPractice, onGoProfile }) {
  const social = useSocial()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null)
  const [claiming, setClaiming] = useState(null)
  const [working, setWorking] = useState(false)
  const [note, setNote] = useState(null)

  const load = useCallback(async () => {
    const r = await api.get('/api/leagues')
    if (r.ok) { setData(r.data); setError(null) } else setError(r)
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, 60000)
    return () => window.clearInterval(id)
  }, [load])

  /* A move up (the activity queue's results) arrives through the social
     summary; reload the board when it changes. */
  const rank = social?.summary?.league?.rank
  const xp = social?.summary?.league?.xp
  useEffect(() => { if (data) load() }, [rank, xp]) // eslint-disable-line react-hooks/exhaustive-deps

  const claim = async (award) => {
    setClaiming(award.id)
    await social?.claim(award)
    setClaiming(null)
    load()
  }

  const rejoin = async () => {
    setWorking(true)
    const r = await api.patch('/api/me', { settings: { leaguesOptIn: true } })
    setWorking(false)
    if (r.ok) load()
  }

  /* The reviewer's sandbox controls (server/review.js) — real engine, test accounts. */
  const review = async (path, done) => {
    setWorking(true)
    setNote(null)
    const r = await api.post(path, {})
    setWorking(false)
    setNote(r.ok ? { tone: 'ok', text: done(r.data) } : { tone: 'bad', text: r.message })
    load()
    social?.refresh()
  }

  if (error && !data) {
    return <div className="qp-board"><Notice kind="error" title="The leagues couldn’t be loaded." onRetry={load}>{error.message}</Notice></div>
  }
  if (!data) return <div className="qp-board"><Notice kind="loading" title="Loading this week’s league…" /></div>

  const league = leagueOf(data.cohort?.tier ?? data.tier)
  const cohort = data.cohort
  const sentence = cohort ? standingSentence(cohort) : null

  return (
    <div className="qp-board lgv">
      <header className="lgv-head">
        <span className="lgv-head-badge"><LeagueBadge tier={cohort?.tier ?? data.tier} size={72} /></span>
        <div className="lgv-head-text">
          <span className="qp-eyebrow">{cohort?.kind === 'tournament' ? 'Diamond Tournament' : 'Leagues'}</span>
          <SplitText as="h1" className="qp-title" immediate stagger={55}>
            {cohort?.kind === 'tournament' ? TOURNAMENT.ROUNDS[cohort.round]?.name ?? 'Tournament' : `${league.name} League`}
          </SplitText>
          <p className="lgv-line">
            {cohort?.standing?.rank
              ? <>#{cohort.standing.rank} of {cohort.standing.size} · {cohort.members.find((m) => m.isYou)?.xp ?? 0} XP this week · </>
              : data.optedIn ? <>Not on a board yet this week · </> : null}
            <Countdown endAt={cohort?.endAt ?? data.week.endAt} prefix="ends in " />
            <span className="lgv-ends"> ({endsAt(cohort?.endAt ?? data.week.endAt)})</span>
          </p>
        </div>
      </header>

      {data.sandbox && (
        <div className="lgv-sandbox" role="note">
          <p><b>Reviewer sandbox.</b> Everyone else on this board is a labelled test account — no real learner is ever in your league. The controls below run the real league engine.</p>
          <JudgeMargin label="Sandbox controls">
            <JudgeChip icon="review" label="Test accounts study" tip="Each test account finishes its next lesson; the server grades every answer" onDone={() => review('/api/review/study', (d) => `${d.testers} test accounts studied and earned ${d.xp} league XP.`)} disabled={working} />
            <JudgeChip icon="calendar" label="End the week now" tip="Finalize this board with the real code: ranks, promotion, demotion, rewards" onDone={() => review('/api/review/end-week', () => 'The sandbox week ended — see the result above the board.')} disabled={working} />
            <JudgeChip icon="refresh" label="Reset sandbox" quiet tip="Delete the test accounts and sandbox weeks, and start again in Bronze" onDone={() => review('/api/review/reset', () => 'The sandbox was reset.')} disabled={working} />
          </JudgeMargin>
          {note && <p className={`lgv-note is-${note.tone}`} role="status">{note.text}</p>}
        </div>
      )}

      <Ladder tier={data.tier} bestTier={Math.max(data.bestTier, data.tier)} />

      <Result result={data.previous} onClaim={claim} claiming={claiming} />
      <Waiting
        awards={(social?.summary?.unclaimed ?? []).filter((a) => !a.kind.startsWith('challenge') && !(data.previous?.awards ?? []).some((b) => b.id === a.id))}
        onClaim={claim}
        claiming={claiming}
      />

      {!data.optedIn && (
        <Notice
          kind="empty"
          title="You’ve left the weekly leagues"
          action={<button type="button" className="btn btn-primary btn-sm" disabled={working} onClick={rejoin}>Join the leagues again</button>}
        >
          You aren’t shown on any leaderboard, and your XP still counts for everything else. You can change this in Profile → Privacy.
        </Notice>
      )}

      {data.optedIn && !cohort && (
        <Notice
          kind="empty"
          title="Join this week’s league"
          action={<button type="button" className="btn btn-primary btn-sm" onClick={onGoPractice}>Start a practice session</button>}
        >
          Your first lesson or Practice session this week puts you on a board of up to {LEAGUE.COHORT_SIZE} learners from nearby time zones, in the {league.name} League.
        </Notice>
      )}

      {cohort && (
        <section className="qp-section" aria-labelledby="lgv-board-title">
          <header className="qp-section-head">
            <div>
              <h3 className="qp-section-title" id="lgv-board-title">{cohort.kind === 'tournament' ? 'Your bracket' : 'This week’s board'}</h3>
              {sentence && <p className="lgv-standing">{sentence}</p>}
            </div>
          </header>
          <Board cohort={cohort} onOpen={setOpen} />
        </section>
      )}

      <Tournament data={data.tournament} tier={data.tier} />

      <details className="lgv-how">
        <summary>How leagues work</summary>
        <ul>
          <li>A new week starts every Sunday at midnight in your time zone. Your board’s countdown is exact — the server decides when a week ends.</li>
          <li>You join a board of up to {LEAGUE.COHORT_SIZE} learners the first time you earn league XP in a week, matched by league, time zone and how much you usually study.</li>
          <li>At the end of the week the top places move up a league and the bottom places drop one (on a smaller board, fewer places). Bronze never drops; Diamond is the top.</li>
          <li>League XP comes only from learning: {Object.values(LEAGUE_XP_SOURCES).map((s) => s.toLowerCase()).join('; ')}. The daily spin, the daily-goal bonus and friend challenges don’t count.</li>
          <li>Moving up, finishing in the top three and reaching a league for the first time each earn a reward, recorded once.</li>
          <li>Other learners see your username, avatar and weekly XP — never your email. {onGoProfile && <button type="button" className="sx-link" onClick={onGoProfile}>Privacy settings</button>}</li>
        </ul>
      </details>

      {open && <ProfileCard userId={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  )
}
