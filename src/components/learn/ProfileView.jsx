/* ═══════════════════════════════════════════════════════════════════════════
   ProfileView.jsx — STATS + ACHIEVEMENTS
   ---------------------------------------------------------------------------
   The permanent half of the progression system: lifetime statistics no reset
   can touch, plus the achievement wall.

   Revision 2: the level badge turns toward the pointer; the headline figures
   and all eight lifetime totals are tallied as they arrive; each tile's icon
   answers the pointer and its tooltip says what the figure counts.

   Revision 10: on a build connected to a LunX server the account section
   also holds the avatar and time zone, and a Privacy section says who can
   see and find the learner (COMPONENT_RULES.md → Privacy settings).
   Revision 11: a moderator's profile also holds Moderation — the reports
   learners have made, and what to do about them.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import LevelProgress from '../progression/LevelProgress'
import AchievementGrid from '../progression/AchievementGrid'
import { FieldKit, FieldJournal } from './CourseworkPanels'
import { GemIcon, BoltIcon, Icon } from '../progression/Icons'
import { LiveFlame } from '../progression/LiveIcons'
import { formatNumber } from '../../utils/progressionUtils'
import { getShortDate, getLocalDateKey } from '../../utils/dateUtils'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import CountUp from '../../motion/CountUp'
import { useAuth } from '../../state/AuthContext'
import { USERNAME_MIN, USERNAME_MAX } from '../../utils/accountRules'
import { CONNECTED, SERVER_HOST } from '../../config/serverConfig'
import { LEAGUE } from '../../config/leagueConfig'
import { api } from '../../services/api'
import { browserTimeZone } from '../../services/remoteAccountService'
import { Avatar, AVATAR_COLORS } from '../social/SocialBits'

/* Only moderators ever load it. */
const ModerationPanel = lazy(() => import('../social/ModerationPanel'))

/* Export and import of the learner's progress. The Terms warn that progress
   lives in this browser and can be lost with it; this is the way to keep a
   copy and bring it to another browser. */
function ProgressData() {
  const { actions } = useProgression()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)   // { name, text, summary }
  const [note, setNote] = useState(null)         // { tone: 'ok' | 'bad', text }

  const exportFile = () => {
    const blob = new Blob([actions.exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunx-progress-${getLocalDateKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNote({ tone: 'ok', text: 'Backup saved. Keep the file somewhere safe.' })
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch { /* handled below */ }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.xp !== 'number') {
      setPending(null)
      setNote({ tone: 'bad', text: 'That file is not a LunX backup.' })
      return
    }
    const lessons = parsed.lessons && typeof parsed.lessons === 'object' ? Object.keys(parsed.lessons).length : 0
    setNote(null)
    setPending({ name: file.name, text, summary: `${lessons} lessons, ${Math.max(0, Math.floor(parsed.xp))} XP, ${Math.max(0, Math.floor(parsed.gems ?? 0))} gems` })
  }

  const confirm = () => {
    const ok = actions.importProgress(pending.text)
    setPending(null)
    setNote(ok
      ? { tone: 'ok', text: 'Progress restored from your backup.' }
      : { tone: 'bad', text: 'That file could not be read as a LunX backup.' })
  }

  return (
    <section className="pv-data" aria-labelledby="pv-data-title">
      <div>
        <h3 className="pv-data-title" id="pv-data-title">Your data</h3>
        <p className="pv-data-desc">
          {CONNECTED
            ? <>Progress is saved to your account on {SERVER_HOST} and in this browser. A backup file is a copy you keep yourself; importing one replaces your progress on every device you sign in on.</>
            : <>Progress is saved only in this browser. Export a backup file to keep it, or to move it to another browser; importing replaces what is here.</>}
        </p>
      </div>
      <div className="pv-data-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={exportFile}>Export backup</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Import backup</button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={pick} hidden aria-label="Choose a LunX backup file" />
      </div>
      {pending && (
        <div className="pv-data-confirm" role="group" aria-label="Confirm import">
          <p>Replace your current progress with <b>{pending.name}</b> ({pending.summary})? This cannot be undone.</p>
          <div className="pv-data-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={confirm}>Replace my progress</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
      <p className={`pv-data-note${note ? ` is-${note.tone}` : ''}`} role="status">{note?.text ?? ''}</p>
    </section>
  )
}

/* The account: the public username (changeable here), the private email,
   the password, and the two ways out — sign out, or delete the account and
   its progress. The email is shown only here, to its owner. */
function AccountSettings() {
  const { account, displayName, isJudge, updateUsername, changePassword, signOut, forget } = useAuth()
  const [name, setName] = useState(account?.username ?? '')
  const [nameNote, setNameNote] = useState(null)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwNote, setPwNote] = useState(null)
  const [pwBusy, setPwBusy] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteNote, setDeleteNote] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  if (!account) return null

  const saveName = async (e) => {
    e.preventDefault()
    if (nameBusy) return
    if (name.trim() === (account.username ?? '')) { setNameNote({ tone: 'ok', text: 'No change to save.' }); return }
    setNameBusy(true)
    const result = await updateUsername(name)
    setNameBusy(false)
    setNameNote(result.ok ? { tone: 'ok', text: 'Username saved.' } : { tone: 'bad', text: result.error })
  }

  /* A connected account is deleted on the server, so the password is asked
     for first; a local one is removed from this browser on a second click. */
  const remove = async (e) => {
    e?.preventDefault()
    if (deleteBusy) return
    setDeleteBusy(true)
    const result = await forget(deletePw)
    setDeleteBusy(false)
    if (!result.ok) setDeleteNote(result.error)
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pwBusy) return
    setPwBusy(true)
    const result = await changePassword(pw)
    setPwBusy(false)
    if (result.ok) setPw({ current: '', next: '' })
    setPwNote(result.ok ? { tone: 'ok', text: 'Password changed.' } : { tone: 'bad', text: result.error })
  }

  return (
    <section className="pv-data pv-account" aria-labelledby="pv-account-title">
      <div>
        <h3 className="pv-data-title" id="pv-account-title">Account</h3>
        <p className="pv-data-desc">
          Signed in as <b>{displayName}</b>.{' '}
          {CONNECTED
            ? <>Your account is kept on the LunX server at {SERVER_HOST}, so you can sign in on any device.</>
            : <>Your account is stored in this browser on this device.</>}
        </p>
      </div>

      <form className="pv-account-row" onSubmit={saveName} noValidate>
        <div className="form-field">
          <label className="form-label" htmlFor="pv-username">Username</label>
          <input
            id="pv-username" className="form-input" value={name} maxLength={USERNAME_MAX}
            onChange={(e) => { setName(e.target.value); setNameNote(null) }}
            disabled={isJudge} autoComplete="nickname" autoCapitalize="none" spellCheck={false}
            aria-describedby="pv-username-note"
          />
        </div>
        <button type="submit" className="btn btn-outline btn-sm" disabled={isJudge || nameBusy}>{nameBusy ? 'Saving…' : 'Save'}</button>
        <p id="pv-username-note" className={`pv-data-note${nameNote ? ` is-${nameNote.tone}` : ''}`} role="status">
          {nameNote?.text ?? (CONNECTED
            ? `${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores. Other learners see it on boards and in friend lists.`
            : `${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores. Leave it empty to show “Learner”.`)}
        </p>
      </form>

      {account.email && (
        <div className="pv-account-fact">
          <span className="form-label">Email</span>
          <span className="pv-account-email">{account.email}</span>
          <span className="pv-data-note">Private — used to sign in, never shown to anyone else.</span>
        </div>
      )}

      {CONNECTED && <AvatarPicker />}
      {CONNECTED && <TimeZoneSetting />}

      {!isJudge && (
        <form className="pv-account-row pv-account-row--pw" onSubmit={savePassword} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="pv-pw-current">Current password</label>
            <input id="pv-pw-current" type="password" className="form-input" value={pw.current} autoComplete="current-password"
              onChange={(e) => { setPw((p) => ({ ...p, current: e.target.value })); setPwNote(null) }} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pv-pw-next">New password</label>
            <input id="pv-pw-next" type="password" className="form-input" value={pw.next} autoComplete="new-password"
              onChange={(e) => { setPw((p) => ({ ...p, next: e.target.value })); setPwNote(null) }} />
          </div>
          <button type="submit" className="btn btn-outline btn-sm" disabled={pwBusy || !pw.current || !pw.next}>
            {pwBusy ? 'Saving…' : 'Change password'}
          </button>
          <p className={`pv-data-note${pwNote ? ` is-${pwNote.tone}` : ''}`} role="status">{pwNote?.text ?? ''}</p>
        </form>
      )}

      <div className="pv-data-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={signOut}>
          <Icon name="log-out" size={16} /> Sign out
        </button>
        {!isJudge && !confirming && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Delete account</button>
        )}
      </div>
      {confirming && !CONNECTED && (
        <div className="pv-data-confirm" role="group" aria-label="Confirm deleting your account">
          <p>Delete this account and all of its progress from this browser? This cannot be undone.</p>
          <div className="pv-data-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={remove} disabled={deleteBusy}>Delete my account</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        </div>
      )}
      {confirming && CONNECTED && (
        <form className="pv-data-confirm" onSubmit={remove} aria-label="Confirm deleting your account" noValidate>
          <p>
            Delete this account from the LunX server — your progress, friends, league history and
            challenges? Other learners will no longer see you. This cannot be undone.
          </p>
          <div className="pv-account-row">
            <div className="form-field">
              <label className="form-label" htmlFor="pv-delete-pw">Your password</label>
              <input id="pv-delete-pw" type="password" className="form-input" value={deletePw} autoComplete="current-password"
                onChange={(e) => { setDeletePw(e.target.value); setDeleteNote(null) }} />
            </div>
            <div className="pv-data-actions">
              <button type="submit" className="btn btn-outline btn-sm" disabled={deleteBusy || !deletePw}>{deleteBusy ? 'Deleting…' : 'Delete my account'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setConfirming(false); setDeletePw(''); setDeleteNote(null) }}>Cancel</button>
            </div>
            <p className={`pv-data-note${deleteNote ? ' is-bad' : ''}`} role="status">{deleteNote ?? ''}</p>
          </div>
        </form>
      )}
    </section>
  )
}

/* Connected: the ground behind the learner's initials, wherever other
   learners see them (VISUAL_SYSTEM.md → Avatars). Saved on the click. */
function AvatarPicker() {
  const { account, updateAccount } = useAuth()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const current = account?.avatar ?? 'evergreen'

  const choose = async (color) => {
    if (busy || color === current) return
    setBusy(true)
    const r = await updateAccount({ avatar: color })
    setBusy(false)
    setNote(r.ok ? { tone: 'ok', text: 'Avatar saved.' } : { tone: 'bad', text: r.error })
  }

  return (
    <div className="pv-account-fact">
      <span className="form-label" id="pv-avatar-label">Avatar</span>
      <div className="pv-avatars" role="radiogroup" aria-labelledby="pv-avatar-label">
        {AVATAR_COLORS.map((color) => (
          <button
            key={color} type="button" role="radio" aria-checked={color === current}
            aria-label={AVATAR_NAMES[color]}
            className={`pv-avatar-pick${color === current ? ' is-on' : ''}`}
            onClick={() => choose(color)} disabled={busy}
          >
            <Avatar name={account?.username} color={color} size={32} />
          </button>
        ))}
      </div>
      <p className={`pv-data-note${note ? ` is-${note.tone}` : ''}`} role="status">
        {note?.text ?? 'Your initials on this colour are what other learners see. There are no photos.'}
      </p>
    </div>
  )
}

const AVATAR_NAMES = { evergreen: 'Evergreen', clay: 'Clay', moss: 'Moss', ochre: 'Ochre', berry: 'Berry', ink: 'Ink', tan: 'Sand' }

/* Connected: the time zone the learner's league weeks are counted in. The
   server allows a change once a week, so a week cannot be stretched. */
function TimeZoneSetting() {
  const { account, updateAccount } = useAuth()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const here = browserTimeZone()
  const zone = account?.timezone ?? 'UTC'

  const adopt = async () => {
    setBusy(true)
    const r = await updateAccount({ timezone: here })
    setBusy(false)
    setNote(r.ok ? { tone: 'ok', text: 'Time zone saved. A week already running keeps the time it started with.' } : { tone: 'bad', text: r.error })
  }

  return (
    <div className="pv-account-fact">
      <span className="form-label">Time zone</span>
      <span className="pv-account-zone">{zone.replace(/_/g, ' ')}</span>
      {zone !== here && (
        <div className="pv-data-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={adopt} disabled={busy}>
            {busy ? 'Saving…' : `Use this device’s: ${here.replace(/_/g, ' ')}`}
          </button>
        </div>
      )}
      <p className={`pv-data-note${note ? ` is-${note.tone}` : ''}`} role="status">
        {note?.text ?? `League weeks end at midnight on Sunday here; a board may end up to ${LEAGUE.TZ_BAND_HOURS} hours either side, and the Leagues tab shows its exact time. It can change once every ${LEAGUE.TZ_CHANGE_DAYS} days.`}
      </p>
    </div>
  )
}

const VISIBILITY = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'friends',  label: 'Friends' },
  { id: 'nobody',   label: 'Only me' },
]

const SWITCHES = [
  {
    key: 'leaguesOptIn',
    title: 'Show me in weekly leagues',
    on: 'You join a board of up to 30 learners when you earn XP. They see your username, avatar and weekly XP.',
    off: 'You are on no board. Your XP still counts for you; turn this on to join one with your next XP.',
    said: (v) => (v ? 'You’ll join a league with your next XP.' : 'You’ve left this week’s board.'),
  },
  {
    key: 'findByUsername',
    title: 'Let people find me by username',
    on: 'Anyone signed in can find you by searching for your username, and send you a friend request.',
    off: 'Only people who have your friend code can find you.',
    said: (v) => (v ? 'People can find you by username.' : 'Your username no longer finds you.'),
  },
  {
    key: 'findByEmail',
    title: 'Let people who know my email find me',
    on: 'Someone who types your exact email address can find you. They see your username — never the address.',
    off: 'Your email address finds nobody.',
    said: (v) => (v ? 'People who know your email can find you.' : 'Your email address no longer finds you.'),
  },
]

/* Connected: who can see and find the learner — four settings, each saying
   exactly who it affects (COMPONENT_RULES.md → Privacy settings) — and the
   learners they have blocked. */
function PrivacySettings({ focus }) {
  const { account, updateAccount, isJudge } = useAuth()
  const ref = useRef(null)
  const [busy, setBusy] = useState(null)
  const [note, setNote] = useState(null)
  const [blocked, setBlocked] = useState(null)   // null: loading · 'error' · []

  const settings = account?.settings ?? {}

  useEffect(() => {
    if (focus === 'privacy') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focus])

  useEffect(() => {
    let alive = true
    api.get('/api/blocks').then((r) => { if (alive) setBlocked(r.ok ? r.data.blocked : 'error') })
    return () => { alive = false }
  }, [])

  const retryBlocked = async () => {
    setBlocked(null)
    const r = await api.get('/api/blocks')
    setBlocked(r.ok ? r.data.blocked : 'error')
  }

  if (!account) return null

  const save = async (key, value, said) => {
    if (busy) return
    setBusy(key)
    const r = await updateAccount({ settings: { [key]: value } })
    setBusy(null)
    setNote(r.ok ? { tone: 'ok', text: said } : { tone: 'bad', text: r.error })
  }

  const unblock = async (user) => {
    const r = await api.del(`/api/blocks/${encodeURIComponent(user.id)}`)
    if (r.ok) {
      setBlocked((list) => (Array.isArray(list) ? list.filter((u) => u.id !== user.id) : list))
      setNote({ tone: 'ok', text: `${user.username} is unblocked. You can find each other again.` })
    } else {
      setNote({ tone: 'bad', text: r.message })
    }
  }

  return (
    <section className="pv-data pv-privacy" id="privacy" ref={ref} aria-labelledby="pv-privacy-title">
      <div>
        <h3 className="pv-data-title" id="pv-privacy-title">Privacy</h3>
        <p className="pv-data-desc">Your email address is never shown to anyone, whatever you choose here.</p>
      </div>

      <ul className="pv-privacy-list">
        {SWITCHES.map((sw) => {
          const value = Boolean(settings[sw.key])
          const locked = isJudge && sw.key === 'leaguesOptIn'
          return (
            <li className="pv-privacy-item" key={sw.key}>
              <span className="pv-privacy-text" id={`pv-sw-${sw.key}`}>
                <b>{sw.title}</b>
                <span>{locked ? 'The reviewer account plays in its own league of labelled test accounts.' : value ? sw.on : sw.off}</span>
              </span>
              <button
                type="button" role="switch" aria-checked={value} aria-labelledby={`pv-sw-${sw.key}`}
                className={`pv-switch${value ? ' is-on' : ''}`}
                disabled={busy !== null || locked}
                onClick={() => save(sw.key, !value, sw.said(!value))}
              />
            </li>
          )
        })}
        <li className="pv-privacy-item pv-privacy-item--choice">
          <span className="pv-privacy-text" id="pv-vis-label">
            <b>Who can see my profile</b>
            <span>
              {settings.profileVisibility === 'nobody'
                ? 'Others see your name and that your profile is private.'
                : settings.profileVisibility === 'friends'
                  ? 'Friends see your figures and trophies; everyone else sees your name only.'
                  : 'Anyone who opens your profile sees your figures and trophies.'}
            </span>
          </span>
          <div className="ch-seg" role="radiogroup" aria-labelledby="pv-vis-label">
            {VISIBILITY.map((v) => (
              <button
                key={v.id} type="button" role="radio" aria-checked={settings.profileVisibility === v.id}
                className={`st-seg${settings.profileVisibility === v.id ? ' is-on' : ''}`}
                disabled={busy !== null}
                onClick={() => settings.profileVisibility !== v.id && save('profileVisibility', v.id, `Your profile is visible to: ${v.label.toLowerCase()}.`)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </li>
      </ul>

      <div className="pv-account-fact">
        <span className="form-label">Blocked learners</span>
        {blocked === null && <span className="pv-data-note">Loading…</span>}
        {blocked === 'error' && (
          <span className="pv-data-note is-bad">
            Couldn’t load the list. <button type="button" className="sx-link" onClick={retryBlocked}>Try again</button>
          </span>
        )}
        {Array.isArray(blocked) && blocked.length === 0 && (
          <span className="pv-data-note">Nobody. Blocking someone (from their profile) stops requests and challenges both ways.</span>
        )}
        {Array.isArray(blocked) && blocked.length > 0 && (
          <ul className="pv-blocked">
            {blocked.map((u) => (
              <li key={u.id}>
                <Avatar name={u.username} color={u.avatar} size={28} />
                <span className="pv-blocked-name">{u.username}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => unblock(u)}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={`pv-data-note${note ? ` is-${note.tone}` : ''}`} role="status">{note?.text ?? ''}</p>
    </section>
  )
}

export default function ProfileView({ focus = null }) {
  const { state, vm } = useProgression()
  const { displayName, account } = useAuth()
  const s = vm.stats

  const accuracy = s.totalCorrectAnswers + s.totalWrongAnswers > 0
    ? Math.round((s.totalCorrectAnswers / (s.totalCorrectAnswers + s.totalWrongAnswers)) * 100)
    : 0

  const tiles = [
    { label: 'Total XP',        value: s.totalXPEarned, icon: <BoltIcon size={16} />, tip: 'Every XP you have ever earned', format: formatNumber },
    { label: 'Lessons done',    value: vm.course.completedCount, of: vm.course.totalLessons, icon: <Icon name="book" size={16} />, tip: 'First completions only' },
    { label: 'Perfect lessons', value: s.totalPerfectLessons, icon: <Icon name="star" size={16} />, tip: 'Finished without losing a heart' },
    { label: 'Practice time',   value: Math.floor(s.totalPracticeSeconds / 60), suffix: 'm', icon: <Icon name="timer" size={16} />, tip: 'Measured time in lessons and practice' },
    { label: 'Answer accuracy', value: accuracy, suffix: '%', icon: <Icon name="target" size={16} />, tip: `${s.totalCorrectAnswers} right, ${s.totalWrongAnswers} wrong` },
    { label: 'Quests claimed',  value: s.totalQuestsClaimed, icon: <Icon name="check-circle" size={16} />, tip: 'Daily and weekly' },
    { label: 'Modules done',    value: vm.course.completedSections, of: vm.course.totalSections, icon: <Icon name="layers" size={16} />, tip: 'Whole modules finished, Case File included' },
    { label: 'Days active',     value: s.daysActive, icon: <Icon name="calendar" size={16} />, tip: 'Days you finished something' },
  ]

  return (
    <div className="pv-wrap">
      <header className="pv-head">
        <div className="pv-identity">
          <div className="pv-avatar" data-tilt data-tip={`Level ${vm.level}`}>{vm.level}</div>
          <div>
            <SplitText as="h2" className="pv-name" immediate>{displayName}</SplitText>
            <p className="pv-since">
              Level {vm.level} · {vm.course.completedCount} of {vm.course.totalLessons} lessons done · learning since {getShortDate(getLocalDateKey(new Date(state.createdAt)))}
            </p>
          </div>
        </div>

        <Reveal className="pv-headline" variant="scale" stagger immediate delay={200}>
          <div className="pv-headline-item fx-flare-host" data-tip="Current streak">
            <LiveFlame streak={vm.streak} activeToday={vm.activeToday} size={20} showShield={false} />
            <b><CountUp value={vm.streak} immediate delay={300} /></b><span>day streak</span>
          </div>
          <div className="pv-headline-item fx-glint-host fx-gleam" data-tip="Gems in hand">
            <span className="pv-gem"><GemIcon size={20} /></span>
            <b><CountUp value={vm.gems} immediate delay={380} format={formatNumber} /></b><span>gems</span>
          </div>
          <div className="pv-headline-item" data-tip="Longest streak so far">
            <Icon name="trophy" size={20} />
            <b><CountUp value={vm.longestStreak} immediate delay={460} /></b><span>best streak</span>
          </div>
        </Reveal>
      </header>

      <Reveal className="pv-level" variant="up" immediate delay={260}><LevelProgress size="lg" /></Reveal>

      <Reveal className="pv-tiles" variant="scale" stagger immediate delay={340}>
        {tiles.map((t, i) => (
          <div className="pv-tile" key={t.label} data-tip={t.tip}>
            <span className="pv-tile-icon">{t.icon}</span>
            <span className="pv-tile-value">
              <CountUp value={t.value} immediate delay={420 + i * 60} format={t.format} suffix={t.suffix ?? ''} />
              {t.of != null && <span className="pv-tile-of">/{t.of}</span>}
            </span>
            <span className="pv-tile-label">{t.label}</span>
          </div>
        ))}
      </Reveal>

      <FieldKit />

      <AchievementGrid />

      <FieldJournal />

      <AccountSettings />
      {CONNECTED && <PrivacySettings focus={focus} />}
      {CONNECTED && account?.moderator && <Suspense fallback={null}><ModerationPanel /></Suspense>}
      <ProgressData />
    </div>
  )
}
