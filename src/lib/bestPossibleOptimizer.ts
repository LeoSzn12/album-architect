/**
 * Best-Possible Draft Optimizer — Album Architect: Rap Draft
 *
 * Calculates the highest-scoring valid album that COULD have been built from
 * the exact candidate pools the player was shown (including all rerolled pools).
 *
 * For a 7-round game with 4 candidates per round:
 *   4^7 = 16,384 base combinations — exhaustive search is fast (~5ms).
 *
 * Monopoly rules are enforced: a combination where any artist appears as
 * solo primary on 2+ tracks incurs a penalty (same formula as the scorer).
 *
 * Returns:
 *   - bestPossibleScore     — highest achievable score from these pools
 *   - draftEfficiency       — player score / best possible × 100
 *   - bestPossibleTracklist — the optimal song per slot
 *   - biggestMistake        — the slot where the player cost themselves the most
 *   - smartestPick          — the slot where the player chose better than expected
 */

import { CandidateRound, DraftedTrack, Song, DraftSlot } from '@/types/draft';
import { scoreDraft } from '@/lib/scoringEngine';
import { computeMonopolyReport, computeEnergyMetrics } from '@/lib/draftMetrics';

export interface BestPossibleResult {
  bestPossibleScore: number;
  draftEfficiency: number;  // 0–100
  bestPossibleTracklist: {
    slotName: string;
    songTitle: string;
    artist: string;
    scoreDelta: number;  // positive = player did better, negative = player cost themselves
  }[];
  biggestMistake: {
    slotName: string;
    playerPick: string;
    bestAvailable: string;
    scoreDifference: number;
  } | null;
  smartestPick: {
    slotName: string;
    songTitle: string;
    reason: string;
  } | null;
}

/**
 * Returns the superset of all unique songs the player was shown for each round.
 * (Initial pool ∪ all rerolled pools for that round.)
 */
function getAvailablePoolForRound(round: CandidateRound): Song[] {
  const seen = new Set<string>();
  const combined: Song[] = [];
  for (const pool of round.pools) {
    for (const song of pool) {
      if (!seen.has(song.id)) {
        seen.add(song.id);
        combined.push(song);
      }
    }
  }
  return combined;
}

/**
 * Compute the best possible result from the candidate pools the player saw.
 *
 * @param candidateHistory — full history of pools shown (recorded by the store)
 * @param playerDraftedTracks — the player's actual picks (for comparison)
 * @param slots — the slot definitions in order
 */
export function computeBestPossible(
  candidateHistory: CandidateRound[],
  playerDraftedTracks: DraftedTrack[],
  slots: DraftSlot[]
): BestPossibleResult | null {
  if (candidateHistory.length === 0 || playerDraftedTracks.length === 0) return null;

  // Build available pool per round
  const poolsPerRound = candidateHistory.map(getAvailablePoolForRound);
  const roundCount = poolsPerRound.length;

  // Verify we have options in every round
  if (poolsPerRound.some((p) => p.length === 0)) return null;

  // Exhaustive search is exact for the seven-round modes, but 4^14 album
  // combinations would block the request for minutes. Switch to a bounded,
  // deterministic beam search once the search space becomes too large.
  let bestScore = -Infinity;
  let bestCombo: Song[] = [];
  const searchSpace = poolsPerRound.reduce((total, pool) => total * pool.length, 1);
  const exhaustiveLimit = 250_000;

  if (searchSpace <= exhaustiveLimit) {
    const indices = new Array<number>(roundCount).fill(0);

    outer: while (true) {
      const combo: DraftedTrack[] = indices.map((songIdx, roundIdx) => ({
        slot: slots[roundIdx] ?? playerDraftedTracks[roundIdx]?.slot,
        song: poolsPerRound[roundIdx][songIdx],
        roundDrafted: roundIdx + 1,
        isWildcard: false,
      })).filter((dt) => dt.slot !== undefined);

      if (combo.length === roundCount) {
        const monopoly = computeMonopolyReport(combo);
        const energy = computeEnergyMetrics(combo);
        const result = scoreDraft(combo, monopoly, energy);
        if (result.finalScore > bestScore) {
          bestScore = result.finalScore;
          bestCombo = combo.map((dt) => dt.song);
        }
      }

      let pos = roundCount - 1;
      while (pos >= 0) {
        indices[pos]++;
        if (indices[pos] < poolsPerRound[pos].length) break;
        indices[pos] = 0;
        pos--;
      }
      if (pos < 0) break outer;
    }
  } else {
    const beamWidth = 512;
    let beam: DraftedTrack[][] = [[]];

    for (let roundIdx = 0; roundIdx < roundCount; roundIdx++) {
      const slot = slots[roundIdx] ?? playerDraftedTracks[roundIdx]?.slot;
      if (!slot) return null;

      const expanded = beam.flatMap((partial) => poolsPerRound[roundIdx].map((song) => {
        const draft = [...partial, { slot, song, roundDrafted: roundIdx + 1, isWildcard: false }];
        const monopoly = computeMonopolyReport(draft);
        const energy = computeEnergyMetrics(draft);
        return { draft, score: scoreDraft(draft, monopoly, energy).finalScore };
      }));

      expanded.sort((a, b) => b.score - a.score || a.draft.map((track) => track.song.id).join('|').localeCompare(b.draft.map((track) => track.song.id).join('|')));
      beam = expanded.slice(0, beamWidth).map((entry) => entry.draft);
    }

    const best = beam[0];
    if (best) {
      const monopoly = computeMonopolyReport(best);
      const energy = computeEnergyMetrics(best);
      bestScore = scoreDraft(best, monopoly, energy).finalScore;
      bestCombo = best.map((dt) => dt.song);
    }
  }

  const playerScore = (() => {
    const monopoly = computeMonopolyReport(playerDraftedTracks);
    const energy   = computeEnergyMetrics(playerDraftedTracks);
    return scoreDraft(playerDraftedTracks, monopoly, energy).finalScore;
  })();

  const draftEfficiency = bestScore > 0
    ? Math.round((playerScore / bestScore) * 100)
    : 100;

  // Build tracklist comparison
  const bestPossibleTracklist = bestCombo.map((song, idx) => {
    const slot = slots[idx] ?? playerDraftedTracks[idx]?.slot;
    const playerSong = playerDraftedTracks[idx]?.song;

    // Score this slot in isolation by scoring a single-song draft (simplified)
    // We compare slot fit energy delta as a proxy for slot-level contribution
    const playerDelta = playerSong
      ? Math.abs(playerSong.energy - (slot?.targetEnergy.ideal ?? 75))
      : 100;
    const bestDelta = Math.abs(song.energy - (slot?.targetEnergy.ideal ?? 75));
    const scoreDelta = round1(playerDelta - bestDelta); // positive = player was worse

    return {
      slotName: slot?.name ?? `Round ${idx + 1}`,
      songTitle: song.title,
      artist: song.rawArtistString,
      scoreDelta,
    };
  });

  // Biggest mistake: slot with the worst scoreDelta for player
  const mistakes = bestPossibleTracklist
    .map((item, idx) => ({ ...item, idx }))
    .filter((item) => item.scoreDelta > 0)
    .sort((a, b) => b.scoreDelta - a.scoreDelta);

  const biggestMistake = mistakes.length > 0
    ? {
        slotName: mistakes[0].slotName,
        playerPick: playerDraftedTracks[mistakes[0].idx]?.song.title ?? '—',
        bestAvailable: mistakes[0].songTitle,
        scoreDifference: round1(mistakes[0].scoreDelta * 0.06), // scale to score points
      }
    : null;

  // Smartest pick: slot where player matched best available (scoreDelta ≤ 0)
  const smartPicks = bestPossibleTracklist
    .map((item, i) => ({ ...item, idx: i }))
    .filter((item) => item.scoreDelta <= 0 && playerDraftedTracks[item.idx]?.song.energy !== undefined);

  const smartestPick = smartPicks.length > 0
    ? (() => {
        const pick = smartPicks[0];
        const playerSong = playerDraftedTracks[pick.idx]?.song;
        return {
          slotName: pick.slotName,
          songTitle: playerSong?.title ?? '—',
          reason: `Optimal or near-optimal choice given available options (energy: ${playerSong?.energy}%).`,
        };
      })()
    : null;

  return {
    bestPossibleScore: round1(bestScore),
    draftEfficiency: clamp(0, 100, draftEfficiency),
    bestPossibleTracklist,
    biggestMistake,
    smartestPick,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(lo: number, hi: number, n: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Convenience wrapper used by the API route.
 * Takes the player's drafted tracks and the full candidate history;
 * delegates to computeBestPossible with the slot definitions inferred
 * from the drafted tracks themselves.
 */
export function runBestPossibleOptimizer(
  playerDraftedTracks: DraftedTrack[],
  candidateHistory: CandidateRound[]
): BestPossibleResult | null {
  const slots = playerDraftedTracks.map((dt) => dt.slot);
  return computeBestPossible(candidateHistory, playerDraftedTracks, slots);
}
