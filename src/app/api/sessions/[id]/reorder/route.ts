import { NextRequest, NextResponse } from 'next/server';
import { getSession, reorderSessionPicks } from '@/lib/sessionRepository';
import { reorderPersistentSession } from '@/lib/supabase/sessionRepository';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { positions?: unknown } | null;
  if (!Array.isArray(body?.positions) || body.positions.some((position) => !Number.isInteger(position) || position < 1)) {
    return NextResponse.json({ error: 'Expected an ordered positions array.' }, { status: 400 });
  }

  const positions = body.positions as number[];
  const persistent = await reorderPersistentSession(id, positions);
  if (persistent.configured) {
    if (persistent.unauthenticated) return NextResponse.json({ error: 'Sign in to reorder this session.' }, { status: 401 });
    if (persistent.error === 'Session is not accepting reorder changes.') return NextResponse.json({ error: persistent.error }, { status: 409 });
    if (persistent.error) return NextResponse.json({ error: persistent.error }, { status: 503 });
    if (!persistent.data) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    return NextResponse.json({ session: persistent.data });
  }

  if (!getSession(id)) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  const session = reorderSessionPicks(id, positions);
  return session
    ? NextResponse.json({ session })
    : NextResponse.json({ error: 'Invalid reorder positions or session state.' }, { status: 409 });
}
