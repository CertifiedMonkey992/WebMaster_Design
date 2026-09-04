/* ═══════════════════════════════════════════════════════════════════════════
   Icons.jsx — PROGRESSION ICON SET
   ---------------------------------------------------------------------------
   Hand-drawn SVG paths rather than emoji, so hearts, gems and flames render
   identically on every OS and inherit colour from CSS.

   Every icon is built on a 24×24 grid and coloured with `currentColor`.
   Solid icons layer a lighter overlay path at reduced opacity to fake a
   highlight facet — no gradients, so no <defs> id collisions when the same
   icon appears a dozen times on one page.
   ═══════════════════════════════════════════════════════════════════════════ */

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

/* ── Hero icons: heart, gem, flame ───────────────────────────────────────── */

/** Solid heart. The highlight arc reads as a glossy top-left facet. */
export function HeartIcon({ size = 20, empty = false, className = '' }) {
  if (empty) {
    return (
      <svg {...base(size)} className={className}>
        <path
          d="M20.5 5.1a5.1 5.1 0 0 0-7.2 0L12 6.4l-1.3-1.3a5.1 5.1 0 1 0-7.2 7.2l8.5 8.4 8.5-8.4a5.1 5.1 0 0 0 0-7.2Z"
          fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.5"
        />
      </svg>
    )
  }
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M20.5 5.1a5.1 5.1 0 0 0-7.2 0L12 6.4l-1.3-1.3a5.1 5.1 0 1 0-7.2 7.2l8.5 8.4 8.5-8.4a5.1 5.1 0 0 0 0-7.2Z"
        fill="currentColor"
      />
      <path
        d="M6.7 5.9c-1.1.2-2 .9-2.4 1.9-.3.8-.2 1.7.2 2.4"
        fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.45"
      />
    </svg>
  )
}

/** Brilliant-cut gem: table, crown bevels and pavilion facets. */
export function GemIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size)} className={className}>
      {/* body */}
      <path d="M7.4 2.6h9.2L22 9.1 12 21.6 2 9.1l5.4-6.5Z" fill="currentColor" />
      {/* crown highlight */}
      <path d="M7.4 2.6h9.2L18.6 9H5.4l2-6.4Z" fill="#fff" opacity="0.28" />
      {/* facet lines */}
      <g stroke="#000" strokeOpacity="0.22" strokeWidth="0.9" strokeLinejoin="round" fill="none">
        <path d="M2 9.1h20M5.4 9 12 21.6 18.6 9M9.6 2.6 8 9M14.4 2.6 16 9" />
      </g>
      {/* sparkle */}
      <path d="M9.1 10.6 12 18.6" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Two-tone flame — outer body plus an inner core at higher brightness. */
export function FlameIcon({ size = 20, className = '', dim = false }) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M13.1 1.5c.3 2.6-.7 4.3-2.2 5.8-1.7 1.7-3.8 3.2-4.4 5.9-.8 3.6 1.3 7.1 4.8 8.2 4 1.2 8.1-1.3 8.6-5.4.4-3.1-1-5.1-2.9-6.9-.3 1.1-.9 1.9-1.8 2.3.5-3.6-.5-7.1-2.1-9.9Z"
        fill="currentColor"
        opacity={dim ? 0.9 : 1}
      />
      <path
        d="M12.3 12.4c.2 1.4-.4 2.2-1.2 3-.7.7-1.3 1.4-1.3 2.4 0 1.6 1.4 2.8 3.1 2.8 1.8 0 3.2-1.2 3.2-2.9 0-1.4-.8-2.3-1.8-3.1-.1.6-.4 1-.9 1.2.2-1.3-.4-2.5-1.1-3.4Z"
        fill="#fff"
        opacity={dim ? 0.18 : 0.42}
      />
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
      <path d="m8 12.3 2.8 2.8L16.2 9.7" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
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
  lock: (
    <>
      <rect x="3.5" y="10.5" width="17" height="11" rx="2.4" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
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
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4M5 4h11l-1.8 3.5L16 11H5" />
    </>
  ),
  shield: <path d="M12 2.5 20 6v6c0 4.6-3.2 8.3-8 9.5-4.8-1.2-8-4.9-8-9.5V6l8-3.5Z" />,
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="M12 18l4-5.5" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 3.5A3 3 0 0 0 6.7 7 3 3 0 0 0 5 9.8a3 3 0 0 0 1.2 2.4A3 3 0 0 0 6 14.5a3 3 0 0 0 2.4 2.9A2.6 2.6 0 0 0 11 20V4.6a2.6 2.6 0 0 0-1.5-1.1Z" />
      <path d="M14.5 3.5A3 3 0 0 1 17.3 7 3 3 0 0 1 19 9.8a3 3 0 0 1-1.2 2.4 3 3 0 0 1 .2 2.3 3 3 0 0 1-2.4 2.9A2.6 2.6 0 0 1 13 20V4.6a2.6 2.6 0 0 1 1.5-1.1Z" />
    </>
  ),
}

/** Generic line icon. Names come from quest templates and achievements. */
export function Icon({ name, size = 18, strokeWidth = 2, className = '', style }) {
  const path = LINE_ICONS[name]
  if (!path) return null
  return (
    <svg {...base(size)} className={className} style={style} {...stroke} strokeWidth={strokeWidth}>
      {path}
    </svg>
  )
}

/**
 * Resolve any icon id used by quests / achievements / missions, preferring the
 * solid hero icons where one exists.
 */
export function QuestIcon({ name, size = 18, className = '' }) {
  if (name === 'flame') return <FlameIcon size={size} className={className} />
  if (name === 'gem') return <GemIcon size={size} className={className} />
  if (name === 'heart') return <HeartIcon size={size} className={className} />
  return <Icon name={name} size={size} className={className} />
}

export default { Icon, QuestIcon, HeartIcon, GemIcon, FlameIcon }
