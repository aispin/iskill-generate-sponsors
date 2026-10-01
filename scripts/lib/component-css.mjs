/**
 * React / Vue 组件共用的样式（card 风格 · 紧凑低调 · 响应式 · 深浅双主题）。
 * ---------------------------------------------------------------------------
 * 设计基调：赞助区块是页面的「配角」——小尺寸、低对比、少装饰，
 * 不与正文抢视觉。二维码图 ~180px 见方，整体高度压到最小。
 *
 * root  = 根选择器。
 *   - React 用唯一 scope 类（如 .sp-3f9a1c），实现「scoped」——
 *     React 没有原生 scoped 机制，靠唯一前缀 + 内联 <style> 达到同样效果，
 *     且不需要 css-modules / styled-components 之类的构建配置。
 *   - Vue 用 .sponsor-card（SFC 的 <style scoped> 会再自动补 [data-v-xxx]）。
 *
 * deep = true 时（仅 Vue），v-html 注入的内容用 :deep() 包一层 ——
 *        Vue scoped 不会给 v-html 出来的节点打 data-v 属性，直接写后代选择器会失效。
 */
export function componentCss(root, { deep = false } = {}) {
  const d = sel => (deep ? `:deep(${sel})` : sel);

  // 深色变量要在两处出现：显式 data-theme="dark" 和系统跟随。抽出来避免抄两遍走样。
  const DARK = `  color-scheme:dark;
    --sp-ink:#eaf0f8; --sp-ink2:#9fadc0; --sp-ink3:#7b8a9d;
    --sp-line:#22303f; --sp-card:#141d29; --sp-card-soft:#192433; --sp-code-bg:#1b2635;
    --sp-bg:linear-gradient(180deg,#10161f,#121a26);
    --sp-badge-fg:#8ff0d4; --sp-badge-bg:#122a26; --sp-badge-line:#1e4a41;
    --sp-qr-bg:#ffffff; --sp-qr-line:#2b3a4b;
    --sp-shadow:0 1px 2px rgba(0,0,0,.3);
    --sp-ui-bg:rgba(20,29,41,.86); --sp-ui-line:#26364a;`;

  return `${root}{
  color-scheme:light;
  --sp-ink:#0f1b2d; --sp-ink2:#55637a; --sp-ink3:#93a1b4;
  --sp-line:#e3e9f2; --sp-card:#ffffff; --sp-card-soft:#fafcff; --sp-code-bg:#eef2f8;
  --sp-bg:linear-gradient(180deg,#f7fafd,#f1f5fa);
  --sp-accent:#10C8A1;
  --sp-badge-fg:#0b7f68; --sp-badge-bg:#e2f7f1; --sp-badge-line:#bde9dd;
  --sp-qr-bg:#ffffff; --sp-qr-line:#e3e9f2;
  --sp-shadow:0 1px 2px rgba(16,32,56,.04);
  --sp-ui-bg:rgba(255,255,255,.82); --sp-ui-line:#e3e9f2;

  position:relative; box-sizing:border-box;
  padding:clamp(16px,3vw,26px) clamp(12px,2.5vw,18px);
  border-radius:14px;
  color:var(--sp-ink); background:var(--sp-bg);
  font:14.5px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  -webkit-text-size-adjust:100%;
}
${root} *,${root} *::before,${root} *::after{box-sizing:border-box}
${root} h1,${root} h2,${root} p,${root} figure{margin:0}

${root}[data-theme="dark"]{
${DARK}
}
@media (prefers-color-scheme:dark){
  ${root}:not([data-theme="light"]){
${DARK.replace(/^/gm, '  ')}
  }
}

/* 右上角工具条：语言 + 主题。absolute 而非 fixed —— 组件不该脱离自身盒子 */
${root} .sp-tools{position:absolute;top:9px;right:9px;z-index:5;display:flex;gap:6px}
${root} .sp-btn{
  width:28px;height:28px;padding:0;border-radius:8px;
  display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--sp-ink2);background:var(--sp-ui-bg);
  border:1px solid var(--sp-ui-line);backdrop-filter:blur(10px);
  font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.03em;
}
${root} .sp-btn:hover{color:var(--sp-ink)}
${root} .sp-btn svg{width:14px;height:14px}
${root} .sp-btn .ic-moon{display:none}
${root}[data-theme="dark"] .sp-btn .ic-sun{display:none}
${root}[data-theme="dark"] .sp-btn .ic-moon{display:inline-flex}
@media (prefers-color-scheme:dark){
  ${root}:not([data-theme="light"]) .sp-btn .ic-sun{display:none}
  ${root}:not([data-theme="light"]) .sp-btn .ic-moon{display:inline-flex}
}

${root} .sp-hero{text-align:center;margin-bottom:clamp(12px,2.5vw,18px)}
${root} .sp-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-size:10px;font-weight:700;letter-spacing:.14em;
  color:var(--sp-badge-fg);background:var(--sp-badge-bg);border:1px solid var(--sp-badge-line);
  padding:3px 10px;border-radius:999px;
}
${root} .sp-badge svg{width:11px;height:11px}
${root} .sp-title{font-size:clamp(16px,2.8vw,20px);line-height:1.3;margin:8px 0 4px;letter-spacing:-.01em}
${root} .sp-lede{color:var(--sp-ink2);font-size:13px}

/* 所有赞助方式（码 + 链接）通栏一行，窄屏自动换行 */
${root} .sp-qrs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:stretch}

${root} .sp-card{
  position:relative;margin:0;width:200px;max-width:100%;
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:12px;
  box-shadow:var(--sp-shadow);padding:9px 9px 8px;
  display:flex;flex-direction:column;gap:7px;overflow:hidden;
  transition:transform .18s,box-shadow .18s;
}
${root} .sp-card::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--sp-accent),color-mix(in srgb,var(--sp-accent) 45%,var(--sp-card)));
}
${root} .sp-card:hover{transform:translateY(-2px);box-shadow:0 4px 14px -8px rgba(16,32,56,.28)}
${root} .sp-card-head{display:flex;align-items:center;gap:8px}
${root} .sp-chip{
  display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:650;
  color:color-mix(in srgb,var(--sp-accent) 62%,var(--sp-ink));
  background:color-mix(in srgb,var(--sp-accent) 12%,var(--sp-card));
  border:1px solid color-mix(in srgb,var(--sp-accent) 26%,var(--sp-card));
  padding:2px 8px;border-radius:999px;
}
${root} .sp-chip svg{width:11px;height:11px}

${root} .sp-qr{
  position:relative;display:block;width:100%;padding:6px;margin:0;
  cursor:zoom-in;background:var(--sp-qr-bg);border:1px solid var(--sp-qr-line);
  border-radius:8px;font-family:inherit;color:inherit;
  transition:border-color .2s,box-shadow .2s;
}
${root} .sp-qr:hover{border-color:color-mix(in srgb,var(--sp-accent) 45%,var(--sp-qr-line));box-shadow:0 0 0 3px color-mix(in srgb,var(--sp-accent) 14%,transparent)}
${root} .sp-qr:focus-visible{outline:2px solid var(--sp-accent);outline-offset:2px}
${root} .sp-qr img{display:block;width:100%;height:auto;border-radius:4px}
${root} .sp-zoom{
  position:absolute;right:11px;bottom:11px;width:24px;height:24px;border-radius:7px;
  display:grid;place-items:center;color:#fff;background:rgba(15,27,45,.55);
  backdrop-filter:blur(6px);opacity:0;transition:opacity .2s;
}
${root} .sp-zoom svg{width:13px;height:13px}
${root} .sp-qr:hover .sp-zoom{opacity:1}

/* 链接卡与码卡同构：顶部 chip（图标+名称），中间圆角方容器居中放 名称+链接 */
${root} .sp-link{
  position:relative;margin:0;width:200px;max-width:100%;
  display:flex;flex-direction:column;gap:7px;
  padding:9px;text-decoration:none;color:var(--sp-ink);
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:12px;
  box-shadow:var(--sp-shadow);
  transition:transform .18s,box-shadow .18s;
  overflow:hidden;
}
${root} .sp-link::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--sp-accent),color-mix(in srgb,var(--sp-accent) 45%,var(--sp-card)));
}
${root} .sp-link:hover{transform:translateY(-2px);box-shadow:0 4px 14px -8px rgba(16,32,56,.28)}
${root} .sp-link:focus-visible{outline:2px solid var(--sp-accent);outline-offset:2px}
${root} .sp-link ${d('.sp-link-body')}{
  flex:1;min-height:140px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  /* 纯 CSS 生成式底纹：角落两团品牌色柔光 + 同心细环（guilloché 质感），随渠道 accent 变色 */
  background:
    radial-gradient(130px 95px at 84% -12%, color-mix(in srgb, var(--sp-accent) 15%, transparent), transparent 70%),
    radial-gradient(150px 110px at 8% 110%, color-mix(in srgb, var(--sp-accent) 10%, transparent), transparent 72%),
    repeating-radial-gradient(circle at 108% -18%,
      color-mix(in srgb, var(--sp-accent) 7%, transparent) 0 1.5px,
      transparent 1.5px 13px),
    var(--sp-qr-bg);
  border:1px solid var(--sp-qr-line);border-radius:8px;
  padding:6px;text-align:center;
  /* 容器恒为白底（与码面一致），文字固定深色，不随主题翻转 */
  color:#0f1b2d;
}
${root} .sp-link-name{font-weight:650;font-size:14px}
${root} .sp-link-sub{font-size:11px;color:#55637a;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${root} .sp-empty{flex-basis:100%;color:var(--sp-ink2);text-align:center}
${root} .sp-empty ${d('code')}{background:var(--sp-code-bg);padding:2px 6px;border-radius:6px;font-size:12.5px}

${root} .sp-note{margin-top:14px;text-align:center;color:var(--sp-ink2);font-size:12px}
${root} .sp-foot{margin-top:18px;text-align:center;font-size:11.5px;color:var(--sp-ink3)}
${root} .sp-foot ${d('a')}{color:var(--sp-ink2);text-decoration:none;border-bottom:1px solid var(--sp-line)}

${root} .sp-lb{
  position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;
  background:rgba(9,16,28,.78);backdrop-filter:blur(10px);
  padding:clamp(20px,5vw,32px);cursor:zoom-out;
}
${root} .sp-lb img{max-width:min(440px,86vw);max-height:76vh;background:#fff;padding:14px;border-radius:18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6)}
${root} .sp-lb-cap{color:#e8eef7;font-size:14.5px;letter-spacing:.02em}
${root} .sp-lb-close{
  position:absolute;top:18px;right:20px;width:40px;height:40px;border-radius:50%;
  border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);
  color:#fff;font-size:22px;line-height:1;cursor:pointer;
}

@media (max-width:520px){
  ${root}{padding:14px 12px 26px;border-radius:12px}
  ${root} .sp-card{padding:9px 9px 7px;border-radius:11px}
  ${root} .sp-link{padding:7px 10px}
  ${root} .sp-tools{top:7px;right:7px}
  ${root} .sp-btn{width:26px;height:26px}
}
@media (prefers-reduced-motion:reduce){${root} *{transition:none!important;animation:none!important}}
@media print{
  ${root}{background:#fff;padding:0;border-radius:0}
  ${root} .sp-tools,${root} .sp-foot,${root} .sp-zoom{display:none}
  ${root} .sp-card,${root} .sp-link{box-shadow:none;background:#fff;break-inside:avoid}
  ${root} .sp-qr{cursor:default}
}`;
}
