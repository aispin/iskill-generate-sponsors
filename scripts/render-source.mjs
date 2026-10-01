/**
 * usage.html 生成器 —— 面向开发者的「源码复制页」（中英双语）。
 * 与公开页 sponsors.html 分开：公开页保持纯净，复制工具不掺进去。
 *
 * 头部版式参照 iskill 系控制台：应用图标 + 标题 + 一句描述 + 元信息行。
 * 图标源件 scripts/assets/icon.svg 由 iskill-app-icon 生成（--glyph s --color 主题色），
 * 构建时读进来内联（页面保持单文件零依赖），同时做成 data URI favicon。
 *
 * 双语：与 sponsors.html 共享 localStorage key `sponsor-lang` / `sponsor-theme`，
 * 兜底顺序 #lang= / #theme= → localStorage → 系统语言（navigator.language，zh* → 中文）→ 生成配置 --lang。
 * 与 iframe 实时预览走 sponsorSync postMessage 双向同步（切语言即时生效，无 ack 则重载 iframe 兜底）。
 *
 * 源码用隐藏 <textarea> 承载（只有 </textarea> 能截断它，产出的 md/yml/jsx/vue
 * 都不会包含），展示时用 textContent 写进 <pre>，复制时直接取 .value ——
 * 全程不经 innerHTML，无需转义。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GEN_URL } from './lib/model.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 读图标源件并内联（找不到就退化为无图标的纯文字头部，不阻断生成） */
function loadIconSvg() {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    return fs.readFileSync(path.join(here, 'assets', 'icon.svg'), 'utf8')
      .replace(/\n\s*/g, ' ')
      .replace(/aria-label="[^"]*"/, 'aria-label="app icon"');
  } catch { return null; }
}

function formatTs(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 各产物的双语标签 / 提示（文件名类标签两种语言相同） */
const ART_I18N = {
  'readme':      { label: ['README 区块', 'README block'],  hint: ['粘进 README', 'Paste into README'],
                   meta: ['marker 包裹，可整段替换', 'wrapped in markers, replaceable'] },
  'funding':     { label: ['FUNDING.yml', 'FUNDING.yml'],   hint: ['Sponsor 按钮', 'Sponsor button'],
                   meta: ['.github/FUNDING.yml', '.github/FUNDING.yml'] },
  'sponsors-md': { label: ['SPONSORS.md', 'SPONSORS.md'],   hint: ['完整赞助页', 'Full sponsor page'],
                   meta: ['整页 Markdown', 'full-page Markdown'] },
  'jsx':         { label: ['SponsorCard.jsx', 'SponsorCard.jsx'], hint: ['React 组件', 'React component'],
                   meta: ['零依赖 · 内联样式', 'zero-dep · inline styles'] },
  'vue':         { label: ['SponsorCard.vue', 'SponsorCard.vue'], hint: ['Vue 组件', 'Vue component'],
                   meta: ['零依赖 · scoped', 'zero-dep · scoped'] },
};

export function renderSourceHtml(opt, artifacts) {
  const icon = loadIconSvg();
  const favicon = icon ? `data:image/svg+xml,${encodeURIComponent(icon)}` : null;
  const zhLede = `${opt.tagline} 点「复制」拿到产物源码，直接粘进你的项目。`;
  const enLede = `${opt.taglineEn || opt.tagline} Click "Copy" to grab the source and paste it into your project.`;

  const tabs = artifacts.map((a, i) => {
    const t = ART_I18N[a.id] || { label: [a.label, a.label], hint: [a.hint, a.hint], meta: [a.meta, a.meta] };
    return `
      <button class="tab${i === 0 ? ' on' : ''}" type="button" data-id="${a.id}">
        <span data-zh="${esc(t.label[0])}" data-en="${esc(t.label[1])}">${esc(t.label[0])}</span>
        <small data-zh="${esc(t.hint[0])}" data-en="${esc(t.hint[1])}">${esc(t.hint[0])}</small>
      </button>`;
  }).join('');

  const panes = artifacts.map((a, i) => {
    const t = ART_I18N[a.id] || { label: [a.label, a.label], meta: [a.meta, a.meta] };
    return `
    <section class="pane${i === 0 ? ' on' : ''}" data-id="${a.id}">
      <div class="pane-head">
        <span class="pane-name"><span data-zh="${esc(t.label[0])}" data-en="${esc(t.label[1])}">${esc(t.label[0])}</span><small data-zh="${esc(t.meta[0])}" data-en="${esc(t.meta[1])}">${esc(t.meta[0])}</small></span>
        <span class="pane-tools">
          <button class="wrap-btn" type="button" aria-pressed="true"
            data-zh="自动换行" data-en="Soft wrap">自动换行</button>
          <button class="copy" type="button" data-zh="复制" data-en="Copy">复制</button>
        </span>
      </div>
      <textarea class="src" hidden>${a.code.replace(/</g, '&lt;')}</textarea>
      <pre class="view"><code></code></pre>
    </section>`;
  }).join('');

  const headBrand = `
    <header class="hero">
      ${icon ? `<span class="hero-icon">${icon}</span>` : ''}
      <div class="hero-text">
        <h1>${esc(opt.project)}</h1>
        <p class="lede" data-zh="${esc(zhLede)}" data-en="${esc(enLede)}">${esc(zhLede)}</p>
      </div>
      <span class="lang-sw" role="group" aria-label="Language">
        <button class="lang-btn" type="button" data-set-lang="zh" aria-pressed="true">中</button><button class="lang-btn" type="button" data-set-lang="en" aria-pressed="false">EN</button>
      </span>
      <button class="icon-btn" type="button" id="theme-btn"
        data-aria-zh="切换深浅色" data-aria-en="Toggle light/dark">
        <svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.6 8.6 0 019.7 3.5 8.6 8.6 0 1020.5 14.3z"/></svg>
        <svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5"/></svg>
      </button>
    </header>
    <p class="meta">
      <span data-zh="更新于" data-en="Generated">更新于</span> ${formatTs()}
      · <span data-zh="图片在" data-en="Images in">图片在</span> <code>${esc(opt.imgBase)}/</code>
      · <span data-zh="公开预览页" data-en="Public page">公开预览页</span> <a href="sponsors.html">sponsors.html</a>
      · <a href="${GEN_URL}" target="_blank" rel="noopener noreferrer"><span data-zh="GitHub 仓库" data-en="GitHub repo">GitHub 仓库</span> ↗</a>
    </p>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Source copy · ${esc(opt.title)}</title>
${favicon ? `<link rel="icon" type="image/svg+xml" href="${favicon}">` : ''}
<meta name="color-scheme" content="light dark">
<!-- 移动端地址栏 / 状态栏配色，跟随主题（取值须与 :root --bg 一致） -->
<meta name="theme-color" content="#f2f5f9">
<script>
/* 与 sponsors.html 同款兜底：#lang= / #theme= → localStorage(sponsor-lang / sponsor-theme) → 系统语言 → 生成配置。
   语言在头脚本里就位，避免首帧闪错语言。 */
try{
  var lm=(location.hash||'').match(/lang=(zh|en)/);
  var lang=lm?lm[1]:localStorage.getItem('sponsor-lang')||sysLang('${opt.lang === 'en' ? 'en' : 'zh'}');
  if(lang!=='zh'&&lang!=='en')lang='${opt.lang === 'en' ? 'en' : 'zh'}';
  document.documentElement.setAttribute('data-lang',lang);
  document.documentElement.setAttribute('lang',lang==='en'?'en':'zh-CN');
  function sysLang(def){
    try { var l=(navigator.language||navigator.userLanguage||'').toLowerCase();
      if(!l||l==='und')return def;            // SSR / 未知语言 → 生成配置默认
      return l.indexOf('zh')===0?'zh':'en';   // zh* → 中文，其余 → 英文
    } catch(e){ return def; }
  }
  var tm=(location.hash||'').match(/theme=(light|dark)/);
  var th=tm?tm[1]:localStorage.getItem('sponsor-theme');
  if(th==='light'||th==='dark')document.documentElement.setAttribute('data-theme',th);

  /* theme-color：显式选了主题就按它上色，否则跟随系统。取值与 :root --bg 同步 ——
     这里写死而不是读 CSS 变量，因为本脚本在 <style> 之前执行，拿不到变量。 */
  window.wbThemeColor=function(t){
    var m=document.querySelector('meta[name="theme-color"]');
    if(m)m.setAttribute('content',t==='dark'?'#0c121c':'#f2f5f9');
  };
  wbThemeColor(th==='light'||th==='dark'?th:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));

  /* 被别的页面 iframe 嵌走时（如落地页的 Hero 槽位），本页收起自己的语言 / 主题开关 ——
     宿主顶栏已经有同款控件了，留着会像两张页面叠在一起。切换照旧走宿主的
     postMessage(promoSlotSync) 推过来，功能一点不丢。
     判定用 window.self!==window.top：跨源时读 window.top 会抛，落到 catch 也当被嵌处理。 */
  var framed=true;
  try{ framed=window.self!==window.top; }catch(e){ framed=true; }
  if(framed)document.documentElement.setAttribute('data-embedded','');
  else document.documentElement.removeAttribute('data-embedded');
}catch(e){}
</script>
<style>
:root{
  --accent:${opt.accent};
  --bg:#f2f5f9; --card:#ffffff; --ink:#101c2e; --ink2:#5a6a80; --line:#e2e8f1;
  --code-bg:#f7f9fc;
  --shadow:0 1px 2px rgba(16,32,56,.04), 0 12px 32px -14px rgba(16,32,56,.16);
}
:root[data-theme="dark"]{
  --bg:#0c121c; --card:#131b28; --ink:#e8edf5; --ink2:#8fa0b8; --line:#232e40;
  --code-bg:#0e1520;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 32px -14px rgba(0,0,0,.5);
}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0c121c; --card:#131b28; --ink:#e8edf5; --ink2:#8fa0b8; --line:#232e40;
  --code-bg:#0e1520;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 32px -14px rgba(0,0,0,.5);
}}
*{box-sizing:border-box}
body{
  margin:0; padding:34px 18px 56px; color:var(--ink);
  font:14px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  background:var(--bg);
}
:root[data-lang="en"] body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:1060px;margin:0 auto}

/* ── 头部：图标 + 标题 + 描述 + 语言切换，下面一行元信息 ────── */
.hero{display:flex;align-items:center;gap:15px;min-width:0}
.hero-icon{flex:none;width:46px;height:46px}
.hero-icon svg{width:100%;height:100%;display:block;border-radius:11px;box-shadow:0 4px 14px -6px rgba(16,32,56,.35)}
.hero-text{min-width:0;flex:1}
h1{
  font-size:19px;font-weight:800;letter-spacing:.02em;margin:0;line-height:1.35;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.lede{color:var(--ink2);margin:3px 0 0;font-size:13px;line-height:1.6;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lang-sw{flex:none;display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--code-bg)}
.lang-btn{
  cursor:pointer;border:0;background:none;color:var(--ink2);
  font:inherit;font-size:12px;font-weight:600;padding:5px 11px;
}
.lang-btn + .lang-btn{border-left:1px solid var(--line)}
.lang-btn.on{background:var(--accent);color:#fff}
/* 主题切换：外层壳自己也要有（原来只能钻进预览 iframe 里点它的开关，太绕）。
   图标按当前主题二选一显示，纯 CSS 判定，首帧不闪。 */
.icon-btn{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:30px;height:30px;padding:0;cursor:pointer;color:var(--ink2);
  border:1px solid var(--line);border-radius:10px;background:var(--code-bg);
}
.icon-btn:hover{color:var(--accent);border-color:var(--accent)}
.icon-btn svg{width:15px;height:15px;display:block}
.icon-btn .i-sun{display:none}
:root[data-theme="dark"] .icon-btn .i-sun{display:block}
:root[data-theme="dark"] .icon-btn .i-moon{display:none}
@media(prefers-color-scheme:dark){
  :root:not([data-theme="light"]) .icon-btn .i-sun{display:block}
  :root:not([data-theme="light"]) .icon-btn .i-moon{display:none}
}
/* 被嵌走时（落地页 Hero 槽位）收起自带的语言 / 主题开关，避免与宿主顶栏重复。
   见头脚本里的 data-embedded 判定；切换仍由宿主 postMessage 推过来。 */
:root[data-embedded] .lang-sw,
:root[data-embedded] #theme-btn{display:none}
/* 跳转链接：键盘用户按 Tab 第一下就能跳过头部直达工具区 */
.skip{
  position:absolute;left:-9999px;top:0;z-index:9;text-decoration:none;
  padding:8px 14px;border-radius:0 0 10px 0;background:var(--accent);color:#fff;font-size:13px;
}
.skip:focus{left:0}
.meta{color:var(--ink2);font-size:12px;margin:9px 0 24px}
.meta code{font:11.5px ui-monospace,Menlo,monospace;color:var(--ink);background:var(--code-bg);
  border:1px solid var(--line);border-radius:6px;padding:1px 6px}
.meta a{color:var(--accent);text-decoration:none}
.meta a:hover{text-decoration:underline}

.layout{display:grid;grid-template-columns:218px 1fr;gap:18px;align-items:start}
.tabs{display:grid;gap:6px;position:sticky;top:18px}
.tab{
  text-align:left;cursor:pointer;padding:10px 13px;border-radius:12px;
  border:1px solid transparent;background:none;color:var(--ink2);
  font:inherit;font-size:13px;font-weight:600;line-height:1.4;
}
.tab small{display:block;font-weight:400;font-size:11px;opacity:.75}
.tab:hover{background:var(--card)}
.tab.on{background:var(--card);border-color:var(--line);color:var(--ink);box-shadow:var(--shadow)}
.pane{display:none;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
.pane.on{display:block}
.pane-head{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:11px 16px;border-bottom:1px solid var(--line);
}
.pane-name{font-weight:600;font-size:13px}
.pane-name small{color:var(--ink2);font-weight:400;margin-left:9px;font-size:11px}
.pane-tools{display:flex;align-items:center;gap:8px}
.wrap-btn,.copy{
  cursor:pointer;border:1px solid var(--line);background:var(--code-bg);color:var(--ink);
  font:inherit;font-size:12px;font-weight:600;padding:5px 14px;border-radius:9px;white-space:nowrap;
}
.wrap-btn:hover,.copy:hover{border-color:var(--accent);color:var(--accent)}
.wrap-btn.on{border-color:var(--accent);color:var(--accent)}
.copy.ok{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}
.view{margin:0;padding:16px;overflow:auto;max-height:70vh;background:var(--code-bg)}
.view code{font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;display:block}
/* 软换行（默认开）：长行像 <img src=...> 那样动辄溢出 200px，而 macOS 的覆盖式
   滚动条不滚就不显示 —— 用户看到的只是「被裁断」的文本（实测 .view 内容 1008px /
   可视 822px）。默认换行先解决可读性，要原样看长行再关掉。 */
body.wrap-code .view code{white-space:pre-wrap;overflow-wrap:anywhere}
/* 关掉换行时把滚动条常驻，别再让「可横向滚动」这件事藏着 */
.view::-webkit-scrollbar{height:9px;width:9px}
.view::-webkit-scrollbar-thumb{background:var(--line);border-radius:5px}
.view::-webkit-scrollbar-track{background:transparent}
.preview{margin-top:30px}
.preview h2{font-size:15px;font-weight:700;margin:0 0 12px}
.preview h2 small{color:var(--ink2);font-weight:400;font-size:12px;margin-left:9px}
.frame{border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);background:var(--card)}
.frame iframe{display:block;width:100%;height:min(860px,120vh);border:0}
@media(max-width:720px){
  .layout{grid-template-columns:1fr}
  .tabs{position:static;grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto;padding-bottom:4px}
  .tab small{display:none}
  /* 头部换成两行：第一行「图标 ····· 控件」，第二行标题 + 描述通栏 ——
     窄屏下标题被控件挤着换行会很难读（原来就是）。 */
  .hero{flex-wrap:wrap;gap:12px;row-gap:9px}
  .hero-icon{order:1;width:36px;height:36px}
  .lang-sw{order:2;margin-left:auto}
  .icon-btn{order:2}
  .hero-text{order:3;flex:1 1 100%}
  h1{font-size:16px;white-space:normal;overflow:visible;text-overflow:clip}
  .lede{white-space:normal}
  .meta{display:flex;flex-wrap:wrap;gap:2px 10px}
  /* 窄屏下「自动换行」按钮让位给复制（窄屏本来就该换行，且默认已开） */
  .wrap-btn{display:none}
}
</style>
</head>
<body>
<a class="skip" href="#main" data-zh="跳到复制区" data-en="Skip to code">跳到复制区</a>

<main class="wrap" id="main">
${headBrand}
  <div class="layout">
    <nav class="tabs">${tabs}
    </nav>
${panes}
  </div>

  <section class="preview">
    <h2><span data-zh="实时预览" data-en="Live preview">实时预览</span><small>sponsors.html · <span data-zh="iframe 现场渲染，非截图" data-en="rendered live via iframe, not a screenshot">iframe 现场渲染，非截图</span></small></h2>
    <div class="frame"><iframe src="sponsors.html" title="sponsors.html" loading="lazy"></iframe></div>
  </section>
</main>

<script>
(function () {
  var T = {
    zh: { ok: '已复制 ✓', fail: '复制失败' },
    en: { ok: 'Copied ✓', fail: 'Copy failed' },
  };
  function curLang() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  }
  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    var zh = lang !== 'en';
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      var v = el.getAttribute(zh ? 'data-zh' : 'data-en');
      if (v !== null) el.textContent = v;
    });
    // 纯图标按钮没有可见文字，双语只能落在 aria-label 上
    document.querySelectorAll('[data-aria-zh]').forEach(function (el) {
      var v = el.getAttribute(zh ? 'data-aria-zh' : 'data-aria-en');
      if (v !== null) el.setAttribute('aria-label', v);
    });
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      var on = b.dataset.setLang === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.dataset.setLang;
      applyLang(lang);
      try { localStorage.setItem('sponsor-lang', lang); } catch (e) {}   // 与 sponsors.html 共享
      syncFrame();
    });
  });
  applyLang(curLang());

  /* ── 主题切换（外层壳自己的，与预览 / sponsors.html 共享 sponsor-theme）── */
  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var th = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', th);
    try { localStorage.setItem('sponsor-theme', th); } catch (e) {}
    if (window.wbThemeColor) window.wbThemeColor(th);
    syncFrame();
  });

  /* ── 被别的页面嵌走时（如落地页的 Hero 槽位），跟随宿主的语言 / 主题 ──
     协议（iskill-promo-page 的槽位契约）：
       · 首帧——宿主把 lang/theme 写进本页 URL 的 hash，头脚本已经读过了；
       · 之后——宿主切一次推一次 postMessage({promoSlotSync:{lang,theme}})。
     为什么走消息而不是重载 iframe：重载会丢掉用户已经切到的那个 tab（还会闪一下）。

     ⚠️ 这里刻意**不回推** sponsorSync —— 对着干会变成父页↔子页的回环。
     本页自己内部那个 sponsors.html 预览仍要跟上，所以最后调一次 syncFrame()。 */
  window.addEventListener('message', function (e) {
    var s = e.data && e.data.promoSlotSync;
    if (!s) return;
    if (s.lang === 'zh' || s.lang === 'en') applyLang(s.lang);
    if (s.theme === 'light' || s.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', s.theme);
      if (window.wbThemeColor) window.wbThemeColor(s.theme);
    }
    syncFrame();
  });

  /* ── 代码软换行（默认开，偏好记住）── */
  var WRAP_KEY = 'sponsor-wrap';
  function setWrap(on, persist) {
    document.body.classList.toggle('wrap-code', on);
    document.querySelectorAll('.wrap-btn').forEach(function (b) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (persist) { try { localStorage.setItem(WRAP_KEY, on ? '1' : '0'); } catch (e) {} }
  }
  var wrapOn = true;
  try { if (localStorage.getItem(WRAP_KEY) === '0') wrapOn = false; } catch (e) {}
  setWrap(wrapOn, false);
  document.querySelectorAll('.wrap-btn').forEach(function (b) {
    b.addEventListener('click', function () { wrapOn = !wrapOn; setWrap(wrapOn, true); });
  });

  /* ── 与 iframe 里的 sponsors.html 双向同步 ──
     正向：本页切语言 → postMessage 通知 iframe（收到 ack 才算新页面）；
     250ms 无 ack 视为老版赞助页（没有监听器）→ 重载 iframe 让头脚本读 localStorage。
     反向：iframe 里切了语言/主题 → sponsorSync 回传，本页跟随并写 localStorage。 */
  var acked = false;
  function syncFrame() {
    var f = document.querySelector('.preview iframe');
    if (!f) return;
    acked = false;
    try {
      f.contentWindow.postMessage({
        sponsorSync: 1,
        sponsorLang: curLang(),
        sponsorTheme: document.documentElement.getAttribute('data-theme') || ''
      }, '*');
    } catch (e) {}
    setTimeout(function () {
      // 老版赞助页没有监听器 → 重载 iframe，让它自己的头脚本读 hash（带上当前状态，
      // 别用 f.src = f.src —— 那会把 fragment 留在旧值上）
      if (!acked) { try { f.src = 'sponsors.html#' + frameHash(); } catch (e) {} }
    }, 250);
  }
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.sponsorAck) acked = true;
    if (d.sponsorSync) {
      if (d.sponsorLang === 'zh' || d.sponsorLang === 'en') {
        applyLang(d.sponsorLang);
        try { localStorage.setItem('sponsor-lang', d.sponsorLang); } catch (err) {}
      }
      if (d.sponsorTheme === 'light' || d.sponsorTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', d.sponsorTheme);
        try { localStorage.setItem('sponsor-theme', d.sponsorTheme); } catch (err) {}
        if (window.wbThemeColor) window.wbThemeColor(d.sponsorTheme);
      }
    }
  });

  /* ── 首屏对齐：把本页**当前生效**的语言/主题写进预览 iframe 的 hash ──
     为什么必须做：iframe 的 src 是静态的 sponsors.html（没有 fragment），它自己
     的头脚本只认 hash → localStorage → 系统。而本页的头脚本里 **hash 优先于
     localStorage**。两者一旦分叉就露馅：分享出去的 usage.html#theme=light 会让
     本页变亮，iframe 却按 localStorage 里的 dark 渲染 —— 一个页面两种配色（实测
     截图里外层亮色中文、预览暗色英文）。
     走 hash 而不是 postMessage：iframe 的 hash 在它自己的头脚本里**最先**被读到，
     没有「监听器还没绑上」的竞态；原先 postMessage 只在切语言时才发，首屏根本不发。
     语言每次都传（本页一定解析出了值）；主题只在显式选过时才传，没选就让两边
     都跟随系统 —— 这样不会把预览钉死在某一档。 */
  function frameHash() {
    var parts = ['lang=' + curLang()];
    var th0 = document.documentElement.getAttribute('data-theme');
    if (th0 === 'light' || th0 === 'dark') parts.push('theme=' + th0);
    return parts.join('&');
  }
  var frameEl = document.querySelector('.preview iframe');
  if (frameEl) frameEl.src = 'sponsors.html#' + frameHash();

  var codes = {};
  document.querySelectorAll('.pane').forEach(function (pane) {
    var id = pane.dataset.id;
    codes[id] = pane.querySelector('textarea.src').value;
    pane.querySelector('.view code').textContent = codes[id];   // 展示走 textContent，天然免转义
  });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x === t); });
      document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.dataset.id === t.dataset.id); });
    });
  });

  function flash(btn) {
    var t = T[curLang()];
    btn.classList.add('ok'); var old = btn.textContent; btn.textContent = t.ok;
    setTimeout(function () { btn.classList.remove('ok'); btn.textContent = old; }, 1600);
  }
  function copyText(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn); }, function () { legacy(text, btn); });
    } else legacy(text, btn);
  }
  function legacy(text, btn) {  // file:// 下部分浏览器禁用 clipboard API 的兜底
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); flash(btn); } catch (e) { btn.textContent = T[curLang()].fail; }
    document.body.removeChild(ta);
  }
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyText(codes[btn.closest('.pane').dataset.id], btn);
    });
  });
})();
</script>
</body>
</html>
`;
}
