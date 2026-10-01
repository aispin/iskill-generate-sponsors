/**
 * index.html 生成器 —— 面向开发者的「源码复制页」（中英双语）。
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
        <button class="copy" type="button" data-zh="复制" data-en="Copy">复制</button>
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
        <button class="lang-btn" type="button" data-set-lang="zh">中</button><button class="lang-btn" type="button" data-set-lang="en">EN</button>
      </span>
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
.copy{
  cursor:pointer;border:1px solid var(--line);background:var(--code-bg);color:var(--ink);
  font:inherit;font-size:12px;font-weight:600;padding:5px 14px;border-radius:9px;white-space:nowrap;
}
.copy:hover{border-color:var(--accent);color:var(--accent)}
.copy.ok{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}
.view{margin:0;padding:16px;overflow:auto;max-height:70vh;background:var(--code-bg)}
.view code{font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;display:block}
.preview{margin-top:30px}
.preview h2{font-size:15px;font-weight:700;margin:0 0 12px}
.preview h2 small{color:var(--ink2);font-weight:400;font-size:12px;margin-left:9px}
.frame{border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);background:var(--card)}
.frame iframe{display:block;width:100%;height:min(860px,120vh);border:0}
@media(max-width:720px){
  .layout{grid-template-columns:1fr}
  .tabs{position:static;grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto;padding-bottom:4px}
  .tab small{display:none}
  .hero{gap:12px}
  .hero-icon{width:40px;height:40px}
  h1{font-size:16px;white-space:normal;overflow:visible;text-overflow:clip}
  .lede{white-space:normal}
  .meta{display:flex;flex-wrap:wrap;gap:2px 10px}
}
</style>
</head>
<body>
<main class="wrap">
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
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.setLang === lang);
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
      if (!acked) { try { f.src = f.src; } catch (e) {} }
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
      }
    }
  });

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
