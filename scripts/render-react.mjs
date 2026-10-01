/**
 * 生成 React 组件（.jsx）—— 零三方依赖、样式 scoped。
 * ---------------------------------------------------------------------------
 * React 没有原生 scoped CSS，这里用「唯一前缀类 + 组件内 <style>」实现：
 *   - 不需要 css-modules / styled-components / 任何构建配置，拷进项目就能跑；
 *   - 所有规则都挂在 .sp-<hash> 下，不会污染宿主项目的全局样式。
 * 主题用根元素上的 data-theme（不传 = 跟随系统，靠 prefers-color-scheme 兜底），
 * 因此同一页面多个实例可以各自独立。
 */
import { componentCss } from './lib/component-css.mjs';

/** 由项目名导出稳定的 6 位 scope，重跑不变（保证幂等、diff 干净） */
export function scopeId(seed) {
  let h = 2166136261;
  for (const ch of String(seed || 'sponsor')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return 'sp-' + h.toString(36).slice(0, 6);
}

export function renderReact(opt, model) {
  const S = scopeId(opt.project + '|' + model.title.zh);
  const data = JSON.stringify(model, null, 2);
  const css = componentCss('.' + S);

  return `/* eslint-disable */
// ---------------------------------------------------------------------------
// SponsorCard.jsx · 由 iskill-generate-sponsors 生成
// 零三方依赖（只依赖 react）· 样式 scoped（前缀类 ${S}，不污染全局）
//
//   import SponsorCard from './SponsorCard.jsx';
//   <SponsorCard />                       // 默认中文，主题跟随系统
//   <SponsorCard lang="en" />             // 英文
//   <SponsorCard theme="dark" />          // "light" | "dark" | 不传=跟随系统
//   <SponsorCard showTools={false} />     // 去掉右上角语言 / 主题按钮
//   <SponsorCard data={myData} />         // 换自己的数据（结构见下方 SPONSOR_DATA）
//
// 所有文案、图片、链接都在 SPONSOR_DATA 里，改数据即可，不用动逻辑。
// 图片 src 是相对仓库根目录的路径；在打包器里建议改成 import 进来的 URL。
// ---------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';

export const SPONSOR_DATA = ${data};

const SCOPE = '${S}';

const CSS = \`
${css}
\`;

const Icon = {
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 8.6c0 4.2-5.4 8-8.8 10.4C8.6 16.6 3.2 12.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z" />
    </svg>
  ),
  Qr: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1.4" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1.4" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1.4" />
      <path d="M14.5 14.5h3v3h-3z" />
      <path d="M20.5 14.5v6h-6" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" /><path d="M20 4l-8.5 8.5" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </svg>
  ),
  Expand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H4v5" /><path d="M15 20h5v-5" /><path d="M4 4l6 6" /><path d="M20 20l-6-6" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z" />
    </svg>
  ),
};

const pick = (v, lang) => {
  if (v == null) return '';
  if (typeof v !== 'object' || Array.isArray(v)) return String(v);
  if (v[lang] != null) return v[lang];
  return v.zh != null ? v.zh : (v.en != null ? v.en : '');
};
const fill = (tpl, x) => String(tpl == null ? '{x}' : tpl).replace('{x}', x);
const sysDark = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
// 跟随系统语言：zh* → 中文，其余 → 英文；SSR/未知语言返回 '' 走 data.defaultLang
const sysLang = () => {
  try {
    const l = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (!l || l === 'und') return '';
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  } catch (e) { return ''; }
};

export default function SponsorCard({
  data,
  lang: langProp,
  theme: themeProp,
  showTools = true,
  className = '',
  style,
}) {
  const d = data || SPONSOR_DATA;
  const [lang, setLang] = useState(langProp || sysLang() || d.defaultLang || 'zh');
  const [theme, setTheme] = useState(themeProp || '');
  const [zoom, setZoom] = useState(-1);

  // 允许外部受控：传了 prop 就跟从 prop
  useEffect(() => { if (langProp) setLang(langProp); }, [langProp]);
  useEffect(() => { setTheme(themeProp || ''); }, [themeProp]);

  const t = (d.ui && (d.ui[lang] || d.ui.zh)) || {};
  const langs = d.langs || ['zh', 'en'];
  const showLang = langs.length > 1;

  const toggleLang = () => setLang(langs[(langs.indexOf(lang) + 1) % langs.length]);
  const toggleTheme = () => setTheme((theme || (sysDark() ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (zoom < 0) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setZoom(-1); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  const note = pick(d.note, lang);

  return (
    <div
      className={[SCOPE, className].filter(Boolean).join(' ')}
      style={style}
      data-theme={theme || undefined}
    >
      <style>{CSS}</style>

      {showTools && (
        <div className="sp-tools">
          {showLang && (
            <button type="button" className="sp-btn" onClick={toggleLang} aria-label={t.langAria} title={t.langAria}>
              {t.langShort}
            </button>
          )}
          <button type="button" className="sp-btn" onClick={toggleTheme} aria-label={t.themeAria} title={t.themeAria}>
            <span className="ic-sun"><Icon.Sun /></span>
            <span className="ic-moon"><Icon.Moon /></span>
          </button>
        </div>
      )}

      <header className="sp-hero">
        <span className="sp-badge"><Icon.Heart /><span>{t.badge}</span></span>
        <h1 className="sp-title">{pick(d.title, lang)}</h1>
        <p className="sp-lede">{pick(d.tagline, lang)}</p>
      </header>

      <section className="sp-qrs">
        {d.qr.map((q, i) => {
          const label = pick(q.label, lang);
          return (
            <figure className="sp-card" key={q.key || i} style={{ '--sp-accent': q.accent }}>
              <div className="sp-card-head">
                <span className="sp-chip"><Icon.Qr /><span>{label}</span></span>
              </div>
              <button
                type="button"
                className="sp-qr"
                onClick={() => setZoom(i)}
                aria-label={fill(t.zoomOf, label)}
              >
                <img src={q.src} alt={fill(t.altOf, label)} loading="lazy" decoding="async" />
                <span className="sp-zoom"><Icon.Expand /></span>
              </button>
            </figure>
          );
        })}
        {d.links.length ? d.links.map((l) => (
          <a
            className="sp-link"
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="sp-card-head">
              <span className="sp-chip"><Icon.Link /><span>{l.label}</span></span>
            </div>
            <span className="sp-link-body">
              <span className="sp-link-name">{l.label}</span>
              <span className="sp-link-sub">{l.sub}</span>
            </span>
          </a>
        )) : (
          <p className="sp-empty" dangerouslySetInnerHTML={{ __html: t.empty }} />
        )}
      </section>

      {note ? <p className="sp-note">{note}</p> : null}

      <footer className="sp-foot" dangerouslySetInnerHTML={{ __html: pick(d.foot, lang) }} />

      {zoom >= 0 && d.qr[zoom] && (
        <div className="sp-lb" role="dialog" aria-modal="true" onClick={() => setZoom(-1)}>
          <button
            type="button"
            className="sp-lb-close"
            aria-label={t.closeAria}
            onClick={(e) => { e.stopPropagation(); setZoom(-1); }}
          >
            ×
          </button>
          <img
            src={d.qr[zoom].src}
            alt={fill(t.altOf, pick(d.qr[zoom].label, lang))}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="sp-lb-cap">{pick(d.qr[zoom].label, lang)}</p>
        </div>
      )}
    </div>
  );
}
`;
}
