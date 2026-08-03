import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { decodeSharePayload, encodeSharePayload, type SharePayload } from '../src/lib/sharePayload.ts';

const payload: SharePayload = {
  version: 1,
  projectTitle: 'Night Drive Theory',
  creator: 'Leo',
  score: 9.4,
  grade: 'Gold Solid',
  topTracks: [
    { title: 'Opening Signal', artist: 'Demo Artist' },
    { title: 'After Hours', artist: 'Demo Artist' },
    { title: 'Last Light', artist: 'Another Artist' },
  ],
  opponentScore: 8.8,
  challengeCode: 'ARCH-7K9P',
  categories: [
    { label: 'Slot Fit', score: 92 },
    { label: 'Sequencing & Flow', score: 84 },
  ],
};

describe('share payload', () => {
  test('round trips through URL-safe base64 JSON', () => {
    const encoded = encodeSharePayload(payload);
    assert.match(encoded, /^[A-Za-z0-9_-]+$/u);
    assert.deepStrictEqual(decodeSharePayload(encoded), payload);
  });

  test('rejects malformed, tampered, and out-of-range payloads', () => {
    assert.throws(() => decodeSharePayload('not-json'), TypeError);
    const encoded = encodeSharePayload(payload);
    const tampered = { ...payload, score: 99 };
    assert.throws(() => encodeSharePayload(tampered as SharePayload), TypeError);
    assert.throws(() => decodeSharePayload(`${encoded}!`), TypeError);
  });

  test('does not permit unknown fields in shared data', () => {
    assert.throws(() => encodeSharePayload({ ...payload, secret: 'nope' } as SharePayload), TypeError);
  });
});
