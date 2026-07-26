export type GameMode = 'ep' | 'album';

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
  youtubeId?: string; // YouTube video ID e.g. "FW5s99y58d8"
  youtubeUrl?: string; // Direct YouTube / YT Music URL
  spotifyId?: string; // Spotify track ID e.g. "0VjIjW4GlUZAMYd2vXMi3b"
  spotifyUrl?: string; // Direct Spotify URL
}

export type AudioSourcePreference = 'youtube' | 'spotify' | 'synth';

export type EraFilter = 'all' | '2020s' | '2010s' | '2000s';

export interface DraftedTrack {
  slot: DraftSlot;
  song: Song;
  roundDrafted: number;
  isWildcard: boolean;
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

export interface EvaluationResult {
  overallScore: number; // out of 10
  rawScore: number;
  monopolyPenalty: number;
  gradeBadge: string;
  subScores: {
    pacing: number;
    synergy: number;
    cohesion: number;
    starPower: number;
  };
  reviews: CriticReview[];
  monopolyReport: MonopolyReport;
  energyMetrics: EnergyMetrics;
  highlights: string[];
  optimalScore?: number; // theoretical maximum score achievable
  optimalPicks?: {
    slotName: string;
    bestSongTitle: string;
    bestArtist: string;
    reason: string;
  }[];
  /**
   * Provenance flag indicating where the score was computed.
   *  - `gemini`   → AI Critic Board via the /api/critic-evaluate route (GEMINI_API_KEY present + call succeeded)
   *  - `fallback` → local deterministic evaluator (no key or fetch failure, route fallback, or store fallback)
   * Used by the scorecard/leaderboard for transparency and prevents silent
   * divergence between network-fail and network-success draft sessions.
   */
  source?: 'gemini' | 'fallback';
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
  subScores: {
    pacing: number;
    synergy: number;
    cohesion: number;
    starPower: number;
  };
}

export interface VersusMatchup {
  challengerAlias: string;
  challengerScore: number;
  challengerGrade: string;
  challengerSubScores: {
    pacing: number;
    synergy: number;
    cohesion: number;
    starPower: number;
  };
  seed: string;
  gameMode: GameMode;
  difficulty: DifficultyTier;
  topTrackTitle: string;
  topTrackArtist: string;
}
