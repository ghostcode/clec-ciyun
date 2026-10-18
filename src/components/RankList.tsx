interface Props {
  items: Array<{ name: string; value: number; color: string }>
  limit?: number
  active?: string | null
  onPick: (name: string) => void
}

export default function RankList({ items, limit = 14, active, onPick }: Props) {
  const list = items.slice(0, limit)
  const max = Math.max(...list.map((i) => i.value), 1)
  return (
    <ol className="space-y-1">
      {list.map((it, i) => {
        const on = active === it.name
        return (
          <li key={it.name}>
            <button
              onClick={() => onPick(it.name)}
              className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                on ? 'bg-[var(--color-paper-2)]' : 'hover:bg-[var(--color-paper-2)]/70'
              }`}
            >
              <span className="num w-5 shrink-0 text-xs text-[var(--color-ink-faint)]">{i + 1}</span>
              <span
                className="w-[104px] shrink-0 truncate font-serif text-[15px] font-semibold"
                style={{ color: on ? it.color : 'var(--color-ink)' }}
                title={it.name}
              >
                {it.name}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-paper-2)]">
                <span
                  className="block h-full rounded-full transition-all duration-500"
                  style={{ width: `${(it.value / max) * 100}%`, background: it.color }}
                />
              </span>
              <span className="num w-10 shrink-0 text-right text-xs text-[var(--color-ink-soft)]">{it.value}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
