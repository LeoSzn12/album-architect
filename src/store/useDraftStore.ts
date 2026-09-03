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
  ChallengeTheme,
  SynergyBadge,
  CrowdHypeResult,
} from '@/types/draft';
import { DRAFT_SLOTS, EP_SLOTS, ALBUM_SLOTS, BUDGET_SLOTS } from '@/data/slots';
import { getOptionsForSlot } from '@/data/songs';
import { generateFallbackEvaluation } from '@/lib/fallbackEvaluator';
import { generateEraSequence } from '@/lib/eraSequence';
import { computeMonopolyReport, computeEnergyMetrics } from '@/lib/draftMetrics';
import { reorderTracklist } from '@/lib/tracklistOrder';
import {
  INITIAL_BUDGET,
  calculateRemainingBudget,
  computeBudgetReport,
} from '@/lib/budgetEngine';
import { getDailySeed, getDailyTheme, calculateDailyStreak } from '@/lib/dailyDrop';
import { detectSynergies, computeCrowdHype } from '@/lib/synergyEngine';

let sessionRequestCounter = 0;
let sessionWriteQueue = Promise.resolve();

function enqueueSessionWrite(work: () => Promise<void>) {
  sessionWriteQueue = sessionWriteQueue.then(work, work);
  return sessionWriteQueue;
}

async function createGameSession(input: { mode: GameMode; trackCount: number; creatorAlias: string; seed: string | null }) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const body = await response.json().catch(() => null) as { session?: { id?: string } } | null;
  return typeof body?.session?.id === 'string' ? body.session.id : null;
}

async function saveGameSessionPick(sessionId: string, track: DraftedTrack) {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/picks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position: track.roundDrafted, slotId: track.slot.id, song: track.song, selectionSource: 'recommendation' }),
  });
  if (!response.ok) throw new Error(`pick persistence returned ${response.status}`);
}

/**
 * Current persisted-state schema version. Bump on any breaking shape change.
 *   v1 → v2: added rerollCount; removed slots & currentOptions from partialize.
 *   v2 → v3: added eraSequence, candidateHistory; replaced subScores shape
 *             (pacing/synergy/cohesion/starPower → slotFit/albumFlow/cohesion/impact).
 *   v3 → v4: added explicit Draft opponent state and transparent scorecard fields.
 *   v4 → v5: added session persistence boundary.
 *   v5 → v6: added challengeTheme, budgetRemaining, dailyStreak, activeSynergies, crowdHype.
 */
const PERSIST_VERSION = 6;

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
  sessionId: string | null;
  challengeTheme: ChallengeTheme;
  budgetRemaining: number;
  dailyStreak: number;
  lastDailyCompletedDate: string | null;
  activeSynergies: SynergyBadge[];
  crowdHype: CrowdHypeResult;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (diff: DifficultyTier) => void;
  setDraftSeed: (seed: string | null) => void;
  setPlayerAlias: (alias: string) => void;
  setSelectedEra: (era: EraFilter) => void;
  setChallengeTheme: (theme: ChallengeTheme) => void;
  startDailyDrop: () => void;
  fetchOptions: (slotId: SlotId, era: EraFilter, seed: string | null, rerollIndex?: number) => Song[];
  startNewDraft: (
    mode?: GameMode,
    era?: EraFilter,
    diff?: DifficultyTier,
    seed?: string | null,
    theme?: ChallengeTheme
  ) => void;
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
  resumePersistedSession: () => Promise<void>;
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
      audioSourcePreference: 'apple',
      isPlayerModalOpen: false,
      pastDrafts: [],
      leaderboard: [],
      versusMatchup: null,
      opponentDraftedTracks: [],
      lastOpponentReveal: null,
      sessionId: null,
      challengeTheme: 'standard',
      budgetRemaining: INITIAL_BUDGET,
      dailyStreak: 0,
      lastDailyCompletedDate: null,
      activeSynergies: [],
      crowdHype: {
        score: 65,
        status: 'AWAITING FIRST DROP 🚀',
        reactionQuote: 'Passengers waiting to see who gets the aux cord...',
      },

      fetchOptions: (slotId: SlotId, era: EraFilter, seed: string | null, rerollIndex: number = 0) => {
        const { draftedTracks, recentlyShownSongIds, recentlyShownArtists, soloDraftNonce, challengeTheme, budgetRemaining, gameMode } = get();
        const draftedSongIds = draftedTracks.map((d) => d.song.id);
        const draftedArtists = draftedTracks.map((d) => d.song.artist);

        const options = getOptionsForSlot(slotId, gameMode === 'draft' ? 5 : 4, era, seed, {
          rerollIndex: seed ? rerollIndex : rerollIndex + soloDraftNonce * 10,
          draftedSongIds,
          draftedArtists,
          recentlyShownSongIds,
          recentlyShownArtists,
          theme: challengeTheme,
          budgetRemaining: gameMode === 'budget' ? budgetRemaining : undefined,
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

      setChallengeTheme: (theme: ChallengeTheme) => {
        set({ challengeTheme: theme });
        get().startNewDraft(undefined, undefined, undefined, undefined, theme);
      },

      startDailyDrop: () => {
        const todaySeed = getDailySeed();
        const dailyInfo = getDailyTheme();
        get().startNewDraft('draft', 'all', 'standard', todaySeed, dailyInfo.theme);
      },

      startNewDraft: (
        mode?: GameMode,
        era?: EraFilter,
        diff?: DifficultyTier,
        seed?: string | null,
        theme?: ChallengeTheme
      ) => {
        const sessionRequestId = ++sessionRequestCounter;
        const newMode = mode ?? get().gameMode;
        const newEra  = era  ?? get().selectedEra;
        const newDiff = diff ?? get().difficulty;
        const newSeed = seed !== undefined ? seed : get().draftSeed;
        const newTheme = theme ?? (newSeed && newSeed.startsWith('DAILY-') ? getDailyTheme().theme : get().challengeTheme);
        const slots   = newMode === 'draft' ? DRAFT_SLOTS : newMode === 'ep' ? EP_SLOTS : newMode === 'budget' ? BUDGET_SLOTS : ALBUM_SLOTS;

        let tokens = newMode === 'album' ? 3 : 2;
        if (newDiff === 'veteran' || newDiff === 'hardcore') tokens = 1;

        const nextNonce = newSeed === null ? get().soloDraftNonce + 1 : get().soloDraftNonce;
        if (newSeed === null) {
          set({ soloDraftNonce: nextNonce });
        }

        const eraSequence = generateEraSequence(slots, newSeed);
        const slot0Era    = eraSequence[0];
        // Set mode & theme before fetching the first pool
        set({ gameMode: newMode, slots, challengeTheme: newTheme, budgetRemaining: INITIAL_BUDGET });
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
          challengeTheme: newTheme,
          budgetRemaining: INITIAL_BUDGET,
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
          activeSynergies: [],
          crowdHype: {
            score: 65,
            status: 'AWAITING FIRST DROP 🚀',
            reactionQuote: 'Passengers waiting to see who gets the aux cord...',
          },
          evaluationResult: null,
          opponentEvaluationResult: null,
          isEvaluating: false,
          activePlayingSongId: null,
          selectedRealSong: null,
          isPlayerModalOpen: false,
          opponentDraftedTracks: [],
          lastOpponentReveal: null,
          sessionId: null,
        });

        void createGameSession({
          mode: newMode,
          trackCount: slots.length,
          creatorAlias: get().playerAlias,
          seed: newSeed,
        }).then(async (sessionId) => {
          if (!sessionId || sessionRequestId !== sessionRequestCounter) return;
          set({ sessionId });
          for (const track of get().draftedTracks) await saveGameSessionPick(sessionId, track);
        }).catch((error) => console.warn('Session persistence unavailable:', error));
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
        const updatedBudget    = gameMode === 'budget' ? calculateRemainingBudget(updatedDrafted) : INITIAL_BUDGET;
        const activeSynergies  = detectSynergies(updatedDrafted);
        const crowdHype        = computeCrowdHype(updatedDrafted, activeSynergies);

        // Update budget and synergies in store before next fetchOptions
        set({ budgetRemaining: updatedBudget, activeSynergies, crowdHype });

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
          budgetRemaining: updatedBudget,
          activeSynergies,
          crowdHype,
          monopolyReport,
          energyMetrics,
          candidateHistory: updatedHistory,
          opponentDraftedTracks: opponentTracks,
          lastOpponentReveal: opponentSong
            ? { slot: currentSlot, song: opponentSong, reason: 'Selected from the same pool for slot fit, project balance, and future variety.', roundIndex: currentRoundIndex }
            : null,
        });

        const sessionId = get().sessionId;
        if (sessionId) void enqueueSessionWrite(() => saveGameSessionPick(sessionId, newDraftedTrack)).catch((error) => console.warn('Pick persistence unavailable:', error));
      },

      undoLastPick: () => {
        const { draftedTracks, slots, eraSequence, draftSeed, candidateHistory, gameMode } = get();
        if (draftedTracks.length === 0) return false;

        const updatedDrafted  = draftedTracks.slice(0, -1);
        const prevRoundIndex  = updatedDrafted.length;
        const prevSlot        = slots[prevRoundIndex];
        const prevEra         = eraSequence[prevRoundIndex] ?? 'all';
        const restoredBudget  = gameMode === 'budget' ? calculateRemainingBudget(updatedDrafted) : INITIAL_BUDGET;
        const activeSynergies = detectSynergies(updatedDrafted);
        const crowdHype       = computeCrowdHype(updatedDrafted, activeSynergies);

        set({ budgetRemaining: restoredBudget, activeSynergies, crowdHype });
        const restoredOptions = get().fetchOptions(prevSlot.id, prevEra, draftSeed, 0);

        const monopolyReport  = computeMonopolyReport(updatedDrafted);
        const energyMetrics   = computeEnergyMetrics(updatedDrafted);

        // Remove the last round's history entry on undo
        const trimmedHistory  = candidateHistory.slice(0, prevRoundIndex + 1);

        set({
          currentRoundIndex: prevRoundIndex,
          draftedTracks: updatedDrafted,
          currentOptions: restoredOptions,
          budgetRemaining: restoredBudget,
          activeSynergies,
          crowdHype,
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

        // Augment evaluation with budget, synergies, crowd hype, and theme metadata
        if (gameMode === 'budget') {
          result.budgetReport = computeBudgetReport(draftedTracksSnapshot, result.rawScore);
        }
        result.activeTheme = get().challengeTheme;
        result.achievedSynergies = detectSynergies(draftedTracksSnapshot);
        result.crowdHype = computeCrowdHype(draftedTracksSnapshot, result.achievedSynergies);

        // Daily Drop Streak tracking
        const todaySeed = getDailySeed();
        const isDailyDrop = Boolean(draftSeed && draftSeed === todaySeed);
        let newDailyStreak = get().dailyStreak;
        let newLastDailyDate = get().lastDailyCompletedDate;

        if (isDailyDrop) {
          const streakRes = calculateDailyStreak(get().lastDailyCompletedDate, get().dailyStreak, todaySeed);
          newDailyStreak = streakRes.newStreak;
          newLastDailyDate = todaySeed;
        }

        // Curator Badges
        const curatorBadges: string[] = [];
        if (gameMode === 'budget' && result.budgetReport?.totalSpent === 15 && result.overallScore >= 8.5) {
          curatorBadges.push('Budget Beast');
        }
        if (result.achievedSynergies?.some((s) => s.id === 'silk-bpm-blend')) {
          curatorBadges.push('Master DJ');
        }
        if (result.crowdHype && result.crowdHype.score >= 85) {
          curatorBadges.push('Aux God');
        }
        if (isDailyDrop) {
          curatorBadges.push(`Daily Drop (${newDailyStreak}d Streak)`);
        }
        if (result.monopolyReport.totalPenaltyDeduction === 0 && draftedTracksSnapshot.length >= 7) {
          curatorBadges.push('The Diplomat');
        }
        result.curatorBadges = curatorBadges;

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
          theme: get().challengeTheme,
          budgetReport: result.budgetReport,
          crowdHypeScore: result.crowdHype?.score,
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
          theme: get().challengeTheme,
          isDailyDrop,
        };

        const updatedLeaderboard = [...leaderboard, newLeaderboardEntry]
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 50);

        // Persist the completed scorecard when Supabase auth is available.
        // Guest mode intentionally remains local and does not block the result UI.
        void fetch('/api/scorecards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: gameMode,
            trackCount: draftedTracksSnapshot.length,
            alias: playerAlias,
            evaluation: result,
          }),
        }).catch((persistError) => console.warn('Scorecard persistence unavailable:', persistError));

        const sessionId = get().sessionId;
        if (sessionId) {
          void enqueueSessionWrite(() => fetch(`/api/sessions/${encodeURIComponent(sessionId)}/submit`, { method: 'POST' }).then((response) => {
            if (!response.ok) throw new Error(`submit persistence returned ${response.status}`);
          }))
            .catch((persistError) => console.warn('Session submit persistence unavailable:', persistError));
        }

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
          dailyStreak: newDailyStreak,
          lastDailyCompletedDate: newLastDailyDate,
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
        const reordered = reorderTracklist(draftedTracks, fromIndex, toIndex)
          .map((track, index) => ({ ...track, roundDrafted: index + 1 }));
        set({
          draftedTracks: reordered,
          monopolyReport: computeMonopolyReport(reordered),
          energyMetrics: computeEnergyMetrics(reordered),
          evaluationResult: null,
        });

        const sessionId = get().sessionId;
        if (sessionId) {
          void enqueueSessionWrite(() => fetch(`/api/sessions/${encodeURIComponent(sessionId)}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positions: reordered.map((track) => track.roundDrafted) }),
          }).then((response) => {
            if (!response.ok) throw new Error(`reorder persistence returned ${response.status}`);
          })).catch((persistError) => console.warn('Reorder persistence unavailable:', persistError));
        }
      },

      resumePersistedSession: async () => {
        const sessionId = get().sessionId;
        if (!sessionId) return;
        const response = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}`).catch(() => null);
        if (!response?.ok) return;
        const body = await response.json().catch(() => null) as { session?: { mode?: GameMode; seed?: string | null; status?: string; picks?: Array<{ position: number; slotId: string; song: Song }> } } | null;
        const session = body?.session;
        if (!session || session.status === 'submitted' || !Array.isArray(session.picks) || (session.mode !== 'draft' && session.mode !== 'ep' && session.mode !== 'album')) return;

        const nextSlots = session.mode === 'draft' ? DRAFT_SLOTS : session.mode === 'ep' ? EP_SLOTS : ALBUM_SLOTS;
        const restoredSeed = session.seed ?? get().draftSeed;
        const restoredEraSequence = generateEraSequence(nextSlots, restoredSeed);
        const restoredTracks = session.picks
          .slice()
          .sort((a, b) => a.position - b.position)
          .flatMap((pick) => {
            const slot = nextSlots[pick.position - 1] ?? nextSlots.find((candidate) => candidate.id === pick.slotId);
            return slot && pick.song ? [{ slot, song: pick.song, roundDrafted: pick.position, isWildcard: false }] : [];
          });
        const nextIndex = restoredTracks.length;
        set({
          gameMode: session.mode,
          draftSeed: restoredSeed,
          slots: nextSlots,
          eraSequence: restoredEraSequence,
          draftedTracks: restoredTracks,
          currentRoundIndex: nextIndex,
          currentOptions: nextIndex < nextSlots.length
            ? getOptionsForSlot(nextSlots[nextIndex].id, session.mode === 'draft' ? 5 : 4, restoredEraSequence[nextIndex] ?? 'all', restoredSeed)
            : [],
          monopolyReport: computeMonopolyReport(restoredTracks),
          energyMetrics: computeEnergyMetrics(restoredTracks),
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

        if (version < 5) persisted.sessionId = null;

        if (version < 6) {
          persisted.challengeTheme = 'standard';
          persisted.budgetRemaining = INITIAL_BUDGET;
          persisted.dailyStreak = 0;
          persisted.lastDailyCompletedDate = null;
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
        sessionId: state.sessionId,
        challengeTheme: state.challengeTheme,
        budgetRemaining: state.budgetRemaining,
        dailyStreak: state.dailyStreak,
        lastDailyCompletedDate: state.lastDailyCompletedDate,
      }),
    }
  )
);
