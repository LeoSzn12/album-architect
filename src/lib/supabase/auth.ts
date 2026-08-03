import type { Provider } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server';

export const SUPPORTED_AUTH_PROVIDERS: readonly Provider[] = ['google', 'github'];

export function isSupportedAuthProvider(value: string): value is Provider {
  return SUPPORTED_AUTH_PROVIDERS.includes(value as Provider);
}

export async function startSupabaseOAuth(provider: Provider, redirectTo: string) {
  const client = await createSupabaseServerClient();
  if (!client) return { url: null, error: 'Supabase Auth is not configured.' };

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  return { url: data.url ?? null, error: error?.message ?? null };
}
