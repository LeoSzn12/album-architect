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
│   ├── sessionRepository.ts   # Swappable in-memory session boundary
│   └── sharePayload.ts        # Strict URL-safe share contract
├── store/
│   └── useDraftStore.ts       # Zustand store: draft state, monopoly/energy math, evaluation
└── types/
    └── draft.ts               # Shared types (Song, DraftSlot, EvaluationResult, ...)
```

## Deployment

The easiest deployment path is the [Vercel Platform](https://vercel.com/new). Provider credentials are not required for demo mode. Optional AI narration uses `GEMINI_API_KEY`; without it, deterministic scoring remains fully functional. Set `NEXT_PUBLIC_SITE_URL` in production so metadata and share URLs use the deployed origin.

## License

Personal/educational project. Song metadata and YouTube/Spotify links belong to their respective rights holders — this app only links to official streams.
