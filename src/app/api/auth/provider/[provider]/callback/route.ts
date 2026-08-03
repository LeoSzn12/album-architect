import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProviderConfig } from '@/lib/providers/oauth';
import { openProviderSession, providerCookieName, providerOAuthCookieName, sealProviderSession } from '@/lib/providers/session';
import type { ProviderId } from '@/lib/providers/types';

const supported = new Set<ProviderId>(['spotify', 'youtube']);

export const runtime = 'nodejs';

function redirectTarget(request: NextRequest, status: 'connected' | 'error') {
  const target = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.url);
  target.pathname = '/';
  target.search = status === 'connected' ? '?provider=connected' : '?provider=error';
  return target;
}

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await context.params;
  if (!supported.has(rawProvider as ProviderId)) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
  const provider = rawProvider as Exclude<ProviderId, 'demo'>;
  const config = getOAuthProviderConfig(provider);
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthCookie = request.cookies.get(providerOAuthCookieName(provider))?.value;
  const statePayload = openProviderSession(oauthCookie);
  if (!config || !code || !state || !statePayload) return NextResponse.redirect(redirectTarget(request, 'error'));

  let parsed: { state?: string; codeVerifier?: string };
  try { parsed = JSON.parse(statePayload) as { state?: string; codeVerifier?: string }; } catch { return NextResponse.redirect(redirectTarget(request, 'error')); }
  if (parsed.state !== state || !parsed.codeVerifier) return NextResponse.redirect(redirectTarget(request, 'error'));

  const tokenEndpoint = provider === 'spotify' ? 'https://accounts.spotify.com/api/token' : 'https://oauth2.googleapis.com/token';
  const form = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri, client_id: config.clientId, code_verifier: parsed.codeVerifier });
  if (config.clientSecret) form.set('client_secret', config.clientSecret);
  const tokenResponse = await fetch(tokenEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  const tokenBody = await tokenResponse.json().catch(() => null) as { access_token?: string; refresh_token?: string } | null;
  const sealedToken = tokenBody?.access_token ? sealProviderSession(JSON.stringify({ accessToken: tokenBody.access_token, refreshToken: tokenBody.refresh_token, expiresAt: Date.now() + 3_600_000 })) : null;
  if (!tokenResponse.ok || !sealedToken) return NextResponse.redirect(redirectTarget(request, 'error'));

  const response = NextResponse.redirect(redirectTarget(request, 'connected'));
  response.cookies.set(providerCookieName(provider), sealedToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3_600, path: '/' });
  response.cookies.set(providerOAuthCookieName(provider), '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}
