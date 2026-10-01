/**
 * 生成 Vue 3 单文件组件（.vue）—— 零三方依赖、<style scoped>。
 * ---------------------------------------------------------------------------
 * 与 React 版共用同一份数据模型和同一套 CSS（componentCss），只有两处差异：
 *   1. root 选择器是 .sponsor-card，靠 SFC 的 <style scoped> 自动补 [data-v-xxx]；
 *   2. v-html 注入的节点拿不到 data-v 属性，所以 foot / empty 里的后代选择器
 *      要用 :deep() 包一层，否则样式静默失效（这是 Vue scoped 的经典坑）。
 */
import { componentCss } from './lib/component-css.mjs';

const SVG = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.6c0 4.2-5.4 8-8.8 10.4C8.6 16.6 3.2 12.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.4"/><path d="M14.5 14.5h3v3h-3z"/><path d="M20.5 14.5v6h-6"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M15 20h5v-5"/><path d="M4 4l6 6"/><path d="M20 20l-6-6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"/></svg>',
};

export function renderVue(opt, model) {
  const data = JSON.stringify(model, null, 2);
  const css = componentCss('.sponsor-card', { deep: true });

  // 注意：头部**不能**用 HTML 注释写用法 —— 注释里出现 <template> 会被 SFC
  // 解析器当成真的块，报 "Invalid end tag"。所以用法放在 <script> 的 JS 注释里。
  return `<!-- SponsorCard.vue · 由 iskill-generate-sponsors 生成 · 零三方依赖 · 样式 scoped · 响应式 · 中英双语 -->
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
        <span class="ic-sun">${SVG.sun}</span>
        <span class="ic-moon">${SVG.moon}</span>
      </button>
    </div>

    <header class="sp-hero">
      <span class="sp-badge">${SVG.heart}<span>{{ t.badge }}</span></span>
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
          <span class="sp-chip">${SVG.qr}<span>{{ pick(q.label, lang) }}</span></span>
        </div>
        <button
          type="button"
          class="sp-qr"
          :aria-label="fill(t.zoomOf, pick(q.label, lang))"
          @click="zoom = i"
        >
          <img :src="q.src" :alt="fill(t.altOf, pick(q.label, lang))" loading="lazy" decoding="async">
          <span class="sp-zoom">${SVG.expand}</span>
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
        <span class="sp-link-ic">${SVG.link}</span>
        <span class="sp-link-label">{{ l.label }}</span>
        <span class="sp-link-sub">{{ l.sub }}</span>
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
const SPONSOR_DATA = ${data};
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
${css}
</style>
`;
}
