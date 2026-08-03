# TrackDraft

A fantasy music curation & A&R draft game. Draft a seven-round project, guided EP, or long-form album across positional slots, dodge the **Artist Monopoly Penalty**, balance energy pacing, and get reviewed by an explainable **A&R Critic Panel**.

Built with **Next.js 16**, **Tailwind CSS v4**, **Zustand**, **Web Audio API**, and the Google Generative AI SDK.

## Gameplay

- **Three modes:** Draft Mode (7 rounds vs deterministic AI), EP Builder (6–7 tracks), and Album Builder (12–14 tracks).
- **Five-card Draft pools:** Draft Mode gives both sides the same five recommendations, hides the AI pick until lock, then reveals the result.
- **Era filters:** All / 2020s / 2010s / 2000s & classics reshape the candidate pool.
- **Per-round draft:** Each slot has an ideal energy target (e.g., Intro ≈ 75%, Energy Peak ≈ 90%). Pick from 5 recommendations in Draft Mode.
- **Artist Monopoly rule:** A solo artist can appear once without penalty. Each repeat solo track deducts points. Featured guest appearances are exempt — strategic song selection encourages features.
- **Energy pacing metrics:** Fatigue score, BPM transitions, and overall pacing status update live as you draft.
- **Wildcard rerolls:** Trade a token to refresh the candidate pool.
- **Transparent A&R scorecard:** Slot Fit, Sequencing & Flow, Narrative / Concept, Variety & Balance, Energy Curve, Originality / Taste, and Replay Value are scored 0–100 with evidence and disclosed penalties.
- **AI A&R Critic Panel:** Three personas narrate the deterministic score; Gemini is optional and safely falls back to the local evaluator.
- **Difficulty tiers:** Standard, Veteran (1 reroll token), or Hardcore (hidden energy targets).
- **Draft History:** Past drafts are saved locally — your Hall of Fame persists across sessions.
- **Setup, Library, Profile:** Configure taste tags and provider scope, search the curated catalog, maintain local favorites/tags, and review your curator record.
- **Share cards:** Export a compact, validated result URL at `/share` with the top three tracks, scorecard categories, grade, and challenge code.
- **Provider bridge:** Connect Spotify or YouTube with PKCE, search/import playlists, resolve tracks, and export the current draft as a private playlist. Provider operations remain unavailable until the deployment has the required OAuth/API credentials.
- **Supabase persistence boundary:** When Supabase Auth and Postgres variables are configured, session create/read/pick/submit routes require an authenticated user and use the RLS-first migration under `supabase/migrations/`. Without those variables, the guest demo continues using the local in-memory session boundary.

## In-app audio bridge

Preview any candidate or drafted track through one of three sources:

- **YouTube Music** embedded player (primary)
- **Spotify** embedded player (if a `spotifyId` is available)
- **Web Audio synth** fallback (pure oscillator tone derived from the track's BPM)

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Zustand v5 (with `persist` middleware for draft history + resume)
- Web Audio API (custom audio engine for UI FX + synth previews)
- `canvas-confetti` (draft-complete celebration)
- Google Generative AI SDK (A&R critic evaluation)
- Provider adapter boundary with demo, Spotify, and YouTube capability discovery (`GET /api/providers`)
- Server-side provider adapters for Spotify Web API and YouTube Data API v3, with encrypted OAuth cookies and import/search/export routes
- Playwright CLI smoke coverage under `tests/e2e/` and GitHub Actions CI under `.github/workflows/ci.yml`
- lucide-react icons

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build & lint:

```bash
npm run build
npm run lint
npm test
```

## Project structure

```
src/
├── app/
│   ├── api/critic-evaluate/   # AI critic endpoint (falls back to local evaluator)
│   ├── api/providers/         # Provider capability/search endpoints
│   │   ├── import/             # Import Spotify/YouTube playlists
│   │   └── export/             # Export a drafted list to a private playlist
│   ├── api/auth/provider/      # PKCE link/callback handlers
│   ├── api/sessions/          # Prototype session/pick/submit API boundary
│   ├── api/songs/resolve/      # Strict official-URL resolution boundary
│   ├── api/auth/provider/     # PKCE link scaffold; disabled without credentials
│   ├── share/                 # Validated share-card result route
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                # DraftBoard, DraftCard, AICriticPanel, modals, docked player, ...
├── data/
│   ├── slots.ts               # EP & LP positional slot definitions
│   └── songs.ts               # Song library + per-slot option generator + optimal-picker
├── hooks/
│   └── useModalA11y.ts        # Shared modal accessibility (Escape, backdrop, focus trap)
├── lib/
│   ├── audioEngine.ts         # Web Audio UI FX + synth preview
│   ├── musicBridge.ts         # YouTube / Spotify / bulk URL builders
│   ├── providers/             # Normalized adapters, OAuth/PKCE scaffold
│   ├── sessionRepository.ts   # Guest/demo in-memory session boundary
│   ├── supabase/               # Optional SSR Auth, clients, and persistence adapter
│   └── sharePayload.ts        # Strict URL-safe share contract
├── store/
│   └── useDraftStore.ts       # Zustand store: draft state, monopoly/energy math, evaluation
└── types/
    └── draft.ts               # Shared types (Song, DraftSlot, EvaluationResult, ...)
```

## Supabase configuration

The Supabase production foundation is opt-in. Create a Supabase project, apply `supabase/migrations/20260803000000_trackdraft_foundation.sql`, and configure `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key). Configure Google or GitHub in Supabase Auth and add the deployed URL plus `/api/auth/supabase/callback` to the provider redirect URLs; set the Supabase Auth Site URL to the deployed origin. Spotify and YouTube provider OAuth callbacks are `/api/auth/provider/spotify/callback` and `/api/auth/provider/youtube/callback`, and must also be registered with their respective provider consoles. The app uses verified Supabase Auth claims for ownership and the migration enables RLS on user-owned tables. The repository intentionally keeps guest demo mode available when these variables are absent.

## Provider configuration

Copy `.env.example` to your deployment environment. `PROVIDER_SESSION_SECRET` must be a random secret of at least 32 characters; it encrypts short-lived OAuth state and access-token cookies. Spotify requires OAuth client credentials and playlist scopes. YouTube search/resolution can use `YOUTUBE_DATA_API_KEY`, while playlist import/export requires OAuth with the YouTube `force-ssl` scope. Access-token environment variables are supported for local/server-to-server testing only; production should use the OAuth callback cookies.

The provider endpoints are:

- `GET /api/providers/search?provider=spotify|youtube&q=...`
- `POST /api/providers/import` with `{ "provider", "reference" }`
- `POST /api/providers/export` with `{ "provider", "name", "songs" }`
- `POST /api/songs/resolve` with `{ "provider", "url" }`

## Automated browser smoke test

With the app running, execute `npm run test:e2e`. The CLI smoke flow covers landing, Setup, Library search, Profile, share-link degradation, provider capability discovery, and disabled-provider behavior. GitHub Actions runs it after lint, unit tests, and the production build.

## Deployment

The easiest deployment path is the [Vercel Platform](https://vercel.com/new). Provider credentials are not required for demo mode. Optional AI narration uses `GEMINI_API_KEY`; without it, deterministic scoring remains fully functional. Set `NEXT_PUBLIC_SITE_URL` in production so metadata and share URLs use the deployed origin.

For the credentialed launch sequence, use the [production launch checklist](docs/production-launch-checklist.md).
The current delivery status and remaining work are tracked in the [remaining-work execution plan](docs/remaining-work-plan.md).

## License

Personal/educational project. Song metadata and YouTube/Spotify links belong to their respective rights holders — this app only links to official streams.
