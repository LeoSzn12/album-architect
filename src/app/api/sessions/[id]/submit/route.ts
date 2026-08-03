import { NextResponse } from 'next/server';
import { getSession, submitSession } from '@/lib/sessionRepository';
import { submitPersistentSession } from '@/lib/supabase/sessionRepository';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const persistent = await submitPersistentSession(id);
  if (persistent.configured) {
    if (persistent.unauthenticated) return NextResponse.json({ error: 'Sign in to submit this session.' }, { status: 401 });
    if (persistent.error === 'Session is incomplete.') return NextResponse.json({ error: persistent.error }, { status: 409 });
    if (persistent.error) return NextResponse.json({ error: persistent.error }, { status: 503 });
    if (!persistent.data) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    return NextResponse.json({ session: persistent.data });
  }
  if (!getSession(id)) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  const session = submitSession(id);
  return session
    ? NextResponse.json({ session })
    : NextResponse.json({ error: 'Session is incomplete.' }, { status: 409 });
}
