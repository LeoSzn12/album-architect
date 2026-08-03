import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';
import type { ProviderId } from '@/lib/providers/types';
import { accessTokenFromRequest, createRemoteProvider } from '@/lib/providers/remote';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const providerId = (request.nextUrl.searchParams.get('provider') ?? 'demo') as ProviderId;
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!['demo', 'spotify', 'youtube'].includes(providerId)) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
  if (query.length > 120) return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });
  const provider = providerId === 'demo' ? getProvider('demo') : createRemoteProvider(providerId, await accessTokenFromRequest(request, providerId));
  const result = await provider.search(query, 10);
  return result.ok
    ? NextResponse.json({ provider: providerId, songs: result.data })
    : NextResponse.json({ provider: providerId, error: result.error }, { status: result.error.code === 'invalid-request' ? 400 : 503 });
}
