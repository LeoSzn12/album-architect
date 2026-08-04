import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

/**
 * Service-role access is intentionally isolated to server-only route code.
 * Never expose SUPABASE_SERVICE_ROLE_KEY through a NEXT_PUBLIC variable.
 */
export function createSupabaseAdminClient() {
  const config = supabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) return null;

  return createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
