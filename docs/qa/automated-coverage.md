# TrackDraft automated QA coverage

This coverage targets the original QA gaps without changing application code, CI, or package scripts.

## Commands

```sh
npm test
npm run lint
BASE_URL=http://127.0.0.1:3000 tests/e2e/trackdraft-smoke.sh
BASE_URL=http://127.0.0.1:3000 tests/e2e/trackdraft-qa-gaps.sh
```

The E2E scripts use the repository's existing Playwright CLI wrapper. Start the app first with `npm run dev`.

## Coverage map

| Gap | Automated assertion |
| --- | --- |
| Full mode flows | Draft 7, EP 7, and Album 14 advance through every rendered lock action, preserve candidate counts, reach review, and render the seven-category scorecard. Unit coverage also exercises all configured 6/7/12/13/14-track templates. |
| Token policy | Standard candidate counts are checked in every mode; Hardcore browser flow verifies classified targets and exactly one remaining reroll token. Seeded rerolls are reproducible but distinct. |
| Provider degradation | Expired OAuth payloads are recognized as expired, live cookies supply tokens, 401/403/429/503/network failures map to explicit recovery states, and missing credentials remain `not-configured`. |
| AI fallback | The critic endpoint returns a deterministic-source result with three reviews and all seven transparent categories when no Gemini key is configured. |
| Challenge/share | Challenge seeds and era sequences remain deterministic across rounds; URL shares round-trip opponent context; malformed challenge/share requests return validation errors; guest share persistence is non-fatal. |
| Keyboard/accessibility/mobile | Modal role and `aria-modal`, focus-trap wrap, Escape restoration, progressbar values, input labels, 390×844 viewport, and horizontal-overflow checks run against the rendered app. |

## Deliberate boundary

The browser checks require a running local app and do not add a Playwright test dependency or CI changes. Unit tests use Node's built-in test runner, matching the repository's existing scripts.
