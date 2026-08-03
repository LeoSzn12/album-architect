/**
 * Canonical A&R fallback evaluator.
 *
 * SINGLE SOURCE OF TRUTH — imported by both the API route
 * (`src/app/api/critic-evaluate/route.ts`) and the Zustand store
 * (`src/store/useDraftStore.ts`), so that a draft scored locally (network
 * failure) and a draft scored on the server (no Gemini API key) produce
 * byte-identical results.
 *
 * Delegates to `scoringEngine.ts` for the canonical weighted formula.
 * Generates AI-style commentary from the deterministic scoring breakdown.
 */

import type {
  GameMode,
  DraftedTrack,
  MonopolyReport,
  EnergyMetrics,
  EvaluationResult,
  EraFilter,
} from '../types/draft.ts';
import { scoreDraft, scoreToGradeBadge } from './scoringEngine.ts';
import { findOptimalPickForSlot } from '../data/songs.ts';
import { buildTransparentScorecard } from './transparentScorecard.ts';

export function generateFallbackEvaluation(
  mode: GameMode,
  draftedTracks: DraftedTrack[],
  monopolyReport: MonopolyReport,
  energyMetrics: EnergyMetrics,
  eraFilter: EraFilter = 'all'
): EvaluationResult {
  const { subScores, rawScore, finalScore } = scoreDraft(
    draftedTracks,
    monopolyReport,
    energyMetrics
  );

  const gradeBadge = scoreToGradeBadge(finalScore);
  const transparent = buildTransparentScorecard(draftedTracks, monopolyReport, energyMetrics);

  // Specific track references for persona quotes
  const openerSong = draftedTracks[0]?.song.title || 'Track 1';
  const midTrack =
    draftedTracks[Math.floor(draftedTracks.length / 2)]?.song.title || 'Midpoint Track';
  const climaxTrack =
    draftedTracks.find(
      (dt) => dt.slot.id === 'apex-climax' || dt.song.energy >= 90
    )?.song.title ||
    draftedTracks[draftedTracks.length - 1]?.song.title ||
    'Climax Track';

  const featureRatio =
    draftedTracks.length > 0
      ? draftedTracks.filter((dt) => dt.song.featuredArtists.length > 0).length /
        draftedTracks.length
      : 0;

  const abruptBpmCount = energyMetrics.bpmTransitions.filter(
    (t) => t.status === 'abrupt'
  ).length;

  // Generate locally-optimal picks (greedy, honoring prior picks for artist diversity)
  const draftedSoloArtists: string[] = [];
  const optimalPicks = draftedTracks.map((dt) => {
    const bestSong =
      findOptimalPickForSlot(
        dt.slot.id,
        dt.slot.targetEnergy.ideal,
        draftedSoloArtists,
        eraFilter
      ) || dt.song;
    draftedSoloArtists.push(bestSong.artist);

    let reason = `Ideal energy match (${bestSong.energy}% vs target ${dt.slot.targetEnergy.ideal}%).`;
    if (bestSong.featuredArtists.length > 0) {
      reason += ' Features prevent solo monopoly penalties.';
    }
    if (bestSong.id === dt.song.id) {
      reason = 'You made the locally-optimal pick for this slot given your prior selections!';
    }
    return {
      slotName: dt.slot.name,
      bestSongTitle: bestSong.title,
      bestArtist: bestSong.rawArtistString,
      reason,
    };
  });

  // Theoretical optimal score (greedy upper bound, not exhaustive)
  const theoreticalOptimalScore = Math.min(
    9.9,
    Math.max(8.8, rawScore + (eraFilter !== 'all' ? 0.3 : 0) + 0.5)
  );

  return {
    overallScore: finalScore,
    rawScore,
    monopolyPenalty: monopolyReport.totalPenaltyDeduction,
    gradeBadge,
    subScores,
    reviews: [
      {
        personaId: 'purist',
        name: 'Marcus "The Purist"',
        role: 'Boom-Bap Historian & A&R Head',
        score: Math.min(
          10,
          round1(subScores.cohesion * 0.6 + subScores.slotFit * 0.4)
        ),
        quote: monopolyReport.hasViolation
          ? `Solo monopoly penalties hurt your cohesion score. Overusing ${monopolyReport.penalizedArtists[0]?.artist} diluted the project dynamic!`
          : `Opening with "${openerSong}" set a pristine foundation. Clean execution across all ${draftedTracks.length} slots.`,
        detailedAnalysis: `Sequencing architecture held up well. Track transition into "${midTrack}" provided crucial narrative breath before "${climaxTrack}".`,
        keyHighlight: openerSong,
        badge: 'Lyricism Approved',
      },
      {
        personaId: 'exec',
        name: 'Chloe "Data Exec"',
        role: 'Global Streaming Strategy Director',
        score: Math.min(
          10,
          round1(subScores.impact * 0.6 + subScores.albumFlow * 0.4)
        ),
        quote:
          energyMetrics.status === 'High Energy Overload'
            ? `Adrenaline spikes without rest lead to listener drop-off after round 4. Incorporate mid-tempo interludes!`
            : `Streaming retention metrics look solid. "${climaxTrack}" carries maximum playlist velocity.`,
        detailedAnalysis: `Average energy sits at ${energyMetrics.avgEnergy}%. Feature ratio: ${Math.round(
          featureRatio * 100
        )}% guest coverage across the tracklist.`,
        keyHighlight: climaxTrack,
        badge: 'Playlist Heavyweight',
      },
      {
        personaId: 'connoisseur',
        name: 'Julian "Vibe Connoisseur"',
        role: 'Nocturnal Music Curator & DJ',
        score: Math.min(
          10,
          round1(subScores.albumFlow * 0.5 + subScores.cohesion * 0.5)
        ),
        quote:
          abruptBpmCount > 0
            ? `Detected ${abruptBpmCount} abrupt BPM jumps. Smooth out tempo changes between your street anthems and slow jams.`
            : `The transition flow into "${midTrack}" brought real atmospheric warmth to the soundscape.`,
        detailedAnalysis: `Atmospheric balance sits at ${energyMetrics.status}. BPM transitions are ${
          abruptBpmCount === 0 ? 'harmoniously aligned' : 'unpredictable'
        }.`,
        keyHighlight: midTrack,
        badge: 'Midnight Certified',
      },
    ],
    monopolyReport,
    energyMetrics,
    highlights: [
      energyMetrics.status === 'Optimal Pacing'
        ? 'Pacing Masterclass: Zero listener fatigue detected'
        : `Pacing Status: ${energyMetrics.status}`,
      monopolyReport.hasViolation
        ? `Monopoly Penalty (-${monopolyReport.totalPenaltyDeduction} pts): ${monopolyReport.penalizedArtists
            .map((p) => p.artist)
            .join(', ')} overload`
        : 'Roster Diversity Bonus: Perfect solo artist distribution',
    ],
    bestPossibleScore: theoreticalOptimalScore,
    draftEfficiency: Math.round((finalScore / theoreticalOptimalScore) * 100),
    bestPossibleTracklist: optimalPicks.map((p) => ({
      slotName: p.slotName,
      songTitle: p.bestSongTitle,
      artist: p.bestArtist,
      scoreDelta: 0,
    })),
    categoryScores: transparent.categoryScores,
    weightedScoreBeforePenalties: transparent.weightedScoreBeforePenalties,
    appliedPenalties: transparent.appliedPenalties,
    executiveSummary: `This ${mode === 'album' ? 'album' : 'project'} scores ${Math.round(transparent.weightedScoreBeforePenalties)}/100 before disclosed penalties. The strongest signal is ${transparent.categoryScores.slotFit.score >= transparent.categoryScores.sequencingFlow.score ? 'slot fit' : 'sequencing flow'}; the next gain is to sharpen the weakest transition while preserving the project’s identity.`,
    strongestChoice: {
      position: draftedTracks.findIndex((track) => track.song.impact >= 85) + 1 || 1,
      reason: 'This choice combines strong catalog impact with a clear positional role.',
    },
    weakestTransition: {
      fromPosition: Math.max(1, energyMetrics.bpmTransitions.findIndex((transition) => transition.status === 'abrupt') + 1),
      toPosition: Math.max(2, energyMetrics.bpmTransitions.findIndex((transition) => transition.status === 'abrupt') + 2),
      reason: energyMetrics.bpmTransitions.some((transition) => transition.status === 'abrupt')
        ? 'This is the sharpest available tempo transition; make the contrast feel intentional with mood or texture.'
        : 'No single transition is a clear weak point; preserve the current sequencing logic.',
    },
    recommendedChange: {
      action: energyMetrics.bpmTransitions.some((transition) => transition.status === 'abrupt') ? 'move' : 'keep',
      position: 1,
      suggestion: energyMetrics.bpmTransitions.some((transition) => transition.status === 'abrupt')
        ? 'Try moving the most contrasting track next to the project’s emotional turn or interlude.'
        : 'Keep the current order and consider one tasteful discovery pick on the next build.',
    },
    source: 'fallback',
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type _FallbackMode = GameMode;
