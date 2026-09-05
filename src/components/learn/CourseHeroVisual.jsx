/* ═══════════════════════════════════════════════════════════════════════════
   CourseHeroVisual.jsx — 2.5D AI ORB
   ---------------------------------------------------------------------------
   Decorative centerpiece for the active section's hero card. A layered,
   dimensional composition — glowing core, orbiting rings, connected neural
   nodes, a floating geometric chip — rather than a flat icon or stock
   illustration. Purely CSS-driven motion (see .chv-* rules in LearnPage.css)
   so it stays cheap to render and respects prefers-reduced-motion.

   `theme` tints the palette per section (green / blue / purple) while always
   keeping the violet→cyan brand gradient as the dominant hue, so sections
   read as a family rather than a random assortment of colors.
   ═══════════════════════════════════════════════════════════════════════════ */

const THEMES = {
  purple: { a: '#7C5CFC', b: '#06AED4', ring: '#A78BFA' },
  blue:   { a: '#4C7CF0', b: '#22D3EE', ring: '#7DD3FC' },
  green:  { a: '#22C55E', b: '#06AED4', ring: '#6EE7B7' },
}

export default function CourseHeroVisual({ theme = 'purple', className = '' }) {
  const c = THEMES[theme] ?? THEMES.purple
  const uid = theme // stable per-theme id so gradients don't collide across instances

  return (
    <svg
      className={`chv-svg ${className}`}
      viewBox="0 0 280 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`chvCore-${uid}`} cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="28%" stopColor={c.a} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c.b} stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={`chvHalo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.a} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c.a} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`chvRing-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.a} stopOpacity="0.05" />
          <stop offset="50%" stopColor={c.ring} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c.b} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`chvChip-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EEF2FF" />
        </linearGradient>
      </defs>

      {/* Ground shadow — anchors the composition, reads as depth not a sticker */}
      <ellipse className="chv-shadow" cx="150" cy="184" rx="72" ry="12" fill={c.a} opacity="0.16" />

      {/* Soft ambient halo behind everything */}
      <circle cx="150" cy="102" r="86" fill={`url(#chvHalo-${uid})`} />

      {/* Orbiting rings — two independent speeds/directions for parallax */}
      <g className="chv-orbit chv-orbit--slow" style={{ transformOrigin: '150px 100px' }}>
        <ellipse cx="150" cy="100" rx="98" ry="34" stroke={`url(#chvRing-${uid})`} strokeWidth="1.4" />
      </g>
      <g className="chv-orbit chv-orbit--fast" style={{ transformOrigin: '150px 100px' }}>
        <ellipse cx="150" cy="100" rx="68" ry="88" stroke={`url(#chvRing-${uid})`} strokeWidth="1.2" opacity="0.7" />
      </g>

      {/* Neural connective lines */}
      <g stroke={c.ring} strokeOpacity="0.4" strokeWidth="1">
        <line x1="150" y1="100" x2="86" y2="62" />
        <line x1="150" y1="100" x2="214" y2="70" />
        <line x1="150" y1="100" x2="96" y2="146" />
        <line x1="150" y1="100" x2="204" y2="142" />
        <line x1="150" y1="100" x2="150" y2="38" />
      </g>

      {/* Core orb */}
      <circle cx="150" cy="100" r="38" fill={`url(#chvCore-${uid})`} />
      <circle cx="150" cy="100" r="38" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1" />

      {/* Neural nodes — small dimensional dots, a few gently pulsing */}
      <circle className="chv-node chv-node--1" cx="86" cy="62" r="6" fill={c.a} />
      <circle className="chv-node chv-node--2" cx="214" cy="70" r="5" fill={c.b} />
      <circle className="chv-node chv-node--3" cx="96" cy="146" r="5.5" fill={c.ring} />
      <circle className="chv-node chv-node--4" cx="204" cy="142" r="4.5" fill={c.a} />
      <circle className="chv-node chv-node--5" cx="150" cy="38" r="4" fill={c.b} />

      {/* Floating 2.5D geometric chip — establishes the recurring dimensional
          language (soft shadow, highlight edge, gentle float) used elsewhere. */}
      <g className="chv-chip">
        <rect x="196" y="146" width="34" height="34" rx="9" fill={`url(#chvChip-${uid})`}
          stroke="#FFFFFF" strokeWidth="1" />
        <rect x="196" y="146" width="34" height="34" rx="9" fill="none"
          stroke={c.a} strokeOpacity="0.18" strokeWidth="1" />
        <path d="M204 163h18M213 154v18" stroke={c.a} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  )
}
