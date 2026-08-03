#!/usr/bin/env bash

# Gap-focused browser QA for a running TrackDraft instance.
# Usage: BASE_URL=http://127.0.0.1:3000 tests/e2e/trackdraft-qa-gaps.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME_DIR/skills/playwright/scripts/playwright_cli.sh}"
SESSION="trackdraft-qa-gaps-${PPID}-$$"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run the Playwright CLI wrapper." >&2
  exit 1
fi

if [[ ! -x "$PWCLI" ]]; then
  echo "Playwright CLI wrapper not found at $PWCLI" >&2
  exit 1
fi

pw() {
  "$PWCLI" --session "$SESSION" "$@"
}

run_code() {
  local output
  if ! output="$(pw eval "$1" 2>&1)"; then
    printf '%s\n' "$output" >&2
    exit 1
  fi
  if grep -Fq '### Error' <<<"$output"; then
    printf '%s\n' "$output" >&2
    exit 1
  fi
  printf '%s\n' "$output"
}

assert_text() {
  local expected="$1"
  local body
  body="$(run_code "document.body.innerText")"
  if ! grep -Fiq "$expected" <<<"$body"; then
    echo "Expected text not found: $expected" >&2
    exit 1
  fi
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}
trap cleanup EXIT

assert_mode_flow() {
  local mode="$1"
  local track_count="$2"
  local seed="$3"
  local label="$4"
  local candidate_count=4
  local review_label="Review EP"
  if [[ "$mode" == "draft" ]]; then
    candidate_count=5
    review_label="Get Your Score"
  elif [[ "$mode" == "album" ]]; then
    review_label="Review Album"
  fi

  echo "[mode] $label"
  pw open "$BASE_URL/?seed=$seed&mode=$mode&diff=standard&era=all"
  sleep 10
  assert_text "Tracks: 0"
  run_code "(() => { const locks = [...document.querySelectorAll('button')].filter((button) => button.textContent?.trim() === 'Lock In Pick'); if (locks.length !== $candidate_count) throw new Error('expected $candidate_count candidates, got ' + locks.length); return true; })()"

  for ((round=1; round<=track_count; round++)); do
    run_code "(() => { const lock = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Lock In Pick'); if (!lock) throw new Error('missing lock button at round $round'); lock.click(); return true; })()"
    run_code "(async () => { const deadline = Date.now() + 8000; while (Date.now() < deadline) { const count = [...document.querySelectorAll('button')].filter((button) => button.textContent?.trim() === 'Lock In Pick').length; if ($round === $track_count ? document.body.innerText.includes('Locked In') : count > 0) return true; await new Promise((resolve) => setTimeout(resolve, 150)); } throw new Error('next round did not settle at round $round'); })()"
    if (( round < track_count )); then
      assert_text "Tracks: $round"
      if [[ "$mode" == "draft" ]]; then assert_text "AI pick revealed"; fi
    else
      assert_text "Tracks: $track_count"
      assert_text "Locked In"
    fi
  done

  run_code "(() => { const review = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('$review_label')); if (!review) throw new Error('review action missing'); review.click(); return true; })()"
  # Evaluation is asynchronous: the scorecard waits for the deterministic
  # fallback/AI response and can take longer on a cold production worker.
  run_code "(async () => { const deadline = Date.now() + 20000; while (Date.now() < deadline) { const body = document.body.innerText; if (body.includes('Scored by Deterministic Engine') || body.includes('Transparent A&R Scorecard')) return true; await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error('final scorecard did not render within 20 seconds'); })()"
  assert_text "Scored by Deterministic Engine"
  assert_text "Transparent A&R Scorecard"
}

echo "[1/5] full mode flows and AI fallback"
assert_mode_flow draft 7 QA-DRAFT-FLOW Draft
assert_mode_flow ep 7 QA-EP-FLOW EP
assert_mode_flow album 14 QA-ALBUM-FLOW Album

echo "[2/5] challenge and share API validation"
pw open "$BASE_URL/share?data=not-valid"
sleep 1
assert_text "This share link is invalid or has been truncated."
run_code "(async () => { const invalidChallenge = await fetch('/api/challenges?code=bad'); if (invalidChallenge.status !== 400) throw new Error('invalid challenge code should be 400'); const invalidStatus = await fetch('/api/challenges', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'ARCH-TEST', status: 'pending' }) }); if (invalidStatus.status !== 400) throw new Error('invalid challenge status should be 400'); const invalidShare = await fetch('/api/share?token=bad'); if (invalidShare.status !== 400) throw new Error('invalid share token should be 400'); const guestShare = await fetch('/api/share', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version: 1 }) }); if (!guestShare.ok) throw new Error('guest share persistence fallback should remain non-fatal'); const body = await guestShare.json(); if (body.persisted !== false) throw new Error('guest share fallback should report persisted=false'); return true; })()"

echo "[3/5] AI fallback endpoint contract"
run_code "(async () => { const response = await fetch('/api/critic-evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gameMode: 'draft', draftedTracks: [{ slot: { id: 'cinematic-intro', name: 'Intro', targetEnergy: { ideal: 75 } }, song: { id: 'qa-song', title: 'QA Song', artist: 'QA Artist', rawArtistString: 'QA Artist', featuredArtists: [], energy: 75, bpm: 100, genre: 'Hip-Hop', impact: 80, slots: ['cinematic-intro'] }, roundDrafted: 1, isWildcard: false }], monopolyReport: { artistCounts: {}, penalizedArtists: [], totalPenaltyDeduction: 0, hasViolation: false }, energyMetrics: { curve: [75], avgEnergy: 75, fatigueScore: 0, status: 'Optimal Pacing', bpmTransitions: [] }, selectedEra: 'all' }) }); if (response.status !== 200) throw new Error('critic fallback returned ' + response.status); const body = await response.json(); if (body.source !== 'fallback') throw new Error('critic endpoint did not identify fallback source'); if (!Array.isArray(body.reviews) || body.reviews.length !== 3) throw new Error('critic fallback reviews incomplete'); if (!body.categoryScores || Object.keys(body.categoryScores).length !== 7) throw new Error('critic fallback scorecard incomplete'); return true; })()"

echo "[4/5] keyboard, focus trap, semantics, and mobile layout"
pw open "$BASE_URL/?seed=QA-A11Y-FLOW&mode=draft&diff=hardcore&era=all"
sleep 2
run_code "(() => { const opener = document.querySelector('button[title=\"Play 1v1 Against Friends with matched seeds\"]'); if (!opener) throw new Error('friends opener missing'); opener.focus(); if (document.activeElement !== opener) throw new Error('friends opener not focusable'); opener.click(); return true; })()"
sleep 0.5
run_code "(() => { const dialog = document.querySelector('[role=\"dialog\"][aria-modal=\"true\"]'); if (!dialog) throw new Error('friends dialog missing semantics'); const focusables = [...dialog.querySelectorAll('button, input, [href], [tabindex]:not([tabindex=\"-1\"])')]; if (focusables.length < 4) throw new Error('friends dialog lacks keyboard controls'); focusables.at(-1).focus(); return true; })()"
pw press Tab
run_code "(() => { const dialog = document.querySelector('[role=\"dialog\"]'); const first = dialog?.querySelector('button'); if (document.activeElement !== first) throw new Error('Tab did not wrap to first dialog control'); return true; })()"
pw press Escape
run_code "(() => { if (document.querySelector('[role=\"dialog\"]')) throw new Error('Escape did not close friends dialog'); if (document.activeElement?.getAttribute('title') !== 'Play 1v1 Against Friends with matched seeds') throw new Error('focus was not restored after Escape'); return true; })()"
run_code "(() => { const progressbars = [...document.querySelectorAll('[role=\"progressbar\"]')]; if (progressbars.some((bar) => !bar.getAttribute('aria-label') || bar.getAttribute('aria-valuenow') === null)) throw new Error('progress bars are missing accessible values'); const unlabeledInputs = [...document.querySelectorAll('input')].filter((input) => !input.getAttribute('aria-label') && !input.closest('label') && !input.id); if (unlabeledInputs.length) throw new Error('unlabeled input controls found: ' + unlabeledInputs.length); return true; })()"
pw resize 390 844
run_code "(() => { if (window.innerWidth !== 390) throw new Error('mobile viewport was not applied'); if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) throw new Error('mobile page has horizontal overflow'); return true; })()"

echo "[5/5] reroll token policy and seeded challenge URL"
  run_code "(() => { const badge = document.body.innerText; if (!badge.includes('Target: Classified')) throw new Error('hardcore target concealment missing'); const reroll = document.querySelector('button[aria-label=\"Reroll candidate pool — 1 remaining\"]'); if (!reroll) throw new Error('hardcore should expose exactly one reroll'); const before = [...document.querySelectorAll('h3')].map((heading) => heading.textContent).join('|'); reroll.click(); return new Promise((resolve) => setTimeout(() => { const after = [...document.querySelectorAll('h3')].map((heading) => heading.textContent).join('|'); if (before === after) throw new Error('reroll did not refresh the candidate pool'); resolve(true); }, 100)); })()"

echo "TrackDraft QA gap checks passed."
