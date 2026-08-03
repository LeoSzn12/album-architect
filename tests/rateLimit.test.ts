import assert from 'node:assert/strict';
import test from 'node:test';
import { clearRateLimitBuckets, rateLimit, rateLimitHeaders, requestRateLimitKey } from '../src/lib/rateLimit.ts';

test('rate limiter allows a bounded burst and returns retry metadata', () => {
  clearRateLimitBuckets();
  const policy = { limit: 2, windowMs: 10_000 };

  assert.equal(rateLimit('critic:demo', policy, 1_000).allowed, true);
  assert.equal(rateLimit('critic:demo', policy, 1_001).allowed, true);
  const blocked = rateLimit('critic:demo', policy, 1_002);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(rateLimitHeaders(blocked)['Retry-After'], '10');
});

test('rate limiter resets buckets after the policy window', () => {
  clearRateLimitBuckets();
  const policy = { limit: 1, windowMs: 1_000 };

  assert.equal(rateLimit('search:demo', policy, 5_000).allowed, true);
  assert.equal(rateLimit('search:demo', policy, 5_500).allowed, false);
  assert.equal(rateLimit('search:demo', policy, 6_001).allowed, true);
});

test('request key prefers the first forwarded address', () => {
  const request = new Request('https://example.test/api', {
    headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.4', 'x-real-ip': '198.51.100.4' },
  });
  assert.equal(requestRateLimitKey(request, 'import'), 'import:203.0.113.10');
});
