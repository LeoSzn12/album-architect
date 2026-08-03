#!/usr/bin/env bash
set -euo pipefail
exec npx --no-install playwright-cli "$@"
