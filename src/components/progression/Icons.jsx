/* ═══════════════════════════════════════════════════════════════════════════
   Icons.jsx — THE ECONOMY'S ICON SET
   ---------------------------------------------------------------------------
   Revision 2. The hero icons — heart, flame, gem, bolt, shield — are drawn as
   small physical objects rather than flat glyphs, all to one construction so
   they read as one family:

     · a BACK plate, offset 1px down in a darker mix of the icon's own colour —
       the object's thickness
     · the FACE in currentColor
     · one SHADE facet on the lower right (ink at low alpha) — depth
     · one warm SHINE mark on the upper left — where the light comes from

   Every part carries a class, so CSS can colour it for a state (a dim flame,
   an empty heart) and animate it for an event (the flame's layers flicker on
   their own periods; the heart's halves part when it cracks) without a second
   drawing. Clip-path ids are namespaced with useId, because the same heart
   renders a dozen times on one screen.

   The line icons below are unchanged: 24px box, 2px round strokes.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId } from 'react'
import './icons.css'

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
  focusable: 'false',
})

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const useUid = () => useId().replace(/:/g, '')

/* ── Heart ───────────────────────────────────────────────────────────────────
   `fill` (0–1) is how much of the heart is full: the top-bar heart shows the
   ratio of hearts left, so the icon itself says "limited". The heart is drawn
   as two halves along a zig-zag crack line; at rest they meet exactly and the
   seam is invisible, and when a heart is lost CSS parts them. */

const HEART = 'M20.5 5.1a5.1 5.1 0 0 0-7.2 0L12 6.4l-1.3-1.3a5.1 5.1 0 1 0-7.2 7.2l8.5 8.4 8.5-8.4a5.1 5.1 0 0 0 0-7.2Z'
const HEART_SHADE = 'M12 20.7 20.5 12.3a5.1 5.1 0 0 0 1.2-5.4c-.5 2-1.8 3.8-3.5 5.4L12 18.5Z'
const HEART_SHINE = 'M6.5 6.2c-1.3.3-2.2 1.4-2.3 2.8'
const CRACK = '12,6.4 10.7,9.4 13,12 10.9,14.6 12.5,17.2 12,21'

export function HeartIcon({ size = 20, empty = false, fill, className = '', style }) {
  const uid = useUid()
  const level = empty ? 0 : fill == null ? 1 : Math.max(0, Math.min(1, fill))
  const crack = CRACK.split(' ').join(' ')

  return (
    <svg {...base(size)} className={`hi ${className}`.trim()} style={{ ...style, '--fill': level }}>
      <defs>
        <clipPath id={`${uid}l`}>
          <polygon className="hi-level" points="0,3 24,3 24,24 0,24" />
        </clipPath>
        <clipPath id={`${uid}a`}>
          <polygon points={`0,0 12,0 ${crack} 12,24 0,24`} />
        </clipPath>
        <clipPath id={`${uid}b`}>
          <polygon points={`24,0 12,0 ${crack} 12,24 24,24`} />
        </clipPath>
      </defs>

      {['a', 'b'].map((side) => (
        <g key={side} className={`hi-half hi-half--${side}`}>
          <g clipPath={`url(#${uid}${side})`}>
            <path className="hi-back" d={HEART} transform="translate(0 1.1)" />
            <path className="hi-well" d={HEART} />
            <g clipPath={`url(#${uid}l)`}>
              <path className="hi-face" d={HEART} />
              <path className="hi-shade" d={HEART_SHADE} />
            </g>
            <path className="hi-shine" d={HEART_SHINE} />
          </g>
        </g>
      ))}
      <polyline className="hi-crack" points={crack.replace(/ /g, ' ')} />
    </svg>
  )
}

/* ── Gem ─────────────────────────────────────────────────────────────────────
   A cut stone: table, crown, two pavilion facets in different lights, and a
   glint band clipped to the stone that sweeps across it when it is earned or
   hovered. */

const GEM = 'M7.4 2.6h9.2L22 9.1 12 21.6 2 9.1Z'

export function GemIcon({ size = 20, className = '', style }) {
  const uid = useUid()
  return (
    <svg {...base(size)} className={`gi ${className}`.trim()} style={style}>
      <defs>
        <clipPath id={`${uid}g`}><path d={GEM} /></clipPath>
      </defs>
      <path className="gi-back" d={GEM} transform="translate(0 1)" />
      <path className="gi-body" d={GEM} />
      <path className="gi-crown" d="M7.4 2.6h9.2L18.6 9.1H5.4Z" />
      <path className="gi-pav-l" d="M2 9.1h3.4L12 21.6Z" />
      <path className="gi-pav-r" d="M18.6 9.1H22L12 21.6Z" />
      <path className="gi-facets" d="M2 9.1h20M5.4 9.1 12 21.6l6.6-12.5M9.6 2.6 8 9.1M14.4 2.6 16 9.1" />
      <g clipPath={`url(#${uid}g)`}>
        <rect className="gi-glint" x="-6" y="-2" width="4" height="28" />
      </g>
    </svg>
  )
}

/* ── Flame ───────────────────────────────────────────────────────────────────
   Three nested flames — ember outside, ochre in the middle, a cream core —
   each on its own group so CSS can flicker them on different periods and
   flare them together. `state`:

     lit    the streak is alive and today is done: full flame, full core
     risk   alive, but today is not done yet: shorter, paler, uneasy
     out    no streak: ash-coloured, still */

const FLAME = 'M13.1 1.5c.3 2.6-.7 4.3-2.2 5.8-1.7 1.7-3.8 3.2-4.4 5.9-.8 3.6 1.3 7.1 4.8 8.2 4 1.2 8.1-1.3 8.6-5.4.4-3.1-1-5.1-2.9-6.9-.3 1.1-.9 1.9-1.8 2.3.5-3.6-.5-7.1-2.1-9.9Z'

export function FlameIcon({ size = 20, className = '', dim = false, state, style }) {
  const s = state ?? (dim ? 'out' : 'lit')
  return (
    <svg {...base(size)} className={`fi fi--${s} ${className}`.trim()} style={style}>
      <g className="fi-o"><path className="fi-outer" d={FLAME} /></g>
      <g className="fi-m"><path className="fi-mid" d={FLAME} transform="matrix(.62 0 0 .62 4.7 8.2)" /></g>
      <g className="fi-c"><path className="fi-core" d={FLAME} transform="matrix(.34 0 0 .34 8.2 14)" /></g>
    </svg>
  )
}

/* ── Bolt (XP) ───────────────────────────────────────────────────────────── */

const BOLT = 'M13.5 1.8 4 13.6h6.8L9.6 22.2 20 9.9h-6.9Z'

export function BoltIcon({ size = 20, className = '', style }) {
  return (
    <svg {...base(size)} className={`bi ${className}`.trim()} style={style}>
      <path className="bi-back" d={BOLT} transform="translate(.7 1)" />
      <path className="bi-face" d={BOLT} />
      <path className="bi-shade" d="M13.1 9.9H20L9.6 22.2l.9-6.9Z" />
      <path className="bi-shine" d="M12 4.9 7.3 11" />
    </svg>
  )
}

/* ── Shield ──────────────────────────────────────────────────────────────── */

const SHIELD = 'M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6Z'

export function ShieldIcon({ size = 20, className = '', style, emblem = true }) {
  return (
    <svg {...base(size)} className={`si ${className}`.trim()} style={style}>
      <path className="si-back" d={SHIELD} transform="translate(0 1)" />
      <path className="si-face" d={SHIELD} />
      <path className="si-shade" d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5Z" />
      {emblem && <path className="si-emblem" d={FLAME} transform="matrix(.42 0 0 .42 6.9 5.6)" />}
      <path className="si-shine" d="M11.4 5.1 6.6 7.1v3" />
    </svg>
  )
}

/* ── Line icons ──────────────────────────────────────────────────────────── */

const LINE_ICONS = {
  bolt: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />,
  book: (
    <>
      <path d="M2 4h5.5A3.5 3.5 0 0 1 11 7.5V20a2.8 2.8 0 0 0-2.8-2.5H2V4Z" />
      <path d="M22 4h-5.5A3.5 3.5 0 0 0 13 7.5V20a2.8 2.8 0 0 1 2.8-2.5H22V4Z" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  star: <path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.8Z" />,
  layers: (
    <>
      <path d="m12 2.5 9.5 5-9.5 5-9.5-5 9.5-5Z" />
      <path d="m2.5 12.5 9.5 5 9.5-5" />
      <path d="m2.5 17 9.5 5 9.5-5" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path className="ico-check" pathLength="1" d="m8 12.3 2.8 2.8L16.2 9.7" />
    </>
  ),
  check: <path className="ico-check" pathLength="1" d="m5 12.5 4.5 4.5L19 7" />,
  users: (
    <>
      <path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M15.5 4.2a3.4 3.4 0 0 1 0 6.6" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2.5c3 2 4.8 5.4 4.8 9.2l-2 4.3H9.2l-2-4.3C7.2 7.9 9 4.5 12 2.5Z" />
      <circle cx="12" cy="10" r="2.1" />
      <path d="M9.2 16 6.6 18.2 7.4 21l2.4-1.2M14.8 16l2.6 2.2-.8 2.8-2.4-1.2" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7.4l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.4l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 2.5 13.9 8l5.6 2-5.6 2-1.9 5.5L10.1 12l-5.6-2 5.6-2L12 2.5Z" />
      <path d="M18.5 15.5 19.3 18l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8.8-2.5Z" />
    </>
  ),
  'chevron-up': <path d="m5.5 15 6.5-6.5 6.5 6.5" />,
  'chevron-down': <path d="m5.5 9 6.5 6.5L18.5 9" />,
  'chevron-right': <path d="m9 5.5 6.5 6.5L9 18.5" />,
  /* The shackle is its own group so a refused lock can rattle it. */
  lock: (
    <>
      <path className="ico-shackle" d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <rect x="3.5" y="10.5" width="17" height="11" rx="2.4" />
      <path d="M12 15v2.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.5V7a3.5 3.5 0 0 0 3 3.4M17 5.5h2.5V7a3.5 3.5 0 0 1-3 3.4" />
      <path d="M9.5 20h5M12 14v6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11v5.5M12 7.6h.01" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path className="ico-hand" d="M12 6.8V12l3.4 2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4M5 4h11l-1.8 3.5L16 11H5" />
    </>
  ),
  shield: <path d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6l8-3.5Z" />,
  /* The lid is its own group so a waiting gift can lift it. */
  gift: (
    <>
      <path d="M4.8 13.5v6.3a1.7 1.7 0 0 0 1.7 1.7h11a1.7 1.7 0 0 0 1.7-1.7v-6.3M12 13.5v8" />
      <g className="ico-lid">
        <rect x="3" y="8.5" width="18" height="5" rx="1.2" />
        <path d="M12 8.5v5" />
        <path d="M12 8.5H7.8a2.65 2.65 0 1 1 0-5.3C10.6 3.2 12 8.5 12 8.5ZM12 8.5h4.2a2.65 2.65 0 1 0 0-5.3C13.4 3.2 12 8.5 12 8.5Z" />
      </g>
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path className="ico-hand" d="M12 18l4-5.5" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 3.5A3 3 0 0 0 6.7 7 3 3 0 0 0 5 9.8a3 3 0 0 0 1.2 2.4A3 3 0 0 0 6 14.5a3 3 0 0 0 2.4 2.9A2.6 2.6 0 0 0 11 20V4.6a2.6 2.6 0 0 0-1.5-1.1Z" />
      <path d="M14.5 3.5A3 3 0 0 1 17.3 7 3 3 0 0 1 19 9.8a3 3 0 0 1-1.2 2.4 3 3 0 0 1 .2 2.3 3 3 0 0 1-2.4 2.9A2.6 2.6 0 0 1 13 20V4.6a2.6 2.6 0 0 1 1.5-1.1Z" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
}

/** Generic line icon. Names come from quest templates and achievements. */
export function Icon({ name, size = 18, strokeWidth = 2, className = '', style }) {
  const path = LINE_ICONS[name]
  if (!path) return null
  return (
    <svg {...base(size)} className={`li li--${name} ${className}`.trim()} style={style} {...stroke} strokeWidth={strokeWidth}>
      {path}
    </svg>
  )
}

/**
 * Resolve any icon id used by quests / achievements / missions, preferring the
 * drawn economy icons where one exists.
 */
export function QuestIcon({ name, size = 18, className = '' }) {
  if (name === 'flame') return <FlameIcon size={size} className={className} />
  if (name === 'gem') return <GemIcon size={size} className={className} />
  if (name === 'heart') return <HeartIcon size={size} className={className} />
  if (name === 'bolt') return <BoltIcon size={size} className={className} />
  if (name === 'shield') return <ShieldIcon size={size} className={className} emblem={false} />
  return <Icon name={name} size={size} className={className} />
}

export default { Icon, QuestIcon, HeartIcon, GemIcon, FlameIcon, BoltIcon, ShieldIcon }
