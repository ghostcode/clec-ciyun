import type { Source } from '../lib/types'
import { fmt } from '../lib/types'

interface Props {
  sources: Source[]
  scope: string
  ideologyCount: number
  phraseCount: number
}

function Stat({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint?: string }) {
  return (
    <div className="card px-5 py-4 flex flex-col gap-1">
      <div className="text-[11px] tracking-[0.18em] text-[var(--color-ink-faint)] uppercase">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="num text-[26px] font-semibold leading-none text-[var(--color-ink)]">{value}</span>
        {unit && <span className="text-xs text-[var(--color-ink-soft)]">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-[var(--color-ink-faint)]">{hint}</div>}
    </div>
  )
}

export default function StatStrip({ sources, scope, ideologyCount, phraseCount }: Props) {
  const srcs = scope === 'all' ? sources : sources.filter((s) => s.id === scope)
  const chars = srcs.reduce((a, s) => a + s.chars, 0)
  const pages = srcs.reduce((a, s) => a + s.pages, 0)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <Stat label="语料规模" value={(chars / 10000).toFixed(1)} unit="万字" hint={scope === 'all' ? '2 份文献合并' : srcs[0]?.ver} />
      <Stat label="解析页数" value={fmt(pages)} unit="页" hint={srcs.map((s) => s.title).join(' · ')} />
      <Stat label="理财理念" value={fmt(ideologyCount)} unit="条" hint="人工梳理 + 全文词频加权" />
      <Stat label="高频短语" value={fmt(phraseCount)} unit="个" hint="n-gram 新词发现算法抽取" />
    </div>
  )
}
