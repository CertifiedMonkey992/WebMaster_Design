/* ═══════════════════════════════════════════════════════════════════════════
   spring.js — WEIGHT, WITHOUT A FRAME LOOP THAT NEVER ENDS
   ---------------------------------------------------------------------------
   A few objects move with physics rather than a CSS transition: the field
   guide's pose lags the hand like something with mass, its cover is pushed
   open and falls onto the desk, its compass needle overshoots and settles.
   A transition cannot do any of that — it restarts on every change and has
   no velocity to carry.

     const s = createSpring({ stiffness, damping, onUpdate })
     s.set(target)             move toward a new target
     s.set(target, { stiffness, damping })   …with a different feel
     s.jump(value)             teleport, no motion (reduced motion)
     s.kick(velocity)          add velocity without moving the target
     s.stop()

   Options for objects that hit something:
     min / max + restitution   a hard stop; the value bounces off it and
                               loses (1 − restitution) of its speed
     force(x, v)               an extra acceleration — gravity on a cover

   Semi-implicit Euler at a fixed 1/240s step, so the feel does not change
   with the display's refresh rate. The rAF loop runs ONLY while the value is
   moving and sleeps once position and velocity are both at rest.
   ═══════════════════════════════════════════════════════════════════════════ */

const STEP = 1 / 240

function stepSpring(state, cfg, dt) {
  const { stiffness, damping, mass = 1, min, max, restitution = 0, force } = cfg
  let { x, v } = state
  let acc = dt
  while (acc > 1e-9) {
    const h = Math.min(STEP, acc)
    let a = (-stiffness * (x - state.target) - damping * v) / mass
    if (force) a += force(x, v)
    v += a * h
    x += v * h
    if (max != null && x > max) { x = max; v = v > 0 ? -v * restitution : v }
    if (min != null && x < min) { x = min; v = v < 0 ? -v * restitution : v }
    acc -= h
  }
  state.x = x
  state.v = v
  return state
}

export function createSpring({
  stiffness = 140,
  damping = 20,
  mass = 1,
  precision = 0.01,
  value = 0,
  min,
  max,
  restitution = 0,
  force,
  /* Speed below which a value AT its target counts as still. An object held
     against a stop by a force (a cover pressed flat by gravity) chatters at
     a few units a second forever; this is where that chatter is ignored. */
  restSpeed = precision * 10,
  onUpdate,
  onRest,
} = {}) {
  const cfg = { stiffness, damping, mass, min, max, restitution, force }
  const state = { x: value, v: 0, target: value }
  let raf = 0
  let last = 0

  const tick = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    stepSpring(state, cfg, dt)
    const resting = Math.abs(state.v) < restSpeed && Math.abs(state.x - state.target) < precision
    if (resting) {
      state.x = state.target
      state.v = 0
    }
    onUpdate?.(state.x, state.v)
    if (resting) {
      raf = 0
      last = 0
      onRest?.(state.x)
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }

  return {
    set(next, feel) {
      if (feel) Object.assign(cfg, feel)
      state.target = next
      wake()
    },
    jump(next) {
      state.target = next
      state.x = next
      state.v = 0
      onUpdate?.(state.x, 0)
    },
    kick(impulse) {
      state.v += impulse
      wake()
    },
    get value() { return state.x },
    get velocity() { return state.v },
    get target() { return state.target },
    get moving() { return raf !== 0 },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    },
  }
}
