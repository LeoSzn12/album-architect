/**
 * Shared draft computation helpers.
 * Extracted from useDraftStore so they can be imported by both the store
 * and the scoring/optimizer modules without circular dependencies.
 */

import { DraftedTrack, MonopolyReport, EnergyMetrics, Song } from '@/types/draft';

export function computeMonopolyReport(drafted: DraftedTrack[]): MonopolyReport {
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
    const primaryArtist = song.artist.trim();
    if (!counts[primaryArtist]) {
      counts[primaryArtist] = { solo: 0, featured: 0, total: 0, soloTracks: [], featuredTracks: [] };
    }
    counts[primaryArtist].solo += 1;
    counts[primaryArtist].total += 1;
    counts[primaryArtist].soloTracks.push(song);

    song.featuredArtists.forEach((feat) => {
      const featArtist = feat.trim();
      if (!counts[featArtist]) {
        counts[featArtist] = { solo: 0, featured: 0, total: 0, soloTracks: [], featuredTracks: [] };
      }
      counts[featArtist].featured += 1;
      counts[featArtist].total += 1;
      counts[featArtist].featuredTracks.push(song);
    });
  });

  const penalizedArtists: { artist: string; soloCount: number; deductionPoints: number }[] = [];
  let totalPenaltyDeduction = 0;

  Object.entries(counts).forEach(([artist, data]) => {
    if (data.solo > 1) {
      const deduction = data.solo === 2 ? 1.5 : 1.5 + (data.solo - 2) * 2.0;
      penalizedArtists.push({ artist, soloCount: data.solo, deductionPoints: deduction });
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

export function computeEnergyMetrics(drafted: DraftedTrack[]): EnergyMetrics {
  const curve = drafted.map((d) => d.song.energy);
  if (curve.length === 0) {
    return { curve: [], avgEnergy: 0, fatigueScore: 0, status: 'Optimal Pacing', bpmTransitions: [] };
  }

  const avgEnergy = Math.round(curve.reduce((a, b) => a + b, 0) / curve.length);

  let highEnergyConsecutive = 0;
  let maxConsecutiveHigh = 0;
  for (const energy of curve) {
    if (energy >= 85) {
      highEnergyConsecutive++;
      maxConsecutiveHigh = Math.max(maxConsecutiveHigh, highEnergyConsecutive);
    } else {
      highEnergyConsecutive = 0;
    }
  }

  const bpmTransitions: EnergyMetrics['bpmTransitions'] = [];
  for (let i = 0; i < drafted.length - 1; i++) {
    const from = drafted[i].song.bpm;
    const to = drafted[i + 1].song.bpm;
    const delta = Math.abs(to - from);
    let status: EnergyMetrics['bpmTransitions'][0]['status'] = 'smooth';
    if (delta > 35) status = 'abrupt';
    else if (to > from + 10) status = 'building';
    else if (to < from - 15) status = 'chilled';
    bpmTransitions.push({ from, to, delta, status });
  }

  const fatigueScore = Math.min(100, maxConsecutiveHigh * 25);
  let status: EnergyMetrics['status'] = 'Optimal Pacing';
  if (fatigueScore >= 75) status = 'High Energy Overload';
  else if (avgEnergy < 45) status = 'Vibe Lull';
  else if (bpmTransitions.some((t) => t.status === 'abrupt')) status = 'Wild Energy Spikes';

  return { curve, avgEnergy, fatigueScore, status, bpmTransitions };
}
