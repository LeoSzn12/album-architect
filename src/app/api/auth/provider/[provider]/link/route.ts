import { NextRequest, NextResponse } from 'next/server';
import { createPkceRequest, getOAuthProviderConfig } from '@/lib/providers/oauth';
import { providerOAuthCookieName, sealProviderSession } from '@/lib/providers/session';
import type { ProviderId } from '@/lib/providers/types';

const supported = new Set<ProviderId>(['spotify', 'youtube']);

export const runtime = 'nodejs';

export function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  return context.params.then(({ provider: rawProvider }) => {
    if (!supported.has(rawProvider as ProviderId)) {
      return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
    }
    const provider = rawProvider as Exclude<ProviderId, 'demo'>;
    if (!getOAuthProviderConfig(provider)) {
      return NextResponse.json({
        provider,
        status: 'not-configured',
        notice: 'OAuth is scaffolded but this deployment has no provider credentials configured.',
      }, { status: 503 });
    }
    const request = createPkceRequest(provider);
    if (!request) return NextResponse.json({ error: 'Unable to create OAuth request.' }, { status: 503 });
    const sealedState = sealProviderSession(JSON.stringify({ state: request.state, codeVerifier: request.codeVerifier }));
    if (!sealedState) return NextResponse.json({ provider, status: 'not-configured', notice: 'Set PROVIDER_SESSION_SECRET to enable encrypted OAuth state.' }, { status: 503 });
    const response = NextResponse.redirect(request.authorizationUrl);
    response.cookies.set(providerOAuthCookieName(provider), sealedState, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/api/auth/provider' });
    return response;
  });
}
