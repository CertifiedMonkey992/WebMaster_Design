/* ═══════════════════════════════════════════════════════════════════════════
   acts.js — THE OTTER'S REPERTOIRE
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 13 → The otter's acts. An act is a short piece
   of choreography: `run(t, o, v, pose)` writes OFFSETS for time t (ms) into
   `o`, on top of whatever the otter's emotion and breathing are already
   doing. Every act is built from the same principles:

     anticipation    a dip, a squint, a breath in, before anything big
     follow-through  the head lags, ears flop, the tail swishes — the engine
                     adds these; an act only moves the body
     overlap         eyes lead, the head follows, the body arrives last
     variation       v.s (speed), v.a (size), v.r and v.side differ every
                     play, so the same act is never the same twice

   Offsets (all optional): bx by sq lean spin flip · hx hy tilt turn pitch ·
   brL brR btL btR arch · ltL ltR lb lsl pupil cross · smile open mw skew ·
   blush earL earR whisk nose tongue · blink winkL winkR · gx gy gw (gaze
   override and its weight) · Lx Ly Lw Lr / Rx Ry Rw Rr (absolute paw target
   with a weight and a paw roll) · Ldx Ldy Rdx Rdy · bookX bookY bookR bookS
   page · pebX pebY peb · fL fR (perch: feet) · lift · tail tailCurl ·
   scarf · eyeSpin.
   ═══════════════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2

const EASE = {
  lin: (u) => u,
  io: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  o: (u) => 1 - (1 - u) ** 3,
  i: (u) => u ** 3,
  snap: (u) => 1 - (1 - u) ** 5,
  back: (u) => { const c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2 },
}

/** Keyframes: [[ms, value, ease?], …] — the ease shapes the move INTO a key. */
export function key(t, keys) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = 'io'] = keys[i]
    if (t <= t1) {
      const [t0, v0] = keys[i - 1]
      return v0 + (v1 - v0) * EASE[e]((t - t0) / Math.max(1, t1 - t0))
    }
  }
  return keys[keys.length - 1][1]
}

/** 0 → 1 → 0 between a and b, easing in and out over `edge` ms. */
const env = (t, a, b, edge = 160) => Math.min(key(t, [[a, 0], [a + edge, 1]]), key(t, [[b - edge, 1], [b, 0]]))
const osc = (t, hz, phase = 0) => Math.sin((t / 1000) * TAU * hz + phase)

/* A hop — anticipation, launch, air, landing, recovery — reused by several
   acts. Returns { by, sq } for time t from `at`. */
function hop(t, at = 0, height = 30) {
  const u = t - at
  return {
    by: key(u, [[0, 0], [150, 2], [250, -height * 0.35, 'o'], [400, -height, 'o'], [540, -height * 0.4, 'i'], [600, 0, 'i'], [700, 1.5], [820, 0]]),
    sq: key(u, [[0, 0], [150, 0.1, 'o'], [250, -0.1, 'o'], [420, -0.03], [590, -0.05], [630, 0.11, 'snap'], [740, -0.035], [880, 0]]),
  }
}

const both = (o, k, v) => { o[k + 'L'] = v; o[k + 'R'] = v }
const ALL = ['hold', 'cheer', 'perch', 'peek']
const BODY = ['hold', 'cheer', 'perch']
const FREE = ['cheer', 'perch']

export const ACTS = {
  /* ── Arrivals ──────────────────────────────────────────────────────────── */

  /* The peeking otter climbing up into view the first time it is seen. */
  rise: {
    dur: 900, poses: ['peek'], emote: 'curious',
    run(t, o) {
      o.by = key(t, [[0, 120], [420, -9, 'o'], [600, 2], [760, 0]])
      o.sq = key(t, [[380, 0], [440, -0.06], [600, 0.04], [760, 0]])
      /* the paws grab the edge as the head comes up */
      o.pawS = key(t, [[0, 0], [280, 0], [440, 1, 'back']])
      o.Ldy = key(t, [[280, 0], [400, -4], [560, 0]])
      o.Rdy = key(t, [[330, 0], [450, -4], [610, 0]])
      o.blink = key(t, [[560, 0], [600, 1], [680, 0]])
    },
  },

  /* Noticing the reader: the eyes find you first, then the head, then
     the ears and brows go up. */
  notice: {
    dur: 760, poses: ALL,
    run(t, o) {
      o.gx = 0; o.gy = 0
      o.gw = key(t, [[0, 0], [70, 1, 'snap'], [600, 1], [760, 0]])
      o.blink = key(t, [[0, 0], [50, 1, 'i'], [120, 0, 'o']])
      both(o, 'br', 0)
      o.brL = o.brR = key(t, [[60, 0], [180, 8, 'o'], [500, 5], [760, 0]])
      o.earL = o.earR = key(t, [[60, 0], [170, 16, 'snap'], [760, 0]])
      o.hy = key(t, [[0, 0], [90, 1.5], [220, -4, 'o'], [520, 0, 'io']])
      o.pupil = key(t, [[0, 0], [200, 0.16, 'o'], [760, 0]])
      o.smile = key(t, [[200, 0], [500, 0.4], [760, 0]])
    },
  },

  /* ── Greetings and gestures ────────────────────────────────────────────── */

  wave: {
    dur: 1800, poses: ALL, emote: 'happy',
    run(t, o, v, pose) {
      const up = key(t, [[0, 0], [110, -0.06], [340, 1, 'back'], [1420, 1], [1800, 0, 'io']])
      const sway = osc(t - 300, 2.7) * env(t, 300, 1460, 160) * v.a
      o.Rw = up
      if (pose === 'peek') {
        o.Rx = 206 + 8 * sway; o.Ry = 100 - 3 * Math.abs(sway); o.Rr = 18 * sway
      } else {
        o.Rx = 186 + 7 * sway; o.Ry = 124 - 3 * Math.abs(sway); o.Rr = 20 * sway - 8
      }
      o.tilt = key(t, [[0, 0], [380, 6], [1400, 5], [1800, 0]])
      o.lean = key(t, [[0, 0], [100, 1], [400, -1.5], [1800, 0]])
      o.hy = key(t, [[0, 0], [110, 1.5], [330, -1], [1800, 0]])
      if (pose === 'hold') { o.bookR = -3 * up; o.bookX = -2 * up; o.bookY = 2 * up }
      o.gx = 0; o.gy = 0; o.gw = env(t, 0, 1800, 200)
    },
  },

  waveBoth: {
    dur: 1900, poses: FREE, emote: 'excited',
    run(t, o, v) {
      const up = key(t, [[0, 0], [140, -0.05], [360, 1, 'back'], [1500, 1], [1900, 0]])
      const a = osc(t, 2.4) * env(t, 320, 1560) * v.a
      o.Lw = o.Rw = up
      o.Lx = 50 - 7 * a; o.Ly = 128 + 3 * a; o.Lr = -18 * a
      o.Rx = 190 - 7 * a; o.Ry = 128 - 3 * a; o.Rr = -18 * a
      o.by = -Math.abs(osc(t, 2.4)) * 4 * env(t, 340, 1500)
      o.sq = -o.by * 0.006
      o.tilt = osc(t, 1.2) * 5 * env(t, 300, 1600)
    },
  },

  /* The otter's thumbs-up: a raised paw and a wink. */
  pawUp: {
    dur: 1400, poses: ALL, emote: 'happy',
    run(t, o, v, pose) {
      const up = key(t, [[0, 0], [120, -0.05], [320, 1, 'back'], [1050, 1], [1400, 0]])
      o.Rw = up
      if (pose === 'peek') { o.Rx = 202; o.Ry = 112 + key(t, [[320, 0], [420, -6, 'o'], [560, 0]]); o.Rr = -10 }
      else { o.Rx = 168; o.Ry = 132 + key(t, [[320, 0], [420, -7, 'o'], [580, 0]]); o.Rr = -14 }
      o.winkR = key(t, [[300, 0], [380, 1, 'o'], [820, 1], [940, 0]])
      o.skew = key(t, [[300, 0], [420, 0.45], [940, 0.45], [1200, 0]])
      o.tilt = key(t, [[0, 0], [360, 7], [1000, 6], [1400, 0]])
      o.sq = key(t, [[300, 0], [380, 0.05], [520, -0.02], [640, 0]])
      if (pose === 'hold') { o.bookR = -3 * up; o.bookX = -2 * up }
    },
  },

  nod: {
    dur: 1000, poses: ALL, emote: 'happy',
    run(t, o) {
      o.pitch = key(t, [[0, 0], [160, -0.12], [330, 0.42, 'o'], [520, -0.05], [680, 0.3, 'o'], [1000, 0]])
      o.hy = o.pitch * 3
      o.blink = key(t, [[280, 0], [330, 0.7], [420, 0]])
    },
  },

  /* Paws rubbed together: "let's go". */
  rubPaws: {
    dur: 1400, poses: FREE, emote: 'mischievous',
    run(t, o) {
      const w = env(t, 0, 1400, 220)
      const r = osc(t, 6.5) * env(t, 240, 1200, 120)
      o.Lw = o.Rw = w
      o.Lx = 112 + r * 4; o.Ly = 184 - r * 1.5
      o.Rx = 128 - r * 4; o.Ry = 184 + r * 1.5
      o.lift = -1.5 * w
      o.sq = -0.02 * w
    },
  },

  clap: {
    dur: 1500, poses: ALL, emote: 'excited',
    run(t, o, v, pose) {
      const w = env(t, 0, 1500, 200)
      const beat = Math.max(0, osc(t - 200, 4.4, Math.PI / 2))
      const open = (1 - beat) * env(t, 180, 1300, 140)
      o.Lw = o.Rw = w
      if (pose === 'peek') {
        o.Lx = 108 - open * 18; o.Ly = 120; o.Rx = 132 + open * 18; o.Ry = 120
      } else {
        o.Lx = 110 - open * 18; o.Ly = 176 - open * 4
        o.Rx = 130 + open * 18; o.Ry = 176 - open * 4
      }
      o.sq = beat * 0.025 * env(t, 200, 1300)
      both(o, 'wink', 0)
      o.lb = 0.3 * w
      o.hy = -beat * 1.5
    },
  },

  /* ── Looking ───────────────────────────────────────────────────────────── */

  lookAround: {
    dur: 2700, poses: ALL,
    run(t, o, v) {
      const s = v.side
      o.gw = env(t, 0, 2700, 120)
      o.gx = key(t, [[0, 0], [260, -0.95 * s, 'snap'], [1200, -0.9 * s], [1300, 0.95 * s, 'snap'], [2150, 0.9 * s], [2250, 0, 'snap']])
      o.gy = key(t, [[0, 0], [260, 0.1], [1300, -0.15], [2250, 0]])
      o.turn = key(t, [[0, 0], [150, 0], [520, -0.42 * s], [1300, -0.38 * s], [1650, 0.42 * s], [2250, 0.36 * s], [2600, 0]])
      o.tilt = key(t, [[0, 0], [520, -4 * s], [1650, 5 * s], [2600, 0]])
      o.earL = key(t, [[0, 0], [400, 10 * (s > 0 ? 1 : 0.2)], [1500, 10 * (s > 0 ? 0.2 : 1)], [2600, 0]])
      o.earR = key(t, [[0, 0], [400, 10 * (s > 0 ? 0.2 : 1)], [1500, 10 * (s > 0 ? 1 : 0.2)], [2600, 0]])
      o.blink = key(t, [[1240, 0], [1290, 1], [1360, 0]])
      o.brL = o.brR = key(t, [[2200, 0], [2350, 5, 'o'], [2700, 0]])
      o.smile = key(t, [[2200, 0], [2400, 0.35], [2700, 0]])
    },
  },

  /* Leaning in to look at the screen, the way you peer at a small label. */
  peer: {
    dur: 2200, poses: ALL, emote: 'curious',
    run(t, o) {
      const w = key(t, [[0, 0], [500, 1, 'o'], [1700, 1], [2200, 0]])
      o.lean = 6 * w; o.hy = 3 * w; o.pitch = 0.15 * w
      o.pupil = 0.2 * w
      o.gx = 0; o.gy = 0.1; o.gw = w
      o.ltL = o.ltR = key(t, [[600, 0], [900, 0.18], [1300, 0.18], [1500, -0.05]])
      o.brL = key(t, [[1300, 0], [1500, 5, 'o'], [2200, 0]])
    },
  },

  /* ── Grooming and fidgets (otters groom constantly) ────────────────────── */

  groom: {
    dur: 2600, poses: FREE, emote: 'relaxed',
    run(t, o) {
      const w = key(t, [[0, 0], [320, 1, 'o'], [1800, 1], [2100, 0, 'io']])
      const rub = osc(t - 320, 3.1) * env(t, 320, 1800, 200)
      o.Lw = o.Rw = w
      o.Lx = 101; o.Ly = 128 + rub * 8
      o.Rx = 139; o.Ry = 128 - rub * 8
      o.Lr = -30; o.Rr = 30
      both(o, 'lt', 0)
      o.ltL = o.ltR = 0.85 * env(t, 300, 1900, 200)
      o.lb = 0.4 * env(t, 300, 1900)
      o.smile = 0.3 * w
      o.tilt = rub * 4
      o.turn = rub * 0.12
      o.earL = o.earR = -8 * w
      /* then a quick shake, ears flopping */
      const shake = osc(t - 2050, 7.5) * env(t, 2050, 2600, 80)
      o.tilt += shake * 7
      o.hx = shake * 1.5
    },
  },

  scratch: {
    dur: 1900, poses: BODY, emote: 'relaxed',
    run(t, o, v, pose) {
      const w = key(t, [[0, 0], [300, 1, 'o'], [1300, 1], [1650, 0]])
      const itch = osc(t, 8.5) * env(t, 320, 1300, 80)
      o.Rw = w
      o.Rx = 166; o.Ry = 118 + itch * 3.5; o.Rr = -40
      o.tilt = 9 * w
      o.ltL = o.ltR = 0.45 * w
      o.lb = 0.35 * w
      o.smile = 0.25 * w
      o.earR = itch * 4
      o.tail = 1.5 * w
      if (pose === 'hold') { o.bookR = -4 * w; o.bookX = -3 * w; o.bookY = 3 * w }
    },
  },

  /* Sea otters keep a favourite stone, and some otters juggle pebbles. */
  juggle: {
    dur: 3800, poses: FREE, emote: 'happy', rare: true,
    run(t, o) {
      const w = env(t, 0, 3800, 260)
      o.Lw = o.Rw = w
      const L = [104, 190]
      const R = [136, 190]
      const tosses = [[300, L, R, 70], [850, R, L, 80], [1400, L, R, 70], [1950, R, L, 120]]
      let x = L[0]
      let y = L[1] - 6
      let air = 0
      for (const [at, a, b, h] of tosses) {
        const d = h > 100 ? 760 : 520
        if (t >= at && t < at + d) {
          const u = (t - at) / d
          x = a[0] + (b[0] - a[0]) * u
          y = a[1] - 6 - h * 4 * u * (1 - u)
          air = h
        } else if (t >= at + d) { x = b[0]; y = b[1] - 6 }
      }
      const caught = (side) => tosses.reduce((s, [at, , b, h]) => {
        const d = h > 100 ? 760 : 520
        return s + (b === side ? key(t, [[at + d - 40, 0], [at + d + 40, 6, 'o'], [at + d + 200, 0]]) : 0)
      }, 0)
      o.Lx = L[0]; o.Ly = L[1] + caught(L)
      o.Rx = R[0]; o.Ry = R[1] + caught(R)
      o.pebX = x; o.pebY = y
      o.peb = key(t, [[0, 0], [200, 1, 'back'], [3100, 1], [3300, 1], [3500, 0]])
      o.gx = (x - 120) / 40; o.gy = (y - 150) / 70; o.gw = env(t, 200, 2800, 120)
      o.pitch = air > 100 ? -0.35 * env(t, 1950, 2710) : 0
      /* the last catch is held up proudly */
      const show = key(t, [[2720, 0], [2900, 1, 'back'], [3250, 1], [3550, 0]])
      o.Lx = o.Lx + (96 - o.Lx) * show; o.Ly = o.Ly + (132 - o.Ly) * show
      if (show > 0) { o.pebX = o.pebX + (92 - o.pebX) * show; o.pebY = o.pebY + (120 - o.pebY) * show }
      o.winkR = key(t, [[2800, 0], [2880, 1], [3200, 1], [3300, 0]])
      o.smile = 0.3 * show
    },
    cues: [[2900, 'feel', 'proud', 900]],
  },

  /* ── Bigger moments ────────────────────────────────────────────────────── */

  hop: {
    dur: 900, poses: BODY, emote: 'excited',
    run(t, o, v, pose) {
      const h = hop(t, 0, 30 * v.a)
      o.by = h.by; o.sq = h.sq
      const arms = key(t, [[150, 0], [260, 6], [400, -10], [620, 4], [820, 0]])
      if (pose === 'hold') o.bookY = arms
      else o.Ldy = o.Rdy = arms
      o.open = key(t, [[200, 0], [380, 0.4], [620, 0.1], [900, 0]])
      o.ltL = o.ltR = key(t, [[0, 0], [150, 0.25], [260, -0.1], [620, 0.15], [800, 0]])
    },
    cues: [[620, 'kick', 30]],
  },

  /* The little celebration for a correct answer from behind the edge. */
  bounce: {
    dur: 900, poses: ['peek'], emote: 'excited',
    run(t, o) {
      o.by = key(t, [[0, 0], [120, 5], [300, -16, 'o'], [480, 0, 'i'], [580, 2], [700, 0]])
      o.sq = key(t, [[0, 0], [120, 0.06], [300, -0.05], [480, 0.06], [620, 0]])
      o.Ldy = o.Rdy = key(t, [[0, 0], [300, -6], [500, 0]])
    },
  },

  dance: {
    dur: 3400, poses: FREE, emote: 'celebrating', rare: true,
    run(t, o) {
      const beat = 2.5
      const w = env(t, 0, 3400, 240)
      const side = osc(t, beat / 2)
      const bounce = Math.abs(osc(t, beat / 2))
      o.bx = side * 6 * w
      o.lean = -side * 6 * w
      o.by = -bounce * 6 * w
      o.sq = (0.04 - bounce * 0.06) * w
      o.tilt = side * 8 * w
      o.Lw = o.Rw = w
      const alt = osc(t, beat / 2, Math.PI / 2)
      o.Lx = 82 - alt * 10; o.Ly = 140 - Math.max(0, alt) * 26
      o.Rx = 158 - alt * 10; o.Ry = 140 - Math.max(0, -alt) * 26
      o.Lr = alt * 20; o.Rr = alt * 20
      o.tail = 2 * w
      o.flip = key(t, [[1500, 0], [2100, 1, 'io']])
      o.by -= 14 * env(t, 1500, 2100, 300)
      both(o, 'lt', 0)
    },
    cues: [[2100, 'kick', 40]],
  },

  /* A full turn in the air with a landing, for a section finished. */
  backflip: {
    dur: 1700, poses: FREE, emote: 'excited', rare: true, after: 'celebrating', afterMs: 1100,
    run(t, o) {
      o.sq = key(t, [[0, 0], [260, 0.16, 'o'], [360, -0.14, 'o'], [520, 0.06], [980, 0.06], [1060, -0.04], [1140, 0.17, 'snap'], [1300, -0.04], [1500, 0]])
      o.by = key(t, [[0, 0], [260, 3], [380, -30, 'o'], [700, -78, 'o'], [1000, -24, 'i'], [1140, 0, 'i'], [1260, 2], [1400, 0]])
      o.spin = key(t, [[380, 0], [1060, -360, 'io']])
      o.Lw = o.Rw = key(t, [[0, 0], [260, 1], [1600, 1], [1700, 0]])
      const tuck = env(t, 420, 1000, 120)
      o.Lx = 104 - (1 - tuck) * 54; o.Ly = 190 - (1 - tuck) * 60
      o.Rx = 136 + (1 - tuck) * 54; o.Ry = 190 - (1 - tuck) * 60
      o.Ly = t > 1140 ? key(t, [[1140, 170], [1300, 148, 'back']]) : o.Ly
      o.Ry = t > 1140 ? key(t, [[1140, 170], [1300, 148, 'back']]) : o.Ry
      o.Lx = t > 1140 ? 38 : o.Lx
      o.Rx = t > 1140 ? 202 : o.Rx
      both(o, 'lt', 0)
      o.ltL = o.ltR = 0.9 * tuck
    },
    cues: [[1140, 'kick', 60]],
  },

  /* A lesson finished: anticipation, a leap with arms up, a twirl in the
     air, and a landing that keeps clapping. */
  celebrate: {
    dur: 2300, poses: BODY, emote: 'celebrating',
    run(t, o, v, pose) {
      const h = hop(t, 0, 40 * v.a)
      o.by = h.by; o.sq = h.sq
      o.flip = key(t, [[260, 0], [640, 1, 'io']])
      if (pose === 'hold') {
        o.bookY = key(t, [[150, 0], [300, -70, 'o'], [900, -70], [1200, 0, 'io']])
        o.bookR = key(t, [[150, 0], [300, 8], [900, 8], [1200, 0]])
      } else {
        const up = key(t, [[150, 0], [300, 1, 'o'], [1000, 1], [1200, 0]])
        o.Lw = o.Rw = up
        o.Lx = 50; o.Ly = 128; o.Rx = 190; o.Ry = 128
        const c = Math.max(0, osc(t - 1250, 4.4, Math.PI / 2))
        const clap = env(t, 1200, 2200, 140)
        o.Lw = Math.max(o.Lw, clap); o.Rw = Math.max(o.Rw, clap)
        if (clap > up) {
          o.Lx = 110 - (1 - c) * 18; o.Ly = 176
          o.Rx = 130 + (1 - c) * 18; o.Ry = 176
        }
      }
      o.tail = 2.5
    },
    cues: [[630, 'kick', 50]],
  },

  /* The quest version: a fist pump, a twirl, and a knowing wink. */
  questCheer: {
    dur: 1900, poses: BODY, emote: 'determined', after: 'mischievous', afterMs: 900,
    run(t, o, v, pose) {
      const pump = key(t, [[0, 0], [160, 0.15], [360, 1, 'snap'], [900, 1], [1200, 0]])
      o.Rw = pump
      o.Rx = 162; o.Ry = 122 + key(t, [[360, 0], [460, -8, 'o'], [600, 0], [700, -6], [820, 0]])
      o.Rr = -20
      const h = hop(t, 300, 22)
      o.by = h.by; o.sq = h.sq
      o.flip = key(t, [[1050, 0], [1550, 1, 'io']])
      o.winkL = key(t, [[1600, 0], [1680, 1], [1850, 1], [1900, 0]])
      if (pose === 'hold') { o.bookR = -4 * pump; o.bookX = -3 * pump }
    },
    cues: [[900, 'kick', 30], [400, 'feel', 'excited', 700]],
  },

  /* Something new opened: curious → surprised → delighted. */
  unlock: {
    dur: 2400, poses: ALL, emote: 'curious',
    run(t, o, v, pose) {
      o.lean = key(t, [[0, 0], [400, 4], [560, -6, 'snap'], [900, 0]])
      o.hy = key(t, [[0, 0], [400, 2], [560, -6, 'snap'], [900, 0]])
      o.pitch = key(t, [[0, 0], [400, 0.15], [560, -0.2, 'snap'], [900, 0]])
      if (pose !== 'peek') {
        const h = hop(t, 950, 26)
        o.by = h.by; o.sq = h.sq + key(t, [[540, 0], [600, -0.06], [700, 0]])
      } else {
        o.by = key(t, [[950, 0], [1100, 4], [1300, -14, 'o'], [1480, 0], [1600, 0]])
      }
    },
    cues: [[0, 'feel', 'curious', 560], [540, 'feel', 'surprised', 520], [1060, 'feel', 'celebrating', 900], [1960, 'feel', 'happy', 1400]],
  },

  /* ── Sympathy and encouragement ────────────────────────────────────────── */

  /* A wrong answer: never disappointment. A tilt, a soft look, a slow
     blink — then an encouraging nod and a raised paw. */
  sympathy: {
    dur: 2400, poses: ALL, emote: 'sympathetic', after: 'happy', afterMs: 900,
    run(t, o, v, pose) {
      o.blink = key(t, [[500, 0], [640, 1, 'i'], [760, 1], [960, 0, 'o']])
      o.pitch = key(t, [[1200, 0], [1350, 0.32, 'o'], [1520, 0], [1680, 0.24, 'o'], [1900, 0]])
      const up = key(t, [[1250, 0], [1500, 1, 'back'], [2100, 1], [2400, 0]])
      o.Rw = up
      if (pose === 'peek') {
        o.Rx = 200; o.Ry = 124 + key(t, [[1500, 0], [1600, -4], [1720, 0], [1820, -4], [1940, 0]])
      } else {
        o.Rx = 150; o.Ry = 176 + key(t, [[1500, 0], [1600, -4], [1720, 0], [1820, -4], [1940, 0]])
        if (pose === 'hold') { o.bookR = -2 * up }
      }
      o.smile = key(t, [[1200, 0], [1500, 0.25]])
    },
    cues: [[1300, 'feel', 'determined', 700]],
  },

  /* A setback (a streak lost, hearts gone): a sigh — then the paws come up
     and it nods, once, firmly. Sad never gets the last word. */
  regroup: {
    dur: 2700, poses: ALL, emote: 'sad', after: 'happy', afterMs: 1000,
    run(t, o, v, pose) {
      o.lift = key(t, [[0, 0], [550, -3.5], [1050, 2], [1350, 0]])
      o.sq = key(t, [[950, 0], [1100, 0.03], [1350, 0]])
      o.blink = key(t, [[700, 0], [820, 1, 'i'], [1000, 1], [1150, 0, 'o']])
      if (pose === 'cheer' || pose === 'perch') {
        const w = key(t, [[1350, 0], [1550, 1, 'back'], [2350, 1], [2700, 0]])
        o.Lw = o.Rw = w
        o.Lx = 98; o.Ly = 184
        o.Rx = 142; o.Ry = 184 + key(t, [[1650, 0], [1750, -7, 'o'], [1900, 0]])
      }
      o.pitch = key(t, [[1550, 0], [1700, 0.32, 'o'], [1900, 0]])
    },
    cues: [[1350, 'feel', 'determined', 1150]],
  },

  /* Patting the edge, "it's fine", from behind a frame. */
  pat: {
    dur: 1500, poses: ['peek'], emote: 'sympathetic',
    run(t, o) {
      const p = Math.max(0, osc(t - 300, 3.2, -Math.PI / 2))
      o.Ldy = -6 * p * env(t, 300, 1300)
      o.tilt = key(t, [[0, 0], [300, 9], [1200, 9], [1500, 0]])
      o.pitch = key(t, [[700, 0], [850, 0.25], [1000, 0], [1150, 0.2], [1300, 0]])
    },
  },

  shrug: {
    dur: 1600, poses: BODY, emote: 'confused',
    run(t, o, v, pose) {
      const w = key(t, [[0, 0], [300, 1, 'back'], [1200, 1], [1600, 0]])
      o.lift = -5 * key(t, [[0, 0], [300, 1, 'o'], [900, 1], [1200, 0]])
      if (pose === 'hold') { o.bookY = 4 * w; o.bookR = 3 * w; return }
      o.Lw = o.Rw = w
      o.Lx = 62; o.Ly = 176; o.Rx = 178; o.Ry = 176
      o.Lr = -50; o.Rr = 50
    },
  },

  /* A brief "hmm…", then the idea. */
  think: {
    dur: 2700, poses: BODY, emote: 'thinking',
    run(t, o, v, pose) {
      const tap = Math.max(0, osc(t - 500, 2.6)) * env(t, 500, 1800)
      o.Rdy = -tap * 3
      const aha = key(t, [[1950, 0], [2100, 1, 'snap'], [2500, 1], [2700, 0]])
      o.hy = -3 * aha
      o.by = -6 * key(t, [[1950, 0], [2080, 1, 'o'], [2250, 0, 'i']])
      o.sq = key(t, [[1900, 0], [1960, 0.05], [2080, -0.04], [2250, 0.04], [2400, 0]])
      if (pose === 'hold') { o.Rw = key(t, [[0, 0], [400, 1, 'o'], [1900, 1], [2300, 0]]); o.Rx = 132; o.Ry = 148 - tap * 3; o.bookR = -3; o.bookX = -2 }
    },
    cues: [[2000, 'feel', 'excited', 700]],
  },

  /* ── Rest ──────────────────────────────────────────────────────────────── */

  stretch: {
    dur: 2900, poses: BODY, emote: 'sleepy',
    run(t, o, v, pose) {
      const up = key(t, [[0, 0], [200, -0.1], [700, 1, 'io'], [1650, 1], [1900, 0, 'o']])
      const tremble = osc(t, 11) * env(t, 900, 1650, 100) * 0.6
      if (pose === 'hold') {
        /* the book comes up to the chest and the elbows go wide */
        o.bookY = -22 * up + tremble; o.bookR = 3 * up
        o.lift = -4 * up
      } else {
        o.Lw = o.Rw = up
        o.Lx = 46; o.Ly = 120 + tremble; o.Rx = 194; o.Ry = 120 - tremble
        o.Lr = 40; o.Rr = -40
      }
      o.sq = -0.08 * up + key(t, [[1900, 0], [2000, 0.06], [2200, 0]])
      o.lean = -5 * up
      o.pitch = -0.35 * up
      both(o, 'lt', 0)
      o.ltL = o.ltR = 0.95 * env(t, 300, 1950, 200)
      o.open = 0.95 * env(t, 500, 1700, 300)
      o.mw = -0.3 * env(t, 500, 1700, 300)
      o.smile = -0.4 * env(t, 500, 1700, 300)
      o.earL = o.earR = -12 * up
      o.tail = 2 * up
      const shake = osc(t - 2150, 8) * env(t, 2150, 2700, 80)
      o.tilt = shake * 6
    },
    cues: [[2000, 'feel', 'happy', 1000]],
  },

  yawn: {
    dur: 2200, poses: BODY, emote: 'sleepy',
    run(t, o, v, pose) {
      const w = env(t, 200, 1700, 400)
      o.open = 1 * w
      o.mw = -0.32 * w
      o.smile = -0.4 * w
      o.pitch = -0.3 * w
      o.ltL = o.ltR = 0.9 * w
      o.earL = o.earR = -10 * w
      o.lift = -2 * w
      if (pose !== 'hold') { o.Rw = env(t, 400, 1600, 260); o.Rx = 128; o.Ry = 138 }
      o.blink = key(t, [[1800, 0], [1900, 1], [2100, 0]])
    },
  },

  /* Dozing off: the head sinks… sinks… and jerks back up. */
  nodOff: {
    dur: 2600, poses: BODY,
    run(t, o) {
      o.pitch = key(t, [[0, 0], [1800, 0.5, 'i'], [1950, -0.2, 'snap'], [2600, 0]])
      o.hy = key(t, [[0, 0], [1800, 6, 'i'], [1950, -2, 'snap'], [2600, 0]])
      o.ltL = o.ltR = key(t, [[0, 0], [1700, 0.4], [1950, -0.3, 'snap'], [2600, 0]])
      o.earL = o.earR = key(t, [[1800, 0], [1950, 14, 'snap'], [2600, 0]])
    },
  },

  /* Woken from a nap: a jolt, then a sheepish smile. */
  startle: {
    dur: 1300, poses: BODY, emote: 'surprised', after: 'happy', afterMs: 1200,
    run(t, o) {
      o.by = key(t, [[0, 0], [120, -12, 'snap'], [320, 0, 'i'], [420, 1], [520, 0]])
      o.sq = key(t, [[0, 0], [120, -0.08], [320, 0.1], [520, 0]])
      o.blush = key(t, [[600, 0], [800, 0.5], [1300, 0.2]])
      o.btL = o.btR = key(t, [[600, 0], [800, 6], [1300, 0]])
    },
    cues: [[620, 'feel', 'happy', 900]],
  },

  /* Drowsy, nudged awake: a shake of the head and a blink. */
  shakeOff: {
    dur: 900, poses: BODY,
    run(t, o) {
      const s = osc(t, 7) * env(t, 0, 700, 80)
      o.tilt = s * 6
      o.hx = s * 1.5
      o.blink = key(t, [[650, 0], [700, 1], [820, 0]])
    },
  },

  /* ── Answers to a click ───────────────────────────────────────────────── */

  giggle: {
    dur: 1100, poses: ALL, emote: 'happy',
    run(t, o, v, pose) {
      const w = env(t, 0, 1100, 140)
      const sh = osc(t, 11) * w
      o.lift = sh * 1.6
      o.tilt = sh * 2.5 + 4 * w
      o.ltL = o.ltR = 0.3 * w
      o.lb = 0.6 * w
      o.open = 0.45 * w
      if (pose !== 'hold' && pose !== 'peek') { o.Rw = env(t, 100, 1000, 200); o.Rx = 130; o.Ry = 136 }
      o.blush = 0.4 * w
    },
  },

  /* Booped on the nose: it goes cross-eyed. */
  boop: {
    dur: 1300, poses: ALL, emote: 'surprised', after: 'happy', afterMs: 800,
    run(t, o) {
      o.hy = key(t, [[0, 0], [60, -4, 'snap'], [300, 0]])
      o.pitch = key(t, [[0, 0], [60, -0.3, 'snap'], [400, 0]])
      o.cross = key(t, [[60, 0], [200, 1, 'o'], [650, 1], [800, 0]])
      o.gx = 0; o.gy = 0.2; o.gw = env(t, 60, 800, 100)
      o.nose = key(t, [[0, 0], [60, 0.18, 'snap'], [260, 0]])
      o.blink = key(t, [[90, 0], [130, 1], [200, 0]])
      const s = osc(t - 850, 7) * env(t, 850, 1250, 60)
      o.tilt = s * 6
    },
    cues: [[820, 'feel', 'happy', 700]],
  },

  /* Clicked too many times. */
  dizzy: {
    dur: 2200, poses: ALL, emote: 'confused', after: 'happy', afterMs: 700,
    run(t, o) {
      const w = env(t, 0, 2000, 240)
      const a = (t / 1000) * TAU * 1.6
      o.hx = Math.cos(a) * 3 * w
      o.hy = Math.sin(a) * 2 * w
      o.tilt = Math.sin(a) * 7 * w
      o.lean = Math.cos(a) * 3 * w
      o.eyeSpin = a * 1.4
      o.gw = w; o.gx = 0; o.gy = 0
      o.skew = Math.sin(a * 1.3) * 0.6 * w
      o.open = 0.2 * w
      const s = osc(t - 1900, 8) * env(t, 1900, 2200, 60)
      o.tilt += s * 5
    },
  },

  spin: {
    dur: 900, poses: BODY, emote: 'happy',
    run(t, o) {
      const h = hop(t, 0, 18)
      o.by = h.by; o.sq = h.sq
      o.flip = key(t, [[200, 0], [640, 1, 'io']])
    },
    cues: [[620, 'kick', 25]],
  },

  /* Rare: the nose itches… itches… */
  sneeze: {
    dur: 1800, poses: ALL, rare: true, after: 'happy', afterMs: 900,
    run(t, o) {
      const build = key(t, [[0, 0], [420, 0.6], [520, 0.4], [900, 1]])
      const fire = key(t, [[900, 0], [960, 1, 'snap'], [1200, 0.2], [1400, 0]])
      o.pitch = -0.4 * build * (1 - fire) + 0.55 * fire
      o.hy = -3 * build * (1 - fire) + 4 * fire
      o.ltL = o.ltR = 0.55 * build + 0.4 * fire
      o.open = 0.45 * build * (1 - fire)
      o.mw = -0.3 * build
      o.nose = 0.12 * build
      o.brL = o.brR = 6 * build * (1 - fire)
      o.sq = 0.1 * fire
      o.by = 3 * fire
      o.whisk = 12 * fire
      o.blush = key(t, [[1200, 0], [1400, 0.7], [1800, 0.4]])
      o.btL = o.btR = key(t, [[1200, 0], [1400, 6], [1800, 0]])
    },
    cues: [[900, 'kick', 45]],
  },

  /* Rare, hold pose: the book comes up and hides the face… then a face. */
  peekaboo: {
    dur: 2500, poses: ['hold'], rare: true, front: 'book',
    run(t, o, v) {
      const hide = key(t, [[0, 0], [150, 0.06], [450, 1, 'io'], [1250, 1], [1420, 0, 'snap'], [2500, 0]])
      o.bookY = -92 * hide
      o.bookR = 5 * hide
      o.lean = 2 * hide
      const face = key(t, [[1400, 0], [1450, 1], [2200, 1], [2450, 0]])
      if (v.r < 0.5) {
        o.tongue = face
        o.ltL = o.ltR = 0.5 * face
        o.lb = 0.5 * face
        o.open = 0.35 * face
        o.mw = 0.2 * face
      } else {
        o.cross = face
        o.open = 0.5 * face
        o.mw = -0.35 * face
        o.brL = o.brR = 6 * face
      }
      o.by = key(t, [[1400, 0], [1480, -6, 'o'], [1620, 0]])
      o.tilt = osc(t - 1500, 6) * 4 * env(t, 1500, 2200)
    },
    cues: [[1450, 'feel', 'happy', 1200]],
  },

  /* ── The book ──────────────────────────────────────────────────────────── */

  read: {
    dur: 3200, poses: ['hold'], emote: 'curious',
    run(t, o) {
      const w = key(t, [[0, 0], [450, 1, 'io'], [2550, 1], [2900, 0, 'io']])
      o.bookY = -16 * w
      o.bookS = -0.22 * w
      o.bookR = 3 * w
      o.pitch = 0.6 * w
      o.hy = 2 * w
      o.gw = w
      /* the eyes run along two lines, left to right */
      const line = (a) => key(t, [[a, -0.45], [a + 220, -0.15, 'snap'], [a + 440, 0.15, 'snap'], [a + 660, 0.45, 'snap']])
      o.gx = t < 1250 ? line(500) : line(1300)
      o.gy = t < 1250 ? 0.75 : 0.85
      o.page = key(t, [[2050, 0], [2400, 1, 'io']])
      o.Rdx = key(t, [[1950, 0], [2100, -10], [2400, 0]])
      o.Rdy = key(t, [[1950, 0], [2100, -12], [2400, 0]])
      o.brL = o.brR = key(t, [[2600, 0], [2750, 6, 'o'], [3200, 0]])
      o.smile = key(t, [[2600, 0], [2800, 0.35], [3200, 0]])
    },
  },

  /* ── The peeking otter ─────────────────────────────────────────────────── */

  duck: {
    dur: 1500, poses: ['peek'],
    run(t, o) {
      o.by = key(t, [[0, 0], [120, -3], [380, 116, 'i'], [900, 116], [1180, -10, 'o'], [1320, 2], [1500, 0]])
      o.sq = key(t, [[1080, 0], [1180, -0.06], [1320, 0.04], [1500, 0]])
      o.Ldy = key(t, [[300, 0], [420, 3], [560, 0]])
      o.Rdy = key(t, [[340, 0], [460, 3], [600, 0]])
    },
    cues: [[1100, 'feel', 'surprised', 300], [1400, 'feel', 'happy', 700]],
  },

  /* Fingers drummed on the edge. */
  drum: {
    dur: 1500, poses: ['peek'], emote: 'mischievous',
    run(t, o) {
      const w = env(t, 100, 1300, 120)
      o.Ldy = -Math.max(0, osc(t, 7)) * 6 * w
      o.Rdy = -Math.max(0, osc(t, 7, Math.PI)) * 6 * w
    },
  },

  /* ── The perch ─────────────────────────────────────────────────────────── */

  swing: {
    dur: 2600, poses: ['perch'], emote: 'happy',
    run(t, o) {
      const w = env(t, 0, 2600, 400)
      o.fL = osc(t, 1.3) * 20 * w
      o.fR = osc(t, 1.3, Math.PI) * 20 * w
      o.tilt = osc(t, 1.3) * 3 * w
      o.hy = -Math.abs(osc(t, 1.3)) * 1.2 * w
    },
  },

  /* Leaning over the edge of the card to look down at the page. */
  peekDown: {
    dur: 2600, poses: ['perch'], emote: 'curious',
    run(t, o) {
      const w = key(t, [[0, 0], [600, 1, 'io'], [1900, 1], [2400, 0, 'io']])
      o.lean = 12 * w
      o.pitch = 0.6 * w
      o.hy = 5 * w
      o.gw = w
      o.gx = key(t, [[600, 0], [900, -0.5], [1400, 0.5], [1800, 0]])
      o.gy = 0.9
      o.Ldy = o.Rdy = 4 * w
      o.brL = o.brR = key(t, [[2200, 0], [2350, 5], [2600, 0]])
    },
  },
}

/* What each pose does when the Stage gives it a turn, and how often. Rare
   acts carry low weights, so a visitor sees one only now and then. */
export const IDLE_ACTS = {
  hold:  [['wave', 3], ['read', 3], ['lookAround', 3], ['scratch', 1.6], ['think', 1.2], ['stretch', 1], ['peer', 1.2], ['peekaboo', 0.35], ['sneeze', 0.2]],
  cheer: [['hop', 2.5], ['clap', 2.4], ['waveBoth', 2], ['lookAround', 2], ['groom', 1.6], ['dance', 0.6], ['juggle', 0.5], ['backflip', 0.25], ['sneeze', 0.2]],
  perch: [['swing', 3], ['lookAround', 3], ['groom', 2], ['peekDown', 2], ['wave', 1.2], ['stretch', 1.2], ['yawn', 0.8], ['think', 1], ['juggle', 0.4], ['dance', 0.25]],
  peek:  [['lookAround', 3], ['duck', 2], ['wave', 1.6], ['drum', 1.4], ['peer', 1], ['sneeze', 0.2]],
}

/** Weighted pick that never repeats `last`. */
export function pickAct(list, last) {
  const pool = list.filter(([id]) => id !== last)
  const total = pool.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [id, w] of pool) {
    r -= w
    if (r <= 0) return id
  }
  return pool[pool.length - 1]?.[0] ?? null
}

/* Answers to a click. Location matters: a boop on the nose, a tickle on
   the belly; anywhere else, one of these, never the same twice running. */
export const CLICK_ACTS = {
  hold:  [['giggle', 3], ['wave', 2], ['pawUp', 2], ['hop', 1.5], ['spin', 1], ['sneeze', 0.3]],
  cheer: [['hop', 3], ['giggle', 2], ['spin', 2], ['clap', 2], ['pawUp', 1.5], ['sneeze', 0.3]],
  perch: [['giggle', 3], ['hop', 2], ['wave', 2], ['pawUp', 2], ['spin', 1], ['sneeze', 0.3]],
  peek:  [['duck', 3], ['giggle', 2], ['wave', 2], ['bounce', 2], ['sneeze', 0.3]],
}
