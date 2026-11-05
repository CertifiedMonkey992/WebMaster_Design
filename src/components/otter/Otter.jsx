/* ═══════════════════════════════════════════════════════════════════════════
   Otter.jsx — LUNX'S MASCOT
   ---------------------------------------------------------------------------
   VISUAL_SYSTEM.md and MOTION_RULES.md → Revision 16. The otter is drawn
   from the owner's reference: a brown river otter sitting up on its
   haunches, forearms raised and paws drooping, a cream mask with zigzag
   cheek fur, a big dark nose, tilted black eyes with a glint, cream brows,
   whiskers, a pale belly, flat splayed feet and a bushy two-tone tail, cel
   shaded with a thin inked line.

   Its fur is in drawing.js (one list of shapes per part, traced from the
   reference and completed behind the parts in front of it). The face's
   features — eyes and their lids, brows, nose, mouth, whiskers — the
   field guide and the emotes are drawn here, by hand.

   Every part that moves turns about a real joint, in drawing units (the
   viewBox is 138 38 480 600): a hip, a heel, a shoulder, a wrist, the neck,
   the base of each ear and of the tail. Each part has a pose layer (CSS,
   per pose) around an act layer (Web Animations, engine.js).

   Poses (switchable at run time — engine.setPose)
     stand   sitting up on its haunches, as in the reference
     hold    the same, the field guide held to its chest
     sit     sat on a ledge, feet hanging over the front
     hang    hanging from a ledge by both paws
     climb   going up a wall, one arm reaching
     swim    in the water to the chin, paws over the edge
     peek    head and paws over an edge
     float   on its back on the water

   Props: pose, mood, intensity, cue, region, idle, className. The ref is
   { play, cue, run, feel, face, book, pose, stop, can, acting, engine }.

   Decorative: aria-hidden, never focusable. A click is a Response.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { createOtter } from './engine'
import { PARTS } from './drawing'
import './otter.css'

/* A moving part turns about its own joint, in drawing units. Every part has
   a pose layer (CSS, per pose) around an act layer (Web Animations). */
const P = (name, x, y) => ({ 'data-p': name, style: { transformOrigin: `${x}px ${y}px` } })
const Z = (name, x, y) => ({ className: `pz pz-${name}`, style: { transformOrigin: `${x}px ${y}px` } })

/* The emotes and the field guide keep the old 120 × 150 drawing's units. */
const OLD = 'translate(138 38) scale(4)'

const heart = (x, y, s) => `M${x} ${y + 3 * s}C${x - 6 * s} ${y - 2 * s} ${x - 3 * s} ${y - 7 * s} ${x} ${y - 4 * s}C${x + 3 * s} ${y - 7 * s} ${x + 6 * s} ${y - 2 * s} ${x} ${y + 3 * s}Z`
const star = (x, y, s) => `M${x} ${y - 6 * s}Q${x + 1.2 * s} ${y - 1.2 * s} ${x + 6 * s} ${y}Q${x + 1.2 * s} ${y + 1.2 * s} ${x} ${y + 6 * s}Q${x - 1.2 * s} ${y + 1.2 * s} ${x - 6 * s} ${y}Q${x - 1.2 * s} ${y - 1.2 * s} ${x} ${y - 6 * s}Z`
const drop = (x, y, s) => `M${x} ${y - 5 * s}C${x + 3.6 * s} ${y} ${x + 3.6 * s} ${y + 4 * s} ${x} ${y + 4 * s}S${x - 3.6 * s} ${y} ${x} ${y - 5 * s}Z`

/* A part's fur: [paint, path] pairs from drawing.js. */
function Fur({ part }) {
  return PARTS[part].map(([paint, d], i) => <path key={i} className={`ot-${paint}`} d={d} />)
}

function Emotes() {
  return (
    <g className="ot-emotes">
      <g {...P('e_hearts', 378, 118)}>
        <path className="ot-e-heart" d={heart(210, 126, 5.2)} />
        <path className="ot-e-heart" d={heart(530, 86, 4.4)} />
        <path className="ot-e-heart ot-e-soft" d={heart(474, 22, 3.2)} />
      </g>
      <g {...P('e_sparkles', 378, 158)}>
        <path className="ot-e-spark" d={star(194, 158, 4.4)} />
        <path className="ot-e-spark ot-e-alt" d={star(556, 126, 4)} />
        <path className="ot-e-spark" d={star(536, 286, 2.8)} />
        <path className="ot-e-spark ot-e-alt" d={star(232, 46, 3)} />
      </g>
      <g {...P('e_notes', 538, 94)} className="ot-e-note">
        <g transform={OLD}>
          <path d="M96 20.5a3.4 2.6 -20 1 1-1-4.6V3l9-2.6v13.4a3.4 2.6-20 1 1-1.1-4.5V4.9L96 7Z" />
          <path d="M110 -2a2.6 2 -20 1 1-.8-3.6V-15l2.2 1.1Z" />
        </g>
      </g>
      <g {...P('e_steam', 378, 70)} className="ot-e-steam">
        <path d="M314 76c-16-20 16-28 0-48s16-28 4-44" />
        <path d="M446 76c-16-20 16-28 0-48s16-28 4-44" />
      </g>
      <g {...P('e_sweat', 512, 120)}><path className="ot-e-water" d={drop(512, 120, 4)} /></g>
      <g {...P('e_tears', 381, 190)} className="ot-e-tear">
        <path d="M313 190c-6 22-13 40-9 64" />
        <path d="M449 190c6 22 13 40 9 64" />
      </g>
      <g {...P('e_bang', 538, 70)}><g transform={OLD}><text className="ot-e-mark" x="100" y="14">!</text></g></g>
      <g {...P('e_q', 538, 70)}><g transform={OLD}><text className="ot-e-mark" x="97" y="14">?</text></g></g>
      <g {...P('e_z', 522, 70)} className="ot-e-z">
        <g transform={OLD}>
          <text x="94" y="14">z</text>
          <text x="103" y="4" className="ot-e-z-big">z</text>
        </g>
      </g>
    </g>
  )
}

/* The eyes: tilted black ovals, tops toward the nose, a glint on the inner
   side. Lids in the fur's colour carry the feeling and the blink. */
const EYE = {
  L: { cx: 321.5, cy: 176.3, rx: 14.3, ry: 16.7, a: 20 },
  R: { cx: 440.6, cy: 176.1, rx: 14.4, ry: 16.3, a: -25 },
}
const eye = ({ cx, cy, rx, ry, a }, className) => (
  <g transform={`rotate(${a} ${cx} ${cy})`}><ellipse className={className} cx={cx} cy={cy} rx={rx} ry={ry} /></g>
)

function Eyes({ uid }) {
  return (
    <g {...P('eyes', 381, 176)}>
      <g {...P('pupils', 381, 176)}>
        <g className="ot-eyes-base">
          {eye(EYE.L, 'ot-eye')}
          {eye(EYE.R, 'ot-eye')}
          <circle className="ot-glint" cx="324" cy="170.3" r="4.2" />
          <circle className="ot-glint" cx="437.6" cy="170.4" r="3.9" />
          <path className="ot-glint-low" d="M311.6 181.5Q312 186.6 316 189.4" />
          <g clipPath={`url(#${uid}eyes)`}>
            <g {...P('lids', 381, 176)}>
              <path className="ot-lid" d="M296 118H350V159H296ZM412 118H470V159H412Z" />
              <path className="ot-lid-edge" d="M300 158.4Q321.5 162 346 158.4M416 158.4Q440.6 162 466 158.4" />
            </g>
            <path className="ot-v ot-lid-half ot-lid" d="M296 150H350V177H296ZM412 150H470V177H412Z" />
            <path className="ot-v ot-lid-angry ot-lid" d="M296 145H350V184L296 162ZM412 184L470 162V145H412Z" />
            <path className="ot-v ot-lid-sad ot-lid" d="M296 145H350V162L296 184ZM412 145H470V184L412 162Z" />
            <path className="ot-v ot-lid-squint ot-lid" d="M296 200H350V187Q321.5 175 296 187ZM412 200H470V187Q440.6 175 412 187Z" />
          </g>
        </g>
      </g>
      <path className="ot-v ot-e-happy ot-stroke" d="M308 184Q321.5 160 335 184M427 184Q440.6 160 454 184" />
      <path className="ot-v ot-e-shut ot-stroke" d="M307 176Q321.5 188 336 176M426 176Q440.6 188 455 176" />
      <g className="ot-v ot-e-love">
        <path className="ot-e-heart" d={heart(321.5, 177, 5)} />
        <path className="ot-e-heart" d={heart(440.6, 177, 5)} />
      </g>
      <path className="ot-v ot-e-dizzy ot-stroke" d="M321.5 176m-18 0a18 18 0 1 0 36 0a13 13 0 1 0-26 0a7 7 0 1 0 14 0M440.6 176m-18 0a18 18 0 1 0 36 0a13 13 0 1 0-26 0a7 7 0 1 0 14 0" />
    </g>
  )
}

/* A small round ear on each side, set behind the dome, which covers its
   inner side; it turns at its base. */
const EARS = {
  L: {
    at: [284, 150],
    rim: 'M289 128C283 121 270 120 263.5 128C258 135 258.5 148 264 156C267 160.5 270 163 272.5 163.5L292 150Z',
    hole: 'M270 133.5C275 131.5 281 133 283.6 136.6C285 139 283.2 141.6 280.4 144.2C277.2 147.2 274.6 150.6 272.4 153.4C270.4 150 268.6 145.6 268.2 141.4C268 138 268.4 135 270 133.5Z',
    edge: 'M287.5 125.5C281 121 268 121 263.4 129C258.6 137 259.4 149.4 265.8 157.4C267.8 160 270.2 162 272.6 163.6',
  },
  R: {
    at: [477, 150],
    rim: 'M471 128C477 121.5 489 121 496 127C501.6 132 503 141 500.6 149C498.6 155.4 494 159.6 489.4 161.4L468 150Z',
    hole: 'M479.6 131C485 129.5 491.6 131.4 495 136.6C497.8 141 497.4 147 495 151.6C493.4 154.6 491.4 156.8 489.6 157.6C488 153 485 148.4 482 144.4C479.4 141 477.6 137.4 478 134C478.2 132.6 478.8 131.6 479.6 131Z',
    edge: 'M474 124.2C481 120.8 491 122 497.4 128.4C502.8 134 503.6 143.6 500.8 151C499 155.6 495.6 159.2 491.6 161.2',
  },
}
function Ear({ side }) {
  const e = EARS[side]
  return (
    <g {...P(`ear${side}`, ...e.at)}>
      <path className="ot-d" d={e.rim} />
      <path className="ot-ink" d={e.hole} />
      <path className="ot-edge" d={e.edge} />
    </g>
  )
}

/* A lens of fur from (x1, y1) to (x2, y2), w wide at its middle. */
const leaf = (x1, y1, x2, y2, w) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, l = Math.hypot(x2 - x1, y2 - y1)
  const nx = (-(y2 - y1) / l) * w, ny = ((x2 - x1) / l) * w
  return `M${x1} ${y1}Q${mx + nx} ${my + ny} ${x2} ${y2}Q${mx - nx} ${my - ny} ${x1} ${y1}Z`
}

/* Cream brows, a dark stroke over each. */
function Brows() {
  return (
    <>
      <g {...P('browL', 322, 147)}>
        <path className="ot-brow" d="M308.6 154.8C311.5 147 317 142.6 323.5 142.2C329 141.9 333.4 143.5 335 146.5C334.5 150 333.2 153.4 331.4 156C327.8 151.5 322.5 149.6 317.5 150.6C313.8 151.3 310.8 153.2 308.6 154.8Z" />
        <path className="ot-brow-tip" d="M308.6 154.8C310.4 150.4 312.8 147.2 316 145.2C316.8 147 317.2 148.8 317.5 150.6C313.8 151.3 310.8 153.2 308.6 154.8Z" />
        <path className="ot-brow-line" d="M319.4 142.2C324 138.4 331.4 137.6 336.4 141.8C336.6 143 336.2 143.8 335.4 144.2C331 141.4 325.4 141 319.4 142.2Z" />
      </g>
      <g {...P('browR', 440, 147)}>
        <path className="ot-brow" d="M453.4 154.8C450.5 147 445 142.6 438.5 142.2C433 141.9 428.6 143.5 427 146.5C427.5 150 428.8 153.4 430.6 156C434.2 151.5 439.5 149.6 444.5 150.6C448.2 151.3 451.2 153.2 453.4 154.8Z" />
        <path className="ot-brow-tip" d="M453.4 154.8C451.6 150.4 449.2 147.2 446 145.2C445.2 147 444.8 148.8 444.5 150.6C448.2 151.3 451.2 153.2 453.4 154.8Z" />
        <path className="ot-brow-line" d="M442.6 142.2C438 138.4 430.6 137.6 425.6 141.8C425.4 143 425.8 143.8 426.6 144.2C431 141.4 436.6 141 442.6 142.2Z" />
      </g>
    </>
  )
}

/* The reference's mouth is a "w" under the nose, inked thick in each lobe
   and fine at the ends; the rest are its moods. */
const LIP = 'M381.5 231.5C382.2 234.3 384.6 236.9 388 238.9C394 242.4 402 245.6 410 247.3C421 249.6 435 247.4 446.4 238.6C447.6 239.3 448.6 240.3 448.6 241.4C444 245 438 248.4 428 250.4C421 251.6 413 251.6 406 250.3C398 248.8 391.5 245.8 386.4 242.6C384.6 241.4 383 240.4 381.5 240.2C380 240.4 378.4 241.4 376.6 242.6C371.5 245.8 365 248.8 357 250.3C350 251.6 342 251.6 335 250.4C325 248.4 319 245 314.4 241.4C314.4 240.3 315.4 239.3 316.6 238.6C328 247.4 342 249.6 353 247.3C361 245.6 369 242.4 375 238.9C378.4 236.9 380.8 234.3 381.5 231.5Z'

function Mouth() {
  return (
    <g {...P('mouth', 381, 242)}>
      <path className="ot-stroke ot-philtrum" d="M381.5 223.5V234" />
      <path className="ot-stroke ot-corner" d="M306.8 223Q306.6 230 309.6 235.4" />
      <path className="ot-v ot-m-smile ot-ink" d={LIP} />
      <g className="ot-v ot-m-grin">
        <path className="ot-mouth" d="M334 245.5C350 250 366 249 381.3 238C396.6 249 412.6 250 428.6 245.5C423 267 405 281 381.3 281C357.6 281 339.6 267 334 245.5Z" />
        <path className="ot-tongue" d="M352 267C362 259 372 258 381.3 263C390.6 258 400.6 259 410.6 267C402.6 276 392.6 281 381.3 281C370 281 360 276 352 267Z" />
        <path className="ot-ink" d={LIP} />
      </g>
      <g className="ot-v ot-m-o">
        <ellipse className="ot-mouth" cx="381.3" cy="252" rx="10" ry="12.5" />
        <path className="ot-tongue" d="M374 259.5Q381.3 254 388.6 259.5Q381.3 265 374 259.5Z" />
      </g>
      <path className="ot-v ot-m-flat ot-stroke" d="M344 245.5Q381.3 249.5 418.6 245.5" />
      <path className="ot-v ot-m-frown ot-stroke" d="M338 257C350 246 366 241.5 381.3 241.5C396.6 241.5 412.6 246 424.6 257" />
      <path className="ot-v ot-m-smirk ot-stroke" d="M342 246C356 250.5 370 249.5 381.3 243.5C394 244.5 412 240 427 229.5" />
      <g className="ot-v ot-m-tongue">
        <path className="ot-mouth" d="M338 245.5C354 251 368 249 381.3 239C394.6 249 408.6 251 424.6 245.5C416.6 259 402.6 265 381.3 265C360 265 346 259 338 245.5Z" />
        <path className="ot-tongue" d="M385 251C399 250 411 257 413 272C414 287 399 293 391 285C385 277 383 263 385 251Z" />
        <path className="ot-ink" d={LIP} />
      </g>
      <path className="ot-v ot-m-wobble ot-stroke" d="M340 253Q348 245 356 253T372 253T388 253T404 253T422 250" />
    </g>
  )
}

/* The nose: broad and round on top, to a soft point; a light along its top. */
function Nose() {
  return (
    <g {...P('nose', 381, 205)}>
      <path className="ot-nose" d="M381.5 186.6C394 186.6 407 188.8 411.7 196.5C414.4 201 412.7 207.4 406.6 210.5C401.6 213 397.3 213.7 394.6 216.1C391.9 218.5 389.7 221.5 386.5 223C385 223.8 383.2 224.4 381.5 224.4C379.8 224.4 378 223.8 376.5 223C373.3 221.5 371.1 218.5 368.4 216.1C365.7 213.7 361.4 213 356.4 210.5C350.3 207.4 348.6 201 351.3 196.5C356 188.8 369 186.6 381.5 186.6Z" />
      <path className="ot-nose-low" d="M368 211.4C374 207.6 389 207.6 395 211.4C391.6 214.6 388 218.6 381.5 222.4C375 218.6 371.4 214.6 368 211.4Z" />
      <path className="ot-nose-shine" d="M362.5 197.2Q380.5 195.2 398.5 197.4" />
    </g>
  )
}

/* Whiskers: pale where they cross fur, dark roots on the muzzle, freckles. */
function Whiskers() {
  return (
    <g {...P('whiskers', 381, 222)} className="ot-whiskers">
      <path className="ot-w-hair" d="M302 212Q266 214 216 237M301 222Q262 232 228 245M306 230Q285 238 266 252M307 236Q292 250 282 264M320 235Q306 250 298 264M455 207Q501 207 549 237M471 217Q501 222 523 238M451 233Q467 241 479 253M455 237Q464 249 471 263M473 235Q483 240 491 247M499 235Q517 246 529 265M509 237Q530 250 543 269M495 251Q507 266 517 285" />
      <path className="ot-w-root" d="M286 207.6Q306 206.8 325 210.6M305 218.4Q316 218 326 219.6M308 227.2Q315 226 323 226.6M434 211.2Q444 209.2 454 208.6M440 217.4Q452 217.4 466 219M441 226Q453 228 466 232" />
      <g className="ot-w-dot">
        <circle cx="330" cy="220" r="1.7" /><circle cx="330" cy="228.8" r="1.7" /><circle cx="338" cy="228.8" r="1.7" />
        <circle cx="431.3" cy="219.5" r="1.7" /><circle cx="432.5" cy="228.8" r="1.7" />
      </g>
    </g>
  )
}

function Head({ uid }) {
  return (
    <g {...Z('head', 380, 292)}>
      <g {...P('head', 380, 292)}>
        <Ear side="L" />
        <Ear side="R" />
        <Fur part="head" />
        {/* Lighter fur brushed across the crown. */}
        <path className="ot-crown" d={leaf(334, 108, 364, 100.6, 5) + leaf(332, 115.6, 361, 106.4, 2.6) + leaf(344, 118, 361, 110, 2.6) + leaf(359, 114, 376, 104, 2.6) + leaf(379, 99.6, 392, 96.8, 3)} />
        {/* The face turns over the skull, inside its outline. */}
        <g clipPath={`url(#${uid}skull)`}>
          <g {...P('look', 381, 215)}>
            <Fur part="face" />
            <g {...P('e_blush', 381, 232)}>
              <ellipse className="ot-blush" cx="298" cy="234" rx="24" ry="13" />
              <ellipse className="ot-blush" cx="464" cy="234" rx="24" ry="13" />
            </g>
          </g>
        </g>
        {/* The jaw's inked edge, either side of the chin. */}
        <path className="ot-ink" d="M267.5 260.5C277 271.5 295 281 319 287.2C318.6 288.4 317.6 289 316.4 289C306 287.2 295 283 286 277.6C278.4 273 272 267.6 267.5 260.5Z" />
        <path className="ot-ink" d="M436.4 288.5C442 284.4 456.6 281.9 464 276.5C470.8 271.5 477.1 266.8 483 260.5C485.3 258 486.9 254.2 489.7 252.2C489 256.6 487 260.6 484.6 263.6C478 271.6 470 278.6 461 283.4C452.6 287.6 442.6 290.4 436.4 288.5Z" />
        <g {...P('look', 381, 215)}>
          <path className="ot-ink" d="M345.4 286.5C352.4 289.8 359.9 290.2 367.5 291C384.2 292.8 405.1 292.8 420.6 285.5C416.4 283.7 406.3 288.5 401.5 289C390.9 290.1 379.3 291.1 368.5 290C363.7 289.5 349 285 345.4 286.5Z" />
          <Whiskers />
          <Eyes uid={uid} />
          <Brows />
          <Mouth />
          <Nose />
        </g>
        <Emotes />
      </g>
    </g>
  )
}

function Book() {
  return (
    <g {...Z('book', 378, 442)}>
      <g {...P('book', 378, 442)} className="ot-book">
        <g transform="translate(380 448) scale(4.5) translate(-60 -100)">
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

/* An arm turns at the shoulder; its paw at the wrist. */
function Arm({ side }) {
  const [sx, wx] = side === 'L' ? [258, 320] : [503, 443]
  return (
    <g {...Z(`arm${side}`, sx, 342)}>
      <g {...P(`arm${side}`, sx, 342)}>
        <Fur part={`arm${side}`} />
        <g {...Z(`paw${side}`, wx, 398)}>
          <g {...P(`paw${side}`, wx, 398)}><Fur part={`paw${side}`} /></g>
        </g>
      </g>
    </g>
  )
}

/* Hanging arms: from the shoulder up past the head to a paw over the ledge. */
const LIMB = {
  L: 'M266 352C240 292 232 214 243 152C250 114 266 92 288 76',
  R: 'M494 352C520 292 528 214 517 152C510 114 494 92 472 76',
}
function Grip({ side }) {
  const left = side === 'L'
  const sx = left ? 262 : 498
  return (
    <g {...Z(`grip${side}`, sx, 338)}>
      <g {...P(`grip${side}`, sx, 338)}>
        <path className="ot-limb-line" d={LIMB[side]} />
        <path className="ot-limb" d={LIMB[side]} />
        <g transform={left ? 'translate(-46 -372)' : 'translate(38 -372)'}><Fur part={`paw${side}`} /></g>
      </g>
    </g>
  )
}

/* A leg turns at the hip; its foot at the heel. */
function Leg({ side }) {
  const [hx, fx] = side === 'L' ? [262, 284] : [500, 478]
  return (
    <g {...Z(`leg${side}`, hx, 515)}>
      <g {...P(`leg${side}`, hx, 515)}>
        <Fur part={`leg${side}`} />
        <g {...Z(`foot${side}`, fx, 604)}>
          <g {...P(`foot${side}`, fx, 604)}><Fur part={`foot${side}`} /></g>
        </g>
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
      const drop = e.pose === 'peek' || e.pose === 'swim' ? 330 : 0
      if (Math.hypot(pt.x - 381, pt.y - (205 + drop)) < 34 && e.can('boop')) act = 'boop'
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
      viewBox="138 38 480 600"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}eyes`}>
          {eye(EYE.L)}
          {eye(EYE.R)}
        </clipPath>
        <clipPath id={`${uid}skull`}><path d={PARTS.head[0][1]} /></clipPath>
        <clipPath id={`${uid}edge`}><rect x="-700" y="-1600" width="2000" height="2238" /></clipPath>
      </defs>

      <ellipse {...P('shadow', 380, 618)} className="ot-shadow" cx="380" cy="618" rx="172" ry="14" />
      <g
        className="ot-figure"
        onClick={onClick}
        onPointerEnter={() => eng.current?.hover(true)}
        onPointerLeave={() => eng.current?.hover(false)}
      >
        <g clipPath={`url(#${uid}edge)`}>
          <g className="ot-pose">
            <g {...P('swing', 380, 60)}>
              <g {...P('fig', 380, 622)}>
                <g {...P('spin', 380, 410)}>
                  <g {...Z('tail', 232, 578)}>
                    <g {...P('tail', 232, 578)}><Fur part="tail" /></g>
                  </g>
                  <g {...Z('body', 380, 612)}>
                    <g {...P('body', 380, 612)}>
                      <Fur part="body" />
                      <path className="ot-stroke ot-navel" d="M376.2 544Q374.8 551 377.8 557M383.2 543Q385 549.5 383.4 556M391.6 545Q393 552 388.6 561" />
                      <g {...P('castL', 325, 446)}><Fur part="castL" /></g>
                      <g {...P('castR', 452, 446)}><Fur part="castR" /></g>
                    </g>
                  </g>
                  <Leg side="L" />
                  <Leg side="R" />
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
          <g {...P('pawEL', 296, 630)}><g transform="translate(-40 204)"><Fur part="pawL" /></g></g>
          <g {...P('pawER', 466, 630)}><g transform="translate(32 204)"><Fur part="pawR" /></g></g>
        </g>
        <g {...P('ripple', 380, 622)} className="ot-ripple">
          <path transform={OLD} d="M6 147.5Q16 142.5 26 147.5M94 147.5Q104 142.5 114 147.5M24 150Q34 146 44 150M76 150Q86 146 96 150" />
        </g>
        <g {...P('e_splash', 378, 598)} className="ot-e-splash">
          <path className="ot-e-water" d={drop(226, 550, 3.6)} />
          <path className="ot-e-water" d={drop(530, 534, 4)} />
          <path className="ot-e-water" d={drop(282, 502, 2.8)} />
          <path className="ot-e-water" d={drop(482, 486, 3)} />
        </g>
      </g>
    </svg>
  )
})

export default Otter
