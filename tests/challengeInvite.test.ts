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

test('beat-my-week-one links carry the units to beat and keep the site path', async () => {
  const { parseUnitsToBeat } = await import('../src/lib/firstWeek/weekOneChallenge.ts');
  const invite = { seed: 'ARCH-ABCD', mode: 'draft', difficulty: 'standard', era: 'all', theme: 'standard', toBeat: 505432 } as const;
  const link = buildChallengeInvite('https://leoszn12.github.io/album-architect', invite);
  assert.ok(link.startsWith('https://leoszn12.github.io/album-architect/?'), link);
  assert.match(link, /beat=505432/);
  assert.deepEqual(parseChallengeInvite(link), invite);
  for (const bad of ['', '0', '-5', '12abc', '99999999999', '1e6']) assert.equal(parseUnitsToBeat(bad), undefined);
  assert.equal(parseChallengeInvite('?seed=ARCH-ABCD&beat=lots')?.toBeat, undefined);
});
