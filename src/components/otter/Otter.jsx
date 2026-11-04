/* ═══════════════════════════════════════════════════════════════════════════
   Otter.jsx — LUNX'S MASCOT
   ---------------------------------------------------------------------------
   VISUAL_SYSTEM.md and MOTION_RULES.md → Revision 14. A game character, not
   a classroom mascot: a heavy warm outline, a dark brown body, a pale tan
   head with a cream muzzle, a big dark nose, round black eyes, scruffy
   cheeks and a flat paddle of a tail. It owns one prop — the field guide —
   which it grabs, juggles, spins, reads and drops on its own head.

   Poses
     stand   upright on the line it stands on            the lanes, the closing
     hold    upright, the field guide at its chest       hero, lanes
     peek    head and paws over an edge, the rest of     a product frame, a
             it hidden below                             lesson's answer bar

   Props
     mood        the face it returns to (acts.js → MOODS)
     intensity   full · calm · quiet · still
     cue         an act, or a list of acts, to play once it is first seen
     region      its Stage region; idle acts go through the Stage
     idle        false: never perform on its own (a lane drives it instead)
     ref         { play, cue, run, feel, face, book, stop, can, acting }

   Decorative: aria-hidden, never focusable. The pointer can play with it — a
   Response, never a control.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { createOtter } from './engine'
import './otter.css'

/* Each moving part turns about its own joint, in drawing units. */
const P = (name, x, y) => ({ 'data-p': name, style: { transformOrigin: `${x}px ${y}px` } })

function Eyes() {
  return (
    <g {...P('eyes', 60, 38)}>
      {/* open — the resting eye */}
      <g className="ot-v ot-e-open">
        <ellipse className="ot-ink" cx="46" cy="38" rx="6" ry="7.2" />
        <ellipse className="ot-ink" cx="74" cy="38" rx="6" ry="7.2" />
        <g {...P('pupils', 60, 38)}>
          <circle className="ot-glint" cx="43.8" cy="35" r="2.4" />
          <circle className="ot-glint" cx="71.8" cy="35" r="2.4" />
          <circle className="ot-glint" cx="48" cy="41" r="1" />
          <circle className="ot-glint" cx="76" cy="41" r="1" />
        </g>
      </g>
      {/* wide — something caught its eye */}
      <g className="ot-v ot-e-wide">
        <ellipse className="ot-white ot-stroke" cx="46" cy="37" rx="7.4" ry="8.4" />
        <ellipse className="ot-white ot-stroke" cx="74" cy="37" rx="7.4" ry="8.4" />
        <circle className="ot-ink" cx="46" cy="38" r="4" />
        <circle className="ot-ink" cx="74" cy="38" r="4" />
      </g>
      {/* happy — squeezed shut by a grin */}
      <path className="ot-v ot-e-happy ot-line" d="M40.5 40.5Q46 32.5 51.5 40.5M68.5 40.5Q74 32.5 79.5 40.5" />
      {/* shut — a blink, a wince */}
      <path className="ot-v ot-e-shut ot-line" d="M40.5 38.5Q46 41.5 51.5 38.5M68.5 38.5Q74 41.5 79.5 38.5" />
      {/* smug — half-lidded, up to something */}
      <g className="ot-v ot-e-smug">
        <ellipse className="ot-ink" cx="46" cy="39" rx="5.4" ry="5.2" />
        <ellipse className="ot-ink" cx="74" cy="39" rx="5.4" ry="5.2" />
        <path className="ot-head ot-line" d="M39.5 38.6Q46 33 52.5 38.6Z M67.5 38.6Q74 33 80.5 38.6Z" />
        <circle className="ot-glint" cx="44" cy="40.6" r="1.5" />
        <circle className="ot-glint" cx="72" cy="40.6" r="1.5" />
      </g>
      {/* dizzy — after five quick clicks, or a book to the head */}
      <path className="ot-v ot-e-dizzy ot-line" d="M41.5 33.5l9 9M50.5 33.5l-9 9M69.5 33.5l9 9M78.5 33.5l-9 9" />
    </g>
  )
}

function Mouth() {
  return (
    <g {...P('mouth', 60, 56)}>
      <g className="ot-v ot-m-smile">
        <path className="ot-tongue" d="M55.5 56.5Q60 63.5 64.5 56.5Z" />
        <path className="ot-line" d="M49.5 53.5Q54.5 59.5 60 55Q65.5 59.5 70.5 53.5" />
      </g>
      <g className="ot-v ot-m-grin">
        <path className="ot-mouth ot-line" d="M47.5 53.5Q60 72 72.5 53.5Q60 58.5 47.5 53.5Z" />
        <path className="ot-tongue" d="M53.5 62.8Q60 58.6 66.5 62.8Q60 68.4 53.5 62.8Z" />
      </g>
      <ellipse className="ot-v ot-m-o ot-mouth ot-line" cx="60" cy="59" rx="3.6" ry="4.6" />
      <path className="ot-v ot-m-flat ot-line" d="M53 57.5H67" />
      <path className="ot-v ot-m-frown ot-line" d="M51.5 60.5Q60 53.5 68.5 60.5" />
      <path className="ot-v ot-m-smirk ot-line" d="M50.5 56Q61 61.5 70.5 52.5" />
    </g>
  )
}

function Head() {
  return (
    <g {...P('head', 60, 68)}>
      <g {...P('earL', 30, 28)}>
        <circle className="ot-fur-deep ot-stroke" cx="29" cy="25" r="7.6" />
        <circle className="ot-ink" cx="29" cy="25.6" r="3.3" />
      </g>
      <g {...P('earR', 90, 28)}>
        <circle className="ot-fur-deep ot-stroke" cx="91" cy="25" r="7.6" />
        <circle className="ot-ink" cx="91" cy="25.6" r="3.3" />
      </g>
      {/* The head, scruffy at the cheeks and crown. */}
      <path
        className="ot-head ot-stroke"
        d="M60 13C66 13 71 14.2 75.5 16.4L79 12.5L80.5 18.2C89 23.5 94.5 31.5 95.8 40.5L101.5 43L96.6 46.4L99.8 51.5L93.4 52.8C89.5 63 77 70 60 70S30.5 63 26.6 52.8L20.2 51.5L23.4 46.4L18.5 43L24.2 40.5C25.5 31.5 31 23.5 39.5 18.2L41 12.5L44.5 16.4C49 14.2 54 13 60 13Z"
      />
      <path className="ot-line ot-line--thin" d="M55 20.5Q57.5 17.5 60 20.5Q62.5 17.5 65 20.5" />
      <g {...P('browL', 46, 28)}><path className="ot-line" d="M40 28.5Q46 24.5 52 27.5" /></g>
      <g {...P('browR', 74, 28)}><path className="ot-line" d="M68 27.5Q74 24.5 80 28.5" /></g>
      <ellipse className="ot-cream" cx="60" cy="53.5" rx="17.5" ry="11.5" />
      <Eyes />
      <Mouth />
      <g {...P('nose', 60, 47)}>
        <path className="ot-ink" d="M51.8 44.2Q60 40.4 68.2 44.2Q67 51 60 52.6Q53 51 51.8 44.2Z" />
        <ellipse className="ot-glint" cx="57" cy="44.2" rx="2.6" ry="1.2" />
      </g>
      <g {...P('whiskers', 60, 54)} className="ot-whiskers">
        <path d="M43 52.5L27.5 49M43 55.5L27 56.5M43.5 58.5L30 63M77 52.5L92.5 49M77 55.5L93 56.5M76.5 58.5L90 63" />
      </g>
    </g>
  )
}

function Book() {
  return (
    <g {...P('book', 60, 101)} className="ot-book">
      <g transform="translate(60 100) scale(1.22) translate(-60 -100)">
      <g className="ot-b-closed">
        <rect className="ot-page ot-stroke" x="46.5" y="88.5" width="29" height="24" rx="2.5" />
        <rect className="ot-green ot-stroke" x="44" y="87" width="29" height="24" rx="2.5" />
        <path className="ot-green-deep" d="M45.6 88.4h4.4v21.2h-4.4z" />
        <circle className="ot-foil-ring" cx="61" cy="96.5" r="5" />
        <path className="ot-clay" d="m61 92.6 1.9 4.4h-3.8Z" />
        <rect className="ot-clay" x="67" y="108" width="3.4" height="7.5" rx="1" />
      </g>
      <g className="ot-b-open">
        <path className="ot-green ot-stroke" d="M60 92Q49 86.5 38.5 89.5V111.5Q49 108.5 60 113Q71 108.5 81.5 111.5V89.5Q71 86.5 60 92Z" />
        <path className="ot-page ot-stroke" d="M60 92.5Q50.5 88 41.5 90.5V108.5Q50.5 106.5 60 110Q69.5 106.5 78.5 108.5V90.5Q69.5 88 60 92.5Z" />
        <path className="ot-line ot-line--thin" d="M60 92.5V110M45 95.5h10M45 99.5h10M45 103.5h7M65 95.5h10M65 99.5h10M65 103.5h8" />
      </g>
      </g>
    </g>
  )
}

function Arm({ side }) {
  const left = side === 'L'
  const sx = left ? 40 : 80
  return (
    <g {...P(`arm${side}`, sx, 82)}>
      <path
        className="ot-fur ot-stroke"
        d={left
          ? 'M43 80C37 84 31.5 92 30.5 101C29.8 107 36.2 110 39.2 104.6C41.6 99 44.6 92.4 47 87.2Z'
          : 'M77 80C83 84 88.5 92 89.5 101C90.2 107 83.8 110 80.8 104.6C78.4 99 75.4 92.4 73 87.2Z'}
      />
      <ellipse className="ot-fur-deep ot-stroke" cx={left ? 34.5 : 85.5} cy="105.5" rx="6.4" ry="5.8" />
    </g>
  )
}

function Leg({ side }) {
  const left = side === 'L'
  const x = left ? 48 : 72
  return (
    <g {...P(`leg${side}`, x, 120)}>
      <rect className="ot-fur-deep ot-stroke" x={x - 8} y="114" width="16" height="25" rx="7.5" />
      <ellipse className="ot-fur-deep ot-stroke" cx={left ? x - 3 : x + 3} cy="140.5" rx="11" ry="6" />
      <path className="ot-pads" d={left ? `M${x - 9} 140.5h2M${x - 4} 141.5h2M${x + 1} 140.5h2` : `M${x - 3} 140.5h2M${x + 2} 141.5h2M${x + 7} 140.5h2`} />
    </g>
  )
}

const Otter = forwardRef(function Otter(
  { pose = 'stand', mood = 'happy', intensity = 'full', cue = null, region, idle = true, cooldown = 6000, className = '', onReady },
  ref,
) {
  const svgRef = useRef(null)
  const eng = useRef(null)
  const clicks = useRef([])
  const lastClick = useRef(null)

  useLayoutEffect(() => {
    const e = createOtter(svgRef.current, { pose, mood, intensity })
    eng.current = e
    onReady?.(e)
    return () => { e.destroy(); eng.current = null }
    // mood and intensity change in place (below); a new pose is a new drawing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose])
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
    cue: (names) => eng.current?.cue(names),
    run: (on) => eng.current?.run(on),
    feel: (name, ms) => eng.current?.feel(name, ms),
    face: (eyes, mouth) => eng.current?.face(eyes, mouth),
    book: (state) => eng.current?.setBook(state),
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

  /* A click is a Response: a boop on the nose, a trick anywhere else, and
     five quick clicks make it dizzy. */
  const onClick = (event) => {
    const e = eng.current
    const svg = svgRef.current
    if (!e || !svg || e.acting === 'dizzy') return
    event.stopPropagation()
    const t = performance.now()
    clicks.current = clicks.current.filter((c) => t - c < 2600).concat(t)
    let act
    if (clicks.current.length >= 5) { clicks.current = []; act = 'dizzy' } else {
      const ctm = svg.getScreenCTM()
      const pt = ctm ? new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse()) : { x: 0, y: 0 }
      const drop = pose === 'peek' ? 74 : 0
      if (Math.hypot(pt.x - 60, pt.y - (47 + drop)) < 9) act = 'boop'
      else act = e.clickAct(lastClick.current)
    }
    lastClick.current = act
    e.stopAct()
    e.play(act)
  }

  return (
    <svg
      ref={svgRef}
      className={`ot ot--${pose} ${className}`.trim()}
      viewBox={pose === 'peek' ? '0 66 120 84' : '0 0 120 150'}
      aria-hidden="true"
      focusable="false"
    >
      {pose !== 'peek' && <ellipse {...P('shadow', 60, 146)} className="ot-shadow" cx="60" cy="146" rx="30" ry="4" />}
      <g
        className="ot-figure"
        onClick={onClick}
        onPointerEnter={() => eng.current?.hover(true)}
        onPointerLeave={() => eng.current?.hover(false)}
      >
        <g className="ot-pose">
          <g {...P('fig', 60, 146)}>
            <g {...P('spin', 60, 92)}>
              {pose !== 'peek' && (
                <>
                  <g {...P('tail', 70, 122)}>
                    <path className="ot-fur-deep ot-stroke" d="M68 114C86 112 105 121 113.5 133.5C116 137.5 112 141.5 107 139.5C95 134 81 130.5 66.5 128Z" />
                  </g>
                  <Leg side="L" />
                  <Leg side="R" />
                  <g {...P('body', 60, 136)}>
                    <path className="ot-fur ot-stroke" d="M60 64C82 64 91 85 91 104C91 124 78 136 60 136S29 124 29 104C29 85 38 64 60 64Z" />
                    <path className="ot-belly" d="M60 79C73.5 79 80 93 80 106C80 120 71.5 129 60 129S40 120 40 106C40 93 46.5 79 60 79Z" />
                    <path className="ot-line ot-line--thin" d="M55 112l2 3 2-3M63 119l2 3 2-3" />
                  </g>
                </>
              )}
              <Head />
              {/* In front of the head: a raised paw, a book in the air. */}
              {pose !== 'peek' && (
                <>
                  <Book />
                  <Arm side="L" />
                  <Arm side="R" />
                </>
              )}
            </g>
          </g>
        </g>
        {pose === 'peek' && (
          <>
            <g {...P('pawEL', 40, 146)}><ellipse className="ot-fur-deep ot-stroke" cx="40" cy="146" rx="9" ry="6.5" /></g>
            <g {...P('pawER', 80, 146)}><ellipse className="ot-fur-deep ot-stroke" cx="80" cy="146" rx="9" ry="6.5" /></g>
          </>
        )}
      </g>
    </svg>
  )
})

export default Otter
