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

## 五、弹层版式（页面第二段 + `embed` 片段共用）

页面形态固定为「两段式」后，只有两处用得到弹层：**页面下半的弹层入口** 和
**`embed` 片段**（塞进宿主页面的 Shadow DOM 那份）—— 两者共用同一份弹层样式
`cssPopup()`，改一处两处一起变。（`--mode` 已收敛为 `page` / `embed` 两档，
旧的 `inline` / `popup` / `demo` 不再区分形态，见 SKILL.md。）

### 排布规则：桌面一行三个、手机一行一个

| 视口 | 每行 | 卡片宽 |
| --- | --- | --- |
| ≥ 1180px | 3 | 200px（顶到 `max-width`） |
| 561–1180px | 3 | 200 → 152px（一路挤到 `flex-basis` 下限） |
| ≤ 560px | 1 | 通栏 = 视口 − 80（距屏幕左右各 **40px**，码放大好扫） |

**中间没有「2+1」这档。** 要么一行三个，要么一行一个，没有第三种形态。

### 关键 CSS

```css
.pop{padding:22px}                       /* 90vw 时代这里是 44px 的水平总留白 */
.pop-card{width:min(700px,100%)}         /* % = .pop 的 content box，不受 padding 影响 */
.pop-card .qrs{gap:12px}
.pop-card .qrs > .card,
.pop-card .qrs > .link{width:auto;flex:1 1 150px;max-width:200px}
@media (max-width:560px){
  .pop{padding:24px}
  .pop-card{padding:20px 16px 18px}
  .pop-card .qrs > .card,
  .pop-card .qrs > .link{flex-basis:100%;max-width:none}
}
```

### 为什么是这些数

- **`min(700px,100%)` 而不是 `94vw`**：`%` 相对 `.pop` 的 content box（视口 − 44px padding），
  所以窄屏天然不会溢出。`94vw + 44px` 在 733px 以下就开始横向溢出。
- **`flex-basis:150px` 是量出来的**：取值 168px 时，三张卡片要 3×168+24=528px，
  而 600px 视口下 `.qrs` 内宽只有 518px → 卡出一段 561–600px 的「2+1」夹缝。
  降到 150px 后，临界点正好落到手机断点 560px 上，夹缝消失。
- **`max-width:200px`**：桌面宽屏下三张各占 200px、总宽 662px < 700px 的弹层内宽，
  两侧留白被吃掉，不再出现「卡片挤在中间、左右一大片空」。
- **手机档 `flex-basis:100%`**：用 `220px` 的话在 480–560px 仍会 2+1；
  设成 `100%` 必然是「一个占一行」，规则只有一条、没有例外。
- **手机档边距 `40px`**：`.pop` 内边距 24 + `.pop-card` 内边距 16 = 40 —— 刻意与
  首屏单列卡片的 `body{padding: … 40px …}` 对齐，开弹层时卡片不会左右跳。

### 首屏单列（≤520px）：卡片通栏，左右各 40px

首屏卡片原来写死 `width:200px`，390 屏下左右各空出约 95px —— 码被挤小、两边一大片白
（2026-10-02 用户反馈）。现在改成「卡片跟着视口通栏」：

```css
@media (max-width:520px){
  body{padding:22px 40px 38px}   /* 左右各 40px */
  .card,.link{width:100%}        /* 卡片通栏 = 视口 − 80 */
  /* 内容跟着放大：卡片内边距 12 / chip 12.5px / 码面 padding 10 / 圆角 14 */
}
```

实测（390×900，agent-browser 量）：卡片 **310px**、左右边距 **40 / 40**、码面 **284px**、
chip 字号 **12.5px**；链接卡用 `aspect-ratio:6/5` 保持桌面那份比例（284×237）。
改完记得重跑 `bash scripts/make-samples.sh` —— 文档里的窄屏样本必须跟着更新。

### 验收方法

1. 弹层必须是**打开态**才能量：URL 带 `#pop=1`（见下），或先 `click` 那个 `.sponsor-btn`。
2. 扫一排视口宽度（1180 → 360，取 15~20 档），每档读
   `.pop-card .qrs` 子元素的 `top`：
   - **判「几行」= 把 `top` 排序后数「相邻差值 > 4px」的断层个数**；1 个断层都没有 → 真的是一行。
   - ⚠️ **容差不能省**：`.card:hover{transform:translateY(-2px)}`，而合成鼠标点完触发按钮后
     常常正好停在第一张卡上 → 那一张的 `top` 会比别的少 2px。按「不同 `top` 的个数」数会
     把一行三个数成两行（实测踩过，差点误判为折行没修好）。要么留 4px 容差，
     要么量之前先把鼠标挪开。
   - ⚠️ **别按 `left` 去重当列数**——`.pop` 是 flex 垂直居中、卡片高度又不一时，
     「2+1」会数出 3 个不同 `left`，看起来像一行三个。
   - ⚠️ **改完 CSS 重开页面要破缓存**：`file://` 也会被 Chromium 缓存，
     直接重开读到的还是旧规则（实测：同一份 CSS 文件里读回旧的 `168px`）。
     加个查询串（`?v=<时间戳>`）最省事。
3. 卡片宽要跟着视口单调变化（200 → 152），突然跳回 200 通常就是换行了。

### `#pop=1`：直达弹层

和 `#theme=` / `#lang=` 同一套路，URL 带 `#pop=1` 直接开弹层 —— 分享链接、无头截图
都能复现「弹层已打开」这一态，否则文档样本只能手工截。

⚠️ 页面**必须同时监听 `hashchange`**：有的自动化工具（`agent-browser` 的 `open`）
是先导航、再把 fragment 补上，脚本执行那一刻 `location.hash` 还是空的 ——
只判一次的话 `#pop=1` 会静默失效（实测：`location.hash` 明明是 `#pop=1`、
正则也 `true`，弹层却纹丝不动）。

## 六、源码复制 / 用法页（`usage.html`）

### 定位：它是**工具页**，不是落地页

`usage.html` 和 `sponsors.html` 是两个观众：`sponsors.html` 给访客看，`usage.html`
给**要动手的人**看（复制源码）。所以它的版式取向是「密度 + 可扫读」，不是「大标题 + 卖点」。

想给技能做落地页请走 `iskill-promo-page` —— **别把 hero / features / faq / CTA 那套搬进来**：
那会把它变成一个跟 `sponsors.html` 抢活干的半成品落地页，而真正的工具能力（分栏复制）
反而被埋掉。可以借的只有**底座**：`theme-color`、头部控件（主题切换）、a11y 小件。

本仓库后来的做法正好印证这条分工：落地页单独由 `iskill-promo-page` 生成在**仓库根**
（`index.html`），再把 `usage.html` 用 **iframe 嵌进它的 Hero 槽位** ——
**工具页保持工具样，落地页负责卖，两者组合而不是混写**。
它之所以能保持「单文件零依赖」，也正是因为嵌入方要的是一个能塞进 iframe 的自包含页面，
而不是一个可被拆开重组的组件库。

### 硬性约束：单文件零依赖

产物是**一个 HTML**，没有 `assets/` 目录（对比 `iskill-promo-page` 的
`style.css` + `app.js` + `content.js` 四件套）。这条不能破 —— 用户会把它和
`sponsors.html` 一起丢进 GitHub Pages 根目录，甚至单发给人。
所以：图标内联 SVG、样式内联、文案走 `data-zh` / `data-en` 属性（而不是外置字典）。

### 三个交互

| 控件 | 行为 | 为什么 |
| --- | --- | --- |
| 分栏 + 复制 | 5 个产物各一栏，`.view` 用 `textContent` 填充（免转义），复制取 `<textarea>.value` | 全程不经 `innerHTML`，产物里出现 `</textarea>` 才会截断 |
| **软换行开关** | 默认**开**，偏好存 `sponsor-wrap` | 见下 |
| **主题切换** | 头部月亮/太阳按钮，走 `sponsor-theme`（与 `sponsors.html`、预览共用） | 原来只能钻进预览 iframe 里点它的开关，太绕 |

### 坑一：代码块「看着被裁断」

`.view{overflow:auto}` 是**能**横向滚的，但 macOS 的覆盖式滚动条**不滚就不显示** ——
用户看到的就是一行行被切断的文本（实测：`.view` 内容 1008px / 可视 822px，`canScroll:true`
却毫无提示）。这些产物里 `<img src="…" width="160" …>` 之类的长行动辄溢出 200px。

解法：**默认软换行**（`white-space:pre-wrap; overflow-wrap:anywhere`）+ 一个开关关掉它；
关掉时再给 `::-webkit-scrollbar` 上色，让「可横向滚动」这件事不再藏着。
窄屏（≤720px）直接把开关隐藏——窄屏本来就该换行。

### 坑二：预览 iframe 首屏与外层**不同步**（真 bug，已修）

外层页和 iframe 各自有一套「主题/语言从哪来」的兜底链，**优先级还不一样**：

| | hash | localStorage | 系统 |
| --- | --- | --- | --- |
| `usage.html`（外层） | **优先** | 次之 | 最后 |
| `sponsors.html`（iframe） | **优先** | 次之 | 最后 |

问题出在 iframe 的 `src` 是**静态**的 `sponsors.html`（不带 fragment），于是它只能从
localStorage / 系统取值，而外层可能已按 hash 定了另一档。于是：

> 分享出去的 `usage.html#theme=light` → 外层亮色中文，iframe 却按 localStorage 里的
> `dark` 渲染成暗色英文 —— **一个页面两种配色两种语言**（实测截图）。

原实现只在**点语言按钮**时才 `postMessage` 同步，**首屏从不发**；而 postMessage 本身
还有「iframe 监听器还没绑上」的竞态。修法很直白：**首屏把当前生效状态写进 iframe 的
hash** ——

```js
function frameHash() {
  var parts = ['lang=' + curLang()];
  var th = document.documentElement.getAttribute('data-theme');
  if (th === 'light' || th === 'dark') parts.push('theme=' + th);
  return parts.join('&');
}
frameEl.src = 'sponsors.html#' + frameHash();
```

hash 在 iframe 自己的头脚本里**最先**被读到，没有竞态；语言每次都传（外层一定解析出了值），
主题只在**显式选过**时才传（没选就让两边都跟随系统，不把预览钉死）。
`syncFrame()` 里那个「无 ack 就重载 iframe」的老兜底也顺手改成带 hash 重载 ——
`f.src = f.src` 会把 fragment 留在旧值上。

### 验收方法

1. **必须走 http，不能走 `file://`**：`file://` 下 iframe 是独立不透明源，
   `iframe.contentDocument` 读到的是 `null`，根本验不了同步。起个本地服务再开就同源了：
   `python3 -m http.server 8731` → `http://127.0.0.1:8731/usage.html#theme=light&lang=zh`
   （起服务与测试要在**同一条命令**里，否则后台进程会被沙箱回收）。
2. 读两边的 `documentElement` 属性，断言 **`outerTheme === frameTheme` 且 `outerLang === frameLang`**。
3. 软换行：断言 `getComputedStyle(code).whiteSpace` 是 `pre-wrap`（开）/ `pre`（关），
   且 `.view` 的 `scrollWidth <= clientWidth`（开着就不该有横向溢出）。
4. 主题切换：点 `#theme-btn` 后外层与 iframe 的 `data-theme` 要一起翻，`meta[theme-color]`
   要变成 `#0c121c`（暗）/ `#f2f5f9`（亮）。

