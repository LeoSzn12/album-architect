import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ALBUM_SLOTS, DRAFT_SLOTS, EP_SLOTS } from '../src/data/slots.ts';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import { computeEnergyMetrics, computeMonopolyReport } from '../src/lib/draftMetrics.ts';
import { generateEraSequence } from '../src/lib/eraSequence.ts';
import { GAME_TEMPLATES, type GameTemplate } from '../src/lib/gameTemplates.ts';
import { generateFallbackEvaluation } from '../src/lib/fallbackEvaluator.ts';
import type { DraftedTrack, DraftSlot, EraFilter } from '../src/types/draft.ts';

const modeFixtures: Array<{ template: GameTemplate; slots: DraftSlot[] }> = [
  { template: GAME_TEMPLATES['draft-7'], slots: [...DRAFT_SLOTS] },
  { template: GAME_TEMPLATES['ep-6'], slots: [...EP_SLOTS].slice(0, 6) },
  { template: GAME_TEMPLATES['ep-7'], slots: [...EP_SLOTS].slice(0, 7) },
  { template: GAME_TEMPLATES['album-12'], slots: [...ALBUM_SLOTS].slice(0, 12) },
  { template: GAME_TEMPLATES['album-13'], slots: [...ALBUM_SLOTS].slice(0, 13) },
  { template: GAME_TEMPLATES['album-14'], slots: [...ALBUM_SLOTS].slice(0, 14) },
];

function simulateMode(template: GameTemplate, slots: DraftSlot[]) {
  const seed = `MODE-FLOW-${template.id}`;
  const eraSequence = generateEraSequence(slots, seed);
  const draftedTracks: DraftedTrack[] = [];
  const candidateHistory: string[][] = [];

  for (const [roundIndex, slot] of slots.entries()) {
    const era: EraFilter = eraSequence[roundIndex] ?? 'all';
    const candidates = generateCandidatePool({
      slotId: slot.id,
      era,
      seed,
      rerollIndex: 0,
      draftedSongIds: draftedTracks.map((track) => track.song.id),
      draftedArtists: draftedTracks.map((track) => track.song.artist),
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
    }, template.mode === 'draft' ? 5 : 4);

    candidateHistory.push(candidates.map((song) => song.id));
    assert.equal(candidates.length, template.mode === 'draft' ? 5 : 4);
    assert.equal(new Set(candidates.map((song) => song.id)).size, candidates.length);

    const chosen = candidates[0];
    assert.ok(chosen, `${template.id} round ${roundIndex + 1} must have a candidate to lock`);
    draftedTracks.push({ slot, song: chosen, roundDrafted: roundIndex + 1, isWildcard: false });
  }

  return { draftedTracks, candidateHistory, eraSequence };
}

describe('full mode-flow contracts', () => {
  for (const { template, slots } of modeFixtures) {
    test(`${template.id} advances through every slot and produces a reviewable scorecard`, () => {
      assert.equal(template.slots.length, template.trackCount);
      const flow = simulateMode(template, slots);

      assert.equal(flow.draftedTracks.length, template.trackCount);
      assert.equal(flow.candidateHistory.length, template.trackCount);
      assert.equal(flow.eraSequence.length, template.trackCount);
      assert.equal(new Set(flow.draftedTracks.map((track) => track.song.id)).size, template.trackCount);

      const monopolyReport = computeMonopolyReport(flow.draftedTracks);
      const energyMetrics = computeEnergyMetrics(flow.draftedTracks);
      const evaluation = generateFallbackEvaluation(template.mode, flow.draftedTracks, monopolyReport, energyMetrics);

      assert.equal(evaluation.source, 'fallback');
      assert.equal(evaluation.reviews.length, 3);
      assert.equal(Object.keys(evaluation.categoryScores ?? {}).length, 7);
      assert.ok(evaluation.overallScore >= 1 && evaluation.overallScore <= 10);
      assert.ok(evaluation.bestPossibleTracklist.length === template.trackCount);
    });
  }

  test('seeded mode flow keeps each round reproducible while rerolls remain distinct', () => {
    const { template, slots } = modeFixtures[0];
    const firstSlot = slots[0];
    const base = {
      slotId: firstSlot.id,
      era: 'all' as const,
      seed: 'MODE-FLOW-REROLL',
      draftedSongIds: [],
      draftedArtists: [],
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
    };
    const initial = generateCandidatePool({ ...base, rerollIndex: 0 }, 5);
    const rerolled = generateCandidatePool({ ...base, rerollIndex: 1 }, 5);
    const repeated = generateCandidatePool({ ...base, rerollIndex: 0 }, 5);

    assert.deepEqual(repeated.map((song) => song.id), initial.map((song) => song.id));
    assert.notDeepEqual(rerolled.map((song) => song.id), initial.map((song) => song.id));
    assert.equal(template.trackCount, 7);
  });
});
