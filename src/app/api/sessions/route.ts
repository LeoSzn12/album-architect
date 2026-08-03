import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession } from '@/lib/sessionRepository';
import type { GameMode } from '@/types/draft';

const modes = new Set<GameMode>(['draft', 'ep', 'album']);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const mode = body?.mode;
  const trackCount = body?.trackCount;
  if (typeof mode !== 'string' || !modes.has(mode as GameMode) || typeof trackCount !== 'number' || !Number.isInteger(trackCount) || trackCount < 6 || trackCount > 14) {
    return NextResponse.json({ error: 'Expected a supported mode and an integer trackCount between 6 and 14.' }, { status: 400 });
  }
  const session = createSession({
    mode: mode as GameMode,
    trackCount,
    creatorAlias: typeof body?.creatorAlias === 'string' ? body.creatorAlias : undefined,
    brief: typeof body?.brief === 'string' ? body.brief : undefined,
    visibility: body?.visibility === 'public' || body?.visibility === 'friends' || body?.visibility === 'private' ? body.visibility : undefined,
    opponentType: body?.opponentType === 'friend' ? 'friend' : 'ai',
    seed: typeof body?.seed === 'string' ? body.seed.trim().toUpperCase().slice(0, 24) : null,
  });
  return NextResponse.json({ session }, { status: 201 });
}

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'Missing session id.' }, { status: 400 });
  const session = getSession(id);
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  return NextResponse.json({ session });
}
