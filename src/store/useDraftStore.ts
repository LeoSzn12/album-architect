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
  OpponentReveal,
  SlotId,
} from '@/types/draft';
import { DRAFT_SLOTS, EP_SLOTS, ALBUM_SLOTS } from '@/data/slots';
import { getOptionsForSlot } from '@/data/songs';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';
import { generateEraSequence } from '@/lib/eraSequence';
import { computeMonopolyReport, computeEnergyMetrics } from '@/lib/draftMetrics';

/**
 * Current persisted-state schema version. Bump on any breaking shape change.
 *   v1 → v2: added rerollCount; removed slots & currentOptions from partialize.
 *   v2 → v3: added eraSequence, candidateHistory; replaced subScores shape
 *             (pacing/synergy/cohesion/starPower → slotFit/albumFlow/cohesion/impact).
 *   v3 → v4: added explicit Draft opponent state and transparent scorecard fields.
 */
const PERSIST_VERSION = 4;

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
  rerollCount: number;
  eraSequence: EraFilter[];
  candidateHistory: CandidateRound[];
  selectedEra: EraFilter;
  recentlyShownSongIds: string[];
  recentlyShownArtists: string[];
  soloDraftNonce: number;
  monopolyReport: MonopolyReport;
  energyMetrics: EnergyMetrics;
  evaluationResult: EvaluationResult | null;
  opponentEvaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  audioEnabled: boolean;
  activePlayingSongId: string | null;
  selectedRealSong: Song | null;
  audioSourcePreference: AudioSourcePreference;
  isPlayerModalOpen: boolean;
  pastDrafts: PastDraft[];
  leaderboard: LeaderboardEntry[];
  versusMatchup: VersusMatchup | null;
  opponentDraftedTracks: DraftedTrack[];
  lastOpponentReveal: OpponentReveal | null;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (diff: DifficultyTier) => void;
  setDraftSeed: (seed: string | null) => void;
  setPlayerAlias: (alias: string) => void;
  setSelectedEra: (era: EraFilter) => void;
  fetchOptions: (slotId: SlotId, era: EraFilter, seed: string | null, rerollIndex?: number) => Song[];
  startNewDraft: (mode?: GameMode, era?: EraFilter, diff?: DifficultyTier, seed?: string | null) => void;
  draftSong: (song: Song, isWildcard?: boolean) => void;
  undoLastPick: () => boolean;
  useRerollToken: () => boolean;
  toggleAudio: () => void;
  setActivePlayingSongId: (id: string | null) => void;
  setAudioSourcePreference: (pref: AudioSourcePreference) => void;
  openRealSongPlayer: (song: Song) => void;
  closeRealSongPlayer: () => void;
  closeMusicPlayer: () => void;
  playNextDraftedTrack: () => void;
  playPrevDraftedTrack: () => void;
  evaluateDraft: () => Promise<EvaluationResult>;
  clearHistory: () => void;
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  clearLeaderboard: () => void;
  setVersusMatchup: (matchup: VersusMatchup | null) => void;
  reorderDraftedTracks: (fromIndex: number, toIndex: number) => void;
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
      gameMode: 'draft',
      difficulty: 'standard',
      draftSeed: null,
      playerAlias: 'Executive Architect',
      slots: DRAFT_SLOTS,
      currentRoundIndex: 0,
      draftedTracks: [],
      currentOptions: getOptionsForSlot(DRAFT_SLOTS[0].id, 5, DRAFT_SLOTS[0].defaultEra, null),
      rerollTokens: 2,
      rerollCount: 0,
      eraSequence: generateEraSequence(DRAFT_SLOTS, null),
      candidateHistory: [],
      selectedEra: 'all',
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
      soloDraftNonce: 0,
      monopolyReport: EMPTY_MONOPOLY,
      energyMetrics: EMPTY_ENERGY,
      evaluationResult: null,
      opponentEvaluationResult: null,
      isEvaluating: false,
      audioEnabled: true,
      activePlayingSongId: null,
      selectedRealSong: null,
      audioSourcePreference: 'youtube',
      isPlayerModalOpen: false,
      pastDrafts: [],
      leaderboard: [],
      versusMatchup: null,
      opponentDraftedTracks: [],
      lastOpponentReveal: null,

      fetchOptions: (slotId: SlotId, era: EraFilter, seed: string | null, rerollIndex: number = 0) => {
        const { draftedTracks, recentlyShownSongIds, recentlyShownArtists, soloDraftNonce } = get();
        const draftedSongIds = draftedTracks.map((d) => d.song.id);
        const draftedArtists = draftedTracks.map((d) => d.song.artist);

        const options = getOptionsForSlot(slotId, get().gameMode === 'draft' ? 5 : 4, era, seed, {
          rerollIndex: seed ? rerollIndex : rerollIndex + soloDraftNonce * 10,
          draftedSongIds,
          draftedArtists,
          recentlyShownSongIds,
          recentlyShownArtists,
        });

        if (seed === null) {
          const shownIds = options.map((s) => s.id);
          const shownArtists = options.map((s) => s.artist);
          const prevIds = get().recentlyShownSongIds || [];
          const prevArtists = get().recentlyShownArtists || [];

          const updatedIds = Array.from(new Set([...shownIds, ...prevIds])).slice(0, 80);
          const updatedArtists = Array.from(new Set([...shownArtists, ...prevArtists])).slice(0, 40);

          set({
            recentlyShownSongIds: updatedIds,
            recentlyShownArtists: updatedArtists,
          });
        }

        return options;
      },

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
        const slots   = newMode === 'draft' ? DRAFT_SLOTS : newMode === 'ep' ? EP_SLOTS : ALBUM_SLOTS;

        let tokens = newMode === 'album' ? 3 : 2;
        if (newDiff === 'veteran' || newDiff === 'hardcore') tokens = 1;

        const nextNonce = newSeed === null ? get().soloDraftNonce + 1 : get().soloDraftNonce;
        if (newSeed === null) {
          set({ soloDraftNonce: nextNonce });
        }

        const eraSequence = generateEraSequence(slots, newSeed);
        const slot0Era    = eraSequence[0];
        // Set the mode before fetching the first pool so Draft mode receives
        // its required five recommendations even when switching from EP/LP.
        set({ gameMode: newMode, slots });
        const initialOptions = get().fetchOptions(slots[0].id, slot0Era, newSeed, 0);

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
          opponentEvaluationResult: null,
          isEvaluating: false,
          activePlayingSongId: null,
          selectedRealSong: null,
          isPlayerModalOpen: false,
          opponentDraftedTracks: [],
          lastOpponentReveal: null,
        });
      },

      draftSong: (song: Song, isWildcard = false) => {
        const {
          slots, currentRoundIndex, draftedTracks,
          eraSequence, draftSeed, candidateHistory,
          gameMode,
        } = get();
        if (currentRoundIndex >= slots.length) return;

        const currentSlot   = slots[currentRoundIndex];
        const opponentSong = gameMode === 'draft'
          ? [...get().currentOptions]
              .filter((candidate) => candidate.id !== song.id)
              .sort((a, b) => (b.slotAffinity[currentSlot.id] ?? 0) - (a.slotAffinity[currentSlot.id] ?? 0) || b.impact - a.impact)[0]
          : null;
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
        const opponentTracks = opponentSong
          ? [...get().opponentDraftedTracks, { slot: currentSlot, song: opponentSong, roundDrafted: currentRoundIndex + 1, isWildcard: false }]
          : get().opponentDraftedTracks;

        if (nextRoundIndex < slots.length) {
          const nextSlot  = slots[nextRoundIndex];
          const nextEra   = eraSequence[nextRoundIndex] ?? 'all';
          nextOptions     = get().fetchOptions(nextSlot.id, nextEra, draftSeed, 0);

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
          opponentDraftedTracks: opponentTracks,
          lastOpponentReveal: opponentSong
            ? { slot: currentSlot, song: opponentSong, reason: 'Selected from the same pool for slot fit, project balance, and future variety.', roundIndex: currentRoundIndex }
            : null,
        });
      },

      undoLastPick: () => {
        const { draftedTracks, slots, eraSequence, draftSeed, candidateHistory } = get();
        if (draftedTracks.length === 0) return false;

        const updatedDrafted  = draftedTracks.slice(0, -1);
        const prevRoundIndex  = updatedDrafted.length;
        const prevSlot        = slots[prevRoundIndex];
        const prevEra         = eraSequence[prevRoundIndex] ?? 'all';
        const restoredOptions = get().fetchOptions(prevSlot.id, prevEra, draftSeed, 0);

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
          opponentEvaluationResult: null,
          candidateHistory: trimmedHistory,
          opponentDraftedTracks: get().opponentDraftedTracks.slice(0, -1),
          lastOpponentReveal: null,
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

        const freshOptions = get().fetchOptions(currentSlot.id, currentEra, draftSeed, rerollCount + 1);

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
          slots,
        } = get();
        const opponentTracksSnapshot = get().opponentDraftedTracks;

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
          opponentEvaluationResult:
            gameMode === 'draft' && opponentTracksSnapshot.length === slots.length
              ? generateFallbackEvaluation(
                  'draft',
                  opponentTracksSnapshot,
                  computeMonopolyReport(opponentTracksSnapshot),
                  computeEnergyMetrics(opponentTracksSnapshot),
                  selectedEra
                )
              : null,
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

      reorderDraftedTracks: (fromIndex: number, toIndex: number) => {
        const { draftedTracks } = get();
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= draftedTracks.length || toIndex >= draftedTracks.length) return;
        const reordered = [...draftedTracks];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        set({
          draftedTracks: reordered,
          monopolyReport: computeMonopolyReport(reordered),
          energyMetrics: computeEnergyMetrics(reordered),
          evaluationResult: null,
        });
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
       * v3→v4: added Draft opponent state.
       */
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<DraftStoreState>;

        if (version < 2) {
          if (persisted.rerollCount === undefined) persisted.rerollCount = 0;
          const mode  = persisted.gameMode ?? 'draft';
          const slots = mode === 'album' ? ALBUM_SLOTS : mode === 'draft' ? DRAFT_SLOTS : EP_SLOTS;
          persisted.slots = slots;
        }

        if (version < 3) {
          const mode  = persisted.gameMode ?? 'draft';
          const slots = mode === 'album' ? ALBUM_SLOTS : mode === 'draft' ? DRAFT_SLOTS : EP_SLOTS;
          const seed  = persisted.draftSeed ?? null;
          persisted.eraSequence     = generateEraSequence(slots, seed);
          persisted.candidateHistory = [];
          // Recompute currentOptions using the new era sequence
          const roundIdx = persisted.currentRoundIndex ?? 0;
          const slotIdx  = Math.min(roundIdx, slots.length - 1);
          const slot     = slots[slotIdx];
          const era      = persisted.eraSequence[slotIdx] ?? 'all';
          persisted.currentOptions  = getOptionsForSlot(slot.id, mode === 'draft' ? 5 : 4, era, seed);
          // Reset subScores to new shape if present (old shape had pacing/synergy)
          if (persisted.evaluationResult && 'pacing' in (persisted.evaluationResult.subScores ?? {})) {
            persisted.evaluationResult = null;
          }
        }

        if (version < 4) {
          persisted.opponentDraftedTracks = persisted.opponentDraftedTracks ?? [];
          persisted.opponentEvaluationResult = persisted.opponentEvaluationResult ?? null;
          persisted.lastOpponentReveal = null;
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
        recentlyShownSongIds: state.recentlyShownSongIds,
        recentlyShownArtists: state.recentlyShownArtists,
        soloDraftNonce: state.soloDraftNonce,
        monopolyReport: state.monopolyReport,
        energyMetrics: state.energyMetrics,
        evaluationResult: state.evaluationResult,
        opponentEvaluationResult: state.opponentEvaluationResult,
        audioEnabled: state.audioEnabled,
        audioSourcePreference: state.audioSourcePreference,
        pastDrafts: state.pastDrafts,
        leaderboard: state.leaderboard,
        versusMatchup: state.versusMatchup,
        opponentDraftedTracks: state.opponentDraftedTracks,
        lastOpponentReveal: state.lastOpponentReveal,
      }),
    }
  )
);
