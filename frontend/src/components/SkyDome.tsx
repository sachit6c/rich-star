import { useRef, useEffect, useCallback } from 'react'
import type { Location } from '../types'
import { fetchSky } from '../api'

interface StarPoint {
  hip: number
  name: string
  magnitude: number
  az: number
  alt: number
  constellation: string
}

interface MockLine {
  from: string
  to: string
  constellation: string
}

const MOCK_STARS: StarPoint[] = [
  // Orion
  { hip: 27989, name: 'Betelgeuse',  magnitude: 0.42,  az: 222, alt: 55, constellation: 'ORI' },
  { hip: 24436, name: 'Rigel',       magnitude: 0.12,  az: 238, alt: 38, constellation: 'ORI' },
  { hip: 26311, name: 'Alnilam',     magnitude: 1.69,  az: 230, alt: 46, constellation: 'ORI' },
  { hip: 26727, name: 'Alnitak',     magnitude: 1.74,  az: 234, alt: 44, constellation: 'ORI' },
  { hip: 25930, name: 'Mintaka',     magnitude: 2.25,  az: 226, alt: 47, constellation: 'ORI' },
  { hip: 27366, name: 'Saiph',       magnitude: 2.06,  az: 242, alt: 42, constellation: 'ORI' },
  { hip: 25428, name: 'Bellatrix',   magnitude: 1.64,  az: 218, alt: 53, constellation: 'ORI' },
  // Canis Major
  { hip: 32349, name: 'Sirius',      magnitude: -1.46, az: 180, alt: 40, constellation: 'CMA' },
  { hip: 33579, name: 'Adhara',      magnitude: 1.50,  az: 186, alt: 30, constellation: 'CMA' },
  { hip: 34444, name: 'Wezen',       magnitude: 1.83,  az: 174, alt: 28, constellation: 'CMA' },
  // Lyra
  { hip: 91262, name: 'Vega',        magnitude: 0.03,  az: 55,  alt: 72, constellation: 'LYR' },
  { hip: 92420, name: 'Sheliak',     magnitude: 3.52,  az: 58,  alt: 68, constellation: 'LYR' },
  { hip: 93194, name: 'Sulafat',     magnitude: 3.24,  az: 62,  alt: 70, constellation: 'LYR' },
  // Cygnus
  { hip: 102098, name: 'Deneb',      magnitude: 1.25,  az: 32,  alt: 65, constellation: 'CYG' },
  { hip: 98110,  name: 'Sadr',       magnitude: 2.23,  az: 30,  alt: 60, constellation: 'CYG' },
  { hip: 95947,  name: 'Albireo',    magnitude: 3.18,  az: 25,  alt: 55, constellation: 'CYG' },
  // Scorpius
  { hip: 80763,  name: 'Antares',    magnitude: 1.09,  az: 160, alt: 22, constellation: 'SCO' },
  { hip: 82729,  name: 'Shaula',     magnitude: 1.62,  az: 168, alt: 15, constellation: 'SCO' },
  // Ursa Major
  { hip: 53910,  name: 'Alioth',     magnitude: 1.76,  az: 340, alt: 62, constellation: 'UMA' },
  { hip: 54061,  name: 'Dubhe',      magnitude: 1.79,  az: 330, alt: 70, constellation: 'UMA' },
  { hip: 55203,  name: 'Merak',      magnitude: 2.37,  az: 335, alt: 65, constellation: 'UMA' },
  { hip: 58001,  name: 'Alkaid',     magnitude: 1.85,  az: 345, alt: 58, constellation: 'UMA' },
  // Gemini
  { hip: 37826,  name: 'Pollux',     magnitude: 1.14,  az: 102, alt: 50, constellation: 'GEM' },
  { hip: 36850,  name: 'Castor',     magnitude: 1.58,  az: 98,  alt: 55, constellation: 'GEM' },
  // Taurus
  { hip: 21421,  name: 'Aldebaran',  magnitude: 0.85,  az: 260, alt: 45, constellation: 'TAU' },
  { hip: 17702,  name: 'Pleiades 1', magnitude: 2.87,  az: 275, alt: 52, constellation: 'TAU' },
  // Aquila
  { hip: 97649,  name: 'Altair',     magnitude: 0.77,  az: 80,  alt: 50, constellation: 'AQL' },
  { hip: 97278,  name: 'Tarazed',    magnitude: 2.72,  az: 78,  alt: 54, constellation: 'AQL' },
  // Perseus / Auriga area
  { hip: 24608,  name: 'Capella',    magnitude: 0.08,  az: 305, alt: 58, constellation: 'AUR' },
  // Leo
  { hip: 49669,  name: 'Regulus',    magnitude: 1.35,  az: 130, alt: 42, constellation: 'LEO' },
]

// Constellation line definitions (name → name pairs)
const MOCK_LINES: MockLine[] = [
  // Orion
  { from: 'Betelgeuse', to: 'Bellatrix',  constellation: 'ORI' },
  { from: 'Betelgeuse', to: 'Alnitak',    constellation: 'ORI' },
  { from: 'Bellatrix',  to: 'Mintaka',    constellation: 'ORI' },
  { from: 'Mintaka',    to: 'Alnilam',    constellation: 'ORI' },
  { from: 'Alnilam',    to: 'Alnitak',    constellation: 'ORI' },
  { from: 'Alnitak',    to: 'Saiph',      constellation: 'ORI' },
  { from: 'Mintaka',    to: 'Rigel',      constellation: 'ORI' },
  { from: 'Rigel',      to: 'Saiph',      constellation: 'ORI' },
  // Canis Major
  { from: 'Sirius',     to: 'Adhara',     constellation: 'CMA' },
  { from: 'Sirius',     to: 'Wezen',      constellation: 'CMA' },
  // Lyra
  { from: 'Vega',       to: 'Sheliak',    constellation: 'LYR' },
  { from: 'Vega',       to: 'Sulafat',    constellation: 'LYR' },
  { from: 'Sheliak',    to: 'Sulafat',    constellation: 'LYR' },
  // Cygnus
  { from: 'Deneb',      to: 'Sadr',       constellation: 'CYG' },
  { from: 'Sadr',       to: 'Albireo',    constellation: 'CYG' },
  // Scorpius
  { from: 'Antares',    to: 'Shaula',     constellation: 'SCO' },
  // Ursa Major
  { from: 'Dubhe',      to: 'Merak',      constellation: 'UMA' },
  { from: 'Merak',      to: 'Alioth',     constellation: 'UMA' },
  { from: 'Alioth',     to: 'Alkaid',     constellation: 'UMA' },
  // Gemini
  { from: 'Castor',     to: 'Pollux',     constellation: 'GEM' },
  // Aquila
  { from: 'Altair',     to: 'Tarazed',    constellation: 'AQL' },
]

// Background star field (many dim stars for atmosphere)
const BG_STARS: Array<{ az: number; alt: number; mag: number }> = Array.from({ length: 200 }, (_, i) => ({
  az: (i * 137.508) % 360,
  alt: 10 + ((i * 73.1) % 80),
  mag: 3.5 + (i % 3) * 0.8
}))

interface Props {
  location: Location
  dateTime: Date
  onConstellationSelect: (iau: string) => void
}

// Convert az/alt to canvas XY in azimuthal equidistant projection
function azAltToXY(
  az: number,
  alt: number,
  centerX: number,
  centerY: number,
  scale: number,
  azOffset: number
): [number, number] {
  const adjAz = ((az + azOffset) % 360) * (Math.PI / 180)
  const r = ((90 - alt) / 90) * scale
  const x = centerX + r * Math.sin(adjAz)
  const y = centerY - r * Math.cos(adjAz)
  return [x, y]
}

// Star visual size from magnitude
function starRadius(mag: number): number {
  if (mag < -1)   return 5.0
  if (mag < 0)    return 4.2
  if (mag < 1)    return 3.4
  if (mag < 2)    return 2.6
  if (mag < 3)    return 1.8
  if (mag < 4)    return 1.2
  return 0.8
}

// Star color from magnitude (bright = blue-white, dim = yellow-orange)
function starColor(mag: number): string {
  if (mag < 0) return '#cce8ff'
  if (mag < 1) return '#e8f4ff'
  if (mag < 2) return '#fff8f0'
  if (mag < 3) return '#fff4e0'
  return '#ffe8c8'
}

export default function SkyDome({ location, dateTime, onConstellationSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    azOffset: 0,
    scale: 0,
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    downX: 0,
    downY: 0,
    pinchDist: 0,
    rafId: 0,
    time: 0,
    highlightedConst: null as string | null,
    highlightOpacity: 0,
    stars: MOCK_STARS as StarPoint[],
    constellationLines: {} as Record<string, number[][]>
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current
    const { width, height, centerX, centerY, scale, azOffset, time } = s

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Sky background gradient
    const skyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale)
    skyGrad.addColorStop(0, '#0a1628')
    skyGrad.addColorStop(0.5, '#060e1e')
    skyGrad.addColorStop(1, '#030810')
    ctx.fillStyle = skyGrad
    ctx.beginPath()
    ctx.arc(centerX, centerY, scale, 0, Math.PI * 2)
    ctx.fill()

    // Horizon fade ring
    const fadeGrad = ctx.createRadialGradient(centerX, centerY, scale * 0.75, centerX, centerY, scale)
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)')
    fadeGrad.addColorStop(1, 'rgba(3,8,16,0.92)')
    ctx.fillStyle = fadeGrad
    ctx.beginPath()
    ctx.arc(centerX, centerY, scale, 0, Math.PI * 2)
    ctx.fill()

    // Clip to dome circle for everything inside
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, scale, 0, Math.PI * 2)
    ctx.clip()

    // Draw background dim stars
    for (const bs of BG_STARS) {
      if (bs.alt < 0) continue
      const [x, y] = azAltToXY(bs.az, bs.alt, centerX, centerY, scale, azOffset)
      const twinkle = 0.4 + 0.6 * Math.sin(time * 0.001 + bs.az * 0.1 + bs.alt * 0.07)
      const alpha = 0.15 + 0.35 * twinkle
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#c8d8f0'
      ctx.beginPath()
      ctx.arc(x, y, 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Determine highlighted constellation
    const hc = s.highlightedConst
    const stars = s.stars

    // Build HIP → canvas coords map for constellation lines
    const hipMap = new Map<number, [number, number]>()
    for (const star of stars) {
      const [x, y] = azAltToXY(star.az, star.alt, centerX, centerY, scale, azOffset)
      hipMap.set(star.hip, [x, y])
    }

    // Draw constellation lines (HIP-pair based from API, fallback to MOCK_LINES)
    if (Object.keys(s.constellationLines).length > 0) {
      for (const [iau, pairs] of Object.entries(s.constellationLines)) {
        const isHighlighted = hc === iau
        for (const [hip1, hip2] of pairs) {
          const p1 = hipMap.get(hip1)
          const p2 = hipMap.get(hip2)
          if (!p1 || !p2) continue
          ctx.save()
          ctx.globalAlpha = isHighlighted ? 0.7 : 0.18
          ctx.strokeStyle = isHighlighted ? '#818cf8' : '#6b7f9e'
          ctx.lineWidth = isHighlighted ? 1.2 : 0.7
          ctx.setLineDash(isHighlighted ? [] : [3, 4])
          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.stroke()
          ctx.restore()
        }
      }
    } else {
      // Fallback: use MOCK_LINES (name-based) while API data hasn't loaded
      const starNameMap = new Map(stars.map((st) => [st.name, st]))
      for (const line of MOCK_LINES) {
        const s1 = starNameMap.get(line.from)
        const s2 = starNameMap.get(line.to)
        if (!s1 || !s2 || s1.alt < 0 || s2.alt < 0) continue
        const [x1, y1] = azAltToXY(s1.az, s1.alt, centerX, centerY, scale, azOffset)
        const [x2, y2] = azAltToXY(s2.az, s2.alt, centerX, centerY, scale, azOffset)
        const isHighlighted = hc === line.constellation
        ctx.save()
        ctx.globalAlpha = isHighlighted ? 0.7 : 0.18
        ctx.strokeStyle = isHighlighted ? '#818cf8' : '#6b7f9e'
        ctx.lineWidth = isHighlighted ? 1.2 : 0.7
        ctx.setLineDash(isHighlighted ? [] : [3, 4])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.restore()
      }
    }

    // Draw named stars
    for (const star of stars) {
      if (star.alt < 0) continue
      const [x, y] = azAltToXY(star.az, star.alt, centerX, centerY, scale, azOffset)

      const isHighlightedStar = hc === star.constellation
      const r = starRadius(star.magnitude)
      const twinkle = 0.75 + 0.25 * Math.sin(time * 0.0015 + star.hip * 0.0023)

      // Glow for bright stars
      if (star.magnitude < 2) {
        const glowR = r * (isHighlightedStar ? 5 : 4)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR)
        grad.addColorStop(0, isHighlightedStar ? 'rgba(160,170,255,0.5)' : 'rgba(180,210,255,0.3)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = twinkle * (isHighlightedStar ? 1.2 : 0.8)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, glowR, 0, Math.PI * 2)
        ctx.fill()
      }

      // Star body
      ctx.globalAlpha = isHighlightedStar ? 1 : 0.88 * twinkle
      ctx.fillStyle = isHighlightedStar ? '#c8d8ff' : starColor(star.magnitude)
      ctx.beginPath()
      ctx.arc(x, y, r * (isHighlightedStar ? 1.3 : 1), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      // Label for bright or highlighted stars
      if (star.magnitude < 1.5 || isHighlightedStar) {
        const labelAlpha = isHighlightedStar ? 0.95 : 0.55
        ctx.globalAlpha = labelAlpha
        ctx.fillStyle = isHighlightedStar ? '#c8d4f8' : '#8899bb'
        ctx.font = `${isHighlightedStar ? 600 : 400} ${isHighlightedStar ? 11 : 9}px Inter, sans-serif`
        ctx.fillText(star.name, x + r + 4, y + 4)
        ctx.globalAlpha = 1
      }
    }

    ctx.restore() // end dome clip

    // Dome border ring
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = '#2a3a5a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(centerX, centerY, scale, 0, Math.PI * 2)
    ctx.stroke()

    // Subtle inner ring at 30 degrees altitude
    ctx.globalAlpha = 0.08
    ctx.setLineDash([2, 6])
    ctx.strokeStyle = '#8899cc'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(centerX, centerY, scale * (60 / 90), 0, Math.PI * 2)
    ctx.stroke()

    // Zenith crosshair
    ctx.globalAlpha = 0.12
    ctx.setLineDash([])
    ctx.strokeStyle = '#8899cc'
    ctx.lineWidth = 0.5
    const zh = 10
    ctx.beginPath()
    ctx.moveTo(centerX - zh, centerY)
    ctx.lineTo(centerX + zh, centerY)
    ctx.moveTo(centerX, centerY - zh)
    ctx.lineTo(centerX, centerY + zh)
    ctx.stroke()

    ctx.restore()

    // Compass labels
    const compassDirs = [
      { label: 'N', az: 0 },
      { label: 'E', az: 90 },
      { label: 'S', az: 180 },
      { label: 'W', az: 270 },
      { label: 'NE', az: 45 },
      { label: 'SE', az: 135 },
      { label: 'SW', az: 225 },
      { label: 'NW', az: 315 }
    ]

    ctx.font = '600 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const { label, az } of compassDirs) {
      const adjAz = ((az + azOffset) % 360) * (Math.PI / 180)
      const r2 = scale + 20
      const x = centerX + r2 * Math.sin(adjAz)
      const y = centerY - r2 * Math.cos(adjAz)
      const isCardinal = label.length === 1

      ctx.globalAlpha = isCardinal ? 0.7 : 0.35
      ctx.fillStyle = isCardinal ? '#94a3c8' : '#4a5a7a'
      ctx.font = `600 ${isCardinal ? 11 : 9}px Inter, sans-serif`
      ctx.fillText(label, x, y)
    }
    ctx.globalAlpha = 1

    // Constellation name label on highlight
    if (hc) {
      const constStars = stars.filter((st) => st.constellation === hc && st.alt > 0)
      if (constStars.length > 0) {
        let sumX = 0; let sumY = 0
        for (const st of constStars) {
          const [sx, sy] = azAltToXY(st.az, st.alt, centerX, centerY, scale, azOffset)
          sumX += sx; sumY += sy
        }
        const lx = sumX / constStars.length
        const ly = sumY / constStars.length - 24

        ctx.font = `500 13px "Cinzel", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = 0.9
        ctx.fillStyle = '#c8d4f8'
        ctx.fillText(hc, lx, ly)
        ctx.globalAlpha = 1
      }
    }
  }, [])

  const animate = useCallback(() => {
    stateRef.current.time = performance.now()
    draw()
    stateRef.current.rafId = requestAnimationFrame(animate)
  }, [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      s.width = canvas.width
      s.height = canvas.height
      s.centerX = canvas.width / 2
      s.centerY = canvas.height / 2
      // Scale: slightly smaller than min(w, h)/2 to leave compass label room
      s.scale = Math.min(s.width, s.height) / 2 - 36 * devicePixelRatio
    }

    const ro = new ResizeObserver(() => {
      resize()
    })
    ro.observe(canvas)
    resize()

    // --- Interaction ---

    function getPos(e: MouseEvent | Touch): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect()
      return {
        x: (('clientX' in e ? e.clientX : e.clientX) - rect.left) * devicePixelRatio,
        y: (('clientY' in e ? e.clientY : e.clientY) - rect.top) * devicePixelRatio
      }
    }

    function findNearestStar(x: number, y: number): StarPoint | null {
      let best: StarPoint | null = null
      let bestDist = 30 * devicePixelRatio // 30px threshold
      for (const star of stateRef.current.stars) {
        if (star.alt < 0) continue
        const [sx, sy] = azAltToXY(star.az, star.alt, s.centerX, s.centerY, s.scale, s.azOffset)
        const d = Math.hypot(x - sx, y - sy)
        if (d < bestDist) {
          bestDist = d
          best = star
        }
      }
      return best
    }

    function onMouseDown(e: MouseEvent) {
      const { x, y } = getPos(e)
      s.dragging = true
      s.lastX = x
      s.lastY = y
      s.downX = x
      s.downY = y
    }

    function onMouseMove(e: MouseEvent) {
      if (!s.dragging) return
      const { x, y } = getPos(e)
      const dx = x - s.lastX
      const dAz = (-dx / s.scale) * (180 / Math.PI) * 0.7
      s.azOffset = (s.azOffset + dAz + 360) % 360
      s.lastX = x
      s.lastY = y
    }

    function onMouseUp(e: MouseEvent) {
      if (!s.dragging) return
      s.dragging = false
      const { x, y } = getPos(e)
      const moved = Math.hypot(x - s.downX, y - s.downY)
      if (moved < 8 * devicePixelRatio) {
        const star = findNearestStar(x, y)
        if (star) {
          s.highlightedConst = star.constellation
          onConstellationSelect(star.constellation)
        } else {
          s.highlightedConst = null
        }
      }
    }

    // Touch handling
    let lastTouchDist = 0

    function getTouchDist(e: TouchEvent): number {
      if (e.touches.length < 2) return 0
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2) {
        lastTouchDist = getTouchDist(e)
        s.dragging = false
        return
      }
      const t = e.touches[0]
      const { x, y } = getPos(t)
      s.dragging = true
      s.lastX = x
      s.lastY = y
      s.downX = x
      s.downY = y
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2) {
        const dist = getTouchDist(e)
        if (lastTouchDist > 0) {
          const ratio = dist / lastTouchDist
          s.scale = Math.min(Math.max(s.scale * ratio, 80), Math.min(s.width, s.height) * 0.9)
          s.centerX = s.width / 2
          s.centerY = s.height / 2
        }
        lastTouchDist = dist
        return
      }
      if (!s.dragging) return
      const t = e.touches[0]
      const { x, y } = getPos(t)
      const dx = x - s.lastX
      const dAz = (-dx / s.scale) * (180 / Math.PI) * 0.7
      s.azOffset = (s.azOffset + dAz + 360) % 360
      s.lastX = x
      s.lastY = y
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      lastTouchDist = 0
      if (!s.dragging) return
      s.dragging = false
      if (e.changedTouches.length === 0) return
      const t = e.changedTouches[0]
      const { x, y } = getPos(t)
      const moved = Math.hypot(x - s.downX, y - s.downY)
      if (moved < 10 * devicePixelRatio) {
        const star = findNearestStar(x, y)
        if (star) {
          s.highlightedConst = star.constellation
          onConstellationSelect(star.constellation)
        } else {
          s.highlightedConst = null
        }
      }
    }

    // Wheel zoom
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.93 : 1.07
      s.scale = Math.min(
        Math.max(s.scale * factor, 80),
        Math.min(s.width, s.height) * 0.9
      )
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Start animation
    s.rafId = requestAnimationFrame(animate)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.rafId)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [animate, onConstellationSelect])

  // Fetch real sky data whenever location or dateTime changes
  useEffect(() => {
    fetchSky(location.lat, location.lon, dateTime)
      .then(data => {
        stateRef.current.stars = data.stars
        stateRef.current.constellationLines = data.constellation_lines as Record<string, number[][]>
      })
      .catch(() => {
        // keep mock data on error
      })
  }, [location, dateTime])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
        touchAction: 'none'
      }}
    />
  )
}
