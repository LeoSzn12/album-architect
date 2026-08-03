import type {
  AppliedPenalty,
  CategoryScorecard,
  DraftedTrack,
  EnergyMetrics,
  MonopolyReport,
} from '../types/draft.ts';

export const SCORE_WEIGHTS = {
  slotFit: 20,
  sequencingFlow: 20,
  narrativeConcept: 15,
  varietyBalance: 15,
  energyCurve: 10,
  originalityTaste: 10,
  replayValue: 10,
} as const;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function evidence(score: number, ...items: string[]) {
  return { score: clamp(score), evidence: items.filter(Boolean).slice(0, 3) };
}

export function buildTransparentScorecard(
  draftedTracks: DraftedTrack[],
  monopolyReport: MonopolyReport,
  energyMetrics: EnergyMetrics
): { categoryScores: CategoryScorecard; weightedScoreBeforePenalties: number; appliedPenalties: AppliedPenalty[] } {
  const count = draftedTracks.length || 1;
  const slotFit = draftedTracks.length
    ? draftedTracks.reduce((sum, track) => {
        const delta = Math.abs(track.song.energy - track.slot.targetEnergy.ideal);
        const tagBonus = (track.song.slots ?? []).includes(track.slot.id) ? 12 : 0;
        return sum + Math.max(0, 100 - delta * 1.35 + tagBonus);
      }, 0) / count
    : 0;

  const uniqueArtists = new Set(draftedTracks.map((track) => track.song.artist)).size;
  const uniqueGenres = new Set(draftedTracks.map((track) => track.song.genre)).size;
  const featureCount = draftedTracks.filter((track) => (track.song.featuredArtists ?? []).length > 0).length;
  const peakIndex = draftedTracks.reduce(
    (best, track, index, list) => (track.song.energy > (list[best]?.song.energy ?? -1) ? index : best),
    0
  );
  const firstEnergy = draftedTracks[0]?.song.energy ?? 0;
  const lastEnergy = draftedTracks.at(-1)?.song.energy ?? 0;
  const peakEnergy = draftedTracks[peakIndex]?.song.energy ?? 0;
  const hasArc = draftedTracks.length >= 3 && peakIndex > 0 && peakIndex < draftedTracks.length - 1 && lastEnergy < peakEnergy;
  const varietyRatio = uniqueArtists / count;
  const avgImpact = draftedTracks.length
    ? draftedTracks.reduce((sum, track) => sum + track.song.impact, 0) / draftedTracks.length
    : 0;
  const riskCount = draftedTracks.filter((track) => (track.song.archetypes ?? []).includes('experimental') || (track.song.archetypes ?? []).includes('value-pick')).length;
  const highImpactCount = draftedTracks.filter((track) => track.song.impact >= 85).length;

  const slot = evidence(
    slotFit,
    `${draftedTracks.filter((track) => (track.song.slots ?? []).includes(track.slot.id)).length}/${draftedTracks.length || 0} picks carry an explicit slot tag.`,
    `Average energy distance from the assigned slot target is ${draftedTracks.length ? Math.round(draftedTracks.reduce((sum, track) => sum + Math.abs(track.song.energy - track.slot.targetEnergy.ideal), 0) / count) : 0} points.`
  );
  const flow = evidence(
    58 + (hasArc ? 22 : 0) - energyMetrics.fatigueScore * 0.18 - energyMetrics.bpmTransitions.filter((t) => t.status === 'abrupt').length * 7,
    hasArc ? 'The sequence builds toward an interior peak before resolving.' : 'The current sequence does not yet show a clear rise-and-release arc.',
    `${energyMetrics.bpmTransitions.filter((t) => t.status === 'abrupt').length} abrupt tempo transition(s) are treated as evidence, not an automatic failure.`
  );
  const narrative = evidence(
    52 + (hasArc ? 20 : 0) + (firstEnergy > lastEnergy ? 8 : 0) + (uniqueGenres <= Math.max(2, Math.ceil(count * 0.6)) ? 10 : 0),
    hasArc ? 'A distinct setup → peak → resolution shape is visible.' : 'Add more intentional contrast between the opening, center, and close.',
    `${uniqueGenres} genre lane(s) are represented across the project.`
  );
  const variety = evidence(
    45 + varietyRatio * 45 + (featureCount > 0 ? 10 : 0) - (monopolyReport.hasViolation ? 12 : 0),
    `${uniqueArtists} lead artist(s) across ${draftedTracks.length || 0} picks; ${featureCount} track(s) add featured collaborators.`,
    monopolyReport.hasViolation ? `Repeated solo artist penalty is disclosed separately: −${monopolyReport.totalPenaltyDeduction} points.` : 'No repeated-solo-artist penalty is active.'
  );
  const energy = evidence(
    72 - energyMetrics.fatigueScore * 0.22 - Math.abs(energyMetrics.avgEnergy - 68) * 0.25 + (hasArc ? 12 : 0),
    `Average energy is ${energyMetrics.avgEnergy}% with status “${energyMetrics.status}”.`,
    hasArc ? 'Energy includes a purposeful peak and release.' : 'The energy curve would benefit from a stronger reset or climax.'
  );
  const originality = evidence(
    48 + (riskCount / count) * 32 + (uniqueArtists / count) * 12 + (avgImpact < 85 ? 8 : 0),
    `${riskCount} pick(s) are tagged as experimental or value-forward risks.`,
    avgImpact < 85 ? 'The project leaves room for a few more left-field choices.' : 'The tracklist has strong cultural signal while retaining some risk.'
  );
  const replay = evidence(
    46 + (highImpactCount / count) * 34 + (hasArc ? 15 : 0) + (featureCount > 0 ? 5 : 0),
    `${highImpactCount} track(s) score 85+ on the catalog impact signal.`,
    hasArc ? 'The sequence has a reason to be experienced front-to-back.' : 'A clearer ending payoff would strengthen repeat listening.'
  );

  const categoryScores: CategoryScorecard = {
    slotFit: { ...slot, weight: SCORE_WEIGHTS.slotFit, note: 'Role alignment and target-energy fit.' },
    sequencingFlow: { ...flow, weight: SCORE_WEIGHTS.sequencingFlow, note: 'Transitions, pacing, and adjacency.' },
    narrativeConcept: { ...narrative, weight: SCORE_WEIGHTS.narrativeConcept, note: 'Whether the project communicates an arc.' },
    varietyBalance: { ...variety, weight: SCORE_WEIGHTS.varietyBalance, note: 'Contrast without losing identity.' },
    energyCurve: { ...energy, weight: SCORE_WEIGHTS.energyCurve, note: 'Intentional rises, resets, and resolution.' },
    originalityTaste: { ...originality, weight: SCORE_WEIGHTS.originalityTaste, note: 'Distinctive choices and productive risk.' },
    replayValue: { ...replay, weight: SCORE_WEIGHTS.replayValue, note: 'Memorable moments and whole-project pull.' },
  };
  const weightedScoreBeforePenalties = Math.round(
    Object.values(categoryScores).reduce((sum, category) => sum + category.score * category.weight, 0)
  ) / 100;
  const appliedPenalties: AppliedPenalty[] = monopolyReport.penalizedArtists.map((penalty) => ({
    code: 'repeated_lead_artist',
    points: penalty.deductionPoints * 10,
    explanation: `${penalty.artist} appears as the lead artist on ${penalty.soloCount} solo tracks.`,
  }));

  return { categoryScores, weightedScoreBeforePenalties, appliedPenalties };
}
