#!/bin/bash
# Builds First Week as a static site into ./out (for GitHub Pages).
# Server-only parts (API routes and the session proxy) are set aside during
# the build and put back afterwards; the static game plays on the device.
set -euo pipefail
cd "$(dirname "$0")/.."
ASIDE="$(mktemp -d)"
restore() {
  if [[ -d "$ASIDE/api" ]]; then rm -rf src/app/api; mv "$ASIDE/api" src/app/api; fi
  if [[ -f "$ASIDE/proxy.ts" ]]; then mv "$ASIDE/proxy.ts" src/proxy.ts; fi
  rm -rf "$ASIDE"
}
trap restore EXIT
mv src/app/api "$ASIDE/api"
mv src/proxy.ts "$ASIDE/proxy.ts"
rm -rf out
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC_SITE=1 npx next build
touch out/.nojekyll
