import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DRAFT_SLOTS } from '../src/data/slots.ts';
import { generateCandidatePool } from '../src/lib/candidateSelector.ts';
import { generateEraSequence } from '../src/lib/eraSequence.ts';
import { generateChallengeSeed } from '../src/lib/seededRandom.ts';
import { decodeSharePayload, encodeSharePayload, type SharePayload } from '../src/lib/sharePayload.ts';

test('challenge seeds are shareable, constrained, and deterministic across every round', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const seed = generateChallengeSeed();
    assert.match(seed, /^ARCH-[A-Z2-9]{4}$/u);

    const firstEras = generateEraSequence([...DRAFT_SLOTS], seed);
    const secondEras = generateEraSequence([...DRAFT_SLOTS], seed);
    assert.deepEqual(secondEras, firstEras);

    const firstPools = DRAFT_SLOTS.map((slot, roundIndex) => generateCandidatePool({
      slotId: slot.id,
      era: firstEras[roundIndex] ?? 'all',
      seed,
      rerollIndex: 0,
      draftedSongIds: [],
      draftedArtists: [],
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
    }, 5).map((song) => song.id));
    const secondPools = DRAFT_SLOTS.map((slot, roundIndex) => generateCandidatePool({
      slotId: slot.id,
      era: secondEras[roundIndex] ?? 'all',
      seed,
      rerollIndex: 0,
      draftedSongIds: [],
      draftedArtists: [],
      recentlyShownSongIds: [],
      recentlyShownArtists: [],
    }, 5).map((song) => song.id));

    assert.deepEqual(secondPools, firstPools);
  } finally {
    Math.random = originalRandom;
  }
});

test('result shares preserve challenge and opponent context without exposing internal state', () => {
  const payload: SharePayload = {
    version: 1,
    projectTitle: 'TrackDraft Seven-Round Build',
    creator: 'Curator',
    score: 8.7,
    grade: 'Gold Solid',
    topTracks: [
      { title: 'Opening Signal', artist: 'Artist One' },
      { title: 'Night Drive', artist: 'Artist Two' },
      { title: 'Last Light', artist: 'Artist Three' },
    ],
    opponentScore: 8.4,
    challengeCode: 'ARCH-7K9P',
    categories: [
      { label: 'Slot Fit', score: 92 },
      { label: 'Sequencing & Flow', score: 84 },
    ],
  };

  const encoded = encodeSharePayload(payload);
  assert.deepEqual(decodeSharePayload(encoded), payload);
  assert.throws(() => encodeSharePayload({ ...payload, opponentScore: 11 } as SharePayload), TypeError);
  assert.throws(() => encodeSharePayload({ ...payload, categories: [] } as SharePayload), TypeError);
});
