import { useRef, useEffect, useCallback } from 'react'

const DOT_RADIUS = 8
const SPACING_X = 40
const SPACING_Y = 35

function buildDots(cx, cy) {
  const rows = [1, 2, 3, 4]
  const dots = []
  rows.forEach((count, row) => {
    const startX = cx - ((count - 1) / 2) * SPACING_X
    for (let col = 0; col < count; col++) {
      dots.push({
        x: startX + col * SPACING_X,
        y: cy + row * SPACING_Y,
        brightness: 0,
        targetBrightness: 0,
        row,
        col,
      })
    }
  })
  return dots
}

export default function TriangleGlow() {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    dots: [],
    mouse: { x: -9999, y: -9999 },
    isHovering: false,
    hasEnteredOnce: false,
    animId: 0,
    dpr: 1,
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { dots, mouse, isHovering, hasEnteredOnce, dpr } = stateRef.current
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const HOVER_RADIUS = 85
    const FULL_RADIUS = 28

    let anyNearby = false
    dots.forEach(dot => {
      if (isHovering) {
        const dx = mouse.x - dot.x
        const dy = mouse.y - dot.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < HOVER_RADIUS) {
          anyNearby = true
          const t = Math.max(0, 1 - Math.max(0, dist - FULL_RADIUS) / (HOVER_RADIUS - FULL_RADIUS))
          dot.targetBrightness = 0.03 + Math.pow(t, 0.5) * 0.97
        } else {
          dot.targetBrightness = 0.03
        }
      } else if (!hasEnteredOnce) {
        dot.targetBrightness = 0.38
      } else {
        dot.targetBrightness = 0.38
      }
    })

    if (isHovering && !anyNearby) {
      dots.forEach(dot => { dot.targetBrightness = 0.06 })
    }

    dots.forEach(dot => {
      const speed = dot.targetBrightness > dot.brightness ? 0.15 : 0.05
      dot.brightness += (dot.targetBrightness - dot.brightness) * speed
    })

    dots.forEach(dot => {
      const b = dot.brightness
      if (b < 0.003) return

      // Additive blending for glow layers
      ctx.globalCompositeOperation = 'lighter'

      // Layer 1: Ultra-wide atmospheric bloom (only visible when bright)
      if (b > 0.15) {
        const bloom0R = 120 + b * 60
        const g0 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, bloom0R)
        g0.addColorStop(0, `rgba(255, 255, 255, ${(b - 0.15) * 0.12})`)
        g0.addColorStop(0.2, `rgba(255, 255, 255, ${(b - 0.15) * 0.05})`)
        g0.addColorStop(0.5, `rgba(255, 255, 255, ${(b - 0.15) * 0.015})`)
        g0.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, bloom0R, 0, Math.PI * 2)
        ctx.fillStyle = g0
        ctx.fill()
      }

      // Layer 2: Wide bloom halo
      const bloom1R = 55 + b * 45
      const g1 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, bloom1R)
      g1.addColorStop(0, `rgba(255, 255, 255, ${b * 0.22})`)
      g1.addColorStop(0.2, `rgba(255, 255, 255, ${b * 0.1})`)
      g1.addColorStop(0.5, `rgba(255, 255, 255, ${b * 0.03})`)
      g1.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, bloom1R, 0, Math.PI * 2)
      ctx.fillStyle = g1
      ctx.fill()

      // Layer 3: Medium glow
      const bloom2R = 28 + b * 20
      const g2 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, bloom2R)
      g2.addColorStop(0, `rgba(255, 255, 255, ${b * 0.45})`)
      g2.addColorStop(0.3, `rgba(255, 255, 255, ${b * 0.18})`)
      g2.addColorStop(0.7, `rgba(255, 255, 255, ${b * 0.04})`)
      g2.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, bloom2R, 0, Math.PI * 2)
      ctx.fillStyle = g2
      ctx.fill()

      // Layer 4: Tight inner glow
      const innerR = 14 + b * 6
      const g3 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, innerR)
      g3.addColorStop(0, `rgba(255, 255, 255, ${b * 0.7})`)
      g3.addColorStop(0.5, `rgba(255, 255, 255, ${b * 0.3})`)
      g3.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, innerR, 0, Math.PI * 2)
      ctx.fillStyle = g3
      ctx.fill()

      // Normal blending for solid core
      ctx.globalCompositeOperation = 'source-over'

      // Layer 5: Solid core circle
      const coreR = DOT_RADIUS
      const coreAlpha = Math.min(b * 1.8, 1)
      const g4 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, coreR)
      g4.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`)
      g4.addColorStop(0.65, `rgba(255, 255, 255, ${coreAlpha * 0.85})`)
      g4.addColorStop(1, `rgba(255, 255, 255, ${coreAlpha * 0.1})`)
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, coreR, 0, Math.PI * 2)
      ctx.fillStyle = g4
      ctx.fill()

      // Layer 6: White-hot center
      const hotR = DOT_RADIUS * 0.42
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, hotR, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(b * 2, 1)})`
      ctx.fill()
    })

    ctx.restore()
    stateRef.current.animId = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      stateRef.current.dpr = dpr
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      stateRef.current.dots = buildDots(rect.width / 2, (rect.height / 2) - SPACING_Y * 1.8)
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      stateRef.current.mouse.x = e.clientX - rect.left
      stateRef.current.mouse.y = e.clientY - rect.top
      stateRef.current.isHovering = true
      stateRef.current.hasEnteredOnce = true
    }

    const onMouseLeave = () => {
      stateRef.current.isHovering = false
      const dots = stateRef.current.dots
      let idx = 0
      ;[1, 2, 3, 4].forEach((count, rowIdx) => {
        for (let c = 0; c < count; c++) {
          const dot = dots[idx++]
          const delay = rowIdx * 70 + c * 35
          setTimeout(() => {
            if (!stateRef.current.isHovering) {
              dot.targetBrightness = 0.38
            }
          }, delay)
        }
      })
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // Animate in on mount
    const dots = stateRef.current.dots
    dots.forEach((dot, i) => {
      dot.brightness = 0
      dot.targetBrightness = 0
      setTimeout(() => { dot.targetBrightness = 0.38 }, 200 + i * 60)
    })

    stateRef.current.animId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(stateRef.current.animId)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'default' }}
      aria-hidden="true"
    />
  )
}
