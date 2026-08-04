import { NextRequest, NextResponse } from 'next/server';
import { createShareRecord, getShareRecord } from '@/lib/supabase/shareRepository';
import { rateLimit, rateLimitHeaders, requestRateLimitKey } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limiter = rateLimit(requestRateLimitKey(request, 'share-write'), { limit: 12, windowMs: 60_000 });
  if (!limiter.allowed) return NextResponse.json({ error: 'Share creation is temporarily rate limited. Please retry shortly.' }, { status: 429, headers: rateLimitHeaders(limiter) });
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Expected a share payload.' }, { status: 400 });
  const result = await createShareRecord(payload);
  if (!result.configured) return NextResponse.json({ persisted: false, notice: 'Supabase persistence is not configured.' }, { headers: rateLimitHeaders(limiter) });
  if (!result.data) return NextResponse.json({ error: result.error ?? 'Share could not be saved.' }, { status: 503, headers: rateLimitHeaders(limiter) });
  return NextResponse.json({ persisted: true, ...result.data }, { status: 201, headers: rateLimitHeaders(limiter) });
}

export async function GET(request: NextRequest) {
  const shareToken = request.nextUrl.searchParams.get('token')?.trim().toUpperCase();
  if (!shareToken || !/^[A-Z0-9]{8,32}$/u.test(shareToken)) return NextResponse.json({ error: 'Invalid share token.' }, { status: 400 });
  const result = await getShareRecord(shareToken);
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (!result.data) return NextResponse.json({ error: 'Share not found.' }, { status: 404 });
  return NextResponse.json(result.data);
}
