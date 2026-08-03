import { openProviderSession, sealProviderSession } from '../providers/session.ts';
import { createSupabaseServerClient } from './server';

type ProviderId = 'spotify' | 'youtube';

interface StoredProviderToken {
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresAt?: unknown;
}

function tokenPayload(accessToken: string, refreshToken: string | undefined, expiresAt: number | undefined) {
  return JSON.stringify({ accessToken, refreshToken, expiresAt });
}

function parseToken(value: string | null | undefined) {
  if (!value) return null;
  const opened = openProviderSession(value);
  if (!opened) return null;
  try {
    const parsed = JSON.parse(opened) as StoredProviderToken;
    if (typeof parsed.accessToken !== 'string' || !parsed.accessToken) return null;
    const expiresAt = typeof parsed.expiresAt === 'number' ? parsed.expiresAt : undefined;
    if (expiresAt && expiresAt <= Date.now() + 30_000) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      expiresAt,
    };
  } catch {
    return null;
  }
}

async function authenticatedContext() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return userId ? { client, userId } : null;
}

/** Stores the provider token sealed at rest; the plaintext token never enters Postgres. */
export async function persistProviderAccount(input: {
  provider: ProviderId;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
  providerUserId?: string;
}) {
  const context = await authenticatedContext();
  if (!context) return { configured: false as const, persisted: false };
  const authUser = await context.client.auth.getUser();
  const profile = await context.client.from('users').upsert({
    id: context.userId,
    email: authUser.data.user?.email ?? null,
    display_name: authUser.data.user?.user_metadata?.full_name ?? authUser.data.user?.email?.split('@')[0] ?? 'Executive Architect',
  }, { onConflict: 'id' });
  if (profile.error) return { configured: true as const, persisted: false, error: profile.error.message };
  const encryptedTokens = sealProviderSession(tokenPayload(input.accessToken, input.refreshToken, input.expiresAt));
  if (!encryptedTokens) return { configured: true as const, persisted: false, error: 'PROVIDER_SESSION_SECRET is not configured.' };

  const { error } = await context.client.from('provider_accounts').upsert({
    user_id: context.userId,
    provider: input.provider,
    provider_user_id: input.providerUserId ?? null,
    encrypted_tokens: encryptedTokens,
    scopes: input.scopes ?? [],
    expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
    status: 'connected',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });
  return error
    ? { configured: true as const, persisted: false, error: error.message }
    : { configured: true as const, persisted: true };
}

/** Reads a non-expired provider token for the authenticated Supabase user. */
export async function accessTokenFromStoredProviderAccount(provider: ProviderId) {
  const context = await authenticatedContext();
  if (!context) return null;
  const { data, error } = await context.client
    .from('provider_accounts')
    .select('encrypted_tokens, expires_at, status')
    .eq('user_id', context.userId)
    .eq('provider', provider)
    .maybeSingle();
  if (error || !data || data.status !== 'connected') return null;
  const token = parseToken(data.encrypted_tokens);
  if (!token) {
    await context.client.from('provider_accounts').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('user_id', context.userId).eq('provider', provider);
    return null;
  }
  return token.accessToken;
}
