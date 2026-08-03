import { NextRequest, NextResponse } from 'next/server';
import { createChallenge, getChallenge, updateChallenge } from '@/lib/supabase/challengeRepository';
import type { GameMode } from '@/types/draft';
import { rateLimit, rateLimitHeaders, requestRateLimitKey } from '@/lib/rateLimit';

const modes = new Set<GameMode>(['draft', 'ep', 'album']);

export async function POST(request: NextRequest) {
  const limiter = rateLimit(requestRateLimitKey(request, 'challenge-write'), { limit: 10, windowMs: 60_000 });
  if (!limiter.allowed) return NextResponse.json({ error: 'Challenge actions are temporarily rate limited. Please retry shortly.' }, { status: 429, headers: rateLimitHeaders(limiter) });
  const body = await request.json().catch(() => null) as { mode?: unknown; trackCount?: unknown; alias?: unknown; seed?: unknown; matchup?: unknown; rematchCode?: unknown } | null;
  if (!body || !modes.has(body.mode as GameMode) || typeof body.trackCount !== 'number' || !Number.isInteger(body.trackCount) || body.trackCount < 6 || body.trackCount > 14 || typeof body.alias !== 'string') {
    return NextResponse.json({ error: 'Expected a mode, trackCount, and alias.' }, { status: 400 });
  }
  const result = await createChallenge({ mode: body.mode as GameMode, trackCount: body.trackCount, alias: body.alias, seed: typeof body.seed === 'string' ? body.seed : undefined, matchup: body.matchup, rematchCode: typeof body.rematchCode === 'string' ? body.rematchCode.trim().toUpperCase() : undefined });
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (!result.data) return NextResponse.json({ error: result.error ?? 'Challenge could not be created.' }, { status: 503 });
  return NextResponse.json({ challenge: result.data }, { status: 201, headers: rateLimitHeaders(limiter) });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{8,16}$/u.test(code)) return NextResponse.json({ error: 'Invalid challenge code.' }, { status: 400 });
  const result = await getChallenge(code);
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (!result.data) return NextResponse.json({ error: result.error ?? 'Challenge not found.' }, { status: 404 });
  return NextResponse.json({ challenge: result.data });
}

export async function PATCH(request: NextRequest) {
  const limiter = rateLimit(requestRateLimitKey(request, 'challenge-write'), { limit: 20, windowMs: 60_000 });
  if (!limiter.allowed) return NextResponse.json({ error: 'Challenge actions are temporarily rate limited. Please retry shortly.' }, { status: 429, headers: rateLimitHeaders(limiter) });
  const body = await request.json().catch(() => null) as { code?: unknown; status?: unknown } | null;
  if (typeof body?.code !== 'string' || !['accepted', 'declined', 'completed'].includes(body.status as string)) return NextResponse.json({ error: 'Expected a challenge code and valid status.' }, { status: 400 });
  const result = await updateChallenge(body.code.trim().toUpperCase(), body.status as 'accepted' | 'declined' | 'completed');
  if (!result.configured) return NextResponse.json({ error: 'Supabase persistence is not configured.' }, { status: 503 });
  if (!result.data) return NextResponse.json({ error: result.error ?? 'Challenge could not be updated.' }, { status: 404 });
  return NextResponse.json({ challenge: result.data }, { headers: rateLimitHeaders(limiter) });
}
