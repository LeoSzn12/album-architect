#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PWCLI="${PWCLI:-$REPO_ROOT/scripts/playwright-cli.sh}"
SESSION="trackdraft-trackdraft-qa-gaps.sh-$$"
pw() { "$PWCLI" --session "$SESSION" "$@"; }
trap 'pw close >/dev/null 2>&1 || true' EXIT
pw open "$BASE_URL"
code="$(node -p "require(process.argv[1]).toString()" "$REPO_ROOT/tests/e2e/browser-gameplay.cjs")"
output="$(pw run-code "$code" 2>&1)"
printf '%s\n' "$output"
if [[ "$output" == *"### Error"* ]]; then exit 1; fi
echo "Browser checks passed."
