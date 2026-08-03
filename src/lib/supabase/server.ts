import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export async function createSupabaseServerClient() {
  const config = supabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; Proxy/Route Handlers can.
        }
      },
    },
  });
}

export async function getSupabaseIdentity() {
  const client = await createSupabaseServerClient();
  if (!client) return { configured: false as const, user: null };

  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return { configured: true as const, user: null };

  return {
    configured: true as const,
    user: {
      id: String(data.claims.sub),
      email: typeof data.claims.email === 'string' ? data.claims.email : null,
    },
  };
}
