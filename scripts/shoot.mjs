#!/usr/bin/env node
/** 用本机 Chromium 系浏览器无头截图（文档样本 / 视觉验收用）
 *  node shoot.mjs <page.html> <out.png> [width] [height] [light|dark]
 *
 *  第 5 个参数强制配色方案（Chromium 的 preferredColorScheme：
 *  1=light / 2=dark / 0=跟随系统）。不传则跟随系统外观。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  path.join(os.homedir(), '.agent-browser/browsers/chrome-*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
];

function findChrome() {
  for (const c of CANDIDATES) {
    if (!c) continue;
    for (const p of expand(c)) if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}
function expand(pat) {
  if (!pat.includes('*')) return [pat];
  const dir = pat.slice(0, pat.indexOf('*'));
  const base = dir.slice(0, dir.lastIndexOf('/', dir.length - 2) + 1);
  const rest = pat.slice(base.length);
  const globPart = rest.split('/')[0];
  let names = [];
  try { names = fs.readdirSync(base); } catch { return []; }
  const re = new RegExp('^' + globPart.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return names.filter(n => re.test(n)).sort().map(n => path.join(base, n, rest.split('/').slice(1).join('/')));
}

/**
 * headless Chrome 的**布局视口有 500px 下限**：--window-size=390 会被钳成 500，
 * 截图再裁到 390 —— 于是「窄屏截图」看起来像页面溢出，其实是被截掉了右边。
 * 绕法：把目标页塞进一个固定宽度的 <iframe>（iframe 有自己的 layout viewport），
 * 截外层后再居中裁掉两侧留白。不这么做，所有移动端验收都是假的。
 */
const MIN_VIEWPORT = 500;
const DPR = 2;

const [page, out, w = '1100', h = '1400', scheme = '', lang = ''] = process.argv.slice(2);
if (!page || !out) {
  console.error('用法：node shoot.mjs <page.html> <out.png> [w] [h] [light|dark] [zh|en]');
  process.exit(1);
}
const chrome = findChrome();
if (!chrome) { console.error('找不到 Chromium 系浏览器，可用 CHROME=/path/to/chrome 指定。'); process.exit(2); }

const args = [
  '--headless', '--disable-gpu', '--no-proxy-server', '--hide-scrollbars',
  `--force-device-scale-factor=${DPR}`, '--virtual-time-budget=3000',
];
// 强制配色 / 语言走页面自己的 #theme= #lang= 开关（比 --blink-settings 可靠，
// 且截图不随本机 macOS 外观漂移）。页面路径自带 # 时不再追加。
const qs = [
  scheme === 'light' || scheme === 'dark' ? `theme=${scheme}` : '',
  lang === 'zh' || lang === 'en' ? `lang=${lang}` : '',
].filter(Boolean).join('&');
const url = 'file://' + path.resolve(page) + (page.includes('#') ? '' : (qs ? '#' + qs : ''));

// ── 窄屏：套 iframe 包装页 ──
let target = url;
let shotW = Number(w);
let crop = null;
let wrapper = null;

if (Number(w) < MIN_VIEWPORT) {
  wrapper = path.join(os.tmpdir(), `shoot-wrap-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(wrapper, `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#fff;overflow:hidden}
  body{display:flex;justify-content:center}
  iframe{display:block;width:${Number(w)}px;height:${Number(h)}px;border:0}
</style></head><body><iframe src="${url}"></iframe></body></html>
`);
  target = 'file://' + wrapper;
  shotW = MIN_VIEWPORT;
  crop = { h: Number(h) * DPR, w: Number(w) * DPR };
}

args.push(`--window-size=${shotW},${h}`);
execFileSync(chrome, [...args, `--screenshot=${path.resolve(out)}`, target], { stdio: 'inherit' });

// 裁掉 iframe 两侧的留白（居中裁剪，与包装页的 justify-content:center 对齐）
if (crop) {
  try {
    execFileSync('sips', ['-c', String(crop.h), String(crop.w), path.resolve(out), '--out', path.resolve(out)], { stdio: 'ignore' });
  } catch { /* 没有 sips 就保留留白，不影响验收 */ }
}
if (wrapper) { try { fs.unlinkSync(wrapper); } catch {} }

console.log('✓', out, `${(fs.statSync(out).size / 1024).toFixed(1)} KB`,
  wrapper ? `(iframe 模拟 ${w}px 视口)` : '');
