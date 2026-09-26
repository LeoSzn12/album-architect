import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildChallengeInvite, parseChallengeInvite } from '../src/lib/challengeInvite.ts';

test('friend links preserve all settings including budget and theme', () => {
  const invite = { seed: 'ARCH-ABCD', mode: 'budget', difficulty: 'hardcore', era: '2010s', theme: 'genre-rnb' } as const;
  const link = buildChallengeInvite('https://friends.example', invite);
  assert.deepEqual(parseChallengeInvite(link), invite);
  assert.deepEqual(parseChallengeInvite(new URL(link).search), invite);
});

test('bare codes have predictable settings; invalid links never start a draft', () => {
  assert.deepEqual(parseChallengeInvite(' arch-abcd '), {
    seed: 'ARCH-ABCD', mode: 'draft', difficulty: 'standard', era: 'all', theme: 'standard',
  });
  for (const value of ['', 'https://friends.example/', '?seed=', '?seed=%3Cscript%3E', 'A'.repeat(41)]) {
    assert.equal(parseChallengeInvite(value), null);
  }
  assert.equal(parseChallengeInvite('?seed=ARCH-ABCD&theme=unknown&mode=unknown')?.theme, 'standard');
});
