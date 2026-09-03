import { useRef, useEffect, useCallback } from 'react'

const DOT_RADIUS = 12
const GRID_SPACING = 62
const PIN_LENGTH = 44
const PIN_GAP = 18
const IDLE_DELAY = 2000

function buildDots(cx, cy) {
  const dots = []
  const gridSize = 4
  const half = (gridSize - 1) / 2

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = cx + (c - half) * GRID_SPACING
      const y = cy + (r - half) * GRID_SPACING
      const distFromCenter = Math.sqrt((c - half) ** 2 + (r - half) ** 2)
      dots.push({
        x, y,
        brightness: 0,
        targetBrightness: 0,
        type: 'core',
        distFromCenter,
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

  const pinDist = 3.2

  // Top pins
  pinPositions.forEach(px => {
    dots.push({
      x: cx + px, y: cy + edgeMin - PIN_GAP - PIN_LENGTH,
      brightness: 0, targetBrightness: 0, type: 'pin', distFromCenter: pinDist,
    })
  })
  // Bottom pins
  pinPositions.forEach(px => {
    dots.push({
      x: cx + px, y: cy + edgeMax + PIN_GAP + PIN_LENGTH,
      brightness: 0, targetBrightness: 0, type: 'pin', distFromCenter: pinDist,
    })
  })
  // Left pins
  pinPositions.forEach(py => {
    dots.push({
      x: cx + edgeMin - PIN_GAP - PIN_LENGTH, y: cy + py,
      brightness: 0, targetBrightness: 0, type: 'pin', distFromCenter: pinDist,
    })
  })
  // Right pins
  pinPositions.forEach(py => {
    dots.push({
      x: cx + edgeMax + PIN_GAP + PIN_LENGTH, y: cy + py,
      brightness: 0, targetBrightness: 0, type: 'pin', distFromCenter: pinDist,
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

  pinPositions.forEach(px => {
    lines.push({ x1: cx + px, y1: cy + edgeMin, x2: cx + px, y2: cy + edgeMin - PIN_GAP - PIN_LENGTH + DOT_RADIUS })
  })
  pinPositions.forEach(px => {
    lines.push({ x1: cx + px, y1: cy + edgeMax, x2: cx + px, y2: cy + edgeMax + PIN_GAP + PIN_LENGTH - DOT_RADIUS })
  })
  pinPositions.forEach(py => {
    lines.push({ x1: cx + edgeMin, y1: cy + py, x2: cx + edgeMin - PIN_GAP - PIN_LENGTH + DOT_RADIUS, y2: cy + py })
  })
  pinPositions.forEach(py => {
    lines.push({ x1: cx + edgeMax, y1: cy + py, x2: cx + edgeMax + PIN_GAP + PIN_LENGTH - DOT_RADIUS, y2: cy + py })
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
    animId: 0,
    dpr: 1,
    cx: 0,
    cy: 0,
    lastMoveTime: 0,
    idlePhase: 'none',    // 'none' | 'ripple-out' | 'ripple-in' | 'pause'
    idleStartTime: 0,
    idleCycleTime: 0,
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const st = stateRef.current
    const { dots, lines, mouse, isHovering, dpr, cx, cy } = st
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    const now = performance.now()

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // --- Idle animation logic ---
    const timeSinceMove = now - st.lastMoveTime
    const shouldIdle = !isHovering && timeSinceMove > IDLE_DELAY && st.lastMoveTime > 0

    if (shouldIdle && st.idlePhase === 'none') {
      st.idlePhase = 'ripple-out'
      st.idleCycleTime = now
    }
    if (isHovering && st.idlePhase !== 'none') {
      st.idlePhase = 'none'
    }

    // Max distance from center for normalization
    const maxDist = 3.2

    // Idle ripple animation
    if (st.idlePhase !== 'none') {
      const elapsed = now - st.idleCycleTime
      const cycleDuration = 1800
      const pauseDuration = 600

      if (st.idlePhase === 'ripple-out') {
        const progress = Math.min(elapsed / cycleDuration, 1)
        dots.forEach(dot => {
          const normDist = dot.distFromCenter / maxDist
          const wave = Math.max(0, 1 - Math.abs(normDist - progress) * 3)
          dot.targetBrightness = 0.08 + wave * 0.92
        })
        if (progress >= 1) {
          st.idlePhase = 'pause-out'
          st.idleCycleTime = now
        }
      } else if (st.idlePhase === 'pause-out') {
        dots.forEach(dot => { dot.targetBrightness = 0.9 })
        if (elapsed > pauseDuration) {
          st.idlePhase = 'ripple-in'
          st.idleCycleTime = now
        }
      } else if (st.idlePhase === 'ripple-in') {
        const progress = Math.min(elapsed / cycleDuration, 1)
        dots.forEach(dot => {
          const normDist = dot.distFromCenter / maxDist
          const invertDist = 1 - normDist
          const wave = Math.max(0, 1 - Math.abs(invertDist - progress) * 3)
          dot.targetBrightness = 0.08 + wave * 0.92
        })
        if (progress >= 1) {
          st.idlePhase = 'pause-in'
          st.idleCycleTime = now
        }
      } else if (st.idlePhase === 'pause-in') {
        dots.forEach(dot => { dot.targetBrightness = 0.15 })
        if (elapsed > pauseDuration) {
          st.idlePhase = 'ripple-out'
          st.idleCycleTime = now
        }
      }
    } else {
      // --- Normal hover logic ---
      const HOVER_RADIUS = 58
      const FULL_RADIUS = 16

      let anyNearby = false
      dots.forEach(dot => {
        if (isHovering) {
          const dx = mouse.x - dot.x
          const dy = mouse.y - dot.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < HOVER_RADIUS) {
            anyNearby = true
            const t = Math.max(0, 1 - Math.max(0, dist - FULL_RADIUS) / (HOVER_RADIUS - FULL_RADIUS))
            dot.targetBrightness = 0.03 + Math.pow(t, 0.4) * 0.97
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
    }

    // Smooth lerp
    dots.forEach(dot => {
      const speed = dot.targetBrightness > dot.brightness ? 0.18 : 0.07
      dot.brightness += (dot.targetBrightness - dot.brightness) * speed
    })

    // --- Background glow ---
    // Large radial ambient glow behind the chip
    const avgBrightness = dots.reduce((s, d) => s + d.brightness, 0) / dots.length
    const bgGlowR = 220 + avgBrightness * 80
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bgGlowR)
    bgGrad.addColorStop(0, `rgba(255, 255, 255, ${avgBrightness * 0.08})`)
    bgGrad.addColorStop(0.25, `rgba(255, 255, 255, ${avgBrightness * 0.04})`)
    bgGrad.addColorStop(0.5, `rgba(255, 255, 255, ${avgBrightness * 0.015})`)
    bgGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.beginPath()
    ctx.arc(cx, cy, bgGlowR, 0, Math.PI * 2)
    ctx.fillStyle = bgGrad
    ctx.fill()

    // Directional light rays from bright dots
    dots.forEach(dot => {
      if (dot.brightness < 0.5) return
      const b = dot.brightness
      const dx = dot.x - cx
      const dy = dot.y - cy
      const angle = Math.atan2(dy, dx)
      const rayLen = 60 + b * 100
      const rayWidth = 8 + b * 12

      ctx.save()
      ctx.translate(dot.x, dot.y)
      ctx.rotate(angle)

      const rayGrad = ctx.createLinearGradient(0, 0, rayLen, 0)
      rayGrad.addColorStop(0, `rgba(255, 255, 255, ${(b - 0.5) * 0.15})`)
      rayGrad.addColorStop(0.3, `rgba(255, 255, 255, ${(b - 0.5) * 0.06})`)
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.beginPath()
      ctx.moveTo(0, -rayWidth / 2)
      ctx.lineTo(rayLen, -rayWidth * 0.15)
      ctx.lineTo(rayLen, rayWidth * 0.15)
      ctx.lineTo(0, rayWidth / 2)
      ctx.closePath()
      ctx.fillStyle = rayGrad
      ctx.fill()

      ctx.restore()
    })

    // --- Pin connector lines ---
    lines.forEach((line, i) => {
      const pinDot = dots[16 + i]
      const b = pinDot ? pinDot.brightness : 0.2
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.strokeStyle = `rgba(255, 255, 255, ${b * 0.35})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // --- Draw dots with glow ---
    dots.forEach(dot => {
      const b = dot.brightness
      if (b < 0.003) return

      const isPin = dot.type === 'pin'
      const scale = isPin ? 0.7 : 1

      ctx.globalCompositeOperation = 'lighter'

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

      const hotR = DOT_RADIUS * 0.42 * scale
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, hotR, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(b * 2, 1)})`
      ctx.fill()
    })

    ctx.restore()
    st.animId = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const st = stateRef.current

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      st.dpr = dpr
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      st.cx = rect.width / 2
      st.cy = rect.height / 2
      st.dots = buildDots(st.cx, st.cy)
      st.lines = getPinLines(st.cx, st.cy)
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      st.mouse.x = e.clientX - rect.left
      st.mouse.y = e.clientY - rect.top
      st.isHovering = true
      st.lastMoveTime = performance.now()
      st.idlePhase = 'none'
    }

    const onMouseLeave = () => {
      st.isHovering = false
      st.lastMoveTime = performance.now()
      const dots = st.dots
      dots.forEach((dot, i) => {
        const delay = i * 25
        setTimeout(() => {
          if (!st.isHovering) dot.targetBrightness = 0.38
        }, delay)
      })
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // Animate in on mount
    st.dots.forEach((dot, i) => {
      dot.brightness = 0
      dot.targetBrightness = 0
      setTimeout(() => { dot.targetBrightness = 0.38 }, 200 + i * 40)
    })

    // Kick off idle animation after initial entrance
    st.lastMoveTime = performance.now() + 2500

    st.animId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(st.animId)
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
