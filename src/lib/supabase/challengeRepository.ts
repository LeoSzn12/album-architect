import type { GameMode } from '@/types/draft';
import { canTransitionChallenge, type ChallengeStatus } from '../challengeTransitions.ts';
import { createSupabaseServerClient } from './server.ts';

function challengeCode() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
}

async function context() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return userId ? { client, userId } : null;
}

export { canTransitionChallenge } from '../challengeTransitions.ts';

export async function createChallenge(input: {
  mode: GameMode;
  trackCount: number;
  alias: string;
  seed?: string;
  matchup?: unknown;
  rematchCode?: string;
}) {
  const active = await context();
  if (!active) return { configured: false as const, data: null };
  const authUser = await active.client.auth.getUser();
  const profile = await active.client.from('users').upsert({
    id: active.userId,
    email: authUser.data.user?.email ?? null,
    display_name: authUser.data.user?.user_metadata?.full_name ?? authUser.data.user?.email?.split('@')[0] ?? 'Executive Architect',
  }, { onConflict: 'id' });
  if (profile.error) return { configured: true as const, data: null, error: profile.error.message };

  let rematchOf: string | null = null;
  if (input.rematchCode) {
    const original = await active.client.from('challenges').select('id').eq('challenge_code', input.rematchCode).maybeSingle();
    if (original.error || !original.data) return { configured: true as const, data: null, error: 'Original challenge was not found.' };
    rematchOf = original.data.id;
  }

  const sessionId = `challenge_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const session = await active.client.from('game_sessions').insert({
    id: sessionId,
    mode: input.mode,
    track_count: input.trackCount,
    creator_id: active.userId,
    creator_alias: input.alias.trim().slice(0, 40) || 'Executive Architect',
    opponent_type: 'friend',
    visibility: 'friends',
    brief_json: { text: 'Head-to-head friend challenge' },
    seed: input.seed?.trim().toUpperCase().slice(0, 24) ?? null,
    status: 'drafting',
  });
  if (session.error) return { configured: true as const, data: null, error: session.error.message };

  const code = challengeCode();
  const challenge = await active.client.from('challenges').insert({
    source_session_id: sessionId,
    sender_id: active.userId,
    challenge_code: code,
    status: 'open',
    rematch_of: rematchOf,
    matchup_json: input.matchup ?? {},
  }).select('id, source_session_id, challenge_code, status, rematch_of, matchup_json, expires_at, created_at').single();
  if (challenge.error || !challenge.data) return { configured: true as const, data: null, error: challenge.error?.message ?? 'Challenge could not be created.' };
  return { configured: true as const, data: challenge.data };
}

export async function getChallenge(code: string) {
  const active = await context();
  if (!active) return { configured: false as const, data: null };
  const { data, error } = await active.client.from('challenges').select('id, source_session_id, sender_id, recipient_id, challenge_code, status, rematch_of, matchup_json, expires_at, created_at, completed_at').eq('challenge_code', code).maybeSingle();
  return error || !data ? { configured: true as const, data: null, error: error?.message } : { configured: true as const, data };
}

export async function updateChallenge(code: string, status: 'accepted' | 'declined' | 'completed') {
  const active = await context();
  if (!active) return { configured: false as const, data: null };
  const existing = await active.client.from('challenges').select('id, status, recipient_id').eq('challenge_code', code).maybeSingle();
  if (existing.error || !existing.data) return { configured: true as const, data: null, error: existing.error?.message ?? 'Challenge not found.' };
  if (!canTransitionChallenge(existing.data.status as ChallengeStatus, status)) return { configured: true as const, data: null, error: `Challenge cannot move from ${existing.data.status} to ${status}.` };
  if (status === 'accepted' && existing.data.recipient_id) return { configured: true as const, data: null, error: 'Challenge has already been accepted.' };
  const update = status === 'accepted'
    ? { status, recipient_id: active.userId, accepted_by: active.userId }
    : status === 'completed'
      ? { status, completed_at: new Date().toISOString() }
      : { status };
  const { data, error } = await active.client.from('challenges').update(update).eq('challenge_code', code).eq('status', existing.data.status).select('id, source_session_id, challenge_code, status, rematch_of, matchup_json, expires_at, created_at, completed_at').single();
  return error || !data ? { configured: true as const, data: null, error: error?.message ?? 'Challenge not found.' } : { configured: true as const, data };
}
