import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canPersistGame } from '../src/lib/cloudPersistence.ts';

test('cloud writes require a configured and authenticated session', async () => {
  for (const identity of [
    { configured: true, authenticated: false },
    { configured: false, authenticated: false },
    { configured: false, authenticated: true },
    {},
  ]) {
    assert.equal(await canPersistGame('draft', async () => Response.json(identity)), false);
  }
  assert.equal(await canPersistGame('draft', async (_url, init) => {
    assert.equal(init?.cache, 'no-store');
    return Response.json({ configured: true, authenticated: true });
  }), true);
});

test('network failures, invalid responses and budget games remain local', async () => {
  assert.equal(await canPersistGame('ep', async () => { throw new Error('offline'); }), false);
  assert.equal(await canPersistGame('album', async () => new Response('unavailable', { status: 503 })), false);
  assert.equal(await canPersistGame('draft', async () => new Response('not JSON')), false);
  assert.equal(await canPersistGame('budget', async () => { throw new Error('must not request auth'); }), false);
});
