import {
  GameMode,
  DraftedTrack,
  MonopolyReport,
  EnergyMetrics,
  EvaluationResult,
  EraFilter,
} from '@/types/draft';
import { findOptimalPickForSlot } from '@/data/songs';

/**
 * Canonical A&R fallback evaluator.
 *
 * SINGLE SOURCE OF TRUTH — imported by both the API route
 * (`src/app/api/critic-evaluate/route.ts`) and the Zustand store
 * (`src/store/useDraftStore.ts`), so that a draft scored locally (network
 * failure) and a draft scored on the server (no Gemini API key) produce
 * byte-identical results. Without this unification the two paths diverged —
 * the route hardcoded `rawScore: 9.5` while the store computed weighted
 * sub-scores, yielding different scores for the *same* draft depending on
 * whether the fetch succeeded.
 *
 * Formula (documented for audit reproducibility):
 *
 *   pacing     = clamp(4,10, round(10 - avgPacingDelta/15 - fatigueScore/30))
 *   synergy    = clamp(4,10, 7.5 + featureRatio*2 - abruptBpmCount*0.8)
 *   cohesion   = clamp(3,10, 9.8 - totalPenalty - pacingDisturbance)
 *   starPower  = clamp(5,10, avgEnergy/15 + highEnergyCount*0.4 + 3)
 *   overall    = clamp(4,10, 0.30·pacing + 0.25·synergy + 0.25·cohesion + 0.20·starPower)
 *
 *   Diamond Classic  ≥ 9.2
 *   Platinum Banger  ≥ 8.5
 *   Gold Solid       ≥ 7.5
 *   Mixtape Cut      otherwise
 */
export function generateFallbackEvaluation(
  mode: GameMode,
  draftedTracks: DraftedTrack[],
  monopolyReport: MonopolyReport,
  energyMetrics: EnergyMetrics,
  eraFilter: EraFilter = 'all'
): EvaluationResult {
  // 1. Pacing score: energy delta per slot from slot.targetEnergy.ideal
  let totalPacingDelta = 0;
  draftedTracks.forEach((dt) => {
    totalPacingDelta += Math.abs(dt.song.energy - dt.slot.targetEnergy.ideal);
  });
  const avgPacingDelta =
    draftedTracks.length > 0 ? totalPacingDelta / draftedTracks.length : 0;
  const pacingSubScore = clamp(
    4.0,
    10.0,
    round1(10 - avgPacingDelta / 15 - energyMetrics.fatigueScore / 30)
  );

  // 2. Synergy sub-score: feature usage + smooth BPM transitions
  const tracksWithFeatures = draftedTracks.filter(
    (dt) => dt.song.featuredArtists.length > 0
  ).length;
  const featureRatio =
    draftedTracks.length > 0 ? tracksWithFeatures / draftedTracks.length : 0;
  const abruptBpmCount = energyMetrics.bpmTransitions.filter(
    (t) => t.status === 'abrupt'
  ).length;
  const synergySubScore = clamp(
    4.0,
    10.0,
    round1(7.5 + featureRatio * 2.0 - abruptBpmCount * 0.8)
  );

  // 3. Cohesion sub-score: monopoly penalty impact + smooth narrative flow
  const pacingDisturbance =
    energyMetrics.status !== 'Optimal Pacing' ? 1.0 : 0;
  const cohesionSubScore = clamp(
    3.0,
    10.0,
    round1(9.8 - monopolyReport.totalPenaltyDeduction - pacingDisturbance)
  );

  // 4. Star Power sub-score: average energy + iconic high-energy cuts
  const avgEnergy = energyMetrics.avgEnergy;
  const highEnergyCount = draftedTracks.filter(
    (dt) => dt.song.energy >= 85
  ).length;
  const starPowerSubScore = clamp(
    5.0,
    10.0,
    round1(avgEnergy / 15 + highEnergyCount * 0.4 + 3.0)
  );

  // Overall — weighted average of sub-scores (provenance preserved as rawScore)
  const rawScore = round1(
    pacingSubScore * 0.3 +
      synergySubScore * 0.25 +
      cohesionSubScore * 0.25 +
      starPowerSubScore * 0.2
  );
  const finalScore = clamp(4.0, 10.0, rawScore);

  const gradeBadge =
    finalScore >= 9.2
      ? 'Diamond Classic'
      : finalScore >= 8.5
      ? 'Platinum Banger'
      : finalScore >= 7.5
      ? 'Gold Solid'
      : 'Mixtape Cut';

  // Compute locally-optimal picks by scanning the library per slot, honoring
  // the player's prior selections so the monotonic artist list matches their
  // draft order. (The greedy pick is "optimal given prior picks," not the
  // global optimum — copy reflects this.)
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

  const theoreticalOptimalScore = Math.min(
    9.9,
    Math.max(8.8, round1(9.5 + (eraFilter !== 'all' ? 0.3 : 0)))
  );

  // Specific track references for persona quotes
  const openerSong = draftedTracks[0]?.song.title || 'Track 1';
  const midTrack =
    draftedTracks[Math.floor(draftedTracks.length / 2)]?.song.title ||
    'Midpoint Track';
  const climaxTrack =
    draftedTracks.find(
      (dt) => dt.slot.id === 'apex-climax' || dt.song.energy >= 90
    )?.song.title ||
    draftedTracks[draftedTracks.length - 1]?.song.title ||
    'Climax Track';

  return {
    overallScore: finalScore,
    rawScore,
    monopolyPenalty: monopolyReport.totalPenaltyDeduction,
    gradeBadge,
    subScores: {
      pacing: pacingSubScore,
      synergy: synergySubScore,
      cohesion: cohesionSubScore,
      starPower: starPowerSubScore,
    },
    reviews: [
      {
        personaId: 'purist',
        name: 'Marcus "The Purist"',
        role: 'Boom-Bap Historian & A&R Head',
        score: Math.min(10, round1(cohesionSubScore * 0.6 + pacingSubScore * 0.4)),
        quote: monopolyReport.hasViolation
          ? `Solo monopoly penalties hurt your lyricism cohesion score. Overusing ${monopolyReport.penalizedArtists[0]?.artist} diluted the project dynamic!`
          : `Opening with "${openerSong}" set a pristine foundation. Clean execution across all ${draftedTracks.length} slots.`,
        detailedAnalysis: `Sequencing architecture held up well. Track transition into "${midTrack}" provided crucial narrative breath before "${climaxTrack}".`,
        keyHighlight: openerSong,
        badge: 'Lyricism Approved',
      },
      {
        personaId: 'exec',
        name: 'Chloe "Data Exec"',
        role: 'Global Streaming Strategy Director',
        score: Math.min(10, round1(starPowerSubScore * 0.6 + synergySubScore * 0.4)),
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
        score: Math.min(10, round1(pacingSubScore * 0.5 + synergySubScore * 0.5)),
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
    optimalScore: theoreticalOptimalScore,
    optimalPicks,
    source: 'fallback',
  };
}

/** Round to 1 decimal place. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Clamp n to the closed interval [lo, hi]. */
function clamp(lo: number, hi: number, n: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Keep `mode` in the signature for API parity; it is intentionally unused by
// the current formula but reserved for future mode-weighted tuning.
export type _FallbackMode = GameMode;
