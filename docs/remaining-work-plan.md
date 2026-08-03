# TrackDraft remaining-work execution plan

Updated 2026-08-03 after re-auditing the original handoff documents.

## Completed in this execution slice

- Durable session lifecycle wired from the client: create, pick, resume, submit, and reorder.
- Persistent reorder API and repository support, with guest in-memory fallback.
- EP/Album-specific builder labels, act progress, review language, and saved/resume indicators.
- Unit coverage for all Draft, EP, and Album template flows plus provider/challenge/share fallback behavior.
- Production launch runbook covering Supabase, OAuth callbacks, deployment variables, smoke verification, and rollback.

## Remaining work

### P0 — credential-gated production activation

1. Apply the Supabase migration to the real project.
2. Configure Supabase Auth Site URL and callback redirects.
3. Register Spotify and YouTube callback URLs and add production secrets.
4. Verify RLS and authenticated session persistence against the real database.

### P1 — live provider and social validation

1. Run Spotify OAuth, search, import, resolve, export, expiry, and reconnect tests.
2. Run YouTube OAuth, search, import, resolve, export, quota, and unavailable-track tests.
3. Verify durable share, challenge acceptance, completion, and rematch flows with signed-in users.

### P1 — browser QA stabilization

1. Stabilize the gap-focused full-mode browser suite around the final evaluation transition.
2. Add authenticated refresh/resume and reorder-before-submit browser coverage.
3. Run screen-reader and reduced-motion checks on a real browser/device matrix.

### P2 — launch hardening

1. Deploy to the selected Vercel or Sites target.
2. Run production smoke tests and monitor server errors, provider rate limits, and Auth callbacks.
3. Clean up remaining development-only dependency audit findings when compatible upgrades are available.

## Blocking inputs

The only required human-provided inputs are the production Supabase project credentials, provider OAuth credentials, and deployment access. Demo mode and all code-level work remain usable without them.
