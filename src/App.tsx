import { useEffect, useMemo, useState } from 'react'
import raw from './data/wordcloud.json'
import { CAT_COLOR, CAT_ORDER, wordColor, fmt, type Dataset, type Scope } from './lib/types'
import WordCloud, { type CloudShape, type CloudWord } from './components/WordCloud'
import ShapePicker from './components/ShapePicker'
import StatStrip from './components/StatStrip'
import IdeologyDetail from './components/IdeologyDetail'
import PhraseDetail from './components/PhraseDetail'
import RankList from './components/RankList'

const data = raw as unknown as Dataset

const SCOPES: Array<{ key: Scope; label: string }> = [
  { key: 'all', label: '两书综合' },
  { key: 'baodian', label: '《CLEC 宝典》' },
  { key: 'shengjing', label: '《理财圣经》' },
]

/** 词频跨度极大（1 ~ 1179），做对数映射保证小词也看得清 */
function visualScale(values: number[]): number[] {
  const mx = Math.max(...values)
  const mn = Math.min(...values)
  const h = Math.log1p(mx) - Math.log1p(mn)
  return values.map((v) => (h <= 0 ? 60 : Math.round(15 + 85 * ((Math.log1p(v) - Math.log1p(mn)) / h))))
}

export default function App() {
  const [scope, setScope] = useState<Scope>('all')
  const [shapeIde, setShapeIde] = useState<CloudShape>('sphere')
  const [shapePh, setShapePh] = useState<CloudShape>('sphere')
  const [cats, setCats] = useState<string[]>([])
  const [ideSel, setIdeSel] = useState<string | null>(null)
  const [phSel, setPhSel] = useState<string | null>(null)

  // ---------------- 数据派生 ----------------
  const ideRaw = useMemo(
    () =>
      data.ideology
        .map((i) => ({ ...i }))
        .sort((a, b) => (b.w[scope] ?? 0) - (a.w[scope] ?? 0)),
    [scope],
  )
  const ideScoped = useMemo(() => ideRaw.filter((i) => (i.w[scope] ?? 0) > 0), [ideRaw, scope])

  const catCount = useMemo(() => {
    const m: Record<string, number> = {}
    ideScoped.forEach((i) => (m[i.cat] = (m[i.cat] ?? 0) + 1))
    return m
  }, [ideScoped])

  // 每个理念唯一配色（按 ideScoped 稳定序号生成，筛选时不重排变色）
  const ideColorOf = useMemo(() => {
    const m = new Map<string, string>()
    ideScoped.forEach((i, k) => m.set(i.name, wordColor(k, ideScoped.length)))
    return m
  }, [ideScoped])

  const ideWords: CloudWord[] = useMemo(() => {
    const list = cats.length ? ideScoped.filter((i) => cats.includes(i.cat)) : ideScoped
    const vs = visualScale(list.map((i) => i.w[scope] ?? 0))
    return list.map((i, k) => ({
      name: i.name,
      value: vs[k],
      raw: i.w[scope] ?? 0,
      color: ideColorOf.get(i.name) ?? '#444',
    }))
  }, [ideScoped, cats, scope, ideColorOf])

  const ideRank = useMemo(
    () =>
      ideScoped.map((i) => ({
        name: i.name,
        value: i.w[scope] ?? 0,
        color: ideColorOf.get(i.name) ?? '#444',
      })),
    [ideScoped, scope, ideColorOf],
  )

  const phList = data.phrase[scope]
  // 词频从高到低排序，统一驱动词云、排行、详情序号（原始数据未按词频序）
  const phSorted = useMemo(() => [...phList].sort((a, b) => b.w - a.w), [phList])
  const phWords: CloudWord[] = useMemo(() => {
    const vs = visualScale(phSorted.map((p) => p.w))
    // 每个短语独立配色（base 偏移避免与理念图撞同套色）
    return phSorted.map((p, k) => ({
      name: p.name,
      value: vs[k],
      raw: p.w,
      color: wordColor(k, phSorted.length, 200),
    }))
  }, [phSorted])

  const phRank = useMemo(
    () => phWords.map((w) => ({ name: w.name, value: w.raw ?? w.value, color: w.color })),
    [phWords],
  )

  // 切换范围时重置选中项到第一名（最高频）
  useEffect(() => {
    setIdeSel(ideScoped[0]?.name ?? null)
    setPhSel(phSorted[0]?.name ?? null)
  }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps

  const ideItem = ideScoped.find((i) => i.name === ideSel) ?? null
  const ideRankNo = ideScoped.findIndex((i) => i.name === ideSel) + 1
  const phItem = phList.find((p) => p.name === phSel) ?? null
  const phRankNo = phSorted.findIndex((p) => p.name === phSel) + 1

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  return (
    <div className="min-h-screen paper-grain">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--color-ink)] font-serif text-base font-black text-[var(--color-gold-2)]">
              富
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[17px] font-black tracking-wide text-[var(--color-ink)]">
                CLEC 理财词云
              </div>
              <div className="text-[11px] tracking-[0.14em] text-[var(--color-ink-faint)]">
                理念 · 短语 · 文本挖掘
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-white/70 px-1 py-1">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                onClick={() => setScope(s.key)}
                className={`tab ${scope === s.key ? 'tab-active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-8 lg:px-8">
        {/* ---------------- Hero ---------------- */}
        <section className="float-in">
          <h1 className="font-serif text-[34px] font-black leading-[1.2] text-[var(--color-ink)] sm:text-[44px]">
            五十万字理财文本里，
            <br />
            真正被反复讲述的是
            <span className="relative ml-1 inline-block">
              <span className="relative z-10">这几件事</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[var(--color-gold-2)]/45" />
            </span>
          </h1>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            对《CLEC 宝典 V1.14.2》（27 章）与《理财圣经 CLEC 版 v3.4.1》（29 讲）做全文解析：
            一边是人工梳理的 <b className="text-[var(--color-ink)]">58 条理财理念</b>，
            一边是算法抽出的 <b className="text-[var(--color-ink)]">高频短语</b>。
            字号大小代表该词在原文中的真实词频权重（对数映射），每条词条独立配色以便区分。
          </p>
        </section>

        <div className="mt-7 float-in">
          <StatStrip
            sources={data.meta.sources}
            scope={scope}
            ideologyCount={ideScoped.length}
            phraseCount={phList.length}
          />
        </div>

        {/* ---------------- 理念词云 ---------------- */}
        <section className="mt-10">
          <SectionTitle
            index="01"
            title="理财理念"
            subtitle="核心主张按八个流派归类 · 点击词条查看完整解释"
            extra={<ShapePicker value={shapeIde} onChange={setShapeIde} />}
          />

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.75fr_1fr]">
            <div className="card p-3 sm:p-5">
              <WordCloud words={ideWords} shape={shapeIde} height={540} onPick={setIdeSel} />
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--color-line)] pt-3">
                {CAT_ORDER.filter((c) => catCount[c]).map((c) => {
                  const on = cats.includes(c)
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCat(c)}
                      className="chip transition-opacity"
                      style={{
                        borderColor: on ? CAT_COLOR[c] : 'var(--color-line)',
                        color: on ? '#fff' : 'var(--color-ink-soft)',
                        background: on ? CAT_COLOR[c] : 'transparent',
                        opacity: on || !cats.length ? 1 : 0.45,
                      }}
                    >
                      <i className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: on ? '#fff' : CAT_COLOR[c] }} />
                      {c}
                      <span className="num opacity-70">{catCount[c]}</span>
                    </button>
                  )
                })}
                {cats.length > 0 && (
                  <button className="chip" onClick={() => setCats([])}>
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-[86px] lg:self-start">
              <IdeologyDetail item={ideItem} scope={scope} rank={ideRankNo} total={ideScoped.length} />
              <div className="card mt-4 p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-[11px] tracking-[0.16em] text-[var(--color-ink-faint)] uppercase">
                    词频排行 TOP 14
                  </span>
                  <span className="text-[11px] text-[var(--color-ink-faint)]">单位：出现次数</span>
                </div>
                <RankList items={ideRank} active={ideSel} onPick={setIdeSel} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 短语词云 ---------------- */}
        <section className="mt-12">
          <SectionTitle
            index="02"
            title="高频短语"
            subtitle="n-gram 新词发现 · 一句话掌握作者的常用词"
            extra={<ShapePicker value={shapePh} onChange={setShapePh} />}
          />

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.75fr_1fr]">
            <div className="card p-3 sm:p-5">
              <WordCloud
                words={phWords}
                shape={shapePh}
                sizeRange={[13, 76]}
                height={540}
                onPick={setPhSel}
              />
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
                <span className="text-[11px] text-[var(--color-ink-faint)]">
                  颜色：每个短语独立配色（两两不同）
                </span>
                <span className="num text-[11px] text-[var(--color-ink-faint)]">共 {phList.length} 词</span>
              </div>
            </div>

            <div className="lg:sticky lg:top-[86px] lg:self-start">
              <PhraseDetail item={phItem} rank={phRankNo} total={phList.length} />
              <div className="card mt-4 p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-[11px] tracking-[0.16em] text-[var(--color-ink-faint)] uppercase">
                    词频排行 TOP 14
                  </span>
                  <span className="text-[11px] text-[var(--color-ink-faint)]">单位：加权频次</span>
                </div>
                <RankList items={phRank} active={phSel} onPick={setPhSel} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 语料说明 ---------------- */}
        <section className="mt-12">
          <div className="card p-6 sm:p-7">
            <h2 className="font-serif text-[20px] font-black text-[var(--color-ink)]">语料来源</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {data.meta.sources.map((s) => (
                <div key={s.id} className="rounded-xl border border-[var(--color-line)] p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-[16px] font-bold text-[var(--color-ink)]">{s.title}</span>
                    <span className="text-xs text-[var(--color-ink-faint)]">{s.ver}</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{s.desc}</div>
                  <div className="num mt-3 flex gap-4 text-xs text-[var(--color-ink-faint)]">
                    <span>{fmt(s.pages)} 页</span>
                    <span>{fmt(s.chars)} 字</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-[var(--color-ink-faint)]">
              词频统计基于 PDF 文本层全文抽取（已做康熙部首兼容字符归一化与繁简统一），
              理念条目由人工梳理八字八个流派并以全文命中次数加权。
              本页仅为教育与文本挖掘用途之可视化结果，不构成任何投资建议。
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] py-6">
        <div className="mx-auto max-w-[1240px] px-5 text-center text-[11px] text-[var(--color-ink-faint)] lg:px-8">
          富有是天赋 · 快乐是人权 —— Powered by Vite + React 19 + TypeScript + Tailwind CSS v4 + ECharts wordcloud
        </div>
      </footer>
    </div>
  )
}

function SectionTitle({
  index,
  title,
  subtitle,
  extra,
}: {
  index: string
  title: string
  subtitle: string
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="num text-[13px] font-semibold text-[var(--color-gold)]">{index}</span>
          <span className="h-[1px] w-8 bg-[var(--color-gold)]/50" />
          <h2 className="font-serif text-[26px] font-black tracking-wide text-[var(--color-ink)]">{title}</h2>
        </div>
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-soft)]">{subtitle}</p>
      </div>
      {extra}
    </div>
  )
}
