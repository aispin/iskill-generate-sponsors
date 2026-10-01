<!-- SponsorCard.vue · 由 iskill-generate-sponsors 生成 · 零三方依赖 · 样式 scoped · 响应式 · 中英双语 -->
<template>
  <div class="sponsor-card" :class="className" :data-theme="theme || null">
    <div v-if="showTools" class="sp-tools">
      <button
        v-if="showLang"
        type="button"
        class="sp-btn"
        :aria-label="t.langAria"
        :title="t.langAria"
        @click="toggleLang"
      >{{ t.langShort }}</button>
      <button
        type="button"
        class="sp-btn"
        :aria-label="t.themeAria"
        :title="t.themeAria"
        @click="toggleTheme"
      >
        <span class="ic-sun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg></span>
        <span class="ic-moon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"/></svg></span>
      </button>
    </div>

    <header class="sp-hero">
      <span class="sp-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.6c0 4.2-5.4 8-8.8 10.4C8.6 16.6 3.2 12.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/></svg><span>{{ t.badge }}</span></span>
      <h1 class="sp-title">{{ pick(d.title, lang) }}</h1>
      <p class="sp-lede">{{ pick(d.tagline, lang) }}</p>
    </header>

    <section class="sp-qrs">
      <figure
        v-for="(q, i) in d.qr"
        :key="q.key || i"
        class="sp-card"
        :style="{ '--sp-accent': q.accent }"
      >
        <div class="sp-card-head">
          <span class="sp-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.4"/><path d="M14.5 14.5h3v3h-3z"/><path d="M20.5 14.5v6h-6"/></svg><span>{{ pick(q.label, lang) }}</span></span>
        </div>
        <button
          type="button"
          class="sp-qr"
          :aria-label="fill(t.zoomOf, pick(q.label, lang))"
          @click="zoom = i"
        >
          <img :src="q.src" :alt="fill(t.altOf, pick(q.label, lang))" loading="lazy" decoding="async">
          <span class="sp-zoom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M15 20h5v-5"/><path d="M4 4l6 6"/><path d="M20 20l-6-6"/></svg></span>
        </button>
      </figure>

      <a
        v-for="l in d.links"
        :key="l.url"
        class="sp-link"
        :href="l.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="sp-card-head">
          <span class="sp-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5"/></svg><span>{{ l.label }}</span></span>
        </div>
        <span class="sp-link-body">
          <span class="sp-link-name">{{ l.label }}</span>
          <span class="sp-link-sub">{{ l.sub }}</span>
        </span>
      </a>
      <p v-if="!d.links.length" class="sp-empty" v-html="t.empty"></p>
    </section>

    <p v-if="note" class="sp-note">{{ note }}</p>

    <footer class="sp-foot" v-html="pick(d.foot, lang)"></footer>

    <div v-if="zoom >= 0 && d.qr[zoom]" class="sp-lb" role="dialog" aria-modal="true" @click="zoom = -1">
      <button
        type="button"
        class="sp-lb-close"
        :aria-label="t.closeAria"
        @click.stop="zoom = -1"
      >&times;</button>
      <img
        :src="d.qr[zoom].src"
        :alt="fill(t.altOf, pick(d.qr[zoom].label, lang))"
        @click.stop
      >
      <p class="sp-lb-cap">{{ pick(d.qr[zoom].label, lang) }}</p>
    </div>
  </div>
</template>

<script>
/**
 * SponsorCard.vue · 收款码赞助卡片
 * ---------------------------------------------------------------------------
 * 用法：在任意 .vue 的 script setup 段里 import 本组件，
 *       然后在模板中直接使用图标名 SponsorCard（本文件内不写标签字面量，
 *       因为脚本块里出现 script 结束标签会提前把块截断）。
 *
 * props 全部可选：
 *   lang        'zh' | 'en'     默认取 SPONSOR_DATA.defaultLang
 *   theme       'light' | 'dark' 不传 = 跟随系统深浅色
 *   showTools   布尔             是否显示右上角语言 / 主题按钮
 *   data        对象             整体替换 SPONSOR_DATA
 *   className   字符串           追加类名
 * 例：<SponsorCard lang="en" theme="dark" :show-tools="false" />
 *
 * 所有文案、图片、链接都在下面的 SPONSOR_DATA 里，改数据即可，不用动逻辑。
 * 图片 src 是相对仓库根目录的路径；在打包器里建议改成 import 进来的 URL。
 * 想把这个数据复用给别处，把 const 换成 export const。
 */
const SPONSOR_DATA = {
  "defaultLang": "zh",
  "langs": [
    "zh",
    "en"
  ],
  "title": {
    "zh": "赞助支持 · iskill-generate-sponsors",
    "en": "Sponsor · iskill-generate-sponsors"
  },
  "tagline": {
    "zh": "如果这个技能帮你省下了时间，可以请我喝杯咖啡 ☕",
    "en": "If this skill saved you some time, you can buy me a coffee ☕"
  },
  "note": {
    "zh": "中国内地用户推荐扫码（支付宝 / 微信）；海外用户推荐 PayPal。",
    "en": "Scan the QR codes if you are in mainland China (Alipay / WeChat); PayPal is easier overseas."
  },
  "foot": {
    "zh": "由 <a href=\"https://github.com/aispin/iskill-generate-sponsors\" target=\"_blank\" rel=\"noopener noreferrer\">iskill-generate-sponsors</a> 生成 · 2026-10-02",
    "en": "Generated by <a href=\"https://github.com/aispin/iskill-generate-sponsors\" target=\"_blank\" rel=\"noopener noreferrer\">iskill-generate-sponsors</a> · 2026-10-02"
  },
  "generatedAt": "2026-10-02",
  "generator": {
    "name": "iskill-generate-sponsors",
    "url": "https://github.com/aispin/iskill-generate-sponsors"
  },
  "ui": {
    "zh": {
      "badge": "赞助支持",
      "hint": "点击放大",
      "linksTitle": "其他支持方式",
      "altOf": "{x}收款码",
      "zoomOf": "放大{x}收款码",
      "themeAria": "切换深色 / 浅色",
      "langAria": "切换中文 / English",
      "closeAria": "关闭放大图",
      "popAria": "打开赞助弹窗",
      "popCloseAria": "关闭赞助弹窗",
      "popSecTitle": "也可以点开看",
      "popSecHint": "点下面的按钮，全部赞助方式会在弹层里重新排一遍。",
      "langShort": "EN",
      "empty": "还没有配置外部赞助链接。加一个 <code>--paypal https://paypal.me/你的名字</code> 再来一次。"
    },
    "en": {
      "badge": "SPONSOR",
      "hint": "Tap to enlarge",
      "linksTitle": "Other ways to support",
      "altOf": "{x} QR code",
      "zoomOf": "Enlarge the {x} QR code",
      "themeAria": "Toggle dark / light mode",
      "langAria": "Switch between 中文 / English",
      "closeAria": "Close",
      "popAria": "Open sponsor popup",
      "popCloseAria": "Close sponsor popup",
      "popSecTitle": "Prefer a popup?",
      "popSecHint": "Tap the button below to see every option in a focused overlay.",
      "langShort": "中",
      "empty": "No external sponsor links yet. Add one with <code>--paypal https://paypal.me/yourname</code>, then re-run."
    }
  },
  "qr": [
    {
      "key": "alipay",
      "src": "assets/sponsor/alipay.jpg",
      "accent": "#1677FF",
      "label": {
        "zh": "支付宝",
        "en": "Alipay"
      },
      "tip": {
        "zh": "打开支付宝「扫一扫」",
        "en": "Scan with Alipay"
      }
    },
    {
      "key": "wechat",
      "src": "assets/sponsor/wechat.jpg",
      "accent": "#07C160",
      "label": {
        "zh": "微信",
        "en": "WeChat"
      },
      "tip": {
        "zh": "打开微信「扫一扫」",
        "en": "Scan with WeChat"
      }
    }
  ],
  "links": [
    {
      "label": "PayPal",
      "sub": "paypal.me/zeovi",
      "url": "https://paypal.me/zeovi",
      "accent": "#0070BA"
    }
  ]
};
</script>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  // 不传就用上面那份；传了就整体替换
  data: { type: Object, default: null },
  // 语言：'zh' | 'en'。不传 = 用 data.defaultLang
  lang: { type: String, default: '' },
  // 主题：'light' | 'dark'。不传 = 跟随系统
  theme: { type: String, default: '' },
  showTools: { type: Boolean, default: true },
  className: { type: String, default: '' },
});

const d = computed(() => props.data || SPONSOR_DATA);
// 跟随系统语言：zh* → 中文，其余 → 英文；SSR/未知语言返回 '' 走 defaultLang
function sysLang() {
  try {
    var l = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (!l || l === 'und') return '';
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  } catch (e) { return ''; }
}
const lang = ref(props.lang || sysLang() || d.value.defaultLang || 'zh');
const theme = ref(props.theme || '');
const zoom = ref(-1);

watch(() => props.lang, (v) => { if (v) lang.value = v; });
watch(() => props.theme, (v) => { theme.value = v || ''; });

const t = computed(() => (d.value.ui && (d.value.ui[lang.value] || d.value.ui.zh)) || {});
const langs = computed(() => d.value.langs || ['zh', 'en']);
const showLang = computed(() => langs.value.length > 1);
const note = computed(() => pick(d.value.note, lang.value));

function pick(v, l) {
  if (v == null) return '';
  if (typeof v !== 'object' || Array.isArray(v)) return String(v);
  if (v[l] != null) return v[l];
  return v.zh != null ? v.zh : (v.en != null ? v.en : '');
}
function fill(tpl, x) {
  return String(tpl == null ? '{x}' : tpl).replace('{x}', x);
}
function toggleLang() {
  const L = langs.value;
  lang.value = L[(L.indexOf(lang.value) + 1) % L.length];
}
function toggleTheme() {
  const sys = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
  theme.value = (theme.value || sys) === 'dark' ? 'light' : 'dark';
}
function onKey(e) { if (e.key === 'Escape') zoom.value = -1; }

watch(zoom, (v) => {
  if (v >= 0) document.addEventListener('keydown', onKey);
  else document.removeEventListener('keydown', onKey);
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<style scoped>
.sponsor-card{
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
.sponsor-card *,.sponsor-card *::before,.sponsor-card *::after{box-sizing:border-box}
.sponsor-card h1,.sponsor-card h2,.sponsor-card p,.sponsor-card figure{margin:0}

.sponsor-card[data-theme="dark"]{
  color-scheme:dark;
    --sp-ink:#eaf0f8; --sp-ink2:#9fadc0; --sp-ink3:#7b8a9d;
    --sp-line:#22303f; --sp-card:#141d29; --sp-card-soft:#192433; --sp-code-bg:#1b2635;
    --sp-bg:linear-gradient(180deg,#10161f,#121a26);
    --sp-badge-fg:#8ff0d4; --sp-badge-bg:#122a26; --sp-badge-line:#1e4a41;
    --sp-qr-bg:#ffffff; --sp-qr-line:#2b3a4b;
    --sp-shadow:0 1px 2px rgba(0,0,0,.3);
    --sp-ui-bg:rgba(20,29,41,.86); --sp-ui-line:#26364a;
}
@media (prefers-color-scheme:dark){
  .sponsor-card:not([data-theme="light"]){
    color-scheme:dark;
      --sp-ink:#eaf0f8; --sp-ink2:#9fadc0; --sp-ink3:#7b8a9d;
      --sp-line:#22303f; --sp-card:#141d29; --sp-card-soft:#192433; --sp-code-bg:#1b2635;
      --sp-bg:linear-gradient(180deg,#10161f,#121a26);
      --sp-badge-fg:#8ff0d4; --sp-badge-bg:#122a26; --sp-badge-line:#1e4a41;
      --sp-qr-bg:#ffffff; --sp-qr-line:#2b3a4b;
      --sp-shadow:0 1px 2px rgba(0,0,0,.3);
      --sp-ui-bg:rgba(20,29,41,.86); --sp-ui-line:#26364a;
  }
}

/* 右上角工具条：语言 + 主题。absolute 而非 fixed —— 组件不该脱离自身盒子 */
.sponsor-card .sp-tools{position:absolute;top:9px;right:9px;z-index:5;display:flex;gap:6px}
.sponsor-card .sp-btn{
  width:28px;height:28px;padding:0;border-radius:8px;
  display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--sp-ink2);background:var(--sp-ui-bg);
  border:1px solid var(--sp-ui-line);backdrop-filter:blur(10px);
  font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.03em;
}
.sponsor-card .sp-btn:hover{color:var(--sp-ink)}
.sponsor-card .sp-btn svg{width:14px;height:14px}
.sponsor-card .sp-btn .ic-moon{display:none}
.sponsor-card[data-theme="dark"] .sp-btn .ic-sun{display:none}
.sponsor-card[data-theme="dark"] .sp-btn .ic-moon{display:inline-flex}
@media (prefers-color-scheme:dark){
  .sponsor-card:not([data-theme="light"]) .sp-btn .ic-sun{display:none}
  .sponsor-card:not([data-theme="light"]) .sp-btn .ic-moon{display:inline-flex}
}

.sponsor-card .sp-hero{text-align:center;margin-bottom:clamp(12px,2.5vw,18px)}
.sponsor-card .sp-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-size:10px;font-weight:700;letter-spacing:.14em;
  color:var(--sp-badge-fg);background:var(--sp-badge-bg);border:1px solid var(--sp-badge-line);
  padding:3px 10px;border-radius:999px;
}
.sponsor-card .sp-badge svg{width:11px;height:11px}
.sponsor-card .sp-title{font-size:clamp(16px,2.8vw,20px);line-height:1.3;margin:8px 0 4px;letter-spacing:-.01em}
.sponsor-card .sp-lede{color:var(--sp-ink2);font-size:13px}

/* 所有赞助方式（码 + 链接）通栏一行，窄屏自动换行 */
.sponsor-card .sp-qrs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:stretch}

.sponsor-card .sp-card{
  position:relative;margin:0;width:200px;max-width:100%;
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:12px;
  box-shadow:var(--sp-shadow);padding:9px 9px 8px;
  display:flex;flex-direction:column;gap:7px;overflow:hidden;
  transition:transform .18s,box-shadow .18s;
}
.sponsor-card .sp-card::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--sp-accent),color-mix(in srgb,var(--sp-accent) 45%,var(--sp-card)));
}
.sponsor-card .sp-card:hover{transform:translateY(-2px);box-shadow:0 4px 14px -8px rgba(16,32,56,.28)}
.sponsor-card .sp-card-head{display:flex;align-items:center;gap:8px}
.sponsor-card .sp-chip{
  display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:650;
  color:color-mix(in srgb,var(--sp-accent) 62%,var(--sp-ink));
  background:color-mix(in srgb,var(--sp-accent) 12%,var(--sp-card));
  border:1px solid color-mix(in srgb,var(--sp-accent) 26%,var(--sp-card));
  padding:2px 8px;border-radius:999px;
}
.sponsor-card .sp-chip svg{width:11px;height:11px}

.sponsor-card .sp-qr{
  position:relative;display:block;width:100%;padding:6px;margin:0;
  cursor:zoom-in;background:var(--sp-qr-bg);border:1px solid var(--sp-qr-line);
  border-radius:8px;font-family:inherit;color:inherit;
  transition:border-color .2s,box-shadow .2s;
}
.sponsor-card .sp-qr:hover{border-color:color-mix(in srgb,var(--sp-accent) 45%,var(--sp-qr-line));box-shadow:0 0 0 3px color-mix(in srgb,var(--sp-accent) 14%,transparent)}
.sponsor-card .sp-qr:focus-visible{outline:2px solid var(--sp-accent);outline-offset:2px}
.sponsor-card .sp-qr img{display:block;width:100%;height:auto;border-radius:4px}
.sponsor-card .sp-zoom{
  position:absolute;right:11px;bottom:11px;width:24px;height:24px;border-radius:7px;
  display:grid;place-items:center;color:#fff;background:rgba(15,27,45,.55);
  backdrop-filter:blur(6px);opacity:0;transition:opacity .2s;
}
.sponsor-card .sp-zoom svg{width:13px;height:13px}
.sponsor-card .sp-qr:hover .sp-zoom{opacity:1}

/* 链接卡与码卡同构：顶部 chip（图标+名称），中间圆角方容器居中放 名称+链接 */
.sponsor-card .sp-link{
  position:relative;margin:0;width:200px;max-width:100%;
  display:flex;flex-direction:column;gap:7px;
  padding:9px;text-decoration:none;color:var(--sp-ink);
  background:var(--sp-card);border:1px solid var(--sp-line);border-radius:12px;
  box-shadow:var(--sp-shadow);
  transition:transform .18s,box-shadow .18s;
  overflow:hidden;
}
.sponsor-card .sp-link::before{
  content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--sp-accent),color-mix(in srgb,var(--sp-accent) 45%,var(--sp-card)));
}
.sponsor-card .sp-link:hover{transform:translateY(-2px);box-shadow:0 4px 14px -8px rgba(16,32,56,.28)}
.sponsor-card .sp-link:focus-visible{outline:2px solid var(--sp-accent);outline-offset:2px}
.sponsor-card .sp-link :deep(.sp-link-body){
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
.sponsor-card .sp-link-name{font-weight:650;font-size:14px}
.sponsor-card .sp-link-sub{font-size:11px;color:#55637a;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sponsor-card .sp-empty{flex-basis:100%;color:var(--sp-ink2);text-align:center}
.sponsor-card .sp-empty :deep(code){background:var(--sp-code-bg);padding:2px 6px;border-radius:6px;font-size:12.5px}

.sponsor-card .sp-note{margin-top:14px;text-align:center;color:var(--sp-ink2);font-size:12px}
.sponsor-card .sp-foot{margin-top:18px;text-align:center;font-size:11.5px;color:var(--sp-ink3)}
.sponsor-card .sp-foot :deep(a){color:var(--sp-ink2);text-decoration:none;border-bottom:1px solid var(--sp-line)}

.sponsor-card .sp-lb{
  position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;
  background:rgba(9,16,28,.78);backdrop-filter:blur(10px);
  padding:clamp(20px,5vw,32px);cursor:zoom-out;
}
.sponsor-card .sp-lb img{max-width:min(440px,86vw);max-height:76vh;background:#fff;padding:14px;border-radius:18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6)}
.sponsor-card .sp-lb-cap{color:#e8eef7;font-size:14.5px;letter-spacing:.02em}
.sponsor-card .sp-lb-close{
  position:absolute;top:18px;right:20px;width:40px;height:40px;border-radius:50%;
  border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);
  color:#fff;font-size:22px;line-height:1;cursor:pointer;
}

@media (max-width:520px){
  .sponsor-card{padding:14px 12px 26px;border-radius:12px}
  .sponsor-card .sp-card{padding:9px 9px 7px;border-radius:11px}
  .sponsor-card .sp-link{padding:7px 10px}
  .sponsor-card .sp-tools{top:7px;right:7px}
  .sponsor-card .sp-btn{width:26px;height:26px}
}
@media (prefers-reduced-motion:reduce){.sponsor-card *{transition:none!important;animation:none!important}}
@media print{
  .sponsor-card{background:#fff;padding:0;border-radius:0}
  .sponsor-card .sp-tools,.sponsor-card .sp-foot,.sponsor-card .sp-zoom{display:none}
  .sponsor-card .sp-card,.sponsor-card .sp-link{box-shadow:none;background:#fff;break-inside:avoid}
  .sponsor-card .sp-qr{cursor:default}
}
</style>
