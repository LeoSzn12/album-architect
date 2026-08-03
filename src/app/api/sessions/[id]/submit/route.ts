import { NextResponse } from 'next/server';
import { getSession, submitSession } from '@/lib/sessionRepository';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getSession(id)) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  const session = submitSession(id);
  return session
    ? NextResponse.json({ session })
    : NextResponse.json({ error: 'Session is incomplete.' }, { status: 409 });
}
