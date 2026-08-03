import { NextRequest, NextResponse } from 'next/server';
import { persistScorecard } from '@/lib/supabase/scorecardRepository';
import type { EvaluationResult, GameMode } from '@/types/draft';

const modes = new Set<GameMode>(['draft', 'ep', 'album']);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { sessionId?: unknown; mode?: unknown; trackCount?: unknown; alias?: unknown; evaluation?: unknown } | null;
  if (!body || typeof body.alias !== 'string' || typeof body.trackCount !== 'number' || !Number.isInteger(body.trackCount) || !modes.has(body.mode as GameMode) || !body.evaluation || typeof body.evaluation !== 'object') {
    return NextResponse.json({ error: 'Expected a mode, trackCount, alias, and evaluation.' }, { status: 400 });
  }
  const result = await persistScorecard({
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    mode: body.mode as GameMode,
    trackCount: body.trackCount,
    alias: body.alias,
    evaluation: body.evaluation as EvaluationResult,
  });
  if (!result.configured) return NextResponse.json({ persisted: false, notice: 'Supabase persistence is not configured.' });
  if (!result.persisted) return NextResponse.json({ error: result.error ?? 'Scorecard could not be saved.' }, { status: result.error === 'Session not found.' ? 404 : 503 });
  return NextResponse.json({ persisted: true, sessionId: result.sessionId });
}
