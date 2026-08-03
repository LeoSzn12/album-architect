#!/usr/bin/env bash

# CLI-friendly Playwright smoke spec for a running TrackDraft instance.
# Usage: BASE_URL=http://127.0.0.1:3000 tests/e2e/trackdraft-smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME_DIR/skills/playwright/scripts/playwright_cli.sh}"
SESSION="trackdraft-e2e-${PPID}"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run the Playwright CLI wrapper." >&2
  exit 1
fi

if [[ ! -x "$PWCLI" ]]; then
  echo "Playwright CLI wrapper not found at: $PWCLI" >&2
  echo "Install @playwright/mcp or set PWCLI to a compatible playwright-cli." >&2
  exit 1
fi

pw() {
  "$PWCLI" --session "$SESSION" "$@"
}

assert_text() {
  local expected="$1"
  local body
  body="$(pw eval "document.body.innerText")"
  if ! grep -Fiq "$expected" <<<"$body"; then
    echo "Expected text not found: $expected" >&2
    exit 1
  fi
}

run_code() {
  pw eval "$1"
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[1/5] home surface"
pw open "$BASE_URL"
assert_text "Fantasy Music Draft Game"
assert_text "Start Draft"

echo "[2/5] setup, library, and profile surfaces"
run_code "document.querySelector('button[title=\"Open session setup\"]')?.click()"
sleep 1
assert_text "Catalog source"
assert_text "Spotify: scaffolded"

run_code "document.querySelector('button[title=\"Open track library\"]')?.click()"
sleep 1
assert_text "Search, mark, and shape your personal cut list."
run_code "(() => { const search = document.querySelector('input[placeholder=\"Search title, artist, album, or mood\"]'); if (!search) throw new Error('catalog search input missing'); search.value = 'Kanye'; search.dispatchEvent(new Event('input', { bubbles: true })); return true; })()"
sleep 1
assert_text "Dark Fantasy"

run_code "document.querySelector('button[title=\"Open curator profile\"]')?.click()"
sleep 1
assert_text "Draft record"
assert_text "Complete your first draft"

echo "[3/5] share page degradation"
pw open "$BASE_URL/share"
assert_text "This share link is missing its result data."

echo "[4/5] provider capability discovery"
run_code "(async () => { const res = await fetch('/api/providers'); const body = await res.json(); if (res.status !== 200) throw new Error('provider capability endpoint returned ' + res.status); if (!body.providers.some((provider) => provider.id === 'demo')) throw new Error('demo provider missing'); if (!body.providers.some((provider) => provider.id === 'spotify' && provider.capabilities.search.enabled === false)) throw new Error('spotify degradation missing'); return true; })()"

echo "[5/5] disabled provider search remains graceful"
run_code "fetch('/api/providers/search?provider=spotify&q=Kanye').then((response) => { if (response.status !== 503) throw new Error('expected disabled provider status 503, got ' + response.status); return true; })"

echo "TrackDraft E2E smoke checks passed."
