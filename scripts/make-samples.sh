#!/usr/bin/env bash
# iskill-generate-sponsors · 重出 SKILL.md / README 里的可视样本
#
#   bash scripts/make-samples.sh
#
# 约定：文档里的样本图必须是**生成器现场产物**，不能是手工截图 ——
#       改了 HTML 版式后跑一次，文档里的图就跟着更新，不会撒谎。
#
# 产出：assets/sample-sponsors.jpg（亮色·中文）、-dark.jpg（暗色·英文）、
#       -en.jpg（亮色·英文）、-mobile.jpg（390px 窄屏）、sample-readme-block.jpg
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
bash "${HERE}/make-all.sh" --config "${ROOT}/sponsors.config.json" --out "${ROOT}" >/dev/null

# 2) 无头渲染两套配色的 sponsors.html
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/light.png"  1000 1200 light zh
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/en.png"     1000 1200 light en
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/dark.png"   1000 1200 dark  en
# 窄屏：shoot.mjs 会自动用 iframe 绕过 headless 的 500px 视口下限
"${NODE_BIN}" "${HERE}/shoot.mjs" "${ROOT}/sponsors.html" "${TMP}/mobile.png"  390 1500 light zh

# 3) README 区块预览（渲染 SPONSORS.md 里的**真实** marker 区块）
#    预览页写在临时目录，所以要给它 <base> 指回仓库根，否则相对图片路径全断
"${NODE_BIN}" "${HERE}/preview-block.mjs" "${ROOT}/SPONSORS.md" "${TMP}/block.html" "${ROOT}"
"${NODE_BIN}" "${HERE}/shoot.mjs" "${TMP}/block.html" "${TMP}/block.png" 940 820 light

# 4) 转成 jpg 压体积（PNG 截图带照片会到 700KB+，文档里没必要）
mkdir -p "${ROOT}/assets"
for pair in \
  "light:${ROOT}/assets/sample-sponsors.jpg" \
  "en:${ROOT}/assets/sample-sponsors-en.jpg" \
  "dark:${ROOT}/assets/sample-sponsors-dark.jpg" \
  "mobile:${ROOT}/assets/sample-mobile.jpg" \
  "block:${ROOT}/assets/sample-readme-block.jpg"
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
