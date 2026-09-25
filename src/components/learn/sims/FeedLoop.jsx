/* FeedLoop — Lesson 1.1. A recommender and a simulated viewer, in a loop.
   The recommender keeps a running estimate of how well each kind of post does
   on its OBJECTIVE, and fills tomorrow's feed in proportion to those
   estimates (with a little exploration). The viewer said they want study tips
   and music, but lingers on drama. Change the objective, or the viewer's
   behaviour, and watch 25 days of feed drift. Every figure is computed from a
   seeded run, so the same choices always give the same feed. */

import { useMemo, useState } from 'react'
import { SimFrame, Seg, Stat, usePlot, ink, rng, gauss } from './kit'

const TYPES = [
  { id: 'study',   label: 'Study tips',   token: '--moss',       wanted: true },
  { id: 'music',   label: 'Music',        token: '--evergreen',  wanted: true },
  { id: 'sports',  label: 'Sports',       token: '--tan-deep',   wanted: false },
  { id: 'drama',   label: 'Drama clips',  token: '--clay',       wanted: false },
  { id: 'outrage', label: 'Outrage news', token: '--berry',      wanted: false },
]

/* How the simulated viewer actually behaves: seconds watched, chance of a like. */
const BEHAVIOUR = {
  linger: { study: [14, 0.30], music: [24, 0.45], sports: [10, 0.10], drama: [42, 0.08], outrage: [36, 0.05] },
  skip:   { study: [14, 0.30], music: [24, 0.45], sports: [10, 0.10], drama: [5, 0.04],  outrage: [4, 0.02] },
}

const OBJECTIVES = [
  { value: 'watch', label: 'Watch time' },
  { value: 'likes', label: 'Likes' },
  { value: 'stated', label: 'What you said you want' },
]

const DAYS = 25
const POSTS = 20

function simulate(objective, behaviour) {
  const rand = rng(objective === 'watch' ? 11 : objective === 'likes' ? 23 : 37)
  const est = Object.fromEntries(TYPES.map((t) => [t.id, 1]))
  const seen = Object.fromEntries(TYPES.map((t) => [t.id, 1]))
  const days = []
  for (let d = 0; d < DAYS; d++) {
    /* Allocate today's posts: mostly by estimate, 10% spread evenly. */
    const maxE = Math.max(...Object.values(est))
    const weights = TYPES.map((t) => Math.exp((est[t.id] / Math.max(1e-6, maxE)) * 4))
    const sum = weights.reduce((a, b) => a + b, 0)
    const share = weights.map((w) => 0.9 * (w / sum) + 0.1 / TYPES.length)
    const counts = share.map((s) => s * POSTS)
    days.push(Object.fromEntries(TYPES.map((t, i) => [t.id, share[i]])))

    /* The viewer reacts; the recommender updates its running means. */
    TYPES.forEach((t, i) => {
      const n = Math.max(1, Math.round(counts[i]))
      const [secs, likeP] = BEHAVIOUR[behaviour][t.id]
      for (let k = 0; k < n; k++) {
        let signal
        if (objective === 'watch') signal = Math.max(0, secs + gauss(rand) * 6)
        else if (objective === 'likes') signal = rand() < likeP ? 1 : 0
        else signal = t.wanted ? 1 : 0
        seen[t.id] += 1
        est[t.id] += (signal - est[t.id]) / seen[t.id]
      }
    })
  }
  return days
}

export default function FeedLoop({ onDone, goal }) {
  const [objective, setObjective] = useState('watch')
  const [behaviour, setBehaviour] = useState('linger')
  const [tried, setTried] = useState(() => new Set(['watch']))

  const days = useMemo(() => simulate(objective, behaviour), [objective, behaviour])
  const last = days[days.length - 1]
  const wantedShare = TYPES.filter((t) => t.wanted).reduce((s, t) => s + last[t.id], 0)

  const pick = (value) => {
    setObjective(value)
    const next = new Set(tried); next.add(value); setTried(next)
    if (goal === 'two-objectives' ? next.size >= 2 : next.size >= 1) onDone?.()
  }
  const pickBehaviour = (value) => {
    setBehaviour(value)
    if (goal === 'skip' && value === 'skip') onDone?.()
  }

  const { ref } = usePlot((ctx, w, h) => {
    const pad = { l: 34, r: 8, t: 8, b: 22 }
    const cw = (w - pad.l - pad.r) / DAYS
    ctx.font = '11px Manrope, sans-serif'
    ctx.fillStyle = ink('--ink-faint')
    ctx.fillText('100%', 0, pad.t + 8)
    ctx.fillText('0%', 10, h - pad.b)
    days.forEach((day, d) => {
      let y = h - pad.b
      TYPES.forEach((t) => {
        const hh = day[t.id] * (h - pad.t - pad.b)
        ctx.fillStyle = ink(t.token)
        ctx.fillRect(pad.l + d * cw + 1, y - hh, cw - 2, hh)
        y -= hh
      })
    })
    ctx.fillStyle = ink('--ink-faint')
    ctx.fillText('day 1', pad.l, h - 6)
    ctx.fillText(`day ${DAYS}`, w - pad.r - 38, h - 6)
  }, [days], { aspect: 0.42, min: 160, max: 240 })

  return (
    <SimFrame
      title="A feed learning from you"
      provenance="computed"
      note="A simulated viewer and a simple recommender, run for 25 days with a fixed seed."
      controls={
        <>
          <Seg label="The app optimizes for" options={OBJECTIVES} value={objective} onChange={pick} />
          <Seg
            label="How you behave"
            options={[{ value: 'linger', label: 'Linger on drama' }, { value: 'skip', label: 'Scroll past drama fast' }]}
            value={behaviour}
            onChange={pickBehaviour}
          />
        </>
      }
      footer={
        <div className="sim-stats">
          <Stat label="of day 25’s feed is what you said you wanted" value={`${Math.round(wantedShare * 100)}%`} tone={wantedShare > 0.5 ? 'moss' : 'berry'} />
          <Stat label="is drama and outrage" value={`${Math.round((last.drama + last.outrage) * 100)}%`} />
        </div>
      }
    >
      <div className="sim-canvas-wrap"><canvas ref={ref} className="sim-canvas" role="img" aria-label={`Feed composition over 25 days. On day 25: ${TYPES.map((t) => `${t.label} ${Math.round(last[t.id] * 100)}%`).join(', ')}.`} /></div>
      <div className="sim-legend">
        {TYPES.map((t) => <span key={t.id} className="sim-key sim-key--square" style={{ '--key': `var(${t.token})` }}>{t.label}{t.wanted ? ' (wanted)' : ''}</span>)}
      </div>
    </SimFrame>
  )
}
