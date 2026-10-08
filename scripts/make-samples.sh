#!/usr/bin/env bash
# iskill-generate-sponsors · 重出 SKILL.md / README 里的可视样本
#
#   bash scripts/make-samples.sh
#
# 约定：文档里的样本图必须是**生成器现场产物**，不能是手工截图 ——
#       改了 HTML 版式后跑一次，文档里的图就跟着更新，不会撒谎。
#
# 产出：assets/sample-sponsors.jpg（亮色·中文）、-dark.jpg（暗色·英文）、
#       -en.jpg（亮色·英文）、-mobile.jpg（390px 窄屏·单列）、
#       -popup.jpg（弹层）、sample-readme-block.jpg
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"

NODE_BIN="${NODE:-}"
if [ -z "${NODE_BIN}" ]; then
  for cand in "$(command -v node 2>/dev/null || true)" \
              "${HOME}/.workbuddy/binaries/node/versions/22.22.2-3/bin/node" \
              "/opt/homebrew/bin/node" "/usr/local/bin/node"
  do
    [ -n "${cand}" ] && [ -x "${cand}" ] && NODE_BIN="${cand}" && break
  done
fi
[ -n "${NODE_BIN}" ] || { echo "找不到 node" >&2; exit 1; }

# 1) 先确保 sponsors.html 是最新的
#    页面形态已**固定为两段式**：上半整页卡片 + 下半弹层入口（弹层用 #pop=1 直接开）。
#    所以文档里贴一张 sponsors.html 就能同时讲清两种形态，不再需要单独生成 popup 页。
bash "${HERE}/make-all.sh" --config "${ROOT}/sponsors.config.json" --out "${ROOT}" >/dev/null

# 2) 无头渲染两套配色的 sponsors.html
#    高度按内容给 —— 给太高下面会留一大片空白，给太矮会截掉页脚。
#    实测（2026-10-02 改版后）：1000px 宽内容到 ~669px、390px 宽到 ~1459px。
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/light.png"  1000 700  light zh
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/en.png"     1000 700  light en
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/dark.png"   1000 700  dark  en
# 窄屏：单列卡片通栏（= 视口 − 80），页面比桌面长不少
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/mobile.png"  390 1470 light zh

# 2b) 弹层 —— 直接拍上面这份固定页，URL 带 #pop=1 开弹层（不必再单独生成一页）
#     ⚠️ 弹层版式（一行放几个）改过就要重跑，否则文档样本会撒谎
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html#pop=1" "${TMP}/popup.png" 1180 820 light zh

# 3) README 区块预览（渲染 SPONSORS.md 里的**真实** marker 区块）
#    预览页写在临时目录，所以要给它 <base> 指回仓库根，否则相对图片路径全断
"${NODE_BIN}" "${HERE}/preview-block.mjs" "${ROOT}/SPONSORS.md" "${TMP}/block.html" "${ROOT}"
"${NODE_BIN}" "${HERE}/shoot.mjs" "${TMP}/block.html" "${TMP}/block.png" 940 820 light

# 4) 转成 jpg 压体积（PNG 截图带照片会到 700KB+，文档里没必要）
#    样本图随站点文件一起住在 promo-page/assets/（aa3a14e 迁移后的归属地）
SAMPLES="${ROOT}/promo-page/assets"
mkdir -p "${SAMPLES}"
for pair in \
  "light:${SAMPLES}/sample-sponsors.jpg" \
  "en:${SAMPLES}/sample-sponsors-en.jpg" \
  "dark:${SAMPLES}/sample-sponsors-dark.jpg" \
  "mobile:${SAMPLES}/sample-mobile.jpg" \
  "popup:${SAMPLES}/sample-popup.jpg" \
  "block:${SAMPLES}/sample-readme-block.jpg"
do
  src="${pair%%:*}"; dst="${pair##*:}"
  # 窄屏长图按长边 2000 缩，否则会被压成一条细缝
  zoom=1500; [ "${src}" = "mobile" ] && zoom=2000
  if command -v sips >/dev/null 2>&1; then
    sips -Z "${zoom}" -s format jpeg -s formatOptions 86 "${TMP}/${src}.png" --out "${dst}" >/dev/null
  else
    cp "${TMP}/${src}.png" "${dst%.jpg}.png"
    dst="${dst%.jpg}.png"
  fi
  echo "  ✓ ${dst#${ROOT}/}  $(du -h "${dst}" | cut -f1)"
done
