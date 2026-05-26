#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PNPM_BIN="${PNPM_BIN:-/home/zecyel/.nvm/versions/node/v24.11.1/bin/pnpm}"
export PATH="$(dirname "$PNPM_BIN"):/usr/local/bin:/usr/bin:/bin:${PATH:-}"

cd "$ROOT_DIR/vitepress"
"$PNPM_BIN" build

cd "$ROOT_DIR"
rm -rf backend/dist
cp -r vitepress/.vitepress/dist backend/dist
