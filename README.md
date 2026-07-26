# Album Architect

A fantasy music curation & A&R draft game. Draft your dream EP or LP across positional album slots (Cinematic Intro → Outro), dodge the **Artist Monopoly Penalty**, balance energy pacing, and get reviewed by an **AI A&R Critic Panel**.

Built with **Next.js 16**, **Tailwind CSS v4**, **Zustand**, **Web Audio API**, and the Google Generative AI SDK.

## Gameplay

- **Two modes:** Quick EP (7 rounds, 2 reroll tokens) or Full LP (14 rounds, 3 tokens).
- **Era filters:** All / 2020s / 2010s / 2000s & classics reshape the candidate pool.
- **Per-round draft:** Each slot has an ideal energy target (e.g., Cinematic Intro ≈ 75%, Apex Heavy Hitter ≈ 95%). Pick from 4 shuffled candidates.
- **Artist Monopoly rule:** A solo artist can appear once without penalty. Each repeat solo track deducts points. Featured guest appearances are exempt — strategic song selection encourages features.
- **Energy pacing metrics:** Fatigue score, BPM transitions, and overall pacing status update live as you draft.
- **Wildcard rerolls:** Trade a token to refresh the candidate pool.
- **AI A&R Critic Panel:** Three personas (Marcus the Purist, Chloe the Data Exec, Julian the Vibe Connoisseur) score your draft with sub-scores (Pacing, Synergy, Cohesion, Star Power) and the A&R Hindsight analysis compares your picks to the true optimal library matches.
- **Difficulty tiers:** Standard, Veteran (1 reroll token), or Hardcore (hidden energy targets).
- **Draft History:** Past drafts are saved locally — your Hall of Fame persists across sessions.

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
```

## Project structure

```
src/
├── app/
│   ├── api/critic-evaluate/   # AI critic endpoint (falls back to local evaluator)
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
│   └── musicBridge.ts         # YouTube / Spotify / bulk URL builders
├── store/
│   └── useDraftStore.ts       # Zustand store: draft state, monopoly/energy math, evaluation
└── types/
    └── draft.ts               # Shared types (Song, DraftSlot, EvaluationResult, ...)
```

## Deployment

The easiest deployment path is the [Vercel Platform](https://vercel.com/new). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more.

## License

Personal/educational project. Song metadata and YouTube/Spotify links belong to their respective rights holders — this app only links to official streams.
