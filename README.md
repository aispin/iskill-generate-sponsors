# iskill-generate-sponsors

把**一张收款码图片**变成一整套可以直接用的赞助页：`.github/FUNDING.yml` + 可粘进任何 Markdown 的
`SPONSORS.md` 区块 + 响应式中英双语的 `sponsors.html` + 零依赖的 React / Vue 组件。

零三方依赖（Node 18+ 标准库），图片压缩优先用 macOS 自带 `sips`。

> **本仓库自己就是示例。** 页面底部的赞助区块、`.github/FUNDING.yml`、`.github/sponsor/` 里的二维码、
> 以及根目录的 `SPONSORS.md` / `sponsors.html` / `SponsorCard.jsx` / `SponsorCard.vue` —— 全部由本技能生成。

## 快速开始

```bash
# 1) 从收款码目录一把梭（按文件名自动识别支付宝 / 微信 / QQ / 云闪付 / PayPal）
bash scripts/make-all.sh --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi

# 2) 配置驱动（推荐，长期复用；本仓库的 sponsors.config.json 可直接抄）
cp sponsors.config.json my.config.json
bash scripts/make-all.sh --config my.config.json --out .
```

## 产出

| 文件 | 用途 |
| --- | --- |
| `.github/sponsor/*.jpg` | 压缩后的收款码（长边 ≤ 800，专供 README 内联） |
| `.github/FUNDING.yml` | GitHub 仓库右上角的 **Sponsor 按钮** |
| `SPONSORS.md` | 完整赞助页 + 嵌入说明（Markdown） |
| `sponsors.html` | 单文件网页：响应式布局，内置中/英切换 + 深浅主题 + 点击放大灯箱 + 打印样式 |
| `SponsorCard.jsx` / `SponsorCard.vue` | 零依赖 scoped 组件，与 html 同源的数据/样式/文案，直接嵌进 React 或 Vue 项目 |
| `README.md` 区块 | 由两个**独占一行**的 HTML 注释 `sponsors:start` / `sponsors:end` 包裹，可重复运行覆盖 |

组件都支持（props 均可选）：`lang`（zh/en）、`theme`（light/dark/跟随系统）、
`show-tools`（隐藏右上角切换按钮）、`data`（换成你自己的数据）。
不想要组件时加 `--no-components`。

## 为什么不直接把收款码写进 FUNDING.yml

`FUNDING.yml` 只认 GitHub 支持的那些平台（GitHub Sponsors / Patreon / Ko-fi / Liberapay /
Open Collective / Polar / Buy Me a Coffee / IssueHunt / thanks.dev），
再加最多 4 个 `custom` URL。**微信 / 支付宝收款码不是平台，无法配置**，
所以只能内联展示在 README / 网页里；本技能会在 `FUNDING.yml` 里用注释标出它们的位置。

## 文档

- 技能本体：[`SKILL.md`](SKILL.md)
- FUNDING.yml 字段与坑：[`reference/funding-yml.md`](reference/funding-yml.md)
- HTML / Markdown 版式规范：[`reference/sponsor-design.md`](reference/sponsor-design.md)

---

<!-- sponsors:start -->
## 赞助支持 · iskill-generate-sponsors

如果这个技能帮你省下了时间，可以请我喝杯咖啡 ☕

<p align="center">
  <img src=".github/sponsor/alipay.jpg" width="220" alt="支付宝收款码">&nbsp;&nbsp;&nbsp;<img src=".github/sponsor/wechat.jpg" width="220" alt="微信收款码">
</p>

<p align="center"><sub>打开支付宝「扫一扫」 · 打开微信「扫一扫」</sub></p>

| 渠道 | 地址 |
| --- | --- |
| **支付宝** | 扫码（见上方二维码） |
| **微信** | 扫码（见上方二维码） |
| PayPal | [https://paypal.me/zeovi](https://paypal.me/zeovi) |

中国内地用户推荐扫码（支付宝 / 微信）；海外用户推荐 PayPal。

<p align="center"><sub>感谢每一份支持 · <a href="https://github.com/aispin/iskill-generate-sponsors">iskill-generate-sponsors</a></sub></p>
<!-- sponsors:end -->
