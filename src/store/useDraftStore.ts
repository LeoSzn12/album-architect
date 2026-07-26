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
  CandidateRound,
} from '@/types/draft';
import { EP_SLOTS, ALBUM_SLOTS } from '@/data/slots';
import { getOptionsForSlot } from '@/data/songs';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';
import { generateEraSequence } from '@/lib/eraSequence';
import { computeMonopolyReport, computeEnergyMetrics } from '@/lib/draftMetrics';

/**
 * Current persisted-state schema version. Bump on any breaking shape change.
 *   v1 → v2: added rerollCount; removed slots & currentOptions from partialize.
 *   v2 → v3: added eraSequence, candidateHistory; replaced subScores shape
 *             (pacing/synergy/cohesion/starPower → slotFit/albumFlow/cohesion/impact).
 */
const PERSIST_VERSION = 3;

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
   * Per-draft monotonically-increasing reroll counter. Baked into seed-tag
   * so successive rerolls produce distinct shuffles while remaining 100%
   * reproducible for a given (seed, slot, rerollIndex) tuple. Fixes audit C1.
   */
  rerollCount: number;
  /**
   * Auto-assigned era per slot. Derived from slot defaultEra + seed.
   * Both players using the same seed receive the same era sequence.
   */
  eraSequence: EraFilter[];
  /**
   * Full record of every candidate pool shown to the player (initial + rerolls).
   * Used by the best-possible optimizer at the end of the draft.
   */
  candidateHistory: CandidateRound[];
  selectedEra: EraFilter; // kept for settings/display only; drafting uses eraSequence
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
  /** Fully dismiss the music dock — clears selectedRealSong and closes modal. */
  closeMusicPlayer: () => void;
  playNextDraftedTrack: () => void;
  playPrevDraftedTrack: () => void;
  evaluateDraft: () => Promise<EvaluationResult>;
  clearHistory: () => void;
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  clearLeaderboard: () => void;
  setVersusMatchup: (matchup: VersusMatchup | null) => void;
}

const EMPTY_MONOPOLY: MonopolyReport = {
  artistCounts: {},
  penalizedArtists: [],
  totalPenaltyDeduction: 0,
  hasViolation: false,
};

const EMPTY_ENERGY: EnergyMetrics = {
  curve: [],
  avgEnergy: 0,
  fatigueScore: 0,
  status: 'Optimal Pacing',
  bpmTransitions: [],
};

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
      currentOptions: getOptionsForSlot(EP_SLOTS[0].id, 4, EP_SLOTS[0].defaultEra, null),
      rerollTokens: 2,
      rerollCount: 0,
      eraSequence: generateEraSequence(EP_SLOTS, null),
      candidateHistory: [],
      selectedEra: 'all',
      monopolyReport: EMPTY_MONOPOLY,
      energyMetrics: EMPTY_ENERGY,
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
        // Only updates display preference — drafting always uses eraSequence
        set({ selectedEra: era });
      },

      startNewDraft: (
        mode?: GameMode,
        era?: EraFilter,
        diff?: DifficultyTier,
        seed?: string | null
      ) => {
        const newMode = mode ?? get().gameMode;
        const newEra  = era  ?? get().selectedEra;
        const newDiff = diff ?? get().difficulty;
        const newSeed = seed !== undefined ? seed : get().draftSeed;
        const slots   = newMode === 'ep' ? EP_SLOTS : ALBUM_SLOTS;

        let tokens = newMode === 'ep' ? 2 : 3;
        if (newDiff === 'veteran' || newDiff === 'hardcore') tokens = 1;

        const eraSequence = generateEraSequence(slots, newSeed);
        const slot0Era    = eraSequence[0];
        const initialOptions = getOptionsForSlot(slots[0].id, 4, slot0Era, newSeed);

        // Record the initial candidate pool for round 0
        const initialHistory: CandidateRound[] = [{
          roundIndex: 0,
          slotId: slots[0].id,
          assignedEra: slot0Era,
          pools: [initialOptions],
        }];

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
          eraSequence,
          candidateHistory: initialHistory,
          monopolyReport: EMPTY_MONOPOLY,
          energyMetrics: EMPTY_ENERGY,
          evaluationResult: null,
          isEvaluating: false,
          activePlayingSongId: null,
          selectedRealSong: null,
          isPlayerModalOpen: false,
        });
      },

      draftSong: (song: Song, isWildcard = false) => {
        const {
          slots, currentRoundIndex, draftedTracks,
          eraSequence, draftSeed, candidateHistory,
        } = get();
        if (currentRoundIndex >= slots.length) return;

        const currentSlot   = slots[currentRoundIndex];
        const newDraftedTrack: DraftedTrack = {
          slot: currentSlot,
          song,
          roundDrafted: currentRoundIndex + 1,
          isWildcard,
        };

        const updatedDrafted   = [...draftedTracks, newDraftedTrack];
        const nextRoundIndex   = currentRoundIndex + 1;
        const monopolyReport   = computeMonopolyReport(updatedDrafted);
        const energyMetrics    = computeEnergyMetrics(updatedDrafted);

        let nextOptions: Song[] = [];
        let updatedHistory      = candidateHistory;

        if (nextRoundIndex < slots.length) {
          const nextSlot  = slots[nextRoundIndex];
          const nextEra   = eraSequence[nextRoundIndex] ?? 'all';
          nextOptions     = getOptionsForSlot(nextSlot.id, 4, nextEra, draftSeed);

          // Record the initial pool for the next round
          updatedHistory = [
            ...candidateHistory,
            {
              roundIndex: nextRoundIndex,
              slotId: nextSlot.id,
              assignedEra: nextEra,
              pools: [nextOptions],
            },
          ];
        }

        set({
          currentRoundIndex: nextRoundIndex,
          draftedTracks: updatedDrafted,
          currentOptions: nextOptions,
          monopolyReport,
          energyMetrics,
          candidateHistory: updatedHistory,
        });
      },

      undoLastPick: () => {
        const { draftedTracks, slots, eraSequence, draftSeed, candidateHistory } = get();
        if (draftedTracks.length === 0) return false;

        const updatedDrafted  = draftedTracks.slice(0, -1);
        const prevRoundIndex  = updatedDrafted.length;
        const prevSlot        = slots[prevRoundIndex];
        const prevEra         = eraSequence[prevRoundIndex] ?? 'all';
        const restoredOptions = getOptionsForSlot(prevSlot.id, 4, prevEra, draftSeed);

        const monopolyReport  = computeMonopolyReport(updatedDrafted);
        const energyMetrics   = computeEnergyMetrics(updatedDrafted);

        // Remove the last round's history entry on undo
        const trimmedHistory  = candidateHistory.slice(0, prevRoundIndex + 1);

        set({
          currentRoundIndex: prevRoundIndex,
          draftedTracks: updatedDrafted,
          currentOptions: restoredOptions,
          monopolyReport,
          energyMetrics,
          evaluationResult: null,
          candidateHistory: trimmedHistory,
        });

        return true;
      },

      useRerollToken: () => {
        const {
          rerollTokens, slots, currentRoundIndex, eraSequence,
          draftSeed, rerollCount, candidateHistory,
        } = get();
        if (rerollTokens <= 0 || currentRoundIndex >= slots.length) return false;

        const currentSlot = slots[currentRoundIndex];
        const currentEra  = eraSequence[currentRoundIndex] ?? 'all';

        // Bake the reroll counter into the seed-tag so each successive reroll
        // produces a new shuffle while preserving 1v1 parity. Fixes audit C1.
        const seededTag   = draftSeed ? `${draftSeed}#R${rerollCount + 1}` : null;
        const freshOptions = getOptionsForSlot(currentSlot.id, 4, currentEra, seededTag);

        // Append the rerolled pool to the current round's history
        const updatedHistory = candidateHistory.map((round, idx) =>
          idx === currentRoundIndex
            ? { ...round, pools: [...round.pools, freshOptions] }
            : round
        );

        set({
          rerollTokens: rerollTokens - 1,
          rerollCount: rerollCount + 1,
          currentOptions: freshOptions,
          candidateHistory: updatedHistory,
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
        // Closes the full modal but leaves the dock visible
        set({ isPlayerModalOpen: false });
      },

      closeMusicPlayer: () => {
        // Fully dismisses the dock and clears the song selection
        set({ selectedRealSong: null, isPlayerModalOpen: false });
      },

      playNextDraftedTrack: () => {
        const { selectedRealSong, draftedTracks } = get();
        if (!selectedRealSong || draftedTracks.length === 0) return;
        const currentIndex = draftedTracks.findIndex((t) => t.song.id === selectedRealSong.id);
        if (currentIndex >= 0 && currentIndex < draftedTracks.length - 1) {
          set({ selectedRealSong: draftedTracks[currentIndex + 1].song });
        } else if (currentIndex === -1) {
          set({ selectedRealSong: draftedTracks[0].song });
        }
      },

      playPrevDraftedTrack: () => {
        const { selectedRealSong, draftedTracks } = get();
        if (!selectedRealSong || draftedTracks.length === 0) return;
        const currentIndex = draftedTracks.findIndex((t) => t.song.id === selectedRealSong.id);
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
          eraSequence,
        } = get();

        // Snapshot draftedTracks BEFORE the await so we can detect if the user
        // starts a new draft while the request is in flight. Fixes audit M4.
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
              candidateHistory: get().candidateHistory, // for server-side optimizer
              eraSequence,
              selectedEra,
            }),
          });

          if (!response.ok) {
            throw new Error(`Evaluation failed with status ${response.status}`);
          }

          const parsed = (await response.json()) as EvaluationResult;
          // Preserve the source returned by the API; do NOT force 'gemini'.
          result = parsed;
        } catch (err) {
          console.warn('API Evaluation error, falling back to local evaluation:', err);
          result = generateFallbackEvaluation(
            gameMode,
            draftedTracksSnapshot,
            monopolyReport,
            energyMetrics,
            selectedEra
          );
        }

        // Race guard: if draftedTracks changed during the await, drop stale result. Audit M4.
        if (get().draftedTracks !== draftedTracksSnapshot) {
          set({ isEvaluating: false });
          return result;
        }

        const { pastDrafts, leaderboard } = get();

        const dateStr = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

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
          .slice(0, 50);

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
       * Schema migrations. Each branch brings persisted state up to PERSIST_VERSION.
       * v1→v2: added rerollCount; recomputed slots+currentOptions.
       * v2→v3: added eraSequence, candidateHistory; updated subScores shape.
       */
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<DraftStoreState>;

        if (version < 2) {
          if (persisted.rerollCount === undefined) persisted.rerollCount = 0;
          const mode  = persisted.gameMode ?? 'ep';
          const slots = mode === 'album' ? ALBUM_SLOTS : EP_SLOTS;
          persisted.slots = slots;
        }

        if (version < 3) {
          const mode  = persisted.gameMode ?? 'ep';
          const slots = mode === 'album' ? ALBUM_SLOTS : EP_SLOTS;
          const seed  = persisted.draftSeed ?? null;
          persisted.eraSequence     = generateEraSequence(slots, seed);
          persisted.candidateHistory = [];
          // Recompute currentOptions using the new era sequence
          const roundIdx = persisted.currentRoundIndex ?? 0;
          const slotIdx  = Math.min(roundIdx, slots.length - 1);
          const slot     = slots[slotIdx];
          const era      = persisted.eraSequence[slotIdx] ?? 'all';
          persisted.currentOptions  = getOptionsForSlot(slot.id, 4, era, seed);
          // Reset subScores to new shape if present (old shape had pacing/synergy)
          if (persisted.evaluationResult && 'pacing' in (persisted.evaluationResult.subScores ?? {})) {
            persisted.evaluationResult = null;
          }
        }

        return persisted;
      },
      /**
       * Persist the minimum required. currentOptions and slots are recomputed
       * on hydration. Prevents stale shuffle snapshots across algorithm changes.
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
        eraSequence: state.eraSequence,
        candidateHistory: state.candidateHistory,
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
