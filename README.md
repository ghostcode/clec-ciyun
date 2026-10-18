# CLEC 理财词云

对《CLEC 宝典》与《理财圣经 CLEC 版》两本理财文献做**全文文本挖掘**，把其中的「理财理念」与「高频短语」做成可交互的彩色词云可视化站点。

- 理念：人工梳理的 **58 条**核心主张，按 **8 个流派**归类，字号=全文命中次数（对数映射）。
- 短语：算法从全文抽出的 **140 个**高频短语（n-gram 新词发现），带原文例句。
- 每个词独立配色（黄金角色相步进，两两不同），支持球形 / 心形两种词云形状，球形支持 3D 旋转。

> 本页仅为教育与文本挖掘用途之可视化结果，**不构成任何投资建议**。

---

## 数据源

两份 PDF 位于仓库根目录：

| 文件 | 版本 | 说明 |
| --- | --- | --- |
| `CLEC宝典_SC_V1.14.2.pdf` | V1.14.2 | CLEC 宝典（约 559 页） |
| `理财圣经CLEC版-v3.4.1.pdf` | v3.4.1 | 理财圣经 CLEC 版（约 97 页） |

抽取脚本 `scripts/extract.py` 使用 `pypdf` 读取文本层，并做了：
- **康熙部首兼容字符归一化**（`⼈`→`人`，NFKC）与繁简统一（如「那斯达克」→「纳斯达克」）；
- 理念：人工梳理 8 流派，权重 = 全文信号词命中次数；
- 短语：自研 CJK 2~7 字 n-gram 新词发现（虚词边界过滤 + 残量去重），输出带例句的短语表。

输出写入 `src/data/wordcloud.json`，结构为：

```jsonc
{
  "meta": { "sources": [/* 两书元信息 */] },
  "ideology": [ { "name", "cat", "statement", "note", "w": {all,baodian,shengjing}, "cov": {...} } ],
  "phrase": { "all": [ { "name", "w", "raw", "eg" } ], "baodian": [...], "shengjing": [...] }
}
```

---

## 技术栈

- **前端**：[Vite](https://vitejs.dev/) 6 + React 19 + TypeScript 5 + Tailwind CSS v4
- **词云**：[ECharts](https://echarts.apache.org/) 5 + [echarts-wordcloud](https://github.com/ecomfe/echarts-wordcloud)
- **3D 球体**：原生 Canvas 2D + 斐波那契球面分布 + 透视投影（非 echarts 内置，独立渲染管线 `WordSphere3D.tsx`）

---

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（带热更新）
npm run dev

# 生产构建（见下方「构建说明」）
npm run build

# 预览构建产物
npm run serve        # 启动 http://localhost:4173/

# 重新抽取语料（可选，需先装 pypdf）
npm run extract      # 等价于 python3 scripts/extract.py
```

> 直接双击 `dist/index.html` 也能打开（构建产物使用经典 `<script>` 标签，`file://` 可读）。

---

## 构建说明

标准生产构建走自定义链路（见 `scripts/build.mjs`）：

```
tsc -p tsconfig.build.json        # 类型检查 + 产出 .build/*.js
  → rollup (JS API, IIFE)         # 打包 React 应用
  → esbuild transformSync         # 压缩 + 注入 process.env.NODE_ENV
  → tailwindcss CLI              # 编译 app.css
  → dist/index.html              # 由 build.mjs 生成
```

`package.json` 的 `build` 脚本已串联以上步骤，直接 `npm run build` 即可。
（注：在受限沙箱环境中若 `vite build` / `esbuild` 直接打包被中断，本链路作为替代方案；常规机器上 `vite build` 同样可用。）

---

## 目录结构

```
clec-ciyun/
├── CLEC宝典_SC_V1.14.2.pdf      # 数据源
├── 理财圣经CLEC版-v3.4.1.pdf    # 数据源
├── scripts/
│   ├── extract.py               # 语料抽取（PDF → wordcloud.json）
│   └── build.mjs                # 自定义生产构建链
├── src/
│   ├── App.tsx                  # 主页面：双词云 + 排行 + 详情 + 筛选
│   ├── main.tsx
│   ├── index.css                # Tailwind 入口 + 主题变量
│   ├── lib/types.ts             # 类型、调色板、wordColor 配色函数
│   ├── data/wordcloud.json      # 抽取结果（构建期数据）
│   └── components/
│       ├── WordCloud.tsx        # 2D 词云（echarts） + 球形分流
│       ├── WordSphere3D.tsx     # 3D 旋转词球（Canvas 2D）
│       ├── ShapePicker.tsx      # 形状切换（球形 / 心形）
│       ├── RankList.tsx         # 词频排行 TOP 14
│       ├── IdeologyDetail.tsx   # 理念详情 + 例句
│       ├── PhraseDetail.tsx     # 短语详情 + 例句
│       └── StatStrip.tsx        # 顶部统计条
├── dist/                        # 构建产物（index.html + assets/）
└── index.html
```

---

## 功能特性

- **双词云**：上「理财理念」、下「高频短语」，各自独立语料与配色。
- **形状切换**：球形（默认，3D 可旋转）/ 心形（echarts 原生 cardioid 形状）。
- **3D 旋转**：球形词云支持拖拽旋转（带惯性回落）、滚轮调俯仰、悬停高亮、点选词条。
- **点击查看详情**：点任意词，右侧面板展示完整释义 / 例句与「第几名」。
- **词频排行**：两侧 TOP 14 排行条，按词频**从高到低**排序，条形颜色与词云一致。
- **流派筛选**：理念图按 8 流派打标，可点选标签过滤。
- **语料切换**：顶部可在「两书综合 / 《CLEC 宝典》/ 《理财圣经》」间切换，词频实时重算。
- **无障碍**：尊重 `prefers-reduced-motion`，开启时 3D 球静止单帧渲染、入场动画关闭。

---

## 配色与排序

- **每个词独立配色**：`wordColor(index, total, base)` 用黄金角（≈137.508°）步进色相 + 交错调制饱和度/明度，保证相邻词区分度高、两两不同。理念图 `base=18`、短语图 `base=200`，使两幅图配色明显区分。
- **词频排序**：排行列表与详情序号均按词频高→低；短语原始数据未预排序，已在 `App.tsx` 中按 `b.w - a.w` 排序后驱动全部视图。
- **字号**：词频跨度极大（1~1179），统一做对数映射，保证小词也清晰可见。

---

## 许可证与免责声明

项目用于个人学习与文本挖掘演示。PDF 版权归原作者所有；词频统计基于 PDF 文本层全文抽取，仅供 educational 用途，**不构成任何投资建议**。
