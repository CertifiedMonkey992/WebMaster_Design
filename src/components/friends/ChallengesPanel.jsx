/* ═══════════════════════════════════════════════════════════════════════════
   ChallengesPanel.jsx — FRIEND CHALLENGES (revision 10)
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Friend challenges. One form to start one (a format,
   a topic where the format needs it, an optional target, a duration, the
   friends to invite); invitations to answer; running challenges with each
   participant's score as a bar; finished ones with the result and the
   winner's reward to claim.

   Scores come from the server (server/challenges.js), read from what each
   learner actually did inside the window. A challenge never changes league
   XP — the panel says so.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useSocial } from '../../state/SocialContext'
import { CHALLENGES, challengeFormat } from '../../config/leagueConfig'
import { SECTIONS } from '../../data/learnData'
import { Avatar, TestTag, Countdown, Notice } from '../social/SocialBits'
import { Trophy } from '../leagues/LeagueArt'
import { GemIcon, Icon } from '../progression/Icons'

const CANCEL_REASON = {
  'nobody-joined': `Nobody joined within ${CHALLENGES.ACCEPT_HOURS} hours.`,
  'not-enough': 'Fewer than two players were left.',
  'cancelled-by-creator': 'It was called off before anyone joined.',
}

function CreateForm({ friends, prefill, onCreated, onCancel }) {
  const [format, setFormat] = useState('xp')
  const [topic, setTopic] = useState('')
  const [target, setTarget] = useState(null)
  const [days, setDays] = useState(3)
  const [picked, setPicked] = useState(() => (prefill ? [prefill] : []))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const spec = challengeFormat(format)

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= CHALLENGES.MAX_INVITES ? p : [...p, id]))

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!picked.length) { setError('Choose at least one friend to invite.'); return }
    if (spec.topic === 'required' && !topic) { setError('Choose the module this challenge is about.'); return }
    setBusy(true)
    setError(null)
    const r = await api.post('/api/challenges', { format, topic: topic || null, target, durationDays: days, friendIds: picked })
    setBusy(false)
    if (!r.ok) { setError(r.message); return }
    onCreated(r.data.challenge)
  }

  return (
    <form className="ch-form" onSubmit={submit} noValidate aria-labelledby="ch-form-title">
      <h3 className="qp-section-title" id="ch-form-title">New challenge</h3>

      <fieldset className="ch-field">
        <legend className="form-label">Format</legend>
        <div className="ch-seg" role="group">
          {CHALLENGES.FORMATS.map((f) => (
            <button key={f.id} type="button" className={`st-seg${format === f.id ? ' is-on' : ''}`} aria-pressed={format === f.id}
              onClick={() => { setFormat(f.id); setTarget(null); if (f.topic === 'none') setTopic('') }}>
              {f.name}
            </button>
          ))}
        </div>
        <p className="ch-help">{spec.desc}.</p>
      </fieldset>

      {spec.topic !== 'none' && (
        <div className="form-field ch-field">
          <label className="form-label" htmlFor="ch-topic">Module{spec.topic === 'optional' ? ' (optional)' : ''}</label>
          <select id="ch-topic" className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">{spec.topic === 'optional' ? 'Any module' : 'Choose a module'}</option>
            {SECTIONS.map((s, i) => <option key={s.id} value={s.id}>Module {i + 1} · {s.title}</option>)}
          </select>
        </div>
      )}

      <fieldset className="ch-field">
        <legend className="form-label">Target (optional)</legend>
        <div className="ch-seg" role="group">
          <button type="button" className={`st-seg${target === null ? ' is-on' : ''}`} aria-pressed={target === null} onClick={() => setTarget(null)}>Most by the end</button>
          {spec.targets.map((t) => (
            <button key={t} type="button" className={`st-seg${target === t ? ' is-on' : ''}`} aria-pressed={target === t} onClick={() => setTarget(t)}>
              First to {t}{spec.unit === '%' ? '%' : ` ${spec.unit}`}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="ch-field">
        <legend className="form-label">How long</legend>
        <div className="ch-seg" role="group">
          {CHALLENGES.DURATIONS_DAYS.map((d) => (
            <button key={d} type="button" className={`st-seg${days === d ? ' is-on' : ''}`} aria-pressed={days === d} onClick={() => setDays(d)}>
              {d} day{d === 1 ? '' : 's'}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="ch-field">
        <legend className="form-label">Invite (up to {CHALLENGES.MAX_INVITES})</legend>
        {friends.length ? (
          <ul className="ch-friends">
            {friends.map((f) => (
              <li key={f.id}>
                <label className="ch-friend">
                  <input type="checkbox" checked={picked.includes(f.id)} onChange={() => toggle(f.id)} disabled={!picked.includes(f.id) && picked.length >= CHALLENGES.MAX_INVITES} />
                  <Avatar name={f.username} color={f.avatar} size={24} />
                  <span>{f.username}</span>
                  {f.isTest && <TestTag />}
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="ch-help">You need a friend to challenge — add one in Add friends.</p>}
      </fieldset>

      {error && <p className="fr-error" role="alert">{error}</p>}
      <div className="ch-actions">
        <button type="submit" className="btn btn-primary" disabled={busy || !friends.length}>{busy ? 'Starting…' : 'Start the challenge'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function Standings({ challenge, onOpen }) {
  const leader = Math.max(1, ...challenge.standings.map((s) => s.score))
  const max = challenge.target ?? leader
  const unit = challenge.unit === '%' ? '%' : ` ${challenge.unit}`
  return (
    <ul className="sl ch-standings">
      {challenge.standings.map((p) => (
        <li key={p.id} className={`sl-row ch-row${p.isYou ? ' is-you' : ''}`}>
          <span className="ch-rank tnum">{challenge.status === 'completed' && challenge.winners.includes(p.id) ? <Trophy tone="gold" emblem="swords" size={24} /> : p.rank}</span>
          <span className="ch-who">
            {p.isYou
              ? <span className="sl-open"><Avatar name={p.username} color={p.avatar} size={28} /><span className="sl-name"><span>{p.username}</span></span></span>
              : <button type="button" className="sl-open" onClick={() => onOpen(p.id)}><Avatar name={p.username} color={p.avatar} size={28} /><span className="sl-name"><span>{p.username}</span>{p.isTest && <TestTag />}</span></button>}
            <span className="ch-track" aria-hidden="true"><span className={`ch-fill${p.isYou ? ' is-you' : ''}`} style={{ width: `${Math.min(100, Math.round((p.score / max) * 100))}%` }} /></span>
          </span>
          <span className="sl-figure">{p.score}{unit}</span>
        </li>
      ))}
    </ul>
  )
}

function ChallengeCard({ challenge, onOpen, onAction, onClaim, busy }) {
  const title = `${challenge.formatName}${challenge.topicTitle ? ` · ${challenge.topicTitle}` : ''}`
  const target = challenge.target != null ? `First to ${challenge.target}${challenge.unit === '%' ? '%' : ` ${challenge.unit}`}` : 'Most by the end'
  const live = challenge.status === 'active'
  const mine = challenge.myStatus
  const creatorAlone = live && challenge.standings.length === 1 && challenge.standings[0].isYou
  return (
    <article className={`ch-card is-${challenge.status}`} aria-label={title}>
      <header className="ch-card-head">
        <div>
          <h4 className="ch-title">{title}</h4>
          <p className="ch-meta">
            {target}
            {live && <> · <Countdown endAt={challenge.endsAt} prefix="ends in " /></>}
            {challenge.status === 'completed' && <> · finished {new Date(challenge.endsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>}
          </p>
        </div>
        {live && mine === 'accepted' && !creatorAlone && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onAction(challenge, 'leave')}>Leave</button>}
        {creatorAlone && challenge.creatorId && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onAction(challenge, 'cancel')}>Call off</button>}
      </header>

      {challenge.status === 'cancelled'
        ? <p className="ch-help">Called off. {CANCEL_REASON[challenge.cancelReason] ?? ''}</p>
        : <Standings challenge={challenge} onOpen={onOpen} />}

      {live && challenge.invited.length > 0 && (
        <p className="ch-help">Waiting for {challenge.invited.map((p) => p.username).join(', ')} to answer.</p>
      )}

      {challenge.status === 'completed' && (
        <p className="ch-result">
          {challenge.winners.length === 0 && 'Nobody scored — no winner this time.'}
          {challenge.winners.length > 0 && (challenge.winners.length > 1 ? 'A shared win.' : `${challenge.standings.find((s) => s.id === challenge.winners[0])?.username} won.`)}
          {challenge.reward && !challenge.reward.claimed_at && (
            <button type="button" className="btn btn-sm sx-claim" disabled={busy} onClick={() => onClaim(challenge.reward)}>
              <GemIcon size={15} /> Claim {challenge.reward.gems}
            </button>
          )}
          {challenge.reward?.claimed_at && <span className="sx-claimed"><Icon name="check" size={14} /> {challenge.reward.gems} gems claimed</span>}
        </p>
      )}
    </article>
  )
}

export default function ChallengesPanel({ prefill, onUsed, onOpen, version, onChanged }) {
  const social = useSocial()
  const [list, setList] = useState({ loading: true })
  const [friends, setFriends] = useState([])
  const [creating, setCreating] = useState(Boolean(prefill))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  const load = useCallback(async () => {
    const [c, f] = await Promise.all([api.get('/api/challenges'), api.get('/api/friends')])
    setList(c.ok ? { items: c.data.challenges } : { error: c })
    if (f.ok) setFriends(f.data.friends)
  }, [])
  useEffect(() => { load() }, [load, version])
  useEffect(() => { if (prefill) setCreating(true) }, [prefill])

  const action = async (challenge, verb) => {
    setBusy(true)
    const r = await api.post(`/api/challenges/${challenge.id}/${verb}`, {})
    setBusy(false)
    setNote(r.ok ? null : { tone: 'bad', text: r.message })
    load()
    onChanged()
  }

  const claim = async (reward) => {
    setBusy(true)
    await social?.claim({ id: reward.id, gems: reward.gems, kind: 'challenge-win' })
    setBusy(false)
    load()
  }

  if (list.loading) return <Notice kind="loading" title="Loading challenges…" />
  if (list.error) return <Notice kind="error" title="Challenges couldn’t be loaded." onRetry={load}>{list.error.message}</Notice>

  const invites = list.items.filter((c) => c.status === 'active' && c.myStatus === 'invited')
  const running = list.items.filter((c) => c.status === 'active' && c.myStatus === 'accepted')
  const finished = list.items.filter((c) => c.status !== 'active').slice(0, 6)

  return (
    <div className="fr-stack">
      <p className="ch-league-note"><Icon name="info" size={14} /> Challenges are between friends, in any league. They never change your league XP or your place on a board.</p>

      {creating ? (
        <CreateForm
          friends={friends}
          prefill={prefill}
          onCancel={() => { setCreating(false); onUsed() }}
          onCreated={() => { setCreating(false); onUsed(); setNote({ tone: 'ok', text: 'Challenge started — your friends have been invited.' }); load(); onChanged() }}
        />
      ) : (
        <button type="button" className="btn btn-primary ch-new" onClick={() => setCreating(true)} disabled={!friends.length}>
          <Icon name="swords" size={16} /> New challenge
        </button>
      )}
      {!friends.length && !creating && <p className="fr-quiet">Add a friend first — challenges are between friends.</p>}
      {note && <p className={`fr-note is-${note.tone}`} role="status">{note.text}</p>}

      {invites.length > 0 && (
        <section aria-labelledby="ch-inv-title">
          <h3 className="qp-section-title" id="ch-inv-title">Invitations</h3>
          <ul className="sl">
            {invites.map((c) => {
              const from = c.standings.find((s) => s.id === c.creatorId)
              return (
                <li key={c.id} className="sl-row ch-invite">
                  <Avatar name={from?.username ?? '?'} color={from?.avatar} size={32} />
                  <span className="sl-who">
                    <span className="sl-name"><span>{from?.username ?? 'A friend'} challenged you</span></span>
                    <span className="sl-sub">{c.formatName}{c.topicTitle ? ` · ${c.topicTitle}` : ''} · <Countdown endAt={c.endsAt} prefix="ends in " /></span>
                  </span>
                  <span className="sl-end">
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => action(c, 'accept')}>Accept</button>
                    <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => action(c, 'decline')}>Decline</button>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="ch-run-title">
        <h3 className="qp-section-title" id="ch-run-title">Running</h3>
        {running.length
          ? running.map((c) => <ChallengeCard key={c.id} challenge={c} onOpen={onOpen} onAction={action} onClaim={claim} busy={busy} />)
          : <p className="fr-quiet">No challenges running. Start one, or accept an invitation.</p>}
      </section>

      {finished.length > 0 && (
        <section aria-labelledby="ch-done-title">
          <h3 className="qp-section-title" id="ch-done-title">Finished</h3>
          {finished.map((c) => <ChallengeCard key={c.id} challenge={c} onOpen={onOpen} onAction={action} onClaim={claim} busy={busy} />)}
        </section>
      )}
    </div>
  )
}
