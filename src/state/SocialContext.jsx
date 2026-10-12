/* ═══════════════════════════════════════════════════════════════════════════
   SocialContext.jsx — FRIENDS, LEAGUES AND CHALLENGES, AS THE APP SEES THEM
   ---------------------------------------------------------------------------
   Connected builds only (LearnPage mounts it when config/serverConfig.js says
   CONNECTED). Thin, like the other two contexts:

     · one cheap read of /api/summary for the nav's badges: requests
       waiting, challenge invitations, rewards to claim, and where the
       learner stands this week. It is re-read the moment the server nudges
       this page (services/liveUpdates.js), on focus and after an action;
       the poll is only the fallback — every POLL_MS while the live stream
       is down, every LIVE_POLL_MS while it is up
     · new server notifications become toasts (a friend request, a league
       result), and a move up the board — reported by the activity queue's
       results — becomes one too; nothing is shown that did not happen
     · claim(award): the reward's gems enter this economy once
       (progressionService → CLAIM_SERVER_AWARD remembers its id), then the
       server is told (POST /api/awards/:id/claim, idempotent). A claim the
       server never heard about is re-told on the next poll.

   Everything else — lists, profiles, search — is fetched by the view that
   shows it, through services/api.js.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'
import { onOutboxResult } from '../services/activityOutbox'
import { useProgression, useRewards } from './ProgressionContext'
import { POLL_MS, LIVE_POLL_MS } from '../config/serverConfig'
import { openLiveUpdates } from '../services/liveUpdates'
import { useAuth } from './AuthContext'
import { leagueOf } from '../config/leagueConfig'
import { LeagueBadge } from '../components/leagues/LeagueArt'

const SocialContext = createContext(null)

/** A notification, as the sentence a toast shows. Null for ones the app
 *  already announces some other way. */
function noticeOf(n) {
  const p = n.payload ?? {}
  switch (n.kind) {
    case 'friend-request':
      return { icon: 'user-plus', title: `${p.username} sent you a friend request`, text: 'Answer it in Friends → Requests.' }
    case 'friend-accepted':
      return { icon: 'user-check', title: `${p.username} accepted your friend request`, text: 'You can challenge each other now.' }
    case 'challenge-invite':
      return { icon: 'swords', title: `${p.from} challenged you`, text: `${p.format} · ${p.days} day${p.days === 1 ? '' : 's'}. Answer it in Friends → Challenges.` }
    case 'challenge-accepted':
      return { icon: 'swords', title: `${p.username} joined your challenge`, text: 'It’s on.' }
    case 'challenge-result':
      return p.won
        ? { icon: 'trophy', tone: 'gold', title: `You won the ${p.format}`, text: 'Your reward is waiting in Friends → Challenges.' }
        : { icon: 'swords', tone: 'muted', title: `${p.format} finished`, text: `You came #${p.rank} of ${p.size}.` }
    case 'moderation-rename':
      return { icon: 'user-check', tone: 'muted', title: 'A moderator changed your username', text: `It was reported, so it’s now ${p.username}. You can choose another in Profile → Account.` }
    case 'challenge-cancelled':
      return { icon: 'swords', tone: 'muted', title: 'A challenge was called off', text: p.reason === 'nobody-joined' ? 'Nobody joined in time.' : 'Not enough players were left.' }
    case 'league-result': {
      if (p.kind === 'tournament') {
        return { icon: 'crown', tone: p.outcome === 'eliminated' ? 'muted' : 'gold', title: `${p.roundName} finished — #${p.rank} of ${p.size}`, text: p.outcome === 'advanced' ? 'You go through to the next round.' : p.outcome === 'eliminated' ? 'Out of the tournament — back to Diamond.' : 'The tournament is over.' }
      }
      const after = leagueOf(p.newTier).name
      if (p.outcome === 'promoted') return { tier: p.newTier, tone: 'gold', title: `Promoted to the ${after} League`, text: `You finished #${p.rank} of ${p.size}.` }
      if (p.outcome === 'demoted') return { tier: p.newTier, tone: 'muted', title: `Back to the ${after} League`, text: `You finished #${p.rank} of ${p.size}.` }
      return { tier: p.tier, tone: 'quest', title: `You stayed in the ${leagueOf(p.tier).name} League`, text: `You finished #${p.rank} of ${p.size}.` }
    }
    default:
      return null
  }
}

const SEEN_KEY = 'lunx_notice_seen_v1'

export function SocialProvider({ children }) {
  const { state, actions } = useProgression()
  const { pushRewards } = useRewards()
  const { reloadAccount } = useAuth()
  const [summary, setSummary] = useState(null)
  const [live, setLive] = useState(false)
  const [error, setError] = useState(null)
  const seenRef = useRef(null)
  const claimedRef = useRef(state.serverAwards ?? [])
  claimedRef.current = state.serverAwards ?? []

  const toast = useCallback((n) => {
    const notice = noticeOf(n)
    if (!notice) return
    pushRewards([{
      type: 'NOTICE',
      icon: notice.icon,
      tone: notice.tone,
      title: notice.title,
      text: notice.text,
      art: notice.tier != null ? <LeagueBadge tier={notice.tier} size={22} /> : undefined,
    }])
  }, [pushRewards])

  const refresh = useCallback(async () => {
    const r = await api.get('/api/summary')
    if (!r.ok) { setError(r); return null }
    setError(null)
    setSummary(r.data)

    /* A claim this browser made that the server never heard about. */
    for (const award of r.data.unclaimed ?? []) {
      if (claimedRef.current.includes(award.id)) api.post(`/api/awards/${award.id}/claim`, {})
    }

    /* New notifications → toasts, once each (the newest id seen is kept). */
    if (r.data.unread > 0) {
      const list = await api.get('/api/notifications')
      if (list.ok) {
        if (seenRef.current === null) {
          try { seenRef.current = Number(window.sessionStorage.getItem(SEEN_KEY)) || 0 } catch { seenRef.current = 0 }
        }
        const fresh = list.data.notifications.filter((n) => !n.read && n.id > seenRef.current).reverse()
        fresh.slice(-3).forEach(toast)
        /* A moderator renamed this account: the name shown here is stale. */
        if (fresh.some((n) => n.kind === 'moderation-rename')) reloadAccount()
        const newest = list.data.notifications.reduce((m, n) => Math.max(m, n.id), seenRef.current)
        seenRef.current = newest
        try { window.sessionStorage.setItem(SEEN_KEY, String(newest)) } catch { /* toasts may repeat next session */ }
      }
    }
    return r.data
  }, [toast, reloadAccount])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  /* The poll: the fallback, slower while the live stream is up. */
  useEffect(() => {
    const id = window.setInterval(refresh, live ? LIVE_POLL_MS : POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh, live])

  /* The live stream: a nudge from the server re-reads the summary at once.
     Nudges that arrive together are read once. */
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  useEffect(() => {
    let timer = 0
    const stop = openLiveUpdates({
      onChanged: () => {
        clearTimeout(timer)
        timer = window.setTimeout(() => refreshRef.current(), 250)
      },
      onState: (up) => {
        setLive(up)
        /* Back after a drop: catch up on what happened meanwhile. */
        if (up) refreshRef.current()
      },
    })
    return () => { clearTimeout(timer); stop() }
  }, [])

  /* A move up this week's board, as the server reported it. */
  useEffect(() => onOutboxResult((result) => {
    const l = result?.league
    if (!l || !l.rank) return
    const name = l.kind === 'tournament' ? 'tournament round' : `${leagueOf(l.tier).name} League`
    if (l.previousRank == null) {
      pushRewards([{ type: 'NOTICE', art: <LeagueBadge tier={l.tier} size={22} />, tone: 'quest', title: `You joined this week’s ${name}`, text: `You’re #${l.rank} of ${l.size}.` }])
    } else if (l.rank < l.previousRank) {
      pushRewards([{ type: 'NOTICE', art: <LeagueBadge tier={l.tier} size={22} />, tone: 'gold', title: `Up to #${l.rank} in the ${name}`, text: `You passed ${l.previousRank - l.rank} learner${l.previousRank - l.rank === 1 ? '' : 's'}.` }])
    }
    setSummary((s) => (s ? { ...s, league: { ...s.league, joined: true, rank: l.rank, size: l.size, xp: l.xp, tier: l.tier, kind: l.kind } } : s))
  }), [pushRewards])

  /** Claim a server reward's gems into this economy — once. */
  const claim = useCallback(async (award) => {
    if (!award?.id) return null
    const events = actions.claimServerAward({ id: award.id, gems: award.gems ?? 0, kind: award.kind ?? 'reward' })
    const r = await api.post(`/api/awards/${award.id}/claim`, {})
    refresh()
    return { events, ok: r.ok }
  }, [actions, refresh])

  const value = useMemo(() => ({
    summary,
    error,
    /** Is the server's live stream open? (Polling covers it when not.) */
    live,
    refresh,
    claim,
    badges: {
      friends: (summary?.requests ?? 0) + (summary?.invites ?? 0),
      leagues: (summary?.unclaimed ?? []).filter((a) => !a.kind.startsWith('challenge')).length,
      challenges: (summary?.unclaimed ?? []).filter((a) => a.kind.startsWith('challenge')).length,
    },
  }), [summary, error, live, refresh, claim])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

/** The social layer, or null on a local build (no provider is mounted). */
export function useSocial() {
  return useContext(SocialContext)
}

export default SocialProvider
