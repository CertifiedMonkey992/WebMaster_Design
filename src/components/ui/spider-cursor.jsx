import { useEffect, useRef } from 'react'

/* Two spiders that walk after the pointer, drawn in the site's --ink (a token
   in index.css) on a transparent canvas, so they read as ink on the paper.

   The canvas is viewport-sized and pinned, one step below the dialog layer
   (--z-modal; .spider-cursor in motion.css), so the spiders cross every
   page, section and card as the reader scrolls, but never walk over a
   dialog or a toast. It never takes a click. In a page turn it keeps its own
   layer, so the spiders stay put while the page slides under them. Under
   reduced motion it draws nothing.

   The frame loop runs only while something is changing (MOTION_RULES.md →
   prohibited: a per-frame loop that runs while nothing is changing): a
   pointer move wakes it, and it stops IDLE_MS after the last one, or while
   the tab is hidden.

   The web's anchor points stay out of sight until a spider comes near one:
   inside SIGHT a point fades in, small and faint; when a leg reaches it, it
   turns full ink and the leg connects it to the spider's edge. As the spider
   walks on the leg lets go and the point fades away again. */

/** @typedef {{ x: number, y: number, len: number, vis: number }} Anchor */

const SIZE = 0.7 // the spiders' scale; 1 is the original component's size
const REACH = SIZE / 10 // a leg can take hold of a point this close (× viewport width)
const SIGHT = 1.6 // a point starts to show at this multiple of REACH
const NEAR_VIS = 0.45 // how far a point can bolden before a leg takes it
/* Points per spider: more as the spiders shrink, so a smaller reach still
   finds as many points to hold. */
const ANCHORS = Math.round(333 / (SIZE * SIZE))
/* How long the spiders keep walking after the pointer last moved. */
const IDLE_MS = 2500

export function SpiderCursor() {
  /** @type {import('react').RefObject<HTMLCanvasElement>} */
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    /* A finger is not a pointer to follow: on a touch screen the spiders
       would sit wherever they spawned and draw ink over the content. */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let w = 0
    let h = 0
    let dpr = 1
    let frame = 0
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { sin, cos, PI, hypot, min, max } = Math

    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()

    function spawn() {
      /** @type {Anchor[]} */
      const pts = many(ANCHORS, () => ({
        x: rnd(window.innerWidth),
        y: rnd(window.innerHeight),
        len: 0,
        vis: 0,
      }))

      const pts2 = many(9, (i) => ({
        x: cos((i / 9) * PI * 2),
        y: sin((i / 9) * PI * 2),
      }))

      const seed = rnd(100)
      let tx = rnd(window.innerWidth)
      let ty = rnd(window.innerHeight)
      let x = rnd(window.innerWidth)
      let y = rnd(window.innerHeight)
      const kx = rnd(0.5, 0.5)
      const ky = rnd(0.5, 0.5)
      const walkRadius = pt(rnd(50, 50) * SIZE, rnd(50, 50) * SIZE)
      const r = (window.innerWidth / rnd(100, 150)) * SIZE

      /** @param {Anchor} pt */
      function paintPt(pt) {
        pts2.forEach((pt2) => {
          if (!pt.len) return
          drawLine(
            lerp(x + pt2.x * r, pt.x, pt.len * pt.len),
            lerp(y + pt2.y * r, pt.y, pt.len * pt.len),
            x + pt2.x * r,
            y + pt2.y * r,
          )
        })
        if (pt.vis < 0.02) return
        ctx.globalAlpha = pt.vis
        drawCircle(pt.x, pt.y, (1 + 2 * pt.vis) * SIZE)
        ctx.globalAlpha = 1
      }

      return {
        /** @param {number} x @param {number} y */
        follow(x, y) {
          tx = x
          ty = y
        },

        /* The window changed size: stretch the web's anchors to cover it. */
        /** @param {number} sx @param {number} sy */
        rescale(sx, sy) {
          pts.forEach((pt) => {
            pt.x *= sx
            pt.y *= sy
          })
        },

        /** @param {number} t */
        tick(t) {
          const selfMoveX = cos(t * kx + seed) * walkRadius.x
          const selfMoveY = sin(t * ky + seed) * walkRadius.y
          const fx = tx + selfMoveX
          const fy = ty + selfMoveY

          x += min(window.innerWidth / 100, (fx - x) / 10)
          y += min(window.innerWidth / 100, (fy - y) / 10)

          const reach = window.innerWidth * REACH
          const sight = reach * SIGHT

          let i = 0
          pts.forEach((pt) => {
            const dx = pt.x - x
            const dy = pt.y - y
            const len = hypot(dx, dy)
            const increasing = len < reach && i++ < 8
            const dir = increasing ? 0.1 : -0.1
            pt.len = max(0, min(pt.len + dir, 1))
            /* 0 at the edge of sight → 1 within reach, eased. */
            const near = min(1, max(0, (sight - len) / (sight - reach)))
            pt.vis = max(near * near * (3 - 2 * near) * NEAR_VIS, pt.len)
            paintPt(pt)
          })
        },
      }
    }

    /* Spawned on the first frame with a real viewport: a page opened in a
       background tab or a collapsed frame can mount at 0×0. */
    /** @type {ReturnType<typeof spawn>[]} */
    let spiders = []
    let running = false
    let lastMove = 0

    function wake() {
      lastMove = performance.now()
      if (running || document.hidden) return
      running = true
      frame = requestAnimationFrame(anim)
    }

    /** @param {PointerEvent} e */
    const handlePointerMove = (e) => {
      spiders.forEach((spider) => {
        spider.follow(e.clientX, e.clientY)
      })
      wake()
    }

    const handleVisibility = () => {
      if (!document.hidden) wake()
    }

    /** @param {number} t */
    function anim(t) {
      const ratio = min(window.devicePixelRatio || 1, 2)
      if (w !== window.innerWidth || h !== window.innerHeight || dpr !== ratio) {
        const pw = w
        const ph = h
        w = window.innerWidth
        h = window.innerHeight
        dpr = ratio
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        if (w && h) {
          if (!spiders.length) spiders = many(2, spawn)
          else if (pw && ph) spiders.forEach((spider) => spider.rescale(w / pw, h / ph))
        }
      }
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = ctx.fillStyle = ink
      t /= 1000
      spiders.forEach((spider) => spider.tick(t))
      if (document.hidden || performance.now() - lastMove > IDLE_MS) {
        running = false
        return
      }
      frame = requestAnimationFrame(anim)
    }

    function rnd(x = 1, dx = 0) {
      return Math.random() * x + dx
    }

    /** @param {number} x @param {number} y @param {number} r */
    function drawCircle(x, y, r) {
      ctx.beginPath()
      ctx.ellipse(x, y, r, r, 0, 0, PI * 2)
      ctx.fill()
    }

    /** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 */
    function drawLine(x0, y0, x1, y1) {
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      for (let step = 1; step <= 100; step++) {
        const i = step / 100
        const x = lerp(x0, x1, i)
        const y = lerp(y0, y1, i)
        const k = noise(x / 5 + x0, y / 5 + y0) * 2 * SIZE
        ctx.lineTo(x + k, y + k)
      }
      ctx.stroke()
    }

    /**
     * @template T
     * @param {number} n
     * @param {(i: number) => T} f
     * @returns {T[]}
     */
    function many(n, f) {
      return [...Array(n)].map((_, i) => f(i))
    }

    /** @param {number} a @param {number} b @param {number} t */
    function lerp(a, b, t) {
      return a + (b - a) * t
    }

    /** @param {number} x @param {number} y */
    function noise(x, y, t = 101) {
      const w0 = sin(0.3 * x + 1.4 * t + 2.0 + 2.5 * sin(0.4 * y + -1.3 * t + 1.0))
      const w1 = sin(0.2 * y + 1.5 * t + 2.8 + 2.3 * sin(0.5 * x + -1.2 * t + 0.5))
      return w0 + w1
    }

    /** @param {number} x @param {number} y */
    function pt(x, y) {
      return { x, y }
    }

    window.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('visibilitychange', handleVisibility)
    wake()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="spider-cursor"
      style={{ viewTransitionName: 'spider-cursor' }}
    />
  )
}
