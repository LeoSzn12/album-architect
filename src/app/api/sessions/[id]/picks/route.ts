import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSessionPick } from '@/lib/sessionRepository';
import { savePersistentSessionPick } from '@/lib/supabase/sessionRepository';
import type { SessionPick } from '@/types/session';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Partial<SessionPick> | null;
  if (!body || typeof body.position !== 'number' || !Number.isInteger(body.position) || typeof body.slotId !== 'string' || !body.song || typeof body.song !== 'object') {
    return NextResponse.json({ error: 'Invalid pick payload.' }, { status: 400 });
  }
  const source = body.selectionSource === 'search' || body.selectionSource === 'link' || body.selectionSource === 'manual' ? body.selectionSource : 'recommendation';
  const pick = {
    position: body.position,
    slotId: body.slotId,
    song: body.song,
    selectionSource: source,
    lockedAt: new Date().toISOString(),
  };
  const persistent = await savePersistentSessionPick(id, pick);
  if (persistent.configured) {
    if (persistent.unauthenticated) return NextResponse.json({ error: 'Sign in to save session picks.' }, { status: 401 });
    if (persistent.error === 'Session is not accepting picks.') return NextResponse.json({ error: persistent.error }, { status: 409 });
    if (persistent.error) return NextResponse.json({ error: persistent.error }, { status: 503 });
    if (!persistent.data) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    return NextResponse.json({ session: persistent.data });
  }
  if (!getSession(id)) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  const session = saveSessionPick(id, pick);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: 'Session is not accepting picks.' }, { status: 409 });
}
