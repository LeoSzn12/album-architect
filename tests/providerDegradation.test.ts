import assert from 'node:assert/strict';
import test from 'node:test';
import { createRemoteProvider } from '../src/lib/providers/remote.ts';

const originalFetch = globalThis.fetch;

test('expired Spotify access tokens return a reconnectable 401 error', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'The access token expired' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  );

  try {
    const result = await createRemoteProvider('spotify', 'expired-token').getAccountProfile();
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, 'disabled');
    assert.match(result.error.message, /Spotify request failed \(401\)/u);
    assert.doesNotMatch(result.error.message, /expired-token/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('provider rate limits remain explicit and do not masquerade as empty search results', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'Too many requests' } }),
    { status: 429, headers: { 'content-type': 'application/json' } },
  );

  try {
    const result = await createRemoteProvider('spotify', 'valid-token').search('late night');
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, 'invalid-request');
    assert.match(result.error.message, /Spotify request failed \(429\)/u);
    assert.match(result.error.message, /Too many requests/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unavailable YouTube tracks are represented as null instead of fabricated songs', async () => {
  const previousKey = process.env.YOUTUBE_DATA_API_KEY;
  process.env.YOUTUBE_DATA_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response(
    JSON.stringify({ items: [] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

  try {
    const result = await createRemoteProvider('youtube', null).resolveUrl('https://www.youtube.com/watch?v=abcdefghijk');
    assert.deepEqual(result, { ok: true, data: null });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.YOUTUBE_DATA_API_KEY;
    else process.env.YOUTUBE_DATA_API_KEY = previousKey;
  }
});

test('provider network failures return the unavailable state for recovery UI', async () => {
  globalThis.fetch = async () => {
    throw new Error('simulated provider outage');
  };

  try {
    const result = await createRemoteProvider('spotify', 'valid-token').search('outage');
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, 'unavailable');
    assert.match(result.error.message, /could not be reached/u);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
