import { NextRequest, NextResponse } from 'next/server';
import { createShareRecord, getShareRecord } from '@/lib/supabase/shareRepository';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Expected a share payload.' }, { status: 400 });
  const result = await createShareRecord(payload);
  if (!result.configured) return NextResponse.json({ persisted: false, notice: 'Supabase persistence is not configured.' });
  if (!result.data) return NextResponse.json({ error: result.error ?? 'Share could not be saved.' }, { status: 503 });
  return NextResponse.json({ persisted: true, ...result.data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const shareToken = request.nextUrl.searchParams.get('token')?.trim().toUpperCase();
  if (!shareToken || !/^[A-Z0-9]{8,32}$/u.test(shareToken)) return NextResponse.json({ error: 'Invalid share token.' }, { status: 400 });
  const result = await getShareRecord(shareToken);
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (!result.data) return NextResponse.json({ error: 'Share not found.' }, { status: 404 });
  return NextResponse.json(result.data);
}
