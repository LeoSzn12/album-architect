import { NextRequest, NextResponse } from 'next/server';
import { accessTokenFromRequest, createRemoteProvider } from '@/lib/providers/remote';
import type { ProviderId } from '@/lib/providers/types';
import { persistImportedPlaylist } from '@/lib/supabase/libraryRepository';
import { rateLimit, rateLimitHeaders, requestRateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const limiter = rateLimit(requestRateLimitKey(request, 'provider-import'), { limit: 8, windowMs: 60_000 });
  if (!limiter.allowed) return NextResponse.json({ error: 'Import is temporarily rate limited. Please retry shortly.' }, { status: 429, headers: rateLimitHeaders(limiter) });
  const body = await request.json().catch(() => null) as { provider?: ProviderId; reference?: string } | null;
  if ((body?.provider !== 'spotify' && body?.provider !== 'youtube') || typeof body.reference !== 'string' || !body.reference.trim() || body.reference.length > 2048) {
    return NextResponse.json({ error: 'Expected a Spotify or YouTube playlist reference.' }, { status: 400 });
  }
  const result = await createRemoteProvider(body.provider, await accessTokenFromRequest(request, body.provider)).importPlaylist(body.reference);
  if (result.ok) {
    const persisted = await persistImportedPlaylist({ provider: body.provider, playlistId: result.data.id, songs: result.data.songs });
    return NextResponse.json({ provider: body.provider, playlist: result.data, persistedCount: persisted.persistedCount }, { headers: rateLimitHeaders(limiter) });
  }
  return NextResponse.json({ provider: body.provider, error: result.error }, { status: result.error.code === 'invalid-request' ? 400 : 503, headers: rateLimitHeaders(limiter) });
}
