---
name: iskill-generate-sponsors
summary: 把一张收款码图片（微信/支付宝/PayPal/任意）变成一整套可直接用的赞助页——.github/FUNDING.yml（GitHub 右上角 Sponsor 按钮）+ 可粘进任何 Markdown 的 SPONSORS.md 区块 + 响应式中英双语 sponsors.html + 零依赖 scoped 样式的 React/Vue 组件。零三方依赖，图片自动压缩，README 区块可重复运行覆盖。
description: 当用户想给自己的开源项目/仓库/文档加「赞赏」「赞助」「打赏」「收款码」「赞助按钮」时使用。触发词：赞赏、赞助、打赏、收款码、赞助页、FUNDING.yml、Sponsor 按钮、buy me a coffee、ko-fi、paypal.me、liberapay、给项目加个赞赏。输入微信/支付宝静态收款码图片（或任何用户提供的图片），输出 md + html（响应式、中英双语切换）+ React/Vue 组件 + FUNDING.yml，图片落 .github/sponsor/ 并在 README 内联展示。微信/支付宝收款码无法写进 FUNDING.yml，本技能会自动内联到 README 并在 FUNDING.yml 里留注释指路。
agent_created: true
---

# iskill-generate-sponsors

一张收款码 → 一整套能直接用的赞助页。

```bash
bash scripts/make-all.sh --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi
```

产出：`.github/sponsor/*.jpg` · `.github/FUNDING.yml` · `SPONSORS.md` · `sponsors.html`（响应式 + 中英双语）·
`SponsorCard.jsx` / `SponsorCard.vue`（零依赖 scoped 组件）· README 里的内联区块（marker 包裹，重跑覆盖）。

## 样本

下面是**本技能在自身仓库上现场生成**的效果（`bash scripts/make-samples.sh` 一键重出）：

**`sponsors.html` · card 风格（默认）**

![亮色](assets/sample-sponsors.jpg)

点击二维码会开灯箱放大；右上角可切语言（中/英）和深浅色；打印样式会自动去掉按钮和页脚。

![暗色](assets/sample-sponsors-dark.jpg)

**README 内联区块** —— 两张码并排居中，跟着渠道表格：

![README 区块](assets/sample-readme-block.jpg)

## 整体流程

```
   收款码图片（微信 / 支付宝 / 任意）
          │
          ├─ resolveQrList   按文件名/标签识别渠道（支付宝蓝 / 微信绿 / QQ / 云闪付 / PayPal）
          │
          ├─ optimizeImage   sips 压到长边 800 / JPEG 82  →  .github/sponsor/
          │
          ├─ FUNDING.yml     平台原生键（ko_fi/liberapay/github…）+ custom 放 PayPal（最多 4 条）
          │
          ├─ SPONSORS.md     <p align="center"> + <img width> 并排 + 渠道表格 + 嵌入说明
          │
          ├─ sponsors.html   单文件：响应式 / 中英切换 / CSS 变量深浅双主题 / 灯箱
          │
          ├─ SponsorCard.jsx / .vue   零依赖 scoped 组件（数据、样式、文案与 html 同源）
          │
          └─ README 区块     由独占一行的 marker 包裹，重复运行只替换区块
```

## 何时用

- 用户说「给项目加个赞赏 / 赞助页 / 收款码 / Sponsor 按钮」。
- 已有二维码图片，想塞进 README 但不知道怎么控制尺寸、放哪个目录。
- 想让 `github.com/用户名/仓库` 右上角出现 Sponsor 按钮。
- 想要一个能单独发出去的赞助页（`--standalone` 出来是自包含单文件）。

## 快速上手

```bash
# A. 一把梭：扫描目录，按文件名自动认渠道
bash scripts/make-all.sh --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi

# B. 配置驱动（推荐，长期复用；改一次以后重跑就行）
bash scripts/make-all.sh --config sponsors.config.json --out /path/to/repo

# C. 显式指定每一张
node scripts/gen-sponsors.mjs \
  --qr "支付宝=~/收款码/alipay.JPG" \
  --qr "微信=~/收款码/wechat.JPG" \
  --paypal https://paypal.me/zeovi --kofi zeo --out .
```

先看看会做什么、不落盘：

```bash
node scripts/gen-sponsors.mjs --config sponsors.config.json --dry-run
node scripts/gen-sponsors.mjs --help
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `--from <目录>` | 扫描目录里的图片，按文件名关键词自动识别渠道 |
| `--qr "标签=路径"` | 显式指定一张收款码（可重复） |
| `--config <文件>` | JSON 配置，默认自动读 `./sponsors.config.json` |
| `--name` / `--project` / `--tagline` / `--title` | 身份与文案 |
| `--paypal <完整URL>` | 进 `custom`（自动纠正 `paypay.me` → `paypal.me`） |
| `--kofi` `--liberapay` `--github` `--patreon` `--bmc` `--polar` `--open-collective` | 平台用户名，进 `FUNDING.yml` 原生键 |
| `--link "标签=URL"` | 额外自定义链接（可重复） |
| `--out <目录>` | 产物根目录，默认 `.` |
| `--img-base <路径>` | md/html 里引用图片的路径前缀，默认 `.github/sponsor` |
| `--prefix <前缀>` | 输出图片文件名前缀 |
| `--max <像素>` | 图片长边上限，默认 800 |
| `--style card\|minimal` | HTML 风格，默认 `card` |
| `--standalone` | HTML 内嵌 base64 图片，单文件可直接发给别人 |
| `--lang zh\|en` | 默认语言（默认 `zh`） |
| `--langs zh,en` | 可选语言集合；只给一种时隐藏切换按钮 |
| `--no-components` | 不输出 SponsorCard.jsx / SponsorCard.vue |
| `--components-dir <目录>` | 组件输出目录（默认同 `--out` 根目录） |
| `--no-source` | 不输出 sponsors-source.html（源码一键复制页） |
| `--no-readme` / `--no-optimize` / `--dry-run` | 不写 README / 不压图 / 只预演 |

## 产物

| 文件 | 用途 |
| --- | --- |
| `.github/sponsor/*.jpg` | 压缩后的收款码，专供 README 内联 |
| `.github/FUNDING.yml` | 仓库右上角 Sponsor 按钮 |
| `SPONSORS.md` | 完整赞助页 + 嵌入说明 |
| `sponsors.html` | 单文件美观网页（响应式，自带中/英切换 + 深浅主题） |
| `sponsors-source.html` | 开发者用的源码复制页：全部文本产物分栏展示、一键复制（`--no-source` 关掉） |
| `SponsorCard.jsx` / `SponsorCard.vue` | 零依赖 scoped 组件，嵌进任意 React / Vue 项目 |
| `README.md` 区块 | marker 包裹，重跑只替换这一块 |

## React / Vue 组件

两个组件与 `sponsors.html` **同源**：同一份 `buildModel()` 数据、同一份 `component-css.mjs`
样式骨架，只是渲染目标不同。都只依赖框架本身，不引任何三方库。

- **`SponsorCard.jsx`**：纯函数组件 + 内联 `<style>`（单标签选择器，天然免冲突），
  支持构建时可选链 + `??`（2019 年后的所有打包器都行）。SSR 可用（`renderToStaticMarkup` 直出）。
- **`SponsorCard.vue`**：`<script setup>` + `<style scoped>`，attrs 透传。
  ⚠️ 文件头部**不能有含 `<template>` 字样的 HTML 注释**——`@vue/compiler-sfc`
  的顶层解析器不管注释，见到 `<template>` 就当块开始（本技能第一版就栽在这）。

组件公共 props（都可以不传）：

```jsx
<SponsorCard />                    // 默认中文，主题跟随系统
<SponsorCard lang="en" />          // 英文
<SponsorCard theme="dark" />       // "light" | "dark" | 不传 = 跟随系统（同页多实例互不干扰）
<SponsorCard :show-tools="false" /> // 去掉右上角语言/主题按钮（嵌入文档页时用）
<SponsorCard :data="myData" />     // 换自己的数据（结构见文件里的 SPONSOR_DATA）
```

图片 `src` 是相对仓库根目录的路径；在打包器项目里建议改成 `import qr from '.../alipay.jpg'`
再塞进 data。改文案/链接/图只动文件顶部的 `SPONSOR_DATA`，不用碰逻辑。

验收方式（勿省）：两个组件都要**真编译 + SSR 渲染**过再交付——React 用
`renderToStaticMarkup`，Vue 用 `@vue/compiler-sfc` 的 `parse/compileScript/compileTemplate`
拼模块后 `vue/server-renderer` 渲染；注意 SSR harness 要给 SFC 模块设
`__sfc__.__scopeId = 'data-v-xxx'`，否则 scoped 属性不落 DOM、样式全失效
（Vite 插件在真实构建里会自动做，裸 SSR 不会）。

## 关键事实

### 微信/支付宝收款码**不能**写进 FUNDING.yml

`FUNDING.yml` 只认 GitHub 支持的那些平台（GitHub Sponsors / Patreon / Ko-fi / Liberapay /
Open Collective / Polar / Buy Me a Coffee / IssueHunt / thanks.dev），加**最多 4 个** `custom` URL。
微信/支付宝不是平台，**只能内联展示**在 README / 网页里。

本技能的做法：

- README 区块里正面展示两张码；
- `FUNDING.yml` **不写**它们，但在末尾用注释标明「码在 `.github/sponsor/`」，
  方便以后回头找；
- 海外渠道（PayPal 等）走 `custom`，能配的平台走原生键（Ko-fi / Liberapay 等可同时有）。

### `custom` 里的 URL 一定要加引号

`https://` 里的 `:` 会让一部分 YAML 解析器翻车。本技能统一输出 `- "https://..."`。
详见 [`reference/funding-yml.md`](reference/funding-yml.md)。

### marker 必须独占一行

```
<!-- sponsors:start -->
<!-- sponsors:end -->
```

**正文里提到 marker 时不要写成完整注释**，否则会被当成锚点、把区块注到半截腰上。
（本技能按「整行严格相等」匹配，已在真实 README 上验证过这个坑。）

### README 里控制图片尺寸只能用 `<img width>`

原生 `![]()` 没法限宽，1700×2560 的收款海报会撑满整行。
统一用 `<p align="center"><img width="220">`，`&nbsp;` 做间距（`margin` 会被 GitHub 白名单洗掉）。

## 深浅双主题的坑（改 HTML 前必读）

- **配色全部走 CSS 变量**。一旦把 `#fff` 硬编码进组件规则，深色模式就会出现
  「白底白字按钮」。第一版就踩了：`.link` 写死白底 + 文字色用 `var(--ink)`，
  深色下 ink 变浅 → PayPal 按钮上的字完全看不见。
- 主题三级兜底：`#theme=light|dark` → `localStorage` → `prefers-color-scheme`；
  读取脚本放在 `<style>` 之前，避免首帧闪白。
- **二维码底板永远白**（`.qr` 强制白底）。深色模式下卡片变深，但码必须留在白底上。
- 无头截图会跟随**本机外观**，在深色 macOS 上截出来全是深色图。
  截图时用 URL 的 `#theme=` 强制，比 `--blink-settings=preferredColorScheme` 可靠。
- **headless Chrome 有 500px 视口下限**：`--window-size=390,…` 实际布局仍是 500px
  再裁切，窄屏截图会「假溢出」。`shoot.mjs` 已内置绕法——把目标页塞进
  固定尺寸的 `<iframe>` 再截外层；写死视口的验收一律走这条。

版式细则见 [`reference/sponsor-design.md`](reference/sponsor-design.md)。

## 依赖

零三方依赖（Node ≥ 18 标准库）。图片压缩优先用 macOS 自带 `sips`；
没有 `sips` 的环境原样拷贝，不阻断流程。截图脚本需要本机有 Chromium 系浏览器
（Chrome / Edge / Brave / `chrome-headless-shell`，或 `~/.agent-browser/browsers/` 下的
Chrome for Testing），可用 `CHROME=/path/to/chrome` 指定。

## 目录

```
iskill-generate-sponsors/
├── SKILL.md
├── scripts/
│   ├── gen-sponsors.mjs    主生成器（唯一入口，零依赖）
│   ├── make-all.sh         找 node + 透传参数的一键包装
│   ├── render-react.mjs    SponsorCard.jsx 生成器
│   ├── render-vue.mjs      SponsorCard.vue 生成器
│   ├── render-source.mjs   sponsors-source.html 生成器（源码一键复制页）
│   ├── lib/
│   │   ├── model.mjs       数据模型 + 双语文案（html/jsx/vue 共用）
│   │   └── component-css.mjs  组件 scoped 样式骨架（jsx/vue 共用）
│   ├── shoot.mjs           Chromium 无头截图（文档样本用；窄屏用 iframe 绕过 500px 下限）
│   ├── preview-block.mjs   把 SPONSORS.md 的 marker 区块渲染成可截图的预览页
│   └── make-samples.sh     一键重出文档里的样本图
├── reference/
│   ├── funding-yml.md      FUNDING.yml 字段速查 + 坑
│   └── sponsor-design.md   md / html / 组件版式规范
├── assets/                 文档样本（生成器现场产物，勿手工替换）
├── sponsors.config.json    本仓库自己的配置（可直接抄）
├── SponsorCard.jsx/.vue    本仓库自身生成的组件（示例产物）
└── .github/                本仓库自身作为示例：FUNDING.yml + sponsor/ 收款码
```
