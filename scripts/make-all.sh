#!/usr/bin/env bash
# iskill-generate-sponsors · 一键包装
#
#   bash scripts/make-all.sh --from ~/收款码 --name ZEO --paypal https://paypal.me/zeovi
#   bash scripts/make-all.sh --config sponsors.config.json --out .
#
# 只是找 Node 并转交给 gen-sponsors.mjs，所有参数原样透传。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTRY="${HERE}/gen-sponsors.mjs"

NODE_BIN=""
for cand in \
  "${NODE:-}" \
  "$(command -v node 2>/dev/null || true)" \
  "${HOME}/.workbuddy/binaries/node/versions/22.22.2-3/bin/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node"
do
  [ -n "${cand}" ] || continue
  [ -x "${cand}" ] || continue
  NODE_BIN="${cand}"
  break
done

if [ -z "${NODE_BIN}" ]; then
  echo "找不到 node（>=18）。请装 Node 或用 NODE=/path/to/node 指定。" >&2
  exit 1
fi

exec "${NODE_BIN}" "${ENTRY}" "$@"
