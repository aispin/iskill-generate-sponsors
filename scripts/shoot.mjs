#!/usr/bin/env node
/** 用本机 Chromium 系浏览器无头截图（文档样本 / 视觉验收用）
 *  node shoot.mjs <page.html> <out.png> [width] [height] [light|dark] [lang]
 *
 *  第 5 个参数强制配色方案（Chromium 的 preferredColorScheme：
 *  1=light / 2=dark / 0=跟随系统）。不传则跟随系统外观。
 *
 *  两个引擎，自动选：
 *    · chrome（默认）—— 直接 exec 本机 Chromium。窄屏（<500px）会套 iframe，
 *      因为 headless 的布局视口有 500px 下限。
 *    · agent-browser —— 就是 iskill-ui-verify 用的那套 CLI，浏览器是 daemon，
 *      CDP viewport 也没有 500px 下限。受限沙箱里只有它能活。
 *      强制指定：`SHOOT_ENGINE=agent-browser node shoot.mjs …`
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

/**
 * 必须显式给 `--user-data-dir`：
 * 不给的话 Chrome 会把 profile 落到 `~/Library/Application Support/Google/Chrome for Testing-headless/`
 * 下的临时 scoped 目录，退出时自删——沙箱环境里这个删除会被拦，Chrome 直接 SIGTRAP 崩掉
 * （报错长得像「找不到浏览器」，其实浏览器好好的）。丢到系统临时目录就没事了。
 */
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-shot-'));

const args = [
  '--headless', '--disable-gpu', '--no-proxy-server', '--hide-scrollbars',
  `--force-device-scale-factor=${DPR}`, '--virtual-time-budget=3000',
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
];
// 强制配色 / 语言走页面自己的 #theme= #lang= 开关（比 --blink-settings 可靠，
// 且截图不随本机 macOS 外观漂移）。
// ⚠️ 页面路径自带 fragment 时**要合并**，不能直接丢弃 —— 老实现遇到
// `sponsors.html#pop=1` 就整段跳过，于是 --light --zh 静默失效、截出暗色英文，
// 而文档里看不出哪里错了（实测踩过）。
const qs = [
  scheme === 'light' || scheme === 'dark' ? `theme=${scheme}` : '',
  lang === 'zh' || lang === 'en' ? `lang=${lang}` : '',
].filter(Boolean).join('&');
const hashAt = page.indexOf('#');
const basePath = hashAt < 0 ? page : page.slice(0, hashAt);
const ownFrag = hashAt < 0 ? '' : page.slice(hashAt + 1);
const frag = [ownFrag, qs].filter(Boolean).join('&');
const url = 'file://' + path.resolve(basePath) + (frag ? '#' + frag : '');

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

/**
 * Chromium 自己那层沙箱在某些受限环境（agent 沙箱、部分容器）里起不来，报
 * `aperitif: Failed to initialize sandbox` / `Operation not permitted` 然后崩。
 * 我们截的是本地 file:// 页面，没有不可信内容，所以允许降级：
 *   · 默认先按安全姿势跑一遍；
 *   · 失败就自动补 `--no-sandbox` 重试一次；
 *   · 想直接跳过第一次（省几秒）就设 `CHROME_NO_SANDBOX=1`。
 */
const NO_SANDBOX = ['1', 'true', 'yes'].includes(String(process.env.CHROME_NO_SANDBOX || '').toLowerCase());
const shoot = (extra) => execFileSync(
  chrome, [...args, ...extra, `--screenshot=${path.resolve(out)}`, target], { stdio: 'inherit' },
);

/** 兜底引擎：agent-browser —— 就是 iskill-ui-verify 用的那套 CLI。
 *  为什么需要：受限沙箱里 `execFileSync` 起的 Chromium 会被当成子进程顺手回收
 *  （命令直接 SIGTERM / 退出码 137，日志里只剩一堆无关噪声），
 *  而 agent-browser 把浏览器 daemon 化了，能活；它的 CDP viewport 也**没有**
 *  headless 的 500px 下限 —— 所以窄屏不用套 iframe，直接给真实宽度。
 *  本机没装 agent-browser 就跳过这一档，不影响正常环境。 */
function findAgentBrowser() {
  const cands = [
    process.env.AGENT_BROWSER,
    path.join(os.homedir(), '.workbuddy/binaries/node/versions/22.22.2-3/bin/agent-browser'),
    '/opt/homebrew/bin/agent-browser',
    '/usr/local/bin/agent-browser',
  ].filter(Boolean);
  return cands.find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

function shootViaAgentBrowser(ab) {
  const steps = [
    ['open', url],
    ['set', 'viewport', String(Number(w)), String(Number(h)), String(DPR)],
    ['wait', '1200'],
    // 懒加载图不顶成 eager，截到的是「没图时」的盒子高度
    ['eval', "document.querySelectorAll('img[loading=\"lazy\"]').forEach(function(e){e.loading='eager';});true"],
    ['wait', '900'],
    ['screenshot', path.resolve(out)],
    ['close', '--all'],
  ];
  // stdout 是 batch 的 JSON，默认太吵 —— 吞掉，失败时再把原文吐出来定位
  const outJson = execFileSync(ab, ['batch', '--bail', '--json'], {
    input: JSON.stringify(steps), stdio: ['pipe', 'pipe', 'inherit'],
  }).toString();
  const bad = (JSON.parse(outJson) || []).find(s => !s.success);
  if (bad) throw new Error('agent-browser 步骤失败：' + JSON.stringify(bad));
}

let engine = 'chrome';
const preferAB = process.env.SHOOT_ENGINE === 'agent-browser'
  // 受限沙箱里 exec 起 Chromium 会把**整棵进程树**连本脚本一起干掉（node 连 catch 的机会都没有），
  // 所以必须在起进程**之前**就判断，不能靠运行时兜底。这两个是 WorkBuddy 沙箱的标记。
  || !!(process.env.CODEBUDDY_SAFE_DELETE_SANDBOX || process.env.CODEBUDDY_SANDBOX_BROKER_IPC_ADDRESS);
const ab = preferAB ? findAgentBrowser() : null;

if (ab) {
  shootViaAgentBrowser(ab);
  engine = 'agent-browser';
} else {
  try {
    if (NO_SANDBOX) shoot(['--no-sandbox']);
    else {
      try { shoot([]); }
      catch {
        console.error('…截图失败，改用 --no-sandbox 重试（受限沙箱里 Chromium 内层沙箱起不来）');
        shoot(['--no-sandbox']);
      }
    }
  } catch (e) {
    const late = findAgentBrowser();
    if (!late) throw e;
    console.error('…Chromium 起不来，改用 agent-browser 兜底（无需 iframe，窄屏走真实视口）');
    shootViaAgentBrowser(late);
    engine = 'agent-browser';
  }
}

// 裁掉 iframe 两侧的留白（居中裁剪，与包装页的 justify-content:center 对齐）
// agent-browser 走真实视口，没有留白，不用裁。
if (crop && engine === 'chrome') {
  try {
    execFileSync('sips', ['-c', String(crop.h), String(crop.w), path.resolve(out), '--out', path.resolve(out)], { stdio: 'ignore' });
  } catch { /* 没有 sips 就保留留白，不影响验收 */ }
}
if (wrapper) { try { fs.unlinkSync(wrapper); } catch {} }
try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* 沙箱可能拒绝删除，留给系统清理 */ }

console.log('✓', out, `${(fs.statSync(out).size / 1024).toFixed(1)} KB`,
  engine === 'agent-browser' ? '(agent-browser)' : (wrapper ? `(iframe 模拟 ${w}px 视口)` : ''));
