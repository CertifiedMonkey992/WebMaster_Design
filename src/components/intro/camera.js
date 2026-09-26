/* ═══════════════════════════════════════════════════════════════════════════
   camera.js — WHERE THE TITLE SEQUENCE MUST LAND, AND THE CAMERA THAT GETS IT
   THERE
   ---------------------------------------------------------------------------
   The sequence ends on the hero's own field guide (MOTION_RULES.md → The
   title sequence, rule 4). So its world is built at the HERO's scale, in
   viewport pixels: the intro's book stands exactly where .fg-desk stands,
   under the same perspective as .fg-lean. At the end the camera is the
   identity, and the overlay can lift off without a seam.

   For the first eleven seconds the camera is close on the open book's
   right-hand page instead, turned to face it squarely, near enough that the
   page covers the screen.

   Close-up text must be drawn at its close-up size, not enlarged: Chrome
   rasterises a layer inside a perspective at the layer's own scale, so a
   hero-sized page magnified by the camera is a blur. The world is therefore
   BUILT at close-up size — the book is laid out at hero coordinates under
   `zoom: M` (IntroScenes.jsx), which lays out and draws everything M times
   larger — and the camera shrinks it by 1/M to come to rest. Shrinking a
   crisp layer stays crisp.

   The camera is one transform on one element:

       translate3d(X) scale3d(k) rotateZ(b) rotateX(a) translate3d(−P)

   "the world point P appears at screen point X, magnified k, turned by a and
   b". Every state below is written in that one form, so a Web Animation
   between any two of them interpolates each term on its own and the move is
   a real camera move rather than a matrix blend.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The hero book's staging, from fieldGuide.css. */
export const PERSPECTIVE = 1700   /* .fg-lean perspective */
const ORIGIN_Y = 0.18             /* .fg-lean perspective-origin */
/* .fg-desk's pose: open (--fg-open 1) and closed. */
export const OPEN = { shift: 0.5, rx: 18, rz: -2 }
export const CLOSED = { rx: 36, rz: -9 }

/* Depths in the intro's book, in hero px above the desk (fieldGuide.css:
   a 2px back board, a stack of 10, the hinge axis at 7, the cover at 14).
   Page C lies on the stack. The two leaves turn about the hinge axis, each
   at its own radius, so they lie on the right just above C (7 + h), on the
   left just above the open cover's inside board (7 − h, the board raised to
   INSIDE_Z in titleSequence.css so there is room), and under the cover once
   it shuts. */
export const STACK = 10
export const HINGE_Z = 7
export const INSIDE_Z = 6.6
export const LEAF_H = { a: 6.2, b: 5.6 }
export const PAGE_Z = 2 + STACK
/* The plane the close-up camera squares up to: leaf B, where most of the
   sequence is read. Leaf A and page C are a fraction of a pixel off it. */
const CAMERA_Z = HINGE_Z + LEAF_H.b

const rad = (d) => (d * Math.PI) / 180
const rotX = ([x, y, z], d) => [x, y * Math.cos(rad(d)) - z * Math.sin(rad(d)), y * Math.sin(rad(d)) + z * Math.cos(rad(d))]
const rotZ = ([x, y, z], d) => [x * Math.cos(rad(d)) - y * Math.sin(rad(d)), x * Math.sin(rad(d)) + y * Math.cos(rad(d)), z]

/**
 * The hero, measured: its book's desk box and staging, and its heading's
 * box, in viewport pixels. Null if the hero is not in the document.
 *
 * Where the book is below the fold (the one-column hero, ≤ 1100px), the
 * intro's book lands in the space under the heading instead (`inView:
 * false`), and at the hand-off slides down toward where the hero's book
 * really is (`drop`, px).
 */
export function measureHero(doc = document) {
  const lean = doc.querySelector('.hero .fg-lean')
  const desk = doc.querySelector('.hero .fg-desk')
  const heading = doc.querySelector('.hero .hero-heading')
  if (!lean || !desk || !heading) return null

  const vw = doc.documentElement.clientWidth
  const vh = doc.documentElement.clientHeight
  /* The lean's LAYOUT box, not its rendered one: .fg-lean tilts away as the
     hero scrolls off (fieldGuide.css → --leave), and a replay can start
     before it has tilted back — but it will have by the time the overlay
     lifts. Its stage has no transform of its own. */
  const S = lean.parentElement.getBoundingClientRect()
  const L = { left: S.left + lean.offsetLeft, top: S.top + lean.offsetTop, width: lean.offsetWidth, height: lean.offsetHeight }
  const H = heading.getBoundingClientRect()
  const bw = desk.offsetWidth
  const bh = desk.offsetHeight

  let cx = L.left + desk.offsetLeft + bw / 2
  let cy = L.top + desk.offsetTop + bh / 2
  let ox = L.left + L.width / 2
  let oy = L.top + L.height * ORIGIN_Y
  /* On the screen, with room for its tilt and the ribbon under it. */
  const inView = cy - bh * 0.62 >= 0 && cy + bh * 0.62 <= vh

  /* How far below its landing place the hero's book really lies. */
  let drop = 0
  if (!inView) {
    drop = cy
    cx = vw / 2
    cy = Math.min(vh - bh * 0.62, Math.max(H.bottom + bh * 0.62, (H.bottom + vh) / 2))
    ox = cx
    oy = cy - (L.height * (0.48 - ORIGIN_Y) || bh * 0.47)
    drop -= cy
  }

  return {
    vw, vh, bw, bh, cx, cy, ox, oy, inView, drop,
    heading: { x: H.left, y: H.top, w: H.width },
    /* Which of its two hand-drawn rules the heading is showing: the Stage
       and the pointer re-ink it to the other shape now and then (Hero.jsx). */
    ink: heading.getAttribute('data-ink') === 'b' ? 'b' : 'a',
  }
}

/**
 * The close-up: how much the camera magnifies the book so its right-hand
 * page covers the screen, and the size of what is printed on that page at
 * 1:1 (the page's aspect is the book's).
 */
export function closeUp(g) {
  const pageW = Math.max(g.vw, g.vh * (g.bw / g.bh))
  return { M: pageW / g.bw, pageW, pageH: pageW * (g.bh / g.bw) }
}

/** A point on the open book's right-hand page, (u, v) from its spine-top
    corner in book pixels, at height z — in world (viewport) coordinates. */
export function pagePoint(g, u, v, z) {
  const q = rotX(rotZ([u - g.bw / 2, v - g.bh / 2, z], OPEN.rz), OPEN.rx)
  return [g.cx + g.bw * OPEN.shift + q[0], g.cy + q[1], q[2]]
}

/** The camera's transform in its one form. Written at full precision: at
    rest the scale is 1/M against world coordinates in the thousands, so
    rounding it even to four places moves the book by pixels. */
export function cameraTransform({ X, k, a, b, P }) {
  const n = (v) => +v.toPrecision(12)
  return `translate3d(${n(X[0])}px, ${n(X[1])}px, ${n(X[2])}px) scale3d(${n(k)}, ${n(k)}, ${n(k)}) rotateZ(${n(b)}deg) rotateX(${n(a)}deg) translate3d(${n(-P[0])}px, ${n(-P[1])}px, ${n(-P[2])}px)`
}

/**
 * The camera's three states, over a world built M times the hero's size.
 *
 *   rest     the hero exactly: the world shrunk by 1/M (P shown at P / M,
 *            unturned)
 *   near     close on the open book's right-hand page, squared up to it at
 *            1:1: the page's spine-top corner at the screen's top-left, the
 *            page filling the screen
 *   opening  the first frame: the same page seen low and turned, as if the
 *            camera were still rising off the desk toward it
 *
 * All three look at the same world point P — the page point that sits at
 * the centre of the screen in close-up — so turning the camera turns it
 * about the middle of the frame, never about a corner.
 */
export function cameraStates(g) {
  const { M } = closeUp(g)
  const centre = [g.vw / 2, g.vh / 2, 0]
  const hero = pagePoint(g, g.vw / 2 / M, g.vh / 2 / M, CAMERA_Z)
  const P = hero.map((v) => v * M)
  return {
    near: { X: centre, k: 1, a: -OPEN.rx, b: -OPEN.rz, P },
    opening: { X: [centre[0], centre[1] + g.vh * 0.06, 0], k: 0.84, a: -OPEN.rx + 38, b: -OPEN.rz - 7, P },
    rest: { X: hero, k: 1 / M, a: 0, b: 0, P },
  }
}

/** Blend two camera states, each term at its own progress: zoom in log
    space, so a pull-back reads as one steady retreat. The world point
    stays fixed; only where it appears, and how, changes. */
export function blendCamera(from, to, { zoom, turn, move }) {
  const lerp = (x, y, p) => x + (y - x) * p
  return {
    X: from.X.map((v, i) => lerp(v, to.X[i], move)),
    k: Math.exp(lerp(Math.log(from.k), Math.log(to.k), zoom)),
    a: lerp(from.a, to.a, turn),
    b: lerp(from.b, to.b, turn),
    P: from.P,
  }
}

/** .fg-desk's pose at a cover angle (0 shut … 180 flat open), derived the
    way fieldGuide.css derives it, so the intro's book sits exactly as the
    hero's does at every angle. */
export function deskPose(angle) {
  const open = Math.min(1, Math.max(0, (angle - 20) / 150))
  return {
    open,
    x: OPEN.shift * open,
    rx: CLOSED.rx - (CLOSED.rx - OPEN.rx) * open,
    rz: CLOSED.rz - (CLOSED.rz - OPEN.rz) * open,
  }
}
