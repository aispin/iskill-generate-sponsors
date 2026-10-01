/**
 * index.html 生成器 —— 面向开发者的「源码复制页」。
 * 与公开页 sponsors.html 分开：公开页保持纯净，复制工具不掺进去。
 *
 * 头部版式参照 iskill 系控制台：应用图标 + 大写标题 + 一句描述 + 元信息行（更新于 … · …）。
 * 图标源件 scripts/assets/icon.svg 由 iskill-app-icon 生成（--glyph s --color 主题色），
 * 构建时读进来内联（页面保持单文件零依赖），同时做成 data URI favicon。
 *
 * 源码用隐藏 <textarea> 承载（只有 </textarea> 能截断它，产出的 md/yml/jsx/vue
 * 都不会包含），展示时用 textContent 写进 <pre>，复制时直接取 .value ——
 * 全程不经 innerHTML，无需转义。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export function renderSourceHtml(opt, artifacts) {
  const icon = loadIconSvg();
  const favicon = icon ? `data:image/svg+xml,${encodeURIComponent(icon)}` : null;

  const tabs = artifacts.map((a, i) => `
      <button class="tab${i === 0 ? ' on' : ''}" type="button" data-id="${a.id}">${esc(a.label)}<small>${esc(a.hint)}</small></button>`).join('');

  const panes = artifacts.map((a, i) => `
    <section class="pane${i === 0 ? ' on' : ''}" data-id="${a.id}">
      <div class="pane-head">
        <span class="pane-name">${esc(a.label)}<small>${esc(a.meta)}</small></span>
        <button class="copy" type="button">复制</button>
      </div>
      <textarea class="src" hidden>${a.code.replace(/</g, '&lt;')}</textarea>
      <pre class="view"><code></code></pre>
    </section>`).join('');

  const headBrand = `
    <header class="hero">
      ${icon ? `<span class="hero-icon">${icon}</span>` : ''}
      <div class="hero-text">
        <h1>${esc(opt.project)}</h1>
        <p class="lede">${esc(opt.tagline)} 点「复制」拿到产物源码，直接粘进你的项目。</p>
      </div>
    </header>
    <p class="meta">更新于 ${formatTs()} · 图片在 <code>${esc(opt.imgBase)}/</code> · 公开预览页 <a href="sponsors.html">sponsors.html</a></p>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>源码复制 · ${esc(opt.title)}</title>
${favicon ? `<link rel="icon" type="image/svg+xml" href="${favicon}">` : ''}
<meta name="color-scheme" content="light dark">
<script>
/* 与 sponsors.html 同款三级兜底：#theme= → localStorage → 系统 */
try{
  var m=(location.hash||'').match(/theme=(light|dark)/);
  var t=m?m[1]:localStorage.getItem('sponsor-theme');
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);
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
.wrap{max-width:1060px;margin:0 auto}

/* ── 头部：图标 + 标题 + 描述，下面一行元信息 ───────────────── */
.hero{display:flex;align-items:center;gap:15px;min-width:0}
.hero-icon{flex:none;width:46px;height:46px}
.hero-icon svg{width:100%;height:100%;display:block;border-radius:11px;box-shadow:0 4px 14px -6px rgba(16,32,56,.35)}
.hero-text{min-width:0}
h1{
  font-size:19px;font-weight:800;letter-spacing:.02em;margin:0;line-height:1.35;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.lede{color:var(--ink2);margin:3px 0 0;font-size:13px;line-height:1.6;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta{color:var(--ink2);font-size:12px;margin:9px 0 24px}
.meta code{font:11.5px ui-monospace,Menlo,monospace;color:var(--ink);background:var(--code-bg);
  border:1px solid var(--line);border-radius:6px;padding:1px 6px}
.meta a{color:var(--accent);text-decoration:none}
.meta a:hover{text-decoration:underline}

.layout{display:grid;grid-template-columns:218px 1fr;gap:18px;align-items:start}
.preview{margin-top:30px}
.preview h2{font-size:15px;font-weight:700;margin:0 0 12px}
.preview h2 small{color:var(--ink2);font-weight:400;font-size:12px;margin-left:9px}
.frame{border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);background:var(--card)}
.frame iframe{display:block;width:100%;height:min(860px,120vh);border:0}
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
    <h2>实时预览<small>sponsors.html · iframe 现场渲染，非截图</small></h2>
    <div class="frame"><iframe src="sponsors.html" title="sponsors.html 实时预览" loading="lazy"></iframe></div>
  </section>
</main>

<script>
(function () {
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
    btn.classList.add('ok'); var old = btn.textContent; btn.textContent = '已复制 ✓';
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
    try { document.execCommand('copy'); flash(btn); } catch (e) { btn.textContent = '复制失败'; }
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
