import assert from 'node:assert/strict';
import test from 'node:test';
import { createPkceRequest, getOAuthProviderConfig } from '../src/lib/providers/oauth.ts';

test('provider OAuth stays disabled without deployment credentials', () => {
  const oldClientId = process.env.SPOTIFY_CLIENT_ID;
  const oldRedirect = process.env.SPOTIFY_REDIRECT_URI;
  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_REDIRECT_URI;
  try {
    assert.equal(getOAuthProviderConfig('spotify'), null);
    assert.equal(createPkceRequest('spotify'), null);
  } finally {
    if (oldClientId === undefined) delete process.env.SPOTIFY_CLIENT_ID;
    else process.env.SPOTIFY_CLIENT_ID = oldClientId;
    if (oldRedirect === undefined) delete process.env.SPOTIFY_REDIRECT_URI;
    else process.env.SPOTIFY_REDIRECT_URI = oldRedirect;
  }
});

test('configured provider OAuth request uses PKCE and URL-safe state', () => {
  const oldClientId = process.env.SPOTIFY_CLIENT_ID;
  const oldRedirect = process.env.SPOTIFY_REDIRECT_URI;
  process.env.SPOTIFY_CLIENT_ID = 'test-client';
  process.env.SPOTIFY_REDIRECT_URI = 'https://example.test/callback';
  try {
    const request = createPkceRequest('spotify');
    assert.ok(request);
    assert.match(request.authorizationUrl, /code_challenge_method=S256/);
    assert.match(request.authorizationUrl, /client_id=test-client/);
    assert.match(request.state, /^[A-Za-z0-9_-]+$/u);
    assert.match(request.codeVerifier, /^[A-Za-z0-9_-]+$/u);
  } finally {
    if (oldClientId === undefined) delete process.env.SPOTIFY_CLIENT_ID;
    else process.env.SPOTIFY_CLIENT_ID = oldClientId;
    if (oldRedirect === undefined) delete process.env.SPOTIFY_REDIRECT_URI;
    else process.env.SPOTIFY_REDIRECT_URI = oldRedirect;
  }
});
