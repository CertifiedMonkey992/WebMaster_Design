/* ═══════════════════════════════════════════════════════════════════════════
   NavIcons.jsx — THE SIDEBAR'S ICONS
   ---------------------------------------------------------------------------
   Small full-colour illustrations, drawn to a reference the product owner
   supplied (VISUAL_SYSTEM.md → The nav icons): flat shapes, no outlines, one
   lighter "shine" per object, colours from the --ni-* tokens in index.css.
   Every shape sits on a 32-unit grid measured from that reference.

     Learn     a birdhouse              Practice  a dumbbell
     Quests    a treasure chest         Shop      a shopfront
     Profile   an avatar                Home      a globe (the public site)
     About     an "i" in a disc

   Each icon has ONE part that moves on hover (classes `ni-*`, animated in
   LearnPage.css), so the sidebar keeps the one-move-per-destination
   behaviour it had with the line icons.

   Colours are applied by class (`nf-*` fill, `ns-*` stroke), never by hex
   in the markup, so the palette lives in one place.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId } from 'react'

const svg = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 32 32',
  'aria-hidden': true,
  focusable: 'false',
})

const useUid = () => useId().replace(/:/g, '')

/* ── Learn: a birdhouse ─────────────────────────────────────────────────── */
const HOUSE = 'M16 7.5 26 15v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V15Z'

export function LearnIcon({ size = 30 }) {
  const uid = useUid()
  return (
    <svg {...svg(size)} className="ni ni-learn">
      <defs><clipPath id={`${uid}h`}><path d={HOUSE} /></clipPath></defs>
      <path className="nf-yellow" d={HOUSE} />
      <g clipPath={`url(#${uid}h)`}>
        {/* The roof's shadow on the wall, and the darker sill at the base. */}
        <polyline className="ns-orange" points="4,16 16,6.8 28,16" fill="none" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect className="nf-yellow-deep" x="6" y="26.6" width="20" height="1.4" />
      </g>
      <circle className="nf-maroon" cx="16" cy="17.3" r="3.5" />
      <rect className="nf-gold-dark" x="12.7" y="22.8" width="6.6" height="1.9" rx="0.95" />
      <polyline className="ni-roof ns-red" points="4,14.6 16,5.4 28,14.6" fill="none" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Practice: a dumbbell ───────────────────────────────────────────────────
   Drawn level, then tilted 30° — the angle of the reference. Two fat plates
   a side, each a capsule with a lighter stripe, on a short grey bar. */
function Plate({ x }) {
  return (
    <g>
      <rect className="nf-blue" x={x} y="8.5" width="6.5" height="15" rx="3.25" />
      <rect className="nf-blue-light" x={x + 1.4} y="10.8" width="1.5" height="4.8" rx="0.75" />
    </g>
  )
}

export function PracticeIcon({ size = 30 }) {
  return (
    <svg {...svg(size)} className="ni ni-practice">
      <g className="ni-bell">
        <g transform="rotate(-30 16 16)">
          <rect className="nf-gray" x="13" y="14.9" width="6" height="2.2" rx="1" />
          <Plate x={2.9} />
          <Plate x={8.5} />
          <Plate x={17} />
          <Plate x={22.6} />
        </g>
      </g>
    </svg>
  )
}

/* ── Quests: a treasure chest ───────────────────────────────────────────────
   Gold posts and bands around a wooden panel, a lock with a keyhole, and two
   anti-diagonal bands of shine across the gold. The red dot is the
   reference's "something waiting" mark, so it is drawn only when a quest is
   ready to claim. */
export function QuestIcon({ size = 30, alert = false }) {
  const uid = useUid()
  return (
    <svg {...svg(size)} className="ni ni-quest">
      <defs>
        <clipPath id={`${uid}g`}>
          <rect x="2" y="4" width="6.2" height="25" rx="1.6" />
          <rect x="23.8" y="4" width="6.2" height="25" rx="1.6" />
          <rect x="2" y="25.6" width="28" height="3.4" rx="1.6" />
          <rect x="2" y="14.4" width="28" height="4.8" />
        </clipPath>
      </defs>
      <g className="ni-chest">
        <rect className="nf-wood" x="7.6" y="6" width="16.8" height="20" />
        <rect className="nf-wood-light" x="7.6" y="6" width="16.8" height="1.1" />
        <g clipPath={`url(#${uid}g)`}>
          <rect className="nf-yellow" x="0" y="0" width="32" height="32" />
          <polygon className="nf-yellow-light" points="12,0 20.5,0 0,20.5 0,12" />
          <polygon className="nf-yellow-light" points="32,2 32,18.5 18.5,32 2,32" />
          <rect className="nf-amber" x="8.2" y="14.4" width="15.6" height="0.7" />
          <rect className="nf-amber" x="8.2" y="18.5" width="15.6" height="0.7" />
        </g>
        <g className="ni-lock">
          <rect className="nf-yellow ns-yellow-edge" x="11" y="11" width="9.8" height="10.6" rx="2" strokeWidth="0.8" />
          <circle className="nf-amber" cx="15.9" cy="15.2" r="1.85" />
          <rect className="nf-amber" x="15.2" y="15.4" width="1.4" height="3.6" rx="0.7" />
        </g>
      </g>
      {alert && <circle className="ni-dot nf-red ns-white" cx="25.6" cy="6.4" r="4" strokeWidth="1.4" />}
    </svg>
  )
}

/* ── Shop: a shopfront ──────────────────────────────────────────────────────
   A red-grey-red awning whose red flaps hang lower than the middle, over a
   brown front with a pale-blue door and window. */
function Flap({ x }) {
  return (
    <g>
      <path className="nf-red-mid" d={`M${x} 9.5h8v3.6a2.6 2.6 0 0 1-2.6 2.6h-2.8a2.6 2.6 0 0 1-2.6-2.6Z`} />
      <path className="nf-red-deep" d={`M${x} 6a2 2 0 0 1 2-2h6v6.2h-8Z`} />
      <rect className="nf-red-edge" x={x + 1.4} y="15.3" width="5.2" height="0.8" rx="0.4" />
    </g>
  )
}

export function ShopIcon({ size = 30 }) {
  return (
    <svg {...svg(size)} className="ni ni-shop">
      <rect className="nf-brown" x="4" y="14.4" width="24" height="13" rx="1.2" />
      <rect className="nf-brown-light" x="4" y="26.4" width="24" height="1.2" rx="0.6" />
      <rect className="nf-gray-frame" x="7" y="18.8" width="6.2" height="7.6" rx="0.6" />
      <rect className="nf-blue-pale" x="7.9" y="19.7" width="5.3" height="6.7" rx="0.3" />
      <rect className="nf-gray-frame" x="16.2" y="18.8" width="9" height="5.6" rx="0.6" />
      <rect className="nf-blue-pale" x="17.1" y="19.7" width="7.2" height="3.9" rx="0.3" />
      <g className="ni-awning">
        <rect className="nf-gray-light" x="11" y="4" width="10" height="7.6" />
        <g transform="scale(-1 1) translate(-32 0)"><Flap x={3} /></g>
        <Flap x={3} />
        <rect className="nf-red-seam" x="10.6" y="4" width="0.6" height="7.6" />
        <rect className="nf-red-seam" x="20.8" y="4" width="0.6" height="7.6" />
      </g>
    </svg>
  )
}

/* ── Profile: an avatar ─────────────────────────────────────────────────── */
export function ProfileIcon({ size = 30 }) {
  const uid = useUid()
  return (
    <svg {...svg(size)} className="ni ni-profile">
      <defs><clipPath id={`${uid}c`}><circle cx="16" cy="16" r="15.5" /></clipPath></defs>
      <circle className="nf-gray" cx="16" cy="16" r="15.5" />
      <g clipPath={`url(#${uid}c)`}>
        <path className="nf-blue-shirt" d="M4.5 33c0-5.6 4.6-8.2 11.5-8.2s11.5 2.6 11.5 8.2Z" />
        <path className="nf-blue-collar" d="M11.6 25.4c1.3 1.6 2.8 2.3 4.4 2.3s3.1-.7 4.4-2.3c-1.3-.4-2.8-.6-4.4-.6s-3.1.2-4.4.6Z" />
        <rect className="nf-skin-shade" x="13.6" y="20" width="4.8" height="6.2" rx="2" />
        <g className="ni-head">
          <ellipse className="nf-skin" cx="16" cy="15.4" rx="7" ry="7.6" />
          <path className="nf-hair" d="M8.6 16.6C7.4 8.8 11 4 16 4s8.6 4.8 7.4 12.6c-.8-3.4-2.4-5.8-4.4-6.8-1.8 1.4-5.2 2-9 1.6-.7 1.5-1.1 3.2-1.4 5.2Z" />
          <rect className="nf-hair" x="9.8" y="13.8" width="5.2" height="3.8" rx="1.5" />
          <rect className="nf-hair" x="17" y="13.8" width="5.2" height="3.8" rx="1.5" />
          <rect className="nf-hair" x="14.6" y="14.8" width="2.8" height="1" />
          <rect className="nf-skin" x="10.8" y="14.7" width="3.2" height="2" rx="0.9" />
          <rect className="nf-skin" x="18" y="14.7" width="3.2" height="2" rx="0.9" />
          <path className="nf-white ns-hair" d="M13 19.4h6c0 1.9-1.3 3-3 3s-3-1.1-3-3Z" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  )
}

/* ── Home: a globe — the public site ────────────────────────────────────── */
export function HomeIcon({ size = 30 }) {
  const uid = useUid()
  return (
    <svg {...svg(size)} className="ni ni-home">
      <defs><clipPath id={`${uid}g`}><circle cx="16" cy="16" r="13" /></clipPath></defs>
      <circle className="nf-blue" cx="16" cy="16" r="13" />
      <g clipPath={`url(#${uid}g)`}>
        <g className="ni-land">
          <path className="nf-green" d="M6 9.5c2.4-1.6 5.6-1.2 7.4.8 1.2 1.4.4 3.4-1.4 3.8-1.6.4-2 1.8-1 3.2 1.2 1.6.4 3.8-1.6 4.2-2.6.6-4.6-1-5.6-3.4C2.6 15.2 3.6 11 6 9.5Z" />
          <path className="nf-green" d="M18.6 6.2c2.6-.6 6.6.8 8.4 4 .8 1.4-.2 2.6-1.8 2.4-1.8-.2-3 .8-2.6 2.6.4 1.6-.4 2.8-2 2.6-2.2-.2-3.4-2.2-3-4.4.2-1.4-.6-2.4-1.6-3.2-1.4-1.2-.2-3.4 2.6-4Z" />
          <path className="nf-green" d="M17.2 22.4c1.8-1.4 4.6-1.2 6.2.2 1 .9.6 2.4-.8 3-2 .9-4.4.8-5.6-.4-.8-.8-.6-2 .2-2.8Z" />
        </g>
        <path className="nf-blue-light" d="M8.2 7.4a11 11 0 0 1 6-3.2 1 1 0 0 1 .4 2 9 9 0 0 0-5 2.6 1 1 0 0 1-1.4-1.4Z" />
      </g>
    </svg>
  )
}

/* ── About: an "i" in a disc ────────────────────────────────────────────── */
export function AboutIcon({ size = 30 }) {
  return (
    <svg {...svg(size)} className="ni ni-about">
      <circle className="nf-purple" cx="16" cy="16" r="13" />
      <circle className="ni-about-dot nf-white" cx="16" cy="10.2" r="1.9" />
      <rect className="nf-white" x="14.4" y="13.6" width="3.2" height="9.6" rx="1.6" />
    </svg>
  )
}

export default { LearnIcon, PracticeIcon, QuestIcon, ShopIcon, ProfileIcon, HomeIcon, AboutIcon }
