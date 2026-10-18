import fs from 'node:fs'
import path from 'node:path'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import * as esbuild from 'esbuild'

const root = process.cwd()
const entry = path.join(root, '.build', 'main.js')
const outDir = path.join(root, 'dist', 'assets')
const outFile = path.join(outDir, 'app.js')

fs.mkdirSync(outDir, { recursive: true })

console.log('▸ rollup 打包 .build/main.js ...')
const bundle = await rollup({
  input: entry,
  plugins: [
    // CSS 由 tailwindcss CLI 单独产出，这里置空
    {
      name: 'ignore-css',
      resolveId(id) {
        return id.endsWith('.css') ? '\0empty-css' : null
      },
      load(id) {
        return id === '\0empty-css' ? 'export default {}' : null
      },
    },
    json(),
    nodeResolve({ browser: true, extensions: ['.js', '.mjs', '.json'], preferBuiltins: false }),
    commonjs({ include: /node_modules/ }),
  ],
  onwarn(w, warn) {
    // echarts 源码里有大量 eval / this 相关的软警告，静音
    if (w.code === 'EVAL' || w.code === 'THIS_IS_UNDEFINED' || w.code === 'CIRCULAR_DEPENDENCY') return
    warn(w)
  },
})

const { output } = await bundle.generate({ format: 'iife', name: 'CLECApp', inlineDynamicImports: true })
let code = output[0].code
console.log(`  原始体积 ${(Buffer.byteLength(code) / 1024).toFixed(0)} KB`)

console.log('▸ esbuild transform 压缩 ...')
const minified = esbuild.transformSync(code, {
  loader: 'js',
  minify: true,
  charset: 'utf8',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
})
code = minified.code
fs.writeFileSync(outFile, code)
console.log(`  压缩后 ${(Buffer.byteLength(code) / 1024).toFixed(0)} KB → dist/assets/app.js`)

await bundle.close()

// ---------------- 生成 dist/index.html ----------------
const css = fs.existsSync(path.join(outDir, 'app.css'))
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CLEC 理财词云 · 理念与短语</title>
    <meta name="description" content="从《CLEC 宝典》与《理财圣经 CLEC 版》抽取的理财理念与高频短语词云" />
    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23171b22'/%3E%3Ctext x='16' y='23' font-size='19' font-family='serif' font-weight='900' fill='%23e3bc63' text-anchor='middle'%3E%E5%AF%8C%3C/text%3E%3C/svg%3E"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;900&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap"
      rel="stylesheet"
    />
    ${css ? '    <link rel="stylesheet" href="./assets/app.css" />' : ''}
  </head>
  <body>
    <div id="root"></div>
    <script src="./assets/app.js" defer></script>
  </body>
</html>
`
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html)
console.log('▸ dist/index.html 已生成')
