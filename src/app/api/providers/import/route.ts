import { NextRequest, NextResponse } from 'next/server';
import { accessTokenFromRequest, createRemoteProvider } from '@/lib/providers/remote';
import type { ProviderId } from '@/lib/providers/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { provider?: ProviderId; reference?: string } | null;
  if ((body?.provider !== 'spotify' && body?.provider !== 'youtube') || typeof body.reference !== 'string' || !body.reference.trim() || body.reference.length > 2048) {
    return NextResponse.json({ error: 'Expected a Spotify or YouTube playlist reference.' }, { status: 400 });
  }
  const result = await createRemoteProvider(body.provider, accessTokenFromRequest(request, body.provider)).importPlaylist(body.reference);
  return result.ok
    ? NextResponse.json({ provider: body.provider, playlist: result.data })
    : NextResponse.json({ provider: body.provider, error: result.error }, { status: result.error.code === 'invalid-request' ? 400 : 503 });
}
