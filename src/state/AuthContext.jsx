/* ═══════════════════════════════════════════════════════════════════════════
   AuthContext.jsx — WHO IS SIGNED IN
   ---------------------------------------------------------------------------
   Thin, like ProgressionContext: the rules are in the account services and
   this file only holds the current account, points storage at that
   account's key, and hands the rest of the app its commands.

   Which service depends on the build (config/serverConfig.js):
     local      services/accountService.js — accounts in this browser
     connected  services/remoteAccountService.js — accounts on the LunX
                server, with a session token kept in this browser

   The ORDER matters and is the reason this is not an effect. Storage is
   pointed at the account's key while this provider first RENDERS, because
   ProgressionProvider reads storage during its own first render. An effect
   would run after that read and the first paint would show the wrong
   learner. Every command does the same thing: key first, then state.

   `profileKey` is also what LearnPage keys the progression provider on, so
   signing in or out remounts the engine against the right account rather
   than trying to swap state underneath it.

   Signing in, creating an account and resetting a password hash a secret
   (here or on the server), so those return promises.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import local, { ACCOUNTS_KEY } from '../services/accountService'
import remote from '../services/remoteAccountService'
import { api, onBeforeSignOut, onSessionChange, reloadSession, settleBeforeSignOut, SESSION_KEY } from '../services/api'
import { forgetProfile, reviveProfile, setProfileKey } from '../services/storageService'
import { forgetOutbox, setOutboxAccount, setOutboxSender, settleOutbox } from '../services/activityOutbox'
import { CONNECTED } from '../config/serverConfig'

const accounts = CONNECTED ? remote : local
const BOOK_KEY = CONNECTED ? SESSION_KEY : ACCOUNTS_KEY

/* On a connected build, what the learner does is sent to the server to be
   graded and counted (services/activityOutbox.js). */
if (CONNECTED) {
  setOutboxSender(async (events) => {
    const r = await api.post('/api/activity', { events })
    if (!r.ok) throw new Error(r.message)
    return r.data
  })
  onBeforeSignOut(settleOutbox)
}

/** The signed-in account right now, from whichever service this build uses —
 *  for the page gate, which must not wait for a re-render after sign-in. */
export const currentAccount = () => accounts.currentAccount()

const AuthContext = createContext(null)

/** Point storage (and, connected, the activity queue) at an account. */
function focus(account) {
  setOutboxAccount(CONNECTED ? account?.id ?? null : null)
  const key = accounts.progressKey(account?.id ?? null)
  if (account) reviveProfile(key)
  return setProfileKey(key)
}

/** Connected: remove what this browser kept of an account — its cached
 *  progress and its (empty) answer queue. The server holds the real copy;
 *  a school computer keeps nothing of the learner after they sign out. */
function forgetLocalCopy(id, { force = false } = {}) {
  if (!CONNECTED || !id) return
  forgetProfile(accounts.progressKey(id))
  forgetOutbox(id, { force })
}

export function AuthProvider({ children }) {
  /* The lazy initialiser runs during the first render, before any child
     reads storage. */
  const [account, setAccount] = useState(() => {
    const current = accounts.currentAccount()
    focus(current)
    return current
  })

  const adopt = useCallback((next) => {
    focus(next)
    setAccount(next)
    return next
  }, [])

  /* Adopt the account a command produced, if it produced one. */
  const settle = useCallback((result) => {
    if (result.ok && result.account !== undefined) adopt(result.account)
    return result
  }, [adopt])

  const signIn = useCallback(async (credentials) => settle(await accounts.signIn(credentials)), [settle])
  const createAccount = useCallback(async (details) => settle(await accounts.createAccount(details)), [settle])
  const resetPassword = useCallback(async (details) => settle(await accounts.resetPassword(details)), [settle])
  /** Connected only: email a reset link, and use one. */
  const requestResetLink = useCallback((email) => remote.requestResetLink(email), [])
  const resetWithLink = useCallback(async (details) => settle(await remote.resetWithLink(details)), [settle])
  /** Connected only: re-read the account (a moderator renamed it). */
  const reloadAccount = useCallback(async () => {
    if (!CONNECTED) return
    const r = await remote.refresh()
    if (r.ok && r.account) setAccount(r.account)
  }, [])

  const changePassword = useCallback(
    (passwords) => accounts.changePassword(account?.id, passwords),
    [account],
  )
  const updateUsername = useCallback(
    async (username) => settle(await accounts.updateUsername(account?.id, username)),
    [account, settle],
  )
  /** Connected only: avatar, time zone and privacy settings. */
  const updateAccount = useCallback(
    async (patch) => (CONNECTED ? settle(await remote.updateAccount(patch)) : { ok: false, error: 'Not available on this copy of LunX.' }),
    [settle],
  )

  const signOut = useCallback(async () => {
    const id = account?.id ?? null
    /* Connected: anything not yet sent goes first, while the session is
       still valid. Only if all of it arrived is this browser's copy removed
       — offline, it stays, and is sent the next time this account signs in. */
    const settled = CONNECTED ? await settleBeforeSignOut() : false
    await accounts.signOut()
    if (settled) forgetLocalCopy(id)
    return adopt(null)
  }, [adopt, account])

  /** Delete the account. A connected build asks for the password first. */
  const forget = useCallback(async (password) => {
    const result = CONNECTED ? await remote.forgetAccount(account?.id, password) : local.forgetAccount(account?.id)
    if (result.ok) {
      /* The server has deleted everything; nothing here is worth keeping. */
      forgetLocalCopy(account?.id, { force: true })
      adopt(null)
    }
    return result
  }, [adopt, account])

  /* Connected: the stored session is checked against the server once on
     load — a session that ended elsewhere signs out here, and a profile
     changed on another device arrives. */
  useEffect(() => {
    if (!CONNECTED || !account) return undefined
    let alive = true
    remote.refresh().then((r) => {
      if (!alive) return
      if (r.ok && r.account) setAccount(r.account)
      else if (!r.ok && r.account === null) adopt(null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* A request answered 401: the session is over. */
  useEffect(() => {
    if (!CONNECTED) return undefined
    return onSessionChange((session) => {
      if (!session) adopt(null)
    })
  }, [adopt])

  /* Another tab signed in or out: follow it, so two tabs never write two
     different learners into one account. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== BOOK_KEY || e.storageArea !== window.localStorage) return
      if (CONNECTED) reloadSession()
      const current = accounts.currentAccount()
      if ((current?.id ?? null) !== (account?.id ?? null)) adopt(current)
      else if (current) setAccount(current)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [account, adopt])

  const value = useMemo(() => ({
    account,
    /** Is this build connected to a LunX server? */
    connected: CONNECTED,
    /** Signed in at all? */
    signedIn: Boolean(account),
    /** The reviewer's account, which carries the judge powers. */
    isJudge: account?.role === 'judge',
    /** The name to show: the username, never the email. */
    displayName: accounts.displayName(account),
    /** The storage key this account's progress lives under. */
    profileKey: accounts.progressKey(account?.id ?? null),
    signIn, createAccount, resetPassword, requestResetLink, resetWithLink, reloadAccount,
    changePassword, updateUsername, updateAccount, signOut, forget,
  }), [account, signIn, createAccount, resetPassword, requestResetLink, resetWithLink, reloadAccount, changePassword, updateUsername, updateAccount, signOut, forget])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthProvider
