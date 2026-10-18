import type { CloudShape } from './WordCloud'

interface Props {
  value: CloudShape
  onChange: (s: CloudShape) => void
}

const SHAPES: Array<{ key: CloudShape; label: string }> = [
  { key: 'sphere', label: '球形' },
  { key: 'cardioid', label: '心形' },
]

export default function ShapePicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-white/70 px-1 py-1">
      <span className="pl-2 pr-1 text-[11px] text-[var(--color-ink-faint)]">云形</span>
      {SHAPES.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`tab ${value === s.key ? 'tab-active' : ''}`}
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem' }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
