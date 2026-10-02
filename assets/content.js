/* ============================================================================
 * iskill-generate-sponsors · 落地页内容（唯一需要逐技能改的文件）
 *
 * 页面骨架 + 渲染逻辑来自兄弟技能 iskill-promo-page，别在这里改版式。
 * 本文件只描述「放什么」：品牌色、仓库地址、中英文案，以及 Hero 下方的槽位。
 *
 * 文案里的 HTML 只允许少量行内标签（<code>、<b>），卡片描述走 innerHTML，
 * 其余一律 textContent，别塞脚本。
 *
 * 安装方式默认是「让 agent 去装」——一键复制的是说给 AI 的一句话，
 * 由 repo 自动推导，**不需要你写安装命令**。
 * ==========================================================================*/
window.PROMO = {
  name: "ISKILL-GENERATE-SPONSORS",
  brand: "#10C8A1",
  brand2: "#23ECC2",
  repo: "https://github.com/aispin/iskill-generate-sponsors",
  repoLabel: "aispin/iskill-generate-sponsors",
  license: "MIT",

  /* ── 平台兼容性标签（Hero「AI 技能」右边那枚）───────────────────────────
   * 取值 "mac-windows" | "macos" | "windows" | "linux" | "all" | "" | {zh,en}
   * 判据：跑 sips/osascript/open/lsof//opt/homebrew 硬路径 = 仅 macOS；
   *       有 .ps1/taskkill/win32 分支 = 支持 Windows；纯提示词或纯 Node/Python = all。
   * 标错比不写更糟。详见 promo-page/references/design-guide.md §十。
   */
  platform: "mac-windows",

  /* ── 槽位：把 usage.html 嵌在 Hero 的 CTA 按钮下方 ──────────────────────
   * 这是本次集成的重点：访客在首页就能直接操作「分栏复制」，不用再点走一个页面。
   *
   * 为什么能这么干：usage.html 是**单文件零依赖**（样式、图标全内联），
   * 天生就是个能被 iframe 装走的自包含页面。
   *
   * 语言/主题怎么跟随：宿主首帧把 lang/theme 写进 iframe 的 src（hash），
   * 之后切换走 postMessage —— **不重载**，所以用户切到哪个 tab 不会被重置。
   * usage.html 里已按这套协议实现了监听。
   *
   * 高度为什么写死：两页多跨源（file:// 下必然），量不到子页高度；靠 postMessage
   * 报高又容易和子页里的 vh 单位形成「量高→改高→再量」的震荡。760 是量出来的，
   * 够放「侧边 tabs + 代码区 + 底部预览」；窄屏由 CSS 压到 68vh。
   */
  slots: {
    hero: {
      iframe: {
        src: "usage.html",
        height: 760,
        title: { zh: "用法演示 · 分栏复制全部产物", en: "Live demo · copy every artifact" }
      }
    }
  },

  lang: {
    /* ── 中文 ───────────────────────────────────────────────────────── */
    zh: {
      meta: {
        title: "iskill-generate-sponsors · 一张收款码，长出一整套赞助入口",
        description: "把微信 / 支付宝 / PayPal 收款码图片，一条命令变成 FUNDING.yml、README 区块、赞助页、可嵌入片段与 React/Vue 组件。零依赖、零构建。"
      },
      a11y: { skip: "跳到主要内容" },
      ui: { copy: "复制", copied: "已复制", failed: "复制失败" },
      nav: { features: "能力", shots: "真东西", how: "上手", faq: "问答" },

      hero: {
        badge: "AI 技能",
        titlePre: "一张收款码，",
        titleAccent: "长出一整套赞助入口",
        titlePost: "",
        sub: "把微信 / 支付宝的收款码图片丢给它 —— 产出 FUNDING.yml、README 区块、赞助页、可嵌入片段和 React/Vue 组件。零依赖，排版紧凑。",
        ctaPrimary: "复制安装提示词",
        ctaSecondary: "看源码",
        meta1: "零依赖",
        meta2: "本地运行",
        meta3: "MIT 许可"
      },
      chat: {
        title: "AI Agent · 对话现场",
        status: "在线",
        userLabel: "你",
        agentLabel: "AI",
        messages: [
          { role: "user", text: "帮我把微信 / 支付宝收款码变成一套赞助入口" },
          { role: "agent", text: "把两张码图给我 —— 我跑 gen-sponsors：赞助页 + FUNDING.yml + README 区块 + React/Vue 组件 + usage 页，一次出齐。", tag: "已生成 5 个产物" },
          { role: "user", text: "README 区块直接给我？" },
          { role: "agent", text: "给你可复制的 Markdown 片段，二维码自动裁边压缩，排版紧凑低调，贴哪都行。" }
        ]
      },

      stats: [
        { value: "5 → 1", label: "个产物，一条命令", note: "赞助页 / FUNDING.yml / README 区块 / 组件 / 用法页" },
        { value: "0", label: "第三方依赖", note: "纯 Node 标准库，压图用系统 sips" },
        { value: "32 KB", label: "可嵌入片段", note: "Shadow DOM 自包含，宿主只出个按钮" }
      ],

      compare: {
        eyebrow: "对比",
        title: "以前 vs 现在",
        sub: "",
        before: {
          title: "没有它",
          items: [
            "手写 FUNDING.yml，字段全靠查文档",
            "README 里贴二维码，尺寸和排版一节节调",
            "想要一个赞助页？又是半天"
          ]
        },
        after: {
          title: "有了它",
          items: [
            "一条命令出全部产物",
            "二维码自动裁剪 + 压缩，排版紧凑低调",
            "赞助页 / 组件 / 可嵌入片段一次到位"
          ]
        }
      },

      features: {
        eyebrow: "能力",
        title: "它能做什么",
        sub: "",
        items: [
          { icon: "grid", title: "五种产物一次生成", desc: "sponsors.html、FUNDING.yml、README 区块、React/Vue 组件，外加 usage.html。" },
          { icon: "crop", title: "收款码自动裁剪", desc: "扫 finder 图案定位边界，裁掉多余白边再压缩；检不出就原样走旧管线，不阻断整个流程。" },
          { icon: "layers", title: "能塞进任何页面", desc: "32 KB 的 Shadow DOM 片段：样式双向隔离，语言与主题自动跟随宿主，宿主连 CSS 都不用动。" }
        ]
      },

      showcase: {
        eyebrow: "真东西",
        title: "看一眼真东西",
        sub: "下面全是生成器现场产物 —— 改了版式就重跑脚本，不会留下手工图撒谎。",
        items: [
          { src: "assets/sample-sponsors.jpg", alt: "赞助页亮色中文版", caption: "sponsors.html · 亮色 / 中文" },
          { src: "assets/sample-sponsors-dark.jpg", alt: "赞助页暗色英文版", caption: "sponsors.html · 暗色 / 英文" },
          { src: "assets/sample-popup.jpg", alt: "弹层形态", caption: "点开的弹层：桌面端恒排一行" },
          { src: "assets/sample-mobile.jpg", alt: "窄屏单列", caption: "390px 窄屏：卡片通栏，左右各 40px" }
        ]
      },

      steps: {
        eyebrow: "上手",
        title: "三步跑起来",
        sub: "",
        items: [
          { title: "交给 AI 装", desc: "把这句话粘进对话框，agent 会自己拉代码、读文档，再告诉你用法。", codeKey: "install" },
          {
            title: "跑一条命令",
            desc: "把收款码图片丢进去，其余交给它。",
            codeName: "bash",
            code: "node scripts/gen-sponsors.mjs \\\n  --qr 支付宝=alipay.jpg --qr 微信=wechat.jpg \\\n  --paypal https://paypal.me/you"
          },
          {
            title: "嵌进已有页面（可选）",
            desc: "已经有站点、只想要个赞助按钮？只取片段，两行就够。",
            codeName: "html",
            code: "<script src=\"sponsor-embed.js\" defer><\/script>\n<button data-sponsor-open>♡ 赞助</button>"
          }
        ]
      },

      faq: {
        eyebrow: "问答",
        title: "常见问题",
        items: [
          { q: "微信 / 支付宝收款码能写进 FUNDING.yml 吗？", a: "不能。FUNDING.yml 只认 GitHub Sponsors、Patreon、Ko-fi、Liberapay、Polar、Buy Me a Coffee 这类平台链接 —— 二维码属于 custom 渠道。本技能就是按这条规则拆分产物的。" },
          { q: "需要联网或装依赖吗？", a: "都不用。纯 Node 标准库；图片压缩优先用 macOS 自带 <code>sips</code>，没有该命令就原样拷贝，不阻断流程。" },
          { q: "图片放在 .github/sponsor/，Pages 上打开却 404？", a: "GitHub Pages 硬封锁 <code>.github/*</code>。本技能会把图镜像一份到 <code>assets/sponsor/</code> 供页面引用，README 里仍用 .github 那份（仓库内渲染不受影响）。" }
        ]
      },

      cta: { title: "现在就来一发", desc: "把收款码丢给它，30 秒拿到全套赞助产物。", primary: "去 GitHub 看看", secondary: "复制安装提示词" },
      footer: { license: "MIT 许可", madeWith: "由 iskill-promo-page 生成" }
    },

    /* ── English ─────────────────────────────────────────────────────── */
    en: {
      meta: {
        title: "iskill-generate-sponsors · One QR code in, a whole sponsor setup out",
        description: "Turn a WeChat / Alipay / PayPal QR image into FUNDING.yml, a README block, a sponsor page, an embeddable widget, and React/Vue components — in one command. Zero dependencies."
      },
      a11y: { skip: "Skip to content" },
      ui: { copy: "Copy", copied: "Copied", failed: "Copy failed" },
      nav: { features: "Features", shots: "Screens", how: "Get started", faq: "FAQ" },

      hero: {
        badge: "AI skill",
        titlePre: "One QR code in, ",
        titleAccent: "a whole sponsor setup out",
        titlePost: "",
        sub: "Hand it your WeChat / Alipay QR images — get FUNDING.yml, a README block, a sponsor page, an embeddable widget, and React/Vue components. Zero dependencies, tight layout.",
        ctaPrimary: "Copy install prompt",
        ctaSecondary: "View source",
        meta1: "Zero deps",
        meta2: "Runs locally",
        meta3: "MIT licensed"
      },
      chat: {
        title: "AI Agent · live session",
        status: "online",
        userLabel: "You",
        agentLabel: "AI",
        messages: [
          { role: "user", text: "Turn my WeChat / Alipay QR codes into a sponsor setup" },
          { role: "agent", text: "Hand me the two images — I'll run gen-sponsors: sponsor page + FUNDING.yml + README block + React/Vue components + usage page, all at once.", tag: "5 artifacts generated" },
          { role: "user", text: "Give me the README block directly?" },
          { role: "agent", text: "Here's the copy-ready Markdown. QR codes are auto-cropped and compressed, tight and understated layout, paste anywhere." }
        ]
      },

      stats: [
        { value: "5 → 1", label: "artifacts, one command", note: "sponsor page / FUNDING.yml / README block / components / usage page" },
        { value: "0", label: "third-party dependencies", note: "Node stdlib only; images shrink with sips" },
        { value: "32 KB", label: "embeddable widget", note: "Self-contained Shadow DOM; the host only adds a button" }
      ],

      compare: {
        eyebrow: "Comparison",
        title: "Before vs after",
        sub: "",
        before: {
          title: "Without it",
          items: [
            "Hand-write FUNDING.yml, looking up every field",
            "Paste QR codes into the README and fiddle with sizes",
            "Want a sponsor page too? There goes your afternoon"
          ]
        },
        after: {
          title: "With it",
          items: [
            "One command produces everything",
            "QR codes are auto-cropped and compressed, layout stays tight",
            "Sponsor page, components and embeddable widget in one shot"
          ]
        }
      },

      features: {
        eyebrow: "Features",
        title: "What it does",
        sub: "",
        items: [
          { icon: "grid", title: "Five artifacts at once", desc: "sponsors.html, FUNDING.yml, a README block, React/Vue components — plus usage.html." },
          { icon: "crop", title: "Auto-crops the QR code", desc: "Locates the finder patterns, trims the padding, then compresses. If detection fails it falls back to the old pipeline instead of aborting." },
          { icon: "layers", title: "Drops into any page", desc: "A 32 KB Shadow DOM widget: styles isolated both ways, language and theme follow the host, no CSS work required." }
        ]
      },

      showcase: {
        eyebrow: "Screens",
        title: "See the real thing",
        sub: "Every shot below is a live artifact of the generator — change the layout and re-run the script, so the docs can't lie.",
        items: [
          { src: "assets/sample-sponsors.jpg", alt: "Sponsor page, light theme, Chinese", caption: "sponsors.html · light / zh" },
          { src: "assets/sample-sponsors-dark.jpg", alt: "Sponsor page, dark theme, English", caption: "sponsors.html · dark / en" },
          { src: "assets/sample-popup.jpg", alt: "Popup overlay", caption: "The popup: always one row on desktop" },
          { src: "assets/sample-mobile.jpg", alt: "Narrow layout", caption: "390px narrow: full-width card, 40px gutters" }
        ]
      },

      steps: {
        eyebrow: "Get started",
        title: "Up and running in three steps",
        sub: "",
        items: [
          { title: "Let your agent install it", desc: "Paste the line into the chat — it clones the repo, reads the docs, and tells you how to use it.", codeKey: "install" },
          {
            title: "Run one command",
            desc: "Point it at your QR images; it handles the rest.",
            codeName: "bash",
            code: "node scripts/gen-sponsors.mjs \\\n  --qr alipay=alipay.jpg --qr wechat=wechat.jpg \\\n  --paypal https://paypal.me/you"
          },
          {
            title: "Embed it anywhere (optional)",
            desc: "Already have a site and just want a sponsor button? Take the widget — two lines.",
            codeName: "html",
            code: "<script src=\"sponsor-embed.js\" defer><\/script>\n<button data-sponsor-open>♡ Sponsor</button>"
          }
        ]
      },

      faq: {
        eyebrow: "FAQ",
        title: "Frequently asked",
        items: [
          { q: "Can a WeChat / Alipay QR code go into FUNDING.yml?", a: "No. FUNDING.yml only accepts platform links (GitHub Sponsors, Patreon, Ko-fi, Liberapay, Polar, Buy Me a Coffee) — a QR code belongs to the <code>custom</code> channel. This skill splits its artifacts along exactly that line." },
          { q: "Does it need network access or dependencies?", a: "Neither. Pure Node stdlib; image shrinking prefers the macOS built-in <code>sips</code> and simply copies files verbatim where that is unavailable." },
          { q: "Images sit in .github/sponsor/ but 404 on Pages?", a: "GitHub Pages hard-blocks <code>.github/*</code>. The skill mirrors them to <code>assets/sponsor/</code> for the HTML, while the README keeps the .github path (which renders fine inside the repo)." }
        ]
      },

      cta: { title: "Give it a spin", desc: "Hand it your QR codes and get the whole sponsor setup in 30 seconds.", primary: "Open on GitHub", secondary: "Copy install prompt" },
      footer: { license: "MIT licensed", madeWith: "Built with iskill-promo-page" }
    }
  }
};
