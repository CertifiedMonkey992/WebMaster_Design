/* ═══════════════════════════════════════════════════════════════════════════
   DailyBonusArt.jsx — 2.5D REWARD ILLUSTRATIONS
   ---------------------------------------------------------------------------
   Same depth language as ShopArt: a soft elliptical contact shadow, one
   extruded side face offset below the subject, a two-stop gradient on the
   front face and a single rim highlight along the top-left.

   Gradient ids are namespaced with useId because a reward appears twice on
   screen at once (the hero panel and its card in the track), and duplicate
   <defs> ids would make both resolve to whichever mounted last.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId } from 'react'

const HEART_PATH =
  'M50 88C50 88 8 60 8 34 8 18 20 8 32 8c8 0 15 4 18 11 3-7 10-11 18-11 12 0 24 10 24 26 0 26-42 54-42 54Z'

const SHIELD_PATH = 'M50 5 88 19v33c0 22-16 37-38 45-22-8-38-23-38-45V19Z'

const GEM_PATH = 'M22 6h56l22 26-50 62L0 32Z'

const BOLT_PATH = 'M58 4 20 58h26l-6 42 40-56H52l6-40Z'

function Ground({ id, cy = 104, rx = 32, ry = 7 }) {
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

/* ── Gems: three crystals, the hero one raised in front ───────────────────── */
function Gems({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={31} />
      <circle cx="60" cy="55" r="31" fill="#F59E0B" opacity="0.13" />

      <g transform="translate(19 57) scale(0.31)">
        <path d={GEM_PATH} fill="#FBBF24" />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.32" />
      </g>
      <g transform="translate(75 61) scale(0.27)">
        <path d={GEM_PATH} fill="#D97706" />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.22" />
      </g>

      <g transform="translate(31 21) scale(0.57)">
        <g transform="translate(0 9)">
          <path d={GEM_PATH} fill="#B45309" opacity="0.55" />
        </g>
        <path d={GEM_PATH} fill={`url(#${uid}-gem)`} />
        <path d="M22 6h56l14 26H8Z" fill="#FFFFFF" opacity="0.34" />
        <g stroke="#7C2D12" strokeOpacity="0.24" strokeWidth="3" fill="none" strokeLinejoin="round">
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

/* ── XP: an extruded bolt on a turquoise disc ─────────────────────────────── */
function Xp({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={30} />
      <circle cx="60" cy="54" r="32" fill="#06B6D4" opacity="0.12" />

      {/* Disc the bolt stands on, drawn as a squashed cylinder */}
      <ellipse cx="60" cy="82" rx="27" ry="9" fill="#0891A8" opacity="0.3" />
      <ellipse cx="60" cy="78" rx="27" ry="9" fill={`url(#${uid}-disc)`} />

      <g transform="translate(29 12) scale(0.62)">
        <g transform="translate(0 10)">
          <path d={BOLT_PATH} fill="#B45309" />
        </g>
        <path d={BOLT_PATH} fill={`url(#${uid}-bolt)`} />
        <path
          d="M52 14 26 52"
          fill="none" stroke="#FEF3C7" strokeOpacity="0.75" strokeWidth="6" strokeLinecap="round"
        />
      </g>

      <defs>
        <linearGradient id={`${uid}-bolt`} x1="20" y1="4" x2="86" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${uid}-disc`} x1="33" y1="69" x2="87" y2="87" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </>
  )
}

/* ── Hearts: a pair, the front one extruded ──────────────────────────────── */
function Hearts({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={30} />
      <circle cx="60" cy="54" r="32" fill="#F43F5E" opacity="0.11" />

      {/* Companion heart tucked behind on the right */}
      <g transform="translate(58 22) scale(0.42)">
        <path d={HEART_PATH} fill="#FDA4AF" />
        <path d={HEART_PATH} fill="#FB7185" opacity="0.6" />
      </g>

      <g transform="translate(14 20) scale(0.66)">
        <g transform="translate(0 10)">
          <path d={HEART_PATH} fill="#9F1239" />
        </g>
        <path d={HEART_PATH} fill={`url(#${uid}-face)`} />
        <path
          d="M22 20c-5 3-8 9-8 15 0 3 .6 6 1.7 8.6"
          fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="7" strokeLinecap="round"
        />
      </g>

      <defs>
        <linearGradient id={`${uid}-face`} x1="8" y1="8" x2="92" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
    </>
  )
}

/* ── Streak Shield: a dimensional shield around a flame ───────────────────── */
function Shield({ uid }) {
  const FLAME_PATH =
    'M54 24c1 11-3 18-9 24-7 7-16 13-18 24-3 15 5 29 20 34 16 5 33-6 35-22 2-13-4-21-12-28-1 5-4 8-7 10 2-15-2-29-9-42Z'
  return (
    <>
      <Ground id={`${uid}-g`} rx={32} />
      <circle cx="60" cy="54" r="33" fill="#06B6D4" opacity="0.12" />

      <g transform="translate(12 6) scale(0.8)">
        <g transform="translate(0 10)">
          <path d={SHIELD_PATH} fill="#075E6B" />
        </g>
        <path d={SHIELD_PATH} fill={`url(#${uid}-plate)`} />
        <path d="M50 15 78 25v27c0 17-12 29-28 35-16-6-28-18-28-35V25Z" fill="#05303A" opacity="0.16" />

        <g transform="translate(26 24) scale(0.5)">
          <path d={FLAME_PATH} fill={`url(#${uid}-flame)`} />
          <path
            d="M52 62c1 7-2 11-6 15-3 3-6 7-6 12 0 8 7 14 15 14s16-6 16-14c0-7-4-11-9-15-1 3-2 5-4 6 1-6-2-12-6-18Z"
            fill="#FEF3C7" opacity="0.85"
          />
        </g>

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

/* ── Gift: the panel's header mark ───────────────────────────────────────── */
function Gift({ uid }) {
  return (
    <>
      <Ground id={`${uid}-g`} rx={33} />
      <circle cx="60" cy="54" r="34" fill="#06B6D4" opacity="0.12" />

      {/* Box body: front face plus a darker right side for depth */}
      <path d="M26 52h68v34a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8Z" fill={`url(#${uid}-body)`} />
      <path d="M78 52h16v34a8 8 0 0 1-8 8h-8Z" fill="#05303A" opacity="0.16" />

      {/* Lid, sitting slightly proud of the body */}
      <path d="M20 36h80v18H20Z" fill={`url(#${uid}-lid)`} />
      <path d="M84 36h16v18H84Z" fill="#05303A" opacity="0.14" />

      {/* Ribbon down the front and across the lid */}
      <path d="M53 36h14v58H53Z" fill="#F59E0B" />
      <path d="M53 36h14v18H53Z" fill="#FCD34D" />

      {/* Bow */}
      <path d="M60 36c-8 0-16-3-16-9s7-7 11-3 5 8 5 12Z" fill="#FBBF24" />
      <path d="M60 36c8 0 16-3 16-9s-7-7-11-3-5 8-5 12Z" fill="#F59E0B" />
      <circle cx="60" cy="33" r="4.5" fill="#FCD34D" />

      {/* Rim light along the top-left edge of the lid */}
      <path d="M22 38h24" stroke="#A5F3FC" strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" fill="none" />

      <defs>
        <linearGradient id={`${uid}-lid`} x1="20" y1="36" x2="100" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891A8" />
        </linearGradient>
        <linearGradient id={`${uid}-body`} x1="26" y1="52" x2="94" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#075E6B" />
        </linearGradient>
      </defs>
    </>
  )
}

const ART = { gems: Gems, xp: Xp, hearts: Hearts, shield: Shield, gift: Gift }

export default function DailyBonusArt({ name, size = 96, className = '' }) {
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
