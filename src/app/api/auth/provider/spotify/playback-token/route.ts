import { NextRequest, NextResponse } from 'next/server';
import { openProviderSession, providerCookieName } from '@/lib/providers/session';
import { accessTokenFromStoredProviderAccount } from '@/lib/supabase/providerAccounts';

export const runtime = 'nodejs';

/**
 * Serves the Spotify OAuth access token to the browser for the
 * Web Playback SDK (full-track in-browser playback for Premium users).
 *
 * Security:
 *  - Token is read server-side from the httpOnly encrypted cookie, or the
 *    Supabase-linked provider account as a fallback.
 *  - The raw token is only ever returned to the browser that already holds
 *    the corresponding httpOnly session — it is not cached, logged, or
 *    exposed through any other route.
 *  - Refresh tokens are NEVER returned to the client.
 */
export async function GET(request: NextRequest) {
  const cookie = request.headers
    .get('cookie')
    ?.match(new RegExp(`(?:^|;\\s*)${providerCookieName('spotify')}=([^;]+)`))?.[1];

  if (!cookie) {
    return NextResponse.json({ error: 'No Spotify session. Connect Spotify in Setup first.' }, { status: 401 });
  }

  const sealed = openProviderSession(cookie);
  if (!sealed) {
    return NextResponse.json({ error: 'Spotify session could not be decrypted.' }, { status: 401 });
  }

  let parsed: { accessToken?: string; refreshToken?: string; expiresAt?: number };
  try {
    parsed = JSON.parse(sealed) as { accessToken?: string; refreshToken?: string; expiresAt?: number };
  } catch {
    return NextResponse.json({ error: 'Spotify session is corrupt.' }, { status: 401 });
  }

  let accessToken = typeof parsed.accessToken === 'string' ? parsed.accessToken : null;

  // Fallback: the durable Supabase-linked account (e.g. when the httpOnly
  // cookie expired but the user's linked provider account is still valid).
  if (!accessToken) {
    accessToken = (await accessTokenFromStoredProviderAccount('spotify')) ?? null;
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No Spotify access token available. Re-link your Spotify account.' }, { status: 401 });
  }

  return NextResponse.json({ accessToken });
}
