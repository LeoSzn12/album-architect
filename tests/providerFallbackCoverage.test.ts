import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accessTokenFromRequest, createRemoteProvider } from '../src/lib/providers/remote.ts';
import { openProviderSession, sealProviderSession } from '../src/lib/providers/session.ts';

const originalFetch = globalThis.fetch;

test('expired provider cookies carry an expired timestamp while live cookies supply the access token', async () => {
  const previousSecret = process.env.PROVIDER_SESSION_SECRET;
  process.env.PROVIDER_SESSION_SECRET = 'trackdraft-provider-test-secret-with-more-than-32-characters';

  try {
    const expired = sealProviderSession(JSON.stringify({ accessToken: 'expired-token', expiresAt: Date.now() - 1_000 }));
    const live = sealProviderSession(JSON.stringify({ accessToken: 'live-token', expiresAt: Date.now() + 120_000 }));
    assert.ok(expired && live);

    const expiredPayload = JSON.parse(openProviderSession(expired ?? undefined) ?? '{}') as { accessToken?: string; expiresAt?: number };
    const liveToken = await accessTokenFromRequest(
      new Request('https://trackdraft.test/api/providers', { headers: { cookie: `trackdraft_provider_spotify=${live}` } }),
      'spotify',
    );

    assert.equal(expiredPayload.accessToken, 'expired-token');
    assert.ok((expiredPayload.expiresAt ?? 0) <= Date.now());
    assert.equal(liveToken, 'live-token');
  } finally {
    if (previousSecret === undefined) delete process.env.PROVIDER_SESSION_SECRET;
    else process.env.PROVIDER_SESSION_SECRET = previousSecret;
  }
});

test('provider HTTP and network failures map to explicit recovery states without leaking tokens', async () => {
  const cases = [
    { status: 401, code: 'disabled', detail: 'expired' },
    { status: 403, code: 'disabled', detail: 'forbidden' },
    { status: 429, code: 'invalid-request', detail: 'Too many requests' },
    { status: 503, code: 'unavailable', detail: 'maintenance' },
  ] as const;

  try {
    for (const scenario of cases) {
      globalThis.fetch = async () => new Response(
        JSON.stringify({ error: { message: scenario.detail } }),
        { status: scenario.status, headers: { 'content-type': 'application/json' } },
      );

      const result = await createRemoteProvider('spotify', 'secret-token').search('late night');
      assert.equal(result.ok, false);
      if (result.ok) continue;
      assert.equal(result.error.code, scenario.code);
      assert.match(result.error.message, new RegExp(`Spotify request failed \\(${scenario.status}\\)`));
      assert.doesNotMatch(result.error.message, /secret-token/u);
    }

    globalThis.fetch = async () => { throw new Error('provider offline'); };
    const networkResult = await createRemoteProvider('youtube', 'secret-token').search('offline');
    assert.equal(networkResult.ok, false);
    if (!networkResult.ok) {
      assert.equal(networkResult.error.code, 'unavailable');
      assert.equal(networkResult.error.message, 'YouTube could not be reached.');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('missing credentials remain a distinct not-configured fallback state', async () => {
  const oldSpotify = process.env.SPOTIFY_ACCESS_TOKEN;
  const oldYouTubeToken = process.env.YOUTUBE_ACCESS_TOKEN;
  const oldYouTubeKey = process.env.YOUTUBE_DATA_API_KEY;
  delete process.env.SPOTIFY_ACCESS_TOKEN;
  delete process.env.YOUTUBE_ACCESS_TOKEN;
  delete process.env.YOUTUBE_DATA_API_KEY;

  try {
    const spotify = await createRemoteProvider('spotify').search('anything');
    const youtube = await createRemoteProvider('youtube').search('anything');
    assert.equal(spotify.ok, false);
    assert.equal(youtube.ok, false);
    if (!spotify.ok) assert.equal(spotify.error.code, 'not-configured');
    if (!youtube.ok) assert.equal(youtube.error.code, 'not-configured');
  } finally {
    if (oldSpotify === undefined) delete process.env.SPOTIFY_ACCESS_TOKEN;
    else process.env.SPOTIFY_ACCESS_TOKEN = oldSpotify;
    if (oldYouTubeToken === undefined) delete process.env.YOUTUBE_ACCESS_TOKEN;
    else process.env.YOUTUBE_ACCESS_TOKEN = oldYouTubeToken;
    if (oldYouTubeKey === undefined) delete process.env.YOUTUBE_DATA_API_KEY;
    else process.env.YOUTUBE_DATA_API_KEY = oldYouTubeKey;
  }
});
