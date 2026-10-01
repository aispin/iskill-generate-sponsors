/**
 * React / Vue 组件共用的样式（card 风格 · 响应式 · 深浅双主题）。
 * ---------------------------------------------------------------------------
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
    --sp-bg:radial-gradient(720px 400px at 10% -12%,#152337 0,transparent 62%),
            radial-gradient(600px 340px at 92% 4%,#122a26 0,transparent 58%),
            linear-gradient(180deg,#0d131d,#111a26);
    --sp-badge-fg:#8ff0d4; --sp-badge-bg:#122a26; --sp-badge-line:#1e4a41;
    --sp-qr-bg:#ffffff; --sp-qr-line:#2b3a4b;
    --sp-shadow:0 1px 2px rgba(0,0,0,.35), 0 12px 32px -12px rgba(0,0,0,.6);
    --sp-ui-bg:rgba(20,29,41,.86); --sp-ui-line:#26364a;`;

  return `${root}{
  color-scheme:light;
  --sp-ink:#0f1b2d; --sp-ink2:#55637a; --sp-ink3:#93a1b4;
  --sp-line:#e3e9f2; --sp-card:#ffffff; --sp-card-soft:#fafcff; --sp-code-bg:#eef2f8;
  --sp-bg:radial-gradient(720px 400px at 10% -12%,#e8f1ff 0,transparent 62%),
          radial-gradient(600px 340px at 92% 4%,#e6fbf2 0,transparent 58%),
          linear-gradient(180deg,#f5f8fc,#eef3f9);
  --sp-accent:#10C8A1;
  --sp-badge-fg:#0b7f68; --sp-badge-bg:#e2f7f1; --sp-badge-line:#bde9dd;
  --sp-qr-bg:#ffffff; --sp-qr-line:#e3e9f2;
  --sp-shadow:0 1px 2px rgba(16,32,56,.04), 0 12px 32px -12px rgba(16,32,56,.18);
  --sp-ui-bg:rgba(255,255,255,.82); --sp-ui-line:#e3e9f2;

  position:relative; box-sizing:border-box;
  padding:clamp(28px,5vw,52px) clamp(16px,4vw,26px);
  border-radius:20px;
  color:var(--sp-ink); background:var(--sp-bg);
  font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
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
${root} .sp-tools{position:absolute;top:14px;right:14px;z-index:5;display:flex;gap:8px}
${root} .sp-btn{
  width:36px;height:36px;padding:0;border-radius:11px;
  display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--sp-ink2);background:var(--sp-ui-bg);
  border:1px solid var(--sp-ui-line);backdrop-filter:blur(10px);
  font-family:inherit;font-size:12.5px;font-weight:700;letter-spacing:.03em;
}
${root} .sp-btn:hover{color:var(--sp-ink)}
${root} .sp-btn svg{width:18px;height:18px}
${root} .sp-btn .ic-moon{display:none}
${root}[data-theme="dark"] .sp-btn .ic-sun{display:none}
${root}[data-theme="dark"] .sp-btn .ic-moon{display:inline-flex}
@media (prefers-color-scheme:dark){
  ${root}:not([data-theme="light"]) .sp-btn .ic-sun{display:none}
  ${root}:not([data-theme="light"]) .sp-btn .ic-moon{display:inline-flex}
}

${root} .sp-hero{text-align:center;margin-bottom:clamp(24px,4vw,38px)}
${root} .sp-badge{
  display:inline-flex;align-items:center;gap:7px;
  font-size:11.5px;font-weight:700;letter-spacing:.14em;
  color:var(--sp-badge-fg);background:var(--sp-badge-bg);border:1px solid var(--sp-badge-line);
  padding:6px 14px;border-radius:999px;
}
${root} .sp-badge svg{width:14px;height:14px}
${root} .sp-title{font-size:clamp(23px,4.4vw,34px);line-height:1.25;margin:16px 0 10px;letter-spacing:-.01em}
${root} .sp-lede{color:var(--sp-ink2);font-size:16px}

/* 单码居中一列；多码在宽屏自动分栏。min() 保证窄屏不溢出 */
${root} .sp-qrs{display:grid;gap:20px;grid-template-columns:1fr;justify-items:center}
@media (min-width:600px){
  ${root} .sp-qrs[data-multi="1"]{grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));justify-items:stretch}
}

${root} .sp-card{
  position:relative;margin:0;width:100%;max-width:340px;
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:20px;
  box-shadow:var(--sp-shadow);padding:18px 18px 16px;
  display:flex;flex-direction:column;gap:13px;overflow:hidden;
  transition:transform .22s cubic-bezier(.2,.7,.3,1),box-shadow .22s;
}
${root} .sp-card::before{
  content:"";position:absolute;inset:0 0 auto;height:5px;
  background:linear-gradient(90deg,var(--sp-accent),color-mix(in srgb,var(--sp-accent) 45%,var(--sp-card)));
}
${root} .sp-card:hover{transform:translateY(-3px);box-shadow:0 1px 2px rgba(16,32,56,.05), 0 22px 46px -16px rgba(16,32,56,.26)}
${root} .sp-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
${root} .sp-chip{
  display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:650;
  color:color-mix(in srgb,var(--sp-accent) 62%,var(--sp-ink));
  background:color-mix(in srgb,var(--sp-accent) 12%,var(--sp-card));
  border:1px solid color-mix(in srgb,var(--sp-accent) 26%,var(--sp-card));
  padding:5px 11px;border-radius:999px;
}
${root} .sp-chip svg{width:15px;height:15px}
${root} .sp-hint{font-size:12px;color:var(--sp-ink3);white-space:nowrap}

${root} .sp-qr{
  position:relative;display:block;width:100%;padding:10px;margin:0;
  cursor:zoom-in;background:var(--sp-qr-bg);border:1px solid var(--sp-qr-line);
  border-radius:15px;font-family:inherit;color:inherit;
  transition:border-color .2s,box-shadow .2s;
}
${root} .sp-qr:hover{border-color:color-mix(in srgb,var(--sp-accent) 45%,var(--sp-qr-line));box-shadow:0 0 0 4px color-mix(in srgb,var(--sp-accent) 14%,transparent)}
${root} .sp-qr:focus-visible{outline:2px solid var(--sp-accent);outline-offset:3px}
${root} .sp-qr img{display:block;width:100%;height:auto;border-radius:8px}
${root} .sp-zoom{
  position:absolute;right:18px;bottom:18px;width:30px;height:30px;border-radius:9px;
  display:grid;place-items:center;color:#fff;background:rgba(15,27,45,.55);
  backdrop-filter:blur(6px);opacity:0;transition:opacity .2s;
}
${root} .sp-zoom svg{width:16px;height:16px}
${root} .sp-qr:hover .sp-zoom{opacity:1}
${root} .sp-cap{display:flex;flex-direction:column;gap:2px;text-align:center}
${root} .sp-cap strong{font-size:15px}
${root} .sp-cap span{font-size:13px;color:var(--sp-ink2)}

${root} .sp-links-wrap{margin-top:clamp(28px,5vw,44px)}
${root} .sp-links-title{
  font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--sp-ink3);text-align:center;margin-bottom:14px;
}
${root} .sp-links{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr))}
${root} .sp-link{
  position:relative;display:flex;align-items:center;gap:12px;
  padding:14px 16px;text-decoration:none;color:var(--sp-ink);
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:15px;
  box-shadow:0 1px 2px rgba(16,32,56,.04);
  transition:transform .18s,border-color .18s,box-shadow .18s,background .18s;
}
${root} .sp-link:hover{transform:translateY(-2px);background:var(--sp-card-soft);border-color:color-mix(in srgb,var(--sp-accent) 40%,var(--sp-line))}
${root} .sp-link:focus-visible{outline:2px solid var(--sp-accent);outline-offset:2px}
${root} .sp-link-label{font-weight:650;font-size:14.5px}
${root} .sp-link-sub{font-size:12.5px;color:var(--sp-ink2);margin-left:auto;min-width:0;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${root} .sp-link-ic{width:17px;height:17px;color:var(--sp-accent);flex:none}
${root} .sp-link-ic svg{width:100%;height:100%}
${root} .sp-empty{color:var(--sp-ink2);text-align:center}
${root} .sp-empty ${d('code')}{background:var(--sp-code-bg);padding:2px 6px;border-radius:6px;font-size:13.5px}

${root} .sp-note{margin-top:26px;text-align:center;color:var(--sp-ink2);font-size:14px}
${root} .sp-foot{margin-top:34px;text-align:center;font-size:13px;color:var(--sp-ink3)}
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
  ${root}{padding:26px 14px 40px;border-radius:16px}
  ${root} .sp-card{padding:15px 15px 13px;border-radius:17px}
  ${root} .sp-link{padding:13px 14px}
  ${root} .sp-link-sub{max-width:46%;font-size:12px}
  ${root} .sp-tools{top:10px;right:10px}
  ${root} .sp-btn{width:34px;height:34px}
}
@media (prefers-reduced-motion:reduce){${root} *{transition:none!important;animation:none!important}}
@media print{
  ${root}{background:#fff;padding:0;border-radius:0}
  ${root} .sp-tools,${root} .sp-foot,${root} .sp-hint,${root} .sp-zoom{display:none}
  ${root} .sp-card,${root} .sp-link{box-shadow:none;background:#fff;break-inside:avoid}
  ${root} .sp-qr{cursor:default}
}`;
}
