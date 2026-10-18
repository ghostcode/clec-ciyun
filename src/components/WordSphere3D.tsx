import { useEffect, useMemo, useRef } from 'react'

export interface SphereWord {
  name: string
  /** 视觉权重（已做对数映射） */
  value: number
  raw?: number
  color: string
}

interface Props {
  words: SphereWord[]
  height?: number
  sizeRange?: [number, number]
  onPick?: (name: string) => void
}

const FOV = 6
const BASE_VY = 0.0032 // 基础自转速度（弧度/帧）

/** 尊重系统「减弱动态效果」设置：静止渲染一帧，不自动旋转 */
function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** 斐波那契球面均匀分布 + 透视投影，纯 canvas 2D 实现真 3D 词球 */
export default function WordSphere3D({ words, height = 540, sizeRange = [12, 52], onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  const dataRef = useRef<SphereWord[]>([])
  const pointsRef = useRef<Array<{ x: number; y: number; z: number }>>([])
  const fontRef = useRef<number[]>([])
  const rectsRef = useRef<Array<{ name: string; x: number; y: number; w: number; h: number; z: number }>>([])

  const drawRef = useRef<(() => void) | null>(null)
  const stillRef = useRef(false)

  const st = useRef({
    rotY: 0.6,
    rotX: -0.16,
    vY: BASE_VY,
    vX: 0,
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    mx: -1,
    my: -1,
    hover: null as string | null,
  })

  /** 词 → 球面点：大词优先占据赤道（视觉重心） */
  const sorted = useMemo(() => [...words].sort((a, b) => b.value - a.value), [words])

  useEffect(() => {
    dataRef.current = sorted
    const n = Math.max(sorted.length, 1)
    const pts: Array<{ x: number; y: number; z: number }> = []
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * i + 1) / n
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const phi = i * Math.PI * (3 - Math.sqrt(5)) // 黄金角
      pts.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r })
    }
    // 按 |y| 升序：越靠近赤道越先被大词占用
    pointsRef.current = pts
      .map((p, i) => ({ p, k: Math.abs(p.y), i }))
      .sort((a, b) => a.k - b.k)
      .map((o) => o.p)

    const vals = sorted.map((w) => w.value)
    const mx = Math.max(...vals, 1)
    const mn = Math.min(...vals, 0)
    fontRef.current = vals.map((v) => {
      const t = mx === mn ? 1 : (v - mn) / (mx - mn)
      return sizeRange[0] + (sizeRange[1] - sizeRange[0]) * Math.pow(t, 0.85)
    })
  }, [sorted, sizeRange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const still = prefersReducedMotion()
    stillRef.current = still

    const draw = () => {
      const s = st.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (!W || !H) {
        raf = requestAnimationFrame(draw)
        return
      }
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      if (!s.dragging && !still) {
        // 惯性衰减后回到基础自转
        s.vY += (BASE_VY - s.vY) * 0.05
        s.vX *= 0.9
        s.rotY += s.vY
        s.rotX = Math.max(-0.85, Math.min(0.85, s.rotX + s.vX))
      }

      const R = Math.min(W, H) * 0.31
      const cx = W / 2
      const cy = H / 2
      const cosY = Math.cos(s.rotY)
      const sinY = Math.sin(s.rotY)
      const cosX = Math.cos(s.rotX)
      const sinX = Math.sin(s.rotX)

      const items: Array<{
        name: string
        color: string
        sx: number
        sy: number
        fs: number
        alpha: number
        z: number
      }> = []

      const pts = pointsRef.current
      const ws = dataRef.current
      for (let i = 0; i < ws.length && i < pts.length; i++) {
        const p = pts[i]
        const x1 = p.x * cosY + p.z * sinY
        const z1 = -p.x * sinY + p.z * cosY
        const y1 = p.y * cosX - z1 * sinX
        const z2 = p.y * sinX + z1 * cosX

        const k = FOV / (FOV - z2) // 透视缩放：z2>0 靠近镜头
        const sx = cx + x1 * R * k
        const sy = cy - y1 * R * k
        const depth = (z2 + 1) / 2
        const fs = fontRef.current[i] * k * 0.8
        if (fs < 5) continue
        const alpha = 0.1 + 0.9 * Math.pow(depth, 1.7)
        items.push({ name: ws[i].name, color: ws[i].color, sx, sy, fs, alpha, z: z2 })
      }
      items.sort((a, b) => a.z - b.z) // 远的先画

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const rects: typeof rectsRef.current = []
      let hovered: string | null = null

      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const isHover = s.hover === it.name
        ctx.globalAlpha = Math.min(1, isHover ? 1 : it.alpha)
        ctx.font = `600 ${(isHover ? it.fs * 1.12 : it.fs).toFixed(1)}px "Noto Serif SC", serif`
        ctx.fillStyle = it.color
        if (isHover) {
          ctx.shadowColor = 'rgba(255,255,255,0.9)'
          ctx.shadowBlur = 8
        } else {
          ctx.shadowBlur = 0
        }
        ctx.fillText(it.name, it.sx, it.sy)
        ctx.shadowBlur = 0
        const w = ctx.measureText(it.name).width
        const h = it.fs * 1.05
        rects.push({ name: it.name, x: it.sx - w / 2, y: it.sy - h / 2, w, h, z: it.z })
      }
      ctx.globalAlpha = 1
      rectsRef.current = rects

      // hover 命中（从最近的一层往前找）
      if (s.mx >= 0 && s.my >= 0 && !s.dragging) {
        for (let i = rects.length - 1; i >= 0; i--) {
          const r = rects[i]
          if (s.mx >= r.x && s.mx <= r.x + r.w && s.my >= r.y && s.my <= r.y + r.h) {
            hovered = r.name
            break
          }
        }
      }
      s.hover = hovered
      canvas.style.cursor = hovered ? 'pointer' : s.dragging ? 'grabbing' : 'grab'

      if (still) return
      raf = requestAnimationFrame(draw)
    }
    drawRef.current = draw
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ---------------- 交互：拖拽旋转 + 点击选取 ----------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = st.current

    const onDown = (e: PointerEvent) => {
      s.dragging = true
      s.moved = false
      s.lastX = e.clientX
      s.lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      s.mx = e.clientX - rect.left
      s.my = e.clientY - rect.top
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      if (Math.abs(dx) + Math.abs(dy) > 2) s.moved = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      const ndy = dy * 0.005
      s.rotY += dx * 0.005
      s.rotX = Math.max(-0.85, Math.min(0.85, s.rotX - ndy))
      s.vY = dx * 0.005
      s.vX = -ndy
      if (stillRef.current) drawRef.current?.()
    }
    const onUp = (e: PointerEvent) => {
      if (s.dragging && !s.moved && pickRef.current) {
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const rects = rectsRef.current
        for (let i = rects.length - 1; i >= 0; i--) {
          const r = rects[i]
          if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            pickRef.current(r.name)
            break
          }
        }
      }
      s.dragging = false
      if (stillRef.current) drawRef.current?.()
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    }
    const onLeave = () => {
      s.mx = -1
      s.my = -1
      s.dragging = false
    }
    const onWheel = (e: WheelEvent) => {
      // 滚轮微调俯仰
      e.preventDefault()
      s.rotX = Math.max(-0.85, Math.min(0.85, s.rotX + e.deltaY * 0.0006))
      if (stillRef.current) drawRef.current?.()
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height, display: 'block', touchAction: 'none' }} />
}
