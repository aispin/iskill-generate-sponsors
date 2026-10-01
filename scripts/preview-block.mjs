#!/usr/bin/env node
/**
 * iskill-generate-sponsors · README 区块预览
 * ---------------------------------------------------------------------------
 * 把 SPONSORS.md 里 marker 之间的**真实产物**渲染成 HTML（近似 GitHub 的排版），
 * 供 make-samples.sh 截图进文档。
 *
 * 为什么只认这几个语法：本技能生成的 Markdown 只用得到
 * `## 标题` / 段落 / `| 表格 |` / `[文字](链接)` / 裸 HTML 片段，
 * 所以这里只实现这个子集 —— 不是通用 Markdown 渲染器，也不打算是。
 *
 *   node preview-block.mjs <SPONSORS.md> <out.html> [baseDir]
 *
 * baseDir：图片相对路径的解析基准（预览页通常写在临时目录，需要 <base> 指回仓库根）
 */
import fs from 'node:fs';
import path from 'node:path';

const MARK_START = '<!-- sponsors:start -->';
const MARK_END = '<!-- sponsors:end -->';

const [src, out, baseDir] = process.argv.slice(2);
if (!src || !out) { console.error('用法：node preview-block.mjs <SPONSORS.md> <out.html> [baseDir]'); process.exit(1); }

const text = fs.readFileSync(src, 'utf8');
const lines = text.split('\n');
const si = lines.findIndex(l => l.trim() === MARK_START);
const ei = lines.findIndex((l, i) => i > si && l.trim() === MARK_END);
if (si < 0 || ei < 0) { console.error(`在 ${src} 里找不到 marker 区块`); process.exit(2); }
const block = lines.slice(si + 1, ei).join('\n');

// ── 子集渲染 ─────────────────────────────────────────────────────────
const inline = s => s
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

const html = [];
const buf = [];
const flush = () => { if (buf.length) { html.push(`<p>${inline(buf.join(' '))}</p>`); buf.length = 0; } };
const table = [];

for (const raw of block.split('\n')) {
  const line = raw.trim();

  if (line.startsWith('|')) { flush(); table.push(line); continue; }
  if (table.length) {
    const rows = table.filter(l => !/^\|\s*-+/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    html.push('<table><tbody>' + rows.map((cells, i) => {
      const tag = i === 0 ? 'th' : 'td';
      return '<tr>' + cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>';
    }).join('') + '</tbody></table>');
    table.length = 0;
  }

  if (!line) { flush(); continue; }
  // 裸 HTML 片段 / 只由实体与空白组成的行 —— 都直接透传，别包 <p>
  // （包裹会提前闭合外层 <p align="center">，两张码会被拆成上下两行）
  if (line.startsWith('<') || /^(&[a-z]+;|\s)+$/i.test(line)) { flush(); html.push(line); continue; }
  if (/^#{1,6} /.test(line)) { flush(); const n = line.match(/^#+/)[0].length; html.push(`<h${n}>${inline(line.replace(/^#+\s*/, ''))}</h${n}>`); continue; }
  buf.push(line);
}
flush();
if (table.length) { /* 收尾兜底 */ }

const page = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>README 赞助区块预览</title>
${baseDir ? `<base href="file://${path.resolve(baseDir)}/">` : ''}
<style>
  :root{color-scheme:light}
  body{
    margin:0;padding:40px 36px 48px;background:#ffffff;color:#1f2328;
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  }
  .card{max-width:860px;margin:0 auto;border:1px solid #d1d9e0;border-radius:10px;overflow:hidden}
  .bar{display:flex;align-items:center;gap:8px;padding:11px 16px;background:#f6f8fa;border-bottom:1px solid #d1d9e0;font-size:12.5px;color:#59636e}
  .dot{width:11px;height:11px;border-radius:50%;background:#d1d9e0}
  .bar b{margin-left:6px;color:#1f2328;font-size:12.5px;font-weight:600}
  .body{padding:26px 30px 32px}
  .body>*:first-child{margin-top:0}
  h2{font-size:1.4em;font-weight:600;margin:0 0 16px;padding-bottom:.3em;border-bottom:1px solid #d1d9e0}
  p{margin:0 0 16px}
  p[align="center"]{margin:8px 0 16px}
  img{vertical-align:middle;max-width:100%;border:1px solid #eaeef2;border-radius:8px;background:#fff}
  table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:14.5px}
  th,td{border:1px solid #d1d9e0;padding:7px 13px;text-align:left}
  th{background:#f6f8fa;font-weight:600}
  sub{font-size:.78em;color:#59636e}
  a{color:#0969da;text-decoration:none}
  code{background:rgba(129,139,152,.12);padding:.2em .4em;border-radius:6px;font-size:85%}
</style></head>
<body>
<div class="card">
  <div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><b>README.md</b><span>· 赞助区块（由 iskill-generate-sponsors 注入）</span></div>
  <div class="body">
${html.join('\n')}
  </div>
</div>
</body></html>
`;

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, page);
console.log('✓', out);
