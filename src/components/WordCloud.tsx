import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import WordSphere3D from './WordSphere3D'

export interface CloudWord {
  name: string
  /** 视觉权重（决定字号，已做对数映射） */
  value: number
  /** 真实词频（用于 tooltip / 排行） */
  raw?: number
  color: string
}

export type CloudShape =
  | 'circle'
  | 'sphere'
  | 'cardioid'
  | 'diamond'
  | 'triangle'
  | 'pentagon'
  | 'star'

/** echarts-wordcloud 的形状是极坐标 r(θ)，做不出真 3D；
 *  「球形」= 圆形布局 + 球面拟真渲染（由 .sphere-ball 负责） */
const ECHARTS_SHAPE: Record<CloudShape, string> = {
  circle: 'circle',
  sphere: 'circle',
  cardioid: 'cardioid',
  diamond: 'diamond',
  triangle: 'triangle',
  pentagon: 'pentagon',
  star: 'star',
}

interface Props {
  words: CloudWord[]
  shape?: CloudShape
  height?: number
  sizeRange?: [number, number]
  onPick?: (name: string) => void
}

export default function WordCloud({
  words,
  shape = 'circle',
  height = 460,
  sizeRange = [13, 88],
  onPick,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  const data = useMemo(
    () =>
      words.map((w) => ({
        name: w.name,
        value: w.value,
        raw: w.raw ?? w.value,
        textStyle: { color: w.color },
      })),
    [words],
  )

  const signature = useMemo(() => {
    if (!words.length) return ''
    const mx = Math.max(...words.map((w) => w.value))
    const mn = Math.min(...words.map((w) => w.value))
    return `${mx}_${mn}_${words.length}`
  }, [words])

  const isSphere = shape === 'sphere'

  useEffect(() => {
    // 球形模式：销毁 echarts 实例，避免隐藏渲染占用
    if (isSphere) {
      roRef.current?.disconnect()
      roRef.current = null
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
      return
    }

    const box = boxRef.current
    if (!box) return

    // 惰性初始化（首屏可能是球形，box 此时还不存在）
    if (!chartRef.current) {
      const chart = echarts.init(box, undefined, { renderer: 'canvas' })
      chartRef.current = chart
      const handler = (p: { name?: string }) => {
        if (p?.name) pickRef.current?.(p.name)
      }
      chart.on('click', handler)
      const ro = new ResizeObserver(() => chart.resize())
      ro.observe(box)
      roRef.current = ro
    }

    const chart = chartRef.current
    if (!chart || !data.length) return
    const mx = Math.max(...data.map((d) => d.value))
    const hi = Math.min(sizeRange[1], Math.max(46, Math.round(30 + Math.log2(mx + 1) * 7)))
    chart.setOption(
      {
        backgroundColor: 'transparent',
        tooltip: {
          show: true,
          confine: true,
          backgroundColor: 'rgba(23,27,34,0.94)',
          borderWidth: 0,
          padding: [10, 14],
          textStyle: { color: '#fff', fontSize: 13 },
          formatter: (p: { name: string; data?: { raw?: number } }) =>
            `<b style="font-size:15px">${p.name}</b><br/><span style="opacity:.7">原文命中 ${p.data?.raw ?? '-'} 次</span>`,
        },
        series: [
          {
            type: 'wordCloud',
            shape: ECHARTS_SHAPE[shape] ?? 'circle',
            keepAspect: false,
            left: 'center',
            top: 'center',
            width: '97%',
            height: '93%',
            sizeRange: [sizeRange[0], hi],
            rotationRange: [0, 0],
            gridSize: 9,
            drawOutOfBound: false,
            shrinkToFit: true,
            layoutAnimation: false,
            textStyle: { fontFamily: '"Noto Serif SC", serif', fontWeight: 600 },
            data,
          },
        ],
      },
      { notMerge: true },
    )
  }, [data, shape, sizeRange, signature, isSphere])

  useEffect(() => {
    return () => {
      roRef.current?.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  // 球形走独立的 3D 渲染管线（斐波那契球面 + 透视投影 + 拖动旋转）
  if (isSphere) {
    return (
      <div className="relative w-full" style={{ height }}>
        <div className="sphere-ball" aria-hidden="true" />
        <div className="absolute inset-0">
          <WordSphere3D
            words={words}
            height={height}
            sizeRange={[Math.min(sizeRange[0], 12), Math.min(sizeRange[1], 54)]}
            onPick={onPick}
          />
        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-[var(--color-ink-faint)] backdrop-blur">
          拖动旋转 · 单击词条看释义
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={boxRef} className="absolute inset-0" />
    </div>
  )
}
