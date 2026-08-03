#!/usr/bin/env bash
set -euo pipefail
exec npx --yes --package @playwright/mcp playwright-cli "$@"
