import { NextResponse } from 'next/server';
import { providerCookieName } from '@/lib/providers/session';
import { unlinkProviderAccount } from '@/lib/supabase/providerAccounts';

const supported = new Set(['spotify', 'youtube']);

export const runtime = 'nodejs';

export async function DELETE(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await context.params;
  if (!supported.has(rawProvider)) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
  const provider = rawProvider as 'spotify' | 'youtube';
  const result = await unlinkProviderAccount(provider);
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (result.unauthenticated) return NextResponse.json({ error: 'Sign in before disconnecting a provider.' }, { status: 401 });
  if (!result.unlinked) return NextResponse.json({ error: result.error ?? 'Provider could not be disconnected.' }, { status: 503 });

  const response = NextResponse.json({ provider, disconnected: true });
  response.cookies.set(providerCookieName(provider), '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}
