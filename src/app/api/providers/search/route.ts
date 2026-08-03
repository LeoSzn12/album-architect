import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';
import type { ProviderId } from '@/lib/providers/types';

export async function GET(request: NextRequest) {
  const providerId = (request.nextUrl.searchParams.get('provider') ?? 'demo') as ProviderId;
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!['demo', 'spotify', 'youtube'].includes(providerId)) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
  if (query.length > 120) return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });
  const result = await getProvider(providerId).search(query, 20);
  return result.ok ? NextResponse.json({ provider: providerId, songs: result.data }) : NextResponse.json({ provider: providerId, error: result.error }, { status: result.error.code === 'disabled' ? 503 : 400 });
}
