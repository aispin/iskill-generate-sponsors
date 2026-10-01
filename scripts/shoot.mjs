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

const [page, out, w = '1100', h = '1400', scheme = ''] = process.argv.slice(2);
if (!page || !out) { console.error('用法：node shoot.mjs <page.html> <out.png> [w] [h] [light|dark]'); process.exit(1); }
const chrome = findChrome();
if (!chrome) { console.error('找不到 Chromium 系浏览器，可用 CHROME=/path/to/chrome 指定。'); process.exit(2); }

const args = [
  '--headless', '--disable-gpu', '--no-proxy-server', '--hide-scrollbars',
  '--force-device-scale-factor=2', '--virtual-time-budget=3000',
  `--window-size=${w},${h}`,
];
// 强制配色走页面自己的 #theme= 开关（比 --blink-settings 可靠，且截图不随本机外观漂移）
const url = 'file://' + path.resolve(page) + (scheme === 'light' || scheme === 'dark' ? `#theme=${scheme}` : '');

execFileSync(chrome, [...args, `--screenshot=${path.resolve(out)}`, url], { stdio: 'inherit' });

console.log('✓', out, `${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
