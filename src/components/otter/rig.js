/* ═══════════════════════════════════════════════════════════════════════════
   rig.js — THE OTTER'S SKELETON
   ---------------------------------------------------------------------------
   VISUAL_SYSTEM.md → Revision 13. The drawing is a rig, not a picture: every
   part that carries expression is rebuilt each frame from a handful of
   numbers, so a face can sit anywhere between two emotions and move
   between them continuously.

     brows      cream fur marks above the eyes — raise, and tilt at the
                inner end (worried ↔ determined)
     lids       an upper lid per eye (closure, slant) and a shared lower
                lid that pushes the eye into a smile
     eyes       a dark iris that follows a gaze, two catchlights that lag
                it, a size (surprise shrinks it, delight opens it)
     mouth      one path from smile, open, width and skew — a frown, a
                smirk, an "o" and a laugh are the same four numbers
     arms       two bones each, solved to a paw target (inverse kinematics)
     tail       a six-joint chain, drawn as a tapering outline

   Everything here is pure: numbers in, path strings out. engine.js owns
   time; Otter.jsx owns the DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Proportions (viewBox units) ──────────────────────────────────────────── */

/* [width, height, top]: the perch's box starts just above its ears, so the
   app's narrow column spends no height on empty air. */
export const VIEW = {
  hold:  [240, 284, 0],
  cheer: [240, 284, 0],
  perch: [240, 278, 30],
  peek:  [240, 176, 0],
}

export const GROUND = 278
/* perch: the top of the card it sits on; peek: the frame edge it hides
   behind. */
export const EDGE = { perch: 268, peek: 156 }
/* A peeking otter is the same otter, lowered behind its edge. */
export const PEEK_DROP = 14

export const EYE = { l: { x: 93, y: 84 }, r: { x: 147, y: 84 }, rx: 11.2, ry: 12.6 }
const BROW = { l: { x: 91, y: 62 }, r: { x: 149, y: 62 } }
export const MOUTH = { x: 120, y: 125 }
export const NECK = { x: 120, y: 146 }
export const COM = { x: 120, y: 196 }          // centre of mass: spins turn here
export const SHOULDER = { l: { x: 80, y: 170 }, r: { x: 160, y: 170 } }
const ARM = { upper: 25, fore: 24 }
export const TAIL_BASE = { x: 152, y: 254 }

/* Paw targets for the free-pawed poses. The hold pose keeps its paws on the
   book unless an act takes one away. */
export const ARMS = {
  book:  { l: [96, 210],  r: [145, 205] },
  chest: { l: [111, 194], r: [129, 194] },
  up:    { l: [50, 130],  r: [190, 130] },   // beside the head: the arms are short
  tada:  { l: [38, 150],  r: [202, 150] },
  hips:  { l: [74, 212],  r: [166, 212] },
  low:   { l: [106, 214], r: [134, 214] },
  chin:  { l: [111, 196], r: [131, 146] },
  fists: { l: [98, 184],  r: [142, 184] },
  shrug: { l: [64, 178],  r: [176, 178] },
  /* peek: paws over the frame edge */
  edge:  { l: [70, 156],  r: [170, 156] },
}

/* ── Static artwork ───────────────────────────────────────────────────────── */

export const ART = {
  head: 'M120 42C149 42 171 48 182 66C191 80 195 98 191 114C185 136 157 146 120 146C83 146 55 136 49 114C45 98 49 80 58 66C69 48 91 42 120 42Z',
  /* the lit side: the same head nudged up and left over the shade */
  headLit: 'M117 42C145 41 166 47 176 64C184 78 187 95 183 110C177 131 151 141 116 141C81 141 55 131 50 111C46 96 50 79 59 64C69 47 90 42 117 42Z',
  sheen: 'M74 55C94 46 128 45 152 51',
  /* the pale mask: muzzle, cheeks and a low peak at the bridge of the nose */
  mask: 'M50 114C58 104 76 99 94 101C106 102 113 99 120 94C127 99 134 102 146 101C164 99 182 104 190 114C190 132 162 145 120 145C78 145 50 132 50 114Z',
  chin: 'M102 134C108 141 132 141 138 134C134 144 106 144 102 134Z',
  nose: 'M107 101H133C138.5 101 140.5 106.5 137 109.5L124.6 117C122 118.8 118 118.8 115.4 117L103 109.5C99.5 106.5 101.5 101 107 101Z',
  earL: 'M47 80C41 66 46 54 57 52C66 51 72 58 72 66Z',
  earLInner: 'M52 72C50 64 53 58 58 58C63 58 66 62 66 66Z',
  earR: 'M193 80C199 66 194 54 183 52C174 51 168 58 168 66Z',
  earRInner: 'M188 72C190 64 187 58 182 58C177 58 174 62 174 66Z',
  whiskL: 'M92 115C82 112 72 111 61 111M92 120C81 120 71 122 60 125M93 125C84 128 75 132 67 137',
  whiskR: 'M148 115C158 112 168 111 179 111M148 120C159 120 169 122 180 125M147 125C156 128 165 132 173 137',

  body: 'M76 126C70 152 62 184 62 214C62 248 86 272 120 272C154 272 178 248 178 214C178 184 170 152 164 126Z',
  bodyShade: 'M164 126C170 152 178 184 178 214C178 248 154 272 120 272C148 264 163 244 164 213C165 182 159 152 151 126Z',
  belly: 'M120 148C141 148 153 168 155 196C157 231 145 260 120 262C95 260 83 231 85 196C87 168 99 148 120 148Z',

  scarf: 'M72 134C94 152 146 152 168 134L172 148C146 170 94 170 68 148Z',
  scarfStripe: 'M70 141C94 160 146 160 170 141',
  scarfEndA: 'M80 150C66 154 57 166 50 180L61 184C66 172 74 163 86 157Z',
  scarfEndB: 'M84 153C77 166 75 180 77 193L88 191C86 178 87 166 91 157Z',
  scarfKnot: 'M77 146C83 141 92 144 93 151C94 158 86 162 80 159C75 156 73 150 77 146Z',
}

/* ── Path builders ────────────────────────────────────────────────────────── */

const f = (n) => Math.round(n * 100) / 100
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/** A brow mark: a lens of cream fur. raise: px up. tilt: degrees, + lifts
    the inner end (worry), − drops it (resolve). arch: px of extra curve. */
export function browPath(side, raise, tilt, arch = 0) {
  const c = BROW[side]
  const s = side === 'l' ? 1 : -1                       // +x points to the centre for the left brow
  const a = ((side === 'l' ? -tilt : tilt) * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const cy = c.y - raise
  const P = (lx, ly) => `${f(c.x + lx * cos - ly * sin)} ${f(cy + lx * sin + ly * cos)}`
  const half = 12.5
  const lift = -7 - arch
  return `M${P(-half * s, 2)}Q${P(-1 * s, lift - 5.5)} ${P(half * s, 0.5)}Q${P(-1 * s, lift + 4.5)} ${P(-half * s, 2)}Z`
}

/** Upper lid. close: 0 open … 1 shut. slant: + drops the inner corner.
    Shut, it meets the lower lid a little below the middle of the eye, so a
    closed eye is a clear curved line across its full width. */
export function upperLid(side, close, slant) {
  const e = EYE[side]
  const rx = EYE.rx + 2
  const inner = side === 'l' ? 1 : -1
  const yTop = e.y - EYE.ry - 4
  const y = e.y - EYE.ry + clamp(close, 0, 1.05) * EYE.ry * 1.48
  const yIn = y + slant * 7
  const yOut = y - slant * 7
  const sag = 4.5 * (1 - clamp(close, 0, 1)) + 2.5
  const xIn = e.x + inner * rx
  const xOut = e.x - inner * rx
  const edge = `${f(xIn)} ${f(yIn)}Q${f(e.x)} ${f(y + sag)} ${f(xOut)} ${f(yOut)}`
  return {
    lid: `M${f(xOut)} ${f(yTop)}L${f(xIn)} ${f(yTop)}L${edge}Z`,
    lash: `M${edge}`,
  }
}

/** Lower lid. raise: 0 … 1 — a smile pushing up from below. */
export function lowerLid(side, raise) {
  const e = EYE[side]
  const rx = EYE.rx + 2
  const yBot = e.y + EYE.ry + 4
  const y = e.y + EYE.ry - clamp(raise, 0, 1.1) * EYE.ry * 1.3
  const bulge = 2 + raise * 8
  const edge = `${f(e.x + rx)} ${f(y + 2)}Q${f(e.x)} ${f(y - bulge)} ${f(e.x - rx)} ${f(y + 2)}`
  return {
    lid: `M${f(e.x - rx)} ${f(yBot)}L${f(e.x + rx)} ${f(yBot)}L${edge}Z`,
    lash: `M${edge}`,
  }
}

/** The mouth: lips (a stroke) and the opening (a fill) from four numbers.
    smile −1 … 1, open 0 … 1, width ×, skew −1 … 1 (+ lifts the right corner). */
export function mouthPath(smile, open, width, skew) {
  const { x, y } = MOUTH
  const W = 10.5 * width * (1 + 0.14 * Math.max(0, smile))
  const lift = smile * 5
  const yL = y - lift + skew * 3.2
  const yR = y - lift - skew * 3.2
  const xL = x - W + skew * 1.2
  const xR = x + W + skew * 1.2
  const lobe = y + 3.4 + Math.max(0, smile) * 1.4 - Math.max(0, -smile) * 1.8
  const upper = `M${f(xL)} ${f(yL)}Q${f(x - W * 0.48)} ${f(lobe)} ${f(x)} ${f(y)}Q${f(x + W * 0.48)} ${f(lobe)} ${f(xR)} ${f(yR)}`
  const depth = 1.5 + clamp(open, 0, 1.2) * 17
  const low = Math.max(yL, yR, lobe) + depth
  const lower = `C${f(x + W * 0.9)} ${f(low)} ${f(x - W * 0.9)} ${f(low)} ${f(xL)} ${f(yL)}`
  return {
    lips: `${upper}M${f(x)} 117.6V${f(y)}`,
    inside: `${upper}${lower}Z`,
    lowerLip: `M${f(xR)} ${f(yR)}${lower}`,
    tongue: { x: f(x + skew * 2), y: f(low - depth * 0.42), rx: f(W * 0.58), ry: f(Math.max(1, depth * 0.36)) },
  }
}

/** Two-bone IK: shoulder → elbow → wrist, reaching for (tx, ty). bend
    picks which way the elbow points (+1 left arm, −1 right arm: outward). */
export function solveArm(sx, sy, tx, ty, bend) {
  const l1 = ARM.upper
  const l2 = ARM.fore
  const dx = tx - sx
  const dy = ty - sy
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.05)
  const a = Math.atan2(dy, dx)
  const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
  const ea = a + bend * b
  const ex = sx + l1 * Math.cos(ea)
  const ey = sy + l1 * Math.sin(ea)
  const wa = Math.atan2(ty - ey, tx - ex)
  const reach = Math.min(l2, Math.hypot(tx - ex, ty - ey) || l2)
  const wx = ex + Math.max(reach, l2 * 0.92) * Math.cos(wa)
  const wy = ey + Math.max(reach, l2 * 0.92) * Math.sin(wa)
  return {
    upper: `M${f(sx)} ${f(sy)}L${f(ex)} ${f(ey)}`,
    fore: `M${f(ex)} ${f(ey)}L${f(wx)} ${f(wy)}`,
    wx, wy, angle: (wa * 180) / Math.PI,
  }
}

/* ── The tail ─────────────────────────────────────────────────────────────── */

export const TAIL = {
  lens: [20, 19, 17, 15, 12, 9],
  half: [14, 13, 11.5, 9.6, 7.6, 5.6, 3.6],
  /* at rest: out along the ground, curling up at the tip */
  rest: [8, -6, -16, -24, -32, -34],
}

/** Catmull-Rom through points → cubic Bézier commands (open). */
function smooth(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** angles: one per segment, in degrees, each relative to the one before. */
export function tailPath(angles, base = TAIL_BASE) {
  const spine = [[base.x, base.y]]
  const dirs = []
  let a = 0
  for (let i = 0; i < TAIL.lens.length; i++) {
    a += angles[i]
    const r = (a * Math.PI) / 180
    dirs.push(r)
    const [px, py] = spine[i]
    spine.push([px + TAIL.lens[i] * Math.cos(r), py + TAIL.lens[i] * Math.sin(r)])
  }
  const left = []
  const right = []
  spine.forEach(([x, y], i) => {
    const r = i === 0 ? dirs[0] : i === dirs.length ? dirs[i - 1] : (dirs[i - 1] + dirs[i]) / 2
    const nx = -Math.sin(r)
    const ny = Math.cos(r)
    const w = TAIL.half[i]
    left.push([x + nx * w, y + ny * w])
    right.push([x - nx * w, y - ny * w])
  })
  const last = spine[spine.length - 1]
  const end = dirs[dirs.length - 1]
  const tip = [last[0] + Math.cos(end) * TAIL.half[TAIL.half.length - 1] * 1.4, last[1] + Math.sin(end) * TAIL.half[TAIL.half.length - 1] * 1.4]
  return `${smooth([...left, tip, ...right.reverse()])}Z`
}

/* ── Emotions ─────────────────────────────────────────────────────────────── */

/* Every expressive number at rest. An emotion is a set of departures from
   this; a mood is an emotion held at partial strength. */
export const NEUTRAL = {
  hx: 0, hy: 0, tilt: 0, turn: 0, pitch: 0,
  lean: 0, sq: 0,
  brL: 0, brR: 0, btL: 0, btR: 0, arch: 0,
  ltL: 0.14, ltR: 0.14, lb: 0.1, lsl: 0,
  pupil: 1, cross: 0,
  smile: 0.42, open: 0, mw: 1, skew: 0,
  blush: 0.3, earL: 0, earR: 0, whisk: 0,
  breathRate: 1, breathAmp: 1, tailAmp: 1,
}

/* Gaze is a direction (−1 … 1 each way) an emotion asks the eyes to hold;
   arms name a paw pose, used only where the paws are free. */
export const EMOTIONS = {
  neutral: {},
  happy: {
    smile: 0.95, open: 0.08, mw: 1.04, lb: 0.42, ltL: 0.1, ltR: 0.1, brL: 2.5, brR: 2.5, arch: 1,
    blush: 0.58, earL: 6, earR: 6, hy: -1.5, tilt: 3, pupil: 1.06,
  },
  excited: {
    smile: 1, open: 0.78, mw: 1.1, lb: 0.2, ltL: 0, ltR: 0, brL: 6, brR: 6, arch: 2, pupil: 1.16,
    blush: 0.68, earL: 15, earR: 15, hy: -3, lean: -2, arms: 'up', breathRate: 1.6,
  },
  curious: {
    tilt: 12, turn: 0.12, brL: 7, brR: 1.5, btL: 3, ltL: 0.02, ltR: 0.07, lb: 0.06, pupil: 1.14,
    smile: 0.28, mw: 0.78, open: 0.1, earL: 13, earR: 6, lean: 3, hy: -1,
  },
  confused: {
    tilt: -11, brL: -2, btL: -9, brR: 7, btR: 7, ltL: 0.34, ltR: 0.06, smile: -0.08, skew: -0.7, mw: 0.82,
    earL: -12, earR: 9, pupil: 0.94, turn: -0.12, gaze: [0.25, -0.35], arms: 'shrug',
  },
  surprised: {
    brL: 10, brR: 10, btL: 2, btR: 2, ltL: 0, ltR: 0, lb: 0, pupil: 0.76, open: 0.88, mw: 0.6, smile: 0.08,
    hy: -5, pitch: -0.25, earL: 19, earR: 19, lean: -4, whisk: -9, blush: 0.2,
  },
  proud: {
    ltL: 0.38, ltR: 0.38, lb: 0.32, smile: 0.88, mw: 1.12, skew: 0.18, pitch: -0.5, hy: -3, brL: 3, brR: 3,
    btL: -2, btR: -2, lean: -6, blush: 0.46, earL: 5, earR: 5, arms: 'hips', tilt: -3,
  },
  thinking: {
    gaze: [-0.6, -0.85], brL: 7, brR: 1, btL: 3, btR: -3, ltL: 0.16, ltR: 0.22, smile: 0.06, mw: 0.66,
    skew: -0.55, tilt: -7, turn: -0.18, pitch: -0.15, arms: 'chin', earL: 3, earR: -2,
  },
  sleepy: {
    ltL: 0.66, ltR: 0.72, lb: 0.14, lsl: -0.22, brL: -2, brR: -2, btL: 3, btR: 3, smile: 0.12, mw: 0.86,
    tilt: 8, hy: 4, pitch: 0.38, earL: -15, earR: -12, lean: 2, breathRate: 0.62, breathAmp: 1.4,
    tailAmp: 0.4, pupil: 0.95, gaze: [0, 0.3], arms: 'low',
  },
  asleep: {
    ltL: 1, ltR: 1, lb: 0.2, brL: -1, brR: -1, smile: 0.2, open: 0.08, mw: 0.7, tilt: 11, hy: 7, pitch: 0.6,
    earL: -18, earR: -16, lean: 3, breathRate: 0.48, breathAmp: 1.9, tailAmp: 0.15, arms: 'low',
  },
  sad: {
    ltL: 0.34, ltR: 0.34, lsl: -0.48, btL: 15, btR: 15, brL: 1, brR: 1, smile: -0.78, mw: 0.8, pitch: 0.42,
    hy: 4, earL: -19, earR: -19, lean: 4, blush: 0.12, gaze: [0, 0.5], arms: 'low', tailAmp: 0.3, tilt: 4,
  },
  determined: {
    ltL: 0.3, ltR: 0.3, lsl: 0.46, btL: -13, btR: -13, brL: -2, brR: -2, smile: 0.32, mw: 0.78, skew: 0.25,
    lean: 7, pitch: 0.2, earL: 4, earR: 4, pupil: 0.96, arms: 'fists', hy: 1,
  },
  mischievous: {
    gaze: [0.9, 0.05], ltL: 0.42, ltR: 0.34, lb: 0.24, lsl: 0.18, brL: -1, btL: -4, brR: 7, btR: -3,
    smile: 0.64, skew: 0.95, mw: 0.95, turn: -0.28, tilt: 6, blush: 0.42, earL: 4, earR: 10,
  },
  celebrating: {
    smile: 1, open: 0.92, mw: 1.16, lb: 0.78, ltL: 0.26, ltR: 0.26, brL: 7, brR: 7, arch: 2, blush: 0.72,
    earL: 17, earR: 17, hy: -4, arms: 'tada', pupil: 1.1, breathRate: 1.8,
  },
  /* two the brief does not list but the course needs */
  sympathetic: {
    btL: 10, btR: 10, brL: 2.5, brR: 2.5, ltL: 0.22, ltR: 0.22, lb: 0.24, smile: 0.36, mw: 0.86,
    tilt: 10, earL: -5, earR: -5, blush: 0.42, pupil: 1.1,
  },
  relaxed: {
    ltL: 0.3, ltR: 0.3, lb: 0.22, smile: 0.62, tilt: -4, lean: -2, earL: 2, earR: 2, breathRate: 0.85,
  },
}

/** The target for every expressive number: neutral, moved toward `name`
    by `weight` (a mood is held at about half strength). */
export function blend(name, weight = 1, into = {}) {
  const e = EMOTIONS[name] || {}
  for (const k in NEUTRAL) {
    const v = e[k]
    into[k] = v == null ? NEUTRAL[k] : NEUTRAL[k] + (v - NEUTRAL[k]) * weight
  }
  return into
}
