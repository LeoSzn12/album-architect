import assert from 'node:assert';
import { test, describe } from 'node:test';
import { generateCandidatePool, getSlotAffinity } from '../src/lib/candidateSelector.ts';
import type { CandidateContext, SlotId } from '../src/types/draft.ts';

describe('Candidate Selector Engine Tests', () => {
  const baseContext: CandidateContext = {
    slotId: 'cinematic-intro',
    era: 'all',
    seed: null,
    rerollIndex: 0,
    draftedSongIds: [],
    draftedArtists: [],
    recentlyShownSongIds: [],
    recentlyShownArtists: [],
  };

  test('Cinematic Intro candidate pool contains only credible intro songs', () => {
    const candidates = generateCandidatePool(baseContext, 4);
    assert.strictEqual(candidates.length, 4);

    for (const song of candidates) {
      const affinity = getSlotAffinity(song, 'cinematic-intro');
      assert.ok(
        affinity >= 50 || song.slots.includes('cinematic-intro'),
        `Song "${song.title}" in intro round must have intro affinity >= 50 or tag match. Got ${affinity}.`
      );
    }
  });

  test('Cinematic Intro strongly prefers actual openers or high-impact/recognition options', () => {
    const candidates = generateCandidatePool(baseContext, 4);
    const openers = candidates.filter((s) => s.isActualAlbumOpener || s.originalAlbumTrackNumber === 1);
    const highImpact = candidates.filter((s) => (s.recognition ?? 70) >= 70 || s.impact >= 70);

    assert.ok(openers.length >= 1, 'Cinematic Intro candidate pool should contain at least 1 actual album opener track.');
    assert.ok(highImpact.length >= 2, 'Cinematic Intro pool should contain at least 2 high recognition/impact options.');
  });

  test('Candidate pools contain 4 unique songs with distinct lead artists when possible', () => {
    const candidates = generateCandidatePool(baseContext, 4);
    const ids = new Set(candidates.map((s) => s.id));
    assert.strictEqual(ids.size, 4, 'Candidate pool must not contain duplicate songs.');

    const artists = new Set(candidates.map((s) => s.artist));
    assert.strictEqual(artists.size, 4, 'Candidate pool must avoid duplicate lead artists when catalog permits.');
  });

  test('Candidate pool exhibits archetype diversity', () => {
    const candidates = generateCandidatePool(baseContext, 4);
    const archetypes = new Set<string>();
    candidates.forEach((s) => (s.archetypes || []).forEach((a) => archetypes.add(a)));

    assert.ok(archetypes.size >= 2, `Candidate pool should represent at least 2-3 distinct archetypes. Got ${archetypes.size}.`);
  });

  test('Same challenge seed produces 100% identical candidate choices', () => {
    const context1: CandidateContext = { ...baseContext, seed: 'VERIFIED_1V1_SEED_99' };
    const context2: CandidateContext = { ...baseContext, seed: 'VERIFIED_1V1_SEED_99' };

    const pool1 = generateCandidatePool(context1, 4);
    const pool2 = generateCandidatePool(context2, 4);

    assert.deepStrictEqual(
      pool1.map((s) => s.id),
      pool2.map((s) => s.id),
      'Identical challenge seed must produce exact same candidate pool.'
    );
  });

  test('Different challenge seeds produce different candidate pools', () => {
    const context1: CandidateContext = { ...baseContext, seed: 'SEED_ALPHA' };
    const context2: CandidateContext = { ...baseContext, seed: 'SEED_BETA' };

    const pool1 = generateCandidatePool(context1, 4);
    const pool2 = generateCandidatePool(context2, 4);

    const ids1 = pool1.map((s) => s.id).join(',');
    const ids2 = pool2.map((s) => s.id).join(',');

    assert.notStrictEqual(ids1, ids2, 'Different seeds should produce different candidate permutations.');
  });

  test('Different reroll indexes produce reproducible but distinct candidate pools', () => {
    const seed = 'REROLL_TEST_SEED';
    const r0 = generateCandidatePool({ ...baseContext, seed, rerollIndex: 0 }, 4);
    const r1 = generateCandidatePool({ ...baseContext, seed, rerollIndex: 1 }, 4);
    const r0_again = generateCandidatePool({ ...baseContext, seed, rerollIndex: 0 }, 4);

    assert.deepStrictEqual(
      r0.map((s) => s.id),
      r0_again.map((s) => s.id),
      'Re-running rerollIndex 0 with same seed must reproduce exact initial pool.'
    );

    const idsR0 = r0.map((s) => s.id).join(',');
    const idsR1 = r1.map((s) => s.id).join(',');

    assert.notStrictEqual(idsR0, idsR1, 'Reroll index 1 must produce a fresh candidate pool.');
  });

  test('Recent exposure penalty lowers repeat frequency in solo mode', () => {
    const initialPool = generateCandidatePool(baseContext, 4);
    const shownIds = initialPool.map((s) => s.id);
    const shownArtists = initialPool.map((s) => s.artist);

    const contextWithHistory: CandidateContext = {
      ...baseContext,
      recentlyShownSongIds: shownIds,
      recentlyShownArtists: shownArtists,
    };

    const nextPool = generateCandidatePool(contextWithHistory, 4);
    const overlap = nextPool.filter((s) => shownIds.includes(s.id));

    assert.ok(
      overlap.length <= 1,
      `Recently shown songs should have penalized weights. Overlap was ${overlap.length} of 4.`
    );
  });

  test('No arbitrary non-suitable song fallback occurs for specialized slots', () => {
    const slotsToTest: SlotId[] = ['cinematic-intro', 'late-night-rnb', 'cinematic-outro'];

    for (const slotId of slotsToTest) {
      const pool = generateCandidatePool({ ...baseContext, slotId }, 4);
      for (const song of pool) {
        const affinity = getSlotAffinity(song, slotId);
        assert.ok(
          affinity >= 40 || song.slots.includes(slotId),
          `Song "${song.title}" in slot "${slotId}" must have affinity >= 40 or tag. Got ${affinity}.`
        );
      }
    }
  });

  test('Candidate Debug Info is attached to candidates', () => {
    const candidates = generateCandidatePool(baseContext, 4);
    for (const song of candidates) {
      assert.ok(song.debugInfo, `Candidate "${song.title}" must attach debugInfo.`);
      assert.ok(song.debugInfo.bucket, 'Debug info must specify strategic bucket.');
      assert.ok(song.debugInfo.selectionWeight > 0, 'Debug info must provide selection weight.');
    }
  });
});
