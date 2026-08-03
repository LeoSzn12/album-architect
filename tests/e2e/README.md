# TrackDraft E2E sidecar

This directory intentionally does not add a Playwright test runner or dependency. The repository currently has no `playwright` or `@playwright/test` package, so the smoke coverage is a CLI-friendly spec driven by the Playwright CLI wrapper.

## Run locally

Start the app in one terminal:

```sh
npm run dev
```

Then run the smoke spec in another:

```sh
BASE_URL=http://127.0.0.1:3000 tests/e2e/trackdraft-smoke.sh
```

Prerequisites:

- `node`/`npx` must be available.
- `@playwright/mcp` must be installed for the wrapper, or `PWCLI` may point to another compatible `playwright-cli` binary.
- The app must already be running at `BASE_URL`.

The smoke flow covers:

- home/landing content;
- setup, library search, and profile surfaces;
- missing share-link degradation;
- provider capability discovery;
- disabled Spotify search returning a graceful `503`.
- keyboard focus entering a modal, focus-trap wrapping, and Escape focus restoration;
- a 390×844 mobile viewport with no horizontal overflow.

The script uses a per-process Playwright session and closes it on exit. It does not create screenshots, traces, or other repository artifacts by default.
