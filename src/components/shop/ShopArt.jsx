/* ═══════════════════════════════════════════════════════════════════════════
   ShopArt.jsx — 2.5D ITEM ILLUSTRATIONS
   ---------------------------------------------------------------------------
   Same depth language as the rest of the light theme: a soft elliptical
   contact shadow on the ground, one extruded "side" face offset below the
   subject, a two-stop gradient on the front face and a single rim highlight
   along the top-left. No outlines, no stock art, no photographic shading —
   just enough dimension to read as an object sitting on the card.

   Gradient ids are namespaced with useId because the shop renders an item's
   art twice (card + confirmation dialog), and duplicate <defs> ids would make
   both instances resolve to whichever mounted last.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId } from 'react'

const HEART_PATH =
  'M50 88C50 88 8 60 8 34 8 18 20 8 32 8c8 0 15 4 18 11 3-7 10-11 18-11 12 0 24 10 24 26 0 26-42 54-42 54Z'

const SHIELD_PATH = 'M50 5 88 19v33c0 22-16 37-38 45-22-8-38-23-38-45V19Z'

const FLAME_PATH =
  'M54 24c1 11-3 18-9 24-7 7-16 13-18 24-3 15 5 29 20 34 16 5 33-6 35-22 2-13-4-21-12-28-1 5-4 8-7 10 2-15-2-29-9-42Z'

/** Soft ground contact shadow every item shares. */
function Ground({ cy = 104, rx = 34, ry = 7, id }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#0F2A3F" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0F2A3F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  )
}

/* ── Refill Hearts: a glass canister of hearts, lid off, brimming ─────────── */
function HeartRefill({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={36} />

      {/* Glow behind the vessel */}
      <circle cx="60" cy="56" r="34" fill="#F43F5E" opacity="0.1" />

      {/* Hearts floating out of the top, back-most first so they overlap right */}
      <g transform="translate(24 -4) scale(0.3)">
        <path d={HEART_PATH} fill="#FDA4AF" opacity="0.85" />
      </g>
      <g transform="translate(74 4) scale(0.24)">
        <path d={HEART_PATH} fill="#FB7185" opacity="0.7" />
      </g>

      {/* Canister — back wall, then contents, then front glass */}
      <path d="M30 44h60v34a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14Z" fill="#E7ECF3" />
      <path d="M30 44h60v34a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14Z" fill={`url(#${uid}-glass)`} />

      {/* The hearts held inside */}
      <g transform="translate(34 40) scale(0.34)">
        <path d={HEART_PATH} fill={`url(#${uid}-h1)`} />
      </g>
      <g transform="translate(62 46) scale(0.28)">
        <path d={HEART_PATH} fill="#F43F5E" />
      </g>
      <g transform="translate(48 62) scale(0.24)">
        <path d={HEART_PATH} fill="#E11D48" opacity="0.9" />
      </g>

      {/* Front glass sheen over the contents */}
      <path d="M30 44h60v34a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14Z" fill="#FFFFFF" opacity="0.28" />
      <path d="M37 50h9v38a10 10 0 0 1-9-9Z" fill="#FFFFFF" opacity="0.55" />

      {/* Rim: the open mouth of the canister, drawn as a squashed ellipse */}
      <ellipse cx="60" cy="44" rx="30" ry="7.5" fill="#CBD5E1" />
      <ellipse cx="60" cy="42.5" rx="30" ry="7.5" fill={`url(#${uid}-rim)`} />
      <ellipse cx="60" cy="43" rx="23" ry="5" fill="#0F2A3F" opacity="0.14" />

      <defs>
        <linearGradient id={`${uid}-glass`} x1="30" y1="44" x2="90" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uid}-h1`} x1="8" y1="8" x2="92" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="30" y1="35" x2="90" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
    </>
  )
}

/* ── +1 Heart: one extruded heart with a plus badge ──────────────────────── */
function SingleHeart({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={30} />
      <circle cx="60" cy="54" r="32" fill="#F43F5E" opacity="0.1" />

      <g transform="translate(12 8) scale(0.82)">
        {/* Extruded side face, offset down to fake thickness */}
        <g transform="translate(0 9)">
          <path d={HEART_PATH} fill="#9F1239" />
        </g>
        {/* Front face */}
        <path d={HEART_PATH} fill={`url(#${uid}-face)`} />
        {/* Specular highlight along the top-left lobe */}
        <path
          d="M22 20c-5 3-8 9-8 15 0 3 .6 6 1.7 8.6"
          fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="7" strokeLinecap="round"
        />
      </g>

      {/* +1 badge */}
      <circle cx="88" cy="30" r="15" fill="#0F2A3F" opacity="0.16" />
      <circle cx="88" cy="28" r="15" fill={`url(#${uid}-badge)`} />
      <path d="M88 21v14M81 28h14" stroke="#05303A" strokeWidth="3.4" strokeLinecap="round" fill="none" />

      <defs>
        <linearGradient id={`${uid}-face`} x1="8" y1="8" x2="92" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
        <linearGradient id={`${uid}-badge`} x1="73" y1="13" x2="103" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </>
  )
}

/* ── Streak Shield: a dimensional shield wrapped around a flame ───────────── */
function StreakShield({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={32} />
      <circle cx="60" cy="54" r="33" fill="#06B6D4" opacity="0.1" />

      <g transform="translate(12 6) scale(0.8)">
        {/* Extruded edge */}
        <g transform="translate(0 10)">
          <path d={SHIELD_PATH} fill="#075E6B" />
        </g>
        {/* Front plate */}
        <path d={SHIELD_PATH} fill={`url(#${uid}-plate)`} />
        {/* Inner bevel so the flame sits in a recess rather than on a flat slab */}
        <path d="M50 15 78 25v27c0 17-12 29-28 35-16-6-28-18-28-35V25Z" fill="#05303A" opacity="0.16" />

        {/* Flame */}
        <g transform="translate(26 24) scale(0.5)">
          <path d={FLAME_PATH} fill={`url(#${uid}-flame)`} />
          <path
            d="M52 62c1 7-2 11-6 15-3 3-6 7-6 12 0 8 7 14 15 14s16-6 16-14c0-7-4-11-9-15-1 3-2 5-4 6 1-6-2-12-6-18Z"
            fill="#FEF3C7" opacity="0.85"
          />
        </g>

        {/* Rim light down the top-left edge */}
        <path
          d="M50 8 16 20v14"
          fill="none" stroke="#A5F3FC" strokeOpacity="0.75" strokeWidth="5" strokeLinecap="round"
        />
      </g>

      <defs>
        <linearGradient id={`${uid}-plate`} x1="12" y1="5" x2="88" y2="97" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891A8" />
        </linearGradient>
        <linearGradient id={`${uid}-flame`} x1="27" y1="24" x2="80" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </>
  )
}

/* ── Gem stack — used for the balance header ─────────────────────────────── */
function GemStack({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={30} cy={100} />
      <circle cx="60" cy="56" r="30" fill="#F59E0B" opacity="0.14" />

      {/* Two small gems resting behind */}
      <g transform="translate(20 58) scale(0.32)">
        <path d="M22 6h56l22 26-50 62L0 32Z" fill="#FBBF24" />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.32" />
      </g>
      <g transform="translate(74 62) scale(0.28)">
        <path d="M22 6h56l22 26-50 62L0 32Z" fill="#D97706" />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.22" />
      </g>

      {/* Hero gem in front */}
      <g transform="translate(31 22) scale(0.58)">
        <path d="M22 6h56l22 26-50 62L0 32Z" fill={`url(#${uid}-gem)`} />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.34" />
        <g stroke="#7C2D12" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinejoin="round">
          <path d="M0 32h100M8 32l42 62 42-62M38 6 30 32M62 6l8 26" />
        </g>
        <path d="M30 40 50 88" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>

      <defs>
        <linearGradient id={`${uid}-gem`} x1="0" y1="6" x2="100" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </>
  )
}

const ART = {
  heartRefill: HeartRefill,
  singleHeart: SingleHeart,
  streakShield: StreakShield,
  gemStack: GemStack,
}

export default function ShopArt({ name, size = 108, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const Art = ART[name]
  if (!Art) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <Art uid={uid} />
    </svg>
  )
}
