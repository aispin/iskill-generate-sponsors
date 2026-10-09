/**
 * @iskill-source iskill-crop-qrcode/scripts/lib/qrcrop.mjs
 * @iskill-version 1.0.0
 *
 * 二维码自动定位与裁剪（零三方依赖）。
 * ---------------------------------------------------------------------------
 * 目标：用户随手截的收款海报（带 logo / 标语 / 大片背景色）自动裁出二维码主体，
 * 让多张码在同一页面里视觉统一。`--skip-crop` 可整段跳过。
 *
 * 管线：sips 缩到分析尺寸 → 输出 BMP（Node 标准库唯一能裸解的位图格式）
 *      → 自适应阈值二值化（Bradley，积分图）→ 行列双向扫 1:1:3:1:1 finder 图案
 *      → 候点聚类 → 三点组右三角校验 → 定位三个定位角 → 还原原图坐标
 *      → sips --cropOffset 裁剪。
 *
 * 只定位不解码，几百行内做完；检不出就返回 null（调用方原样走旧管线）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ANALYZE_EDGE = 480;     // 分析用缩略图长边
const RATIO_TOL = 0.45;       // finder 比例容差（以模块宽为单位）
const MIN_MODULE = 2.2;       // 分析尺度下模块宽下限（px）
const MAX_MODULE = 90;        // 上限（过滤海报大字 / 色块）

/** sips 可用时才谈裁剪 */
export function hasSips() {
  try { execFileSync('sips', ['--version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

/* ────────────────────────────────────────────── BMP 解码（sips 产物 24bpp） */

function decodeBmp(buf) {
  if (buf.length < 54 || buf.toString('ascii', 0, 2) !== 'BM') return null;
  const offset = buf.readUInt32LE(10);
  const w = buf.readInt32LE(18);
  let h = buf.readInt32LE(22);
  const bpp = buf.readUInt16LE(28);
  if (bpp !== 24) return null;
  const bottomUp = h > 0;
  h = Math.abs(h);
  const rowSize = (w * 3 + 3) & ~3;
  if (buf.length < offset + rowSize * h) return null;
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const srcY = bottomUp ? (h - 1 - y) : y;
    let p = offset + srcY * rowSize;
    for (let x = 0; x < w; x++, p += 3) {
      // BMP 是 BGR；灰度用感知加权
      gray[y * w + x] = 0.299 * buf[p + 2] + 0.587 * buf[p + 1] + 0.114 * buf[p];
    }
  }
  return { w, h, gray };
}

/** 缩略图 → 灰度矩阵；失败返回 null */
function analyzeBitmap(src, tmpDir) {
  const bmp = path.join(tmpDir, `qrcrop-${process.pid}-${path.basename(src)}.bmp`);
  try {
    execFileSync('sips', ['-Z', String(ANALYZE_EDGE), '-s', 'format', 'bmp', src, '--out', bmp], { stdio: 'ignore' });
    return decodeBmp(fs.readFileSync(bmp));
  } catch { return null; }
  finally { try { fs.unlinkSync(bmp); } catch {} }
}

/* ──────────────────────────────────────────────────── Bradley 自适应二值化 */

function binarize({ w, h, gray }) {
  // 积分图
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + rowSum;
    }
  }
  const win = Math.max(9, (Math.min(w, h) / 14) | 1);
  const t = 0.85;                     // Bradley-Roth：低于窗口均值 85% 视为暗
  const bin = new Uint8Array(w * h);  // 1 = 暗模块
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - win), y1 = Math.min(h - 1, y + win);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - win), x1 = Math.min(w - 1, x + win);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integ[(y1 + 1) * (w + 1) + x1 + 1] - integ[y0 * (w + 1) + x1 + 1]
                - integ[(y1 + 1) * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
      bin[y * w + x] = gray[y * w + x] < sum / area * t ? 1 : 0;
    }
  }
  return bin;
}

/* ───────────────────────────────────────────────────── finder 图案行列扫描 */

/** 一行/列的游程里找 1:1:3:1:1（暗-亮-暗-亮-暗），返回候选中心与模块宽 */
function scanRuns(runs, cand) {
  if (runs.length < 5) return;
  for (let i = 0; i + 4 < runs.length; i++) {
    const [a, b, c, d, e] = runs.slice(i, i + 5);
    if (!a.dark || b.dark || !c.dark || d.dark || !e.dark) continue;
    const m = c.len / 3;                       // 中心暗段应占 3 模块
    if (m < MIN_MODULE || m > MAX_MODULE) continue;
    const ok = v => Math.abs(v - m) <= m * RATIO_TOL;
    if (!ok(a.len) || !ok(b.len) || !ok(d.len) || !ok(e.len)) continue;
    // 五段总长应 ≈ 7 模块，滤掉巧合
    const total = a.len + b.len + c.len + d.len + e.len;
    if (Math.abs(total - m * 7) > m * RATIO_TOL * 3) continue;
    cand.push({ center: c.start + c.len / 2, module: m });
  }
}

function rowRuns(bin, w, y) {
  const runs = [];
  let dark = bin[y * w] === 1, start = 0;
  for (let x = 1; x <= w; x++) {
    const d = x < w && bin[y * w + x] === 1;
    if (d !== dark || x === w) { runs.push({ dark, start, len: x - start }); dark = d; start = x; }
  }
  return runs;
}
function colRuns(bin, w, h, x) {
  const runs = [];
  let dark = bin[x] === 1, start = 0;
  for (let y = 1; y <= h; y++) {
    const d = y < h && bin[y * w + x] === 1;
    if (d !== dark || y === h) { runs.push({ dark, start, len: y - start }); dark = d; start = y; }
  }
  return runs;
}

/** 候点按邻近聚类（距离 < 模块宽 × 6 视为同一定位角） */
function cluster(cands) {
  const groups = [];
  for (const c of cands.sort((p, q) => p.x - q.x || p.y - q.y)) {
    const g = groups.find(g =>
      Math.abs(g.cx - c.x) < g.m * 6 && Math.abs(g.cy - c.y) < g.m * 6);
    if (g) {
      const n = g.n + 1;
      g.cx += (c.x - g.cx) / n; g.cy += (c.y - g.cy) / n;
      g.m += (c.m - g.m) / n; g.n = n;
    } else {
      groups.push({ cx: c.x, cy: c.y, m: c.m, n: 1 });
    }
  }
  // 噪声簇（只有零星命中）丢弃
  return groups.filter(g => g.n >= 3).sort((a, b) => b.n - a.n).slice(0, 6);
}

/** 三个定位角应构成等腰直角三角形（斜边 ≈ 直角边 × √2） */
function pickTriple(gs) {
  let best = null;
  const dist = (p, q) => Math.hypot(p.cx - q.cx, p.cy - q.cy);
  for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) for (let k = j + 1; k < gs.length; k++) {
    const [p, q, r] = [gs[i], gs[j], gs[k]];
    const ds = [dist(p, q), dist(p, r), dist(q, r)].sort((a, b) => a - b);
    const [leg1, leg2, hyp] = ds;
    if (leg1 < gs[i].m * 14) continue;             // 太近不是真定位角
    const mMed = Math.median([p.m, q.m, r.m]);
    if (Math.max(p.m, q.m, r.m) / mMed > 1.6) continue;
    const legDiff = Math.abs(leg2 - leg1) / leg2;
    const hypRatio = hyp / (leg1 * Math.SQRT2);
    const score = legDiff + Math.abs(1 - hypRatio);
    if (legDiff < 0.28 && Math.abs(1 - hypRatio) < 0.22 && (!best || score < best.score)) {
      best = { score, pts: [p, q, r] };
    }
  }
  return best;
}

Math.median = arr => { const s = [...arr].sort((a, b) => a - b); return s[s.length >> 1]; };

/* ─────────────────────────────────────────────────────────────── 对外 API */

/** 诊断：输出各阶段中间量（调参用） */
export function detectDebug(src, tmpDir = os.tmpdir()) {
  const bmp = analyzeBitmap(src, tmpDir);
  if (!bmp) return { stage: 'bmp' };
  const bin = binarize(bmp);
  const cands = [];
  for (let y = 0; y < bmp.h; y++) {
    const out = [];
    scanRuns(rowRuns(bin, bmp.w, y), out);
    for (const c of out) cands.push({ x: c.center, y, m: c.module });
  }
  const verified = [];
  for (const c of cands) {
    const x = Math.round(c.x);
    if (x < 0 || x >= bmp.w) continue;
    const vRuns = colRuns(bin, bmp.w, bmp.h, x);
    const out = [];
    scanRuns(vRuns, out);
    if (out.some(v => Math.abs(v.center - c.y) < c.m * 3 && v.module / c.m < 1.5 && c.m / v.module < 1.5)) {
      verified.push({ x: c.x, y: c.y, m: c.m });
    }
  }
  const gs = cluster(verified);
  return {
    stage: 'ok', an: { w: bmp.w, h: bmp.h },
    rowCands: cands.length, verified: verified.length, clusters: gs,
    triple: gs.length >= 3 ? pickTriple(gs) : null,
  };
}

/**
 * 检测二维码在原图中的包围盒。返回 {x,y,w,h} 或 null。
 * 原理：QR 三个定位图案的外缘就贴着码边界 → 三点外扩 3.5 模块即码包围盒。
 */
export function detectQrBox(src, tmpDir = os.tmpdir()) {
  const bmp = analyzeBitmap(src, tmpDir);
  if (!bmp) return null;
  const bin = binarize(bmp);
  const cands = [];
  for (let y = 0; y < bmp.h; y++) {
    for (const c of (() => { const out = []; scanRuns(rowRuns(bin, bmp.w, y), out); return out; })()) {
      cands.push({ x: c.center, y, m: c.module, axis: 'h' });
    }
  }
  // 行扫描的候选做列验证：中心列的纵向游程同样要满足 1:1:3:1:1
  const verified = [];
  for (const c of cands) {
    const x = Math.round(c.x);
    if (x < 0 || x >= bmp.w) continue;
    const vRuns = colRuns(bin, bmp.w, bmp.h, x);
    const out = [];
    scanRuns(vRuns, out);
    if (out.some(v => Math.abs(v.center - c.y) < c.m * 3 && v.module / c.m < 1.5 && c.m / v.module < 1.5)) {
      verified.push({ x: c.x, y: c.y, m: c.m });
    }
  }
  if (verified.length < 6) return null;            // 每个定位角会有多行命中，阈值保守些
  const gs = cluster(verified);
  if (gs.length < 3) return null;
  const tri = pickTriple(gs);
  if (!tri) return null;
  const { pts } = tri;
  const m = Math.median(pts.map(p => p.m));
  const minX = Math.min(...pts.map(p => p.cx)) - 3.5 * m;
  const maxX = Math.max(...pts.map(p => p.cx)) + 3.5 * m;
  const minY = Math.min(...pts.map(p => p.cy)) - 3.5 * m;
  const maxY = Math.max(...pts.map(p => p.cy)) + 3.5 * m;

  return {
    box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    an: { w: bmp.w, h: bmp.h }, gray: bmp.gray, bin, module: m,
  };
}

/**
 * 裁出二维码主体：正方形、只含码本体 + 安静区（约 8% 呼吸边），
 * 不带海报文案、不带卡片边框 —— 渠道名/署名由组件和 README 自己渲染。
 * 成功返回 { dest, box, ratio }；失败返回 null。
 * - ratio：裁剪面积占原图比例。≥0.95 说明图本身已经紧凑，不值得裁。
 */
export function cropQr(src, { tmpDir = os.tmpdir(), padRatio = 0.06 } = {}) {
  const det = detectQrBox(src, tmpDir);
  if (!det) return null;
  const dim = getImageDim(src);
  if (!dim) return null;
  const scale = dim.w / det.an.w;                  // 分析图 → 原图（等比缩放，横纵同因子）
  const qr = det.box;
  const pad = Math.max(qr.w, qr.h) * padRatio;     // 安静区（二维码规范本身要求 4 模块留白）

  let cw = Math.round((Math.max(qr.w, qr.h) + pad * 2) * scale);
  let cx = Math.round((qr.x + qr.w / 2) * scale - cw / 2);
  let cy = Math.round((qr.y + qr.h / 2) * scale - cw / 2);
  // 出界取齐
  cx = Math.min(Math.max(cx, 0), Math.max(0, dim.w - cw));
  cy = Math.min(Math.max(cy, 0), Math.max(0, dim.h - cw));
  cw = Math.min(cw, dim.w, dim.h);
  if (cw < dim.w * 0.05) return null;              // 小得离谱，多半是误检
  const ratio = (cw * cw) / (dim.w * dim.h);
  if (ratio >= 0.95) return null;                  // 图已紧凑，裁了没意义

  const dest = path.join(tmpDir, `qrcrop-${process.pid}-${path.basename(src, path.extname(src))}.jpg`);
  try {
    execFileSync('sips', ['--cropOffset', String(cy), String(cx), '-c', String(cw), String(cw), src, '--out', dest], { stdio: 'ignore' });
    return { dest, box: { x: cx, y: cy, w: cw, h: cw }, ratio };
  } catch { return null; }
}

function getImageDim(src) {
  try {
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src], { encoding: 'utf8' });
    const w = /pixelWidth:\s*(\d+)/.exec(out)?.[1];
    const h = /pixelHeight:\s*(\d+)/.exec(out)?.[1];
    if (w && h) return { w: +w, h: +h };
  } catch {}
  return null;
}
