export type Scope = 'all' | 'baodian' | 'shengjing'

export interface Source {
  id: Scope
  title: string
  ver: string
  desc: string
  pages: number
  chars: number
}

export interface IdeologyItem {
  name: string
  cat: string
  statement: string
  note: string
  w: Record<Scope, number>
  cov: Record<Scope, number>
}

export interface PhraseItem {
  name: string
  w: number
  raw: number
  eg: string
}

export interface Dataset {
  meta: { sources: Source[] }
  ideology: IdeologyItem[]
  phrase: Record<Scope, PhraseItem[]>
}

/** 八个理念流派的主题色 —— 只沉淀感金属色 + 低饱和彩 */
export const CAT_COLOR: Record<string, string> = {
  核心信念: '#A9760B',
  标的与武器: '#0E7C6B',
  配置与纪律: '#2850C8',
  杠杆与负债: '#C4322C',
  风险与防守: '#1D7BA8',
  税务与传承: '#6D45C4',
  心理与心智: '#C25E12',
  人生哲学: '#1F8A45',
}

export const CAT_ORDER = [
  '核心信念',
  '标的与武器',
  '配置与纪律',
  '杠杆与负债',
  '风险与防守',
  '税务与传承',
  '心理与心智',
  '人生哲学',
]

/** 短语调色板：与理念图同调性的理财主题多色（冷色→暖金对应低频→高频），
 *  让高频短语词云像理念图一样五色斑斓，而非单一色系渐变。 */
export const PHRASE_PALETTE = [
  '#1D3A6B', // 墨蓝（低频）
  '#1D7BA8', // 靛青
  '#0E7C6B', // 青碧
  '#6D45C4', // 紫
  '#1F8A45', // 松绿
  '#C25E12', // 赭橙
  '#B8860B', // 赤金
  '#C0392B', // 朱红（高频）
]

/** 短语按权重分档着色：t∈[0,1] 为归一化频率，落入 8 档之一取离散色。
 *  离散多色避免「单色渐变」的单调感，同时保留低频冷、高频暖的层次。 */
export function phraseColor(t: number): string {
  const c = Math.min(1, Math.max(0, t))
  const idx = Math.min(PHRASE_PALETTE.length - 1, Math.floor(c * PHRASE_PALETTE.length))
  return PHRASE_PALETTE[idx]
}

export const fmt = (n: number) => n.toLocaleString('zh-CN')

/** 为每个词分配唯一且区分度高的颜色：黄金角（≈137.508°）步进色相，
 *  配合交错调制饱和度/明度，使相邻词颜色尽量远离。index 为词在稳定序列中的序号，
 *  base 为色相基线偏移，用于让不同词云（理念/短语）的配色明显区分。 */
export function wordColor(index: number, _total: number, base = 18): string {
  const golden = 137.508
  const hue = (index * golden + base) % 360
  const sat = 60 + ((index * 13) % 22) // 60~81
  const light = 44 + ((index * 17) % 16) // 44~59
  return `hsl(${hue.toFixed(1)}, ${sat}%, ${light}%)`
}
