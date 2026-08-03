import assert from 'node:assert/strict';
import test from 'node:test';
import { DRAFT_SLOTS } from '../src/data/slots.ts';
import { SONG_LIBRARY } from '../src/data/songs.ts';
import { computeEnergyMetrics, computeMonopolyReport } from '../src/lib/draftMetrics.ts';
import { generateFallbackEvaluation } from '../src/lib/fallbackEvaluator.ts';
import type { DraftedTrack } from '../src/types/draft.ts';

function fixture() {
  const draftedTracks: DraftedTrack[] = DRAFT_SLOTS.map((slot, index) => ({
    slot,
    song: SONG_LIBRARY[index],
    roundDrafted: index + 1,
    isWildcard: false,
  }));
  return {
    draftedTracks,
    monopolyReport: computeMonopolyReport(draftedTracks),
    energyMetrics: computeEnergyMetrics(draftedTracks),
  };
}

test('deterministic evaluator is a complete AI fallback for an EP', () => {
  const input = fixture();
  const result = generateFallbackEvaluation('ep', input.draftedTracks, input.monopolyReport, input.energyMetrics);
  assert.equal(result.source, 'fallback');
  assert.ok(Number.isFinite(result.overallScore));
  assert.equal(result.reviews.length, 3);
  assert.ok(result.categoryScores);
});

test('fallback remains bounded and transparent for malformed optional candidate history', () => {
  const input = fixture();
  const result = generateFallbackEvaluation('draft', input.draftedTracks, input.monopolyReport, input.energyMetrics, 'all');
  assert.ok(result.overallScore >= 0 && result.overallScore <= 10);
  assert.equal(result.subScores.slotFit >= 0, true);
  assert.equal(result.subScores.albumFlow >= 0, true);
  assert.ok(result.highlights.length >= 1);
});
