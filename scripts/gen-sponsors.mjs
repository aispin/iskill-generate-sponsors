#!/usr/bin/env node
/**
 * iskill-generate-sponsors · 主生成器
 * ---------------------------------------------------------------------------
 * 输入：收款码图片（微信/支付宝/PayPal/任意）
 * 输出：.github/sponsor/*.jpg + .github/FUNDING.yml + SPONSORS.md
 *       + sponsors.html + README 内联区块（marker 包裹，可重复运行覆盖）
 *
 * 零三方依赖（Node 18+ 标准库）。图片压缩优先用 macOS 自带 sips，
 * 没有 sips（Linux/Windows）时原样拷贝，不影响其余产物。
 *
 * 用法：
 *   node gen-sponsors.mjs --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi
 *   node gen-sponsors.mjs --config sponsors.config.json --out .
 *   node gen-sponsors.mjs --help
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { GEN_URL, UI, MD, buildModel, pick, qrText, fill } from './lib/model.mjs';
import { renderReact } from './render-react.mjs';
import { renderVue } from './render-vue.mjs';
import { renderSourceHtml } from './render-source.mjs';
import { cropQr } from './lib/qrcrop.mjs';

// ─────────────────────────────────────────────────────────────── 常量

const MARK_START = '<!-- sponsors:start -->';
const MARK_END = '<!-- sponsors:end -->';

/** 已知渠道：文件名/标签命中 keyword 时套用 label / accent / tip（en 供双语产物用） */
const CHANNELS = [
  { key: 'alipay',   label: '支付宝', accent: '#1677FF', kw: /(alipay|zhifubao|支付宝)/i, tip: '打开支付宝「扫一扫」',
    en: { label: 'Alipay',    tip: 'Scan with Alipay' } },
  { key: 'wechat',   label: '微信',   accent: '#07C160', kw: /(wechat|weixin|微信)/i,    tip: '打开微信「扫一扫」',
    en: { label: 'WeChat',    tip: 'Scan with WeChat' } },
  { key: 'qq',       label: 'QQ',     accent: '#12B7F5', kw: /(qq钱包|qqpay|\bqq\b)/i,    tip: '打开 QQ「扫一扫」',
    en: { label: 'QQ Wallet', tip: 'Scan with QQ' } },
  { key: 'unionpay', label: '云闪付', accent: '#E60012', kw: /(unionpay|yunshanfu|云闪付)/i, tip: '打开云闪付「扫一扫」',
    en: { label: 'UnionPay',  tip: 'Scan with UnionPay' } },
  { key: 'paypal',   label: 'PayPal', accent: '#0070BA', kw: /(paypal|paypalme)/i,       tip: '打开 PayPal App 扫码',
    en: { label: 'PayPal',    tip: 'Scan in the PayPal app' } },
];

/** 未识别渠道的兜底文案（双语） */
const GENERIC_TEXT = { zh: { label: '收款码', tip: '扫码支持我' }, en: { label: 'QR code', tip: 'Scan to support' } };

/** FUNDING.yml 支持的平台键 → 展示信息（值都是「用户名」） */
const FUNDING_PLATFORMS = {
  github:        { label: 'GitHub Sponsors', accent: '#EA4AAA', url: u => `https://github.com/sponsors/${u}` },
  ko_fi:         { label: 'Ko-fi',           accent: '#FF5E5B', url: u => `https://ko-fi.com/${u}` },
  liberapay:     { label: 'Liberapay',       accent: '#F6C915', url: u => `https://liberapay.com/${u}` },
  patreon:       { label: 'Patreon',         accent: '#FF424D', url: u => `https://patreon.com/${u}` },
  open_collective:{ label: 'Open Collective', accent: '#7FADF2', url: u => `https://opencollective.com/${u}` },
  buy_me_a_coffee:{ label: 'Buy Me a Coffee', accent: '#FFDD00', url: u => `https://buymeacoffee.com/${u}` },
  polar:         { label: 'Polar',           accent: '#0062FF', url: u => `https://polar.sh/${u}` },
  issuehunt:     { label: 'IssueHunt',       accent: '#EB5757', url: u => `https://issuehunt.io/r/${u}` },
  thanks_dev:    { label: 'thanks.dev',      accent: '#0F172A', url: u => `https://thanks.dev/${u}` },
};

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

// ───────────────────────────────────────────────────────── 参数解析

function parseArgs(argv) {
  const out = { qr: [], links: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (key === 'help') { out.help = true; continue; }
    if (key === 'standalone' || key === 'dry-run' || key === 'no-readme' || key === 'no-optimize' || key === 'skip-crop' || key === 'force') {
      out[camel(key)] = true; continue;
    }
    // --qr 可重复
    if (key === 'qr' || key === 'link') {
      out[key === 'qr' ? 'qr' : 'links'].push(argv[++i] ?? '');
      continue;
    }
    const val = argv[++i];
    if (val === undefined) throw new Error(`参数 --${key} 缺少值`);
    out[camel(key)] = val;
  }
  return out;
}
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function usage() {
  console.log(`
iskill-generate-sponsors · 收款码 → 赞助页（md + html + FUNDING.yml）

  node gen-sponsors.mjs [选项]

输入
  --from <目录>            扫描目录里的图片，按文件名关键词自动识别渠道
  --qr "<标签>=<图片路径>"  显式指定一张收款码（可重复）
  --config <文件>          读取 JSON 配置（默认自动找 ./sponsors.config.json）

身份与文案
  --name <文本>            你的名字 / 昵称（默认 "Sponsor"）
  --project <文本>         项目名（默认取当前目录名）
  --tagline <文本>         一句感谢语
  --title <文本>           赞助页主标题（默认「赞助支持 · <project>」）

双语（html / jsx / vue 都带语言切换）
  --lang zh|en            默认语言（默认 zh）
  --langs zh,en           可选语言；只给一种时隐藏切换按钮
  --title-en <文本>        --tagline-en <文本>      --note-en <文本>
                          不填则英文沿用中文文案（二维码渠道名与界面文案已内置英文）

赞助链接（值是用户名，PayPal 例外传完整 URL）
  --paypal <url>           例：https://paypal.me/zeovi
  --kofi <用户名>            --liberapay <用户名>     --github <用户名>
  --patreon <用户名>         --bmc <用户名>           --link <完整URL>

输出
  --out <目录>             产物根目录（默认 .）
  --img-base <路径>        md/html 里引用图片的相对路径前缀（默认 .github/sponsor）
  --prefix <前缀>          输出图片文件名前缀（默认空）
  --max <像素>             图片长边上限（默认 800）
  --style card|minimal     html 风格（默认 card；React/Vue 组件恒为 card）
  --standalone             图片转 base64 内嵌，产物自包含（html 与组件都生效）
  --no-components          不输出 SponsorCard.jsx / SponsorCard.vue
  --no-source              不输出 index.html（源码一键复制页）
  --components-dir <目录>  组件输出目录（默认同 --out 根目录）
  --no-readme              不写入 README
  --no-optimize            不压缩图片，原样拷贝
  --skip-crop              跳过二维码自动裁剪（默认检测到二维码会裁出主体，视觉统一）
  --dry-run                只打印将要做什么，不落盘
  --force                  覆盖已存在的图片（默认也会覆盖，此开关仅语义明确）

示例
  node gen-sponsors.mjs --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi \\
                        --kofi zeo --project my-project --out .
`);
}

// ───────────────────────────────────────────────────────────── 配置

function loadConfig(file) {
  if (!file || !fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`配置文件解析失败：${file} — ${e.message}`);
  }
}

const DEFAULT_TAGLINE = '如果这个项目帮到了你，可以请我喝杯咖啡 ☕';

function buildOptions(args) {
  const cfgPath = args.config || 'sponsors.config.json';
  const cfgFound = fs.existsSync(cfgPath);
  const cfg = loadConfig(cfgFound ? cfgPath : args.config);
  const cfgDir = cfgFound ? path.dirname(path.resolve(cfgPath)) : process.cwd();
  const links = { ...(cfg.links || {}) };

  // 额外的 --link "label=url" 收集
  const extraLinks = [];
  for (const raw of args.links || []) {
    const i = raw.indexOf('=');
    if (i < 0) throw new Error(`--link 需要 "标签=URL" 格式，收到：${raw}`);
    extraLinks.push({ label: raw.slice(0, i).trim(), url: raw.slice(i + 1).trim() });
  }

  // 扁平 CLI → 结构
  const cliLinks = {
    ko_fi: args.kofi, liberapay: args.liberapay, github: args.github,
    patreon: args.patreon, buy_me_a_coffee: args.bmc || args.buyMeACoffee,
    open_collective: args.openCollective, polar: args.polar,
  };
  for (const [k, v] of Object.entries(cliLinks)) if (v) links[k] = v;
  if (args.paypal) links.paypal = args.paypal;

  // PayPal 常见笔误纠正
  if (links.paypal) links.paypal = links.paypal.replace(/paypay\.me/gi, 'paypal.me');

  const name = args.name || cfg.name || 'Sponsor';
  const project = args.project || cfg.project || path.basename(process.cwd());
  const tagline = args.tagline || cfg.tagline || DEFAULT_TAGLINE;
  const title = args.title || cfg.title || `赞助支持 · ${project}`;

  // 双语：英文文案可整体写在配置的 en 段里，也可以用 --xxx-en 单独给
  const enCfg = cfg.en || {};
  const titleEn = args.titleEn || enCfg.title || '';
  const taglineEn = args.taglineEn || enCfg.tagline || '';
  const noteEn = args.noteEn || enCfg.note || '';
  const langs = String(args.langs || cfg.langs || 'zh,en')
    .split(',').map(s => s.trim()).filter(s => s === 'zh' || s === 'en');

  const qrSpecs = [];
  for (const raw of args.qr || []) {
    const i = raw.indexOf('=');
    if (i < 0) throw new Error(`--qr 需要 "标签=图片路径" 格式，收到：${raw}`);
    qrSpecs.push({ label: raw.slice(0, i).trim(), src: raw.slice(i + 1).trim() });
  }
  if (!qrSpecs.length && Array.isArray(cfg.qr)) {
    const base = cfg.qrDir ? path.resolve(cfgDir, cfg.qrDir) : cfgDir;
    for (const q of cfg.qr) {
      const rel = q.src || q.file;
      qrSpecs.push({
        label: q.label, key: q.key, accent: q.accent, tip: q.tip,
        src: path.isAbsolute(rel) ? rel : path.resolve(base, rel),
      });
    }
  }

  const opt = {
    name, project, tagline, title,
    titleEn, taglineEn, noteEn,
    lang: args.lang || cfg.lang || 'zh',
    langs: langs.length ? langs : ['zh', 'en'],
    accent: args.accent || cfg.accent || '#10C8A1',
    footerNote: args.note || cfg.note || '',
    links, extraLinks, qrSpecs,
    from: args.from || cfg.from || '',
    out: path.resolve(args.out || cfg.out || '.'),
    imgBase: trimSlash(args.imgBase || cfg.imgBase || '.github/sponsor'),
    // GitHub Pages 硬封锁 .github/* 路径（.nojekyll 也不放行）→ html 里的图片
    // 引用改用这个非点目录（图片会镜像一份）；置为与 imgBase 相同可关闭镜像
    pagesImgBase: trimSlash(args.pagesImgBase || cfg.pagesImgBase || '') || undefined,
    prefix: args.prefix ?? cfg.prefix ?? '',
    max: Number(args.max || cfg.max || 800),
    style: args.style || cfg.style || 'card',
    standalone: !!args.standalone || !!cfg.standalone,
    skipCrop: !!args.skipCrop || !!cfg.skipCrop,
    noReadme: !!args.noReadme,
    noOptimize: !!args.noOptimize,
    noComponents: !!args.noComponents || !!cfg.noComponents,
    componentsDir: path.resolve(args.componentsDir || cfg.componentsDir || args.out || cfg.out || '.'),
    noSource: !!args.noSource || !!cfg.noSource,
    dryRun: !!args.dryRun,
    readme: args.readme || cfg.readme || 'README.md',
    markStart: cfg.markerStart || MARK_START,
    markEnd: cfg.markerEnd || MARK_END,
  };
  // pagesImgBase 缺省：imgBase 是点目录（如 .github/sponsor）时镜像到 sponsor/，否则同 imgBase（不镜像）
  if (!opt.pagesImgBase) opt.pagesImgBase = opt.imgBase.startsWith('.') ? 'sponsor' : opt.imgBase;
  return opt;
}

const trimSlash = s => String(s).replace(/^\.?\/+/, '').replace(/\/+$/, '');

// ─────────────────────────────────────────────────── 收款码发现与处理

function matchChannel(hay) {
  for (const c of CHANNELS) if (c.kw.test(hay)) return c;
  return null;
}

function discoverFromDir(dir) {
  if (!fs.existsSync(dir)) throw new Error(`--from 目录不存在：${dir}`);
  const files = fs.readdirSync(dir).filter(f => IMG_EXT.test(f) && !f.startsWith('.')).sort();
  return files.map(f => {
    const ch = matchChannel(f);
    return { label: ch ? ch.label : path.parse(f).name, src: path.join(dir, f), key: ch?.key, accent: ch?.accent };
  });
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr';
}

function hasSips() {
  try { execFileSync('sips', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

function optimizeImage(src, destDir, baseName, max, noOptimize, dryRun) {
  const ext = path.extname(src).toLowerCase();
  const keepExt = ext === '.png' || ext === '.webp' ? ext : '.jpg';
  const dest = path.join(destDir, baseName + keepExt);
  const before = fs.statSync(src).size;

  // 源就是产物（配置里 src 直接指向 .github/sponsor/）→ 不动，保证幂等
  if (path.resolve(src) === path.resolve(dest)) {
    return { dest, before, after: before, sampled: false, inPlace: true };
  }
  if (dryRun) return { dest, before, after: 0, sampled: false };

  fs.mkdirSync(destDir, { recursive: true });
  let sampled = false;
  if (!noOptimize && hasSips()) {
    try {
      // 注意：-Z 的值必须紧跟其后，formatOptions 只能插在 -Z 组之后
      const args = ['-Z', String(max)];
      if (keepExt === '.jpg') args.push('-s', 'formatOptions', '82');
      args.push(src, '--out', dest);
      execFileSync('sips', args, { stdio: 'ignore' });
      sampled = true;
    } catch { sampled = false; }
  }
  if (!sampled) fs.copyFileSync(src, dest);
  return { dest, before, after: fs.statSync(dest).size, sampled };
}

function resolveQrList(opt) {
  let specs = opt.qrSpecs.slice();
  if (!specs.length && opt.from) specs = discoverFromDir(opt.from);
  if (!specs.length) throw new Error('没有收款码图片。请用 --from <目录> 或 --qr "标签=路径"。');
  const destDir = path.join(opt.out, opt.imgBase);

  return specs.map((s, idx) => {
    const abs = path.resolve(String(s.src).replace(/^~/, process.env.HOME || '~'));
    const ch = s.key ? CHANNELS.find(c => c.key === s.key) : matchChannel(s.label + ' ' + path.basename(abs));
    const label = s.label || ch?.label || `收款码 ${idx + 1}`;
    const tip = s.tip || ch?.tip || GENERIC_TEXT.zh.tip;
    const accent = s.accent || ch?.accent || opt.accent;
    // 英文：显式指定 > 渠道内置 > 与中文同名（未识别渠道时文案原样沿用）
    const en = s.en || {};
    const labelEn = en.label || ch?.en?.label || (!ch && label === GENERIC_TEXT.zh.label ? GENERIC_TEXT.en.label : label);
    const tipEn = en.tip || ch?.en?.tip || (!ch && tip === GENERIC_TEXT.zh.tip ? GENERIC_TEXT.en.tip : tip);
    const baseName = (opt.prefix || '') + slug(ch?.key || s.key || label);
    const meta = { label, tip, labelEn, tipEn, accent, key: ch?.key || slug(label), baseName };

    // 源图缺失但产物已存在 → 直接复用（让配置在换机器后仍可重跑）
    if (!fs.existsSync(abs)) {
      const found = ['.jpg', '.png', '.webp'].map(e => path.join(destDir, baseName + e)).find(fs.existsSync);
      if (found) return { ...meta, abs: null, destName: path.basename(found), reuse: true };
      throw new Error(`图片不存在：${s.src}`);
    }
    return { ...meta, abs, reuse: false };
  });
}

// ───────────────────────────────────────────────────────────── 渲染

function yamlQuote(v) {
  return /[:#{}[\],&*?|<>=!%@`"']/.test(v) || v !== v.trim() ? JSON.stringify(v) : v;
}

function renderFundingYml(opt, qrList) {
  const L = [];
  L.push('# 由 iskill-generate-sponsors 生成 · ' + GEN_URL);
  L.push('# 规范：https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository');
  L.push('#');
  L.push('# 每个平台填「用户名」（或 平台名/包名），custom 最多 4 个完整 URL。');
  L.push('# 提交后仓库页右上会出现 Sponsor 按钮。');
  L.push('');

  let any = false;
  for (const [key, info] of Object.entries(FUNDING_PLATFORMS)) {
    const val = opt.links[key];
    if (!val) continue;
    any = true;
    L.push(`${key}: ${yamlQuote(val)}`.padEnd(26) + `# ${info.label}`);
  }

  const custom = [];
  if (opt.links.paypal) custom.push(opt.links.paypal);
  for (const l of opt.extraLinks) custom.push(l.url);
  if (custom.length) {
    if (custom.length > 4) L.push('# ⚠️ custom 超过 4 条，GitHub 只认前 4 条');
    any = true;
    L.push('custom:');
    for (const url of custom.slice(0, 4)) L.push('  - ' + JSON.stringify(url));
  }

  // 中国内地收款码无法写进 FUNDING.yml，用注释留痕，指引到 README
  if (qrList.length) {
    L.push('');
    L.push('# 微信 / 支付宝等扫码收款码不是 GitHub 支持的平台，无法直接配置。');
    L.push('# 它们已内联展示在 README 的赞助区块，图片在 ' + opt.imgBase + '/');
    for (const q of qrList) L.push('#   - ' + q.label + ' → ' + opt.imgBase + '/' + q.destName);
  }

  if (!any) {
    L.push('# 未提供任何外部赞助链接。至少加一个，例如：');
    L.push('# custom:');
    L.push('#   - "https://paypal.me/yourname"');
  }
  return L.join('\n') + '\n';
}

function mdImageRow(qrList, opt, indent = '') {
  const cells = qrList.map(q => {
    const src = `${opt.imgBase}/${q.destName}`;
    const { label } = qrText(q, opt.lang);
    return `<img src="${src}" width="${q.mdWidth}" alt="${esc(label)}收款码">`;
  });
  // 间距用 &nbsp; 且**不单独占一行** —— 独占一行的裸实体在部分 Markdown 渲染器里
  // 会被包成 <p>，从而提前闭合外层 <p align="center">，两张码就变成上下堆叠。
  return `${indent}<p align="center">\n${indent}  ${cells.join('&nbsp;&nbsp;&nbsp;')}\n${indent}</p>`;
}

function linkTable(opt, qrList) {
  const m = MD[opt.lang] || MD.zh;
  const rows = [];
  for (const q of qrList) rows.push(`| **${esc(qrText(q, opt.lang).label)}** | ${m.scan} |`);
  for (const [key, info] of Object.entries(FUNDING_PLATFORMS)) {
    const val = opt.links[key];
    if (val) rows.push(`| ${info.label} | [${val}](${info.url(val)}) |`);
  }
  if (opt.links.paypal) rows.push(`| PayPal | [${opt.links.paypal}](${opt.links.paypal}) |`);
  for (const l of opt.extraLinks) rows.push(`| ${esc(l.label)} | [${l.url}](${l.url}) |`);
  return [`| ${m.ch} | ${m.addr} |`, '| --- | --- |', ...rows].join('\n');
}

function renderMarkdown(opt, qrList, { heading = true } = {}) {
  const m = MD[opt.lang] || MD.zh;
  const L = [];
  L.push(opt.markStart);
  if (heading) {
    L.push(`## ${pick({ zh: opt.title, en: opt.titleEn || opt.title }, opt.lang)}`);
    L.push('');
    L.push(pick({ zh: opt.tagline, en: opt.taglineEn || opt.tagline }, opt.lang));
    L.push('');
  }
  if (qrList.length) {
    L.push(mdImageRow(qrList, opt));
    L.push('');
    L.push('<p align="center"><sub>' + qrList.map(q => esc(qrText(q, opt.lang).tip)).join(' · ') + '</sub></p>');
    L.push('');
  }
  L.push(linkTable(opt, qrList));
  L.push('');
  const note = pick({ zh: opt.footerNote, en: opt.noteEn || opt.footerNote }, opt.lang);
  if (note) { L.push(note); L.push(''); }
  L.push(`<p align="center"><sub>${m.thanks} · <a href="${GEN_URL}">iskill-generate-sponsors</a></sub></p>`);
  L.push(opt.markEnd);
  return L.join('\n');
}

function fundingBody(opt, qrList) {
  return renderFundingYml(opt, qrList)
    .split('\n')
    .filter(l => !/^#\s*(由 iskill|规范：)/.test(l) && l.trim() !== '#')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderStandaloneMd(opt, qrList) {
  const L = [];
  L.push(`# ${pick({ zh: opt.title, en: opt.titleEn || opt.title }, opt.lang)}`);
  L.push('');
  L.push(`> ${pick({ zh: opt.tagline, en: opt.taglineEn || opt.tagline }, opt.lang)}`);
  L.push('');
  L.push(`下面 \`${opt.markStart}\` 与 \`${opt.markEnd}\` 之间的内容，可以整段复制进你的 README 或任意 Markdown 文档。`);
  L.push('');
  L.push(renderMarkdown(opt, qrList, { heading: false }));
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 嵌入到你的项目');
  L.push('');
  L.push('1. 把 `.github/sponsor/` 里的二维码图片拷进你的仓库同一位置；');
  L.push('2. 把上面区块整段粘到你的 README（或任意 md 文档）；');
  L.push('3. 把 `.github/FUNDING.yml` 拷进你的仓库，填上自己的链接。');
  L.push('');
  L.push('图片路径是**相对仓库根目录**的。文档若在子目录（如 `docs/README.md`），');
  L.push('用 `--img-base ../.github/sponsor` 重新生成一次即可。');
  L.push('');
  L.push('## GitHub Sponsor 按钮 · `.github/FUNDING.yml`');
  L.push('');
  L.push('```yaml');
  L.push(fundingBody(opt, qrList));
  L.push('```');
  L.push('');
  L.push(`<sub>本文件由 <a href="${GEN_URL}">iskill-generate-sponsors</a> 生成，重跑整块覆盖。</sub>`);
  return L.join('\n') + '\n';
}

// ── 内联 SVG 图标（几何线条，不用 emoji） ──
const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.6c0 4.2-5.4 8-8.8 10.4C8.6 16.6 3.2 12.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.4"/><path d="M14.5 14.5h3v3h-3z"/><path d="M20.5 14.5v6h-6"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M15 20h5v-5"/><path d="M4 4l6 6"/><path d="M20 20l-6-6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"/></svg>',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderLinks(opt) {
  const items = [];
  for (const [key, info] of Object.entries(FUNDING_PLATFORMS)) {
    const val = opt.links[key];
    if (val) items.push({ label: info.label, sub: val, url: info.url(val), accent: info.accent });
  }
  if (opt.links.paypal) {
    items.push({ label: 'PayPal', sub: opt.links.paypal.replace(/^https?:\/\//, ''), url: opt.links.paypal, accent: '#0070BA' });
  }
  for (const l of opt.extraLinks) items.push({ label: l.label, sub: l.url.replace(/^https?:\/\//, ''), url: l.url, accent: opt.accent });
  return items;
}

function dataUri(file, mime) {
  return `data:${mime};base64,` + fs.readFileSync(file).toString('base64');
}

function renderHtml(opt, qrList, model) {
  const minimal = opt.style === 'minimal';
  const lang = opt.lang || 'zh';
  const t = model.ui[lang] || model.ui.zh;
  const L0 = k => pick(model[k], lang);

  // 首屏直接按默认语言渲染出静态内容（无 JS 也能看），再由脚本按需切换
  const cards = qrList.map((q, i) => {
    const { label } = qrText(q, lang);
    return `
      <figure class="card" data-i="${i}" style="--accent:${q.accent}">
        <div class="card-head">
          <span class="chip">${ICON.qr}<span data-slot="chip">${esc(label)}</span></span>
        </div>
        <button class="qr" type="button" data-label="${esc(label)}" aria-label="${esc(fill(t.zoomOf, label))}">
          <img src="${q.cSrc}" alt="${esc(fill(t.altOf, label))}" loading="lazy" decoding="async">
          <span class="zoom">${ICON.expand}</span>
        </button>
      </figure>`;
  }).join('\n');

  const buttons = model.links.length
    ? model.links.map(l => `
        <a class="link" style="--accent:${l.accent}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
          <div class="card-head">
            <span class="chip">${ICON.link}<span>${esc(l.label)}</span></span>
          </div>
          <span class="link-body">
            <span class="link-name">${esc(l.label)}</span>
            <span class="link-sub">${esc(l.sub)}</span>
          </span>
        </a>`).join('\n')
    : `<p class="empty">${t.empty}</p>`;

  const multi = opt.langs.length > 1;
  const css = minimal ? cssMinimal() : cssCard();

  return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(L0('title'))}</title>
<meta name="description" content="${esc(L0('tagline'))}">
<meta name="color-scheme" content="light dark">
<script>
/* 主题 / 语言：URL 上 #theme=light|dark 与 #lang=zh|en 优先（分享、截图可复现），
   其次 localStorage，再次跟随系统。必须在 <style> 之前跑，否则首帧会闪一下白。 */
(function(){
  var h = location.hash || '';
  function hval(k, re){ var m = h.match(new RegExp('[#&]' + k + '=(' + re + ')')); return m ? m[1] : null; }
  function store(k){ try { return localStorage.getItem('sponsor-' + k); } catch (e) { return null; } }
  var th = hval('theme', 'light|dark') || store('theme');
  if (th === 'light' || th === 'dark') document.documentElement.setAttribute('data-theme', th);
  var lg = hval('lang', 'zh|en') || store('lang') || sysLang('${opt.lang === 'en' ? 'en' : 'zh'}');
  if (lg === 'zh' || lg === 'en') document.documentElement.setAttribute('data-lang', lg);
  function sysLang(def){
    try { var l = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (!l || l === 'und') return def;               // SSR / 未知语言 → 生成配置默认
      return l.indexOf('zh') === 0 ? 'zh' : 'en';      // zh-CN/zh-TW/zh-HK → 中文，其余 → 英文
    } catch (e) { return def; }
  }
})();
</script>
<style>
${css}
</style>
</head>
<body>
<div class="tools">
  ${multi ? `<button class="icon-btn lang-toggle" type="button" aria-label="${esc(t.langAria)}" title="${esc(t.langAria)}"><span class="lang-short">${esc(t.langShort)}</span></button>` : ''}
  <button class="icon-btn theme-toggle" type="button" aria-label="${esc(t.themeAria)}" title="${esc(t.themeAria)}">
    <span class="ic-sun">${ICON.sun}</span><span class="ic-moon">${ICON.moon}</span>
  </button>
</div>
<main class="wrap">
  <header class="hero">
    <span class="badge">${ICON.heart}<span data-slot="badge">${esc(t.badge)}</span></span>
    <h1 data-slot="title">${esc(L0('title'))}</h1>
    <p class="lede" data-slot="tagline">${esc(L0('tagline'))}</p>
  </header>

  <section class="qrs">
${cards}
${buttons}
  </section>

  ${L0('note') ? `<p class="note" data-slot="note">${esc(L0('note'))}</p>` : ''}

  <footer class="foot" data-slot="foot">${L0('foot')}</footer>
</main>

<div class="lightbox" hidden>
  <button class="lb-close" type="button" aria-label="${esc(t.closeAria)}">×</button>
  <img alt="">
  <p class="lb-cap"></p>
</div>

<script>
var SPONSOR = ${embedJson(model)};
(function () {
  var root = document.documentElement;
  var lb = document.querySelector('.lightbox');
  var img = lb.querySelector('img');
  var cap = lb.querySelector('.lb-cap');

  function pick(v, lang) {
    if (v == null) return '';
    if (typeof v !== 'object' || Array.isArray(v)) return String(v);
    if (v[lang] != null) return v[lang];
    return v.zh != null ? v.zh : (v.en != null ? v.en : '');
  }
  function fill(tpl, x) { return String(tpl == null ? '{x}' : tpl).replace('{x}', x); }
  function all(sel, fn) { document.querySelectorAll(sel).forEach(fn); }

  function apply(lang) {
    var t = SPONSOR.ui[lang] || SPONSOR.ui.zh;
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
    // data-lang 给 CSS 用（如需按语言切换字体/间距），与 data-theme 同一套路
    root.setAttribute('data-lang', lang);
    document.title = pick(SPONSOR.title, lang);
    all('[data-slot="title"]',      function (e) { e.textContent = pick(SPONSOR.title, lang); });
    all('[data-slot="tagline"]',    function (e) { e.textContent = pick(SPONSOR.tagline, lang); });
    all('[data-slot="badge"]',      function (e) { e.textContent = t.badge; });
    all('[data-slot="links-title"]',function (e) { e.textContent = t.linksTitle; });
    all('[data-slot="note"]',       function (e) { e.textContent = pick(SPONSOR.note, lang); });
    all('[data-slot="foot"]',       function (e) { e.innerHTML = pick(SPONSOR.foot, lang); });
    all('.empty',                   function (e) { e.innerHTML = t.empty; });
    all('.hint',                    function (e) { e.textContent = t.hint; });
    all('.lang-short',              function (e) { e.textContent = t.langShort; });
    all('.theme-toggle',            function (e) { e.setAttribute('aria-label', t.themeAria); e.setAttribute('title', t.themeAria); });
    all('.lang-toggle',             function (e) { e.setAttribute('aria-label', t.langAria); e.setAttribute('title', t.langAria); });
    all('.lb-close',                function (e) { e.setAttribute('aria-label', t.closeAria); });

    all('.card[data-i]', function (c) {
      var q = SPONSOR.qr[+c.dataset.i];
      if (!q) return;
      var label = pick(q.label, lang);
      var chip = c.querySelector('[data-slot="chip"]');
      var capL = c.querySelector('[data-slot="cap-label"]');
      var capT = c.querySelector('[data-slot="cap-tip"]');
      if (chip) chip.textContent = label;
      if (capL) capL.textContent = label;
      if (capT) capT.textContent = pick(q.tip, lang);
      var im = c.querySelector('img');
      if (im) im.alt = fill(t.altOf, label);
      var b = c.querySelector('.qr');
      if (b) { b.dataset.label = label; b.setAttribute('aria-label', fill(t.zoomOf, label)); }
    });
  }

  var langs = SPONSOR.langs && SPONSOR.langs.length ? SPONSOR.langs : ['zh', 'en'];
  var lang = root.getAttribute('data-lang') || SPONSOR.defaultLang || 'zh';
  if (langs.indexOf(lang) < 0) lang = langs[0];
  apply(lang);   // 首屏已是默认语言，这里只负责纠偏（比如 #lang=en 打开）

  /* ── 灯箱 ── */
  function open(src, label, alt) {
    img.src = src; img.alt = alt; cap.textContent = label;
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  function close() { lb.hidden = true; img.src = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.qr') : null;
    if (b) { var im = b.querySelector('img'); open(im.currentSrc || im.src, b.dataset.label, im.alt); }
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === img) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });

  /* ── 主题切换 ── */
  var tBtn = document.querySelector('.theme-toggle');
  if (tBtn) tBtn.addEventListener('click', function () {
    var now = root.getAttribute('data-theme');
    if (now !== 'light' && now !== 'dark') {
      now = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var next = now === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('sponsor-theme', next); } catch (e) {}
    postSync(next);
  });

  /* ── 语言切换 ── */
  var lBtn = document.querySelector('.lang-toggle');
  if (lBtn) lBtn.addEventListener('click', function () {
    lang = langs[(langs.indexOf(lang) + 1) % langs.length];
    apply(lang);
    try { localStorage.setItem('sponsor-lang', lang); } catch (e) {}
    postSync();
  });

  /* ── 被嵌入时（如 index.html 的实时预览 iframe）与父页双向同步 ──
     收到父页的 sponsorSync：应用语言 / 主题（不回写 localStorage，父页已写），
     然后回 ack —— 父页据此决定要不要走「重载 iframe」的兜底。 */
  function postSync(theme) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          sponsorSync: 1,
          sponsorLang: lang,
          sponsorTheme: theme || root.getAttribute('data-theme') || ''
        }, '*');
      }
    } catch (e) {}
  }
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (!d.sponsorSync) return;
    if ((d.sponsorLang === 'zh' || d.sponsorLang === 'en') && langs.indexOf(d.sponsorLang) >= 0) {
      lang = d.sponsorLang;
      apply(lang);
    }
    if (d.sponsorTheme === 'light' || d.sponsorTheme === 'dark') {
      root.setAttribute('data-theme', d.sponsorTheme);
    }
    try { e.source.postMessage({ sponsorAck: 1 }, '*'); } catch (err) {}
  });
})();
</script>
</body>
</html>
`;
}

/** JSON 嵌进 <script>：转义 </ 防止提前闭合标签 */
function embedJson(obj) {
  return JSON.stringify(obj).replace(/<\//g, '<\\/');
}

function cssCard() {
  return `:root{
  color-scheme:light;
  --ink:#0f1b2d; --ink2:#55637a; --ink3:#93a1b4;
  --line:#e3e9f2; --card:#ffffff; --card-soft:#fafcff;
  --bg:radial-gradient(900px 480px at 12% -8%,#e8f1ff 0,transparent 62%),
       radial-gradient(760px 420px at 92% 4%,#e6fbf2 0,transparent 58%),
       linear-gradient(180deg,#f5f8fc,#eef3f9);
  --badge-fg:#0b7f68; --badge-bg:#e2f7f1; --badge-line:#bde9dd;
  --qr-bg:#ffffff; --qr-line:#e3e9f2;
  --shadow:0 1px 2px rgba(16,32,56,.04), 0 12px 32px -12px rgba(16,32,56,.18);
  --shadow-hi:0 1px 2px rgba(16,32,56,.05), 0 22px 46px -16px rgba(16,32,56,.26);
  --code-bg:#eef2f8;
  --ui-bg:rgba(255,255,255,.82); --ui-line:#e3e9f2;
  --chip-bg:color-mix(in srgb,var(--accent) 12%,var(--card));
  --chip-fg:color-mix(in srgb,var(--accent) 62%,var(--ink));
  --chip-line:color-mix(in srgb,var(--accent) 26%,var(--card));
}
:root[data-theme="dark"]{
  color-scheme:dark;
  --ink:#eaf0f8; --ink2:#9fadc0; --ink3:#7b8a9d;
  --line:#22303f; --card:#141d29; --card-soft:#192433;
  --bg:radial-gradient(900px 480px at 12% -8%,#152337 0,transparent 62%),
       radial-gradient(760px 420px at 92% 4%,#122a26 0,transparent 58%),
       linear-gradient(180deg,#0d131d,#111a26);
  --badge-fg:#8ff0d4; --badge-bg:#122a26; --badge-line:#1e4a41;
  --qr-bg:#ffffff; --qr-line:#2b3a4b;
  --shadow:0 1px 2px rgba(0,0,0,.35), 0 12px 32px -12px rgba(0,0,0,.65);
  --shadow-hi:0 1px 2px rgba(0,0,0,.4), 0 22px 46px -16px rgba(0,0,0,.75);
  --code-bg:#1b2635;
  --ui-bg:rgba(20,29,41,.86); --ui-line:#26364a;
}
@media(prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    color-scheme:dark;
    --ink:#eaf0f8; --ink2:#9fadc0; --ink3:#7b8a9d;
    --line:#22303f; --card:#141d29; --card-soft:#192433;
    --bg:radial-gradient(900px 480px at 12% -8%,#152337 0,transparent 62%),
         radial-gradient(760px 420px at 92% 4%,#122a26 0,transparent 58%),
         linear-gradient(180deg,#0d131d,#111a26);
    --badge-fg:#8ff0d4; --badge-bg:#122a26; --badge-line:#1e4a41;
    --qr-bg:#ffffff; --qr-line:#2b3a4b;
    --shadow:0 1px 2px rgba(0,0,0,.35), 0 12px 32px -12px rgba(0,0,0,.65);
    --shadow-hi:0 1px 2px rgba(0,0,0,.4), 0 22px 46px -16px rgba(0,0,0,.75);
    --code-bg:#1b2635;
    --ui-bg:rgba(20,29,41,.86); --ui-line:#26364a;
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; padding:clamp(22px,4vw,36px) clamp(14px,3vw,18px) clamp(34px,5vw,52px); color:var(--ink);
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  background:var(--bg); background-attachment:fixed;
  min-height:100vh; transition:color .2s;
}
.wrap{max-width:720px;margin:0 auto}

.hero{text-align:center;margin-bottom:20px}
.badge{
  display:inline-flex;align-items:center;gap:6px;
  font-size:10.5px;font-weight:700;letter-spacing:.16em;
  color:var(--badge-fg);background:var(--badge-bg);border:1px solid var(--badge-line);
  padding:4px 11px;border-radius:999px;
}
.badge svg{width:12px;height:12px}
.hero h1{font-size:clamp(19px,3vw,25px);line-height:1.3;margin:10px 0 5px;letter-spacing:-.01em}
.lede{margin:0;color:var(--ink2);font-size:13.5px}

/* 所有赞助方式（码 + 链接）通栏一行，窄屏自动换行 */
.qrs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:stretch}

.card{
  --accent:#10C8A1;
  position:relative;margin:0;width:200px;max-width:100%;
  background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--shadow);padding:10px;
  display:flex;flex-direction:column;gap:7px;
  transition:transform .18s,box-shadow .18s;
  overflow:hidden;
}
.card::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 45%,var(--card)));
}
.card:hover{transform:translateY(-2px);box-shadow:var(--shadow-hi)}

.card-head{display:flex;align-items:center;gap:8px}
.chip{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11.5px;font-weight:650;
  color:var(--chip-fg);background:var(--chip-bg);border:1px solid var(--chip-line);
  padding:3px 9px;border-radius:999px;
}
.chip svg{width:12px;height:12px}
.hint{font-size:10.5px;color:var(--ink3);white-space:nowrap}

.qr{
  position:relative;display:block;width:100%;padding:7px;margin:0;cursor:zoom-in;
  background:var(--qr-bg);border:1px solid var(--qr-line);border-radius:10px;
  transition:border-color .2s,box-shadow .2s;
}
.qr:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--qr-line));box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent)}
.qr:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.qr img{display:block;width:100%;height:auto;border-radius:5px}
.zoom{
  position:absolute;right:12px;bottom:12px;width:26px;height:26px;border-radius:8px;
  display:grid;place-items:center;color:#fff;background:rgba(15,27,45,.55);
  backdrop-filter:blur(6px);opacity:0;transition:opacity .2s;
}
.zoom svg{width:14px;height:14px}
.qr:hover .zoom{opacity:1}

/* 链接卡与码卡同构：顶部 chip（图标+名称），中间圆角方容器居中放 名称+链接 */
.link{
  --accent:#10C8A1;
  position:relative;margin:0;width:200px;max-width:100%;
  display:flex;flex-direction:column;gap:7px;
  padding:10px;text-decoration:none;color:var(--ink);
  background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--shadow);
  transition:transform .18s,box-shadow .18s;
  overflow:hidden;
}
.link::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 45%,var(--card)));
}
.link:hover{transform:translateY(-2px);box-shadow:var(--shadow-hi)}
.link:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.link-body{
  flex:1;min-height:150px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  /* 纯 CSS 生成式底纹：角落两团品牌色柔光 + 同心细环（guilloché 质感），随渠道 accent 变色 */
  background:
    radial-gradient(140px 100px at 84% -12%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 70%),
    radial-gradient(160px 120px at 8% 110%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 72%),
    repeating-radial-gradient(circle at 108% -18%,
      color-mix(in srgb, var(--accent) 7%, transparent) 0 1.5px,
      transparent 1.5px 13px),
    var(--qr-bg);
  border:1px solid var(--qr-line);border-radius:10px;
  padding:7px;text-align:center;
  /* 容器恒为白底（与码面一致），文字固定深色，不随主题翻转 */
  color:#0f1b2d;
}
.link-name{font-weight:650;font-size:15px}
.link-sub{font-size:11.5px;color:#55637a;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.empty{flex-basis:100%;color:var(--ink2);text-align:center}
.empty code{background:var(--code-bg);padding:2px 6px;border-radius:6px;font-size:13.5px}

.note{margin:16px 0 0;text-align:center;color:var(--ink2);font-size:12.5px}
.foot{margin-top:22px;text-align:center;font-size:12px;color:var(--ink3)}
.foot a{color:var(--ink2);text-decoration:none;border-bottom:1px solid var(--line)}
.foot a:hover{color:var(--ink)}

.tools{position:fixed;top:14px;right:14px;z-index:20;display:flex;gap:7px}
@media (max-width:520px){.tools{top:10px;right:10px;gap:6px}}
.icon-btn{
  width:32px;height:32px;border-radius:10px;padding:0;
  display:grid;place-items:center;cursor:pointer;color:var(--ink2);
  background:var(--ui-bg);border:1px solid var(--ui-line);
  backdrop-filter:blur(10px);box-shadow:0 4px 14px -8px rgba(16,32,56,.5);
  font-family:inherit;font-size:11.5px;font-weight:700;letter-spacing:.02em;
}
@media (max-width:520px){.icon-btn{width:30px;height:30px}}
.icon-btn:hover{color:var(--ink)}
.icon-btn svg{width:15px;height:15px}
.icon-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.lightbox{
  position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;
  background:rgba(9,16,28,.78);backdrop-filter:blur(10px);
  padding:32px;cursor:zoom-out;animation:fade .18s ease;
}
.lightbox[hidden]{display:none}
.lightbox img{
  max-width:min(440px,86vw);max-height:76vh;width:auto;height:auto;
  background:#fff;padding:14px;border-radius:20px;
  box-shadow:0 30px 70px -20px rgba(0,0,0,.6);
}
.lb-cap{color:#e8eef7;font-size:14.5px;margin:0;letter-spacing:.02em}
.lb-close{
  position:absolute;top:20px;right:22px;width:40px;height:40px;border-radius:50%;
  border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);color:#fff;
  font-size:22px;line-height:1;cursor:pointer;
}
@keyframes fade{from{opacity:0}to{opacity:1}}

@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media print{
  body{background:#fff;padding:0}
  .card,.link{box-shadow:none;break-inside:avoid;background:#fff}
  .qr{cursor:default}
  .zoom,.foot,.tools{display:none}
  .lightbox{display:none}
}
.icon-btn .ic-moon{display:none}
:root[data-theme="dark"] .icon-btn .ic-sun{display:none}
:root[data-theme="dark"] .icon-btn .ic-moon{display:block}
@media(prefers-color-scheme:dark){
  :root:not([data-theme="light"]) .icon-btn .ic-sun{display:none}
  :root:not([data-theme="light"]) .icon-btn .ic-moon{display:block}
}

/* ── 响应式：窄屏收边距、卡片变紧凑、副标题不再挤压 ── */
@media (max-width:520px){
  body{padding:22px 12px 38px}
  .hero{margin-bottom:16px}
  .card{padding:9px;border-radius:12px}
  .link{padding:7px 10px}
  .lightbox{padding:20px}
  .lb-close{top:14px;right:16px}
}`;
}

function cssMinimal() {
  return `:root{
  color-scheme:light;
  --ink:#111c2c; --ink2:#5a6779; --ink3:#93a0b1;
  --line:#e4e9f0; --card:#ffffff; --card-soft:#fafcff; --bg:#ffffff;
  --qr-bg:#ffffff; --qr-line:#e4e9f0; --code-bg:#f1f4f9;
  --ui-bg:rgba(255,255,255,.85); --ui-line:#e4e9f0;
  --chip-fg:color-mix(in srgb,var(--accent) 62%,var(--ink));
}
:root[data-theme="dark"]{
  color-scheme:dark;
  --ink:#eaf0f8; --ink2:#9fadc0; --ink3:#7b8a9d;
  --line:#233040; --card:#0d131d; --card-soft:#141d29; --bg:#0d131d;
  --qr-bg:#ffffff; --qr-line:#2b3a4b; --code-bg:#1b2635;
  --ui-bg:rgba(13,19,29,.86); --ui-line:#26364a;
}
@media(prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    color-scheme:dark;
    --ink:#eaf0f8; --ink2:#9fadc0; --ink3:#7b8a9d;
    --line:#233040; --card:#0d131d; --card-soft:#141d29; --bg:#0d131d;
    --qr-bg:#ffffff; --qr-line:#2b3a4b; --code-bg:#1b2635;
    --ui-bg:rgba(13,19,29,.86); --ui-line:#26364a;
  }
}
*{box-sizing:border-box}
body{
  margin:0;padding:64px 24px;color:var(--ink);background:var(--bg);
  font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
}
.wrap{max-width:680px;margin:0 auto}
.hero{text-align:center;margin-bottom:44px}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.18em;color:var(--chip-fg);border-bottom:2px solid currentColor;padding-bottom:4px}
.badge svg{width:13px;height:13px}
.hero h1{font-size:28px;margin:20px 0 8px;font-weight:600;letter-spacing:-.01em}
.lede{margin:0;color:var(--ink2)}
.qrs{display:flex;flex-wrap:wrap;justify-content:center;gap:40px;margin-bottom:48px}
.card{--accent:#10C8A1;margin:0;display:flex;flex-direction:column;align-items:center;gap:14px;width:220px}
.card-head{display:none}
.qr{padding:0;margin:0;border:1px solid var(--qr-line);border-radius:12px;background:var(--qr-bg);cursor:zoom-in}
.qr:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.qr img{display:block;width:100%;height:auto;border-radius:11px}
.zoom{display:none}
.links{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.link{display:flex;align-items:center;gap:12px;padding:14px 4px;text-decoration:none;color:var(--ink);border-bottom:1px solid var(--line);transition:background .16s}
.link:hover{background:var(--card-soft)}
.link:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.link-label{font-weight:600;font-size:14.5px}
.link-sub{margin-left:auto;font-size:12.5px;color:var(--ink2)}
.link-icon{width:16px;height:16px;color:var(--chip-fg)}
.empty{color:var(--ink2);text-align:center}
.empty code{background:var(--code-bg);padding:2px 6px;border-radius:6px}
.note{margin-top:32px;text-align:center;color:var(--ink2);font-size:14px}
.foot{margin-top:40px;text-align:center;font-size:12.5px;color:var(--ink3)}
.foot a{color:var(--ink2);text-decoration:none;border-bottom:1px solid var(--line)}
.tools{position:fixed;top:16px;right:16px;z-index:20;display:flex;gap:8px}
.icon-btn{width:38px;height:38px;border-radius:12px;padding:0;display:grid;place-items:center;cursor:pointer;color:var(--ink2);background:var(--ui-bg);border:1px solid var(--ui-line);backdrop-filter:blur(10px);font-family:inherit;font-size:12.5px;font-weight:700}
.icon-btn:hover{color:var(--ink)}
.icon-btn svg{width:18px;height:18px}
.lightbox{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(9,16,28,.8);padding:32px;cursor:zoom-out}
.lightbox[hidden]{display:none}
.lightbox img{max-width:min(420px,86vw);max-height:76vh;background:#fff;padding:12px;border-radius:16px}
.lb-cap{color:#e8eef7;margin:0;font-size:14px}
.lb-close{position:absolute;top:20px;right:22px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);color:#fff;font-size:22px;cursor:pointer}
@media print{body{padding:0;background:#fff}.foot,.tools{display:none}.qr{cursor:default}}
@media (max-width:520px){body{padding:36px 15px 44px}.tools{top:10px;right:10px}.icon-btn{width:34px;height:34px}.qrs{gap:28px}}
.icon-btn .ic-moon{display:none}
:root[data-theme="dark"] .icon-btn .ic-sun{display:none}
:root[data-theme="dark"] .icon-btn .ic-moon{display:block}
@media(prefers-color-scheme:dark){
  :root:not([data-theme="light"]) .icon-btn .ic-sun{display:none}
  :root:not([data-theme="light"]) .icon-btn .ic-moon{display:block}
}`;
}

// ─────────────────────────────────────────────────────── README 注入

function injectReadme(opt, block) {
  const file = path.join(opt.out, opt.readme);
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const lines = raw === null ? null : raw.split('\n');

  // marker 必须**独占一行**才算真区块 —— 否则正文里提到的 `<!-- sponsors:start -->`
  // 会被误当锚点（README 表格里写一次就中招）
  const si = lines ? lines.findIndex(l => l.trim() === opt.markStart) : -1;
  const ei = lines ? lines.findIndex((l, i) => i > si && l.trim() === opt.markEnd) : -1;

  if (opt.dryRun) {
    return { file, action: raw === null ? 'create' : (si >= 0 && ei > si ? 'replace' : 'append') };
  }

  if (raw === null) {
    fs.writeFileSync(file, [
      `# ${opt.project}`,
      '',
      `本项目的赞助信息见下方区块（由 [iskill-generate-sponsors](${GEN_URL}) 生成）。`,
      '',
      block,
      '',
    ].join('\n'));
    return { file, action: 'create' };
  }

  if (si >= 0 && ei > si) {
    const out = [...lines.slice(0, si), ...block.split('\n'), ...lines.slice(ei + 1)];
    fs.writeFileSync(file, out.join('\n'));
    return { file, action: 'replace' };
  }

  fs.writeFileSync(file, raw.replace(/\s*$/, '') + '\n\n---\n\n' + block + '\n');
  return { file, action: 'append' };
}

// ───────────────────────────────────────────────────────────── main

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return; }

  const opt = buildOptions(args);
  const qrList = resolveQrList(opt);

  // 处理图片
  const destDir = path.join(opt.out, opt.imgBase);
  const pagesDir = path.join(opt.out, opt.pagesImgBase);
  const mirror = path.relative(destDir, pagesDir) !== '';          // imgBase 本身非点目录时无需镜像
  for (const q of qrList) {
    if (q.reuse) {
      // 沿用已有产物：镜像缺了也要补（Pages 依赖非点目录那份）
      if (mirror && !opt.dryRun) {
        const srcFile = ['.jpg', '.png', '.webp'].map(e => path.join(destDir, q.baseName + e)).find(fs.existsSync);
        if (srcFile) { fs.mkdirSync(pagesDir, { recursive: true }); fs.copyFileSync(srcFile, path.join(pagesDir, path.basename(srcFile))); }
      }
      continue;
    }
    // 自动裁剪：海报类原图裁出二维码主体（多码视觉统一）；检不出/已紧凑则原样走旧管线
    let cropNote = '';
    if (!opt.skipCrop && !opt.noOptimize && hasSips()) {
      const c = cropQr(q.abs);
      if (c) { q.abs = c.dest; q.cropped = true; cropNote = `  ✓ 已裁出二维码（占原图 ${Math.round(c.ratio * 100)}%）`; }
    }
    const r = optimizeImage(q.abs, destDir, q.baseName, opt.max, opt.noOptimize, opt.dryRun);
    q.destName = path.basename(r.dest);
    q.before = r.before; q.after = r.after; q.inPlace = r.inPlace;
    if (mirror && !opt.dryRun) {                 // GitHub Pages 不服务 .github/* → 镜像一份给 html 用
      fs.mkdirSync(pagesDir, { recursive: true });
      fs.copyFileSync(r.dest, path.join(pagesDir, q.destName));
    }
  }
  // md 里的展示宽度：裁剪后是紧凑方块图，整体压小保持低调
  const width = qrList.length > 2 ? 130 : 160;
  for (const q of qrList) q.mdWidth = width;

  // 三种产物共用同一份 src：--standalone 时是 base64，否则是相对路径
  // html 链路（含被 index.html iframe 的场景）走 pagesImgBase —— Pages 上 .github/ 不可达
  for (const q of qrList) {
    q.cSrc = opt.standalone
      ? dataUri(path.join(destDir, q.destName), q.destName.endsWith('.png') ? 'image/png' : 'image/jpeg')
      : `${opt.pagesImgBase}/${q.destName}`;
  }

  // 一份数据喂三种产物 —— HTML / React / Vue 必须严格同源，否则样本会对不上
  const model = buildModel(opt, qrList, renderLinks(opt));

  const funding = renderFundingYml(opt, qrList);
  const mdBlock = renderMarkdown(opt, qrList);
  const sponsorsMd = renderStandaloneMd(opt, qrList);
  const html = renderHtml(opt, qrList, model);
  const react = opt.noComponents ? null : renderReact(opt, model);
  const vue = opt.noComponents ? null : renderVue(opt, model);

  // 开发者用的源码复制页（与公开页分开，sponsors.html 保持纯净）
  const sourceArtifacts = [
    { id: 'readme', label: 'README 区块', hint: '粘进 README', meta: 'marker 包裹，可整段替换', code: mdBlock },
    { id: 'funding', label: 'FUNDING.yml', hint: 'Sponsor 按钮', meta: '.github/FUNDING.yml', code: funding },
    { id: 'sponsors-md', label: 'SPONSORS.md', hint: '完整赞助页', meta: `${(Buffer.byteLength(sponsorsMd) / 1024).toFixed(1)} KB`, code: sponsorsMd },
  ];
  if (react) sourceArtifacts.push(
    { id: 'jsx', label: 'SponsorCard.jsx', hint: 'React 组件', meta: '零依赖 · 内联样式', code: react },
    { id: 'vue', label: 'SponsorCard.vue', hint: 'Vue 组件', meta: '零依赖 · scoped', code: vue },
  );
  const sourceHtml = opt.noSource ? null : renderSourceHtml(opt, sourceArtifacts);

  if (opt.dryRun) {
    console.log('— dry-run —');
    console.log('图片 →', destDir + '/' + qrList.map(q => q.destName).join(', '));
    console.log('FUNDING.yml / SPONSORS.md / sponsors.html →', opt.out);
    if (!opt.noComponents) console.log('SponsorCard.jsx / SponsorCard.vue →', opt.componentsDir);
    if (sourceHtml) console.log('index.html →', opt.out);
    console.log('README:', injectReadme(opt, mdBlock).action);
    return;
  }

  fs.mkdirSync(path.join(opt.out, '.github'), { recursive: true });
  fs.writeFileSync(path.join(opt.out, '.github', 'FUNDING.yml'), funding);
  fs.writeFileSync(path.join(opt.out, 'SPONSORS.md'), sponsorsMd);
  fs.writeFileSync(path.join(opt.out, 'sponsors.html'), html);
  if (sourceHtml) fs.writeFileSync(path.join(opt.out, 'index.html'), sourceHtml);

  const jsxFile = path.join(opt.componentsDir, 'SponsorCard.jsx');
  const vueFile = path.join(opt.componentsDir, 'SponsorCard.vue');
  if (react) { fs.mkdirSync(opt.componentsDir, { recursive: true }); fs.writeFileSync(jsxFile, react); fs.writeFileSync(vueFile, vue); }

  let readmeInfo = null;
  if (!opt.noReadme) readmeInfo = injectReadme(opt, mdBlock);

  // 汇总
  const rel = p => path.relative(opt.out, p) || '.';
  const kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log('\n  iskill-generate-sponsors\n' + '  ' + '─'.repeat(44));
  for (const q of qrList) {
    const dst = rel(path.join(destDir, q.destName));
    const arrow = q.reuse || q.inPlace ? '沿用已有' : `${kb(q.before)} → ${kb(q.after)}`;
    console.log(`  ✓ ${q.label.padEnd(8)} ${dst}  ${arrow}${q.cropped ? '  （已自动裁出二维码）' : ''}`);
  }
  console.log(`  ✓ FUNDING.yml        ${rel(path.join(opt.out, '.github', 'FUNDING.yml'))}`);
  console.log(`  ✓ SPONSORS.md        ${rel(path.join(opt.out, 'SPONSORS.md'))}`);
  console.log(`  ✓ sponsors.html      ${rel(path.join(opt.out, 'sponsors.html'))}  (${kb(Buffer.byteLength(html))}${opt.standalone ? '，含内嵌图片' : ''})`);
  if (sourceHtml) console.log(`  ✓ 源码复制页         ${rel(path.join(opt.out, 'index.html'))}  (${sourceArtifacts.length} 个产物一键复制)`);
  if (react) {
    console.log(`  ✓ SponsorCard.jsx    ${rel(jsxFile)}  (${kb(Buffer.byteLength(react))})`);
    console.log(`  ✓ SponsorCard.vue    ${rel(vueFile)}  (${kb(Buffer.byteLength(vue))})`);
  }
  if (readmeInfo) console.log(`  ✓ README 区块        ${rel(readmeInfo.file)}  [${readmeInfo.action}]`);
  const exts = Object.keys(FUNDING_PLATFORMS).filter(k => opt.links[k]);
  const chan = [];
  if (exts.length) chan.push(...exts);
  if (opt.links.paypal) chan.push('custom(paypal)');
  console.log(`  ${'─'.repeat(44)}`);
  console.log(`  Sponsor 按钮渠道：${chan.length ? chan.join(' · ') : '无（建议补一个 --paypal / --kofi）'}`);
  console.log(`  QR 展示渠道：${qrList.map(q => q.label).join(' · ')}`);
  console.log(`  默认语言：${opt.lang}（可切换：${opt.langs.join(' / ')}）`);
  console.log(`  打开预览：open ${path.join(opt.out, 'sponsors.html')}\n`);
}

main();
