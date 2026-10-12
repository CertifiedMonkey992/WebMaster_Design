/* ═══════════════════════════════════════════════════════════════════════════
   FriendsView.jsx — THE FRIENDS DESTINATION (revision 10, connected builds)
   ---------------------------------------------------------------------------
   The learner's own people, separate from the leagues: a friend can be in
   any league (COMPONENT_RULES.md → Friends). Four sections behind the board's
   segmented control:

     Friends      who they are, their league, this week's and total league XP
     Requests     incoming (accept / decline) and outgoing (cancel)
     Add friends  the learner's own code, and three ways to look someone up —
                  code, username, email. Looking never sends anything: every
                  result has its own "Send request" button.
     Challenges   friend challenges (ChallengesPanel.jsx)

   Every list is the server's answer (server/friends.js); nothing here is
   kept or guessed in the browser.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { api } from '../../services/api'
import { useSocial } from '../../state/SocialContext'
import { useAuth } from '../../state/AuthContext'
import { leagueOf } from '../../config/leagueConfig'
import { isFriendCode } from '../../utils/accountRules'
import { LeagueBadge } from '../leagues/LeagueArt'
import { Avatar, TestTag, Notice } from '../social/SocialBits'
import ProfileCard from '../social/ProfileCard'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { Icon } from '../progression/Icons'
import SplitText from '../../motion/SplitText'
import ChallengesPanel from './ChallengesPanel'
import './friends.css'

const TABS = [
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'requests', label: 'Requests', icon: 'user-plus' },
  { id: 'add', label: 'Add friends', icon: 'search' },
  { id: 'challenges', label: 'Challenges', icon: 'swords' },
]

const when = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** One learner as a row: avatar, name, league — opening their profile. */
function PersonRow({ person, onOpen, sub, children }) {
  return (
    <li className="sl-row fr-row">
      <button type="button" className="sl-open" onClick={() => onOpen(person.id)} aria-label={`${person.username} — open profile`}>
        <Avatar name={person.username} color={person.avatar} size={36} />
        <span className="sl-who">
          <span className="sl-name"><span>{person.username}</span>{person.isTest && <TestTag />}</span>
          <span className="sl-sub"><LeagueBadge tier={person.tier ?? 0} size={16} /> {leagueOf(person.tier ?? 0).name}{sub ? <> · {sub}</> : null}</span>
        </span>
      </button>
      <span className="sl-end">{children}</span>
    </li>
  )
}

/* ── Friends ── */

function FriendsList({ onOpen, onChallenge, onAdd, version }) {
  const [state, setState] = useState({ loading: true })
  const load = useCallback(async () => {
    const r = await api.get('/api/friends')
    setState(r.ok ? { friends: r.data.friends } : { error: r })
  }, [])
  useEffect(() => { load() }, [load, version])

  if (state.loading) return <Notice kind="loading" title="Loading your friends…" />
  if (state.error) return <Notice kind="error" title="Your friends couldn’t be loaded." onRetry={load}>{state.error.message}</Notice>
  if (!state.friends.length) {
    return (
      <Notice kind="empty" title="No friends yet" action={<button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Icon name="user-plus" size={16} /> Add friends</button>}>
        Share your friend code, or look someone up by their code, username or email. Friends can see each other’s progress and challenge each other.
      </Notice>
    )
  }
  return (
    <ul className="sl" aria-label="Your friends">
      {state.friends.map((f) => (
        <PersonRow key={f.id} person={f} onOpen={onOpen} sub={`${f.totalXp} league XP`}>
          <span className="sl-figure">{f.weeklyXp} <small>XP this week</small></span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChallenge(f.id)} aria-label={`Challenge ${f.username}`}>
            <Icon name="swords" size={16} /> <span className="fr-hide-narrow">Challenge</span>
          </button>
        </PersonRow>
      ))}
    </ul>
  )
}

/* ── Requests ── */

function Requests({ onOpen, onChanged, version }) {
  const [state, setState] = useState({ loading: true })
  const [busy, setBusy] = useState(null)
  const [note, setNote] = useState(null)
  const load = useCallback(async () => {
    const r = await api.get('/api/friends/requests')
    setState(r.ok ? r.data : { error: r })
  }, [])
  useEffect(() => { load() }, [load, version])

  const act = async (id, action, done) => {
    setBusy(id)
    const r = await api.post(`/api/friends/requests/${id}/${action}`, {})
    setBusy(null)
    setNote(r.ok ? { tone: 'ok', text: done } : { tone: 'bad', text: r.message })
    load()
    onChanged()
  }

  if (state.loading) return <Notice kind="loading" title="Loading requests…" />
  if (state.error) return <Notice kind="error" title="Requests couldn’t be loaded." onRetry={load}>{state.error.message}</Notice>
  return (
    <div className="fr-stack">
      <section aria-labelledby="fr-in-title">
        <h3 className="qp-section-title" id="fr-in-title">Waiting for you</h3>
        {state.incoming.length ? (
          <ul className="sl">
            {state.incoming.map((r) => (
              <PersonRow key={r.id} person={r.user} onOpen={onOpen} sub={`sent ${when(r.createdAt)}`}>
                <button type="button" className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => act(r.id, 'accept', `You and ${r.user.username} are friends now.`)}>Accept</button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => act(r.id, 'decline', 'Request declined.')}>Decline</button>
              </PersonRow>
            ))}
          </ul>
        ) : <p className="fr-quiet">No requests waiting. When someone adds you, it appears here.</p>}
      </section>
      <section aria-labelledby="fr-out-title">
        <h3 className="qp-section-title" id="fr-out-title">Sent by you</h3>
        {state.outgoing.length ? (
          <ul className="sl">
            {state.outgoing.map((r) => (
              <PersonRow key={r.id} person={r.user} onOpen={onOpen} sub={`sent ${when(r.createdAt)} · waiting`}>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => act(r.id, 'cancel', 'Request cancelled.')}>Cancel</button>
              </PersonRow>
            ))}
          </ul>
        ) : <p className="fr-quiet">No requests waiting on anyone.</p>}
      </section>
      <p className={`fr-note${note ? ` is-${note.tone}` : ''}`} role="status">{note?.text ?? ''}</p>
    </div>
  )
}

/* ── Add friends ── */

function MyCode({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { setCopied(false) }
  }
  return (
    <section className="fr-code" aria-labelledby="fr-code-title">
      <h3 className="fr-code-title" id="fr-code-title">Your friend code</h3>
      <p className="fr-code-help">Give it to a friend. Anyone with it can send you a request — no email or username needed.</p>
      <div className="fr-code-row">
        <code className="fr-code-text" aria-label={`Your friend code: ${code.split('').join(' ')}`}>{code}</code>
        <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} /> <span className="fr-copy-label" key={copied ? 'y' : 'n'}>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
        <span className="pg-sr-only" role="status">{copied ? 'Friend code copied' : ''}</span>
      </div>
    </section>
  )
}

const LOOKUPS = {
  code: { label: 'Friend code', icon: 'hash', placeholder: 'ABCD-2345', button: 'Find', help: 'Eight letters and numbers. Letters like O and 0 are read the same.' },
  username: { label: 'Username', icon: 'search', placeholder: 'Start of a username', button: 'Search', help: 'Finds learners who let people find them by username.' },
  email: { label: 'Email', icon: 'mail', placeholder: 'friend@school.edu', button: 'Find', help: 'Only finds someone who turned on “Let people who know my email find me”. Their address is never shown — and nobody can tell from the answer whether an address has an account.' },
}

function Lookup({ kind, onOpen, onChanged }) {
  const spec = LOOKUPS[kind]
  const [value, setValue] = useState('')
  const [state, setState] = useState(null) // null | { loading } | { results } | { error }
  const [busy, setBusy] = useState(null)
  const [sent, setSent] = useState({})

  const search = async (e) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    if (kind === 'code' && !isFriendCode(q)) { setState({ error: { message: 'Friend codes are 8 letters and numbers, like ABCD-2345.' } }); return }
    setState({ loading: true })
    const r = kind === 'code'
      ? await api.get(`/api/users/code/${encodeURIComponent(q)}`)
      : kind === 'username'
        ? await api.get(`/api/users/search?username=${encodeURIComponent(q)}`)
        : await api.post('/api/users/find-by-email', { email: q })
    setState(r.ok ? { results: r.data.results, q } : { error: r })
  }

  const request = async (person) => {
    setBusy(person.id)
    const r = await api.post('/api/friends/requests', { userId: person.id, via: kind })
    setBusy(null)
    setSent((s) => ({ ...s, [person.id]: r.ok ? (r.data.status === 'accepted' ? 'friends' : 'sent') : `error:${r.message}` }))
    onChanged()
  }

  const id = `fr-look-${kind}`
  return (
    <form className="fr-lookup" onSubmit={search} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor={id}><Icon name={spec.icon} size={14} /> {spec.label}</label>
        <div className="fr-lookup-row">
          <input
            id={id} className="form-input" value={value} placeholder={spec.placeholder}
            onChange={(e) => { setValue(e.target.value); setState(null) }}
            type={kind === 'email' ? 'email' : 'text'} autoComplete="off" autoCapitalize={kind === 'code' ? 'characters' : 'none'} spellCheck={false}
            aria-describedby={`${id}-help`}
          />
          <button type="submit" className="btn btn-outline btn-sm" disabled={!value.trim() || state?.loading}>{spec.button}</button>
        </div>
        <p className="fr-help" id={`${id}-help`}>{spec.help}</p>
      </div>
      <div aria-live="polite">
        {state?.loading && <p className="fr-quiet">Looking…</p>}
        {state?.error && <p className="fr-error" role="alert">{state.error.message}</p>}
        {state?.results && !state.results.length && (
          <p className="fr-quiet">{kind === 'email' ? 'Nobody we can show you has that address.' : kind === 'code' ? 'No learner has that code.' : `No usernames start with “${state.q}”.`}</p>
        )}
        {state?.results?.length > 0 && (
          <ul className="sl fr-results">
            {state.results.map((p) => {
              const done = sent[p.id]
              const relation = done === 'friends' ? 'friend' : done === 'sent' ? 'requested' : p.relation
              return (
                <PersonRow key={p.id} person={p} onOpen={onOpen}>
                  {relation === 'friend' && <span className="fr-state"><Icon name="user-check" size={16} /> Friends</span>}
                  {relation === 'requested' && <span className="fr-state">Request sent</span>}
                  {relation === 'incoming' && (
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === p.id} onClick={() => request(p)}>Accept their request</button>
                  )}
                  {relation === 'none' && (
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === p.id} onClick={() => request(p)}>
                      <Icon name="user-plus" size={16} /> Send request
                    </button>
                  )}
                  {done?.startsWith('error:') && <span className="fr-error">{done.slice(6)}</span>}
                </PersonRow>
              )
            })}
          </ul>
        )}
      </div>
    </form>
  )
}

function AddFriends({ code, onOpen, onChanged }) {
  return (
    <div className="fr-stack">
      <MyCode code={code} />
      <section className="fr-lookups" aria-labelledby="fr-find-title">
        <h3 className="qp-section-title" id="fr-find-title">Find someone</h3>
        <p className="fr-quiet">Looking someone up never sends anything — you choose whether to send a request.</p>
        <Lookup kind="code" onOpen={onOpen} onChanged={onChanged} />
        <Lookup kind="username" onOpen={onOpen} onChanged={onChanged} />
        <Lookup kind="email" onOpen={onOpen} onChanged={onChanged} />
      </section>
    </div>
  )
}

/* ── The view ── */

export default function FriendsView({ initialTab = 'friends' }) {
  const social = useSocial()
  const { account } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [open, setOpen] = useState(null)
  const [challengeWith, setChallengeWith] = useState(null)
  const [version, setVersion] = useState(0)
  const [note, setNote] = useState(null)
  const tabsRef = useRef(null)

  const changed = useCallback(() => { setVersion((v) => v + 1); social?.refresh() }, [social])

  useLayoutEffect(() => {
    const el = tabsRef.current
    if (!el) return undefined
    const place = () => {
      const active = el.querySelector('.qp-tab.is-active')
      if (!active) return
      el.style.setProperty('--tab-x', `${active.offsetLeft}px`)
      el.style.setProperty('--tab-w', `${active.offsetWidth}px`)
    }
    place()
    /* Tab widths change after the fact — a waiting count appears, the font
       arrives, the window narrows — and the indicator follows them. */
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
    el.querySelectorAll('.qp-tab').forEach((t) => ro?.observe(t))
    return () => ro?.disconnect()
  }, [tab])

  const challenge = (friendId) => { setChallengeWith(friendId); setTab('challenges') }

  /* The reviewer's sandbox: a test account sends a real request / challenge. */
  const review = async (path, done) => {
    const r = await api.post(path, {})
    setNote(r.ok ? { tone: 'ok', text: done(r.data) } : { tone: 'bad', text: r.message })
    changed()
  }

  const counts = { requests: social?.summary?.requests ?? 0, challenges: (social?.summary?.invites ?? 0) + (social?.badges?.challenges ?? 0) }

  return (
    <div className="qp-board frv">
      <header className="qp-board-head">
        <span className="qp-eyebrow">Friends</span>
        <SplitText as="h1" className="qp-title" immediate stagger={55}>Learn alongside the people you know</SplitText>
        <p className="fr-lead">Friends can see each other’s league and progress, and challenge each other. Friend challenges are separate from your league and never change it.</p>
      </header>

      <div className="qp-tabs fr-tabs" role="tablist" aria-label="Friends" ref={tabsRef}>
        <span className="qp-tab-ink" aria-hidden="true" />
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`fr-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`fr-panel-${t.id}`}
            className={`qp-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
            {counts[t.id] > 0 && <span className="qp-tab-badge" key={counts[t.id]}>{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {account?.role === 'judge' && (
        <JudgeMargin label="Sandbox controls" className="fr-judge">
          <JudgeChip icon="user-plus" label="Get a friend request" tip="A test account sends you a real friend request" onDone={() => review('/api/review/friend-request', (d) => `${d.from} sent you a friend request — see Requests.`)} />
          <JudgeChip icon="swords" label="Get a challenge" tip="A test friend invites you to a real XP race" onDone={() => review('/api/review/challenge', (d) => `${d.from} challenged you — see Challenges.`)} />
        </JudgeMargin>
      )}
      {note && <p className={`fr-note is-${note.tone}`} role="status">{note.text}</p>}

      <div className="qp-tab-view" key={tab} id={`fr-panel-${tab}`} role="tabpanel" aria-labelledby={`fr-tab-${tab}`}>
        {tab === 'friends' && <FriendsList onOpen={setOpen} onChallenge={challenge} onAdd={() => setTab('add')} version={version} />}
        {tab === 'requests' && <Requests onOpen={setOpen} onChanged={changed} version={version} />}
        {tab === 'add' && <AddFriends code={account?.friendCode ?? '—'} onOpen={setOpen} onChanged={changed} />}
        {tab === 'challenges' && <ChallengesPanel prefill={challengeWith} onUsed={() => setChallengeWith(null)} onOpen={setOpen} version={version} onChanged={changed} />}
      </div>

      {open && <ProfileCard userId={open} onClose={() => setOpen(null)} onChanged={changed} onChallenge={challenge} />}
    </div>
  )
}
