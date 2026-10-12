/* ═══════════════════════════════════════════════════════════════════════════
   ProfileCard.jsx — ANOTHER LEARNER'S PUBLIC PROFILE (revision 10)
   ---------------------------------------------------------------------------
   A small dialog (COMPONENT_RULES.md → Friends → The profile card). What it
   shows is what the SERVER decided this viewer may see (server/friends.js →
   profile): a private or friends-only profile arrives with its name and its
   league and nothing else, and no profile ever carries an email.

   Its actions follow the relationship: send a request, accept one, challenge
   a friend, remove a friend — and, for anyone, block or report. Block and
   remove ask once, in place; nothing here is a surprise.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api'
import useDialog from '../../hooks/useDialog'
import { Icon } from '../progression/Icons'
import { LeagueBadge, AwardArt } from '../leagues/LeagueArt'
import { leagueOf } from '../../config/leagueConfig'
import { Avatar, TestTag, Notice } from './SocialBits'

const REASONS = [
  ['inappropriate-name', 'An inappropriate username'],
  ['harassment', 'Harassment or bullying'],
  ['cheating', 'Cheating'],
  ['spam', 'Spam'],
  ['other', 'Something else'],
]

const RELATION = {
  self: 'This is you',
  friend: 'Friends',
  requested: 'Friend request sent',
  incoming: 'Wants to be your friend',
  none: '',
}

const monthYear = (t) => new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
const shortDate = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function ProfileCard({ userId, onClose, onChanged, onChallenge }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const [confirm, setConfirm] = useState(null) // 'remove' | 'block' | 'report'
  const [reason, setReason] = useState('inappropriate-name')
  const [detail, setDetail] = useState('')
  const [leaving, setLeaving] = useState(false)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  const close = () => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onClose, 180)
  }
  useDialog(dialogRef, { onClose: close })

  const load = async () => {
    setError(null)
    const r = await api.get(`/api/users/${encodeURIComponent(userId)}`)
    if (r.ok) setProfile(r.data.profile)
    else setError(r)
  }
  useEffect(() => { load() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { closeRef.current?.focus() }, [])

  const act = async (fn, done) => {
    if (busy) return null
    setBusy(true)
    setNote(null)
    const r = await fn()
    setBusy(false)
    if (!r.ok) { setNote({ tone: 'bad', text: r.message }); return r }
    setConfirm(null)
    if (done) setNote({ tone: 'ok', text: done(r) })
    onChanged?.()
    load()
    return r
  }

  const name = profile?.username ?? 'Learner'
  const league = profile ? leagueOf(profile.tier) : null

  return (
    <div className={`sd-layer${leaving ? ' is-leaving' : ''}`} role="presentation">
      <div className="sd-scrim" onClick={close} aria-hidden="true" />
      <div className="sd" role="dialog" aria-modal="true" aria-labelledby="pc-name" ref={dialogRef}>
        <button ref={closeRef} type="button" className="sd-close" onClick={close} aria-label="Close profile">
          <Icon name="close" size={16} strokeWidth={2.4} />
        </button>

        {!profile && !error && <Notice kind="loading" title="Opening the profile…" />}
        {error && <Notice kind="error" title="That profile isn’t available." onRetry={error.status === 404 ? null : load}>{error.message}</Notice>}

        {profile && (
          <>
            <header className="pc-head">
              <Avatar name={name} color={profile.avatar} size={56} />
              <div className="pc-id">
                <h2 className="pc-name" id="pc-name">{name}</h2>
                <p className="pc-meta">
                  {profile.isTest && <TestTag />}
                  {RELATION[profile.relation] && <span>{RELATION[profile.relation]}</span>}
                </p>
              </div>
            </header>

            <div className="pc-league">
              <LeagueBadge tier={profile.tier} size={28} />
              <span>{league.name} League</span>
              {profile.bestTier > profile.tier && <span className="pc-best">best: {leagueOf(profile.bestTier).name}</span>}
            </div>

            {profile.private ? (
              <p className="pc-private">
                <Icon name="eye-off" size={16} />
                {profile.visibility === 'friends' ? `Only ${name}’s friends can see more.` : `${name} keeps their profile private.`}
              </p>
            ) : (
              <>
                <dl className="pc-figures">
                  <div><dt>This week</dt><dd className="tnum">{profile.weeklyXp} XP</dd></div>
                  <div><dt>League XP</dt><dd className="tnum">{profile.totalXp}</dd></div>
                  <div><dt>Lessons</dt><dd className="tnum">{profile.lessons}</dd></div>
                  <div><dt>Streak</dt><dd className="tnum">{profile.streak} day{profile.streak === 1 ? '' : 's'}</dd></div>
                </dl>
                <p className="pc-since">Learning on LunX since {monthYear(profile.joinedAt)}.</p>
                {profile.trophies?.length > 0 ? (
                  <ul className="pc-trophies" aria-label="Trophies">
                    {profile.trophies.slice(0, 6).map((t) => (
                      <li key={t.id}>
                        <AwardArt award={t} size={32} />
                        <span><b>{t.title}</b><em>{t.reason} · {shortDate(t.createdAt)}</em></span>
                      </li>
                    ))}
                    {profile.trophies.length > 6 && <li className="pc-more">and {profile.trophies.length - 6} more</li>}
                  </ul>
                ) : (
                  <p className="pc-since">No trophies yet.</p>
                )}
              </>
            )}

            {profile.relation !== 'self' && (
              <div className="pc-actions">
                {profile.relation === 'none' && (
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy}
                    onClick={() => act(() => api.post('/api/friends/requests', { userId: profile.id, via: 'profile' }), (r) => (r.data.status === 'accepted' ? `You and ${name} are friends.` : `Request sent to ${name}.`))}>
                    <Icon name="user-plus" size={16} /> Send friend request
                  </button>
                )}
                {profile.relation === 'incoming' && (
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy}
                    onClick={() => act(() => api.post('/api/friends/requests', { userId: profile.id, via: 'profile' }), () => `You and ${name} are friends.`)}>
                    <Icon name="user-check" size={16} /> Accept request
                  </button>
                )}
                {profile.relation === 'requested' && (
                  <button type="button" className="btn btn-outline btn-sm" disabled>Request sent</button>
                )}
                {profile.relation === 'friend' && onChallenge && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => { onChallenge(profile.id); close() }}>
                    <Icon name="swords" size={16} /> Challenge
                  </button>
                )}
                {profile.relation === 'friend' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('remove')}>
                    <Icon name="user-minus" size={16} /> Remove
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('block')}><Icon name="ban" size={16} /> Block</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('report')}><Icon name="flag" size={16} /> Report</button>
              </div>
            )}

            {confirm === 'remove' && (
              <div className="pc-confirm" role="group" aria-label={`Remove ${name}`}>
                <p>Remove {name} from your friends? You can send a new request later.</p>
                <div className="pc-confirm-actions">
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => act(() => api.del(`/api/friends/${profile.id}`), () => `${name} is no longer your friend.`)}>Remove</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
                </div>
              </div>
            )}

            {confirm === 'block' && (
              <div className="pc-confirm" role="group" aria-label={`Block ${name}`}>
                <p>Block {name}? You stop being friends, any requests or invitations between you are withdrawn, and neither of you can find the other. You can unblock them from Profile → Privacy.</p>
                <div className="pc-confirm-actions">
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy}
                    onClick={async () => { const r = await act(() => api.post('/api/blocks', { userId: profile.id }), () => `${name} is blocked.`); if (r?.ok) close() }}>Block</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
                </div>
              </div>
            )}

            {confirm === 'report' && (
              <form className="pc-confirm" onSubmit={(e) => { e.preventDefault(); act(() => api.post('/api/reports', { userId: profile.id, reason, note: detail }), () => 'Report sent to the people who run this LunX server. Thank you.') }}>
                <p>What is wrong? Your report goes to the people who run this LunX server; {name} is not told who sent it.</p>
                <div className="form-field">
                  <label className="form-label" htmlFor="pc-reason">Reason</label>
                  <select id="pc-reason" className="form-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                    {REASONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="pc-detail">Anything to add <span className="pc-optional">(optional)</span></label>
                  <textarea id="pc-detail" className="form-input" rows={2} maxLength={500} value={detail} onChange={(e) => setDetail(e.target.value)} />
                </div>
                <div className="pc-confirm-actions">
                  <button type="submit" className="btn btn-outline btn-sm" disabled={busy}>Send report</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
                </div>
              </form>
            )}

            <p className={`pc-note${note ? ` is-${note.tone}` : ''}`} role="status">{note?.text ?? ''}</p>
          </>
        )}
      </div>
    </div>
  )
}
