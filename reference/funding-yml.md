# FUNDING.yml 速查与坑

官方规范：<https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository>

## 位置与生效

- 路径固定 `.github/FUNDING.yml`，必须落在**默认分支**上。
- 提交后仓库页右上角出现 **Sponsor** 按钮，点击展开所有渠道。
- 组织/个人账号可以建一份默认的社区健康文件（`.github` 仓库），让名下所有仓库继承。

## 支持的键

每个外部平台**只能填一个**用户名 / 包名。

| 键 | 值格式 | 说明 |
| --- | --- | --- |
| `github` | `用户名` 或 `[用户1, 用户2, ...]` | GitHub Sponsors；单账号最多 4 个被赞助开发者 |
| `patreon` | `用户名` | |
| `open_collective` | `用户名` | |
| `ko_fi` | `用户名` | |
| `liberapay` | `用户名` | |
| `tidelift` | `平台名/包名` | 平台名：`npm` / `pypi` / `rubygems` / `maven` / `packagist` / `nuget` |
| `community_bridge` | `项目名` | LFX Mentorship（原 CommunityBridge） |
| `issuehunt` | `用户名` | |
| `polar` | `用户名` | |
| `buy_me_a_coffee` | `用户名` | |
| `thanks_dev` | `u/gh/用户名` | |
| `custom` | `URL` 或 `[URL1, URL2, URL3, URL4]` | **最多 4 个**完整 URL |

示例：

```yaml
github: [octocat, surftocat]
patreon: octocat
tidelift: npm/octo-package
custom: ["https://www.paypal.me/octocat", octocat.com]
```

## 坑

1. **`custom` 数组里含 `:` 的 URL 必须加引号。**
   写 `- https://paypal.me/x` 在多数 YAML 解析器里能过，但 `https://` 里的 `:` 会踩坑。
   本技能统一输出 `- "https://www.paypal.com/ncp/payment/SN6RMEF7FNKU4"` 形式，**永远加引号**。

2. **`custom` 最多 4 条**，超出的会被忽略（本技能会打印警告并截断）。

3. **微信 / 支付宝收款码无法配置。**
   它们不是 FUNDING.yml 支持的平台，只能：
   - 内联展示在 README / 网页里（本技能的默认做法）；
   - 或把收款码页面托管到某个 URL，塞进 `custom`（但不要用短链服务，容易被判滥用）。

4. **不要拿 FUNDING 链接做其他用途**（打广告、政治/社群/慈善募捐），GitHub 明确不支持，
   有疑问按官方说法去 support 问。

5. **Sponsor 按钮开关是仓库设置，不是文件。**
   文件有了还要在 `Settings → General → Features → Sponsorships` 里勾上，
   否则按钮不显示。

6. `paypal.me` 常被误写成 `paypay.me` —— 本技能会自动纠正并提示。

## 本技能怎么用

```bash
# 只配 custom 一条 PayPal
node scripts/gen-sponsors.mjs --paypal https://www.paypal.com/ncp/payment/SN6RMEF7FNKU4

# PayPal 走 custom，Ko-fi / Liberapay 走原生键
node scripts/gen-sponsors.mjs --paypal https://www.paypal.com/ncp/payment/SN6RMEF7FNKU4 --kofi zeo --liberapay zeo
```

生成的 `FUNDING.yml` 会带注释，末尾额外用注释列出**无法进 FUNDING 的收款码**落在哪，
方便以后回头找。
