#!/usr/bin/env bash
set -euo pipefail
cd /workspace/template-monorepo
export XDG_DATA_HOME=/workspace/.xdg-data
export npm_config_cache=/workspace/.npm-cache
export OPENSPEC_TELEMETRY=0
export TURBO_TELEMETRY_DISABLED=1
node -e 'if (process.versions.node.split(".")[0] !== "24") throw new Error("Node 24 is required")'
test "$(pnpm --version)" = 11.25.0
pnpm install --frozen-lockfile
if ! test -x /usr/bin/chromium && test -z "${BROWSER_PATH:-}"; then
  pnpm exec playwright install chromium
fi
pnpm check
pnpm spec:validate
