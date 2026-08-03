import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSessionPick } from '@/lib/sessionRepository';
import type { SessionPick } from '@/types/session';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getSession(id)) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  const body = await request.json().catch(() => null) as Partial<SessionPick> | null;
  if (!body || typeof body.position !== 'number' || !Number.isInteger(body.position) || typeof body.slotId !== 'string' || !body.song || typeof body.song !== 'object') {
    return NextResponse.json({ error: 'Invalid pick payload.' }, { status: 400 });
  }
  const source = body.selectionSource === 'search' || body.selectionSource === 'link' || body.selectionSource === 'manual' ? body.selectionSource : 'recommendation';
  const session = saveSessionPick(id, {
    position: body.position,
    slotId: body.slotId,
    song: body.song,
    selectionSource: source,
    lockedAt: new Date().toISOString(),
  });
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: 'Session is not accepting picks.' }, { status: 409 });
}
