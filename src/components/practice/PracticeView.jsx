/* ═══════════════════════════════════════════════════════════════════════════
   PracticeView.jsx — THE PRACTICE DESTINATION (revision 10)
   ---------------------------------------------------------------------------
   Practice is built from the learner's own answer history
   (services/practiceService.js): what they missed, what has come due, what
   stays weak, what they have not touched in a while. This file only loads
   the questions those answers came from, builds the bank, and switches
   between the three screens:

     home      the dashboard — one recommendation, the modes, what needs
               attention, how practice has gone (PracticeHome)
     running   a session (PracticeRunner)
     summary   what the session covered and paid (PracticeSummary)

   Practice never costs a heart. A session's XP is decided by the shared
   practice rule (utils/practiceXp.js) from the attempts it recorded.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { preloadContent, getLessonContent } from '../../data/lessonContent'
import { PRACTICE } from '../../config/progressionConfig'
import practice from '../../services/practiceService'
import { secureId } from '../../utils/random'
import PracticeHome from './PracticeHome'
import PracticeRunner from './PracticeRunner'
import PracticeSummary from './PracticeSummary'
import './practice.css'

export default function PracticeView({ onGoLearn }) {
  const { state } = useProgression()
  const [phase, setPhase] = useState('home')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [loads, setLoads] = useState(0)
  const [loadError, setLoadError] = useState(false)

  /* The modules whose questions Practice needs: what has been studied, and
     the lessons that teach those questions' concepts. Keyed on the ids, so
     a new answer in an already-loaded module fetches nothing. */
  const needed = useMemo(() => practice.contentNeeded(state), [state])
  const neededKey = needed.join('|')

  useEffect(() => {
    let alive = true
    setLoadError(false)
    preloadContent(needed)
      .then(() => {
        if (!alive) return
        setLoads((n) => n + 1)
        if (!needed.some((id) => getLessonContent(id))) setLoadError(true)
      })
      .catch(() => { if (alive) setLoadError(true) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neededKey])

  const studied = useMemo(() => practice.studiedItems(state), [state])
  const bank = useMemo(
    () => practice.buildBank(studied.ids, getLessonContent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studied.ids.join('|'), loads],
  )

  /* "Now" moves on whenever the learner's state does — the dashboard does
     not need a ticking clock, only a fresh one after each answer. */
  const now = useMemo(() => Date.now(), [state]) // eslint-disable-line react-hooks/exhaustive-deps
  const view = useMemo(() => practice.practiceView(state, bank, now), [state, bank, now])

  const start = useCallback((opts) => {
    const deck = practice.buildDeck(opts, bank, state, Date.now())
    if (!deck.length) return
    setSession({
      id: secureId('ps'),
      mode: opts.mode,
      topic: opts.topic ?? null,
      concept: opts.concept ?? null,
      deck,
      startMistakes: view.concepts.filter((c) => c.status === 'mistake').map((c) => c.id),
    })
    setResult(null)
    setPhase('running')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [bank, state, view])

  const finished = useCallback((outcome) => {
    if (!outcome) { setPhase('home'); setSession(null); return }
    setResult(outcome)
    setPhase('summary')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const retry = useCallback(() => {
    setLoadError(false)
    preloadContent(needed)
      .then(() => {
        setLoads((n) => n + 1)
        if (!needed.some((id) => getLessonContent(id))) setLoadError(true)
      })
      .catch(() => setLoadError(true))
  }, [needed])

  const home = useCallback((focus = null) => {
    setPhase('home')
    setSession(null)
    setResult(focus ? { focus } : null)
  }, [])

  if (phase === 'running' && session) {
    return <PracticeRunner key={session.id} session={session} bank={bank} onFinish={finished} />
  }

  if (phase === 'summary' && result?.sessionId) {
    return (
      <PracticeSummary
        sessionId={result.sessionId}
        event={result.event}
        view={view}
        starter={studied.starter}
        onStart={start}
        onHome={home}
      />
    )
  }

  return (
    <PracticeHome
      view={view}
      ready={loads > 0}
      loadError={loadError}
      starter={studied.starter}
      focus={result?.focus ?? null}
      onStart={start}
      onRetry={retry}
      onGoLearn={onGoLearn}
      sizes={PRACTICE.SESSION_SIZES}
    />
  )
}
