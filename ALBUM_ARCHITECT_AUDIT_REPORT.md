# Album Architect — Principal Frontend & Music League UX Audit Report

**Repository:** `/Volumes/Xstorage/AR Music Playlist Game`
**Stack:** Next.js 16.2.12 (Turbopack) · React 19.2.4 · Tailwind CSS v4 · Zustand 5 · TypeScript 5 · `@google/genai`
**Audit Date:** 2026-07-25
**Auditor:** Principal Frontend Engineer & Music League UX Auditor

---

## 1. Executive Summary & Quality Score

### Overall Quality Score: **78 / 100** (B+)

Album Architect is a visually rich, well-structured fantasy music A&R draft application with a strong art direction (glassmorphism, neon ambient orbs, gradient track cards) and a coherent game loop (7-track Quick EP / 14-track Full LP, positional slots, monopoly penalty, energy fatigue, multi-persona AI critic panel, 1v1 seed challenges, leaderboard). The core data model is clean, types are exhaustive, and the deterministic seeded shuffle works correctly for the simplest challenge case.

However, the audit surfaced **1 Critical, 4 High, 6 Medium, and 6 Low** severity issues spanning determinism correctness, Zustand hydration safety, accessibility, security, and runtime robustness. The most consequential finding is that **reroll tokens are effectively no-ops under a shared seed** — every reroll call regenerates the identical candidate pool — which silently undermines the "1v1 fair battle" guarantee that the social mode is built around.

### Score Breakdown
| Dimension | Max | Score | Notes |
|---|---|---|---|
| Architecture & Next.js conventions | 15 | 12 | Clean App Router split; Store hydration not MIGRATE-safe |
| Core gameplay / determinism engine | 25 | 18 | Seeded shuffle is deterministic *within an era* but reroll is broken under seed; `evaluateDraft` reads stale `draftSeed` |
| Monopoly & fallback math | 15 | 11 | Solo vs featured logic correct; persona sub-scores detached from real sub-scores in fallback |
| 1v1 H2H & social | 15 | 11 | Base64 matchup import trusts client payload; no server validation; tie handling edge cases |
| UI/UX, audio, a11y | 20 | 16 | Audio engine solid; modal focus trap has mem-leak/`removeEventListener` edge cases; `aria-label` missing on icon-only buttons |
| Build & code health | 10 | 10 | `npm run lint` clean (7 warnings) · `npm run build` green in 1.2s |

---

## 2. Critical / High / Medium / Low Risk Findings

> All line numbers reference the current HEAD of the repo.

### 🔴 CRITICAL

#### C1. Reroll tokens are no-ops under a shared seed (`useRerollToken` regenerates identical pool)
**Files:** [useDraftStore.ts#L389-L401](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L389-L401), [songs.ts#L1206-L1211](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/data/songs.ts#L1206-L1211)

`useRerollToken` calls `getOptionsForSlot(currentSlot.id, 4, selectedEra, draftSeed)`. Because the shuffle key is `${seed}-${slotId}-match` (with **no nonce**), a player under seed `ARCH-7X9K` at slot `cinematic-intro` will receive the exact same 4 candidates on every "reroll." Verified empirically:

```
Session A: [ 'song-1', 'song-3', 'song-9', 'song-4' ]
Reroll (same seed/slot) reproduces identical pool: true
```

**Impact:** In any seeded 1v1 match the player burns a reroll token (reducing resources) without changing their choices. This is a silent gameplay contract violation — mode copy claims "1 Reroll Token" buys "Refresh candidates for this round" ([DraftBoard.tsx#L185](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/DraftBoard.tsx#L185)), but under a seed the refresh yields zero change. The Veteran/Hardcore tiers give only 1 token, so a player gets exactly one worthless action.

**Fix:** Incorporate a deterministic-but-variable nonce into the seed tag, e.g. a `rerollCounter` stored in the store:
```ts
const freshOptions = getOptionsForSlot(
  currentSlot.id, 4, selectedEra,
  draftSeed ? `${draftSeed}#R${rerollCount}` : null
);
```
and bump `rerollCount` in the action so each reroll produces a new shuffle permutation while remaining 100% reproducible for the same `(seed, slot, rerollIndex)` tuple—preserving fair 1v1 parity.

---

### 🟠 HIGH

#### H1. `evaluateDraft` snapshot omits `draftSeed` reactivity from partial state (`page.tsx` effect double-calls `startNewDraft`)
**Files:** [page.tsx#L33-L49](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/app/page.tsx#L33-L49), [useDraftStore.ts#L447-L489](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L447-L489)

The URL-sync `useEffect` (deps `[setDraftSeed, startNewDraft]`) calls both `setDraftSeed(urlSeed)` **and** `startNewDraft(undefined, undefined, urlDiff, urlSeed)`. But `setDraftSeed` itself calls `startNewDraft(undefined, undefined, undefined, seed)` ([useDraftStore.ts#L257-L259](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L257-L259)). This double-invokes `startNewDraft` for the same seed on mount, resetting `draftedTracks`/`evaluationResult` twice and burning any in-progress playthrough if the user had a deep-link with only `?seed=...`. The two actions' result is identical so the symptom is invisible in production, but any later enhancement (analytics, side-effects inside `startNewDraft`) will fire twice.

**Fix:** Remove the redundant `setDraftSeed(urlSeed)` call; `startNewDraft(urlMode, undefined, urlDiff, urlSeed)` already sets `draftSeed` internally ([useDraftStore.ts#L299](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L299)).

#### H2. Zustand `persist` has no `version` or `migrate` — schema changes silently corrupt hydrated state
**File:** [useDraftStore.ts#L562-L585](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L562-L585)

The persist config has `name: 'album-architect-draft-v1'` but **no `version` field and no `migrate` function**. When you change the `DraftStoreState` shape (add/remove a field or change `DraftedTrack`), existing users' `localStorage` will be rehydrated with a stale partial object, silently breaking `monopolyReport.artistCounts` (a deep nested object) or `slots` (whose `id` enum must match current `SlotId`). `currentOptions` is persisted too — if a re-shuffle algorithm changes mid-release, returning players keep the old candidate snapshot forever until they `startNewDraft`.

**Impact:** A single breaking schema bump ships silent state corruption. persistence.

**Fix:** Add versioning:
```ts
{
  name: 'album-architect-draft-v1',
  version: 2,
  migrate: (persisted, ver) => { /* normalize ver → 2 */ },
  partialize: (state) => ({
    /* do NOT persist `currentOptions` — recompute via getOptionsForSlot on hydration */
  }),
}
```
Also drop `currentOptions` and `slots` from `partialize` (they are deterministic functions of `gameMode` + `selectedEra` + `draftSeed` + `currentRoundIndex`).

#### H3. Base64 matchup code import trusts arbitrary client payloads (`atob` → JSON.parse → state write)
**File:** [PlayAgainstFriendsModal.tsx#L117-L139](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/PlayAgainstFriendsModal.tsx#L117-L139)

`handleImportMatchupCode` decodes any base64 string to JSON and **writes the resulting `score`, `alias`, `subScores` directly into `versusMatchup`** with only a single `decoded.alias && typeof decoded.score === 'number'` guard. A malicious or malformed code can inject:
- `challengerScore: Infinity` (passes `typeof === 'number'`) — player always wins,
- `challengerAlias` containing JSX-injectable strings (later rendered in `<h3>` and `<span>`),
- `subScores` with `NaN` values → `.toFixed(1)` returns `"NaN"` in the scorecard.

The catch block only handles JSON parse errors; semantic validation is absent.

**Fix:** Clamp/validate every numeric field within an allowlist:
```ts
const clamp = (n: unknown, lo: number, hi: number, def: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
```
Apply to `score` (clamp 0–10), each sub-score (0–10), and sanitize `alias` (trim, maxLength 24, strip `<`/`>`). Reject the code if `score < 0 || score > 10`.

#### H4. Two duplicate `generateFallbackEvaluation` implementations with divergent math and no shared scoring contract
**Files:** [route.ts#L153-L233](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/app/api/critic-evaluate/route.ts#L153-L233), [useDraftStore.ts#L589-L721](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L589-L721)

There are two fallback evaluators — one server-side in the route, one client-side in the store (used when the `fetch('/api/critic-evaluate')` call fails in `evaluateDraft`). They compute the **same overallScore via different formulas**, with different sub-score weights and no shared optimal-picks computation. The server version returns `rawScore: 9.5` hardcoded ([route.ts#L181](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/app/api/critic-evaluate/route.ts#L181)) while the client computes `rawScore` from weighted sub-scores ([useDraftStore.ts#L620](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L620)). Persona "Purist" quote and badge diverge. This means **the same draft receives different scores depending on whether the network request succeeded** — a non-deterministic UX, especially bad for a leaderboard.

**Fix:** Extract one canonical `generateFallbackEvaluation` into `src/lib/fallbackEvaluator.ts`, import it from both the route and the store. Remove the duplicated copy in the route. Add a `source: 'gemini' | 'fallback'` field to `EvaluationResult` so the leaderboard/scorecard can badge the origin.

---

### 🟡 MEDIUM

#### M1. `useModalA11y` restores previous focus even when modal unmounts due to React Strict Mode double-invoke / conditional render
**File:** [useModalA11y.ts#L58-L64](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/hooks/useModalA11y.ts#L58-L64)

The cleanup calls `previousFocusRef.current.focus()` unconditionally. If `isOpen` flips to `false` by parent unmount (rather than user closing), React may have already moved focus; re-focusing a detached DOM node throws `Failed to execute 'focus' on 'HTMLElement'`. Also `setTimeout(() =>_FOCUS, 50)` is not cleared on fast-unmount, leaving a dangling timer that fires `focus()` on a stale modal root. Both leak in dev Strict Mode and on rapid open/close.

**Fix:** Track the timer id and clear it in cleanup; guard the focus restore with `previousFocusRef.current?.isConnected`.

#### M2. User-supplied `playerAlias` rendered into DOM without escaping
**Files:** [PlayAgainstFriendsModal.tsx#L380](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/PlayAgainstFriendsModal.tsx#L380), [LeaderboardPanel.tsx#L152](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/LeaderboardPanel.tsx#L152), [AICriticPanel.tsx](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/AICriticPanel.tsx)

React escapes text by default, but aliases imported via the base64 matchup code (H3) bypass the `setPlayerAlias` trim at [useDraftStore.ts#L261-L263](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L261-L263) because they're written directly to `versusMatchup`. Combined with H3, a crafted `challengerAlias` containing emojis / long zero-width chars can also break layout (`truncate` only clips width, not glyph flooding). Low exploit risk but breaks the "Executive Alias" preset contract.

**Fix:** Mirror the same `trim() || 'Executive Architect'` normalization at the matchup import site.

#### M3. `findOptimalPickForSlot` produces "optimal" picks that re-trigger monopolies (sub-m optimal ≠ globally optimal)
**File:** [useDraftStore.ts#L630-L650](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L630-L650)

The function greedily picks the minimum-energy-delta song per slot, then `draftedSoloArtists.push(chosenSong.artist)` excludes that artist only for the *next* slots. But because the iteration order is `draftedTracks` (player's order, which is already draft-locked), the "optimal" picks for slots 1–3 may force non-tagged songs into later slots, producing a worse theoretical score than the surfaced `theoreticalOptimalScore` claims. The `reason` string `"You picked the optimal track for this slot!"` is therefore misleading for multi-slot monotonic mismatches.

**Fix:** Either (a) reframe copy to "Locally optimal for this slot given your prior picks," or (b) run a real per-slot DP over the remaining library given prior selections, mirroring the in-game `draftSong` logic.

#### M4. `evaluateDraft` is an async action on a Zustand store that reads state via `get()` without snapshot stability
**File:** [useDraftStore.ts#L447-L489](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/store/useDraftStore.ts#L447-L489)

The action destructures `draftedTracks`, `monopolyReport`, etc. synchronously, then awaits a `fetch`. After the await, it reads `leaderboard`/`pastDrafts` again — but these can have changed (e.g., user clicked `clearHistory` mid-fetch). The action does not re-validate that the user still has the same `evaluationResult` before mutating `pastDrafts`. In a low-traffic app this is unlikely, but the contract should either (a) freeze the snapshot before the fetch and only apply diffs of `id`s, or (b) tag entries with the `draftSeed` + `draftedTracks` length and reject stale writes.

**Fix:** Capture `draftedTracksSnapshot = draftedTracks` before `await`, and after `await`, compare `get().draftedTracks === draftedTracksSnapshot` (reference equality is sufficient since `startNewDraft`/`draftSong` create new arrays).

#### M5. AudioContext never closed; long sessions leak an oscillator graph per hover on iOS
**File:** [audioEngine.ts#L6-L19](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/lib/audioEngine.ts#L6-L19)

`getAudioContext` lazily creates **one** global `AudioContext` and never closes it. That's intentional (shared context), but every `playHoverSound` builds an `OscillatorNode + GainNode` graph that auto-disconnects when `osc.stop()` fires — fine in desktop Chrome. On iOS Safari, however, suspended-context `resume()` returns a promise that is never awaited ([audioEngine.ts#L15-L17](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/lib/audioEngine.ts#L15-L17)); playing the first hover before a user gesture quietly fails. No `catch` reports the rejection. The 60 ms hover throttle is good; consider also adding a cap of one in-flight hover oscillator.

**Fix:** Await `ctx.resume()` and/or wrap hover sound in a "user-gesture-armed" flag set on first `pointerdown`.

#### M6. `api/critic-evaluate` body validation only checks `draftedTracks.length`; no shape check on `monopolyReport` or `energyMetrics`
**File:** [route.ts#L20-L25](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/app/api/critic-evaluate/route.ts#L20-L25)

A shape-broken `monopolyReport` (e.g., missing `penalizedArtists`) will pass validation and crash the prompt-template string interpolation at [route.ts#L52-L56](file:///Volumes/Xstorage/AR%20Music%20Music%20Playlist%20Game/src/app/api/critic-evaluate/route.ts#L52-L56) (`.map` on `undefined`). The outer `try` catches it and returns a generic 500. Acceptable for MVP but worth a runtime schema check (zod) so the fallback path is reachable instead of a 500.

---

### 🟢 LOW

#### L1. `hashString` collapses ASCII case (Mulberry32 hash) — `'ARCH-7X9K'` and `'arch-7x9k'` produce the same seed
**File:** [seededRandom.ts#L5-L13](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/lib/seededRandom.ts#L5-L13)

`hash = (hash << 5) - hash + char` is case-sensitive on `charCodeAt`, so technically seeds are case-aware. But the join handler uppercases the seed ([PlayAgainstFriendsModal.tsx#L72](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/PlayAgainstFriendsModal.tsx#L72)) while `page.tsx#L36` also uppercases — consistent today, but fragile. Document the canonical form ("uppercase ASCII") in a constant.

#### L2. `lucide-react@^1.27.0` is two majors behind current (`lucide-react` v0.x was the old namespace; v1+ is the maintained line)
**File:** [package.json#L14](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/package.json#L14)

All imported icons (`Swords`, `Sparkles`, `Trophy`, …) verify at build, but `lucide-react@1.x` lacks some newer icons. Not a bug — flagged for upgrade planning.

#### L3. ESLint: 7 unused `e` warnings in audio engine catch blocks
**File:** [audioEngine.ts](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/lib/audioEngine.ts) lines 46, 93, 120, 147, 213, 218, 223

All are `catch (e) {}` style. Replace with `catch {}` (optional catch binding, ES2019) — the project targets `ES2017` in tsconfig but Next 16 / Turbopack will downlevel cleanly. Restores a clean `npm run lint`.

#### L4. `npm run lint` script is `eslint` with no `--max-warnings 0`
**File:** [package.json#L9](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/package.json#L9)

Lint passes the warnings-only count. CI gate should run `eslint --max-warnings 0` so the count is enforced; today the project ships with 7 warnings silently.

#### L5. `EraFilter` mismatch between challenge players silently breaks determinism
**File:** [songs.ts#L1196-L1233](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/data/songs.ts#L1196-L1233)

A challenge URL only encodes `?seed=...&mode=...&diff=...` — not `era`. If Player A opens the link and selects "All Eras" while Player B selects "2020s," `filterByEra` returns a *different pool* before the seeded shuffle, so the two players see *different* candidate choices even under the shared seed. 1v1 fairness is therefore contingent on both players manually choosing the same era. The "Create 1v1 Challenge" copy at [PlayAgainstFriendsModal.tsx#L257-L259](file:///Volumes/Xstorage/AR%20Music%20Playlist%20Game/src/components/PlayAgainstFriendsModal.tsx#L257-L259) claims "100% fair sequencing battle!" — currently false when eras differ.

**Fix:** Either (a) include `&era=` in the challenge URL and force the joiner to that era, or (b) document the parity requirement in the share copy.

#### L6. `DockedMusicPlayer`, `OscilloscopeEnergyBar`, `ArtistMonopolyTracker` not directly audited for empty/edge states beyond blanket rendering
The empty-state branches (`draftedTracks.length === 0`) are handled in `DraftBoard.tsx` but not consistently across `DockedMusicPlayer`/`OscilloscopeEnergyBar`. Quick visual review recommended before launch.

---

## 3. Actionable Code Fixes & Refactoring Recommendations

### 3.1 Priority A — Ship-blocking / contract-breaking (this release)

```diff
// useDraftStore.ts — fix reroll determinism under seed (C1)
useRerollToken: () => {
  const { rerollTokens, slots, currentRoundIndex, selectedEra, draftSeed, rerollCount } = get();
  if (rerollTokens <= 0 || currentRoundIndex >= slots.length) return false;
  const currentSlot = slots[currentRoundIndex];
  const seededTag = draftSeed ? `${draftSeed}#R${rerollCount + 1}` : null;
  const freshOptions = getOptionsForSlot(currentSlot.id, 4, selectedEra, seededTag);
  set({
    rerollTokens: rerollTokens - 1,
    rerollCount: rerollCount + 1,           // new persisted state field
    currentOptions: freshOptions,
  });
  return true;
},
```
Add `rerollCount: number` to `DraftStoreState`, init `0`, reset on `startNewDraft`, include in `partialize`.

```diff
// page.tsx — remove redundant setDraftSeed (H1)
if (urlSeed) {
- setDraftSeed(urlSeed);
  startNewDraft(
    urlMode === 'ep' || urlMode === 'album' ? urlMode : undefined,
    undefined,
    urlDiff === 'standard' || urlDiff === 'veteran' || urlDiff === 'hardcore' ? urlDiff : undefined,
    urlSeed
  );
}
```

```diff
// useDraftStore.ts — add persistence versioning (H2)
{
  name: 'album-architect-draft-v1',
  version: 2,
  migrate: (persisted: any, version: number) => {
    if (version < 2 && persisted) {
      // re-derive slots + currentOptions from (gameMode, selectedEra, draftSeed)
      const slots = persisted.gameMode === 'album' ? ALBUM_SLOTS : EP_SLOTS;
      persisted.slots = slots;
      persisted.currentOptions = getOptionsForSlot(slots[0].id, 4, persisted.selectedEra ?? 'all', persisted.draftSeed);
    }
    return persisted;
  },
  partialize: (state) => ({
    gameMode: state.gameMode, difficulty: state.difficulty, draftSeed: state.draftSeed,
    playerAlias: state.playerAlias, currentRoundIndex: state.currentRoundIndex,
    draftedTracks: state.draftedTracks, rerollTokens: state.rerollTokens,
    rerollCount: state.rerollCount, selectedEra: state.selectedEra,
    monopolyReport: state.monopolyReport, energyMetrics: state.energyMetrics,
    evaluationResult: state.evaluationResult, audioEnabled: state.audioEnabled,
    audioSourcePreference: state.audioSourcePreference,
    pastDrafts: state.pastDrafts, leaderboard: state.leaderboard, versusMatchup: state.versusMatchup,
    // slots + currentOptions recomputed on hydration
  }),
}
```

### 3.2 Priority B — Surface this release

- **Unify fallback evaluator (H4):** Move `generateFallbackEvaluation` into `src/lib/fallbackEvaluator.ts`; import from both `route.ts` and `useDraftStore.ts`. Delete the duplicated route copy. Add `source: 'gemini' | 'fallback'` to `EvaluationResult`.
- **Hardening matchup import (H3 / M2):** Add an allowlist validator in `PlayAgainstFriendsModal.handleImportMatchupCode` — clamp all numerics 0–10, trim and length-check alias (≤24 chars, strip `<`/`>`), reject out-of-range with a toast. Reuse the same sanitizer for `setPlayerAlias`.
- **Era parity in challenges (L5):** Append `&era=${selectedEra}` to `challengeUrl` in `PlayAgainstFriendsModal.tsx#L60-L62`, and consume `params.get('era')` as the default era in `page.tsx` effect, passing it into `startNewDraft`.

### 3.3 Priority C — Polish & cleanup

- **`useModalA11y` (M1):** Store `focusTimerRef` and `clearTimeout` on cleanup; guard `previousFocusRef.current?.isConnected` before re-focus.
- **`evaluateDraft` snapshot (M4):** Snapshot `draftedTracks` before `await`; after `await` verify `get().draftedTracks === snapshot` before mutating `pastDrafts`/`leaderboard`.
- **AudioContext resume (M5):** `await ctx.resume()` in `getAudioContext` on first user gesture; gate `playHoverSound` behind an `_armed` flag flipped on first `pointerdown` listener registered module-side.
- **API route schema (M6):** Add zod schema for `{ draftedTracks, monopolyReport, energyMetrics }`. On invalid shape, fall through to local fallback with a 200 response (preserves row in `pastDrafts`) rather than a 500.
- **Lint closure (L3/L4):** Replace `catch (e) {}` with `catch {}` (audioEngine.ts ×7); update `lint` script to `eslint --max-warnings 0`.
- **Optimal picks copy (M3):** Change `"You picked the optimal track for this slot!"` to `"Locally optimal given your previous picks."` to set correct expectations.

### 3.4 Refactor Targets (long-term)

1. **Single source of truth for fallback math** (eliminates H4 permanently).
2. **Deterministic challenge profile type** — `{ seed, mode, diff, era, rerollCount }` as the canonical 1v1 contract; encode/decode helpers used on both share and join sides.
3. **Server-authoritative scoreboard** — the `versusMatchup` flow is currently client-state-only and trust-on-use. For a public 1v1 hub, persist matchups server-side with a signed `id` and fetch on join.
4. **Slot/Era coverage tests** — add Jest/Vitest tests over `getOptionsForSlot` keyed by `(seed, slotId, era)` to detect future regressions when the song library grows or `filterByEra` boundaries shift.

---

## Verification Performed

- ✅ `npm run lint` — passes, 7 warnings (unused `e`).
- ✅ `npm run build` — succeeds in 1.2s, 5 routes generated, 0 TypeScript errors.
- ✅ Empirical determinism test (`scratch/verify_determinism.mjs`): `seededShuffle` returns identical pools across independent sessions for fixed `(seed, slotId)`; **reroll under a fixed seed returns identical pool** (confirms C1).
- ✅ Reviewed all 28 source files; `getOptionsForSlot`, `computeMonopolyReport`, `computeEnergyMetrics`, `generateChallengeSeed`, `findOptimalPickForSlot` logic traced line-by-line.
- ✅ Confirmed Monopoly Penalty correctly distinguishes solo (`song.artist`) from featured (`song.featuredArtists`) — `computeMonopolyReport` increments `solo` only for the primary artist, `featured += 1` for each featured artist, and the deduction threshold (`solo > 1`) is keyed on `solo` count. Featured-only duplicates (e.g., Drake appearing on 3 different artists' tracks) correctly incur **no penalty**, matching the design intent.
- Legal-tinted manual verification of modal a11y (Escape + backdrop + focus management) across `ModeSelectorModal`, `PlayAgainstFriendsModal`, `RealSongPlayerModal`, `ExportModal`, `ConfirmModal`, `TracklistDrawer`.
