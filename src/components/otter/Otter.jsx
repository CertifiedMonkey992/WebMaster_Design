/* ═══════════════════════════════════════════════════════════════════════════
   Otter.jsx — LUNX'S MASCOT
   ---------------------------------------------------------------------------
   VISUAL_SYSTEM.md and MOTION_RULES.md → Revision 15. A flat 2D character
   with a lot of small detail and no outline: a brown body shaded darker on
   the side away from the light, a lighter face mask, a cream muzzle, big
   white eyes whose lids carry the feeling, fur marks on the belly, tufts on
   the crown and cheeks, a paddle tail. It owns one prop — the field guide —
   and a layer of emotes: hearts, sparkles, notes, steam, sweat, tears, a
   bang, a question, sleep, a splash.

   Poses (switchable at run time — engine.setPose)
     stand   upright on the bottom of the drawing
     hold    standing with the field guide
     sit     sat on a ledge, legs over the front
     hang    hanging from a ledge by both paws
     climb   going up a wall, one arm reaching
     swim    in the water to the chin, paws paddling
     peek    head and paws over an edge
     float   on its back on the water

   Props: pose, mood, intensity, cue, region, idle, className. The ref is
   { play, cue, run, feel, face, book, pose, stop, can, acting, engine }.

   Decorative: aria-hidden, never focusable. A click is a Response.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { createOtter } from './engine'
import './otter.css'

/* A moving part turns about its own joint, in drawing units. Every part has
   a pose layer (CSS, per pose) around an act layer (Web Animations). */
const P = (name, x, y) => ({ 'data-p': name, style: { transformOrigin: `${x}px ${y}px` } })
const Z = (name, x, y) => ({ className: `pz pz-${name}`, style: { transformOrigin: `${x}px ${y}px` } })

const heart = (x, y, s) => `M${x} ${y + 3 * s}C${x - 6 * s} ${y - 2 * s} ${x - 3 * s} ${y - 7 * s} ${x} ${y - 4 * s}C${x + 3 * s} ${y - 7 * s} ${x + 6 * s} ${y - 2 * s} ${x} ${y + 3 * s}Z`
const star = (x, y, s) => `M${x} ${y - 6 * s}Q${x + 1.2 * s} ${y - 1.2 * s} ${x + 6 * s} ${y}Q${x + 1.2 * s} ${y + 1.2 * s} ${x} ${y + 6 * s}Q${x - 1.2 * s} ${y + 1.2 * s} ${x - 6 * s} ${y}Q${x - 1.2 * s} ${y - 1.2 * s} ${x} ${y - 6 * s}Z`
const drop = (x, y, s) => `M${x} ${y - 5 * s}C${x + 3.6 * s} ${y} ${x + 3.6 * s} ${y + 4 * s} ${x} ${y + 4 * s}S${x - 3.6 * s} ${y} ${x} ${y - 5 * s}Z`

function Emotes() {
  return (
    <g className="ot-emotes">
      <g {...P('e_hearts', 60, 20)}>
        <path className="ot-e-heart" d={heart(18, 22, 1.3)} />
        <path className="ot-e-heart" d={heart(98, 12, 1.1)} />
        <path className="ot-e-heart ot-e-soft" d={heart(84, -4, 0.8)} />
      </g>
      <g {...P('e_sparkles', 60, 30)}>
        <path className="ot-e-spark" d={star(14, 30, 1.1)} />
        <path className="ot-e-spark ot-e-alt" d={star(104, 22, 1)} />
        <path className="ot-e-spark" d={star(98, 62, 0.7)} />
        <path className="ot-e-spark ot-e-alt" d={star(24, 2, 0.75)} />
      </g>
      <g {...P('e_notes', 100, 14)} className="ot-e-note">
        <path d="M96 20.5a3.4 2.6 -20 1 1-1-4.6V3l9-2.6v13.4a3.4 2.6-20 1 1-1.1-4.5V4.9L96 7Z" />
        <path d="M110 -2a2.6 2 -20 1 1-.8-3.6V-15l2.2 1.1Z" />
      </g>
      <g {...P('e_steam', 60, 8)} className="ot-e-steam">
        <path d="M44 6c-4-5 4-7 0-12s4-7 1-11" />
        <path d="M76 6c-4-5 4-7 0-12s4-7 1-11" />
      </g>
      <g {...P('e_sweat', 96, 30)}><path className="ot-e-water" d={drop(97, 30, 1)} /></g>
      <g {...P('e_tears', 60, 48)} className="ot-e-tear">
        <path d="M41.5 48c-1.5 6-3.5 11-2.5 17" />
        <path d="M78.5 48c1.5 6 3.5 11 2.5 17" />
      </g>
      <g {...P('e_bang', 100, 8)}><text className="ot-e-mark" x="100" y="14">!</text></g>
      <g {...P('e_q', 100, 8)}><text className="ot-e-mark" x="97" y="14">?</text></g>
      <g {...P('e_z', 96, 8)} className="ot-e-z">
        <text x="94" y="14">z</text>
        <text x="103" y="4" className="ot-e-z-big">z</text>
      </g>
    </g>
  )
}

function Eyes({ uid }) {
  return (
    <g {...P('eyes', 60, 41)}>
      <g className="ot-eyes-base">
        <ellipse className="ot-white" cx="47" cy="41" rx="9" ry="10.4" />
        <ellipse className="ot-white" cx="73" cy="41" rx="9" ry="10.4" />
        <g clipPath={`url(#${uid}eyes)`}>
          <g {...P('pupils', 60, 42)}>
            <circle className="ot-pupil" cx="48.6" cy="42.6" r="4.9" />
            <circle className="ot-pupil" cx="71.4" cy="42.6" r="4.9" />
            <circle className="ot-white" cx="46.8" cy="40.4" r="1.8" />
            <circle className="ot-white" cx="69.6" cy="40.4" r="1.8" />
            <circle className="ot-white" cx="50.4" cy="45" r="0.8" />
            <circle className="ot-white" cx="73.2" cy="45" r="0.8" />
          </g>
          {/* Lids, in the mask's colour: the feeling is in their shape. */}
          <path className="ot-v ot-lid-half ot-mask" d="M36 29H58V41.5H36ZM62 29H84V41.5H62Z" />
          <path className="ot-v ot-lid-angry ot-mask" d="M36 29H58V44.5L36 34ZM62 44.5 84 34V29H62Z" />
          <path className="ot-v ot-lid-sad ot-mask" d="M36 29H58V34L36 43ZM62 29H84V43L62 34Z" />
          <path className="ot-v ot-lid-squint ot-mask" d="M36 53H58V47.5Q47 41.5 36 47.5ZM62 53H84V47.5Q73 41.5 62 47.5Z" />
        </g>
      </g>
      <path className="ot-v ot-e-happy ot-stroke-ink" d="M40.5 44.5Q47 36 53.5 44.5M66.5 44.5Q73 36 79.5 44.5" />
      <path className="ot-v ot-e-shut ot-stroke-ink" d="M39.5 42Q47 46.5 54.5 42M65.5 42Q73 46.5 80.5 42" />
      <g className="ot-v ot-e-love">
        <path className="ot-e-heart" d={heart(47, 41, 1.25)} />
        <path className="ot-e-heart" d={heart(73, 41, 1.25)} />
      </g>
      <path className="ot-v ot-e-dizzy ot-stroke-ink" d="M47 41m-5 0a5 5 0 1 0 10 0a3.6 3.6 0 1 0-7 0a2 2 0 1 0 4 0M73 41m-5 0a5 5 0 1 0 10 0a3.6 3.6 0 1 0-7 0a2 2 0 1 0 4 0" />
    </g>
  )
}

function Mouth() {
  return (
    <g {...P('mouth', 60, 59)}>
      <path className="ot-v ot-m-smile ot-stroke-ink" d="M53 58Q56.5 62 60 58.5Q63.5 62 67 58" />
      <g className="ot-v ot-m-grin">
        <path className="ot-mouth" d="M51 57.5Q60 72 69 57.5Q60 60 51 57.5Z" />
        <path className="ot-tongue" d="M55 64Q60 60.6 65 64Q60 68.4 55 64Z" />
      </g>
      <ellipse className="ot-v ot-m-o ot-mouth" cx="60" cy="61.5" rx="3.4" ry="4.4" />
      <path className="ot-v ot-m-flat ot-stroke-ink" d="M54.5 60.5H65.5" />
      <path className="ot-v ot-m-frown ot-stroke-ink" d="M53.5 63Q60 57 66.5 63" />
      <path className="ot-v ot-m-smirk ot-stroke-ink" d="M53 59.5Q61 63 67.5 56.5" />
      <g className="ot-v ot-m-tongue">
        <path className="ot-mouth" d="M52 57.5Q60 66.5 68 57.5Q60 60 52 57.5Z" />
        <path className="ot-tongue" d="M59 60.5Q67.5 60.5 68.5 67.5Q67.5 73.5 62 71Q58.5 66.5 59 60.5Z" />
      </g>
      <path className="ot-v ot-m-wobble ot-stroke-ink" d="M52 63Q55 59.5 58 63T64 63T68 61.5" />
    </g>
  )
}

function Head({ uid }) {
  return (
    <g {...Z('head', 60, 68)}>
      <g {...P('head', 60, 68)}>
        <g {...P('earL', 30, 28)}>
          <circle className="ot-fur" cx="29" cy="25" r="8.4" />
          <circle className="ot-fur-dark" cx="29.4" cy="25.6" r="4.2" />
        </g>
        <g {...P('earR', 90, 28)}>
          <circle className="ot-fur" cx="91" cy="25" r="8.4" />
          <circle className="ot-fur-dark" cx="90.6" cy="25.6" r="4.2" />
        </g>
        {/* Crown tufts and cheek fluff, then the head and its shaded side. */}
        <path className="ot-fur" d="M48 18.5Q51 6.5 56 16Q59.5 4.5 63.5 16Q68 7 71 18.5Z" />
        <path className="ot-fur" d="M27 44 17.5 47.5 25.5 51 18.5 56.5 29 57ZM93 44 102.5 47.5 94.5 51 101.5 56.5 91 57Z" />
        <path className="ot-fur" d="M60 13C81 13 96 24 97.5 41.5C99 58 87 70 60 70S21 58 22.5 41.5C24 24 39 13 60 13Z" />
        <path className="ot-fur-shade" d="M97.5 41.5C99 58 87 70 60 70C78 66 91 56 93 41C94.5 30 90 21 82 16.5C91 21 96.8 30.5 97.5 41.5Z" />
        <path className="ot-fur-light ot-soft" d="M38 19.5Q46 15 56 14.4Q44 17.5 38 25Z" />
        {/* The face: a pale mask, the muzzle, freckles where whiskers grow. */}
        <path className="ot-mask" d="M60 25.5C76.5 23.5 91.5 30 92.5 44C93.5 57.5 80.5 66.5 60 66.5S26.5 57.5 27.5 44C28.5 30 43.5 23.5 60 25.5Z" />
        <ellipse className="ot-cream" cx="60" cy="56" rx="15" ry="10" />
        <g className="ot-freckles">
          <circle cx="50" cy="55" r="0.9" /><circle cx="47.5" cy="58.4" r="0.9" /><circle cx="51" cy="60.6" r="0.9" />
          <circle cx="70" cy="55" r="0.9" /><circle cx="72.5" cy="58.4" r="0.9" /><circle cx="69" cy="60.6" r="0.9" />
        </g>
        <g {...P('e_blush', 60, 55)}>
          <ellipse className="ot-blush" cx="35" cy="55" rx="6.4" ry="3.6" />
          <ellipse className="ot-blush" cx="85" cy="55" rx="6.4" ry="3.6" />
        </g>
        <Eyes uid={uid} />
        <Mouth />
        <g {...P('nose', 60, 50)}>
          <path className="ot-nose" d="M53.2 48.6Q60 45.2 66.8 48.6Q65.8 54 60 55.2Q54.2 54 53.2 48.6Z" />
          <ellipse className="ot-white ot-shine" cx="57.4" cy="48.4" rx="2.4" ry="1.1" />
        </g>
        <g {...P('whiskers', 60, 56)} className="ot-whiskers">
          <path d="M45 56 31.5 53.5M45 59.5 32.5 61M77 56 88.5 53.5M75 59.5 87.5 61" />
        </g>
        <Emotes />
      </g>
    </g>
  )
}

function Book() {
  return (
    <g {...Z('book', 60, 101)}>
      <g {...P('book', 60, 101)} className="ot-book">
        <g transform="translate(60 100) scale(1.22) translate(-60 -100)">
          <g className="ot-b-closed">
            <rect className="ot-page" x="46.5" y="88.5" width="29" height="24" rx="2.5" />
            <rect className="ot-green" x="44" y="87" width="29" height="24" rx="2.5" />
            <path className="ot-green-deep" d="M44 89.5a2.5 2.5 0 0 1 2.5-2.5H50v24h-3.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <circle className="ot-foil-ring" cx="61" cy="96.5" r="5" />
            <path className="ot-clay" d="m61 92.6 1.9 4.4h-3.8Z" />
            <rect className="ot-clay" x="67" y="108" width="3.4" height="7.5" rx="1" />
          </g>
          <g className="ot-b-open">
            <path className="ot-green" d="M60 92Q49 86.5 38.5 89.5V111.5Q49 108.5 60 113Q71 108.5 81.5 111.5V89.5Q71 86.5 60 92Z" />
            <path className="ot-page" d="M60 92.5Q50.5 88 41.5 90.5V108.5Q50.5 106.5 60 110Q69.5 106.5 78.5 108.5V90.5Q69.5 88 60 92.5Z" />
            <path className="ot-page-lines" d="M60 92.5V110M45 95.5h10M45 99.5h10M45 103.5h7M65 95.5h10M65 99.5h10M65 103.5h8" />
          </g>
        </g>
      </g>
    </g>
  )
}

function Arm({ side }) {
  const left = side === 'L'
  const sx = left ? 40 : 80
  return (
    <g {...Z(`arm${side}`, sx, 82)}>
      <g {...P(`arm${side}`, sx, 82)}>
        <path
          className="ot-fur-shade"
          d={left
            ? 'M43.5 79.5C37 84 31.5 92 30.5 101C29.8 107 36.2 110 39.2 104.6C41.6 99 44.6 92.4 47.5 86.6Z'
            : 'M76.5 79.5C83 84 88.5 92 89.5 101C90.2 107 83.8 110 80.8 104.6C78.4 99 75.4 92.4 72.5 86.6Z'}
        />
        <ellipse className="ot-fur-dark" cx={left ? 34.5 : 85.5} cy="105.5" rx="6.6" ry="6" />
        <path className="ot-pads" d={left ? 'M31.5 108.5v1.6M34.5 109.4v1.6M37.5 108.5v1.6' : 'M82.5 108.5v1.6M85.5 109.4v1.6M88.5 108.5v1.6'} />
      </g>
    </g>
  )
}

/* Hanging arms: shoulder to a paw gripping the ledge above the head. */
function Grip({ side }) {
  const left = side === 'L'
  const sx = left ? 42 : 78
  const px = left ? 33 : 87
  return (
    <g {...Z(`grip${side}`, sx, 82)}>
      <g {...P(`grip${side}`, sx, 82)}>
        <path className="ot-limb" d={`M${sx} 84C${left ? 35 : 85} 62 ${left ? 31 : 89} 34 ${px} 12`} />
        <ellipse className="ot-fur-dark" cx={px} cy="8.5" rx="7" ry="6" />
      </g>
    </g>
  )
}

function Leg({ side }) {
  const left = side === 'L'
  const x = left ? 48 : 72
  return (
    <g {...Z(`leg${side}`, x, 120)}>
      <g {...P(`leg${side}`, x, 120)}>
        <rect className="ot-fur-shade" x={x - 8} y="113" width="16" height="26" rx="7.5" />
        <ellipse className="ot-fur-dark" cx={left ? x - 3 : x + 3} cy="140.5" rx="11.5" ry="6.2" />
        <path className="ot-toes" d={left ? `M${x - 10} 139.5v3M${x - 5} 140.5v3M${x} 139.5v3` : `M${x} 139.5v3M${x + 5} 140.5v3M${x + 10} 139.5v3`} />
      </g>
    </g>
  )
}

const Otter = forwardRef(function Otter(
  { pose = 'stand', mood = 'happy', intensity = 'full', cue = null, region, idle = true, cooldown = 6000, className = '', onReady },
  ref,
) {
  const svgRef = useRef(null)
  const eng = useRef(null)
  const uid = useId().replace(/:/g, '')
  const clicks = useRef([])
  const lastClick = useRef(null)

  useLayoutEffect(() => {
    const e = createOtter(svgRef.current, { pose, mood, intensity })
    eng.current = e
    onReady?.(e)
    return () => { e.destroy(); eng.current = null }
    // a new drawing only on mount; pose, mood and intensity change in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { eng.current?.setPose(pose) }, [pose])
  useEffect(() => { eng.current?.setMood(mood) }, [mood])
  useEffect(() => { eng.current?.setIntensity(intensity) }, [intensity])

  const cueKey = Array.isArray(cue) ? cue.join() : cue
  useEffect(() => {
    if (cue) eng.current?.cue(cue)
    // cueKey stands for `cue`, which may be a fresh array each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cueKey])

  useImperativeHandle(ref, () => ({
    play: (name) => eng.current?.play(name) ?? 0,
    cue: (names) => eng.current?.cue(names) ?? 0,
    run: (on) => eng.current?.run(on),
    feel: (name, ms) => eng.current?.feel(name, ms),
    face: (eyes, mouth) => eng.current?.face(eyes, mouth),
    book: (state) => eng.current?.setBook(state),
    pose: (name) => eng.current?.setPose(name),
    stop: () => eng.current?.stopAct(),
    can: (name) => eng.current?.can(name) ?? false,
    get acting() { return eng.current?.acting ?? null },
    get engine() { return eng.current },
  }), [])

  /* Its idle acts are Stage performances: the Stage decides when. */
  usePerformer(svgRef, {
    id: `otter:${region ?? pose}`,
    region,
    tier: 'accent',
    weight: 0.9,
    cooldown,
    share: 0.6,
    disabled: !idle || intensity === 'quiet' || intensity === 'still',
    when: () => Boolean(eng.current && !eng.current.acting && eng.current.sinceAct > 1800),
    run: async (ctx) => {
      const e = eng.current
      const name = e?.idleAct()
      const ms = name ? e.play(name) : 0
      if (!ms) return
      ctx.onStop(() => e.stopAct())
      await ctx.wait(ms)
    },
  })

  /* A boop on the nose, a feeling anywhere else; five quick clicks and it
     is dizzy. */
  const onClick = (event) => {
    const e = eng.current
    const svg = svgRef.current
    if (!e || !svg || e.acting === 'dizzy') return
    event.stopPropagation()
    const t = performance.now()
    clicks.current = clicks.current.filter((c) => t - c < 2600).concat(t)
    let act
    if (clicks.current.length >= 5 && e.can('dizzy')) { clicks.current = []; act = 'dizzy' } else {
      const ctm = svg.getScreenCTM()
      const pt = ctm ? new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse()) : { x: 0, y: 0 }
      const drop = e.pose === 'peek' || e.pose === 'swim' ? 74 : 0
      if (Math.hypot(pt.x - 60, pt.y - (50 + drop)) < 8 && e.can('boop')) act = 'boop'
      else act = e.clickAct(lastClick.current)
    }
    lastClick.current = act
    e.stopAct()
    e.play(act)
  }

  return (
    <svg
      ref={svgRef}
      className={`ot ${className}`.trim()}
      data-pose={pose}
      viewBox="0 0 120 150"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}eyes`}>
          <ellipse cx="47" cy="41" rx="9" ry="10.4" />
          <ellipse cx="73" cy="41" rx="9" ry="10.4" />
        </clipPath>
        <clipPath id={`${uid}edge`}><rect x="-200" y="-400" width="520" height="550" /></clipPath>
      </defs>

      <ellipse {...P('shadow', 60, 146)} className="ot-shadow" cx="60" cy="146" rx="30" ry="4" />
      <g
        className="ot-figure"
        onClick={onClick}
        onPointerEnter={() => eng.current?.hover(true)}
        onPointerLeave={() => eng.current?.hover(false)}
      >
        <g clipPath={`url(#${uid}edge)`}>
          <g className="ot-pose">
            <g {...P('swing', 60, 8)}>
              <g {...P('fig', 60, 146)}>
                <g {...P('spin', 60, 92)}>
                  <g {...Z('tail', 70, 122)}>
                    <g {...P('tail', 70, 122)}>
                      <path className="ot-fur-shade" d="M68 113.5C86 111.5 105 120.5 113.5 133C116 137 112 141 107 139C95 133.5 81 130 66.5 127.5Z" />
                      <path className="ot-fur-dark ot-soft" d="M104 127.5C108 129.5 111.5 131.5 113.5 133C116 137 112 141 107 139C104.5 137.8 102 136.7 99.5 135.6Z" />
                    </g>
                  </g>
                  <Leg side="L" />
                  <Leg side="R" />
                  <g {...Z('body', 60, 136)}>
                    <g {...P('body', 60, 136)}>
                      <path className="ot-fur" d="M60 63C82 63 91 84 91 104C91 124 78 136 60 136S29 124 29 104C29 84 38 63 60 63Z" />
                      <path className="ot-fur-shade" d="M91 104C91 124 78 136 60 136C74 132 84 120 84.5 104C85 89 80 75 71.5 66.5C83.5 72 91 87 91 104Z" />
                      <path className="ot-fur-light" d="M60 78C73.5 78 80 92 80 106C80 120 71.5 129 60 129S40 120 40 106C40 92 46.5 78 60 78Z" />
                      <path className="ot-marks" d="M51.5 97l3 3 3-3M62.5 97l3 3 3-3M57 106l3 3 3-3M51.5 115l3 3 3-3M62.5 115l3 3 3-3" />
                    </g>
                  </g>
                  <Grip side="L" />
                  <Grip side="R" />
                  <Head uid={uid} />
                  {/* In front of the head: a raised paw, a book in the air. */}
                  <Book />
                  <Arm side="L" />
                  <Arm side="R" />
                </g>
              </g>
            </g>
          </g>
        </g>
        <g className="ot-edgepaws">
          <g {...P('pawEL', 40, 146)}><ellipse className="ot-fur-dark" cx="40" cy="146" rx="9" ry="6.5" /></g>
          <g {...P('pawER', 80, 146)}><ellipse className="ot-fur-dark" cx="80" cy="146" rx="9" ry="6.5" /></g>
        </g>
        <g {...P('ripple', 60, 146)} className="ot-ripple">
          <path d="M6 147.5Q16 142.5 26 147.5M94 147.5Q104 142.5 114 147.5M24 150Q34 146 44 150M76 150Q86 146 96 150" />
        </g>
        <g {...P('e_splash', 60, 140)} className="ot-e-splash">
          <path className="ot-e-water" d={drop(22, 128, 0.9)} />
          <path className="ot-e-water" d={drop(98, 124, 1)} />
          <path className="ot-e-water" d={drop(36, 116, 0.7)} />
          <path className="ot-e-water" d={drop(86, 112, 0.75)} />
        </g>
      </g>
    </svg>
  )
})

export default Otter
