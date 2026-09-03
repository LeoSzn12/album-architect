import type {
  Song,
  DraftSlot,
  DraftedTrack,
  CandidateFlowInsight,
  SlotId,
} from '../types/draft.ts';
import { SONG_LIBRARY } from '../data/songs.ts';

/**
 * Computes deep A&R transition intelligence, tempo delta, and flow synergy score
 * between a candidate song and the current draft progression.
 */
export function computeCandidateInsight(
  candidate: Song,
  currentSlot: DraftSlot,
  draftedTracks: DraftedTrack[],
  draftedSoloArtists: string[]
): CandidateFlowInsight {
  const prevDrafted = draftedTracks.length > 0 ? draftedTracks[draftedTracks.length - 1] : null;
  const prevSong = prevDrafted ? prevDrafted.song : null;

  // 1. Slot Energy Match (Up to 35 pts)
  const idealEnergy = currentSlot.targetEnergy.ideal;
  const energyDiff = Math.abs(candidate.energy - idealEnergy);
  const energyScore = Math.max(0, 35 - energyDiff * 0.7);

  // 2. Slot Affinity Match (Up to 30 pts)
  const rawAffinity =
    candidate.slotAffinity?.[currentSlot.id] ??
    (candidate.slots.includes(currentSlot.id) ? 80 : 45);
  const affinityScore = (rawAffinity / 100) * 30;

  // 3. BPM Transition & Pacing (Up to 20 pts)
  let bpmDelta = 0;
  let bpmTransitionLabel = 'Opening Tempo';
  let bpmScore = 20;

  if (prevSong) {
    bpmDelta = candidate.bpm - prevSong.bpm;
    const isDoubleTime =
      Math.abs(candidate.bpm - prevSong.bpm * 2) <= 6 ||
      Math.abs(candidate.bpm * 2 - prevSong.bpm) <= 6;

    if (isDoubleTime) {
      bpmTransitionLabel = '2× Halftime Groove Lock';
      bpmScore = 20;
    } else if (Math.abs(bpmDelta) <= 5) {
      bpmTransitionLabel = `Locked ±${Math.abs(bpmDelta)} BPM`;
      bpmScore = 20;
    } else if (Math.abs(bpmDelta) <= 15) {
      bpmTransitionLabel = `${bpmDelta >= 0 ? '+' : ''}${bpmDelta} BPM Natural Ramp`;
      bpmScore = 17;
    } else if (Math.abs(bpmDelta) <= 28) {
      bpmTransitionLabel = `${bpmDelta >= 0 ? '+' : ''}${bpmDelta} BPM Gear Shift`;
      bpmScore = 14;
    } else {
      bpmTransitionLabel = `${bpmDelta >= 0 ? '+' : ''}${bpmDelta} BPM Dynamic Twist`;
      bpmScore = 11;
    }
  }

  // 4. Monopoly & Diversity Defense (Bonus or Penalty)
  let diversityScore = 0;
  const isSoloDuplicate = draftedSoloArtists.includes(candidate.artist.trim());
  if (isSoloDuplicate) {
    diversityScore = -25; // Heavy penalty warning
  } else {
    diversityScore = 10; // Clean artist diversity bonus
    if (candidate.featuredArtists.length > 0) {
      diversityScore += 5; // Textural feature bonus
    }
  }

  // 5. Impact & Acclaim (Up to 10 pts)
  const impactScore = (candidate.impact / 100) * 5;
  const acclaimScore = ((candidate.acclaim ?? 85) / 100) * 5;

  // Composite Synergy (0 to 100)
  const rawSynergy =
    energyScore + affinityScore + bpmScore + diversityScore + impactScore + acclaimScore;
  const synergyScore = Math.min(99, Math.max(35, Math.round(rawSynergy)));

  // Pacing Label
  let pacingLabel = 'Balanced Progression';
  if (energyDiff <= 4) {
    pacingLabel = 'Near-Perfect Pacing';
  } else if (candidate.energy >= 88) {
    pacingLabel = 'High-Voltage Peak';
  } else if (candidate.energy <= 55) {
    pacingLabel = 'Subtle Cooldown';
  } else if (prevSong && candidate.energy > prevSong.energy + 15) {
    pacingLabel = 'Surge in Intensity';
  } else if (prevSong && candidate.energy < prevSong.energy - 15) {
    pacingLabel = 'Intimate De-escalation';
  }

  // Dynamic Curator Commentary
  const curatorInsight = generateCuratorCommentary(
    candidate,
    currentSlot,
    prevSong,
    bpmDelta,
    isSoloDuplicate
  );

  // Strategic Tag
  let tag = 'VIBE FIT';
  let tagColor: CandidateFlowInsight['tagColor'] = 'purple';

  if (isSoloDuplicate) {
    tag = 'MONOPOLY RISK';
    tagColor = 'pink';
  } else if (rawAffinity >= 95 && energyDiff <= 6) {
    tag = 'PERFECT SLOT FIT';
    tagColor = 'emerald';
  } else if (candidate.archetypes.includes('value-pick') || (candidate.acclaim ?? 0) >= 96) {
    tag = 'CRITIC DARLING';
    tagColor = 'cyan';
  } else if (candidate.archetypes.includes('experimental')) {
    tag = 'SONIC RISK';
    tagColor = 'amber';
  } else if (candidate.recognition >= 98) {
    tag = 'HEADLINER BANGER';
    tagColor = 'emerald';
  }

  const isSleeperGem =
    !isSoloDuplicate &&
    (candidate.recognition <= 86 || candidate.archetypes.includes('value-pick')) &&
    rawAffinity >= 80;

  return {
    synergyScore,
    isTopCuratorPick: false, // will be assigned in batch
    isSleeperGem,
    bpmDelta,
    bpmTransitionLabel,
    energyDelta: prevSong ? candidate.energy - prevSong.energy : 0,
    pacingLabel,
    curatorInsight,
    tag,
    tagColor,
  };
}

function generateCuratorCommentary(
  candidate: Song,
  slot: DraftSlot,
  prevSong: Song | null,
  bpmDelta: number,
  isSoloDuplicate: boolean
): string {
  if (isSoloDuplicate) {
    return `⚠️ High Monopoly Penalty risk: Drafting another solo track by ${candidate.artist} triggers an immediate scoring deduction.`;
  }

  if (!prevSong) {
    // Opener round
    if (candidate.isActualAlbumOpener) {
      return `Masterful intro: Genuine album opener that instantly sets the album's identity and gravity.`;
    }
    return `High-recognition opening statement delivering an immediate ${candidate.energy}% energy punch.`;
  }

  if (slot.id === 'cinematic-outro') {
    if (candidate.isActualAlbumCloser) {
      return `Definitive closer: Resolves the tracklist narrative with iconic concluding weight.`;
    }
    return `Cinematic decompression leaving a lingering, memorable emotional imprint.`;
  }

  if (slot.id === 'late-night-rnb' || slot.id === 'acoustic-unplugged') {
    return `Softens the tempo out of "${prevSong.title}" with rich melodic warmth and vocal intimacy.`;
  }

  if (slot.id === 'mid-interlude') {
    return `Critical transitional palate cleanser resetting listener ear-fatigue before the second act.`;
  }

  if (slot.id === 'club-bounce' || slot.id === 'apex-climax') {
    return `Max-impact centerpiece igniting explosive replay momentum at ${candidate.bpm} BPM.`;
  }

  if (Math.abs(bpmDelta) <= 6) {
    return `Locked groove: Glides cleanly out of "${prevSong.title}" with matching cadence.`;
  }

  if (candidate.featuredArtists.length > 0) {
    return `Introduces rich collaborative texture featuring ${candidate.featuredArtists.join(', ')} without solo penalty.`;
  }

  return `Pushes the narrative arc forward with signature ${candidate.typeTag} styling.`;
}

/**
 * Enriches an array of candidate songs with flow intelligence and tags the top A&R recommendation.
 */
export function enrichCandidatesWithFlowIntelligence(
  candidates: Song[],
  currentSlot: DraftSlot,
  draftedTracks: DraftedTrack[],
  draftedSoloArtists: string[]
): Song[] {
  const insights = candidates.map((c) =>
    computeCandidateInsight(c, currentSlot, draftedTracks, draftedSoloArtists)
  );

  // Find the single highest synergy candidate that is NOT a monopoly duplicate
  let bestIdx = -1;
  let highestScore = -1;

  insights.forEach((ins, idx) => {
    if (ins.tag !== 'MONOPOLY RISK' && ins.synergyScore > highestScore) {
      highestScore = ins.synergyScore;
      bestIdx = idx;
    }
  });

  if (bestIdx !== -1) {
    insights[bestIdx].isTopCuratorPick = true;
    insights[bestIdx].tag = 'A&R TOP RECOMMENDATION';
    insights[bestIdx].tagColor = 'emerald';
  }

  return candidates.map((song, idx) => ({
    ...song,
    flowInsight: insights[idx],
  }));
}

/**
 * Selects a high-affinity Surprise Wildcard from the catalog that has NOT been drafted yet.
 * Used by the "Surprise Shuffle / Wildcard" feature.
 */
export function pickWildcardCandidate(
  slotId: SlotId,
  draftedSongIds: string[],
  draftedSoloArtists: string[]
): Song | null {
  const draftedSet = new Set(draftedSongIds);
  const draftedSoloSet = new Set(draftedSoloArtists.map((a) => a.trim()));

  // Prioritize eligible songs for this slot that don't trigger monopoly penalties
  const eligible = SONG_LIBRARY.filter(
    (s) =>
      !draftedSet.has(s.id) &&
      (s.slots.includes(slotId) || (s.slotAffinity && (s.slotAffinity[slotId] ?? 0) >= 65))
  );

  const safePool = eligible.filter((s) => !draftedSoloSet.has(s.artist.trim()));
  const pool = safePool.length > 0 ? safePool : eligible;

  if (pool.length === 0) return null;

  // Pick a random exciting track from top candidates
  const randomIndex = Math.floor(Math.random() * pool.length);
  const picked = pool[randomIndex];

  return {
    ...picked,
    typeTag: `🃏 Wildcard Gem: ${picked.typeTag}`,
  };
}
