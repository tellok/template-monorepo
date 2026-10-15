#!/usr/bin/env bash
set -euo pipefail
project_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project_root"
export OPENSPEC_TELEMETRY=0
export TURBO_TELEMETRY_DISABLED=1
node -e 'const fs = require("node:fs"); const major = fs.readFileSync(".node-version", "utf8").trim().split(".")[0]; if (process.versions.node.split(".")[0] !== major) throw new Error(`Node ${major} is required`)'
expected_pnpm=$(node -p "require('./package.json').packageManager.split('@').pop().split('+')[0]")
test "$(pnpm --version)" = "$expected_pnpm"
pnpm install --frozen-lockfile
if ! test -x /usr/bin/chromium && test -z "${BROWSER_PATH:-}"; then
  pnpm exec playwright install chromium
fi
pnpm check
pnpm spec:validate
