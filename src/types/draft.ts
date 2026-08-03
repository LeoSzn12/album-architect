export type GameMode = 'draft' | 'ep' | 'album';

export type SlotId =
  | 'cinematic-intro'
  | 'statement-banger'
  | 'gritty-anthem'
  | 'introspective-cut'
  | 'vibe-shift'
  | 'mid-interlude'
  | 'club-bounce'
  | 'late-night-rnb'
  | 'experimental-flex'
  | 'apex-climax'
  | 'acoustic-unplugged'
  | 'melodic-trap'
  | 'storyteller-cut'
  | 'cinematic-outro';

export type EraFilter = 'all' | '2020s' | '2010s' | '2000s';

export interface DraftSlot {
  id: SlotId;
  name: string;
  roundNumber: number;
  description: string;
  targetEnergy: {
    min: number;
    max: number;
    ideal: number;
  };
  iconName: string;
  /**
   * Default era bucket for this slot when no challenge seed is present.
   * Used to auto-assign eras rather than letting the player manually filter.
   */
  defaultEra: EraFilter;
  /** Curated label shown as the era badge in the UI (e.g. "2010s Cinematic Intro") */
  eraLabel: string;
}

export type SongArchetype =
  | 'iconic-opener'
  | 'cinematic'
  | 'high-energy'
  | 'lyrical'
  | 'street-anthem'
  | 'club'
  | 'introspective'
  | 'rnb'
  | 'experimental'
  | 'vibe-shift'
  | 'storytelling'
  | 'climax'
  | 'outro'
  | 'value-pick';

export interface CandidateDebugInfo {
  bucket: 'headliner' | 'best-fit' | 'alternative' | 'sleeper';
  slotAffinity: number;
  selectionWeight: number;
  recentlyShownPenalty: number;
  reasons: string[];
}

export interface CandidateContext {
  slotId: SlotId;
  era: EraFilter;
  seed: string | null;
  rerollIndex: number;
  draftedSongIds: string[];
  draftedArtists: string[];
  recentlyShownSongIds: string[];
  recentlyShownArtists: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string; // Solo primary artist used for Monopoly calculation
  featuredArtists: string[]; // Featured artists (excluded from Monopoly solo count)
  rawArtistString: string; // e.g. "Rick Ross feat. Drake"
  album?: string;
  year?: number;
  genre: string;
  typeTag: string; // e.g., "Orchestral Hype", "Dark R&B", "Sub-Bass Trap"
  bpm: number;
  energy: number; // 0 to 100
  slots: SlotId[];
  gradient: string;
  audioSynthFreq: number; // base frequency for synthesized preview audio
  youtubeId?: string; // YouTube video ID e.g. "FW5s99y58d8" — must be exactly 11 chars
  youtubeUrl?: string; // Direct YouTube / YT Music URL
  spotifyId?: string; // Spotify track ID e.g. "0VjIjW4GlUZAMYd2vXMi3b" — 22 chars
  spotifyUrl?: string; // Direct Spotify URL
  /**
   * Curated game impact rating (0–100). Reflects a combination of cultural
   * recognition, acclaim, commercial strength, and longevity.
   */
  impact: number;
  /** Cultural recognition / player familiarity (0–100). */
  recognition: number;
  /** Critical / artistic reputation (0–100). */
  acclaim?: number;
  /** Strategic gameplay identity tags. */
  archetypes: SongArchetype[];
  /** Positional fit score (0–100) per album slot. */
  slotAffinity: Partial<Record<SlotId, number>>;
  /** Indicates whether track is an actual album opener. */
  isActualAlbumOpener?: boolean;
  /** Indicates whether track is an actual album outro / closing track. */
  isActualAlbumOutro?: boolean;
  /** Track number on original album release. */
  originalAlbumTrackNumber?: number;
  /** Debug info populated in dev mode for candidate evaluation. */
  debugInfo?: CandidateDebugInfo;
  /**
   * Optional album artwork URL. Use only authorized/stable sources.
   * Gradient fallback is shown when absent.
   */
  artwork?: string;
}

export type AudioSourcePreference = 'youtube' | 'spotify' | 'synth';

export interface DraftedTrack {
  slot: DraftSlot;
  song: Song;
  roundDrafted: number;
  isWildcard: boolean;
}

/**
 * Records one full candidate pool presented to the player in a single round,
 * including any rerolled pools. Used by the best-possible optimizer.
 */
export interface CandidateRound {
  roundIndex: number;
  slotId: SlotId;
  assignedEra: EraFilter;
  /** All pools the player was shown (initial + one entry per reroll used) */
  pools: Song[][];
}

export interface MonopolyReport {
  artistCounts: Record<
    string,
    {
      solo: number;
      featured: number;
      total: number;
      soloTracks: Song[];
      featuredTracks: Song[];
    }
  >;
  penalizedArtists: {
    artist: string;
    soloCount: number;
    deductionPoints: number;
  }[];
  totalPenaltyDeduction: number;
  hasViolation: boolean;
}

export interface EnergyMetrics {
  curve: number[];
  avgEnergy: number;
  fatigueScore: number;
  status: 'Optimal Pacing' | 'High Energy Overload' | 'Vibe Lull' | 'Wild Energy Spikes';
  bpmTransitions: {
    from: number;
    to: number;
    delta: number;
    status: 'smooth' | 'abrupt' | 'building' | 'chilled';
  }[];
}

export type CriticPersona = 'purist' | 'exec' | 'connoisseur';

export interface CriticReview {
  personaId: CriticPersona;
  name: string;
  role: string;
  score: number; // out of 10
  quote: string;
  detailedAnalysis: string;
  keyHighlight: string;
  badge: string;
}

/**
 * Official scoring breakdown per the canonical scoring engine.
 * Weights: SlotFit 35% · AlbumFlow 25% · Cohesion 20% · Impact 20%
 * Monopoly penalty is a separate deduction applied AFTER the weighted score.
 */
export interface ScoringBreakdown {
  /** How well each track fits its positional slot (energy delta, style match). 35% weight. */
  slotFit: number;
  /** Energy/BPM progression across the tracklist. Intentional vibe shifts allowed. 25% weight. */
  albumFlow: number;
  /** Genre consistency, mood arc, artist diversity, narrative sequencing. 20% weight. */
  cohesion: number;
  /** Cultural recognition, acclaim, commercial strength using curated `impact` field. 20% weight. */
  impact: number;
}

export interface EvaluationResult {
  overallScore: number; // out of 10 (after monopoly deduction)
  rawScore: number;     // weighted score before monopoly deduction
  monopolyPenalty: number;
  gradeBadge: string;
  /** New 4-category breakdown replacing old pacing/synergy/cohesion/starPower. */
  subScores: ScoringBreakdown;
  reviews: CriticReview[];
  monopolyReport: MonopolyReport;
  energyMetrics: EnergyMetrics;
  highlights: string[];
  /** Best score achievable from the exact candidate pools the player was shown. */
  bestPossibleScore?: number;
  /** Percentage of best possible score the player achieved (0–100). */
  draftEfficiency?: number;
  /** The optimal tracklist reconstructed from the player's actual candidate pools. */
  bestPossibleTracklist?: {
    slotName: string;
    songTitle: string;
    artist: string;
    scoreDelta: number; // how much this slot differed from player's pick
  }[];
  /** The single pick that cost the player the most points vs best available. */
  biggestMistake?: {
    slotName: string;
    playerPick: string;
    bestAvailable: string;
    scoreDifference: number;
  };
  /** The single pick that most exceeded expectations given available options. */
  smartestPick?: {
    slotName: string;
    songTitle: string;
    reason: string;
  };
  /**
   * Provenance flag indicating where the score was computed.
   *  - `gemini`   → AI Critic Board via the /api/critic-evaluate route
   *  - `fallback` → local deterministic evaluator (no key or fetch failure)
   * Used by the scorecard/leaderboard for transparency.
   */
  source?: 'gemini' | 'fallback';
  /** Product-facing seven-category scorecard (0–100), kept separate from the legacy /10 UI scores. */
  categoryScores?: CategoryScorecard;
  weightedScoreBeforePenalties?: number;
  appliedPenalties?: AppliedPenalty[];
  executiveSummary?: string;
  strongestChoice?: { position: number; reason: string };
  weakestTransition?: { fromPosition: number; toPosition: number; reason: string };
  recommendedChange?: { action: 'swap' | 'move' | 'keep'; position: number; suggestion: string };
}

export type ScoreCategoryKey =
  | 'slotFit'
  | 'sequencingFlow'
  | 'narrativeConcept'
  | 'varietyBalance'
  | 'energyCurve'
  | 'originalityTaste'
  | 'replayValue';

export interface CategoryScore {
  score: number;
  weight: number;
  evidence: string[];
  note: string;
}

export type CategoryScorecard = Record<ScoreCategoryKey, CategoryScore>;

export interface AppliedPenalty {
  code: string;
  points: number;
  explanation: string;
}

export interface OpponentReveal {
  slot: DraftSlot;
  song: Song;
  reason: string;
  roundIndex: number;
}

export type DifficultyTier = 'standard' | 'veteran' | 'hardcore';

export interface PastDraft {
  id: string;
  gameMode: GameMode;
  difficulty: DifficultyTier;
  completedAt: string;
  overallScore: number;
  gradeBadge: string;
  trackCount: number;
  topTrackTitle: string;
  topTrackArtist: string;
  evaluationResult: EvaluationResult;
}

export interface LeaderboardEntry {
  id: string;
  playerAlias: string;
  overallScore: number;
  gradeBadge: string;
  gameMode: GameMode;
  difficulty: DifficultyTier;
  draftSeed: string | null;
  trackCount: number;
  topTrackTitle: string;
  topTrackArtist: string;
  completedAt: string;
  subScores: ScoringBreakdown;
}

export interface VersusMatchup {
  challengerAlias: string;
  challengerScore: number;
  challengerGrade: string;
  challengerSubScores: ScoringBreakdown;
  challengerEfficiency?: number;
  seed: string;
  gameMode: GameMode;
  difficulty: DifficultyTier;
  topTrackTitle: string;
  topTrackArtist: string;
}
