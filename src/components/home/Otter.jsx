/* ═══════════════════════════════════════════════════════════════════════════
   Otter.jsx — LUNX'S MASCOT
   ---------------------------------------------------------------------------
   An original drawing (VISUAL_SYSTEM.md → Revision 12): flat fills, no
   outline, a darker shade of each hue for the side away from the light. It
   wears an evergreen scarf and carries the field guide.

   Poses
     hold    sitting, the field guide held up in both paws (the hero)
     cheer   standing, both paws up (the closing scene)
     peek    head and paws only, looking over an edge (a product frame)

   Life (MOTION_RULES.md → Revision 12)
     · its eyes follow the pointer, a few units at most          Response
     · it blinks now and then, sometimes twice                    Idle event
     · its tail sways, its scarf flutters, it breathes            Ambient
     · it waves, reads its book, hops, or ducks behind its edge   Stage accent
     · pointing at it squashes it and warms its cheeks; a click
       makes it wave at once                                      Response

   Decorative: aria-hidden, never focusable, never a control.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { pick } from '../../motion/idle'
import { prefersReducedMotion } from '../../motion/env'
import { DUR } from '../../motion/timing'

/* How long each act holds the stage. */
const ACT_MS = { wave: DUR.celebrate * 2, read: DUR.celebrate * 2, hop: DUR.celebrate, duck: DUR.celebrate * 1.5 }

/* Which acts each pose can perform, and how often. */
const ACTS = {
  hold:  [{ id: 'wave', weight: 3 }, { id: 'read', weight: 2 }],
  cheer: [{ id: 'hop', weight: 3 }, { id: 'wave', weight: 2 }],
  peek:  [{ id: 'duck', weight: 2 }, { id: 'read', weight: 1 }],
}

/* The point between the eyes, in the drawing's own units. */
const EYES = { x: 110, y: 80 }
const VIEW = { hold: [220, 262], cheer: [220, 262], peek: [220, 160] }

/* ── Life ─────────────────────────────────────────────────────────────────── */

function useOtterLife(ref, { pose, region }) {
  const last = useRef(null)

  /* Eyes and blinks run only while the otter is on screen. */
  useEffect(() => {
    const svg = ref.current
    if (!svg) return undefined
    if (prefersReducedMotion()) { svg.setAttribute('data-seen', ''); return undefined }
    let visible = false
    let raf = 0
    let blinkTimer = 0
    let px = null
    let py = null

    const aim = () => {
      raf = 0
      if (px == null) return
      const r = svg.getBoundingClientRect()
      const [vw, vh] = VIEW[pose]
      const ex = r.left + (EYES.x / vw) * r.width
      const ey = r.top + (EYES.y / vh) * r.height
      const clamp = (v) => Math.max(-1, Math.min(1, v))
      svg.style.setProperty('--lx', `${(clamp((px - ex) / 260) * 4).toFixed(2)}px`)
      svg.style.setProperty('--ly', `${(clamp((py - ey) / 220) * 3.5).toFixed(2)}px`)
    }
    const onMove = (e) => {
      px = e.clientX
      py = e.clientY
      if (visible && !raf) raf = requestAnimationFrame(aim)
    }

    const blink = (twice) => {
      svg.setAttribute('data-blink', '')
      window.setTimeout(() => svg.removeAttribute('data-blink'), DUR.press)
      if (twice) window.setTimeout(() => blink(false), DUR.press * 2.2)
    }
    const schedule = () => {
      blinkTimer = window.setTimeout(() => {
        if (visible && !document.hidden) blink(Math.random() < 0.22)
        schedule()
      }, 2600 + Math.random() * 3800)
    }

    /* data-seen: the first time it is on screen (a peeking otter pops up). */
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) svg.setAttribute('data-seen', '')
    }, { threshold: 0.4 })
    io.observe(svg)
    window.addEventListener('pointermove', onMove, { passive: true })
    schedule()
    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      clearTimeout(blinkTimer)
    }
  }, [ref, pose])

  /* Its acts are Stage accents: the Stage decides when, this decides what. */
  usePerformer(ref, {
    id: `otter:${region}`,
    region,
    tier: 'accent',
    weight: 0.9,
    cooldown: 6500,
    share: 0.7,
    run: async (ctx) => {
      const svg = ref.current
      const act = pick(ACTS[pose], last.current)
      if (!svg || !act) return
      last.current = act.id
      svg.setAttribute('data-act', act.id)
      ctx.onStop(() => svg.removeAttribute('data-act'))
      await ctx.wait(ACT_MS[act.id])
      svg.removeAttribute('data-act')
    },
  })
}

/* A click is a Response: it waves now, whatever the Stage is doing. */
function waveNow(svg) {
  if (!svg || prefersReducedMotion() || svg.getAttribute('data-act')) return
  svg.setAttribute('data-act', 'wave')
  window.setTimeout(() => svg.removeAttribute('data-act'), ACT_MS.wave)
}

/* ── The drawing ──────────────────────────────────────────────────────────── */

function Head({ uid }) {
  return (
    <g className="ot-head">
      <g className="ot-ears">
        <circle className="ot-fur" cx="41" cy="60" r="13" />
        <circle className="ot-fur-deep" cx="41" cy="60" r="6.5" />
        <circle className="ot-fur" cx="179" cy="60" r="13" />
        <circle className="ot-fur-deep" cx="179" cy="60" r="6.5" />
      </g>

      {/* The far side in shade, the face lit from the upper left. */}
      <ellipse className="ot-fur-deep" cx="110" cy="90" rx="76" ry="56" />
      <ellipse className="ot-fur" cx="105" cy="86" rx="72" ry="53" />
      <path className="ot-sheen" d="M70 44C90 34 122 33 146 41" />

      <g className="ot-muzzle">
        <ellipse className="ot-cream-deep" cx="110" cy="125" rx="23" ry="13" />
        <ellipse className="ot-cream" cx="89" cy="107" rx="27" ry="21" />
        <ellipse className="ot-cream" cx="131" cy="107" rx="27" ry="21" />
        <ellipse className="ot-cream" cx="110" cy="120" rx="23" ry="13" />
      </g>

      <ellipse className="ot-blush" cx="62" cy="104" rx="10" ry="6" />
      <ellipse className="ot-blush" cx="158" cy="104" rx="10" ry="6" />

      <path className="ot-whisker" d="M64 106 38 99M64 112 35 113M66 118 41 127M156 106l26-7M156 112l29 1M154 118l25 9" />
      <g className="ot-whiskers">
        <circle cx="82" cy="108" r="1.9" /><circle cx="76" cy="113" r="1.9" /><circle cx="85" cy="115" r="1.9" />
        <circle cx="138" cy="108" r="1.9" /><circle cx="144" cy="113" r="1.9" /><circle cx="135" cy="115" r="1.9" />
      </g>

      <defs>
        <clipPath id={`${uid}l`}><ellipse cx="80" cy="78" rx="14" ry="16.5" /></clipPath>
        <clipPath id={`${uid}r`}><ellipse cx="140" cy="78" rx="14" ry="16.5" /></clipPath>
      </defs>
      {[['l', 80], ['r', 140]].map(([side, cx]) => (
        <g key={side} className={`ot-eye ot-eye--${side}`}>
          <ellipse className="ot-white" cx={cx} cy="78" rx="14" ry="16.5" />
          <g clipPath={`url(#${uid}${side})`}>
            <g className="ot-pupil">
              <circle className="ot-ink" cx={cx + 1} cy="80" r="9" />
              <circle className="ot-white" cx={cx + 4.5} cy="75.5" r="3.4" />
            </g>
          </g>
        </g>
      ))}
      <path className="ot-brow" d="M66 55Q79 48 92 54" />
      <path className="ot-brow" d="M128 54Q141 48 154 55" />

      <path className="ot-ink" d="M100 96h20c4.5 0 6 4.5 3 7.5l-9 7.5c-2.3 2-5.7 2-8 0l-9-7.5c-3-3-1.5-7.5 3-7.5Z" />
      <ellipse className="ot-white ot-nose-shine" cx="105" cy="99" rx="3.4" ry="1.6" />

      <path className="ot-mouth ot-mouth--smile" d="M110 112v5M99 116q5.5 7 11 1 5.5 6 11-1" />
      <g className="ot-mouth--open">
        <path className="ot-ink" d="M97 115q13 21 26 0Z" />
        <ellipse className="ot-tongue" cx="110" cy="122.5" rx="6" ry="3.2" />
      </g>
    </g>
  )
}

function Scarf() {
  return (
    <g className="ot-scarf">
      <g className="ot-scarf-ends">
        <path className="ot-green-deep" d="M64 140C48 135 36 141 25 135c5 12 20 18 37 16Z" />
        <path className="ot-green" d="M62 148c-14 4-22 14-35 14 10 8 24 4 36-6Z" />
      </g>
      <path className="ot-green" d="M60 136c24 16 76 16 100 0l3 14c-25 18-81 18-106 0Z" />
      <path className="ot-stripe" d="M58 143c26 17 78 17 104 0" />
    </g>
  )
}

function Book() {
  return (
    <g className="ot-book" transform="rotate(-5 110 200)">
      <rect className="ot-page" x="83" y="167" width="60" height="72" rx="4" />
      <rect className="ot-green" x="80" y="164" width="60" height="72" rx="4" />
      <path className="ot-green-deep" d="M84 164h6v72h-6a4 4 0 0 1-4-4v-64a4 4 0 0 1 4-4Z" />
      <circle className="ot-foil-ring" cx="115" cy="192" r="11" />
      <path className="ot-clay" d="m115 183 3 9h-6Z" />
      <path className="ot-foil" d="m112 192h6l-3 9Z" />
      <rect className="ot-foil" x="100" y="212" width="30" height="3" rx="1.5" />
      <rect className="ot-foil" x="105" y="219" width="20" height="2.5" rx="1.25" />
      <rect className="ot-clay" x="128" y="234" width="5" height="11" rx="1" />
    </g>
  )
}

function Arm({ side }) {
  const d = side === 'l' ? 'M76 150Q66 178 85 200' : 'M144 150Q154 178 136 198'
  const [px, py] = side === 'l' ? [86, 200] : [136, 197]
  return (
    <g className={`ot-arm ot-arm--${side}`}>
      <path className="ot-limb" d={d} />
      <ellipse className="ot-fur" cx={px} cy={py} rx="12.5" ry="10.5" />
      <path className="ot-toes" d={`M${px - 5} ${py + 3}v3M${px} ${py + 4}v3M${px + 5} ${py + 3}v3`} />
    </g>
  )
}

function Body({ pose }) {
  return (
    <>
      <path className="ot-fur-deep ot-tail" d="M144 230c32 8 62-4 70-36 4-15-7-21-13-8-8 19-28 29-55 26Z" />
      <g className="ot-torso">
        <path className="ot-fur" d="M110 124c36 0 52 40 50 74-2 32-22 50-50 50s-48-18-50-50c-2-34 14-74 50-74Z" />
        <ellipse className="ot-cream" cx="110" cy="204" rx="32" ry="40" />
      </g>
      <ellipse className="ot-fur-deep" cx="87" cy="248" rx="20" ry="9.5" />
      <ellipse className="ot-fur-deep" cx="133" cy="248" rx="20" ry="9.5" />
      <path className="ot-webs" d="M80 251v4M87 252v4M94 251v4M126 251v4M133 252v4M140 251v4" />
      {pose === 'hold' && <Book />}
    </>
  )
}

export default function Otter({ pose = 'hold', region, className = '' }) {
  const ref = useRef(null)
  const uid = useId().replace(/:/g, '')
  useOtterLife(ref, { pose, region: region ?? `otter-${pose}` })
  const [vw, vh] = VIEW[pose]

  return (
    <svg
      ref={ref}
      className={`ot ot--${pose} ${className}`.trim()}
      viewBox={`0 0 ${vw} ${vh}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}edge`}><rect x="0" y="0" width="220" height="140" /></clipPath>
      </defs>
      <g className="ot-figure" onClick={() => waveNow(ref.current)}>
        {pose === 'peek' ? (
          <>
            <g clipPath={`url(#${uid}edge)`}><Head uid={uid} /></g>
            <g className="ot-paws">
              <ellipse className="ot-fur" cx="66" cy="141" rx="17" ry="11" />
              <path className="ot-toes" d="M59 141v4M66 142v4M73 141v4" />
              <ellipse className="ot-fur" cx="154" cy="141" rx="17" ry="11" />
              <path className="ot-toes" d="M147 141v4M154 142v4M161 141v4" />
            </g>
          </>
        ) : (
          <>
            <Body pose={pose} />
            <Arm side="l" />
            <Arm side="r" />
            <Scarf />
            <Head uid={uid} />
          </>
        )}
      </g>
    </svg>
  )
}
