/**
 * sponsors-source.html 生成器 —— 面向开发者的「源码复制页」。
 * 与公开页 sponsors.html 分开：公开页保持纯净，复制工具不掺进去。
 *
 * 源码用隐藏 <textarea> 承载（只有 </textarea> 能截断它，产出的 md/yml/jsx/vue
 * 都不会包含），展示时用 textContent 写进 <pre>，复制时直接取 .value ——
 * 全程不经 innerHTML，无需转义。
 */
import { GEN_URL } from './lib/model.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderSourceHtml(opt, artifacts) {
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

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>源码复制 · ${esc(opt.title)}</title>
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
  margin:0; padding:32px 18px 56px; color:var(--ink);
  font:14px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  background:var(--bg);
}
.wrap{max-width:1060px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px}
.lede{color:var(--ink2);margin:0 0 22px;font-size:13px}
.lede a{color:var(--accent);text-decoration:none}
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
@media(max-width:720px){
  .layout{grid-template-columns:1fr}
  .tabs{position:static;grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto;padding-bottom:4px}
  .tab small{display:none}
}
</style>
</head>
<body>
<main class="wrap">
  <h1>源码复制 · ${esc(opt.project)}</h1>
  <p class="lede">下面是本次生成的全部文本产物，点「复制」直接粘贴进你的项目。图片在 <code>${esc(opt.imgBase)}/</code>；公开预览页是 <a href="sponsors.html">sponsors.html</a>。</p>
  <div class="layout">
    <nav class="tabs">${tabs}
    </nav>
${panes}
  </div>
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
