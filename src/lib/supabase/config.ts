export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return url && publishableKey ? { url, publishableKey } : null;
}

export function isSupabaseConfigured() {
  return supabaseConfig() !== null;
}
