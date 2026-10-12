/* ═══════════════════════════════════════════════════════════════════════════
   LeagueArt.jsx — THE LEAGUE BADGES, MEDALS AND TROPHIES
   ---------------------------------------------------------------------------
   Original artwork, drawn for LunX on a 48-unit grid, in the scoped league
   palette (VISUAL_SYSTEM.md → The league palette; `--lg-*`, applied only by
   the `lf-*` / `ls-*` classes in leagues.css).

   One family. Every badge is the same crest built the same way — a back
   plate one step darker (its thickness), the face, a shade facet on the
   right half, an inner rim, one shine — and what grows with prestige is the
   crest, never the number of colours:

     Bronze · Silver · Gold       one, two, three stars
     Sapphire · Ruby · Emerald    a cut stone set in the crest, in a gold rim
     Amethyst · Pearl             the stone, and laurel
     Obsidian                     the stone, laurel, and heavy gold trim
     Diamond                      a brilliant under a crown, laurel, gold trim

   A lower league is a smaller badge in the same language, never a broken one.
   Locked leagues are the crest's silhouette in paper with a small lock — the
   "locked" composition every other locked thing in LunX uses.

   Medals (1st, 2nd, 3rd) and trophies (a promotion, a tournament round, a
   won challenge) share the construction, so a trophy shelf reads as one set.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId } from 'react'
import { LEAGUES, leagueOf } from '../../config/leagueConfig'
import './leagues.css'

const useUid = () => useId().replace(/:/g, '')

const svg = (size, className) => ({
  width: size,
  height: size,
  viewBox: '0 0 48 48',
  className: `lg ${className}`.trim(),
  'aria-hidden': true,
  focusable: 'false',
})

/* The crest, its inner rim, and the rect that shades its right half. */
const CREST = 'M24 7 38 12v10.6c0 8.7-5.9 14.7-14 17.1-8.1-2.4-14-8.4-14-17.1V12Z'
const RIM = 'M24 10.2 35.2 14.2v8.4c0 6.9-4.7 11.7-11.2 13.8-6.5-2.1-11.2-6.9-11.2-13.8v-8.4Z'

/** A regular polygon's path. */
function polygon(cx, cy, r, n, rot = 0) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = rot + (2 * Math.PI * i) / n
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  })
  return `M${pts.join('L')}Z`
}

/** Lines from a polygon's corners out to a circle — a gem's facets. */
function spokes(cx, cy, r1, r2, n, rot = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (2 * Math.PI * i) / n
    const p = (r) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
    return `M${p(r1)}L${p(r2)}`
  }).join('')
}

/** A five-point star centred on (cx, cy) with outer radius r. */
function starPath(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.45
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(2)},${(cy + rr * Math.sin(rad)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

/* How each league is composed. Index = tier. */
const COMPOSE = [
  { tone: 'bronze',   emblem: 'stars1',    rim: 'light' },
  { tone: 'silver',   emblem: 'stars2',    rim: 'light' },
  { tone: 'gold',     emblem: 'stars3',    rim: 'light' },
  { tone: 'sapphire', emblem: 'round',     rim: 'gold' },
  { tone: 'ruby',     emblem: 'rhombus',   rim: 'gold' },
  { tone: 'emerald',  emblem: 'octagon',   rim: 'gold' },
  { tone: 'amethyst', emblem: 'crystal',   rim: 'gold', laurel: true },
  { tone: 'pearl',    emblem: 'pearl',     rim: 'gold', laurel: true },
  { tone: 'obsidian', emblem: 'shard',     rim: 'trim', laurel: true },
  { tone: 'diamond',  emblem: 'brilliant', rim: 'trim', laurel: true, crown: true },
]

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Emblem({ kind, tone }) {
  const light = `lf-${tone}-light`
  const deep = `ls-${tone}-deep`
  switch (kind) {
    case 'stars1':
      return <path className={light} d={starPath(24, 23.4, 7)} />
    case 'stars2':
      return (
        <>
          <path className={light} d={starPath(19.2, 23.4, 4.8)} />
          <path className={light} d={starPath(28.8, 23.4, 4.8)} />
        </>
      )
    case 'stars3':
      return (
        <>
          <path className={light} d={starPath(24, 18.6, 4.4)} />
          <path className={light} d={starPath(18.6, 27, 4.4)} />
          <path className={light} d={starPath(29.4, 27, 4.4)} />
        </>
      )
    case 'round':
      /* A round brilliant seen from above: an octagonal table, eight facets. */
      return (
        <>
          <circle className={light} cx="24" cy="23.4" r="8.4" />
          <path className="lf-white" d={polygon(24, 23.4, 4.2, 8, Math.PI / 8)} />
          <path className={deep} fill="none" strokeWidth="0.9" d={spokes(24, 23.4, 4.2, 8.4, 8, Math.PI / 8)} />
        </>
      )
    case 'rhombus':
      return (
        <>
          <path className={light} d="M24 13.6 32.4 23.4 24 33.2 15.6 23.4Z" />
          <path className="lf-white" d="M24 17.6 28.2 23.4 24 26.4 19.8 23.4Z" />
          <path className={deep} fill="none" strokeWidth="0.9" d="M15.6 23.4h16.8M24 26.4v6.8" />
        </>
      )
    case 'octagon':
      /* An emerald cut: a step-cut octagon around a long table. */
      return (
        <>
          <path className={light} d="M20.4 14.2h7.2l3.4 3.4v11.6l-3.4 3.4h-7.2L17 29.2V17.6Z" />
          <path className="lf-white" d="M21.7 18h4.6l1.5 1.5v7.8l-1.5 1.5h-4.6l-1.5-1.5v-7.8Z" />
          <path className={deep} fill="none" strokeWidth="0.9" d="m20.4 14.2 1.3 3.8M27.6 14.2l-1.3 3.8M31 17.6l-3.2 1.9M31 29.2l-3.2-1.9M27.6 32.6l-1.3-3.8M20.4 32.6l1.3-3.8M17 29.2l3.2-1.9M17 17.6l3.2 1.9" />
        </>
      )
    case 'crystal':
      return (
        <>
          <path className={light} d="M24 12.8 29.6 17.4v10.8L24 34l-5.6-5.8V17.4Z" />
          <path className="lf-white" d="M24 15.8 26.4 18v8.4L24 29l-2.4-2.6V18Z" />
          <path className={deep} fill="none" strokeWidth="0.9" d="M18.4 17.4 24 21l5.6-3.6" />
        </>
      )
    case 'pearl':
      return (
        <>
          <circle className={light} cx="24" cy="23.4" r="7.6" />
          <circle className="lf-white" cx="21.8" cy="20.8" r="2.6" />
          <circle className={deep} fill="none" strokeWidth="0.9" cx="24" cy="23.4" r="7.6" />
        </>
      )
    case 'shard':
      return (
        <>
          <path className={light} d="M22.2 13.4 30 18.6l-1.6 10.2L22.6 33.6 17.4 26.4l.8-9.2Z" />
          <path className="lf-white" d="m22.4 16.6 4.4 3-1 6-3.4 2.8-2.6-4 .4-5.6Z" />
          <path className={deep} fill="none" strokeWidth="0.9" d="m18.2 17.2 4.2 2.4M30 18.6l-3.2 1" />
        </>
      )
    case 'brilliant':
      return (
        <>
          <path className={light} d="M19.4 15.4h9.2l4.6 5.6L24 33.4 14.8 21Z" />
          <path className="lf-white" d="M21 15.4h6L28.6 21h-9.2Z" />
          <path className={deep} fill="none" strokeWidth="0.9" d="M14.8 21h18.4M19.4 21 24 33.4 28.6 21M21 15.4 19.4 21M27 15.4l1.6 5.6" />
        </>
      )
    default:
      return null
  }
}

/* Laurel: a branch on each side of the crest, in gold. */
const LEAVES = [
  [15.2, 42.6, -28], [10.6, 39.2, -48], [7.6, 34, -68], [6.3, 28, -84], [6.6, 22, -100],
]

function Laurel() {
  const branch = (
    <g>
      <path className="ls-gold-deep" fill="none" strokeWidth="1.3" strokeLinecap="round" d="M21.4 44.6C12.4 42.4 6.6 35 6.4 24.6" />
      {LEAVES.map(([cx, cy, rot], i) => (
        <ellipse key={i} className={i === LEAVES.length - 1 ? 'lf-gold-light' : 'lf-gold'} cx={cx} cy={cy} rx="3.5" ry="1.65" transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
    </g>
  )
  return (
    <g className="lg-laurel">
      {branch}
      <g transform="translate(48 0) scale(-1 1)">{branch}</g>
    </g>
  )
}

function Crown() {
  return (
    <g className="lg-crown">
      <path className="lf-gold-deep" d="M16.4 10.8 15 3.6l4.8 3.6L24 1.4l4.2 5.8L33 3.6l-1.4 7.2Z" transform="translate(0 1.2)" />
      <path className="lf-gold" d="M16.4 10.8 15 3.6l4.8 3.6L24 1.4l4.2 5.8L33 3.6l-1.4 7.2Z" />
      <circle className="lf-white" cx="24" cy="7.6" r="1.3" />
      <circle className="lf-white" cx="19.2" cy="8.4" r="0.9" />
      <circle className="lf-white" cx="28.8" cy="8.4" r="0.9" />
    </g>
  )
}

/** A small padlock, for locked leagues. */
function Lock() {
  return (
    <g className="lg-lock" transform="translate(16.8 15.6) scale(0.6)">
      <path className="ls-locked-ink" fill="none" strokeWidth="2.4" strokeLinecap="round" d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <rect className="lf-locked-ink" x="3.5" y="10.5" width="17" height="11" rx="2.4" />
    </g>
  )
}

/* ── Badges ─────────────────────────────────────────────────────────────── */

/**
 * One league's badge.
 * @param {{ tier: number, size?: number, state?: 'earned' | 'current' | 'locked', className?: string }} props
 */
export function LeagueBadge({ tier, size = 48, state = 'earned', className = '' }) {
  const uid = useUid()
  const c = COMPOSE[Math.max(0, Math.min(COMPOSE.length - 1, tier))]
  if (state === 'locked') {
    return (
      <svg {...svg(size, `lg-badge lg-badge--locked ${className}`)}>
        {c.laurel && <g className="lg-ghost-laurel"><path className="ls-locked" fill="none" strokeWidth="1.3" d="M21.4 44.6C12.4 42.4 6.6 35 6.4 24.6M26.6 44.6c9-2.2 14.8-9.6 15-20" /></g>}
        <path className="lf-locked" d={CREST} />
        <path className="ls-locked" fill="none" strokeWidth="1.2" d={CREST} />
        <Lock />
      </svg>
    )
  }
  const tone = c.tone
  return (
    <svg {...svg(size, `lg-badge lg-badge--${tone} ${className}`)}>
      <defs><clipPath id={`${uid}c`}><path d={CREST} /></clipPath></defs>
      {c.laurel && <Laurel />}
      <path className={`lf-${tone}-deep`} d={CREST} transform="translate(0 1.6)" />
      <path className={`lf-${tone}`} d={CREST} />
      <g clipPath={`url(#${uid}c)`}>
        <rect className={`lf-${tone}-deep lg-shade`} x="24" y="0" width="24" height="48" />
      </g>
      <path
        className={c.rim === 'light' ? `ls-${tone}-light` : 'ls-gold'}
        fill="none"
        strokeWidth={c.rim === 'trim' ? 2.2 : 1.4}
        d={RIM}
      />
      <Emblem kind={c.emblem} tone={tone} />
      <path className={`ls-${tone}-light lg-shine`} fill="none" strokeWidth="1.6" strokeLinecap="round" d="M14.6 15.8v5.2" />
      {c.crown && <Crown />}
    </svg>
  )
}

/** The badge with its league's name, for ladders and headers. */
export function LeagueName({ tier }) {
  return <>{leagueOf(tier).name} League</>
}

/* ── Medals ─────────────────────────────────────────────────────────────── */

const MEDAL_TONE = ['gold', 'silver', 'bronze']

/**
 * A podium medal: a disc on a ribbon, its place embossed.
 * @param {{ place: 1 | 2 | 3, size?: number, className?: string }} props
 */
export function Medal({ place, size = 48, className = '' }) {
  const uid = useUid()
  const tone = MEDAL_TONE[place - 1] ?? 'bronze'
  return (
    <svg {...svg(size, `lg-medal lg-medal--${place} ${className}`)}>
      <defs><clipPath id={`${uid}d`}><circle cx="24" cy="30" r="12.6" /></clipPath></defs>
      <path className="lf-ruby" d="M14 2h8.4l4 15h-8.4Z" />
      <path className="lf-sapphire" d="M34 2h-8.4l-4 15h8.4Z" />
      <path className="lf-ruby-deep lg-shade" d="M22.4 2h-.8l4 15h.8Z" />
      <circle className={`lf-${tone}-deep`} cx="24" cy="31.6" r="12.6" />
      <circle className={`lf-${tone}`} cx="24" cy="30" r="12.6" />
      <g clipPath={`url(#${uid}d)`}><rect className={`lf-${tone}-deep lg-shade`} x="24" y="14" width="16" height="32" /></g>
      <circle className={`ls-${tone}-light`} fill="none" strokeWidth="1.3" cx="24" cy="30" r="9.6" />
      <text className={`lg-medal-n lf-${tone}-deep`} x="24" y="34.6" textAnchor="middle">{place}</text>
      <path className={`ls-${tone}-light lg-shine`} fill="none" strokeWidth="1.6" strokeLinecap="round" d="M15.4 26.4a9 9 0 0 1 3.4-4.6" />
    </svg>
  )
}

/* ── Trophies ───────────────────────────────────────────────────────────── */

const CUP = 'M14.4 7.6h19.2v8.6c0 6.4-4.3 11.1-9.6 12.1-5.3-1-9.6-5.7-9.6-12.1Z'

function CupEmblem({ kind, tone }) {
  const light = `lf-${tone}-light`
  switch (kind) {
    case 'up':
      return <path className={light} d="m24 11.6 5.6 5.8h-3.4v5.4h-4.4v-5.4h-3.4Z" />
    case 'star':
      return <path className={light} d={starPath(24, 17.4, 5.6)} />
    case 'star2':
      return (
        <>
          <path className={light} d={starPath(20.2, 17.4, 3.8)} />
          <path className={light} d={starPath(27.8, 17.4, 3.8)} />
        </>
      )
    case 'crown':
      return <path className={light} d="M18.6 21 17.6 13.6l3.4 2.6L24 11.6l3 4.6 3.4-2.6-1 7.4Z" />
    case 'swords':
      return <path className={`ls-${tone}-light`} fill="none" strokeWidth="1.8" strokeLinecap="round" d="m18.8 12 10.4 10.4M29.2 12 18.8 22.4" />
    default:
      return null
  }
}

/**
 * A trophy cup.
 * @param {{ tone?: string, emblem?: string, laurel?: boolean, size?: number, className?: string }} props
 *   tone: a league id (`gold`, `diamond` …) — its three steps colour the cup
 */
export function Trophy({ tone = 'gold', emblem = 'star', laurel = false, size = 48, className = '' }) {
  const uid = useUid()
  const t = LEAGUES.some((l) => l.id === tone) ? tone : 'gold'
  return (
    <svg {...svg(size, `lg-trophy lg-trophy--${t} ${className}`)}>
      <defs><clipPath id={`${uid}b`}><path d={CUP} /></clipPath></defs>
      {laurel && <Laurel />}
      <path className={`ls-${t}-deep`} fill="none" strokeWidth="2.6" strokeLinecap="round" d="M14.4 10.8H10a4.6 4.6 0 0 0 4.8 8.2M33.6 10.8H38a4.6 4.6 0 0 1-4.8 8.2" />
      <path className={`lf-${t}-deep`} d={CUP} transform="translate(0 1.4)" />
      <path className={`lf-${t}`} d={CUP} />
      <g clipPath={`url(#${uid}b)`}><rect className={`lf-${t}-deep lg-shade`} x="24" y="0" width="14" height="32" /></g>
      <CupEmblem kind={emblem} tone={t} />
      <rect className={`lf-${t}-deep`} x="21.8" y="28" width="4.4" height="7" />
      <rect className={`lf-${t}`} x="15.6" y="34.6" width="16.8" height="4.6" rx="1" />
      <rect className={`lf-${t}-deep`} x="13.4" y="39" width="21.2" height="4.6" rx="1" />
      <path className={`ls-${t}-light lg-shine`} fill="none" strokeWidth="1.6" strokeLinecap="round" d="M17.6 10.8v5" />
    </svg>
  )
}

/* ── An award, drawn as what it is ──────────────────────────────────────── */

/**
 * The picture for a server award record ({ kind, tier, rank }).
 * @param {{ award: { kind: string, tier?: number|null, rank?: number|null }, size?: number }} props
 */
export function AwardArt({ award, size = 40 }) {
  const tier = Number.isFinite(award?.tier) ? award.tier : 0
  const tone = leagueOf(tier).id
  switch (award?.kind) {
    case 'league-promoted':
      return <Trophy tone={tone} emblem="up" size={size} />
    case 'league-podium':
    case 'tournament-podium':
      return <Medal place={Math.min(3, Math.max(1, award.rank ?? 3))} size={size} />
    case 'league-reached':
      return <LeagueBadge tier={tier} size={size} />
    case 'tournament-qualified':
      return <Trophy tone="diamond" emblem="crown" size={size} />
    case 'tournament-semifinal':
      return <Trophy tone="diamond" emblem="star" size={size} />
    case 'tournament-final':
      return <Trophy tone="diamond" emblem="star2" size={size} />
    case 'tournament-champion':
      return <Trophy tone="gold" emblem="crown" laurel size={size} />
    case 'challenge-win':
      return <Trophy tone="gold" emblem="swords" size={size} />
    default:
      return <Trophy tone="gold" emblem="star" size={size} />
  }
}

export default { LeagueBadge, LeagueName, Medal, Trophy, AwardArt }
