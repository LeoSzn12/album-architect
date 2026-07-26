/**
 * Canonical Scoring Engine — Album Architect: Rap Draft
 *
 * This is the SINGLE SOURCE OF TRUTH for all competitive scoring.
 * AI (Gemini) must NEVER determine competitive scores. AI may narrate
 * an already-calculated score using this engine's output.
 *
 * Formula (all sub-scores clamped to [1, 10]):
 *
 *   slotFit    = f(energy delta, slot-tag eligibility, type compatibility) × 35%
 *   albumFlow  = f(energy progression, BPM transitions, fatigue, arc quality) × 25%
 *   cohesion   = f(genre consistency, mood arc, artist diversity, monopoly exposure) × 20%
 *   impact     = f(song.impact curated field — NOT energy) × 20%
 *
 *   rawScore   = weighted average of the four categories
 *   finalScore = rawScore − monopolyPenalty   (both clamped separately)
 *
 * The same draft always produces the same score. No randomness after input.
 */

import { DraftedTrack, MonopolyReport, EnergyMetrics, ScoringBreakdown } from '@/types/draft';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp(lo: number, hi: number, n: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// 1. Slot Fit (35%)
//    Measures how well each track fits its assigned positional slot.
// ---------------------------------------------------------------------------

/**
 * Per-track slot fit score.
 *  - Energy delta from ideal: each point off target costs 0.06 (max loss 6 pts)
 *  - Slot-tag match: +1.0 if the song's slots array includes this slot
 *  - Both components clamped, then averaged for a [1,10] score per track.
 */
function computeSlotFitScore(drafted: DraftedTrack[]): number {
  if (drafted.length === 0) return 5.0;

  const perTrack = drafted.map((dt) => {
    const { song, slot } = dt;
    const energyDelta = Math.abs(song.energy - slot.targetEnergy.ideal);
    // 0-delta = 10, every 1 pt off = -0.06 (so 50-pt off ≈ 7.0, 100-pt = 4.0)
    const energyScore = clamp(1, 10, 10 - energyDelta * 0.06);

    // Explicit slot-tag match bonus
    const tagMatch = song.slots.includes(slot.id) ? 1.0 : -0.5;
    const fitScore = clamp(1, 10, energyScore + tagMatch);
    return fitScore;
  });

  return round1(perTrack.reduce((s, v) => s + v, 0) / perTrack.length);
}

// ---------------------------------------------------------------------------
// 2. Album Flow (25%)
//    Measures transitions across the tracklist.
//    Intentional vibe shifts (interlude, outro) are not penalized.
// ---------------------------------------------------------------------------

/**
 * Slots where a large energy drop is intentional (interlude, outro, slow jam).
 * BPM / energy jumps at these positions are not treated as negative.
 */
const INTENTIONAL_TRANSITION_SLOTS = new Set([
  'mid-interlude',
  'late-night-rnb',
  'cinematic-outro',
  'introspective-cut',
  'acoustic-unplugged',
  'vibe-shift',
]);

function computeAlbumFlowScore(drafted: DraftedTrack[], energyMetrics: EnergyMetrics): number {
  if (drafted.length < 2) return 7.0;

  let flowScore = 8.5; // start optimistic

  // Penalize unintentional abrupt BPM jumps
  energyMetrics.bpmTransitions.forEach((t, i) => {
    const nextSlot = drafted[i + 1]?.slot;
    const isIntentional = nextSlot && INTENTIONAL_TRANSITION_SLOTS.has(nextSlot.id);
    if (t.status === 'abrupt' && !isIntentional) {
      flowScore -= 0.6;
    }
  });

  // Bonus for deliberate arc: opener low/mid → climax high → outro mid
  const first = drafted[0]?.song.energy ?? 75;
  const last = drafted[drafted.length - 1]?.song.energy ?? 60;
  const peak = Math.max(...drafted.map((d) => d.song.energy));
  const peakIndex = drafted.findIndex((d) => d.song.energy === peak);
  const hasDramaticArc =
    first < peak && last < peak && peakIndex > 0 && peakIndex < drafted.length - 1;
  if (hasDramaticArc) flowScore += 0.7;

  // Penalize listener fatigue (3+ consecutive high-energy)
  flowScore -= (energyMetrics.fatigueScore / 100) * 2.5;

  // Penalize constant low energy
  if (energyMetrics.avgEnergy < 45) flowScore -= 1.0;

  return round1(clamp(1, 10, flowScore));
}

// ---------------------------------------------------------------------------
// 3. Cohesion (20%)
//    Measures whether the project feels like one album.
// ---------------------------------------------------------------------------

function computeCohesionScore(drafted: DraftedTrack[], monopolyReport: MonopolyReport): number {
  if (drafted.length === 0) return 5.0;

  let score = 8.0;

  // Artist diversity: penalize monopoly exposure even before formal deduction
  const uniqueArtists = new Set(drafted.map((d) => d.song.artist)).size;
  const artistDiversityRatio = uniqueArtists / drafted.length;
  if (artistDiversityRatio < 0.6) score -= 1.2; // too same-y
  if (artistDiversityRatio > 0.9) score += 0.4; // diverse roster

  // Feature richness: mix of solo + collab tracks
  const withFeatures = drafted.filter((d) => d.song.featuredArtists.length > 0).length;
  const featureRatio = withFeatures / drafted.length;
  if (featureRatio > 0.2 && featureRatio < 0.8) score += 0.5; // healthy mix

  // Genre consistency: unique genres vs total
  const uniqueGenres = new Set(drafted.map((d) => d.song.genre)).size;
  const genreRatio = uniqueGenres / drafted.length;
  if (genreRatio > 0.8) score -= 0.8; // too scattered
  if (genreRatio < 0.35) score += 0.6; // tight focus

  // Penalize monopoly exposure (in addition to the official deduction below)
  if (monopolyReport.hasViolation) score -= 0.5;

  return round1(clamp(1, 10, score));
}

// ---------------------------------------------------------------------------
// 4. Impact (20%)
//    Uses the curated `song.impact` field — NOT energy as a proxy.
// ---------------------------------------------------------------------------

function computeImpactScore(drafted: DraftedTrack[]): number {
  if (drafted.length === 0) return 5.0;
  const avg = drafted.reduce((s, d) => s + (d.song.impact ?? 5), 0) / drafted.length;
  // impact is already 0-10; clamp to [1,10] for scoring
  return round1(clamp(1, 10, avg));
}

// ---------------------------------------------------------------------------
// Main export: score a completed draft
// ---------------------------------------------------------------------------

export interface ScoringResult {
  subScores: ScoringBreakdown;
  rawScore: number;
  finalScore: number;
}

/**
 * Score a completed draft deterministically.
 *
 * The same input always produces the same output. No randomness.
 * AI commentary may REFERENCE this result but never override it.
 *
 * @param drafted    — the player's seven (or more) picked tracks
 * @param monopolyReport — pre-computed monopoly state
 * @param energyMetrics  — pre-computed energy/BPM metrics
 */
export function scoreDraft(
  drafted: DraftedTrack[],
  monopolyReport: MonopolyReport,
  energyMetrics: EnergyMetrics
): ScoringResult {
  const slotFit  = computeSlotFitScore(drafted);
  const albumFlow = computeAlbumFlowScore(drafted, energyMetrics);
  const cohesion = computeCohesionScore(drafted, monopolyReport);
  const impact   = computeImpactScore(drafted);

  const subScores: ScoringBreakdown = { slotFit, albumFlow, cohesion, impact };

  const rawScore = round1(
    slotFit  * 0.35 +
    albumFlow * 0.25 +
    cohesion  * 0.20 +
    impact    * 0.20
  );

  // Monopoly penalty is a separate, visible deduction AFTER the weighted score
  const finalScore = round1(clamp(1, 10, rawScore - monopolyReport.totalPenaltyDeduction));

  return { subScores, rawScore, finalScore };
}

/**
 * Convert a final score to a human-readable verdict label.
 * Used on the results screen as the primary emotional result.
 */
export function scoreToVerdict(score: number): string {
  if (score >= 9.2) return 'Classic';
  if (score >= 8.5) return 'Platinum Album';
  if (score >= 7.5) return 'Strong Project';
  if (score >= 6.0) return 'Mixed Reception';
  return 'Flop';
}

/**
 * Convert a final score to a grade badge string.
 */
export function scoreToGradeBadge(score: number): string {
  if (score >= 9.2) return 'Diamond Classic';
  if (score >= 8.5) return 'Platinum Banger';
  if (score >= 7.5) return 'Gold Solid';
  if (score >= 6.0) return 'Mixtape Cut';
  return 'A&R Scrapbook';
}
