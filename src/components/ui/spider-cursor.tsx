"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/* Two spiders that walk after the pointer, drawn in the site's --ink (a token
   in index.css) on a transparent canvas, so they read as ink on the paper.

   The canvas lies on the page ground, beneath everything else: text, cards,
   buttons and the nav all sit on top of it. It paints just above whatever
   paints the paper in its stacking context — body on most pages; the course
   page paints its own, so it mounts one inside .learn-app. It never takes a
   click. Under reduced motion it draws nothing.

   The web's anchor points stay out of sight until a spider comes near one:
   inside SIGHT a point fades in, small and faint; when a leg reaches it, it
   turns full ink and the leg connects it to the spider's edge. As the spider
   walks on the leg lets go and the point fades away again. */

type Anchor = { x: number; y: number; len: number; vis: number }

/* Where the pointer last was, so a spider mounted by a new page walks
   straight to it instead of waiting for the next move. */
let lastPointer: { x: number; y: number } | null = null

const REACH = 1 / 10 // a leg can take hold of a point this close (× viewport width)
const SIGHT = 1.6 // a point starts to show at this multiple of REACH
const NEAR_VIS = 0.45 // how far a point can bolden before a leg takes it

export function SpiderCursor({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let w = 0,
      h = 0,
      dpr = 1,
      frame = 0
    const ctx = canvas.getContext("2d")!
    const { sin, cos, PI, hypot, min, max } = Math

    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()

    function spawn() {
      const pts = many<Anchor>(333, () => {
        return {
          x: rnd(window.innerWidth),
          y: rnd(window.innerHeight),
          len: 0,
          vis: 0,
        }
      })

      const pts2 = many(9, (i) => {
        return {
          x: cos((i / 9) * PI * 2),
          y: sin((i / 9) * PI * 2),
        }
      })

      const seed = rnd(100)
      let tx = lastPointer ? lastPointer.x : rnd(window.innerWidth)
      let ty = lastPointer ? lastPointer.y : rnd(window.innerHeight)
      let x = rnd(window.innerWidth)
      let y = rnd(window.innerHeight)
      const kx = rnd(0.5, 0.5)
      const ky = rnd(0.5, 0.5)
      const walkRadius = pt(rnd(50, 50), rnd(50, 50))
      const r = window.innerWidth / rnd(100, 150)

      function paintPt(pt: Anchor) {
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
        drawCircle(pt.x, pt.y, 1 + 2 * pt.vis)
        ctx.globalAlpha = 1
      }

      return {
        follow(x: number, y: number) {
          tx = x
          ty = y
        },

        /* The window changed size: stretch the web's anchors to cover it. */
        rescale(sx: number, sy: number) {
          pts.forEach((pt) => {
            pt.x *= sx
            pt.y *= sy
          })
        },

        tick(t: number) {
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
            const dx = pt.x - x,
              dy = pt.y - y
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
    let spiders: ReturnType<typeof spawn>[] = []

    const handlePointerMove = (e: PointerEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY }
      spiders.forEach((spider) => {
        spider.follow(e.clientX, e.clientY)
      })
    }

    function anim(t: number) {
      const ratio = min(window.devicePixelRatio || 1, 2)
      if (w !== window.innerWidth || h !== window.innerHeight || dpr !== ratio) {
        const pw = w,
          ph = h
        w = window.innerWidth
        h = window.innerHeight
        dpr = ratio
        canvas!.width = w * dpr
        canvas!.height = h * dpr
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
      frame = requestAnimationFrame(anim)
    }

    function rnd(x = 1, dx = 0) {
      return Math.random() * x + dx
    }

    function drawCircle(x: number, y: number, r: number) {
      ctx.beginPath()
      ctx.ellipse(x, y, r, r, 0, 0, PI * 2)
      ctx.fill()
    }

    function drawLine(x0: number, y0: number, x1: number, y1: number) {
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      for (let step = 1; step <= 100; step++) {
        const i = step / 100
        const x = lerp(x0, x1, i)
        const y = lerp(y0, y1, i)
        const k = noise(x / 5 + x0, y / 5 + y0) * 2
        ctx.lineTo(x + k, y + k)
      }
      ctx.stroke()
    }

    function many<T>(n: number, f: (i: number) => T): T[] {
      return [...Array(n)].map((_, i) => f(i))
    }

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t
    }

    function noise(x: number, y: number, t = 101) {
      const w0 = sin(0.3 * x + 1.4 * t + 2.0 + 2.5 * sin(0.4 * y + -1.3 * t + 1.0))
      const w1 = sin(0.2 * y + 1.5 * t + 2.8 + 2.3 * sin(0.5 * x + -1.2 * t + 0.5))
      return w0 + w1
    }

    function pt(x: number, y: number) {
      return { x, y }
    }

    window.addEventListener("pointermove", handlePointerMove)
    frame = requestAnimationFrame(anim)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-1 block h-full w-full",
        className,
      )}
    />
  )
}
