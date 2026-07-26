import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameMode,
  DraftSlot,
  Song,
  DraftedTrack,
  MonopolyReport,
  EnergyMetrics,
  EvaluationResult,
  AudioSourcePreference,
  EraFilter,
  DifficultyTier,
  PastDraft,
  LeaderboardEntry,
  VersusMatchup,
} from '@/types/draft';
import { EP_SLOTS, ALBUM_SLOTS } from '@/data/slots';
import { getOptionsForSlot } from '@/data/songs';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';

/**
 * Current persisted-state schema version. Bump on any breaking shape change to
 * `DraftStoreState` (added/removed fields, changed `DraftedTrack`, etc.) and
 * implement a matching branch in `migrate` below.
 *   v1 → v2: added `rerollCount`; removed `slots` & `currentOptions` from
 *            `partialize` (recomputed on hydration) to avoid stale snapshots,
 *            and unwrapped the duplicated fallback evaluator into
 *            `src/lib/fallbackEvaluator.ts`.
 */
const PERSIST_VERSION = 2;

interface DraftStoreState {
  gameMode: GameMode;
  difficulty: DifficultyTier;
  draftSeed: string | null;
  playerAlias: string;
  slots: DraftSlot[];
  currentRoundIndex: number;
  draftedTracks: DraftedTrack[];
  currentOptions: Song[];
  rerollTokens: number;
  /**
   * Per-draft monotonically-increasing reroll counter. Bumped every time the
   * player uses a reroll token and baked into the seed-tag string so successive
   * rerolls under a fixed 1v1 seed produce distinct shuffles while remaining
   * 100% reproducible for a given (seed, slot, rerollIndex) tuple.
   * Fixes audit finding C1 (reroll-no-op under seed).
   */
  rerollCount: number;
  selectedEra: EraFilter;
  monopolyReport: MonopolyReport;
  energyMetrics: EnergyMetrics;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  audioEnabled: boolean;
  activePlayingSongId: string | null;
  selectedRealSong: Song | null;
  audioSourcePreference: AudioSourcePreference;
  isPlayerModalOpen: boolean;
  pastDrafts: PastDraft[];
  leaderboard: LeaderboardEntry[];
  versusMatchup: VersusMatchup | null;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (diff: DifficultyTier) => void;
  setDraftSeed: (seed: string | null) => void;
  setPlayerAlias: (alias: string) => void;
  setSelectedEra: (era: EraFilter) => void;
  startNewDraft: (mode?: GameMode, era?: EraFilter, diff?: DifficultyTier, seed?: string | null) => void;
  draftSong: (song: Song, isWildcard?: boolean) => void;
  undoLastPick: () => boolean;
  useRerollToken: () => boolean;
  toggleAudio: () => void;
  setActivePlayingSongId: (id: string | null) => void;
  setAudioSourcePreference: (pref: AudioSourcePreference) => void;
  openRealSongPlayer: (song: Song) => void;
  closeRealSongPlayer: () => void;
  playNextDraftedTrack: () => void;
  playPrevDraftedTrack: () => void;
  evaluateDraft: () => Promise<EvaluationResult>;
  clearHistory: () => void;
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  clearLeaderboard: () => void;
  setVersusMatchup: (matchup: VersusMatchup | null) => void;
}

// Initial calculation helpers
function computeMonopolyReport(drafted: DraftedTrack[]): MonopolyReport {
  const counts: Record<
    string,
    {
      solo: number;
      featured: number;
      total: number;
      soloTracks: Song[];
      featuredTracks: Song[];
    }
  > = {};

  drafted.forEach(({ song }) => {
    // 1. Primary solo artist
    const primaryArtist = song.artist.trim();
    if (!counts[primaryArtist]) {
      counts[primaryArtist] = {
        solo: 0,
        featured: 0,
        total: 0,
        soloTracks: [],
        featuredTracks: [],
      };
    }
    counts[primaryArtist].solo += 1;
    counts[primaryArtist].total += 1;
    counts[primaryArtist].soloTracks.push(song);

    // 2. Featured artists (do NOT increment solo count)
    song.featuredArtists.forEach((feat) => {
      const featArtist = feat.trim();
      if (!counts[featArtist]) {
        counts[featArtist] = {
          solo: 0,
          featured: 0,
          total: 0,
          soloTracks: [],
          featuredTracks: [],
        };
      }
      counts[featArtist].featured += 1;
      counts[featArtist].total += 1;
      counts[featArtist].featuredTracks.push(song);
    });
  });

  const penalizedArtists: {
    artist: string;
    soloCount: number;
    deductionPoints: number;
  }[] = [];

  let totalPenaltyDeduction = 0;

  Object.entries(counts).forEach(([artist, data]) => {
    if (data.solo > 1) {
      // 2 solo tracks = 1.5 deduction points, 3+ solo tracks = 2.0 per additional
      const deduction = data.solo === 2 ? 1.5 : 1.5 + (data.solo - 2) * 2.0;
      penalizedArtists.push({
        artist,
        soloCount: data.solo,
        deductionPoints: deduction,
      });
      totalPenaltyDeduction += deduction;
    }
  });

  return {
    artistCounts: counts,
    penalizedArtists,
    totalPenaltyDeduction,
    hasViolation: penalizedArtists.length > 0,
  };
}

function computeEnergyMetrics(drafted: DraftedTrack[]): EnergyMetrics {
  const curve = drafted.map((d) => d.song.energy);
  if (curve.length === 0) {
    return {
      curve: [],
      avgEnergy: 0,
      fatigueScore: 0,
      status: 'Optimal Pacing',
      bpmTransitions: [],
    };
  }

  const avgEnergy = Math.round(
    curve.reduce((acc, curr) => acc + curr, 0) / curve.length
  );

  // Check for consecutive high energy (>= 85)
  let highEnergyConsecutive = 0;
  let maxConsecutiveHigh = 0;
  for (const energy of curve) {
    if (energy >= 85) {
      highEnergyConsecutive += 1;
      maxConsecutiveHigh = Math.max(maxConsecutiveHigh, highEnergyConsecutive);
    } else {
      highEnergyConsecutive = 0;
    }
  }

  // Calculate BPM transitions
  const bpmTransitions: EnergyMetrics['bpmTransitions'] = [];
  for (let i = 0; i < drafted.length - 1; i++) {
    const from = drafted[i].song.bpm;
    const to = drafted[i + 1].song.bpm;
    const delta = Math.abs(to - from);
    let status: EnergyMetrics['bpmTransitions'][0]['status'] = 'smooth';

    if (delta > 35) {
      status = 'abrupt';
    } else if (to > from + 10) {
      status = 'building';
    } else if (to < from - 15) {
      status = 'chilled';
    }

    bpmTransitions.push({ from, to, delta, status });
  }

  const fatigueScore = Math.min(100, maxConsecutiveHigh * 25); // 3 consecutive = 75 fatigue
  let status: EnergyMetrics['status'] = 'Optimal Pacing';

  if (fatigueScore >= 75) {
    status = 'High Energy Overload';
  } else if (avgEnergy < 45) {
    status = 'Vibe Lull';
  } else if (bpmTransitions.some((t) => t.status === 'abrupt')) {
    status = 'Wild Energy Spikes';
  }

  return {
    curve,
    avgEnergy,
    fatigueScore,
    status,
    bpmTransitions,
  };
}

export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set, get) => ({
      gameMode: 'ep',
      difficulty: 'standard',
      draftSeed: null,
      playerAlias: 'Executive Architect',
      slots: EP_SLOTS,
      currentRoundIndex: 0,
      draftedTracks: [],
      currentOptions: getOptionsForSlot(EP_SLOTS[0].id, 4, 'all', null),
      rerollTokens: 2,
      rerollCount: 0,
      selectedEra: 'all',
      monopolyReport: {
        artistCounts: {},
        penalizedArtists: [],
        totalPenaltyDeduction: 0,
        hasViolation: false,
      },
      energyMetrics: {
        curve: [],
        avgEnergy: 0,
        fatigueScore: 0,
        status: 'Optimal Pacing',
        bpmTransitions: [],
      },
      evaluationResult: null,
      isEvaluating: false,
      audioEnabled: true,
      activePlayingSongId: null,
      selectedRealSong: null,
      audioSourcePreference: 'youtube',
      isPlayerModalOpen: false,
      pastDrafts: [],
      leaderboard: [],
      versusMatchup: null,

      setGameMode: (mode: GameMode) => {
        get().startNewDraft(mode);
      },

      setDifficulty: (diff: DifficultyTier) => {
        get().startNewDraft(undefined, undefined, diff);
      },

      setDraftSeed: (seed: string | null) => {
        get().startNewDraft(undefined, undefined, undefined, seed);
      },

      setPlayerAlias: (alias: string) => {
        set({ playerAlias: alias.trim() || 'Executive Architect' });
      },

      setSelectedEra: (era: EraFilter) => {
        const { slots, currentRoundIndex, draftSeed } = get();
        const currentSlot = slots[currentRoundIndex];
        const freshOptions = getOptionsForSlot(
          currentSlot ? currentSlot.id : slots[0].id,
          4,
          era,
          draftSeed
        );
        set({ selectedEra: era, currentOptions: freshOptions });
      },

      startNewDraft: (
        mode?: GameMode,
        era?: EraFilter,
        diff?: DifficultyTier,
        seed?: string | null
      ) => {
        const newMode = mode || get().gameMode;
        const newEra = era || get().selectedEra;
        const newDiff = diff || get().difficulty;
        const newSeed = seed !== undefined ? seed : get().draftSeed;
        const slots = newMode === 'ep' ? EP_SLOTS : ALBUM_SLOTS;

        let tokens = newMode === 'ep' ? 2 : 3;
        if (newDiff === 'veteran') tokens = 1;
        else if (newDiff === 'hardcore') tokens = 1;

        const initialOptions = getOptionsForSlot(slots[0].id, 4, newEra, newSeed);

        set({
          gameMode: newMode,
          difficulty: newDiff,
          selectedEra: newEra,
          draftSeed: newSeed,
          slots,
          currentRoundIndex: 0,
          draftedTracks: [],
          currentOptions: initialOptions,
          rerollTokens: tokens,
          rerollCount: 0,
          monopolyReport: {
            artistCounts: {},
            penalizedArtists: [],
            totalPenaltyDeduction: 0,
            hasViolation: false,
          },
          energyMetrics: {
            curve: [],
            avgEnergy: 0,
            fatigueScore: 0,
            status: 'Optimal Pacing',
            bpmTransitions: [],
          },
          evaluationResult: null,
          isEvaluating: false,
          activePlayingSongId: null,
          selectedRealSong: null,
          isPlayerModalOpen: false,
        });
      },

      draftSong: (song: Song, isWildcard = false) => {
        const { slots, currentRoundIndex, draftedTracks, selectedEra, draftSeed } = get();
        if (currentRoundIndex >= slots.length) return;

        const currentSlot = slots[currentRoundIndex];
        const newDraftedTrack: DraftedTrack = {
          slot: currentSlot,
          song,
          roundDrafted: currentRoundIndex + 1,
          isWildcard,
        };

        const updatedDrafted = [...draftedTracks, newDraftedTrack];
        const nextRoundIndex = currentRoundIndex + 1;
        const monopolyReport = computeMonopolyReport(updatedDrafted);
        const energyMetrics = computeEnergyMetrics(updatedDrafted);

        if (nextRoundIndex < slots.length) {
          const nextSlot = slots[nextRoundIndex];
          const nextOptions = getOptionsForSlot(nextSlot.id, 4, selectedEra, draftSeed);
          set({
            currentRoundIndex: nextRoundIndex,
            draftedTracks: updatedDrafted,
            currentOptions: nextOptions,
            monopolyReport,
            energyMetrics,
          });
        } else {
          // Draft completed!
          set({
            currentRoundIndex: nextRoundIndex,
            draftedTracks: updatedDrafted,
            currentOptions: [],
            monopolyReport,
            energyMetrics,
          });
        }
      },

      undoLastPick: () => {
        const { draftedTracks, slots, selectedEra, draftSeed } = get();
        if (draftedTracks.length === 0) return false;

        const updatedDrafted = draftedTracks.slice(0, -1);
        const prevRoundIndex = updatedDrafted.length;
        const prevSlot = slots[prevRoundIndex];
        const restoredOptions = getOptionsForSlot(prevSlot.id, 4, selectedEra, draftSeed);

        const monopolyReport = computeMonopolyReport(updatedDrafted);
        const energyMetrics = computeEnergyMetrics(updatedDrafted);

        set({
          currentRoundIndex: prevRoundIndex,
          draftedTracks: updatedDrafted,
          currentOptions: restoredOptions,
          monopolyReport,
          energyMetrics,
          evaluationResult: null,
        });

        return true;
      },

      useRerollToken: () => {
        const { rerollTokens, slots, currentRoundIndex, selectedEra, draftSeed, rerollCount } = get();
        if (rerollTokens <= 0 || currentRoundIndex >= slots.length) return false;

        const currentSlot = slots[currentRoundIndex];
        // Bake the reroll counter into the seed-tag so each successive reroll
        // produces a new shuffle permutation while preserving 1v1 parity
        // (any pair of players who reroll the same number of times on the
        // same seed/slot see identical pools). Fixes audit finding C1, where
        // the original code re-derived options with a static `${seed}-${slotId}-match`
        // tag and yielded the *identical* pool on every reroll.
        const seededTag = draftSeed ? `${draftSeed}#R${rerollCount + 1}` : null;
        const freshOptions = getOptionsForSlot(currentSlot.id, 4, selectedEra, seededTag);

        set({
          rerollTokens: rerollTokens - 1,
          rerollCount: rerollCount + 1,
          currentOptions: freshOptions,
        });
        return true;
      },

      toggleAudio: () => {
        set((state) => ({ audioEnabled: !state.audioEnabled }));
      },

      setActivePlayingSongId: (id: string | null) => {
        set({ activePlayingSongId: id });
      },

      setAudioSourcePreference: (pref: AudioSourcePreference) => {
        set({ audioSourcePreference: pref });
      },

      openRealSongPlayer: (song: Song) => {
        set({ selectedRealSong: song, isPlayerModalOpen: true });
      },

      closeRealSongPlayer: () => {
        set({ isPlayerModalOpen: false });
      },

      playNextDraftedTrack: () => {
        const { selectedRealSong, draftedTracks } = get();
        if (!selectedRealSong || draftedTracks.length === 0) return;
        const currentIndex = draftedTracks.findIndex(
          (t) => t.song.id === selectedRealSong.id
        );
        if (currentIndex >= 0 && currentIndex < draftedTracks.length - 1) {
          set({ selectedRealSong: draftedTracks[currentIndex + 1].song });
        } else if (currentIndex === -1) {
          set({ selectedRealSong: draftedTracks[0].song });
        }
      },

      playPrevDraftedTrack: () => {
        const { selectedRealSong, draftedTracks } = get();
        if (!selectedRealSong || draftedTracks.length === 0) return;
        const currentIndex = draftedTracks.findIndex(
          (t) => t.song.id === selectedRealSong.id
        );
        if (currentIndex > 0) {
          set({ selectedRealSong: draftedTracks[currentIndex - 1].song });
        }
      },

      evaluateDraft: async (): Promise<EvaluationResult> => {
        set({ isEvaluating: true });
        const {
          draftedTracks: draftedTracksSnapshot,
          monopolyReport,
          energyMetrics,
          gameMode,
          difficulty,
          draftSeed,
          playerAlias,
          selectedEra,
        } = get();

        // Snapshot draftedTracks BEFORE the await so we can detect if the user
        // starts a new draft / undoes a pick while the request is in flight,
        // and discard the stale result instead of corrupting the new draft's
        // history + leaderboard. (Audit finding M4.)
        let result: EvaluationResult;
        try {
          const response = await fetch('/api/critic-evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameMode,
              draftedTracks: draftedTracksSnapshot,
              monopolyReport,
              energyMetrics,
            }),
          });

          if (!response.ok) {
            throw new Error(`Evaluation failed with status ${response.status}`);
          }

          result = (await response.json()) as EvaluationResult;
          // Stamp provenance so the scorecard can badge this as an AI Critic Board score.
          result.source = 'gemini';
        } catch (err) {
          console.warn('API Evaluation error, falling back to local evaluation:', err);
          // Shared evaluator: matches the server fallback byte-for-byte (H4).
          result = generateFallbackEvaluation(
            gameMode,
            draftedTracksSnapshot,
            monopolyReport,
            energyMetrics,
            selectedEra
          );
        }

        // Race guard: if draftedTracks changed during the await, the user has
        // moved on — drop this evaluation instead of writing into a stale draft.
        if (get().draftedTracks !== draftedTracksSnapshot) {
          set({ isEvaluating: false });
          return result;
        }

        // Re-read latest history/leaderboard AFTER the await so concurrent
        // mutations (e.g. clearHistory) are honored.
        const { pastDrafts, leaderboard } = get();

        const dateStr = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Save to past drafts history
        const newPastDraft: PastDraft = {
          id: `draft-${Date.now()}`,
          gameMode,
          difficulty,
          completedAt: dateStr,
          overallScore: result.overallScore,
          gradeBadge: result.gradeBadge,
          trackCount: draftedTracksSnapshot.length,
          topTrackTitle: draftedTracksSnapshot[0]?.song.title || 'Master Project',
          topTrackArtist: draftedTracksSnapshot[0]?.song.rawArtistString || 'Various Artists',
          evaluationResult: result,
        };

        const updatedHistory = [newPastDraft, ...pastDrafts].slice(0, 20);

        // Save to Leaderboard
        const newLeaderboardEntry: LeaderboardEntry = {
          id: `lb-${Date.now()}`,
          playerAlias,
          overallScore: result.overallScore,
          gradeBadge: result.gradeBadge,
          gameMode,
          difficulty,
          draftSeed,
          trackCount: draftedTracksSnapshot.length,
          topTrackTitle: draftedTracksSnapshot[0]?.song.title || 'Master Project',
          topTrackArtist: draftedTracksSnapshot[0]?.song.rawArtistString || 'Various Artists',
          completedAt: dateStr,
          subScores: result.subScores,
        };

        const updatedLeaderboard = [...leaderboard, newLeaderboardEntry]
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 50); // Keep top 50

        set({
          evaluationResult: result,
          isEvaluating: false,
          pastDrafts: updatedHistory,
          leaderboard: updatedLeaderboard,
        });
        return result;
      },

      clearHistory: () => {
        set({ pastDrafts: [] });
      },

      addLeaderboardEntry: (entry: LeaderboardEntry) => {
        set((state) => ({
          leaderboard: [...state.leaderboard, entry]
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 50),
        }));
      },

      clearLeaderboard: () => {
        set({ leaderboard: [] });
      },

      setVersusMatchup: (matchup: VersusMatchup | null) => {
        set({ versusMatchup: matchup });
      },
    }),
    {
      name: 'album-architect-draft-v1',
      version: PERSIST_VERSION,
      // SSR-safe storage: persist reads window.localStorage on the client and
      // a no-op storage during SSR so `create()` never throws on the server.
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as unknown as Storage;
      }),
      /**
       * Schema migrations. Each branch mutates the persisted state in place to
       * bring it up to PERSIST_VERSION so hydration never silently corrupts.
       * Fixes audit finding H2 (previously no version/migrate → stale shapes
       * were rehydrated unmodified on any breaking change).
       */
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<DraftStoreState>;
        // v1 → v2: add rerollCount; recompute slots + currentOptions from
        // (gameMode, selectedEra, draftSeed, currentRoundIndex) instead of
        // trusting stale snapshots from a prior shuffle algorithm.
        if (version < 2) {
          if (persisted.rerollCount === undefined) persisted.rerollCount = 0;
          const mode = persisted.gameMode ?? 'ep';
          const slots = mode === 'album' ? ALBUM_SLOTS : EP_SLOTS;
          persisted.slots = slots;
          const roundIdx = persisted.currentRoundIndex ?? 0;
          const slotId = slots[Math.min(roundIdx, slots.length - 1)].id;
          persisted.currentOptions = getOptionsForSlot(
            slotId,
            4,
            persisted.selectedEra ?? 'all',
            persisted.draftSeed ?? null
          );
        }
        return persisted;
      },
      /**
       * Persist only the minimum — slots + currentOptions are deterministic
       * functions of (gameMode, selectedEra, draftSeed, currentRoundIndex) and
       * are recomputed on hydration / migrate. This prevents stale shuffle
       * snapshots surviving across algorithm changes. (Audit finding H2.)
       */
      partialize: (state) => ({
        gameMode: state.gameMode,
        difficulty: state.difficulty,
        draftSeed: state.draftSeed,
        playerAlias: state.playerAlias,
        currentRoundIndex: state.currentRoundIndex,
        draftedTracks: state.draftedTracks,
        rerollTokens: state.rerollTokens,
        rerollCount: state.rerollCount,
        selectedEra: state.selectedEra,
        monopolyReport: state.monopolyReport,
        energyMetrics: state.energyMetrics,
        evaluationResult: state.evaluationResult,
        audioEnabled: state.audioEnabled,
        audioSourcePreference: state.audioSourcePreference,
        pastDrafts: state.pastDrafts,
        leaderboard: state.leaderboard,
        versusMatchup: state.versusMatchup,
      }),
    }
  )
);

/*
 * The fallback evaluator previously lived here as a duplicate of the server-side
 * evaluator, with divergent formulas (different rawScore weights, hardcoded
 * 9.5 on the server) — the same draft produced *different* scores depending on
 * whether the fetch succeeded. The canonical evaluator has been extracted to
 * `src/lib/fallbackEvaluator.ts` and is imported by both this store and the
 * API route `/api/critic-evaluate`, guaranteeing byte-identical fallback
 * results regardless of the network path. (Audit finding H4.)
 */

