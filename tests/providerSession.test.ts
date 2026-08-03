import assert from 'node:assert/strict';
import test from 'node:test';
import { openProviderSession, sealProviderSession } from '../src/lib/providers/session.ts';

test('provider session values are encrypted and only open with the configured secret', () => {
  const previous = process.env.PROVIDER_SESSION_SECRET;
  process.env.PROVIDER_SESSION_SECRET = 'trackdraft-test-secret-with-more-than-32-characters';
  try {
    const sealed = sealProviderSession(JSON.stringify({ accessToken: 'token', state: 'state' }));
    assert.ok(sealed);
    assert.notEqual(sealed, JSON.stringify({ accessToken: 'token', state: 'state' }));
    assert.deepEqual(JSON.parse(openProviderSession(sealed) ?? '{}'), { accessToken: 'token', state: 'state' });
    process.env.PROVIDER_SESSION_SECRET = 'different-secret-with-more-than-32-characters';
    assert.equal(openProviderSession(sealed), null);
  } finally {
    if (previous === undefined) delete process.env.PROVIDER_SESSION_SECRET;
    else process.env.PROVIDER_SESSION_SECRET = previous;
  }
});
