import type { EvaluationResult, GameMode } from '@/types/draft';
import { createSupabaseServerClient } from './server';

function isFiniteScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

async function authenticated() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return userId ? { client, userId } : null;
}

/** Persists a completed evaluation, creating a lightweight session when the UI did not create one first. */
export async function persistScorecard(input: {
  sessionId?: string;
  mode: GameMode;
  trackCount: number;
  alias: string;
  evaluation: EvaluationResult;
}) {
  const active = await authenticated();
  if (!active) return { configured: false as const, persisted: false };
  if (!isFiniteScore(input.evaluation.overallScore)) return { configured: true as const, persisted: false, error: 'Invalid scorecard score.' };

  const profile = await active.client.from('users').upsert({ id: active.userId, display_name: input.alias.trim().slice(0, 40) || 'Executive Architect' }, { onConflict: 'id' });
  if (profile.error) return { configured: true as const, persisted: false, error: profile.error.message };

  let sessionId = input.sessionId?.trim();
  if (sessionId) {
    const { data } = await active.client.from('game_sessions').select('id').eq('id', sessionId).eq('creator_id', active.userId).maybeSingle();
    if (!data) return { configured: true as const, persisted: false, error: 'Session not found.' };
  } else {
    sessionId = `evaluation_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
    const session = await active.client.from('game_sessions').insert({
      id: sessionId,
      mode: input.mode,
      track_count: input.trackCount,
      creator_id: active.userId,
      creator_alias: input.alias.trim().slice(0, 40) || 'Executive Architect',
      opponent_type: 'ai',
      visibility: 'private',
      brief_json: { text: 'Completed TrackDraft evaluation' },
      status: 'submitted',
    });
    if (session.error) return { configured: true as const, persisted: false, error: session.error.message };
  }

  const scorecard = await active.client.from('scorecards').insert({
    session_id: sessionId,
    creator_id: active.userId,
    participant_alias: input.alias.trim().slice(0, 40) || 'Executive Architect',
    rubric_version: 'trackdraft-v1',
    total_score: input.evaluation.overallScore,
    categories_json: input.evaluation.categoryScores ?? input.evaluation.subScores,
    penalties_json: input.evaluation.appliedPenalties ?? [{ code: 'monopoly', points: input.evaluation.monopolyPenalty }],
    critique_json: input.evaluation,
  });
  return scorecard.error
    ? { configured: true as const, persisted: false, error: scorecard.error.message }
    : { configured: true as const, persisted: true, sessionId };
}
