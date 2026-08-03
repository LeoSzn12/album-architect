# TrackDraft implementation checklist

This note records the first executable vertical slice from the July 31, 2026 handoff package.

## Delivered in this pass

- [x] Explicit Draft Mode with seven product-language slots.
- [x] Five-card deterministic recommendation pools in Draft Mode.
- [x] Same-pool deterministic AI opponent selection, hidden until the human locks a pick, then revealed.
- [x] Draft result comparison with deterministic winner/tie behavior.
- [x] Seven-category 0–100 scorecard with evidence and separate repeated-lead-artist penalties.
- [x] Additive configurable templates for Draft 7, EP 6/7, and Album 12/13/14.
- [x] Final tracklist reorder controls in the live tracklist drawer.
- [x] Provider-agnostic contract with read-only demo catalog and disabled Spotify/YouTube capability descriptors.
- [x] `GET /api/providers` capability discovery endpoint.
- [x] Guided setup surface with taste tags and provider scope.
- [x] Library search/filter surface with local favorites, tags, hide/restore, and provider-safe notices.
- [x] Curator profile surface backed by local draft history.
- [x] Share payload validation, share-card route, and result export link.
- [x] In-memory session repository boundary with create, pick, and submit API routes.
- [x] Provider search/URL-resolve routes with strict host validation and graceful disabled behavior.
- [x] OAuth/PKCE configuration scaffold and capability-safe link endpoint.
- [x] Encrypted OAuth state/access-token cookies plus provider callback handler.
- [x] Spotify and YouTube server adapters for search, playlist import, URL resolution, playlist creation, and ordered export.
- [x] Provider desk UI with search, import, and export controls.
- [x] Playwright CLI smoke flow and GitHub Actions lint/test/build/E2E workflow.
- [x] Deployment environment template and Node runtime declarations for provider routes.
- [x] Local persistence continues to support resume and now includes Draft/opponent state.
- [x] README, unit tests, API smoke checks, browser QA, simulation test, lint, and production build updated.

## Deliberate prototype boundaries

- Provider operations return a safe `503` until deployment credentials and `PROVIDER_SESSION_SECRET` are configured. OAuth tokens are encrypted in httpOnly cookies for the current prototype; a durable account/session store is still required for multi-instance production deployments.
- The seeded demo catalog is the gameplay source of truth; no audio is hosted or stored.
- AI narration is optional. Competitive scores are deterministic even when Gemini is enabled.
- EP and Album continue to use the existing legacy UI path while sharing the normalized catalog, slots, scoring, persistence, and reorder behavior.

## Next implementation tranche

1. Replace the in-memory session repository with the SQL schema in `db/schema.sql` and add authenticated ownership.
2. Add server-side encrypted OAuth state/token storage, callback routes, and provider feature flags.
3. Connect manual URL resolution and library search to authenticated Spotify/YouTube adapters.
4. Expand automated integration/E2E coverage for resume, provider degradation, reorder-before-submit, and share/challenge flows.
