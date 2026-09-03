import { useRef, useEffect, useCallback } from 'react'

const DOT_RADIUS = 9
const GRID_SPACING = 46
const PIN_LENGTH = 34
const PIN_GAP = 14

function buildDots(cx, cy) {
  const dots = []
  const gridSize = 4
  const half = (gridSize - 1) / 2

  // Inner 4x4 grid
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      dots.push({
        x: cx + (c - half) * GRID_SPACING,
        y: cy + (r - half) * GRID_SPACING,
        brightness: 0,
        targetBrightness: 0,
        type: 'core',
      })
    }
  }

  const edgeMin = -half * GRID_SPACING
  const edgeMax = half * GRID_SPACING
  const pinPositions = [
    edgeMin + GRID_SPACING * 0.5,
    edgeMin + GRID_SPACING * 1.5,
    edgeMax - GRID_SPACING * 0.5,
  ]

  // Top pins
  pinPositions.forEach(px => {
    dots.push({
      x: cx + px,
      y: cy + edgeMin - PIN_GAP - PIN_LENGTH,
      brightness: 0, targetBrightness: 0, type: 'pin',
    })
  })
  // Bottom pins
  pinPositions.forEach(px => {
    dots.push({
      x: cx + px,
      y: cy + edgeMax + PIN_GAP + PIN_LENGTH,
      brightness: 0, targetBrightness: 0, type: 'pin',
    })
  })
  // Left pins
  pinPositions.forEach(py => {
    dots.push({
      x: cx + edgeMin - PIN_GAP - PIN_LENGTH,
      y: cy + py,
      brightness: 0, targetBrightness: 0, type: 'pin',
    })
  })
  // Right pins
  pinPositions.forEach(py => {
    dots.push({
      x: cx + edgeMax + PIN_GAP + PIN_LENGTH,
      y: cy + py,
      brightness: 0, targetBrightness: 0, type: 'pin',
    })
  })

  return dots
}

function getPinLines(cx, cy) {
  const lines = []
  const gridSize = 4
  const half = (gridSize - 1) / 2
  const edgeMin = -half * GRID_SPACING
  const edgeMax = half * GRID_SPACING
  const pinPositions = [
    edgeMin + GRID_SPACING * 0.5,
    edgeMin + GRID_SPACING * 1.5,
    edgeMax - GRID_SPACING * 0.5,
  ]

  // Top
  pinPositions.forEach(px => {
    lines.push({
      x1: cx + px, y1: cy + edgeMin,
      x2: cx + px, y2: cy + edgeMin - PIN_GAP - PIN_LENGTH + DOT_RADIUS,
    })
  })
  // Bottom
  pinPositions.forEach(px => {
    lines.push({
      x1: cx + px, y1: cy + edgeMax,
      x2: cx + px, y2: cy + edgeMax + PIN_GAP + PIN_LENGTH - DOT_RADIUS,
    })
  })
  // Left
  pinPositions.forEach(py => {
    lines.push({
      x1: cx + edgeMin, y1: cy + py,
      x2: cx + edgeMin - PIN_GAP - PIN_LENGTH + DOT_RADIUS, y2: cy + py,
    })
  })
  // Right
  pinPositions.forEach(py => {
    lines.push({
      x1: cx + edgeMax, y1: cy + py,
      x2: cx + edgeMax + PIN_GAP + PIN_LENGTH - DOT_RADIUS, y2: cy + py,
    })
  })

  return lines
}

export default function TriangleGlow() {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    dots: [],
    lines: [],
    mouse: { x: -9999, y: -9999 },
    isHovering: false,
    hasEnteredOnce: false,
    animId: 0,
    dpr: 1,
    cx: 0,
    cy: 0,
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { dots, lines, mouse, isHovering, dpr } = stateRef.current
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const HOVER_RADIUS = 90
    const FULL_RADIUS = 30

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

    // Draw pin connector lines
    lines.forEach((line, i) => {
      const coreDotIdx = i < 3 ? i : i < 6 ? i - 3 : i < 9 ? i - 6 : i - 9
      const side = i < 3 ? 'top' : i < 6 ? 'bottom' : i < 9 ? 'left' : 'right'
      // Find the brightness of the corresponding pin dot (index 16 + i)
      const pinDot = dots[16 + i]
      const b = pinDot ? pinDot.brightness : 0.2
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.strokeStyle = `rgba(255, 255, 255, ${b * 0.35})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // Draw dots with glow
    dots.forEach(dot => {
      const b = dot.brightness
      if (b < 0.003) return

      const isPin = dot.type === 'pin'
      const scale = isPin ? 0.7 : 1

      ctx.globalCompositeOperation = 'lighter'

      // Layer 1: Ultra-wide atmospheric bloom
      if (b > 0.15) {
        const bloom0R = (120 + b * 60) * scale
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
      const bloom1R = (55 + b * 45) * scale
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
      const bloom2R = (28 + b * 20) * scale
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
      const innerR = (14 + b * 6) * scale
      const g3 = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, innerR)
      g3.addColorStop(0, `rgba(255, 255, 255, ${b * 0.7})`)
      g3.addColorStop(0.5, `rgba(255, 255, 255, ${b * 0.3})`)
      g3.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, innerR, 0, Math.PI * 2)
      ctx.fillStyle = g3
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'

      // Layer 5: Solid core
      const coreR = DOT_RADIUS * scale
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
      const hotR = DOT_RADIUS * 0.42 * scale
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
      const cx = rect.width / 2
      const cy = rect.height / 2
      stateRef.current.cx = cx
      stateRef.current.cy = cy
      stateRef.current.dots = buildDots(cx, cy)
      stateRef.current.lines = getPinLines(cx, cy)
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
      dots.forEach((dot, i) => {
        const delay = i * 25
        setTimeout(() => {
          if (!stateRef.current.isHovering) {
            dot.targetBrightness = 0.38
          }
        }, delay)
      })
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const dots = stateRef.current.dots
    dots.forEach((dot, i) => {
      dot.brightness = 0
      dot.targetBrightness = 0
      setTimeout(() => { dot.targetBrightness = 0.38 }, 200 + i * 40)
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
