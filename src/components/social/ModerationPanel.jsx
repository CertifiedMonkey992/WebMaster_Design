/* ═══════════════════════════════════════════════════════════════════════════
   ModerationPanel.jsx — REPORTS, FOR MODERATORS (connected builds only)
   ---------------------------------------------------------------------------
   Profile → Moderation, shown only to an account the server marks as a
   moderator (`npm run server -- --make-moderator <username>`). Everything
   here is decided by the server (server/moderation.js); this lists what it
   returns and sends what the moderator chose.

     Open / Closed   the reports, oldest open first; who was reported, by
                     whom, the reason, their note, and how many people have
                     reported the same account
     per report      Dismiss · Reset name · Suspend (1, 7, 30 days or until
                     lifted) · Delete account. Suspending and deleting ask
                     once, inline, with an optional note for the log
     the log         the latest actions — who did what to whom — so
                     moderation is never silent

   COMPONENT_RULES.md → Moderation.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Avatar, TestTag, Notice } from './SocialBits'
import './social.css'

const REASON = {
  'inappropriate-name': 'Inappropriate username',
  harassment: 'Harassment or bullying',
  cheating: 'Cheating',
  spam: 'Spam',
  other: 'Something else',
}

const RESOLUTION = {
  dismissed: 'Dismissed',
  'name-reset': 'Username reset',
  suspended: 'Suspended until lifted',
  'suspended-1d': 'Suspended for 1 day',
  'suspended-7d': 'Suspended for 7 days',
  'suspended-30d': 'Suspended for 30 days',
  deleted: 'Account deleted',
}

/* [before the name, after it] */
const ACTION = {
  dismiss: ['dismissed a report about', ''],
  'reset-name': ['reset the username of', ''],
  suspend: ['suspended', 'until lifted'],
  'suspend-1d': ['suspended', 'for 1 day'],
  'suspend-7d': ['suspended', 'for 7 days'],
  'suspend-30d': ['suspended', 'for 30 days'],
  lift: ['lifted the suspension of', ''],
  delete: ['deleted the account of', ''],
}

const SUSPEND = [
  { days: 1, label: '1 day' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: null, label: 'Until lifted' },
]

const when = (t) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function ModerationPanel() {
  const [tab, setTab] = useState('open')
  const [data, setData] = useState(null)
  const [log, setLog] = useState([])
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    const [r, l] = await Promise.all([api.get(`/api/mod/reports?status=${tab}`), api.get('/api/mod/log')])
    if (!r.ok) { setError(r); return }
    setData(r.data)
    if (l.ok) setLog(l.data.log)
  }, [tab])

  useEffect(() => { setData(null); load() }, [load])

  return (
    <section className="pv-data md" id="moderation" aria-labelledby="pv-mod-title">
      <div>
        <h3 className="pv-data-title" id="pv-mod-title">Moderation</h3>
        <p className="pv-data-desc">
          Reports learners have made. Acting on an account closes every open report about it,
          and every action is recorded in the log below.
        </p>
      </div>

      <div className="ch-seg" role="tablist" aria-label="Which reports">
        {[['open', `Open${data && tab === 'open' ? ` (${data.open})` : ''}`], ['closed', 'Closed']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`st-seg${tab === id ? ' is-on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {!data && !error && <Notice kind="loading" title="Loading reports…" />}
      {error && <Notice kind="error" title="Couldn’t load the reports." onRetry={load}>{error.message}</Notice>}
      {data && data.reports.length === 0 && (
        <Notice title={tab === 'open' ? 'No open reports' : 'Nothing closed yet'}>
          {tab === 'open' ? 'When a learner reports someone, it appears here.' : 'Reports you dismiss or act on move here.'}
        </Notice>
      )}
      {data && data.reports.length > 0 && (
        <ul className="sl md-list">
          {data.reports.map((r) => <Report key={r.id} report={r} open={tab === 'open'} onDone={load} />)}
        </ul>
      )}

      {log.length > 0 && (
        <div className="md-log">
          <span className="form-label">Recent actions</span>
          <ul>
            {log.slice(0, 12).map((l) => (
              <li key={l.id}>
                <b>{l.moderator ?? 'A moderator'}</b> {ACTION[l.action]?.[0] ?? l.action} <b>{l.target ?? 'a deleted account'}</b>
                {ACTION[l.action]?.[1] && <> {ACTION[l.action][1]}</>}
                {l.note && <> — “{l.note}”</>}
                <span className="md-when"> · {when(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Report({ report: r, open, onDone }) {
  const [confirm, setConfirm] = useState(null) // 'suspend' | 'delete'
  const [days, setDays] = useState(7)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState(null)
  const who = r.reported
  const canAct = open && !who.deleted && !who.protected

  const act = async (path, body, done) => {
    setBusy(true)
    setSaid(null)
    const res = await api.post(path, body)
    setBusy(false)
    if (!res.ok) { setSaid({ tone: 'bad', text: res.message }); return }
    setSaid({ tone: 'ok', text: done(res.data) })
    setConfirm(null)
    window.setTimeout(onDone, 900)
  }

  const userPath = `/api/mod/users/${encodeURIComponent(who.id ?? '')}`
  const base = { reportId: r.id, note: note.trim() || undefined }

  return (
    <li className="md-item">
      <div className="md-head">
        <Avatar name={who.username} color={who.avatar} size={28} />
        <div className="sl-who">
          <span className="sl-name"><span>{who.username ?? 'Deleted account'}</span>{who.isTest && <TestTag />}</span>
          <span className="md-meta">
            {REASON[r.reason] ?? r.reason} · reported by {r.reporter?.username ?? 'a deleted account'} · {when(r.createdAt)}
          </span>
        </div>
      </div>
      {r.note && <p className="md-note">“{r.note}”</p>}
      <p className="md-facts">
        {who.deleted
          ? 'This account no longer exists.'
          : <>
              {who.reports > 1 ? `${who.reports} different learners have reported this account.` : 'One learner has reported this account.'}
              {who.suspendedUntil && <> {who.indefinite ? 'Suspended until lifted.' : `Suspended until ${when(who.suspendedUntil)}.`}</>}
              {who.protected && <> This account can’t be moderated here.</>}
            </>}
        {!open && r.resolution && <> <b>{RESOLUTION[r.resolution] ?? r.resolution}</b>{r.resolvedAt ? ` · ${when(r.resolvedAt)}` : ''}.</>}
      </p>

      {open && (
        <div className="pv-data-actions">
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act(`/api/mod/reports/${r.id}/dismiss`, { note: note.trim() || undefined }, () => 'Dismissed.')}>Dismiss</button>
          {canAct && <>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => act(`${userPath}/reset-name`, base, (d) => `Renamed to ${d.username}. They’ve been told why.`)}>Reset name</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} aria-expanded={confirm === 'suspend'} onClick={() => setConfirm(confirm === 'suspend' ? null : 'suspend')}>Suspend…</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} aria-expanded={confirm === 'delete'} onClick={() => setConfirm(confirm === 'delete' ? null : 'delete')}>Delete account…</button>
          </>}
        </div>
      )}

      {confirm && (
        <div className="pv-data-confirm" role="group" aria-label={confirm === 'suspend' ? `Suspend ${who.username}` : `Delete ${who.username}`}>
          {confirm === 'suspend'
            ? <>
                <p>Suspend <b>{who.username}</b>? They are signed out everywhere, leave this week’s board and every search, and can’t sign in until it ends.</p>
                <div className="ch-seg" role="radiogroup" aria-label="For how long">
                  {SUSPEND.map((s) => (
                    <button key={s.label} type="button" role="radio" aria-checked={days === s.days} className={`st-seg${days === s.days ? ' is-on' : ''}`} onClick={() => setDays(s.days)}>{s.label}</button>
                  ))}
                </div>
              </>
            : <p>Delete <b>{who.username}</b>’s account and everything in it — progress, friends, league history and challenges? This can’t be undone.</p>}
          <div className="form-field">
            <label className="form-label" htmlFor={`md-note-${r.id}`}>Note for the log (optional)</label>
            <input id={`md-note-${r.id}`} className="form-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="pv-data-actions">
            {confirm === 'suspend'
              ? <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(`${userPath}/suspend`, { ...base, days }, (d) => `Suspended ${d.label}.`)}>{busy ? 'Suspending…' : 'Suspend'}</button>
              : <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(`${userPath}/delete`, base, () => 'Account deleted.')}>{busy ? 'Deleting…' : 'Delete account'}</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!open && who.suspendedUntil && !who.protected && (
        <div className="pv-data-actions">
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => act(`${userPath}/lift`, {}, () => 'Suspension lifted.')}>Lift suspension</button>
        </div>
      )}

      <p className={`pv-data-note${said ? ` is-${said.tone}` : ''}`} role="status">{said?.text ?? ''}</p>
    </li>
  )
}
