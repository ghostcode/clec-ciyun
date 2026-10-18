import { CAT_COLOR, fmt, type IdeologyItem, type Scope } from '../lib/types'

const SCOPE_LABEL: Record<Scope, string> = {
  all: '两书合计',
  baodian: 'CLEC 宝典',
  shengjing: '理财圣经',
}

interface Props {
  item: IdeologyItem | null
  scope: Scope
  rank: number
  total: number
}

export default function IdeologyDetail({ item, scope, rank, total }: Props) {
  if (!item) {
    return (
      <div className="card p-6 text-sm text-[var(--color-ink-faint)]">
        点击左侧词云中的任意理念，查看它的完整主张、分类与词频分布。
      </div>
    )
  }
  const color = CAT_COLOR[item.cat] ?? '#555'
  const maxW = Math.max(...Object.values(item.w), 1)

  return (
    <div className="card overflow-hidden float-in" key={item.name}>
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className="chip"
              style={{ borderColor: color, color, background: `${color}12` }}
            >
              <i className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {item.cat}
            </span>
            <h3 className="mt-3 font-serif text-[27px] font-black leading-tight text-[var(--color-ink)]">
              {item.name}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-2xl font-semibold text-[var(--color-ink)]">#{rank}</div>
            <div className="text-[11px] text-[var(--color-ink-faint)]">共 {total} 条</div>
          </div>
        </div>

        <p className="quote-mark mt-4 font-serif text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          {item.statement}
        </p>

        {item.note && (
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-faint)]">— {item.note}</p>
        )}

        <div className="rule-x my-5" />

        <div className="text-[11px] tracking-[0.16em] text-[var(--color-ink-faint)] uppercase">
          出现权重 · 按语料范围
        </div>
        <div className="mt-3 space-y-2.5">
          {(['all', 'baodian', 'shengjing'] as Scope[]).map((s) => {
            const v = item.w[s] ?? 0
            const active = s === scope
            return (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-[74px] shrink-0 text-xs ${active ? 'text-[var(--color-ink)] font-medium' : 'text-[var(--color-ink-faint)]'}`}>
                  {SCOPE_LABEL[s]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-paper-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(v / maxW) * 100}%`, background: color, opacity: active ? 1 : 0.35 }}
                  />
                </div>
                <span className="num w-11 shrink-0 text-right text-xs text-[var(--color-ink-soft)]">{fmt(v)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
