# 版式规范（Markdown / HTML）

设计目标：**二维码要一眼能看清、能扫**，其余一切为它让路。这是一个工具页，不是海报页。

## 一、Markdown 区块

### 为什么用 `<img width>` 而不是 `![]()`

Markdown 原生图片语法**没法控制尺寸**。收款码原图动辄 1700×2560，直接 `![](x.jpg)`
在 GitHub 上会撑满整行、又糊又吓人。所以统一用：

```html
<p align="center">
  <img src=".github/sponsor/alipay.jpg" width="220" alt="支付宝收款码">
  &nbsp;&nbsp;&nbsp;
  <img src=".github/sponsor/wechat.jpg" width="220" alt="微信收款码">
</p>
```

- `<p align="center">` 居中（README 里最稳的居中手段，比 `<div>` 安全，GitHub 会保留）。
- `width="220"` 固定展示宽；两张并排 ≈ 460px，手机端也不会挤成一条。
- `&nbsp;&nbsp;&nbsp;` 是并排图片之间唯一可靠的间距手段（`margin` 会被 GitHub 白名单洗掉）。
- `alt` 必写 —— 图片挂了/无障碍阅读时靠它。
- 三张以上时宽度降到 `180`。

### 路径

图片路径是**相对当前 md 文件**的。README 在仓库根 → `.github/sponsor/x.jpg` 就够了。
文档在子目录（`docs/README.md`）→ 要用 `--img-base ../.github/sponsor` 重新生成。

### marker 的规矩

自动注入的区块由两个 HTML 注释包裹，**必须各自独占一行**：

```
<!-- sponsors:start -->
...
<!-- sponsors:end -->
```

正文里提到这两个 marker 时（比如写文档解释它们），**不要写成完整的注释**，
否则插件/脚本会把它当成真锚点，把区块注到半截腰上。
本技能用「整行严格相等」匹配，就是为了防这个。

## 二、HTML

两种风格：

| 风格 | 场景 |
| --- | --- |
| `card`（默认） | 独立赞助页 / 分享链接，卡片 + 渐变顶条 + 点击放大灯箱 |
| `minimal` | 想塞进已有页面、或要打印，去掉卡片和阴影，纯排版 |

### 硬性约束

1. **单文件、零外部依赖。** 没有 webfont、没有 CDN、没有外部 CSS/JS。
   图片默认走相对路径；需要「发给人就能看」时加 `--standalone`，图片转 base64 内嵌。
   —— 外部字体在离线/内网环境会掉成宋体，整页气质直接垮掉。

2. **二维码的底板永远是白的。**
   深色模式下卡片变深，但 `.qr` 容器强制白底。深底淡码会让一部分手机扫不出来。

3. **配色全部走 CSS 变量**，深浅两套只换变量值。
   禁止把 `#fff` 之类硬编码进组件规则里 —— 一硬编码，深色模式就会出现
   「白底白字按钮」（本项目踩过，见下）。

4. **主题三级兜底**：`#theme=light|dark`（URL 强制）→ `localStorage`（用户选择）→
   `prefers-color-scheme`（跟随系统）。读取脚本必须放在 `<style>` **之前**，否则首帧闪白。

5. **图标一律内联 SVG**，几何线条、`currentColor`，不用 emoji、不引图标库。
   emoji 在不同平台字形差异极大（Windows 上会变成彩色方块），做品牌页很掉价。

6. 无障碍：`alt`、`aria-label`、`focus-visible` 外圈、`prefers-reduced-motion` 降级、打印样式。

### 踩过的坑

- **深色模式白底白字**：`.link` 背景写死 `#fff`，文字色用 `var(--ink)`，
  深色下 ink 变浅 → 白底浅字，按钮上的字彻底看不见。
  修法：背景改 `var(--card)`，并把 `--card`、`--card-soft` 一并纳入主题变量。
- **chip 对比度**：用 `color-mix()` 从主色推导，
  `background: color-mix(accent 12%, card)` + `color: color-mix(accent 62%, ink)`
  两套配色都自动成立，不用手写两遍。
- **截图漂移**：无头浏览器默认跟随**本机外观**，在深色 macOS 上截出来全是深色图。
  用 URL 的 `#theme=` 强制，比 `--blink-settings=preferredColorScheme` 可靠。

## 三、图片处理

- 长边压到 `800`（默认），JPEG 质量 82。1708×2560 / 319KB → 533×800 / 91KB。
- 展示宽 220px，Retina 需要 440px，800 有充足余量，再大纯属浪费仓库体积。
- 优先用 macOS 自带 `sips`（零依赖）；没有 `sips` 的环境原样拷贝，不阻断流程。
- **不动原图的构图**：收款海报自带品牌和名称，比裁成一个孤零零的码更好认。

## 四、组件版式（SponsorCard.jsx / .vue）

- **同源原则**：组件与 `sponsors.html` 共用 `lib/model.mjs`（数据 + 双语文案）和
  `lib/component-css.mjs`（样式骨架）。改版式只改这两处，三个产物一起变。
- **scoped 策略**：Vue 用 `<style scoped>`（编译期加属性选择器）；React 用内联
  `<style>` 包**单标签选择器**（`.sp-card{...}` 不带上下文），天然不冲突、也不用
  引 CSS-in-JS。类名统一 `sp-` 前缀兜底。
- **主题**：`theme` prop 直接落到根元素 `data-theme="light|dark"`；不传时组件样式里
  用 `:not([data-theme="light"])` + `prefers-color-scheme` 跟随系统。
  **同页多实例可以一个亮一个暗，互不干扰**（已 SSR 验收）。
- **语言**：`lang` prop 控制初始语言；`show-tools` 控制右上角切换按钮（嵌文档页时关掉）。
- **验收铁律**：组件必须真编译 + SSR 渲染过才算数——
  React：`renderToStaticMarkup` 直出后断言关键文案；
  Vue：`@vue/compiler-sfc` parse/compile 后 `vue/server-renderer` 渲染。
  裸 SSR 的 SFC 模块要手动设 `__sfc__.__scopeId`，否则 scoped 属性不落 DOM（Vite 会自动做）。
- **SFC 顶层注释禁写 `<template>` 字样**：`@vue/compiler-sfc` 的块解析不管 HTML 注释，
  见到 `<template>` 就当块开始，整个文件解析失败。用法说明放 `<script>` 的 JS 注释里。
