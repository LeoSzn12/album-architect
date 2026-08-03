import { createSupabaseServerClient } from './server';

function token() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase();
}

async function context() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return userId ? { client, userId } : null;
}

export async function createShareRecord(payload: unknown) {
  const active = await context();
  if (!active) return { configured: false as const, data: null };
  const authUser = await active.client.auth.getUser();
  const profile = await active.client.from('users').upsert({
    id: active.userId,
    email: authUser.data.user?.email ?? null,
    display_name: authUser.data.user?.user_metadata?.full_name ?? authUser.data.user?.email?.split('@')[0] ?? 'Executive Architect',
  }, { onConflict: 'id' });
  if (profile.error) return { configured: true as const, data: null, error: profile.error.message };
  const shareToken = token();
  const { error } = await active.client.from('share_records').insert({ token: shareToken, creator_id: active.userId, payload_json: payload });
  return error ? { configured: true as const, data: null, error: error.message } : { configured: true as const, data: { token: shareToken } };
}

export async function getShareRecord(shareToken: string) {
  const client = await createSupabaseServerClient();
  if (!client) return { configured: false as const, data: null };
  const { data, error } = await client.from('share_records').select('token, payload_json, created_at, expires_at').eq('token', shareToken).maybeSingle();
  if (error || !data) return { configured: true as const, data: null, error: error?.message };
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return { configured: true as const, data: null };
  return { configured: true as const, data: { token: data.token, payload: data.payload_json, createdAt: data.created_at } };
}
