import { NextResponse } from 'next/server';
import { createPkceRequest, getOAuthProviderConfig } from '@/lib/providers/oauth';
import type { ProviderId } from '@/lib/providers/types';

const supported = new Set<ProviderId>(['spotify', 'youtube']);

export function GET(_request: Request, context: { params: Promise<{ provider: string }> }) {
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
    // The verifier/state must be stored in an encrypted, short-lived session before
    // production use. Returning it here keeps this local prototype secret-free.
    return NextResponse.json({
      provider,
      status: 'ready',
      authorizationUrl: request.authorizationUrl,
      state: request.state,
      codeVerifier: request.codeVerifier,
      notice: 'Complete the callback/token exchange with a server-side session store before enabling provider data access.',
    });
  });
}
