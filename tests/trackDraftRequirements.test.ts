import assert from 'node:assert';
import { describe, test } from 'node:test';
import { DRAFT_SLOTS } from '../src/data/slots.ts';
import { SONG_LIBRARY } from '../src/data/songs.ts';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import { buildTransparentScorecard, SCORE_WEIGHTS } from '../src/lib/transparentScorecard.ts';
import { computeEnergyMetrics, computeMonopolyReport } from '../src/lib/draftMetrics.ts';
import type { CandidateContext, DraftedTrack } from '../src/types/draft';

describe('TrackDraft product requirements', () => {
  test('Draft mode exposes seven semantic slots and five candidates', () => {
    assert.strictEqual(DRAFT_SLOTS.length, 7);
    const context: CandidateContext = {
      slotId: DRAFT_SLOTS[0].id,
      era: 'all',
      seed: 'TRACKDRAFT-QA',
      rerollIndex: 0,
      draftedSongIds: [],
      draftedArtists: [],
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
    };
    const pool = generateCandidatePool(context, 5);
    assert.strictEqual(pool.length, 5);
    assert.strictEqual(new Set(pool.map((song) => song.id)).size, 5);
  });

  test('transparent score weights total 100%', () => {
    assert.strictEqual(Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0), 100);
  });

  test('every category returns a score and evidence', () => {
    const draftedTracks: DraftedTrack[] = DRAFT_SLOTS.map((slot, index) => {
      const pool = generateCandidatePool({
        slotId: slot.id,
        era: 'all',
        seed: 'TRACKDRAFT-SCORE',
        rerollIndex: index,
        draftedSongIds: [],
        draftedArtists: [],
        recentlyShownSongIds: [],
        recentlyShownArtists: [],
      }, 1);
      return { slot, song: pool[0], roundDrafted: index + 1, isWildcard: false };
    });
    const result = buildTransparentScorecard(
      draftedTracks,
      computeMonopolyReport(draftedTracks),
      computeEnergyMetrics(draftedTracks)
    );
    assert.strictEqual(Object.keys(result.categoryScores).length, 7);
    for (const category of Object.values(result.categoryScores)) {
      assert.ok(category.score >= 0 && category.score <= 100);
      assert.ok(category.evidence.length >= 1 && category.evidence.length <= 3);
    }
  });

  test('featured tracks remain visible as collaborators without creating a separate lead artist pick', () => {
    const featured = SONG_LIBRARY.find((song) => song.featuredArtists.length > 0);
    assert.ok(featured, 'QA fixture should include a featured track in the demo catalog.');
    const track: DraftedTrack = { slot: DRAFT_SLOTS[0], song: featured, roundDrafted: 1, isWildcard: false };
    const monopoly = computeMonopolyReport([track]);
    assert.strictEqual(monopoly.hasViolation, false);
    assert.ok(monopoly.artistCounts[featured.featuredArtists[0]]?.featured === 1);
  });
});
