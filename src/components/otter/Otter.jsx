/* ═══════════════════════════════════════════════════════════════════════════
   Otter.jsx — LUNX'S MASCOT
   ---------------------------------------------------------------------------
   VISUAL_SYSTEM.md and MOTION_RULES.md → Revision 13. An original drawing:
   flat fills, no outline, a darker shade for the side away from the light,
   a pale mask, cream brow marks, small low ears, webbed feet and a long
   rudder of a tail. It wears an evergreen scarf and carries the field guide.

   Poses
     hold    sitting, the field guide in both paws           home hero
     cheer   sitting with its paws free                      closing scene,
                                                             lesson complete
     perch   sat on the top edge of a card, feet dangling    the app
     peek    head and paws over an edge                      a product frame,
                                                             a lesson's answer bar

   Props
     mood        the temperament it returns to (rig.js → EMOTIONS)
     intensity   full · calm · quiet · still (engine.js → INTENSITY)
     cue         an act, or a list of acts, to play once it is first seen
     greet       the hero's hello: notices you and waves, once a session
     region      its Stage region; idle acts go through the Stage
     ref         { play(act), cue(acts), feel(emotion, ms), stop() }

   Decorative: aria-hidden, never focusable, never in the tab order. The
   pointer can still play with it — a Response, never a control.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { createOtter } from './engine'
import { CLICK_ACTS, pickAct } from './acts'
import { ART, EDGE, EYE, PEEK_DROP, VIEW } from './rig'
import './otter.css'

const GREETED = 'lunx_otter_greeted'

function Eye({ side, uid }) {
  const e = EYE[side]
  return (
    <g data-o={`eye${side}`}>
      <g clipPath={`url(#${uid}e${side})`}>
        <ellipse className="ot-white" cx={e.x} cy={e.y} rx={EYE.rx} ry={EYE.ry} />
        <g data-o={`iris${side}`}>
          <circle className="ot-iris" r="9.8" />
          <circle className="ot-ink" r="5.9" />
          <g data-o={`glint${side}`}>
            <circle className="ot-white" cx="3.3" cy="-3.6" r="3" />
            <circle className="ot-white" cx="-3.2" cy="3.5" r="1.3" />
          </g>
        </g>
      </g>
      {/* Lids are clipped a little wider than the eye, so no sliver of white
          survives at the rim when they close. */}
      <g clipPath={`url(#${uid}k${side})`}>
        <path data-o={`low${side}`} className="ot-fur" />
        <path data-o={`lowlash${side}`} className="ot-lash ot-lash--low" />
        <path data-o={`lid${side}`} className="ot-fur" />
        <path data-o={`lash${side}`} className="ot-lash" />
      </g>
    </g>
  )
}

function Paw() {
  return (
    <>
      <ellipse className="ot-fur" cx="0" cy="5" rx="9.6" ry="10.4" />
      <path className="ot-toes" d="M-4.6 11.2l-.6 3.2M0 12.6v3.4M4.6 11.2l.6 3.2" />
    </>
  )
}

function Head({ uid }) {
  return (
    <g data-o="head">
      <g data-o="earL">
        <path className="ot-fur" d={ART.earL} />
        <path className="ot-fur-deep" d={ART.earLInner} />
      </g>
      <g data-o="earR">
        <path className="ot-fur" d={ART.earR} />
        <path className="ot-fur-deep" d={ART.earRInner} />
      </g>
      <path className="ot-fur-deep" d={ART.head} />
      <path className="ot-fur" d={ART.headLit} />
      <path className="ot-sheen" d={ART.sheen} />

      <g clipPath={`url(#${uid}face)`}>
        <g data-o="face">
          <path className="ot-cream" d={ART.mask} />
          <g data-o="blush">
            <ellipse className="ot-blush" cx="69" cy="113" rx="9.5" ry="5.6" />
            <ellipse className="ot-blush" cx="171" cy="113" rx="9.5" ry="5.6" />
          </g>
          <Eye side="l" uid={uid} />
          <Eye side="r" uid={uid} />
          <path data-o="browl" className="ot-brow" />
          <path data-o="browr" className="ot-brow" />

          <g data-o="muzzle">
            <path className="ot-cream-deep" d={ART.chin} />
            <g data-o="pads">
              <ellipse className="ot-cream" cx="104.5" cy="118" rx="17.5" ry="12.5" />
              <ellipse className="ot-cream" cx="135.5" cy="118" rx="17.5" ry="12.5" />
              <g className="ot-dots">
                <circle cx="97" cy="115" r="1.5" /><circle cx="92" cy="120" r="1.5" /><circle cx="99" cy="122" r="1.5" />
                <circle cx="143" cy="115" r="1.5" /><circle cx="148" cy="120" r="1.5" /><circle cx="141" cy="122" r="1.5" />
              </g>
            </g>
            <path data-o="mouth" className="ot-mouth" />
            <g clipPath={`url(#${uid}m)`}>
              <g data-o="tongue"><circle className="ot-tongue" r="1" /></g>
            </g>
            <path data-o="lowerLip" className="ot-lip" />
            <path data-o="lips" className="ot-lip" />
            <ellipse data-o="tongueOut" className="ot-tongue" cx="122" cy="136" rx="6" ry="7" opacity="0" />
            <g data-o="nose">
              <path className="ot-ink" d={ART.nose} />
              <ellipse className="ot-white ot-shine" cx="112" cy="104" rx="4" ry="1.7" />
            </g>
          </g>
        </g>
      </g>

      {/* Whiskers stand out past the cheeks, so they sit outside the clip. */}
      <g data-o="whiskers">
        <g data-o="whiskl"><path className="ot-whisker" d={ART.whiskL} /></g>
        <g data-o="whiskr"><path className="ot-whisker" d={ART.whiskR} /></g>
      </g>
    </g>
  )
}

function Book() {
  return (
    <g data-o="book">
      <rect className="ot-page" x="-27" y="-33" width="58" height="70" rx="4" />
      <rect className="ot-green" x="-30" y="-36" width="58" height="70" rx="4" />
      <path className="ot-green-deep" d="M-26 -36h6v70h-6a4 4 0 0 1-4-4v-62a4 4 0 0 1 4-4Z" />
      <circle className="ot-foil-ring" cx="5" cy="-10" r="10.5" />
      <path className="ot-clay" d="m5 -18.5 2.8 8.5h-5.6Z" />
      <path className="ot-foil" d="m2.2 -10h5.6l-2.8 8.5Z" />
      <rect className="ot-foil" x="-10" y="10" width="30" height="3" rx="1.5" />
      <rect className="ot-foil" x="-5" y="17" width="20" height="2.5" rx="1.25" />
      <rect className="ot-clay" x="18" y="31" width="5" height="11" rx="1" />
      {/* a leaf, turned while it reads */}
      <g transform="translate(-24 -36)"><path data-o="page" className="ot-page" d="M0 0h50v66H0Z" opacity="0" /></g>
    </g>
  )
}

function Body({ pose }) {
  return (
    <>
      <path data-o="tail" className="ot-fur-deep" />
      {pose === 'perch' ? (
        <>
          <g data-o="footl">
            <path className="ot-leg" d="M101 254V282" />
            <ellipse className="ot-fur-deep" cx="101" cy="290" rx="10.5" ry="12.5" />
            <path className="ot-webs" d="M96 297v4M101 298v4M106 297v4" />
          </g>
          <g data-o="footr">
            <path className="ot-leg" d="M139 254V282" />
            <ellipse className="ot-fur-deep" cx="139" cy="290" rx="10.5" ry="12.5" />
            <path className="ot-webs" d="M134 297v4M139 298v4M144 297v4" />
          </g>
        </>
      ) : (
        <g className="ot-feet">
          <ellipse className="ot-fur-deep" cx="93" cy="270" rx="21" ry="9" transform="rotate(-6 93 270)" />
          <ellipse className="ot-fur-deep" cx="147" cy="270" rx="21" ry="9" transform="rotate(6 147 270)" />
          <path className="ot-webs" d="M84 274v4M92 275v4M100 274v4M140 274v4M148 275v4M156 274v4" />
        </g>
      )}
      <g data-o="lean">
        <g data-o="torso">
          <path className="ot-fur" d={ART.body} />
          <path className="ot-fur-deep" d={ART.bodyShade} />
          <path className="ot-cream" d={ART.belly} />
        </g>
      </g>
    </>
  )
}

function Arm({ side }) {
  return (
    <g className="ot-arm">
      <path data-o={`upper${side}`} className="ot-limb ot-limb--upper" />
      <path data-o={`fore${side}`} className="ot-limb" />
      <g data-o={`paw${side}`}><Paw /></g>
    </g>
  )
}

const Otter = forwardRef(function Otter(
  { pose = 'hold', mood = 'happy', moodWeight, intensity = 'full', cue = null, greet = false, region, cooldown = 7000, className = '' },
  ref,
) {
  const svgRef = useRef(null)
  const eng = useRef(null)
  const uid = useId().replace(/:/g, '')
  const clicks = useRef([])
  const firstHello = useRef(null)
  const lastClick = useRef(null)
  const clickAt = useRef(0)
  const [vw, vh, top] = VIEW[pose]
  const peek = pose === 'peek'

  useLayoutEffect(() => {
    const e = createOtter(svgRef.current, { pose, mood, intensity, moodWeight })
    eng.current = e
    return () => { e.destroy(); eng.current = null }
    // mood and intensity change in place (below); a new pose is a new drawing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose])
  useEffect(() => { eng.current?.setMood(mood, moodWeight) }, [mood, moodWeight])
  useEffect(() => { eng.current?.setIntensity(intensity) }, [intensity])

  /* The page's own cue, and the hero's hello — once a session, then a nod. */
  const cueKey = Array.isArray(cue) ? cue.join() : cue
  useEffect(() => {
    const e = eng.current
    if (!e) return
    if (greet) {
      /* Decided once per mount, so StrictMode's second run agrees. */
      if (firstHello.current === null) {
        firstHello.current = true
        try { firstHello.current = !sessionStorage.getItem(GREETED); sessionStorage.setItem(GREETED, '1') } catch { /* storage off: greet anyway */ }
      }
      e.cue(firstHello.current ? ['notice', 'wave'] : ['notice'])
    } else if (cue) e.cue(cue)
    // cueKey stands for `cue`, which may be a fresh array each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cueKey, greet])

  useImperativeHandle(ref, () => ({
    play: (name) => eng.current?.play(name) ?? 0,
    cue: (names) => eng.current?.cue(names),
    sequence: (names) => eng.current?.sequence(names) ?? 0,
    feel: (name, ms) => eng.current?.feel(name, ms),
    stop: () => eng.current?.stopAct(),
    can: (name) => eng.current?.can(name) ?? false,
    get acting() { return eng.current?.acting ?? null },
  }), [])

  /* Its idle acts are Stage performances: the Stage decides when. */
  usePerformer(svgRef, {
    id: `otter:${region ?? pose}`,
    region,
    tier: 'accent',
    weight: 0.9,
    cooldown,
    share: 0.6,
    disabled: intensity === 'quiet' || intensity === 'still',
    when: () => Boolean(eng.current && !eng.current.napping && !eng.current.attending && eng.current.sinceAct > 2500),
    run: async (ctx) => {
      const e = eng.current
      const name = e?.idleAct()
      const ms = name ? e.play(name) : 0
      if (!ms) return
      ctx.onStop(() => e.stopAct())
      await ctx.wait(ms)
    },
  })

  /* A click is a Response: an answer every time, chosen by where it
     landed — a boop on the nose, a tickle on the belly — and five quick
     clicks make it dizzy. */
  const onClick = (event) => {
    const e = eng.current
    const svg = svgRef.current
    if (!e || !svg) return
    const t = performance.now()
    if (e.acting === 'dizzy') return
    clicks.current = clicks.current.filter((c) => t - c < 2600).concat(t)
    /* Clicks faster than a reaction can start bounce it rather than
       replacing it, so rapid clicking builds to dizziness, not a stutter. */
    if (e.acting && t - clickAt.current < 450 && clicks.current.length < 5) { e.nudge(); return }
    clickAt.current = t
    let act
    if (clicks.current.length >= 5) {
      clicks.current = []
      act = 'dizzy'
    } else {
      const ctm = svg.getScreenCTM()
      const pt = ctm ? new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse()) : { x: 0, y: 0 }
      const drop = peek ? PEEK_DROP : 0
      if (Math.hypot(pt.x - 120, pt.y - (110 + drop)) < 20) act = 'boop'
      else if (!peek && Math.abs(pt.x - 120) < 30 && pt.y > 175 && pt.y < 258 && pose !== 'hold') act = 'giggle'
      else act = pickAct(CLICK_ACTS[pose], lastClick.current)
    }
    lastClick.current = act
    e.stopAct()
    e.play(act)
  }

  const edgeClip = peek ? `url(#${uid}edge)` : undefined

  return (
    <svg
      ref={svgRef}
      className={`ot ot--${pose} ${className}`.trim()}
      viewBox={`0 ${top} ${vw} ${vh}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}face`}><path d={ART.head} /></clipPath>
        <clipPath id={`${uid}el`}><ellipse cx={EYE.l.x} cy={EYE.l.y} rx={EYE.rx} ry={EYE.ry} /></clipPath>
        <clipPath id={`${uid}er`}><ellipse cx={EYE.r.x} cy={EYE.r.y} rx={EYE.rx} ry={EYE.ry} /></clipPath>
        <clipPath id={`${uid}kl`}><ellipse cx={EYE.l.x} cy={EYE.l.y} rx={EYE.rx + 1.4} ry={EYE.ry + 1.4} /></clipPath>
        <clipPath id={`${uid}kr`}><ellipse cx={EYE.r.x} cy={EYE.r.y} rx={EYE.rx + 1.4} ry={EYE.ry + 1.4} /></clipPath>
        <clipPath id={`${uid}m`}><path data-o="mouthClip" /></clipPath>
        {peek && <clipPath id={`${uid}edge`}><rect x="-60" y="-300" width="360" height={300 + EDGE.peek} /></clipPath>}
      </defs>

      {(pose === 'hold' || pose === 'cheer') && <ellipse data-o="shadow" className="ot-shadow" cx="120" cy="278" rx="74" ry="6.5" />}

      <g
        className="ot-figure"
        onClick={onClick}
        onPointerEnter={() => eng.current?.hover(true)}
        onPointerLeave={() => eng.current?.hover(false)}
      >
        <g clipPath={edgeClip}>
          {/* Peeking, a raised arm comes up from behind the edge, behind the head. */}
          {peek && (
            <>
              <path data-o="forel" className="ot-limb" />
              <path data-o="forer" className="ot-limb" />
            </>
          )}
          <g data-o="figure">
            <Body pose={pose} />
            <g data-o="upper">
              {pose === 'hold' && <Book />}
              <g className="ot-scarf">
                <g data-o="scarfEnds">
                  <path className="ot-green-deep" d={ART.scarfEndA} />
                  <path className="ot-green" d={ART.scarfEndB} />
                </g>
                <path className="ot-green" d={ART.scarf} />
                <path className="ot-stripe" d={ART.scarfStripe} />
                <path className="ot-green-deep" d={ART.scarfKnot} />
              </g>
              <Head uid={uid} />
              {!peek && <><Arm side="l" /><Arm side="r" /></>}
              {(pose === 'cheer' || pose === 'perch') && (
                <g data-o="pebble" transform="scale(0)">
                  <ellipse className="ot-stone" cx="0" cy="0" rx="7" ry="5.6" />
                  <ellipse className="ot-stone-light" cx="-2.2" cy="-1.8" rx="2.6" ry="1.5" />
                </g>
              )}
            </g>
          </g>
        </g>
        {peek && (
          <>
            <g data-o="pawl"><Paw /></g>
            <g data-o="pawr"><Paw /></g>
          </>
        )}
      </g>
    </svg>
  )
})

export default Otter
