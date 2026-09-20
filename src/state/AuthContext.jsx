/* ═══════════════════════════════════════════════════════════════════════════
   AuthContext.jsx — WHOSE PROGRESS IS ON SCREEN
   ---------------------------------------------------------------------------
   Thin, like ProgressionContext: the rules are in services/accountService.js
   and this file only holds the current profile, points storage at that
   profile's key, and hands the rest of the app four commands.

   The ORDER matters and is the reason this is not an effect. Storage is
   pointed at the profile's key while this provider first RENDERS, because
   ProgressionProvider reads storage during its own first render. An effect
   would run after that read and the first paint would show the wrong
   learner. Every command does the same thing: key first, then state.

   `profileKey` is also what LearnPage keys the progression provider on, so
   signing in or out remounts the engine against the right profile rather
   than trying to swap state underneath it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import accounts, { ACCOUNTS_KEY, progressKey } from '../services/accountService'
import { setProfileKey } from '../services/storageService'

const AuthContext = createContext(null)

/** Point storage at a profile and return the key it now uses. */
function focus(account) {
  return setProfileKey(progressKey(account?.id ?? null))
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

  const signIn = useCallback((credentials) => {
    const result = accounts.signIn(credentials)
    if (result.ok) adopt(result.account)
    return result
  }, [adopt])

  const createAccount = useCallback((details) => {
    const result = accounts.createAccount(details)
    if (result.ok) adopt(result.account)
    return result
  }, [adopt])

  const signOut = useCallback(() => {
    accounts.signOut()
    return adopt(null)
  }, [adopt])

  const forget = useCallback((id) => {
    const result = accounts.forgetAccount(id ?? account?.id)
    if (result.ok) adopt(null)
    return result
  }, [adopt, account])

  /* Another tab signed in or out: follow it, so two tabs never write two
     different learners into one profile. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== ACCOUNTS_KEY || e.storageArea !== window.localStorage) return
      const current = accounts.currentAccount()
      if ((current?.id ?? null) !== (account?.id ?? null)) adopt(current)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [account, adopt])

  const value = useMemo(() => ({
    account,
    /** Signed in at all? */
    signedIn: Boolean(account),
    /** The reviewer's profile, which carries the judge powers. */
    isJudge: account?.role === 'judge',
    /** The storage key this profile's progress lives under. */
    profileKey: progressKey(account?.id ?? null),
    signIn, createAccount, signOut, forget,
  }), [account, signIn, createAccount, signOut, forget])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthProvider
