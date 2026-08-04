# TrackDraft production launch checklist

This runbook covers the remaining credential-gated work from the original TrackDraft handoff package. Do not commit credentials or provider tokens.

## 1. Supabase

1. Create or select the production Supabase project.
2. Apply all migrations in [`supabase/migrations/`](../supabase/migrations/) using the Supabase SQL editor or a linked Supabase CLI project. The final `data_api_grants` migration is required for current Supabase Data API behavior.
3. Confirm all tables have RLS enabled and run an authenticated smoke test for session creation, picks, reorder, submit, library import, scorecards, shares, and challenges.
4. In Supabase Auth URL Configuration:
   - Site URL: the deployed app origin.
   - Additional redirect URL: `<origin>/api/auth/supabase/callback`.
5. Enable the selected Google/GitHub provider and register the same callback URL with that provider.

## 2. Deployment environment

Set these values in the production deployment environment:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for permanent account deletion)
- `PROVIDER_SESSION_SECRET` (random, at least 32 characters)
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`
- `YOUTUBE_DATA_API_KEY` for YouTube search and resolution
- `GEMINI_API_KEY` only if AI narration is desired

Provider callback URLs must be registered exactly as:

- `/api/auth/provider/spotify/callback`
- `/api/auth/provider/youtube/callback`

## 3. Verification order

Run the following after deployment:

```bash
npm test
npm run lint
npm run build
BASE_URL=https://<production-origin> npm run test:e2e
curl --fail https://<production-origin>/api/health
```

Then manually verify:

1. Auth sign-in, sign-out, and redirect return.
2. Start a Draft, EP, and Album session while signed in.
3. Refresh midway through each session and confirm the durable session resumes.
4. Reorder before submit and confirm the saved order survives refresh.
5. Create a share link, challenge, acceptance, completion, and rematch.
6. Connect Spotify and YouTube, search, import, resolve a URL, and export a private playlist.
7. Expire/revoke a provider token and confirm reconnect or demo mode preserves the game.
8. Disconnect Spotify/YouTube and verify the encrypted provider account and cookie are removed.
9. Delete a test account and verify cascading user-owned data removal, Auth sign-out, and re-registration.
10. Confirm `/api/health` reports the expected build SHA and configuration checks without exposing secrets.

## 4. Rollback

If provider or persistence checks fail, remove provider credentials from the deployment environment and keep demo mode enabled. Do not remove the migration or delete user data as a first response; inspect RLS and callback configuration first.
