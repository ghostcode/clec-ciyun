import { fmt, type PhraseItem } from '../lib/types'

interface Props {
  item: PhraseItem | null
  rank: number
  total: number
}

export default function PhraseDetail({ item, rank, total }: Props) {
  if (!item) {
    return (
      <div className="card p-6 text-sm text-[var(--color-ink-faint)]">
        点击左侧短语词云中的任意词，查看它的词频、排名与原文例句。
      </div>
    )
  }
  return (
    <div className="card float-in p-6" key={item.name}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-[27px] font-black leading-tight text-[var(--color-ink)]">{item.name}</h3>
        <div className="shrink-0 text-right">
          <div className="num text-2xl font-semibold text-[var(--color-ink)]">#{rank}</div>
          <div className="text-[11px] text-[var(--color-ink-faint)]">共 {total} 个</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-line)] px-4 py-3">
          <div className="text-[11px] tracking-[0.14em] text-[var(--color-ink-faint)] uppercase">权重</div>
          <div className="num mt-0.5 text-xl font-semibold">{fmt(item.w)}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] px-4 py-3">
          <div className="text-[11px] tracking-[0.14em] text-[var(--color-ink-faint)] uppercase">原始频次</div>
          <div className="num mt-0.5 text-xl font-semibold">{fmt(item.raw)}</div>
        </div>
      </div>

      {item.eg ? (
        <>
          <div className="rule-x my-5" />
          <div className="text-[11px] tracking-[0.16em] text-[var(--color-ink-faint)] uppercase">原文例句</div>
          <p className="quote-mark mt-2 font-serif text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {item.eg}
          </p>
        </>
      ) : null}
    </div>
  )
}
