/* ═══════════════════════════════════════════════════════════════════════════
   analytics.js — COUNTING VISITS, ONLY WITH PERMISSION
   ---------------------------------------------------------------------------
   LunX keeps a learner's progress in their own browser and sends it nowhere.
   Visit counting is the one thing that could leave the browser, so it is:

     · off by default — nothing loads until the visitor chooses "Allow"
     · cookieless — GoatCounter (goatcounter.com) sets no cookies and stores
       no personal data; it counts a page view, a referrer and a screen size
     · off entirely until SITE.analytics.goatcounter is set (site.js)

   The choice is stored in localStorage under CONSENT_KEY as 'granted' or
   'denied'. `choice()` returns null until the visitor has chosen.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SITE } from '../site'

export const CONSENT_KEY = 'lunx_privacy_choice_v1'
const listeners = new Set()
let loaded = false

function store() {
  try { return window.localStorage } catch { return null }
}

export function choice() {
  const v = store()?.getItem(CONSENT_KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

export function setChoice(value) {
  try { store()?.setItem(CONSENT_KEY, value) } catch { /* private mode: ask again next time */ }
  listeners.forEach((fn) => fn(value))
  if (value === 'granted') load()
}

export function onChoice(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Reopen the privacy banner (the footer's "Privacy choices"). */
export function reopenChoices() {
  listeners.forEach((fn) => fn('ask'))
}

function load() {
  if (loaded || !SITE.analytics.enabled || typeof document === 'undefined') return
  loaded = true
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${SITE.analytics.goatcounter}.goatcounter.com/count`
  /* The SPA counts its own page views (below), so the script must not count
     the first one automatically as well. */
  s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true })
  s.onload = () => pageview(window.location.pathname)
  document.head.appendChild(s)
}

/** Count a page view (called on every page change). */
export function pageview(path) {
  if (!SITE.analytics.enabled || choice() !== 'granted') return
  if (!loaded) { load(); return }
  window.goatcounter?.count?.({ path, title: document.title })
}

/** Start counting if the visitor already allowed it on a previous visit. */
export function initAnalytics() {
  if (choice() === 'granted') load()
}
